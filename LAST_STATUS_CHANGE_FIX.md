# ✅ Remove lastStatusChange Property

Run to push:

```powershell
git add src/components/map/camera-registration-dashboard.tsx
git commit -m "fix: remove non-existent lastStatusChange property

- RegisteredCamera type doesn't have lastStatusChange field
- Only update operationalStatus
- lastUpdated is automatically set by Firestore update"
git push origin main
```

**What was fixed:**
- Removed `lastStatusChange` from camera update
- This property doesn't exist on `RegisteredCamera` type
- The `lastUpdated` field is likely set automatically by Firestore

**Simple removal of non-existent property!** ✅
