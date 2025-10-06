# 🏘️ Neighbourhood Watch+ V2

## Privacy-First Community Security Camera Footage Sharing Platform

A modern, privacy-focused platform that enables residents to:
- **Report incidents** by dropping pins on an interactive map
- **Request camera footage** from nearby residents with customizable search radius
- **Share footage securely** with full user control and consent
- **Maintain privacy** through location fuzzing and voluntary sharing

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm 8+
- Firebase project (configured in `.env.local`)
- MapTiler API key (free tier available)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   - Update `.env.local` with your MapTiler API key
   - Firebase is pre-configured for this project

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   - Navigate to `http://localhost:3000`
   - Allow location access for best experience

---

## 🗺️ Core Features

### ✅ Implemented (V2.0)
- **Full-screen MapLibre GL JS interface** with smooth interactions
- **Working pin-drop incident reporting** (fixed from V1!)
- **Camera coverage heatmap** showing density areas while protecting privacy
- **Incident form with validation** using React Hook Form + Zod
- **Privacy-focused design** with location fuzzing
- **Interactive heatmap controls** with legend and statistics
- **Responsive UI** with Tailwind CSS + shadcn/ui components
- **Real-time map interactions** with custom markers and radius visualization

### 🚧 Coming Soon
- Firebase integration for data persistence
- User authentication and camera registration
- Push notifications for footage requests
- Secure file upload and sharing
- Admin dashboard and moderation tools

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 14 + TypeScript + Tailwind CSS
- **Maps:** MapLibre GL JS (no API limits!)
- **UI Components:** Radix UI + shadcn/ui
- **Forms:** React Hook Form + Zod validation  
- **Backend:** Firebase (Firestore, Auth, Storage, Functions)
- **Deployment:** Vercel-ready

---

## 🔧 Development

### Available Scripts
```bash
npm run dev        # Start development server
npm run build      # Build for production  
npm run start      # Start production server
npm run lint       # Run ESLint
npm run type-check # Check TypeScript types
```

### Project Structure
```
src/
├── app/                 # Next.js 14 App Router
├── components/
│   ├── map/            # Map components
│   └── ui/             # Reusable UI components
├── lib/                # Utilities and config
├── types/              # TypeScript definitions
└── globals.css         # Global styles
```

---

## 🔒 Privacy & Security

- **Location Privacy:** All locations are fuzzy within 50m radius
- **Heatmap Anonymization:** Shows density areas, never exact camera locations
- **Voluntary Sharing:** Camera owners control all footage sharing
- **Data Minimization:** Only collect essential incident details
- **Secure Storage:** All data encrypted in Firebase
- **User Consent:** Explicit opt-in for all sharing features

---

## 🌟 Key Improvements from V1

- ✅ **Fixed pin-drop functionality** - now works reliably
- ✅ **Camera coverage heatmap** - privacy-protected density visualization
- ✅ **Auto-retracting panels** - better UX
- ✅ **Clear UX distinction** between incident reporting and notifications
- ✅ **Interactive heatmap controls** - toggle with statistics and legend
- ✅ **Proper button positioning** - no more map control blocking
- ✅ **Eliminated overlapping UI** - clean interface
- ✅ **MapLibre GL JS** - no API limits, better performance

---

## 📱 Usage Guide

### Viewing Camera Coverage
1. Click **"Coverage Map"** button (top left)
2. **View heatmap overlay** showing camera density areas
3. **Blue areas** = low coverage, **Red areas** = high coverage
4. **Zoom in/out** to see detail levels change
5. **Privacy protected** - exact locations stay private

### Reporting an Incident
1. Click the **red alert button** (bottom right)
2. **Click anywhere on the map** where incident occurred  
3. **Fill out incident details** in the popup form
4. **Select search radius** for camera requests
5. **Submit** - nearby camera owners get notified

### Camera Registration (Coming Soon)
1. Click the **camera button**
2. Mark your camera locations
3. Set privacy preferences
4. Choose notification settings

---

## 🔄 API Integration

### Environment Variables Required
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id

# Maps
NEXT_PUBLIC_MAPTILER_API_KEY=get_free_key_from_maptiler.com

# Privacy Settings
NEXT_PUBLIC_LOCATION_FUZZING_RADIUS=50
NEXT_PUBLIC_MAX_REQUEST_RADIUS=500
```

### Get Your Free MapTiler API Key
1. Visit [MapTiler.com](https://cloud.maptiler.com/)
2. Sign up for free account
3. Copy your API key to `.env.local`

---

## 🚨 Known Issues & Roadmap

### Current Limitations
- No user authentication yet (Firebase Auth coming)
- Incident reports stored locally only (Firebase integration pending)
- No actual push notifications (will use FCM)

### Next Steps
1. **Firebase Authentication** - user accounts and security
2. **Data Persistence** - store incidents and camera registrations
3. **Notification System** - real-time alerts to camera owners
4. **File Upload** - secure footage sharing
5. **Admin Dashboard** - community moderation tools

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

- **Issues:** [GitHub Issues](https://github.com/your-repo/neighbourhood-watch-plus-v2/issues)
- **Discussions:** [GitHub Discussions](https://github.com/your-repo/neighbourhood-watch-plus-v2/discussions)
- **Email:** support@neighbourhoodwatchplus.com

---

**Built with ❤️ for safer communities**

---

*Remember: This platform is for community safety only. Always contact emergency services for urgent situations.*
