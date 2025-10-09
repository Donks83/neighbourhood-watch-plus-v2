# ✅ Optional Chaining Fix

Run to push:

```powershell
git add src/components/map/camera-registration-dashboard.tsx
git commit -m "fix: add optional chaining for validation.distance

- Added optional chaining: validation.distance?.toFixed(0)
- Fallback to 'unknown' if distance is undefined
- Prevents TypeScript error about possibly undefined property"
git push origin main
```

**What was fixed:**
- `validation.distance` could be undefined
- Added `?.` optional chaining operator
- Added fallback: `|| 'unknown'`
- Fixed in both alert message and console log

**This is proper TypeScript null-safety!** ✅
