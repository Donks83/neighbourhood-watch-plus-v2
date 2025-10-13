# Visual Explanation: The Stale Closure Bug

## 🐛 THE BUG (Before Fix)

```
┌─────────────────────────────────────────────────────────────────┐
│ INITIAL RENDER (isWaitingForFootageLocation = false)           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  handleMapClick = () => {                                       │
│    if (isWaitingForFootageLocation) { // ← Captures FALSE      │
│      openFootageForm()                                          │
│    } else {                                                     │
│      openIncidentForm()  // ← Always executes                  │
│    }                                                            │
│  }                                                              │
│                                                                 │
│  ↓ Passed to Map component                                     │
│                                                                 │
│  Map initializes once with this callback ✓                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

        ↓ User clicks "I Have Footage" button

┌─────────────────────────────────────────────────────────────────┐
│ RE-RENDER (isWaitingForFootageLocation = true)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  NEW handleMapClick = () => {                                   │
│    if (isWaitingForFootageLocation) { // ← Now TRUE            │
│      openFootageForm()  // ← Should execute                    │
│    } else {                                                     │
│      openIncidentForm()                                         │
│    }                                                            │
│  }                                                              │
│                                                                 │
│  ❌ Map component DOES NOT receive this new callback           │
│  ❌ Map still uses OLD callback with isWaitingForFootageLocation = false │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

RESULT: Clicking map always opens incident form ❌
```

---

## ✅ THE FIX (After Fix)

```
┌─────────────────────────────────────────────────────────────────┐
│ INITIAL RENDER (isWaitingForFootageLocation = false)           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  handleMapClick = () => { ... }                                 │
│                                                                 │
│  ↓ Passed to Map component                                     │
│                                                                 │
│  onMapClickRef.current = handleMapClick  ← Stored in ref       │
│                                                                 │
│  Map event handler:                                             │
│    map.on('click', () => {                                      │
│      onMapClickRef.current(coords)  ← Calls ref                │
│    })                                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

        ↓ User clicks "I Have Footage" button

┌─────────────────────────────────────────────────────────────────┐
│ RE-RENDER (isWaitingForFootageLocation = true)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  NEW handleMapClick = () => {                                   │
│    if (isWaitingForFootageLocation) { // ← TRUE                │
│      openFootageForm()  // ← Will execute!                     │
│    } else {                                                     │
│      openIncidentForm()                                         │
│    }                                                            │
│  }                                                              │
│                                                                 │
│  useEffect runs:                                                │
│    onMapClickRef.current = NEW handleMapClick  ← Updated!      │
│                                                                 │
│  ✅ Map event handler now points to NEW callback               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

        ↓ User clicks on map

┌─────────────────────────────────────────────────────────────────┐
│ MAP CLICK EVENT                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  map.on('click', () => {                                        │
│    onMapClickRef.current(coords)  ← Calls LATEST callback      │
│  })                                                             │
│                                                                 │
│  Latest callback has isWaitingForFootageLocation = true ✓      │
│                                                                 │
│  ✅ Opens footage form!                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

RESULT: Clicking map opens correct form ✅
```

---

## 🔑 Key Concepts

### Closure
A function that "remembers" variables from its creation scope:
```javascript
let count = 0
const increment = () => { count++ }  // Closure over 'count'
count = 5
increment()  // Still uses original 'count'
```

### Stale Closure
When a closure captures outdated values:
```javascript
// BAD - Stale closure
useEffect(() => {
  element.addEventListener('click', () => {
    console.log(state)  // Captures state at effect creation
  })
}, [])  // No dependencies - never updates!

// GOOD - Always fresh
const stateRef = useRef(state)
useEffect(() => { stateRef.current = state }, [state])
useEffect(() => {
  element.addEventListener('click', () => {
    console.log(stateRef.current)  // Always current
  })
}, [])
```

### Why Refs Work
- Refs are **mutable containers** - changing `.current` doesn't trigger re-renders
- Refs are **stable** - the same ref object persists across renders
- Reading `ref.current` always gives the **latest value**

---

## 📐 Architecture Diagram

```
┌──────────────────────┐
│  Parent (page.tsx)   │
│                      │
│  [State]             │
│  isWaiting = false   │ ──┐
│                      │   │ Initial render
│  [Callback]          │   │
│  handleMapClick()    │ ──┤
│  {                   │   │
│    if (isWaiting)    │   │
│      openFootage()   │   │
│    else              │   │
│      openIncident()  │   │
│  }                   │   │
└──────────────────────┘   │
           │               │
           │ props         │
           ↓               │
┌──────────────────────┐   │
│  Map Component       │   │
│                      │   │
│  [Ref]               │   │
│  onMapClickRef ──────┼───┘ Stores callback
│                      │
│  [Effect]            │
│  onMapClickRef.current = onMapClick
│  ↑ Updates ref when callback changes
│                      │
│  [Event Handler]     │
│  map.on('click',     │
│    () => onMapClickRef.current(coords))
│  ↑ Always calls latest callback
│                      │
└──────────────────────┘

When state changes:
1. Parent re-renders with new state ✓
2. New handleMapClick created with new state ✓
3. Effect runs, updates ref ✓
4. Map handler calls ref.current ✓
5. Gets callback with current state ✓
```

---

## 🎯 Why Other Solutions Didn't Work

### ❌ Adding useCallback
```typescript
const handleMapClick = useCallback((coords) => {
  if (isWaitingForFootageLocation) { ... }
}, [isWaitingForFootageLocation])  // ← Recreates callback
```
**Problem**: Map would need to re-attach event listener = map re-initialization

### ❌ Adding dependency to map effect
```typescript
useEffect(() => {
  map.on('click', handleClick)
}, [onMapClick])  // ← Map re-initializes on every change
```
**Problem**: Causes unnecessary map re-initialization = performance issues

### ✅ Using Ref (Our Solution)
```typescript
const ref = useRef(callback)
useEffect(() => { ref.current = callback }, [callback])
// Event handler: ref.current()  ← Always fresh, no re-init
```
**Advantage**: Callback stays fresh, no map re-initialization!

---

**Visual Explanation Complete!**
