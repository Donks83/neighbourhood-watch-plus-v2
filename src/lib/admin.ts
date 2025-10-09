import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc,
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore'
import { db } from './firebase'
import type { 
  UserRole, 
  UserRoleType, 
  UserPermissions,
  CameraVerification,
  VerificationHistoryItem,
  RejectionReason,
  VerificationQueueItem,
  VerificationStats
} from '@/types/verification'
import type { RegisteredCamera, UserProfile } from '@/types/camera'
import { updateUserTrustScore } from './verification'

// ===== ADMIN ROLE & PERMISSIONS SYSTEM =====

/**
 * Get user's role and permissions
 */
async function getUserRole(userId: string): Promise<UserRole | null> {
  try {
    console.log('Getting user role from Firestore for:', userId)
    const roleRef = doc(db, 'user_roles', userId)
    const roleDoc = await getDoc(roleRef)
    
    if (roleDoc.exists()) {
      const role = roleDoc.data() as UserRole
      console.log('Role found:', role.role)
      return role
    } else {
      console.log('No role found for user:', userId)
      return null // User has no special role (default 'user')
    }
  } catch (error) {
    console.error('❌ Error getting user role:', error)
    return null
  }
}

/**
 * Check if user has specific permission
 */
async function hasPermission(userId: string, permission: keyof UserPermissions): Promise<boolean> {
  try {
    const role = await getUserRole(userId)
    
    if (!role || !role.isActive) {
      return false
    }
    
    return role.permissions[permission] || false
  } catch (error) {
    console.error('❌ Error checking permission:', error)
    return false
  }
}

/**
 * Check if user is admin (any admin level)
 */
async function isAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId)
  return role ? ['admin', 'moderator', 'super_admin'].includes(role.role) : false
}

/**
 * Get default permissions for role type
 */
function getDefaultPermissions(roleType: UserRoleType): UserPermissions {
  const permissions: Record<UserRoleType, UserPermissions> = {
    user: {
      canVerifyCameras: false,
      canManageUsers: false,
      canViewAnalytics: false,
      canManageReports: false,
      canAssignModerators: false,
      canDeleteContent: false,
      canExportData: false
    },
    moderator: {
      canVerifyCameras: true,
      canManageUsers: false,
      canViewAnalytics: true,
      canManageReports: true,
      canAssignModerators: false,
      canDeleteContent: false,
      canExportData: false
    },
    admin: {
      canVerifyCameras: true,
      canManageUsers: true,
      canViewAnalytics: true,
      canManageReports: true,
      canAssignModerators: true,
      canDeleteContent: true,
      canExportData: true
    },
    super_admin: {
      canVerifyCameras: true,
      canManageUsers: true,
      canViewAnalytics: true,
      canManageReports: true,
      canAssignModerators: true,
      canDeleteContent: true,
      canExportData: true
    }
  }
  
  return permissions[roleType]
}

/**
 * Assign role to user
 */
async function assignUserRole(
  userId: string, 
  roleType: UserRoleType, 
  assignedByUserId: string,
  customPermissions?: Partial<UserPermissions>
): Promise<void> {
  try {
    // Check if assigning user has permission
    const canAssign = await hasPermission(assignedByUserId, 'canAssignModerators')
    if (!canAssign) {
      throw new Error('Insufficient permissions to assign roles')
    }
    
    // Get user details
    const userRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userRef)
    
    if (!userDoc.exists()) {
      throw new Error('User not found')
    }
    
    const user = userDoc.data() as UserProfile
    const permissions = customPermissions ? 
      { ...getDefaultPermissions(roleType), ...customPermissions } : 
      getDefaultPermissions(roleType)
    
    const userRole: UserRole = {
      uid: userId,
      email: user.email,
      role: roleType,
      permissions,
      assignedAt: serverTimestamp() as Timestamp,
      assignedBy: assignedByUserId,
      isActive: true,
      lastActiveAt: serverTimestamp() as Timestamp
    }
    
    // Save role
    const roleRef = doc(db, 'user_roles', userId)
    await setDoc(roleRef, userRole, { merge: true })
    
    // Update user profile with role reference
    await updateDoc(userRef, {
      role: userRole,
      lastActiveAt: serverTimestamp()
    })
    
    console.log(`✅ Assigned ${roleType} role to user ${userId}`)
  } catch (error) {
    console.error('❌ Error assigning user role:', error)
    throw error
  }
}

// ===== CAMERA VERIFICATION ADMIN ACTIONS =====

/**
 * Approve camera verification
 */
async function approveCameraVerification(
  cameraId: string,
  adminId: string,
  adminNotes?: string,
  publicNotes?: string
): Promise<void> {
  try {
    // Check admin permissions
    const canVerify = await hasPermission(adminId, 'canVerifyCameras')
    if (!canVerify) {
      throw new Error('Insufficient permissions to verify cameras')
    }
    
    const cameraRef = doc(db, 'cameras', cameraId)
    const cameraDoc = await getDoc(cameraRef)
    
    if (!cameraDoc.exists()) {
      throw new Error('Camera not found')
    }
    
    const camera = cameraDoc.data() as RegisteredCamera
    const currentVerification = camera.verification
    
    if (!currentVerification) {
      throw new Error('Camera has no verification data')
    }
    
    // Create history item with regular timestamp
    const historyItem: VerificationHistoryItem = {
      id: `approved-${Date.now()}`,
      action: 'approved',
      performedBy: adminId,
      performedAt: new Timestamp(Math.floor(Date.now() / 1000), 0), // Use current time as Timestamp
      ...(adminNotes && { adminNotes }) // Only include if defined
    }
    
    // Update verification - filter out undefined values
    const updatedVerification: CameraVerification = {
      ...currentVerification,
      status: 'approved',
      verifiedAt: serverTimestamp() as Timestamp,
      verifiedBy: adminId,
      ...(adminNotes && { adminNotes }), // Only include if defined
      ...(publicNotes && { publicNotes }), // Only include if defined
      history: [...currentVerification.history, historyItem]
    }
    
    // Update camera
    await updateDoc(cameraRef, {
      verification: updatedVerification,
      operationalStatus: 'active', // Activate camera upon approval
      lastUpdated: serverTimestamp()
    })
    
    // Remove from verification queue
    await removeFromVerificationQueue(cameraId)
    
    // Update user's trust score
    await updateUserTrustScore(camera.userId, `Camera "${camera.name}" verified`)
    
    console.log(`✅ Approved camera verification: ${cameraId}`)
  } catch (error) {
    console.error('❌ Error approving camera verification:', error)
    throw error
  }
}

/**
 * Reject camera verification
 */
async function rejectCameraVerification(
  cameraId: string,
  adminId: string,
  rejectionReason: RejectionReason,
  customReason?: string,
  adminNotes?: string,
  publicNotes?: string
): Promise<void> {
  try {
    // Check admin permissions
    const canVerify = await hasPermission(adminId, 'canVerifyCameras')
    if (!canVerify) {
      throw new Error('Insufficient permissions to verify cameras')
    }
    
    const cameraRef = doc(db, 'cameras', cameraId)
    const cameraDoc = await getDoc(cameraRef)
    
    if (!cameraDoc.exists()) {
      throw new Error('Camera not found')
    }
    
    const camera = cameraDoc.data() as RegisteredCamera
    const currentVerification = camera.verification
    
    if (!currentVerification) {
      throw new Error('Camera has no verification data')
    }
    
    // Create history item with regular timestamp
    const historyItem: VerificationHistoryItem = {
      id: `rejected-${Date.now()}`,
      action: 'rejected',
      performedBy: adminId,
      performedAt: new Timestamp(Math.floor(Date.now() / 1000), 0), // Use current time as Timestamp
      reason: rejectionReason,
      ...(adminNotes && { adminNotes }) // Only include if defined
    }
    
    // Update verification - filter out undefined values
    const updatedVerification: CameraVerification = {
      ...currentVerification,
      status: 'rejected',
      verifiedAt: serverTimestamp() as Timestamp,
      verifiedBy: adminId,
      rejectionReason,
      ...(customReason && { customRejectionReason: customReason }), // Only include if defined
      ...(adminNotes && { adminNotes }), // Only include if defined
      ...(publicNotes && { publicNotes }), // Only include if defined
      history: [...currentVerification.history, historyItem]
    }
    
    // Update camera
    await updateDoc(cameraRef, {
      verification: updatedVerification,
      operationalStatus: 'inactive', // Deactivate rejected camera
      lastUpdated: serverTimestamp()
    })
    
    // Remove from verification queue
    await removeFromVerificationQueue(cameraId)
    
    // Update user's trust score (penalty for rejection)
    await updateUserTrustScore(camera.userId, `Camera "${camera.name}" rejected: ${rejectionReason}`)
    
    console.log(`❌ Rejected camera verification: ${cameraId} (${rejectionReason})`)
  } catch (error) {
    console.error('❌ Error rejecting camera verification:', error)
    throw error
  }
}

/**
 * Request more information for camera verification
 */
async function requestVerificationInfo(
  cameraId: string,
  adminId: string,
  requestMessage: string,
  adminNotes?: string
): Promise<void> {
  try {
    // Check admin permissions
    const canVerify = await hasPermission(adminId, 'canVerifyCameras')
    if (!canVerify) {
      throw new Error('Insufficient permissions to verify cameras')
    }
    
    const cameraRef = doc(db, 'cameras', cameraId)
    const cameraDoc = await getDoc(cameraRef)
    
    if (!cameraDoc.exists()) {
      throw new Error('Camera not found')
    }
    
    const camera = cameraDoc.data() as RegisteredCamera
    const currentVerification = camera.verification
    
    if (!currentVerification) {
      throw new Error('Camera has no verification data')
    }
    
    // Create history item with regular timestamp
    const historyItem: VerificationHistoryItem = {
      id: `info-requested-${Date.now()}`,
      action: 'info_requested',
      performedBy: adminId,
      performedAt: new Timestamp(Math.floor(Date.now() / 1000), 0), // Use current time as Timestamp
      reason: requestMessage,
      ...(adminNotes && { adminNotes }) // Only include if defined
    }
    
    // Update verification - filter out undefined values
    const updatedVerification: CameraVerification = {
      ...currentVerification,
      status: 'requires_info',
      ...(adminNotes && { adminNotes }), // Only include if defined
      publicNotes: requestMessage,
      history: [...currentVerification.history, historyItem]
    }
    
    // Update camera
    await updateDoc(cameraRef, {
      verification: updatedVerification,
      lastUpdated: serverTimestamp()
    })
    
    // TODO: Send notification to user about info request
    
    console.log(`📋 Requested more info for camera: ${cameraId}`)
  } catch (error) {
    console.error('❌ Error requesting verification info:', error)
    throw error
  }
}

/**
 * Batch approve multiple cameras
 */
async function batchApproveCameras(
  cameraIds: string[],
  adminId: string,
  adminNotes?: string
): Promise<{ successful: string[], failed: { id: string, error: string }[] }> {
  const results = {
    successful: [] as string[],
    failed: [] as { id: string, error: string }[]
  }
  
  for (const cameraId of cameraIds) {
    try {
      await approveCameraVerification(cameraId, adminId, adminNotes)
      results.successful.push(cameraId)
    } catch (error: any) {
      results.failed.push({
        id: cameraId,
        error: error.message
      })
    }
  }
  
  return results
}

// ===== VERIFICATION QUEUE MANAGEMENT =====

/**
 * Remove camera from verification queue after processing
 */
async function removeFromVerificationQueue(cameraId: string): Promise<void> {
  try {
    const queueQuery = query(
      collection(db, 'verification_queue'),
      where('cameraId', '==', cameraId)
    )
    
    const snapshot = await getDocs(queueQuery)
    
    for (const doc of snapshot.docs) {
      await deleteDoc(doc.ref)
    }
  } catch (error) {
    console.error('❌ Error removing from verification queue:', error)
    // Don't throw - this is cleanup, shouldn't fail the main operation
  }
}

/**
 * Update verification priority
 */
async function updateVerificationPriority(
  cameraId: string,
  priority: 'low' | 'normal' | 'high' | 'urgent',
  adminId: string
): Promise<void> {
  try {
    const canVerify = await hasPermission(adminId, 'canVerifyCameras')
    if (!canVerify) {
      throw new Error('Insufficient permissions')
    }
    
    // Update camera verification priority
    const cameraRef = doc(db, 'cameras', cameraId)
    await updateDoc(cameraRef, {
      'verification.priority': priority,
      lastUpdated: serverTimestamp()
    })
    
    // Update queue priority
    const queueQuery = query(
      collection(db, 'verification_queue'),
      where('cameraId', '==', cameraId)
    )
    
    const snapshot = await getDocs(queueQuery)
    for (const doc of snapshot.docs) {
      await updateDoc(doc.ref, { priority })
    }
    
    console.log(`✅ Updated verification priority for ${cameraId}: ${priority}`)
  } catch (error) {
    console.error('❌ Error updating verification priority:', error)
    throw error
  }
}

/**
 * Get pending verifications for admin dashboard
 */
async function getPendingVerifications(adminId: string, limitCount: number = 20) {
  try {
    console.log('Getting pending verifications for admin:', adminId, 'limit:', limitCount)
    
    // Simplified query to avoid needing composite index
    // Filter by status only, then sort in JavaScript
    const verificationsQuery = query(
      collection(db, 'verification_queue'),
      where('status', 'in', ['pending', 'requires_info']),
      limit(limitCount * 2) // Get more items since we'll sort in JS
    )

    const snapshot = await getDocs(verificationsQuery)
    console.log('Found verification queue documents:', snapshot.docs.length)
    
    const verifications = []

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data()
      console.log('Processing verification queue item:', data)
      
      // Get camera details
      const cameraRef = doc(db, 'cameras', data.cameraId)
      const cameraDoc = await getDoc(cameraRef)
      
      // Get user details  
      const userRef = doc(db, 'users', data.userId)
      const userDoc = await getDoc(userRef)
      
      if (cameraDoc.exists() && userDoc.exists()) {
        const camera = cameraDoc.data() as RegisteredCamera
        const user = userDoc.data() as UserProfile
        
        console.log('Found camera and user data for:', data.cameraId)
        
        verifications.push({
          id: docSnap.id,
          cameraId: data.cameraId,
          userId: data.userId,
          userEmail: user.email,
          userName: user.displayName || 'Unknown',
          submittedAt: data.submittedAt,
          priority: data.priority || 'normal',
          status: data.status,
          evidence: data.evidence || camera.verification?.evidence,
          location: user.address ? {
            street: user.address.street,
            city: user.address.city,
            postcode: user.address.postcode,
            coordinates: user.address.coordinates // Add user address coordinates
          } : {
            street: 'Unknown',
            city: 'Unknown',
            postcode: 'Unknown',
            coordinates: null
          },
          cameraLocation: {
            coordinates: {
              lat: camera.location.lat,
              lng: camera.location.lng
            },
            displayCoordinates: {
              lat: camera.displayLocation.lat,
              lng: camera.displayLocation.lng
            }
          },
          cameraDetails: {
            name: camera.name,
            type: camera.type,
            model: camera.specifications?.model || 'Unknown',
            brand: camera.specifications?.brand || 'Unknown'
          },
          daysPending: Math.floor((Date.now() - data.submittedAt.toMillis()) / (1000 * 60 * 60 * 24))
        })
      } else {
        console.log('Missing camera or user data for:', data.cameraId, 'camera exists:', cameraDoc.exists(), 'user exists:', userDoc.exists())
      }
    }

    // Sort by submittedAt in JavaScript (oldest first)
    verifications.sort((a, b) => a.submittedAt.toMillis() - b.submittedAt.toMillis())
    
    // Limit results after sorting
    const limitedResults = verifications.slice(0, limitCount)

    console.log('Returning', limitedResults.length, 'verification items')
    return limitedResults
  } catch (error) {
    console.error('❌ Error getting pending verifications:', error)
    throw error
  }
}

// ===== VERIFICATION STATISTICS =====

/**
 * Get verification statistics for admin dashboard
 */
async function getVerificationStats(): Promise<VerificationStats> {
  try {
    // Get all cameras with verification data
    const camerasQuery = query(collection(db, 'cameras'))
    const camerasSnapshot = await getDocs(camerasQuery)
    const cameras = camerasSnapshot.docs.map(doc => doc.data() as RegisteredCamera)
    
    const stats: VerificationStats = {
      totalPending: cameras.filter(c => c.verification?.status === 'pending').length,
      totalApproved: cameras.filter(c => c.verification?.status === 'approved').length,
      totalRejected: cameras.filter(c => c.verification?.status === 'rejected').length,
      averageProcessingTime: 0,
      pendingByPriority: {
        urgent: cameras.filter(c => c.verification?.status === 'pending' && c.verification?.priority === 'urgent').length,
        high: cameras.filter(c => c.verification?.status === 'pending' && c.verification?.priority === 'high').length,
        normal: cameras.filter(c => c.verification?.status === 'pending' && c.verification?.priority === 'normal').length,
        low: cameras.filter(c => c.verification?.status === 'pending' && c.verification?.priority === 'low').length
      },
      monthlyVerifications: {
        approved: 0,
        rejected: 0
      },
      adminProductivity: []
    }
    
    // Calculate average processing time for completed verifications
    const completedCameras = cameras.filter(c => 
      c.verification?.status && 
      ['approved', 'rejected'].includes(c.verification.status) &&
      c.verification.submittedAt &&
      c.verification.verifiedAt
    )
    
    if (completedCameras.length > 0) {
      const totalProcessingTime = completedCameras.reduce((sum, camera) => {
        const submitted = camera.verification!.submittedAt!.toMillis()
        const verified = camera.verification!.verifiedAt!.toMillis()
        return sum + (verified - submitted)
      }, 0)
      
      stats.averageProcessingTime = totalProcessingTime / completedCameras.length / (1000 * 60 * 60) // Convert to hours
    }
    
    // Calculate monthly statistics
    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)
    
    stats.monthlyVerifications.approved = cameras.filter(c => 
      c.verification?.status === 'approved' &&
      c.verification.verifiedAt &&
      c.verification.verifiedAt.toDate() >= currentMonth
    ).length
    
    stats.monthlyVerifications.rejected = cameras.filter(c => 
      c.verification?.status === 'rejected' &&
      c.verification.verifiedAt &&
      c.verification.verifiedAt.toDate() >= currentMonth
    ).length
    
    return stats
  } catch (error) {
    console.error('❌ Error getting verification stats:', error)
    throw error
  }
}

// Export all admin functions
export {
  getUserRole,
  hasPermission,
  isAdmin,
  getDefaultPermissions,
  assignUserRole,
  approveCameraVerification,
  rejectCameraVerification,
  requestVerificationInfo,
  batchApproveCameras,
  removeFromVerificationQueue,
  updateVerificationPriority,
  getPendingVerifications,
  getVerificationStats
}
