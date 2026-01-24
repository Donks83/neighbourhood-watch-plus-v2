import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore'
import { db } from './firebase'
import type { 
  CameraVerification, 
  VerificationStatus, 
  VerificationEvidence,
  VerificationHistoryItem,
  RejectionReason,
  EnhancedTrustScore,
  TrustScoreBreakdown,
  TrustScoreHistory,
  TrustBadge
} from '@/types/verification'
import type { RegisteredCamera, UserProfile } from '@/types/camera'

// ===== CAMERA VERIFICATION OPERATIONS =====

/**
 * Submit a camera for verification
 */
async function submitCameraForVerification(
  cameraId: string,
  userId: string,
  evidence: VerificationEvidence
): Promise<void> {
  try {
    const cameraRef = doc(db, 'cameras', cameraId)
    const cameraDoc = await getDoc(cameraRef)
    
    if (!cameraDoc.exists()) {
      throw new Error('Camera not found')
    }

    // Use regular Timestamp for history items (serverTimestamp not allowed in arrays)
    const now = Timestamp.fromDate(new Date())
    
    const historyItem: VerificationHistoryItem = {
      id: `submit-${Date.now()}`,
      action: 'submitted',
      performedBy: userId,
      performedAt: now,
      evidence
    }

    const verification: CameraVerification = {
      status: 'pending' as VerificationStatus,
      submittedAt: serverTimestamp() as Timestamp,
      evidence,
      history: [historyItem],
      priority: 'normal'
    }

    // Update camera with verification data
    await updateDoc(cameraRef, {
      verification,
      lastUpdated: serverTimestamp()
    })

    // Add to verification queue for admin efficiency
    await addDoc(collection(db, 'verification_queue'), {
      cameraId,
      userId,
      status: 'pending',
      submittedAt: serverTimestamp(),
      priority: 'normal',
      evidence
    })

    console.log(`✅ Camera ${cameraId} submitted for verification`)
  } catch (error) {
    console.error('❌ Error submitting camera for verification:', error)
    throw error
  }
}

/**
 * Get camera verification status
 */
async function getCameraVerificationStatus(cameraId: string): Promise<CameraVerification | null> {
  try {
    const cameraRef = doc(db, 'cameras', cameraId)
    const cameraDoc = await getDoc(cameraRef)
    
    if (!cameraDoc.exists()) {
      return null
    }

    const camera = cameraDoc.data() as RegisteredCamera
    return camera.verification || null
  } catch (error) {
    console.error('❌ Error getting camera verification status:', error)
    return null
  }
}

/**
 * Update verification evidence (user can add more photos/notes)
 */
async function updateVerificationEvidence(
  cameraId: string,
  userId: string,
  additionalEvidence: Partial<VerificationEvidence>
): Promise<void> {
  try {
    const cameraRef = doc(db, 'cameras', cameraId)
    const cameraDoc = await getDoc(cameraRef)
    
    if (!cameraDoc.exists()) {
      throw new Error('Camera not found')
    }

    const camera = cameraDoc.data() as RegisteredCamera
    const currentVerification = camera.verification

    if (!currentVerification) {
      throw new Error('Camera not submitted for verification')
    }

    if (currentVerification.verifiedBy) {
      throw new Error('Cannot update evidence after verification is complete')
    }

    // Merge additional evidence with existing
    const updatedEvidence: VerificationEvidence = {
      photos: [...(currentVerification.evidence.photos || []), ...(additionalEvidence.photos || [])],
      documents: [...(currentVerification.evidence.documents || []), ...(additionalEvidence.documents || [])],
      userNotes: additionalEvidence.userNotes || currentVerification.evidence.userNotes,
      installationDate: additionalEvidence.installationDate || currentVerification.evidence.installationDate,
      purchaseReceipt: additionalEvidence.purchaseReceipt || currentVerification.evidence.purchaseReceipt
    }

    // Add history item
    const historyItem: VerificationHistoryItem = {
      id: `update-${Date.now()}`,
      action: 'resubmitted',
      performedBy: userId,
      performedAt: serverTimestamp() as Timestamp,
      evidence: additionalEvidence
    }

    const updatedVerification: CameraVerification = {
      ...currentVerification,
      evidence: updatedEvidence,
      history: [...currentVerification.history, historyItem]
    }

    await updateDoc(cameraRef, {
      verification: updatedVerification,
      lastUpdated: serverTimestamp()
    })

    console.log(`✅ Updated verification evidence for camera ${cameraId}`)
  } catch (error) {
    console.error('❌ Error updating verification evidence:', error)
    throw error
  }
}

// ===== TRUST SCORE CALCULATION v2.0 =====

/**
 * Calculate enhanced trust score for a user
 */
async function calculateTrustScoreV2(userId: string): Promise<EnhancedTrustScore> {
  try {
    // Get user's cameras
    const camerasQuery = query(
      collection(db, 'cameras'),
      where('userId', '==', userId)
    )
    const camerasSnapshot = await getDocs(camerasQuery)
    const cameras = camerasSnapshot.docs.map(doc => doc.data() as RegisteredCamera)

    // Get user profile for additional data
    const userRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userRef)
    const userProfile = userDoc.data() as UserProfile

    // Calculate breakdown
    const breakdown: TrustScoreBreakdown = {
      base: 50,
      verifiedCameras: 0,
      communityParticipation: 0,
      successfulRequests: 0,
      accountAge: 0,
      penalties: 0,
      total: 0
    }

    // Count verified cameras (+15 each, max 5 cameras)
    const verifiedCameras = cameras.filter(c => c.verification?.status === 'approved')
    breakdown.verifiedCameras = Math.min(verifiedCameras.length * 15, 75)

    // Count rejected cameras (-10 each)
    const rejectedCameras = cameras.filter(c => c.verification?.status === 'rejected')
    breakdown.penalties -= rejectedCameras.length * 10

    // Community participation (+10 if active)
    if (userProfile?.stats && userProfile.stats.requestsMade > 0) {
      breakdown.communityParticipation = 10
    }

    // Successful footage sharing (+5 per successful share, max 25)
    const footageShared = userProfile?.stats?.footageShared || 0
    breakdown.successfulRequests = Math.min(footageShared * 5, 25)

    // Account age bonus (+5 after 6 months)
    if (userProfile?.createdAt) {
      const accountAgeMonths = (Date.now() - userProfile.createdAt.toMillis()) / (1000 * 60 * 60 * 24 * 30)
      if (accountAgeMonths >= 6) {
        breakdown.accountAge = 5
      }
    }

    // Calculate total (max 100)
    breakdown.total = Math.min(
      Math.max(
        breakdown.base + 
        breakdown.verifiedCameras + 
        breakdown.communityParticipation + 
        breakdown.successfulRequests + 
        breakdown.accountAge + 
        breakdown.penalties,
        0 // Minimum score is 0
      ), 
      100 // Maximum score is 100
    )

    // Determine trust level
    let level: EnhancedTrustScore['level'] = 'new'
    if (breakdown.total >= 80) level = 'platinum'
    else if (breakdown.total >= 70) level = 'gold'  
    else if (breakdown.total >= 55) level = 'silver'
    else if (breakdown.total >= 40) level = 'bronze'

    // Generate appropriate badges
    const badges: TrustBadge[] = []
    const currentTime = new Timestamp(Math.floor(Date.now() / 1000), 0) // Use regular Timestamp
    
    if (verifiedCameras.length >= 1) {
      badges.push({
        id: 'first-camera',
        name: 'First Camera',
        description: 'Successfully verified your first camera',
        icon: 'camera',
        earnedAt: currentTime, // Use regular Timestamp instead of serverTimestamp()
        criteria: 'Verified 1+ cameras'
      })
    }

    if (verifiedCameras.length >= 3) {
      badges.push({
        id: 'security-guardian',
        name: 'Security Guardian',
        description: 'Verified 3+ cameras in your community',
        icon: 'shield',
        earnedAt: currentTime, // Use regular Timestamp instead of serverTimestamp()
        criteria: 'Verified 3+ cameras'
      })
    }

    if (footageShared >= 5) {
      badges.push({
        id: 'helpful-neighbor',
        name: 'Helpful Neighbor',
        description: 'Shared footage to help 5+ community members',
        icon: 'heart',
        earnedAt: currentTime, // Use regular Timestamp instead of serverTimestamp()
        criteria: 'Shared footage 5+ times'
      })
    }

    // Get existing trust score history or create new
    const existingTrustScore = userProfile?.enhancedTrustScore
    const history: TrustScoreHistory[] = existingTrustScore?.history || []

    // Add history entry if score changed
    if (!existingTrustScore || existingTrustScore.current !== breakdown.total) {
      history.push({
        date: currentTime, // Use regular Timestamp instead of serverTimestamp()
        previousScore: existingTrustScore?.current || 50,
        newScore: breakdown.total,
        reason: 'Recalculated based on verification activity',
        details: `Verified cameras: ${verifiedCameras.length}, Rejected: ${rejectedCameras.length}`
      })
    }

    const enhancedTrustScore: EnhancedTrustScore = {
      current: breakdown.total,
      breakdown,
      history,
      lastCalculated: serverTimestamp() as Timestamp,
      level,
      badges
    }

    return enhancedTrustScore
  } catch (error) {
    console.error('❌ Error calculating trust score:', error)
    throw error
  }
}

/**
 * Update user's trust score in Firestore
 */
async function updateUserTrustScore(userId: string, reason?: string): Promise<void> {
  try {
    const enhancedTrustScore = await calculateTrustScoreV2(userId)
    
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      enhancedTrustScore,
      lastActiveAt: serverTimestamp()
    })

    console.log(`✅ Updated trust score for user ${userId}: ${enhancedTrustScore.current}`)
  } catch (error) {
    console.error('❌ Error updating trust score:', error)
    throw error
  }
}

// ===== VERIFICATION QUEUE MANAGEMENT =====

/**
 * Get pending verifications for admin dashboard
 */
async function getPendingVerifications(adminId: string, limitCount: number = 20) {
  try {
    const verificationsQuery = query(
      collection(db, 'verification_queue'),
      where('status', 'in', ['pending', 'requires_info']),
      orderBy('submittedAt', 'asc'),
      limit(limitCount)
    )

    const snapshot = await getDocs(verificationsQuery)
    const verifications = []

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data()
      
      // Get camera details
      const cameraRef = doc(db, 'cameras', data.cameraId)
      const cameraDoc = await getDoc(cameraRef)
      
      // Get user details  
      const userRef = doc(db, 'users', data.userId)
      const userDoc = await getDoc(userRef)
      
      if (cameraDoc.exists() && userDoc.exists()) {
        const camera = cameraDoc.data() as RegisteredCamera
        const user = userDoc.data() as UserProfile
        
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
            postcode: user.address.postcode
          } : {},
          cameraDetails: {
            name: camera.name,
            type: camera.type,
            model: camera.specifications?.model,
            brand: camera.specifications?.brand
          },
          daysPending: Math.floor((Date.now() - data.submittedAt.toMillis()) / (1000 * 60 * 60 * 24))
        })
      }
    }

    return verifications
  } catch (error) {
    console.error('❌ Error getting pending verifications:', error)
    throw error
  }
}

/**
 * Auto-submit camera for verification when created
 */
async function autoSubmitNewCameraForVerification(
  camera: RegisteredCamera,
  evidence?: VerificationEvidence
): Promise<void> {
  const defaultEvidence: VerificationEvidence = {
    userNotes: 'Automatically submitted upon camera registration',
    ...evidence
  }

  await submitCameraForVerification(camera.id, camera.userId, defaultEvidence)
}

// Export all verification functions
export {
  submitCameraForVerification,
  getCameraVerificationStatus,
  updateVerificationEvidence,
  calculateTrustScoreV2,
  updateUserTrustScore,
  getPendingVerifications,
  autoSubmitNewCameraForVerification
}
