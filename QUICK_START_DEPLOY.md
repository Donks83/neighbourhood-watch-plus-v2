# 🚀 Quick Start - Deploy to Git & Vercel

## Option 1: Automated Script (Easiest) ⚡

Open PowerShell in the project directory and run:

```powershell
.\deploy.ps1
```

The script will:
- ✅ Initialize git
- ✅ Configure git user
- ✅ Create commit with feature
- ✅ Help you push to GitHub
- ✅ Optionally deploy to Vercel

---

## Option 2: Manual Steps 📝

### Step 1: Initialize Git (30 seconds)

```powershell
# Initialize repository
git init
git branch -M main

# Configure git (if not already done)
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

### Step 2: Create Commit (30 seconds)

```powershell
# Stage all files
git add .

# Create commit
git commit -m "feat: Add Temporary Evidence Markers feature"
```

### Step 3: Push to GitHub (2 minutes)

1. **Create repository on GitHub**: https://github.com/new
   - Name: `neighbourhood-watch-plus-v2`
   - **DO NOT** initialize with README

2. **Push your code**:
```powershell
git remote add origin https://github.com/YOUR_USERNAME/neighbourhood-watch-plus-v2.git
git push -u origin main
```

### Step 4: Deploy to Vercel (3 minutes)

**Option A: Vercel Dashboard**
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Add environment variables from `.env.local`
4. Click Deploy

**Option B: Vercel CLI**
```powershell
# Install CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Add environment variables, then deploy to production
vercel --prod
```

---

## 🔐 Important: Environment Variables

Don't forget to add these to Vercel:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
NEXT_PUBLIC_MAPTILER_API_KEY
NEXT_PUBLIC_DEFAULT_REQUEST_RADIUS
```

Copy values from your `.env.local` file.

---

## 🔥 Firebase Configuration

After deploying to Vercel:

1. Go to Firebase Console → Authentication → Settings
2. Add your Vercel domain to **Authorized domains**:
   - `your-app.vercel.app`
   - Your custom domain (if any)

---

## ✅ Quick Checklist

- [ ] Git initialized (`git init`)
- [ ] Changes committed (`git commit`)
- [ ] Pushed to GitHub (`git push`)
- [ ] Vercel project created
- [ ] Environment variables added to Vercel
- [ ] Firebase authorized domains updated
- [ ] Production deployment successful
- [ ] Tested on production URL

---

## 🎉 Done!

Your app should now be live at: `https://your-app.vercel.app`

Test the Temporary Evidence Markers feature:
1. Click "I Have Footage" button
2. Register a temporary marker
3. Create an evidence request
4. Verify matching works

---

## 📚 Need Help?

- Full deployment guide: `DEPLOYMENT_GUIDE.md`
- Testing scenarios: `TESTING_GUIDE.md`
- Technical details: `INTEGRATION_COMPLETE.md`

**Questions? Check the deployment guide for troubleshooting!**
