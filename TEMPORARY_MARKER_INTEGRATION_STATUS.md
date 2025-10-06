# Temporary Evidence Marker Integration - Remaining Steps

## ✅ COMPLETED:
1. ✅ Type definitions created (`src/types/temporary-evidence/index.ts`)
2. ✅ Firestore service created (`src/lib/temporary-evidence-service.ts`)
3. ✅ Registration component created (`src/components/temporary-evidence/temporary-marker-registration.tsx`)
4. ✅ State added to main page for temporary markers

## 📝 REMAINING EDITS NEEDED:

### 1. Add Import (Line ~8 in `src/app/page.tsx`)
After: `import CameraRegistrationDashboard from '@/components/map/camera-registration-dashboard'`
Add: `import TemporaryMarkerRegistration from '@/components/temporary-evidence/temporary-marker-registration'`

### 2. Add Temporary Marker Submit Handler (After line ~155)
```typescript
// Handle temporary marker submission
const handleTemporaryMarkerSubmit = async (data: any) => {
  if (!user || !userProfile) return
  
  setIsSubmittingTemporaryMarker(true)
  try {
    const { TemporaryMarkerService } = await import('@/lib/temporary-evidence-service')
    
    const markerId = await TemporaryMarkerService.createTemporaryMarker(
      user.uid,
      user.email!,
      {
        location: data.location,
        recordedAt: data.recordedAt,
        deviceType: data.deviceType,
        deviceDescription: data.deviceDescription,
        incidentDescription: data.incidentDescription,
        ownerPhone: data.ownerPhone,
        previewImage: data.previewImage
      }
    )
    
    console.log(`✅ Temporary marker created: ${markerId}`)
    alert('✅ Footage registered! You\'ll be notified if someone needs it.')
    setIsTemporaryMarkerFormOpen(false)
    setTemporaryMarkerLocation(null)
  } catch (error: any) {
    console.error('❌ Error creating temporary marker:', error)
    alert('Failed to register footage. Please try again.')
  } finally {
    setIsSubmittingTemporaryMarker(false)
  }
}

// Handle opening temporary marker form
const handleOpenTemporaryMarkerForm = (coords: Location) => {
  setTemporaryMarkerLocation(coords)
  setIsTemporaryMarkerFormOpen(true)
}
```

### 3. Add "I Have Footage" Button (After line ~420, next to the Report Incident button)
```tsx
{/* I Have Footage Button - Temporary Evidence Marker */}
<div className="absolute bottom-24 right-6 z-[1000]">
  <Button
    size="lg"
    className={cn(
      "rounded-full shadow-lg hover:shadow-xl transition-all duration-200",
      "bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-6"
    )}
    onClick={() => {
      if (!user) {
        setIsAuthDialogOpen(true)
      } else {
        // Open map click mode for selecting location
        alert('Click on the map where you recorded the incident')
        // You could also add a custom map click handler
      }
    }}
  >
    <CameraIcon className="w-5 h-5" />
    <span className="text-sm font-medium">I Have Footage</span>
  </Button>
</div>
```

### 4. Add Temporary Marker Component (After line ~515, after RequestManagement)
```tsx
{/* Temporary Evidence Marker Registration */}
{user && temporaryMarkerLocation && (
  <TemporaryMarkerRegistration
    isOpen={isTemporaryMarkerFormOpen}
    onClose={() => {
      setIsTemporaryMarkerFormOpen(false)
      setTemporaryMarkerLocation(null)
    }}
    location={temporaryMarkerLocation}
    onSubmit={handleTemporaryMarkerSubmit}
    isSubmitting={isSubmittingTemporaryMarker}
  />
)}
```

### 5. Update Map Click Handler to Support Both Modes
Replace the existing `handleMapClick` function (around line ~95):
```typescript
// Handle map clicks for incident reporting OR temporary markers
const handleMapClick = useCallback((coords: Location, screenPosition?: { x: number; y: number }) => {
  if (!user) {
    setIsAuthDialogOpen(true)
    return
  }
  
  // Show modal to choose action
  const choice = window.confirm('Click OK to report an incident, or Cancel to register footage you captured')
  
  if (choice) {
    // Report incident
    setSelectedLocation(coords)
    setIsReportFormOpen(true)
  } else {
    // Register temporary marker
    handleOpenTemporaryMarkerForm(coords)
  }
}, [user])
```

## 🚀 TO COMPLETE THE INTEGRATION:

Would you like me to:
1. Make these exact edits to `src/app/page.tsx`?
2. Update the evidence request matching to include temporary markers?
3. Add the 2km geographic validation for permanent cameras?

Just confirm and I'll complete all the remaining integration steps!
