// One-time script to create your first super admin account
// Run this ONCE to bootstrap the admin system

import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore'

// Your Firebase config (copy from .env.local or Firebase console)
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com", 
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function createSuperAdmin() {
  // REPLACE THESE WITH YOUR ACTUAL VALUES
  const YOUR_USER_ID = "your_user_id_from_users_collection"  // Find in Firebase Console -> Firestore -> users collection
  const YOUR_EMAIL = "your@email.com"
  
  const userRole = {
    uid: YOUR_USER_ID,
    email: YOUR_EMAIL,
    role: "super_admin",
    permissions: {
      canVerifyCameras: true,
      canManageUsers: true,
      canViewAnalytics: true,
      canManageReports: true,
      canAssignModerators: true,
      canDeleteContent: true,
      canExportData: true
    },
    assignedAt: serverTimestamp(),
    assignedBy: "system_setup",
    isActive: true,
    lastActiveAt: serverTimestamp()
  }
  
  try {
    // Create role document in user_roles collection
    await setDoc(doc(db, 'user_roles', YOUR_USER_ID), userRole)
    
    // Update user profile to include role reference
    await setDoc(doc(db, 'users', YOUR_USER_ID), {
      role: userRole
    }, { merge: true })
    
    console.log('✅ Super admin created successfully!')
    console.log('You can now log in and see the Admin Panel link in your user menu.')
    console.log('You can assign roles to other users through the admin interface.')
  } catch (error) {
    console.error('❌ Error creating super admin:', error)
  }
  
  process.exit(0)
}

// Run the function
createSuperAdmin()

/* 
To use this script:
1. Update YOUR_USER_ID and YOUR_EMAIL above
2. Update firebaseConfig with your actual values
3. Run: node scripts/setup-admin.js
4. Delete this file after running once
*/
