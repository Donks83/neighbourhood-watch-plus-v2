# HANDOFF PROMPT - Neighbourhood Watch+ Address Collection UI Implementation

## IMMEDIATE CONTEXT
I'm continuing development of the privacy-first community security camera sharing platform. We have completed MAJOR infrastructure work and need to implement the frontend UI components for user address collection.

## CURRENT STATUS (DETAILED)
- **Project**: Neighbourhood Watch+ (Next.js 14 + Firebase + MapLibre + Geocoding)
- **Phase**: Address collection UI implementation (frontend components)
- **Progress**: Backend infrastructure 100% complete, UI components needed

## MAJOR ACCOMPLISHMENTS THIS SESSION

### ✅ CRITICAL FIXES COMPLETED
1. **Fixed fuzzy location radius** - Now 25m radius (50m diameter) for better privacy
2. **Fixed camera management UI issues**:
   - Eye icon: Now toggles camera visibility with loading states
   - Edit button: Connected (placeholder implemented)
   - Delete button: Enhanced with loading spinners + success feedback + auto-refresh
3. **Fixed community heatmap isolation** - All users now see community-wide camera density
4. **Enhanced camera placement workflow** - Blue pin visibility and save functionality verified

### ✅ NEW INFRASTRUCTURE COMPLETED
5. **Complete geocoding system** - MapTiler Geocoding API integration
6. **User address infrastructure** - Types, validation, formatting utilities
7. **Auth context with address methods** - Registration and profile updates with geocoding
8. **Database schema updates** - UserProfile with UserAddress fields

## 🎯 IMMEDIATE TASKS (Next Session Priority)

### **Task 1: Address Collection Form Component**
**File to create**: `src/components/auth/address-collection-form.tsx`
**Requirements**:
- Form with fields: street, city, postcode, country
- UK postcode validation using existing `validateUKPostcode()` function
- Real-time address validation with error display
- Integration with `geocodeAddress()` for coordinate lookup
- Loading states during geocoding
- Success/error feedback

**Key Dependencies** (already implemented):
```typescript
import { validateAddress, formatAddressForGeocoding, geocodeAddress } from '@/lib/geocoding'
import type { UserAddress } from '@/types/camera'
```

### **Task 2: Update Registration Dialog**
**File to modify**: `src/components/auth/auth-dialog.tsx`
**Requirements**:
- Add address collection step in registration flow
- Optional during registration (can be completed later)
- Use AddressCollectionForm component
- Pass address data to signUp() method
- Handle geocoding errors gracefully

**Auth context method ready**:
```typescript
signUp: (email: string, password: string, displayName?: string, address?: Partial<UserAddress>) => Promise<User>
```

### **Task 3: Property Dashboard Address Integration**
**File to modify**: `src/components/map/camera-registration-dashboard.tsx`
**Requirements**:
- Use user's address coordinates for map centering instead of GPS/default
- Display user address in dashboard header/info section
- Add "Update Address" button if no address set
- Show address verification status

**Available from auth context**:
```typescript
const { userProfile, updateUserAddress } = useAuth()
// userProfile.address?.coordinates for map centering
```

### **Task 4: Basic Location Search Component**
**File to create**: `src/components/map/location-search.tsx`
**Requirements**:
- Search input with autocomplete dropdown
- Integration with geocodeAddress() function
- Search results list with click-to-select
- Map navigation on selection
- Search history/favorites (optional)

## 🔧 TECHNICAL IMPLEMENTATION DETAILS

### Ready-to-Use Utilities
All geocoding infrastructure is complete and ready:

```typescript
// Address validation
const validation = validateAddress(address)
if (!validation.isValid) {
  // Show validation.errors array
}

// Geocoding
const coordinates = await geocodeAddress(addressString)
if (coordinates) {
  // Use coordinates for map centering
}

// Auth integration
await updateUserAddress(addressData) // Handles validation + geocoding + Firestore save
```

### Form Component Pattern
Use existing shadcn/ui patterns from project:
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
```

### Error Handling Pattern
Follow established project patterns:
```typescript
const [isSubmitting, setIsSubmitting] = useState(false)
const [error, setError] = useState<string | null>(null)

try {
  setIsSubmitting(true)
  setError(null)
  // API call
} catch (error: any) {
  setError(error.message)
} finally {
  setIsSubmitting(false)
}
```

## 📋 USER EXPERIENCE REQUIREMENTS

### Address Collection Flow
1. **Registration**: Optional address collection (can skip, add later)
2. **Property Dashboard**: Prompt to add address if missing
3. **Address Form**: Clear validation, real-time feedback
4. **Geocoding**: Loading states, error handling for invalid addresses
5. **Verification**: Visual indication of address status

### Map Integration
1. **Property Dashboard**: Center map on user's address coordinates
2. **Location Search**: Search box on main community map
3. **Address Display**: Show formatted address in user profile areas

## 🚨 TESTING PRIORITIES

### Address Collection Testing
1. **Valid UK postcodes** - Should geocode successfully
2. **Invalid addresses** - Should show validation errors
3. **Geocoding failures** - Should handle API errors gracefully
4. **Property dashboard** - Should center on user's address
5. **Multi-account testing** - Address isolation verified

### Form Validation Testing
```typescript
// Test cases ready:
validateUKPostcode('SW1A 1AA') // true
validateUKPostcode('INVALID') // false
validateAddress({ street: '', city: '', postcode: '', country: '' }) // errors array
```

## 🔄 ESTABLISHED PATTERNS TO FOLLOW

### Component Structure
- Use `'use client'` directive
- Follow established TypeScript patterns
- Use shadcn/ui components consistently
- Implement proper loading states
- Add comprehensive error handling

### Styling
- Follow Tailwind + shadcn/ui patterns
- Responsive design (mobile-first)
- Dark mode compatibility
- Consistent with existing dashboard styling

### State Management
- Use React hooks (useState, useEffect, useCallback)
- useRef for stable references when needed
- Proper dependency arrays to prevent infinite loops

## 🏁 SUCCESS CRITERIA

### Functional Requirements
- [ ] User can add address during registration (optional)
- [ ] User can update address in profile/dashboard
- [ ] Property dashboard centers on user's address
- [ ] Address validation works with clear error messages
- [ ] Geocoding integrates seamlessly with loading states
- [ ] Location search works on main map

### Technical Requirements
- [ ] Forms integrate with existing auth context
- [ ] Address data persists to Firestore correctly
- [ ] Map centering updates when address changes
- [ ] Error handling follows project patterns
- [ ] Loading states provide good UX

## 📚 KEY FILES AND LOCATIONS

### Files to Create:
- `src/components/auth/address-collection-form.tsx`
- `src/components/map/location-search.tsx`

### Files to Modify:
- `src/components/auth/auth-dialog.tsx` (add address step)
- `src/components/map/camera-registration-dashboard.tsx` (address integration)
- `src/app/page.tsx` (add location search)

### Ready Infrastructure:
- ✅ `src/lib/geocoding.ts` (complete geocoding utilities)
- ✅ `src/types/camera.ts` (UserAddress and UserProfile types)
- ✅ `src/contexts/auth-context.tsx` (updated with address methods)

---

## 🚨 CRITICAL TOKEN LIMIT INSTRUCTIONS

**When approaching token limits in future sessions:**

1. **Update PROJECT_SPECIFICATION.md** with latest progress and status
2. **Rewrite this HANDOFF_PROMPT.md** with:
   - Current implementation status
   - Next immediate tasks
   - Technical details and patterns established
   - Files created/modified
   - Testing requirements
3. **Include these instructions** in the new handoff prompt

**Pattern for handoff documentation:**
- Focus on immediate next steps (1-3 tasks max)
- Include all technical implementation details
- Preserve established patterns and utilities
- Maintain testing and success criteria
- Document any new infrastructure created

---

**Status**: Ready to implement address collection UI components using complete backend infrastructure
**Next Priority**: Create AddressCollectionForm component with validation and geocoding integration
**Expected Duration**: 1-2 focused implementation sessions for complete address functionality
