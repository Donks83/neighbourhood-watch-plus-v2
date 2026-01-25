/**
 * Super Admin Functions
 * System-wide user and camera management
 */

import { db } from './firebase'
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  Timestamp,
  setDoc
} from 'firebase/firestore'
import type { RegisteredCamera } from '@/types/camera'

export interface UserData {
  uid: string
  email: string
  displayName: string
  role: string
  createdAt: Date
  cameraCount: number
  trustScore: number
}

export interface CameraWithOwner extends Omit<RegisteredCamera, 'createdAt' | 'lastUpdated'> {
  ownerEmail: string
  ownerName: string
  createdAt: Date
  lastUpdated: Date
}

/**
 * Get all users in the system
 */
export async function getAllUsers(): Promise<UserData[]> {
  try {
    const usersRef = collection(db, 'users')
    const snapshot = await getDocs(usersRef)
    
    const users: UserData[] = []
    
    for (const userDoc of snapshot.docs) {
      const data = userDoc.data()
      
      // Count cameras for this user
      const camerasRef = collection(db, 'cameras')
      const camerasQuery = query(camerasRef, where('userId', '==', userDoc.id))
      const camerasSnapshot = await getDocs(camerasQuery)
      
      users.push({
        uid: userDoc.id,
        email: data.email || '',
        displayName: data.displayName || 'Unknown',
        role: data.role || 'user',
        createdAt: data.createdAt?.toDate() || new Date(),
        cameraCount: camerasSnapshot.size,
        trustScore: data.trustScore || 50
      })
    }
    
    // Sort by creation date (newest first)
    return users.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  } catch (error) {
    console.error('Error getting all users:', error)
    throw error
  }
}

/**
 * Get all cameras with owner information
 */
export async function getAllCameras(): Promise<CameraWithOwner[]> {
  try {
    const camerasRef = collection(db, 'cameras')
    const snapshot = await getDocs(camerasRef)
    
    const cameras: CameraWithOwner[] = []
    
    for (const cameraDoc of snapshot.docs) {
      const data = cameraDoc.data()
      
      // Get owner info
      const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', data.userId)))
      const userData = userDoc.docs[0]?.data()
      
      cameras.push({
        ...data,
        id: cameraDoc.id,
        location: {
          lat: data.location?.latitude || 0,
          lng: data.location?.longitude || 0
        },
        displayLocation: {
          lat: data.displayLocation?.latitude || 0,
          lng: data.displayLocation?.longitude || 0
        },
        createdAt: data.createdAt?.toDate() || new Date(),
        lastUpdated: data.lastUpdated?.toDate() || new Date(),
        ownerEmail: userData?.email || data.userEmail || 'Unknown',
        ownerName: userData?.displayName || 'Unknown',
        verification: data.verification || {
          status: 'pending',
          submittedAt: data.createdAt || Timestamp.now(),
          evidence: { userNotes: 'Legacy camera' },
          history: [],
          priority: 'normal'
        }
      } as CameraWithOwner)
    }
    
    // Sort by creation date (newest first)
    return cameras.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  } catch (error) {
    console.error('Error getting all cameras:', error)
    throw error
  }
}

/**
 * Update a user's role
 */
export async function updateUserRole(
  userId: string, 
  newRole: 'user' | 'admin' | 'super_admin' | 'police' | 'insurance'
): Promise<void> {
  try {
    // Update in users collection
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, { role: newRole })
    
    // Update in user_roles collection
    const roleRef = doc(db, 'user_roles', userId)
    await setDoc(roleRef, { role: newRole }, { merge: true })
    
    console.log(`✅ Updated role for user ${userId} to ${newRole}`)
  } catch (error) {
    console.error('Error updating user role:', error)
    throw error
  }
}

/**
 * Delete a user and all their data
 */
export async function deleteUser(userId: string): Promise<void> {
  try {
    // Delete all user's cameras
    const camerasRef = collection(db, 'cameras')
    const camerasQuery = query(camerasRef, where('userId', '==', userId))
    const camerasSnapshot = await getDocs(camerasQuery)
    
    const deletePromises = camerasSnapshot.docs.map(doc => deleteDoc(doc.ref))
    await Promise.all(deletePromises)
    
    // Delete user role
    const roleRef = doc(db, 'user_roles', userId)
    await deleteDoc(roleRef)
    
    // Delete user profile
    const userRef = doc(db, 'users', userId)
    await deleteDoc(userRef)
    
    // Note: This doesn't delete the Firebase Auth account
    // That requires Firebase Admin SDK on the backend
    
    console.log(`✅ Deleted user ${userId} and all associated data`)
  } catch (error) {
    console.error('Error deleting user:', error)
    throw error
  }
}

/**
 * Delete a camera
 */
export async function deleteCamera(cameraId: string): Promise<void> {
  try {
    const cameraRef = doc(db, 'cameras', cameraId)
    await deleteDoc(cameraRef)
    
    console.log(`✅ Deleted camera ${cameraId}`)
  } catch (error) {
    console.error('Error deleting camera:', error)
    throw error
  }
}

/**
 * Get system-wide statistics
 */
export async function getSystemStats() {
  try {
    const [users, cameras] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'cameras')),
    ])
    
    return {
      totalUsers: users.size,
      totalCameras: cameras.size,
      activeCameras: cameras.docs.filter(doc => doc.data().status === 'active').length,
      verifiedCameras: cameras.docs.filter(doc => doc.data().verification?.status === 'approved').length,
    }
  } catch (error) {
    console.error('Error getting system stats:', error)
    throw error
  }
}
