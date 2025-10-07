# 🔧 Camera Configuration Fix

Run to push:

```powershell
git add src/components/map/camera-configuration-dialog.tsx
git commit -m "fix: add missing properties to camera registration

- Added operationalStatus field (set to 'active')
- Added verification object with pending status
- Cameras now properly initialize with all required fields"
git push origin main
```

**What was fixed:**
- `RegisteredCamera` type requires `operationalStatus` and `verification`
- Added `operationalStatus: 'active'` (camera is operational)
- Added `verification` object with:
  - Status: 'pending' (awaits admin review)
  - Evidence notes
  - History tracking
  - Priority: 'normal'

Build should succeed now! 🎯
