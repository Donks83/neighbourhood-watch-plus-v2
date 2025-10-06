# 🏠 NEIGHBOURHOOD WATCH+ V2 - ADDRESS COLLECTION SYSTEM IMPLEMENTATION

## 📋 **IMMEDIATE CONTEXT**
I'm continuing development of the **Neighbourhood Watch+ V2** privacy-first community security camera footage sharing platform. We've completed the core functionality and are now implementing the **User Address Collection System** - Priority 1 of remaining features.

## 🎯 **PROJECT STATUS (September 2025)**
- **Location**: `C:\Claude\neighbourhood-watch-plus-v2`
- **Tech Stack**: Next.js 14 + Firebase + MapLibre GL + TypeScript + Tailwind + shadcn/ui
- **Overall Progress**: ~85% Complete - **Core System Fully Working!**
- **Current Phase**: Frontend UI implementation for address collection

## ✅ **COMPLETED FEATURES (FULLY WORKING)**

### **🔥 Core System is LIVE:**
1. **Complete Footage Request Workflow** ✅
   - Report incidents with improved date/time selection
   - Automatic camera discovery within radius
   - Real-time notifications with badge counts
   - Approve/deny/no-footage response system
   - Request status tracking for both parties
   - Cancel active requests functionality

2. **File Upload & Viewing System** ✅
   - Upload videos/images up to 500MB via Firebase Storage
   - Professional FootageViewer component with thumbnails
   - Full-screen viewing and download functionality
   - Evidence handling warnings and security

3. **Map & Location System** ✅
   - Maps auto-focus on user address/searched locations
   - Location search with UK postcode support
   - Fuzzy location privacy (25m radius, 50m diameter)
   - Community-wide camera heatmap with privacy protection
   - Smooth camera placement and management

4. **Authentication & Privacy** ✅
   - Firebase Authentication with protected routes
   - Privacy-first design with opt-in sharing
   - Trust scoring and community participation metrics
   - Comprehensive camera management UI (toggle, edit, delete)

5. **Fixed Issues** ✅
   - "Invalid Date" errors resolved with robust timestamp handling
   - Camera registration and deletion with real-time updates
   - Request management with proper validation

### **🔧 Backend Infrastructure COMPLETE:**
- **UserAddress & UserProfile types** - Fully defined in `/types/camera.ts`
- **Geocoding system** - Complete MapTiler integration in `/lib/geocoding.ts`
- **Address validation** - UK postcode validation and formatting utilities
- **Auth context with address methods** - `/contexts/auth-context.tsx` updated
- **Firestore schema** - UserProfile with UserAddress fields configured

## 🎯 **IMMEDIATE TASK: User Address Collection Frontend UI**

### **GOAL:** 
Implement frontend components for user address collection using the complete backend infrastructure that's already built and tested.

### **WHAT NEEDS TO BE CREATED:**

#### **1. Address Collection Form Component** 📝
**File to CREATE**: `src/components/auth/address-collection-form.tsx`

**Requirements:**
- Form fields: `street`, `city`, `postcode`, `country` (defaulting to UK)
- **Real-time UK postcode validation** using existing `validateUKPostcode()` function
- **Address validation** with error display using `validateAddress()` 
- **Geocoding integration** with `geocodeAddress()` for coordinate lookup
- Loading states during geocoding with spinner
- Success/error feedback with proper error handling
- **Form styling** consistent with existing shadcn/ui patterns

**Ready-to-use utilities:**
```typescript
import { validateAddress, formatAddressForGeocoding, geocodeAddress, validateUKPostcode } from '@/lib/geocoding'
import type { UserAddress } from '@/types/camera'
import { useAuth } from '@/contexts/auth-context'

// Available methods:
const validation = validateAddress(address) // Returns {isValid: boolean, errors: string[]}
const isValidPostcode = validateUKPostcode(postcode) // Returns boolean
const coordinates = await geocodeAddress(addressString) // Returns {lat, lng} or null
const { updateUserAddress } = useAuth() // Ready method for saving
```

#### **2. Registration Dialog Integration** 🔐
**File to MODIFY**: `src/components/auth/auth-dialog.tsx`

**Requirements:**
- Add **optional address collection step** in registration flow
- Users can skip during registration and add later
- Integrate AddressCollectionForm component
- Pass address data to existing `signUp()` method
- Handle geocoding errors gracefully with fallback

**Available auth method:**
```typescript
signUp: (email: string, password: string, displayName?: string, address?: Partial<UserAddress>) => Promise<User>
```

#### **3. Property Dashboard Address Integration** 🏡
**File to MODIFY**: `src/components/map/camera-registration-dashboard.tsx`

**Requirements:**
- **Map centering**: Use user's address coordinates instead of GPS/default location
- **Address display**: Show user's address in dashboard header/info section
- **"Update Address" button**: If no address is set, show prompt to add one
- **Address verification status**: Visual indicator of verification status
- **Responsive design**: Ensure mobile compatibility

**Available from auth context:**
```typescript
const { userProfile, updateUserAddress } = useAuth()
// userProfile.address?.coordinates for map centering
// userProfile.address?.isVerified for verification status
```

#### **4. Main Map Location Search Enhancement** 🗺️
**File to MODIFY**: `src/app/page.tsx`
**Component to CREATE**: `src/components/map/location-search.tsx`

**Requirements:**
- Search input with autocomplete dropdown on main community map
- Integration with existing `geocodeAddress()` function
- Search results list with click-to-navigate functionality
- Map centering animation on selection
- Search history/favorites (localStorage - optional)

## 🔧 **TECHNICAL IMPLEMENTATION PATTERNS**

### **Form Component Structure:**
```typescript
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { validateAddress, geocodeAddress, validateUKPostcode } from '@/lib/geocoding'
import type { UserAddress } from '@/types/camera'

const AddressSchema = z.object({
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  postcode: z.string().refine(validateUKPostcode, 'Please enter a valid UK postcode'),
  country: z.string().default('United Kingdom')
})

export function AddressCollectionForm({ onSuccess, onSkip, isOptional = false }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { updateUserAddress } = useAuth()

  // Implementation using established patterns...
}
```

### **Error Handling Pattern:**
```typescript
try {
  setIsSubmitting(true)
  setError(null)
  
  // Validate address
  const validation = validateAddress(formData)
  if (!validation.isValid) {
    setError(validation.errors.join(', '))
    return
  }

  // Geocode address
  const coordinates = await geocodeAddress(formattedAddress)
  if (!coordinates) {
    setError('Unable to find address. Please check and try again.')
    return
  }

  // Save to Firebase
  await updateUserAddress({ ...formData, coordinates })
  onSuccess?.()

} catch (error: any) {
  setError(error.message || 'Failed to save address')
} finally {
  setIsSubmitting(false)
}
```

### **Styling Consistency:**
- Follow existing **Tailwind + shadcn/ui** patterns from project
- **Responsive design** with mobile-first approach
- **Dark mode compatibility** (project supports both themes)
- **Loading states** with proper spinner placement
- **Error styling** with red borders and alert messages

## 🧪 **TESTING REQUIREMENTS**

### **Address Collection Testing:**
1. **Valid UK postcodes** - Should geocode successfully
   - Test: `'SW1A 1AA'`, `'M1 1AA'`, `'W1A 0AX'`
2. **Invalid addresses** - Should show validation errors
   - Test: Empty fields, invalid postcode format
3. **Geocoding failures** - Should handle API errors gracefully
   - Test: Non-existent addresses
4. **Form submission** - Should save to Firestore and update auth context
5. **Property dashboard** - Should center map on user's address after setting

### **Integration Testing:**
- Registration flow with address collection (optional step)
- Property dashboard map centering on user address
- Address updates reflecting in real-time
- Multi-user testing to ensure address isolation

## 📁 **KEY FILES & LOCATIONS**

### **Files to CREATE:**
- `src/components/auth/address-collection-form.tsx` (Priority 1)
- `src/components/map/location-search.tsx` (Priority 2)

### **Files to MODIFY:**
- `src/components/auth/auth-dialog.tsx` (add address step)
- `src/components/map/camera-registration-dashboard.tsx` (address integration)
- `src/app/page.tsx` (add location search - optional)

### **Ready Infrastructure (DO NOT MODIFY):**
- ✅ `src/lib/geocoding.ts` (complete geocoding utilities)
- ✅ `src/types/camera.ts` (UserAddress and UserProfile types)
- ✅ `src/contexts/auth-context.tsx` (updated with address methods)
- ✅ Firebase Firestore configured with proper indexes

## 🎯 **SUCCESS CRITERIA**

### **Functional Requirements:**
- [ ] User can add address during registration (optional step)
- [ ] User can update address from property dashboard
- [ ] Property dashboard centers map on user's address coordinates
- [ ] Address validation shows clear error messages for invalid input
- [ ] Geocoding integrates with loading states and error handling
- [ ] All forms follow existing project styling patterns

### **Technical Requirements:**
- [ ] Forms integrate seamlessly with existing auth context
- [ ] Address data persists correctly to Firestore
- [ ] Map centering updates immediately when address changes
- [ ] Error handling follows established project patterns
- [ ] Loading states provide excellent user experience
- [ ] Mobile responsive on all screen sizes

## 🚨 **DEVELOPMENT NOTES**

### **Existing Project Patterns to Follow:**
- Use `'use client'` directive for interactive components
- Follow TypeScript patterns with proper type definitions
- Use established shadcn/ui components (Button, Input, Label, Alert)
- Implement comprehensive error handling with try/catch
- Use `useRef` for stable references when needed
- Proper dependency arrays to prevent infinite loops

### **MapTiler Geocoding API:**
- API key configured in environment variables
- Rate limits: 100,000 requests/month on free tier
- UK-optimized with postcode support
- Returns `{lat, lng}` coordinates for map centering

## 🏁 **IMMEDIATE START INSTRUCTIONS**

1. **Begin with**: Create `src/components/auth/address-collection-form.tsx`
2. **Use existing utilities**: Import from `/lib/geocoding.ts`
3. **Follow patterns**: Look at existing form components in project
4. **Test thoroughly**: UK postcodes and geocoding integration
5. **Integrate step-by-step**: Form → Registration → Dashboard → Search

---

## ⚡ **READY TO START!**

The backend infrastructure is **100% complete and tested**. All geocoding utilities, validation functions, and auth methods are ready. This is purely a **frontend UI implementation task** using existing, working infrastructure.

**Estimated time**: 2-3 focused sessions to complete all address collection features.

**Start with**: `AddressCollectionForm` component - the foundation for everything else.

---

**Status**: ✅ Ready to implement Priority 1 - User Address Collection System Frontend UI
**Next Priority After Completion**: Camera Verification System (Priority 2)
