# 🧪 Quick Testing Guide - Temporary Evidence Markers

## 🎯 Quick 5-Minute Test

### Test 1: Register Temporary Marker (2 mins)
1. **Start the app**: `npm run dev`
2. **Log in** to your account
3. Click the **blue "I Have Footage"** button (bottom right)
4. Click **anywhere on the map** where you "recorded" an incident
5. **Fill out the form**:
   - Device: Select "Mobile Phone"
   - Date/Time: Select today, 2 hours ago
   - Description: "Test footage from my iPhone"
   - Incident: "Car accident at intersection"
   - Preview: (optional) Upload a test image
   - Phone: (optional) Enter a phone number
6. Click **"Register Footage"**
7. **Expected Result**: 
   - ✅ Success message: "Footage registered! You'll be notified if someone needs it. Active for 14 days."
   - Form closes
   - Check browser console for: "✅ Temporary marker created: [marker-id]"

### Test 2: Create Evidence Request & Match (2 mins)
1. Stay logged in (or log in as different user for realistic test)
2. Click the **red circular button** (Report Incident)
3. Click **same/nearby location** on map
4. **Fill out incident report**:
   - Type: "Vehicle Accident"
   - Date/Time: Same as temporary marker (or within 24 hours)
   - Description: "Need footage of accident"
   - Radius: 200m (or adjust to cover marker location)
5. Click **"Submit Request"**
6. **Expected Results**:
   - ✅ Success message showing number of cameras/markers notified
   - Check browser console for: "🎯 Found X permanent cameras + 1 temporary markers"
   - Check "Requests" button (bell icon) - should show notification badge

### Test 3: View Notification (1 min)
1. Click the **"Requests"** button (bell icon in header)
2. **Expected Result**:
   - ✅ See notification: "Footage Match Found!"
   - Message mentions your device type (mobile_phone, dashcam, etc.)
   - Shows incident details

---

## 🔍 Detailed Testing Scenarios

### Scenario A: Multiple Temporary Markers
**Goal**: Test that multiple markers get matched correctly

1. Register 3 temporary markers at different locations:
   - Marker 1: Mobile Phone, Location A, 10:00 AM
   - Marker 2: Dashcam, Location B, 10:05 AM  
   - Marker 3: Action Camera, Location C, 10:10 AM

2. Create evidence request:
   - Location: Between A and B
   - Time: 10:03 AM
   - Radius: 500m

3. **Expected**: Only Markers 1 and 2 should match (Location C too far)

### Scenario B: Time Window Matching
**Goal**: Verify markers outside time window don't match

1. Register temporary marker:
   - Device: Mobile Phone
   - Time: 2 days ago, 3:00 PM

2. Create evidence request:
   - Location: Same spot
   - Time: Today, 3:00 PM
   - Radius: 200m

3. **Expected**: Marker should NOT match (outside time tolerance)

### Scenario C: 2km Camera Validation
**Goal**: Test geographic restriction for permanent cameras

1. **Setup**: Log in with account that has registered address
2. Open "My Property" dashboard
3. Click "Add Camera"
4. Try to place camera **>2km from your address**:
   - **Expected**: ❌ Error: "Camera Location Outside Allowed Area"
   - Shows distance and max allowed (2000m)
   
5. Try to place camera **<2km from your address**:
   - **Expected**: ✅ Camera saves successfully

### Scenario D: No Address Warning
**Goal**: Verify users need address before adding cameras

1. Create **new user account** (or remove address from existing)
2. Open "My Property" dashboard
3. Click "Add Camera"
4. Try to place camera anywhere
5. **Expected**: ⚠️ "Address Required" message
6. Click "Add Address" and complete form
7. Now camera placement should work (within 2km)

---

## 🐛 Debugging Checklist

### Issue: "I Have Footage" button not visible
- ✅ Check you're logged in
- ✅ Check browser console for errors
- ✅ Verify button is in `src/app/page.tsx` lines 598-615

### Issue: Form doesn't open when clicking map
- ✅ Check browser console for "📍 Opening temporary marker form"
- ✅ Verify `handleMapClick` is routing correctly
- ✅ Ensure you clicked the map AFTER clicking "I Have Footage"

### Issue: No matches when creating evidence request
- ✅ Check browser console for: "🎯 Found X permanent cameras + Y temporary markers"
- ✅ Verify temporary marker location is within search radius
- ✅ Verify time window is reasonable (±24 hours)
- ✅ Check Firestore directly: `temporaryEvidenceMarkers` collection

### Issue: Camera validation not working
- ✅ Verify user has registered address
- ✅ Check browser console for validation messages
- ✅ Ensure `GeographicValidationService` import is working

---

## 📊 Firestore Verification

### Check Temporary Marker Creation:
1. Open Firebase Console
2. Navigate to Firestore
3. Look for collection: `temporaryEvidenceMarkers`
4. Verify document has:
   ```
   {
     ownerId: "user-id",
     ownerEmail: "user@example.com",
     location: { lat: X, lng: Y },
     deviceType: "mobile_phone",
     recordedAt: Timestamp,
     expiresAt: Timestamp (14 days from now),
     isActive: true,
     ...
   }
   ```

### Check Evidence Request Matching:
1. Look for collection: `footageRequests`
2. Verify document has:
   ```
   {
     targetCameraIds: ["camera-id-1", "marker-id-1", "marker-id-2"],
     responses: [
       { cameraId: "camera-id-1", cameraName: "Camera 1", status: "pending" },
       { cameraId: "marker-id-1", cameraName: "mobile_phone (Temporary)", status: "pending" }
     ],
     ...
   }
   ```

### Check Notifications:
1. Look for collection: `notifications`
2. Verify documents for both camera owners AND marker owners:
   ```
   {
     userId: "marker-owner-id",
     type: "new-request",
     title: "Footage Match Found! (high priority)",
     message: "vehicle_accident incident on 10/6/2025. Your 1 temporary marker(s) (mobile_phone) matched...",
     read: false,
     ...
   }
   ```

---

## ✅ Success Indicators

### Everything is working correctly if:
- ✅ "I Have Footage" button is visible (blue, above red button)
- ✅ Clicking button shows alert: "Click anywhere on the map..."
- ✅ Clicking map opens TemporaryMarkerRegistration form
- ✅ Form submission shows success message
- ✅ Browser console shows: "✅ Temporary marker created: [id]"
- ✅ Evidence requests show both cameras AND temporary markers in console
- ✅ Notifications appear in "Requests" bell icon
- ✅ Camera placement blocked >2km from address
- ✅ Camera placement works <2km from address

---

## 🎬 Video Walkthrough Script

**For recording a demo:**

1. **[0:00-0:15]** Introduction
   - "Let me show you the new Temporary Evidence Markers feature"
   - "This allows witnesses to register footage from mobile phones and dashcams"

2. **[0:15-0:45]** Register Temporary Marker
   - Click "I Have Footage" button
   - Click map location
   - Fill out form with device type, time, description
   - Upload preview image (optional)
   - Submit

3. **[0:45-1:15]** Create Evidence Request
   - Switch users (optional)
   - Click "Report Incident"
   - Select same/nearby location
   - Fill out incident details
   - Submit request

4. **[1:15-1:30]** View Notification
   - Click "Requests" bell icon
   - Show "Footage Match Found!" notification
   - Demonstrate that marker owner is notified

5. **[1:30-2:00]** Test 2km Validation
   - Open "My Property" dashboard
   - Try to place camera far from address → Show error
   - Place camera near address → Show success

6. **[2:00-2:15]** Conclusion
   - "Temporary markers auto-expire after 14 days"
   - "Perfect for connecting victims with witnesses"
   - "All while maintaining privacy - markers aren't publicly visible"

---

## 📞 Support

If you encounter any issues:
1. Check browser console for error messages
2. Verify all files were updated correctly
3. Review `INTEGRATION_COMPLETE.md` for detailed implementation
4. Check Firebase Console for data verification

**Happy Testing! 🚀**
