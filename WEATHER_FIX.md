# 🎯 FINAL Fix - Weather Resistant Field

Run to push:

```powershell
git add src/components/map/camera-edit-modal.tsx
git commit -m "fix: remove weatherResistant field from camera edit

- Camera specifications type only has: resolution, nightVision, model, brand
- Removed weatherResistant from form state
- Removed weather resistant checkbox from UI
- Changed grid from 2 columns to 1 column for night vision"
git push origin main
```

**What was fixed:**
- Removed `weatherResistant` property (doesn't exist in specifications type)
- Specifications only has: `resolution`, `nightVision`, `model`, `brand`
- Simplified UI to single column for night vision toggle

**This is it - all non-existent properties removed!** 🎯
