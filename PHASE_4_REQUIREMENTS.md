# Phase 4: Platform Enhancement Requirements

**Created:** January 25, 2026  
**Status:** Planning & Prioritization

---

## 🔴 CRITICAL BUGS (Fix Immediately)

### 1. Request Footage Button Not Working
**Problem:** Button is greyed out and won't click  
**Root Cause:** Form validation failing due to Date/String mismatch in `incidentDateTime` field
- Zod schema expects: `string`
- Default value is: `new Date()` (Date object)
- Quick time buttons set: Date objects

**Fix Required:**
```typescript
// File: src/components/map/incident-report-panel.tsx
// Change line 66 from:
incidentDateTime: new Date()
// To:
incidentDateTime: new Date().toISOString()

// Update all setValue calls from:
setValue('incidentDateTime', now)
// To:
setValue('incidentDateTime', now.toISOString())
```

**Impact:** Users cannot submit footage requests - blocking core functionality  
**Priority:** IMMEDIATE

---

### 2. Firestore Permission Error - Global Heatmap
**Problem:** Console error: `Missing or insufficient permissions` when loading community cameras  
**Root Cause:** Query requires composite index for 3 conditions:
- `status == 'active'`
- `privacySettings.shareWithCommunity == true`
- `verification.status == 'approved'`

**Fix Required:**
1. Go to Firebase Console → Firestore → Indexes
2. Create composite index with these fields:
   - Collection: `cameras`
   - Fields: `status` (Ascending), `privacySettings.shareWithCommunity` (Ascending), `verification.status` (Ascending)
   
**OR**

Simplify query in `src/lib/firestore.ts` line 548 to use only 2 conditions (which don't require composite index)

**Impact:** Hexagonal heatmap not loading for community users  
**Priority:** HIGH

---

### 3. Panel Extending Browser Screen
**Problem:** Incident report panel extends beyond viewport  
**Root Cause:** Fixed height calculation issue

**Fix Required:**
Review CSS in `src/components/map/incident-report-panel.tsx`:
- Check max-height calculations
- Ensure proper overflow handling
- Test on different screen sizes

**Priority:** MEDIUM

---

## 🟡 HIGH PRIORITY FEATURES

### 4. Enhanced Super Admin Controls

#### A. User Management Enhancements
Add to `/super-admin` page:

**Ban/Suspend Users:**
```typescript
interface UserStatus {
  banned: boolean
  bannedReason?: string
  bannedAt?: Timestamp
  bannedBy?: string  // admin UID
  suspended: boolean
  suspendedUntil?: Timestamp
}
```

**Features:**
- Ban user (permanent block)
- Suspend user (temporary block with expiry date)
- Block email addresses (prevent re-registration)
- View banned/suspended user list
- Unban/unsuspend functionality
- Audit trail of all actions

#### B. Inactive Account Cleanup (GDPR Compliance)
```typescript
// Criteria for inactive accounts
- No login for 12+ months
- No cameras registered
- No active footage requests

// Deletion process
1. Identify inactive accounts
2. Send email notification (30 days warning)
3. Auto-delete if no response
4. Remove all data:
   - User profile
   - Cameras
   - Footage requests
   - Notifications
   - Verification queue entries
```

**Features:**
- List inactive accounts with last login date
- Bulk delete with confirmation
- Export data before deletion (GDPR right to data)
- Deletion audit log

#### C. Email Blocking
```typescript
// Collection: blockedEmails
interface BlockedEmail {
  email: string
  reason: string
  blockedAt: Timestamp
  blockedBy: string  // admin UID
}
```

**Features:**
- Add email to blocklist
- Prevent registration with blocked emails
- View/manage blocklist
- Bulk import from CSV

---

### 5. User Self-Account Deletion

**Location:** Add to user profile/settings page

**Flow:**
1. User clicks "Delete My Account"
2. Show warning dialog with consequences:
   - All cameras will be removed
   - All footage requests will be cancelled
   - Account cannot be recovered
3. Require password confirmation
4. Optional: "Why are you leaving?" feedback form
5. Delete all user data:
   - User profile (`users/{uid}`)
   - All cameras (`cameras` where `userId == uid`)
   - All footage requests (both made and received)
   - Notifications
   - Role data (`user_roles/{uid}`)
6. Sign out and redirect to homepage
7. Show confirmation message

**IMPORTANT:** Firebase Auth account deletion requires Admin SDK (server-side)
- For now: Just delete Firestore data
- Future: Implement Cloud Function to delete Auth account

**Files to Create:**
- `src/components/profile/delete-account-dialog.tsx`
- `src/lib/account-deletion.ts`

---

### 6. Camera Brand Selection

**Add to camera registration form:**

```typescript
interface RegisteredCamera {
  // ... existing fields
  brand?: string
  model?: string
  manualUrl?: string  // Link to PDF manual (future)
}

// Popular UK CCTV Brands (to populate dropdown)
const CAMERA_BRANDS = [
  // Major Global Brands
  'Hikvision',
  'Dahua',
  'Axis Communications',
  'Bosch Security',
  'Hanwha (Samsung)',
  
  // UK/European Brands
  'Swann',
  'Yale',
  'Ring',
  'Arlo',
  'Nest (Google)',
  'Eufy (Anker)',
  'Reolink',
  
  // Budget/AliExpress Brands
  'Tapo (TP-Link)',
  'EZVIZ',
  'Foscam',
  'Annke',
  'Zosi',
  'Smonet',
  'Hiseeu',
  'Sricam',
  'Wansview',
  'Victure',
  
  // Other/Generic
  'Other (Please specify)'
]
```

**Implementation:**
1. Add dropdown to camera registration form
2. Make it optional (not required)
3. Track brand usage in analytics
4. Future: Link to manuals database
5. Display brand on camera details in "My Property" page

**Future Enhancement (Phase 5):**
- Build manuals database
- Auto-suggest manual based on brand/model
- Display manuals in user's property page under "My Camera Manuals"

---

### 7. Incident Reference Number Field

**Add to incident report form:**

```typescript
interface IncidentFormData {
  // ... existing fields
  policeReferenceNumber?: string
  insuranceClaimNumber?: string
}
```

**UI Design:**
```
Optional: Incident Reference Information
┌────────────────────────────────────────┐
│ Police Report Number (optional)        │
│ ┌────────────────────────────────────┐ │
│ │                                    │ │
│ └────────────────────────────────────┘ │
│                                        │
│ Insurance Claim Number (optional)      │
│ ┌────────────────────────────────────┐ │
│ │                                    │ │
│ └────────────────────────────────────┘ │
│                                        │
│ ℹ️ Having an official reference helps  │
│   camera owners verify the legitimacy  │
│   of your request                      │
└────────────────────────────────────────┘
```

**Benefits:**
- Adds legitimacy to requests
- Helps camera owners verify authenticity
- Useful for insurance claims
- Not mandatory - respects privacy

**Display:**
- Show reference numbers in footage request details
- Hide from public view (only visible to request parties)

---

### 8. Camera Management in Verification Tab

**Current State:** Admin verification tab only shows pending verifications  
**Requested:** Full camera management like user management tab

**Features to Add:**
- View ALL cameras (not just pending)
- Filter by: status, verification status, owner, brand
- Search by: camera name, owner email
- Bulk actions:
  - Approve multiple cameras
  - Reject multiple cameras
  - Delete multiple cameras
- Individual actions:
  - Edit camera details
  - Change verification status
  - View owner information
  - Delete camera
- Export camera list to CSV

**UI Layout:**
```
┌─────────────────────────────────────────────────────┐
│ Camera Management                                   │
├─────────────────────────────────────────────────────┤
│ [Search]  [Status: All ▼]  [Verified: All ▼]       │
│ [Owner: All ▼]  [Brand: All ▼]  [Export CSV]       │
├─────────────────────────────────────────────────────┤
│ ☐ Select All    [Approve Selected]  [Reject]       │
├─────────────────────────────────────────────────────┤
│ ☐ Camera 1 | Owner | Status | Verified | Actions   │
│ ☐ Camera 2 | Owner | Status | Verified | Actions   │
│ ☐ Camera 3 | Owner | Status | Verified | Actions   │
└─────────────────────────────────────────────────────┘
```

---

## 🟢 MEDIUM PRIORITY

### 9. Legal Document Updates

All three documents need professional legal review and updates:

#### A. Privacy Policy
**File:** `src/app/privacy/page.tsx`

**Key Updates Needed:**
1. **Camera Location Data:**
   - Exact locations stored for owners only
   - Fuzzy locations (25m radius) shown to community
   - Approximate density data shared with police forces
   - No exact locations shared with anyone except owner

2. **Data Retention:**
   - How long camera data is stored
   - Inactive account cleanup policy (12 months)
   - User's right to deletion

3. **Third-Party Sharing:**
   - Police: Approximate density data only (no exact locations)
   - Insurance: Footage metadata for claims (with consent)
   - No selling of data to advertisers

4. **GDPR Compliance:**
   - Right to access data
   - Right to deletion
   - Right to data portability
   - Consent management

#### B. Terms of Service
**File:** `src/app/terms/page.tsx`

**Key Updates Needed:**
1. **User Responsibilities:**
   - Users must comply with UK CCTV laws
   - Users responsible for footage legality
   - Users liable for false reports
   - Users must not abuse request system

2. **Platform Limitations:**
   - Platform is a facilitator, not guarantor
   - No guarantee of footage availability
   - No liability for camera offline status
   - Rate limits to prevent abuse

3. **Liability Disclaimers:**
   ```
   "Users upload footage at their own discretion and are 
   responsible for ensuring their uploads comply with data 
   protection regulations. Neighbourhood Watch+ is not liable 
   for inappropriate uploads or violations of privacy law."
   ```

4. **Termination Clauses:**
   - Grounds for account termination
   - Ban/suspension procedures
   - Appeal process

#### C. Community Guidelines
**File:** `src/app/guidelines/page.tsx`

**Key Updates Needed:**
1. **Acceptable Use:**
   - Report genuine security incidents only
   - No requests for civil disputes
   - No harassment or stalking
   - Respect privacy of neighbors

2. **Camera Positioning:**
   - Must comply with ICO guidelines
   - Cannot point at neighbor's private areas
   - Clear signage if covering public areas
   - Privacy impact assessments for large deployments

3. **Footage Sharing:**
   - Only share relevant time periods
   - Blur faces/plates if sharing publicly
   - Don't share footage on social media without consent
   - Cooperate with police investigations

---

### 10. Liability Disclaimer for Footage Uploads

**Add to footage upload flow:**

```typescript
// Before user uploads footage
<AlertDialog>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Footage Upload Disclaimer</AlertDialogTitle>
      <AlertDialogDescription>
        By uploading this footage, you confirm that:
        
        • You are the legitimate owner/operator of this camera
        • The footage was captured lawfully and complies with UK data protection laws
        • You have reviewed the footage and believe it is relevant to this request
        • You understand you are responsible for ensuring this upload complies 
          with GDPR and data protection regulations
        • Neighbourhood Watch+ acts only as a facilitator and is not liable 
          for the content of uploaded footage
        
        Failure to comply may result in account suspension or legal action.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction>I Understand & Agree</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Implementation:**
- Show ONCE per user (store `agreedToUploadTerms: boolean`)
- Can be shown again if T&Cs updated
- Log agreement timestamp for audit trail

---

## 🔵 FUTURE FEATURES (Phase 5+)

### 11. Camera Support Section

**New Route:** `/support/cameras`

**Sections:**

#### A. Installation Manuals
```
Browse by Brand:
- Hikvision
- Dahua
- Ring
- Arlo
...
[Each brand page shows]:
- PDF manuals (user-uploaded or sourced)
- Installation guides
- Configuration tutorials
- Troubleshooting tips
```

#### B. Best Practices
- Camera positioning for maximum coverage
- Height recommendations (2-3 meters)
- Angle optimization (30-45 degrees)
- Avoiding backlighting issues
- Night vision setup

#### C. Legal Obligations (UK CCTV Laws)
- ICO guidelines compliance
- When signage is required
- Privacy impact assessments
- Data protection considerations
- Recording audio (special rules)
- Retention periods

#### D. Coverage Optimization
- Overlapping camera placement
- Eliminating blind spots
- Motion detection zones
- Recording schedules

#### E. Interactive Tools
- Coverage calculator (input property size, get camera recommendations)
- Positioning simulator (drag cameras on floor plan)
- Angle visualizer (see camera field of view)

**Content Sources:**
- Partner with CCTV manufacturers for official manuals
- User-contributed guides (moderated)
- Professional installation companies (sponsored content?)
- ICO official guidance documents

---

## 📊 Implementation Priority

### Sprint 1 (Immediate - 1-2 days)
1. Fix Request Footage button (Date/String bug)
2. Create Firestore composite index for heatmap
3. Fix panel overflow issue

### Sprint 2 (Week 1)
4. Add camera brand dropdown
5. Add incident reference number fields
6. Enhance camera verification tab

### Sprint 3 (Week 2)
7. Super admin user controls (ban/suspend)
8. User self-account deletion
9. Inactive account cleanup

### Sprint 4 (Week 3-4)
10. Legal document updates (get lawyer review)
11. Footage upload disclaimer
12. Email blocking system

### Sprint 5+ (Future)
13. Camera support section
14. Manual database
15. Interactive tools

---

## 🎯 Success Metrics

**For Each Feature:**
- User adoption rate
- Support ticket reduction
- Time saved for admins
- Legal compliance score
- User satisfaction (surveys)

**Platform Health:**
- Active user retention
- Camera registration rate
- Request success rate
- Average response time

---

## 📝 Notes

- All features require testing before deployment
- Legal documents MUST be reviewed by qualified lawyer
- GDPR compliance is non-negotiable
- User privacy remains #1 priority
- Get user feedback via beta testing group

---

**Next Steps:**
1. Review and prioritize this list
2. Create detailed implementation specs for Sprint 1
3. Set up beta testing group
4. Contact lawyer for legal review
5. Begin Sprint 1 development
