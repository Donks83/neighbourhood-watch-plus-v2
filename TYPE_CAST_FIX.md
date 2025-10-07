# 🎯 Type Cast Fix - Operational Status

Run to push:

```powershell
git add src/components/map/camera-edit-modal.tsx
git commit -m "fix: add type cast for operationalStatus

- Cast e.target.value to literal union type
- Fixes TypeScript error about string not assignable to literal type
- operationalStatus now properly typed as 'active' | 'offline' | 'maintenance'"
git push origin main
```

**What was fixed:**
- Added type cast: `as 'active' | 'offline' | 'maintenance'`
- Without cast, TypeScript sees `e.target.value` as generic `string`
- With cast, it's recognized as the correct literal union type

**This is a common TypeScript pattern for select inputs!** 🎯
