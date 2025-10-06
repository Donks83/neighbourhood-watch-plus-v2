# 🚀 Deployment Guide - Neighbourhood Watch+ v2

## Current Status
✅ Temporary Evidence Markers feature complete (100%)  
🎯 Ready to deploy to production

---

## 📋 Pre-Deployment Checklist

### Environment Variables
Make sure you have these ready for Vercel:

```bash
# Firebase Configuration (from .env.local)
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# MapTiler API Key
NEXT_PUBLIC_MAPTILER_API_KEY=your_maptiler_key

# Default Values
NEXT_PUBLIC_DEFAULT_REQUEST_RADIUS=200
```

⚠️ **Important**: Never commit `.env.local` to git!

---

## 🔧 Step 1: Initialize Git Repository

Open PowerShell in the project directory and run:

```powershell
# Initialize git repository
git init

# Configure git (if not already done)
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Check status
git status
```

---

## 📝 Step 2: Create .gitignore

The project should already have a `.gitignore`, but let's verify it includes:

```gitignore
# Dependencies
/node_modules
/.pnp
.pnp.js

# Testing
/coverage

# Next.js
/.next/
/out/

# Production
/build

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env*.local
.env.local
.env

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts
```

---

## 📦 Step 3: Stage and Commit Changes

```powershell
# Add all files
git add .

# Create initial commit with feature
git commit -m "feat: Add Temporary Evidence Markers feature

- Add 'I Have Footage' button for witness registration
- Implement temporary marker registration form
- Update evidence request matching to include temporary markers
- Add 2km geographic validation for permanent cameras
- Integrate notification system for camera and marker owners
- Auto-expire markers after 14 days
- Support multiple device types (mobile, dashcam, action camera)
- Privacy-first: markers not visible on public map

Key changes:
- src/app/page.tsx: Added button and component rendering
- src/lib/footage-requests.ts: Enhanced matching algorithm
- src/components/map/camera-registration-dashboard.tsx: 2km validation
- Complete documentation in INTEGRATION_COMPLETE.md"

# Verify commit
git log --oneline
```

---

## 🌐 Step 4: Create GitHub Repository

### Option A: Using GitHub CLI (if installed)
```powershell
gh repo create neighbourhood-watch-plus-v2 --public --source=. --remote=origin
```

### Option B: Using GitHub Website
1. Go to https://github.com/new
2. Repository name: `neighbourhood-watch-plus-v2`
3. Description: "Privacy-first community security platform with temporary evidence markers"
4. Choose: **Public** or **Private**
5. **DO NOT** initialize with README (we already have one)
6. Click **"Create repository"**

7. Copy the commands shown and run:
```powershell
git remote add origin https://github.com/YOUR_USERNAME/neighbourhood-watch-plus-v2.git
git branch -M main
git push -u origin main
```

---

## ☁️ Step 5: Deploy to Vercel

### Method A: Using Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not installed):
```powershell
npm install -g vercel
```

2. **Login to Vercel**:
```powershell
vercel login
```

3. **Deploy**:
```powershell
# From project directory
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - What's your project's name? neighbourhood-watch-plus-v2
# - In which directory is your code located? ./
# - Want to modify settings? No
```

4. **Add Environment Variables**:
```powershell
# Add each variable
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID
vercel env add NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
vercel env add NEXT_PUBLIC_MAPTILER_API_KEY
vercel env add NEXT_PUBLIC_DEFAULT_REQUEST_RADIUS

# When prompted, select:
# - Which environments? Production, Preview, Development
```

5. **Deploy to Production**:
```powershell
vercel --prod
```

### Method B: Using Vercel Dashboard

1. Go to https://vercel.com/new
2. Click **"Import Git Repository"**
3. Select your GitHub repository
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

5. **Add Environment Variables**:
   - Click "Environment Variables"
   - Add all variables from your `.env.local`
   - Set for: Production, Preview, Development

6. Click **"Deploy"**

---

## 🔐 Step 6: Configure Firebase

### Update Firebase Authorized Domains

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Add your Vercel domain:
   - `your-app.vercel.app`
   - `your-custom-domain.com` (if you have one)

### Update Firebase Storage CORS

If using preview images, update CORS settings:

```json
[
  {
    "origin": ["https://your-app.vercel.app"],
    "method": ["GET", "POST"],
    "maxAgeSeconds": 3600
  }
]
```

---

## 🧪 Step 7: Post-Deployment Testing

### Test on Production

1. **Visit your Vercel URL**: `https://your-app.vercel.app`

2. **Test Authentication**:
   - Sign up with new account
   - Verify email works
   - Log in/out

3. **Test Temporary Markers**:
   - Click "I Have Footage" button
   - Register temporary marker
   - Verify in Firebase Console

4. **Test Evidence Requests**:
   - Create evidence request
   - Verify matching works
   - Check notifications

5. **Test Camera Registration**:
   - Add address
   - Try to register camera >2km → Should fail
   - Register camera <2km → Should succeed

---

## 📊 Monitoring & Analytics

### Vercel Analytics
- Go to your project dashboard
- Click "Analytics" tab
- Monitor performance and errors

### Firebase Usage
- Monitor Firestore reads/writes
- Check authentication metrics
- Review Storage usage

---

## 🔄 Continuous Deployment

Once set up, future deployments are automatic:

```powershell
# Make changes to code
git add .
git commit -m "feat: your feature description"
git push origin main

# Vercel automatically deploys!
```

---

## 🐛 Troubleshooting

### Build Fails on Vercel

**Issue**: TypeScript errors
```bash
# Fix locally first
npm run build

# If successful, commit and push
```

**Issue**: Missing environment variables
- Check Vercel dashboard → Settings → Environment Variables
- Ensure all variables are set for Production

### Firebase Connection Issues

**Issue**: "Firebase: Error (auth/unauthorized-domain)"
- Add Vercel domain to Firebase Authorized Domains

**Issue**: CORS errors with storage
- Update Firebase Storage CORS configuration

### Map Not Loading

**Issue**: MapTiler not working
- Verify `NEXT_PUBLIC_MAPTILER_API_KEY` is set in Vercel
- Check MapTiler dashboard for usage limits

---

## 📱 Custom Domain (Optional)

### Add Custom Domain to Vercel

1. Go to Project Settings → Domains
2. Add your domain (e.g., `neighbourhoodwatch.app`)
3. Follow DNS configuration instructions
4. Add domain to Firebase Authorized Domains

---

## ✅ Deployment Checklist

Before considering deployment complete:

- [ ] Git repository initialized
- [ ] Initial commit created
- [ ] Pushed to GitHub
- [ ] Vercel project created
- [ ] All environment variables added to Vercel
- [ ] Firebase authorized domains updated
- [ ] Successful production deployment
- [ ] Authentication tested on production
- [ ] Temporary markers tested on production
- [ ] Evidence requests tested on production
- [ ] Camera registration tested on production
- [ ] No console errors in production
- [ ] Analytics/monitoring enabled

---

## 🎉 Success!

Your Neighbourhood Watch+ app with Temporary Evidence Markers is now live!

**Next Steps**:
1. Share the URL with beta testers
2. Monitor analytics and error logs
3. Gather user feedback
4. Plan next features from `IMPROVEMENTS_ROADMAP.md`

---

## 📞 Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Firebase Hosting**: https://firebase.google.com/docs/hosting
- **GitHub Pages**: https://pages.github.com/

---

**Deployment completed!** 🚀
