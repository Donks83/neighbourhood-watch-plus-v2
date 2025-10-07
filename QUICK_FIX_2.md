# 🔧 Quick Fix - Function Signature

Run these commands to push the fix:

```powershell
git add src/app/page.tsx
git commit -m "fix: correct getCommunityHeatmapCameras function call

- Remove unused radius parameter (function loads globally)"
git push origin main
```

**What was fixed:**
- `getCommunityHeatmapCameras()` only takes 1 parameter (userLocation)
- We were passing 2 parameters (userLocation, 5)
- Removed the second parameter since the function loads all cameras globally anyway

Vercel will auto-deploy after you push! 🚀
