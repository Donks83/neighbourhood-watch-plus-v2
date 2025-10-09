# ✅ Fix setValue Calls for Date Type

Run to push:

```powershell
git add src/components/map/incident-report-form.tsx
git commit -m "fix: setValue calls should pass Date objects not strings

- Changed all quick-select button setValue calls
- Now passes Date objects instead of ISO strings
- Consistent with form type definition expecting Date
- React-hook-form handles the conversion to input format"
git push origin main
```

**What was fixed:**
- Quick-select buttons (Now, 1 Hour Ago, This Morning)
- Were calling: `setValue('incidentDateTime', date.toISOString().slice(0, 16))`
- Now calling: `setValue('incidentDateTime', date)`
- Passes Date objects, react-hook-form handles conversion

**Complete type consistency!** ✅
