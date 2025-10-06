#!/bin/bash

echo "🏘️ NEIGHBOURHOOD WATCH+ V2 - PROJECT SETUP"
echo "========================================="
echo ""

echo "📁 Project Location: $(pwd)"
echo ""

echo "🔧 Step 1: Installing dependencies..."
npm install

echo ""
echo "🗺️ Step 2: Map API Setup"
echo "Please get a free MapTiler API key from:"
echo "https://cloud.maptiler.com/"
echo ""
echo "Then update .env.local with your key:"
echo "NEXT_PUBLIC_MAPTILER_API_KEY=your_actual_key_here"
echo ""

echo "🔥 Step 3: Firebase Setup"
echo "Firebase is already configured with existing project:"
echo "- Project ID: neighbourhood-watch-plus"
echo "- All credentials in .env.local"
echo ""

echo "🚀 Step 4: Start Development"
echo "Ready to start development server:"
echo "npm run dev"
echo ""

echo "✅ Setup Complete!"
echo ""
echo "📝 Next Steps:"
echo "1. Get MapTiler API key and update .env.local"
echo "2. Run 'npm run dev' to start development"
echo "3. Open http://localhost:3000"
echo ""
echo "📚 References:"
echo "- V1 project: C:\Claude\neighborhood-watch-plus (avoid bugs)"
echo "- Trove project: C:\Claude\trove (working map patterns)"
echo ""
echo "🎯 Focus: Build working pin-drop map interface first!"
