/**
 * Account Deletion Service
 * Handles complete user account deletion with data cascade
 * GDPR compliant - removes all user data
 */

import { 
  deleteUser,
  type User 
} from 'firebase/auth'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc,
  doc,
  writeBatch
} from 'firebase/firestore'
import { auth, db } from './firebase'

export interface DeletionSummary {
  cameras: number
  sentRequests: number
  receivedResponses: number
  temporaryMarkers: number
  notifications: number
  archivedRequests: number
}

/**
 * Get a summary of all data that will be deleted
 */
export async function getAccountDeletionSummary(userId: string): Promise<DeletionSummary> {
  try {
    // Count cameras
    const camerasQuery = query(collection(db, 'cameras'), where('userId', '==', userId))
    const camerasSnapshot = await getDocs(camerasQuery)
    
    // Count sent requests
    const sentRequestsQuery = query(collection(db, 'footageRequests'), where('requesterId', '==', userId))
    const sentRequestsSnapshot = await getDocs(sentRequestsQuery)
    
    // Count received responses (requests where user owns a camera)
    const cameraIds = camerasSnapshot.docs.map(doc => doc.id)
    let receivedResponsesCount = 0
    if (cameraIds.length > 0) {
      const receivedQuery = query(
        collection(db, 'footageRequests'),
        where('targetCameraIds', 'array-contains-any', cameraIds.slice(0, 10)) // Firestore limit
      )
      const receivedSnapshot = await getDocs(receivedQuery)
      receivedResponsesCount = receivedSnapshot.size
    }
    
    // Count temporary markers
    const markersQuery = query(collection(db, 'temporaryEvidenceMarkers'), where('ownerId', '==', userId))
    const markersSnapshot = await getDocs(markersQuery)
    
    // Count notifications
    const notifsQuery = query(collection(db, 'notifications'), where('userId', '==', userId))
    const notifsSnapshot = await getDocs(notifsQuery)
    
    // Count archived requests
    const archivedQuery = query(collection(db, 'archivedRequests'), where('userId', '==', userId))
    const archivedSnapshot = await getDocs(archivedQuery)
    
    return {
      cameras: camerasSnapshot.size,
      sentRequests: sentRequestsSnapshot.size,
      receivedResponses: receivedResponsesCount,
      temporaryMarkers: markersSnapshot.size,
      notifications: notifsSnapshot.size,
      archivedRequests: archivedSnapshot.size
    }
  } catch (error) {
    console.error('Error getting deletion summary:', error)
    throw error
  }
}

/**
 * Delete all user data and account
 * This is irreversible and GDPR compliant
 */
export async function deleteUserAccount(userId: string, user: User): Promise<void> {
  try {
    console.log(`🗑️ Starting account deletion for user ${userId}`)
    
    // Use batched writes for better performance
    const batch = writeBatch(db)
    
    // 1. Delete all cameras
    const camerasQuery = query(collection(db, 'cameras'), where('userId', '==', userId))
    const camerasSnapshot = await getDocs(camerasQuery)
    console.log(`  📷 Deleting ${camerasSnapshot.size} cameras`)
    camerasSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref)
    })
    
    // 2. Delete all sent footage requests
    const sentRequestsQuery = query(collection(db, 'footageRequests'), where('requesterId', '==', userId))
    const sentRequestsSnapshot = await getDocs(sentRequestsQuery)
    console.log(`  📝 Deleting ${sentRequestsSnapshot.size} sent requests`)
    sentRequestsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref)
    })
    
    // 3. Delete responses from requests where user was a camera owner
    // Note: We're not deleting entire requests, just removing this user's responses
    const cameraIds = camerasSnapshot.docs.map(doc => doc.id)
    if (cameraIds.length > 0) {
      // Process in chunks of 10 (Firestore limit for array-contains-any)
      for (let i = 0; i < cameraIds.length; i += 10) {
        const chunk = cameraIds.slice(i, i + 10)
        const receivedQuery = query(
          collection(db, 'footageRequests'),
          where('targetCameraIds', 'array-contains-any', chunk)
        )
        const receivedSnapshot = await getDocs(receivedQuery)
        console.log(`  📥 Processing ${receivedSnapshot.size} received requests (chunk ${Math.floor(i/10) + 1})`)
        
        // For each request, remove this user's camera responses
        receivedSnapshot.docs.forEach(requestDoc => {
          const requestData = requestDoc.data()
          const responses = requestData.responses || []
          
          // Filter out responses from deleted cameras
          const updatedResponses = responses.filter((r: any) => 
            !cameraIds.includes(r.cameraId)
          )
          
          // Update or delete the request
          if (updatedResponses.length === 0 && requestData.requesterId !== userId) {
            // If no responses left and user didn't create it, just remove camera IDs
            const updatedCameraIds = (requestData.targetCameraIds || []).filter(
              (id: string) => !cameraIds.includes(id)
            )
            if (updatedCameraIds.length > 0) {
              batch.update(requestDoc.ref, {
                targetCameraIds: updatedCameraIds,
                responses: []
              })
            }
          }
        })
      }
    }
    
    // 4. Delete all temporary evidence markers
    const markersQuery = query(collection(db, 'temporaryEvidenceMarkers'), where('ownerId', '==', userId))
    const markersSnapshot = await getDocs(markersQuery)
    console.log(`  🎯 Deleting ${markersSnapshot.size} temporary markers`)
    markersSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref)
    })
    
    // 5. Delete all notifications
    const notifsQuery = query(collection(db, 'notifications'), where('userId', '==', userId))
    const notifsSnapshot = await getDocs(notifsQuery)
    console.log(`  🔔 Deleting ${notifsSnapshot.size} notifications`)
    notifsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref)
    })
    
    // 6. Delete all archived requests
    const archivedQuery = query(collection(db, 'archivedRequests'), where('userId', '==', userId))
    const archivedSnapshot = await getDocs(archivedQuery)
    console.log(`  📦 Deleting ${archivedSnapshot.size} archived requests`)
    archivedSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref)
    })
    
    // 7. Delete user profile document
    console.log(`  👤 Deleting user profile`)
    batch.delete(doc(db, 'users', userId))
    
    // Commit all Firestore deletions
    console.log(`  💾 Committing Firestore deletions...`)
    await batch.commit()
    
    // 8. Delete Firebase Auth account (must be last)
    console.log(`  🔐 Deleting Firebase Auth account...`)
    await deleteUser(user)
    
    console.log(`✅ Account deletion complete for user ${userId}`)
  } catch (error) {
    console.error('❌ Error deleting account:', error)
    throw error
  }
}
