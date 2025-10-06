# 🚀 Automated Deployment Script for Neighbourhood Watch+
# Run this in PowerShell from the project root directory

Write-Host "🚀 Starting deployment process..." -ForegroundColor Cyan
Write-Host ""

# Check if git is installed
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Git is not installed. Please install Git first:" -ForegroundColor Red
    Write-Host "   https://git-scm.com/download/win" -ForegroundColor White
    exit 1
}

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️  Warning: .env.local not found" -ForegroundColor Yellow
    Write-Host "   Make sure you have your environment variables ready for Vercel" -ForegroundColor White
    Write-Host ""
}

# Initialize git if not already initialized
if (-not (Test-Path ".git")) {
    Write-Host "📦 Initializing git repository..." -ForegroundColor Green
    git init
    git branch -M main
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
} else {
    Write-Host "✅ Git repository already initialized" -ForegroundColor Green
}

Write-Host ""
Write-Host "📝 Checking git configuration..." -ForegroundColor Yellow

# Check git config
$userName = git config user.name
$userEmail = git config user.email

if (-not $userName) {
    Write-Host "⚠️  Git user.name not configured" -ForegroundColor Yellow
    $name = Read-Host "Enter your name for git commits"
    git config user.name "$name"
}

if (-not $userEmail) {
    Write-Host "⚠️  Git user.email not configured" -ForegroundColor Yellow
    $email = Read-Host "Enter your email for git commits"
    git config user.email "$email"
}

Write-Host "✅ Git configured as: $(git config user.name) <$(git config user.email)>" -ForegroundColor Green
Write-Host ""

# Show what will be committed
Write-Host "📋 Files to be committed:" -ForegroundColor Yellow
git status --short
Write-Host ""

# Confirm before proceeding
$continue = Read-Host "Continue with commit? (y/n)"
if ($continue -ne "y") {
    Write-Host "❌ Deployment cancelled" -ForegroundColor Red
    exit 0
}

# Add all files
Write-Host ""
Write-Host "📦 Staging files..." -ForegroundColor Green
git add .

# Create commit
Write-Host "💾 Creating commit..." -ForegroundColor Green
git commit -m "feat: Add Temporary Evidence Markers feature

✨ New Features:
- Witness registration via 'I Have Footage' button
- Temporary marker system for mobile/dashcam footage
- Enhanced evidence request matching (cameras + markers)
- 2km geographic validation for permanent cameras
- Multi-channel notification system
- Auto-expiry after 14 days

📝 Changes:
- src/app/page.tsx: Button and component integration
- src/lib/footage-requests.ts: Enhanced matching algorithm
- src/components/map/camera-registration-dashboard.tsx: Geographic validation

📚 Documentation:
- INTEGRATION_COMPLETE.md: Technical details
- TESTING_GUIDE.md: Test scenarios
- DEPLOYMENT_GUIDE.md: Deployment instructions"

Write-Host "✅ Commit created" -ForegroundColor Green
Write-Host ""

# Ask for GitHub repository URL
Write-Host "🌐 GitHub Setup" -ForegroundColor Cyan
Write-Host ""
Write-Host "Create a new repository on GitHub: https://github.com/new" -ForegroundColor White
Write-Host "Repository name: neighbourhood-watch-plus-v2" -ForegroundColor White
Write-Host "Description: Privacy-first community security platform" -ForegroundColor White
Write-Host "Visibility: Public or Private (your choice)" -ForegroundColor White
Write-Host "DO NOT initialize with README (we have one)" -ForegroundColor Yellow
Write-Host ""

$repoUrl = Read-Host "Enter your GitHub repository URL (e.g., https://github.com/username/repo.git)"

if ($repoUrl) {
    Write-Host ""
    Write-Host "🔗 Adding remote origin..." -ForegroundColor Green
    
    # Remove existing origin if it exists
    git remote remove origin 2>$null
    
    # Add new origin
    git remote add origin $repoUrl
    
    Write-Host "✅ Remote origin added" -ForegroundColor Green
    Write-Host ""
    
    # Confirm before pushing
    $push = Read-Host "Push to GitHub now? (y/n)"
    if ($push -eq "y") {
        Write-Host "📤 Pushing to GitHub..." -ForegroundColor Green
        git push -u origin main
        Write-Host "✅ Pushed to GitHub successfully!" -ForegroundColor Green
    } else {
        Write-Host "ℹ️  To push later, run: git push -u origin main" -ForegroundColor Cyan
    }
} else {
    Write-Host "⚠️  No repository URL provided. You can add it later with:" -ForegroundColor Yellow
    Write-Host "   git remote add origin <your-repo-url>" -ForegroundColor White
    Write-Host "   git push -u origin main" -ForegroundColor White
}

Write-Host ""
Write-Host "🎉 Git setup complete!" -ForegroundColor Green
Write-Host ""

# Vercel deployment
Write-Host "☁️  Vercel Deployment" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps for Vercel deployment:" -ForegroundColor White
Write-Host "1. Install Vercel CLI: npm install -g vercel" -ForegroundColor White
Write-Host "2. Login: vercel login" -ForegroundColor White
Write-Host "3. Deploy: vercel" -ForegroundColor White
Write-Host "4. Add environment variables from .env.local" -ForegroundColor White
Write-Host "5. Deploy to production: vercel --prod" -ForegroundColor White
Write-Host ""

$deployNow = Read-Host "Would you like to deploy to Vercel now? (requires Vercel CLI) (y/n)"

if ($deployNow -eq "y") {
    # Check if Vercel CLI is installed
    if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
        Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Yellow
        npm install -g vercel
    }
    
    Write-Host ""
    Write-Host "🚀 Starting Vercel deployment..." -ForegroundColor Green
    Write-Host "Follow the prompts from Vercel CLI..." -ForegroundColor White
    Write-Host ""
    
    vercel
    
    Write-Host ""
    Write-Host "⚠️  Don't forget to add environment variables in Vercel dashboard!" -ForegroundColor Yellow
    Write-Host "   Go to: Project Settings → Environment Variables" -ForegroundColor White
} else {
    Write-Host "ℹ️  You can deploy to Vercel later by running: vercel" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "✅ Deployment setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📚 Resources:" -ForegroundColor Cyan
Write-Host "   - Full guide: DEPLOYMENT_GUIDE.md" -ForegroundColor White
Write-Host "   - Testing: TESTING_GUIDE.md" -ForegroundColor White
Write-Host "   - Technical docs: INTEGRATION_COMPLETE.md" -ForegroundColor White
Write-Host ""
Write-Host "🎉 You're all set! Happy deploying!" -ForegroundColor Green
