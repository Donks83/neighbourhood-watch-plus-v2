// Quick fix script to create admin role
// Run this in browser console on your app

async function createAdminRole() {
  const userId = 'jAGJ2GC59UMuA5n6FbOU542IioL2'
  const email = 'sibley83@googlemail.com'
  
  try {
    // Import Firestore functions
    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore')
    const { db } = await import('./src/lib/firebase.ts')
    
    const userRole = {
      uid: userId,
      email: email,
      role: 'super_admin',
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
      assignedBy: 'manual_setup',
      isActive: true,
      lastActiveAt: serverTimestamp()
    }
    
    // Create the role document
    const roleRef = doc(db, 'user_roles', userId)
    await setDoc(roleRef, userRole)
    
    console.log('✅ Admin role created successfully!')
    console.log('Refresh the page to see Admin Panel in user menu')
    
  } catch (error) {
    console.error('❌ Error creating admin role:', error)
  }
}

// Run the function
createAdminRole()
