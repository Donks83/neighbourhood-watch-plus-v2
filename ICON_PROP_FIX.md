# ✅ Remove Invalid Icon Prop

Run to push:

```powershell
git add src/components/map/location-search.tsx
git commit -m "fix: remove unsupported title prop from Lucide icon

- Lucide icons don't accept title prop
- Removed title from Search icon component
- Icon styling and animation still work correctly"
git push origin main
```

**What was fixed:**
- Lucide React icons don't support `title` prop
- Removed `title={pendingSearch ? "Searching soon..." : "Search for locations"}`
- Icon still has proper styling and animation
- If tooltip needed, should use wrapper with title attribute

**Simple prop removal!** ✅
