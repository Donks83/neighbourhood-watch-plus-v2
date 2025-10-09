import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  GeoPoint,
  Timestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { RegisteredCamera, UserProfile } from '@/types/camera'
import type { Location, IncidentFormData, FootageRequest } from '@/types'

// ==========================================
// USER OPERATIONS
// ==========================================

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', uid)
    const userSnap = await getDoc(userRef)
    
    if (userSnap.exists()) {
      return userSnap.data() as UserProfile
    }
    return null
  } catch (error) {
    console.error('❌ Error fetching user profile:', error)
    throw error
  }
}

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid)
    await updateDoc(userRef, {
      ...data,
      lastActiveAt: serverTimestamp()
    })
    console.log('✅ User profile updated successfully')
  } catch (error) {
    console.error('❌ Error updating user profile:', error)
    throw error
  }
}

// ==========================================
// CAMERA OPERATIONS
// ==========================================

export const saveCamera = async (camera: RegisteredCamera): Promise<string> => {
  try {
    // Convert location to GeoPoint for Firestore
    const cameraData = {
      ...camera,
      location: new GeoPoint(camera.location.lat, camera.location.lng),
      displayLocation: new GeoPoint(camera.displayLocation.lat, camera.displayLocation.lng),
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp(),
      // Add geohash for location-based queries
      locationGeohash: generateGeohash(camera.location.lat, camera.location.lng),
      displayLocationGeohash: generateGeohash(camera.displayLocation.lat, camera.displayLocation.lng),
      
      // Ensure verification object exists (cameras default to pending)
      verification: camera.verification || {
        status: 'pending',
        submittedAt: serverTimestamp(),
        evidence: {
          userNotes: 'Camera registered through property dashboard'
        },
        history: [{
          id: `submit-${Date.now()}`,
          action: 'submitted',
          performedBy: camera.userId,
          performedAt: serverTimestamp(),
          evidence: {
            userNotes: 'Camera registered through property dashboard'
          }
        }],
        priority: 'normal'
      }
    }

    const cameraRef = doc(db, 'cameras', camera.id)
    await setDoc(cameraRef, cameraData)
    
    // Add to verification queue for admin efficiency
    if (camera.verification?.status === 'pending') {
      try {
        await addDoc(collection(db, 'verification_queue'), {
          cameraId: camera.id,
          userId: camera.userId,
          status: 'pending',
          submittedAt: serverTimestamp(),
          priority: camera.verification.priority || 'normal',
          evidence: camera.verification.evidence || {}
        })
      } catch (error) {
        console.warn('⚠️ Warning: Failed to add to verification queue:', error)
        // Don't fail camera save if queue addition fails
      }
    }

    // Update user stats
    await updateUserStats(camera.userId, { camerasRegistered: 1 })
    
    // Update trust score after camera submission
    try {
      const { updateUserTrustScore } = await import('./verification')
      await updateUserTrustScore(camera.userId, 'Camera submitted for verification')
    } catch (error) {
      console.warn('⚠️ Warning: Failed to update trust score:', error)
      // Don't fail camera save if trust score update fails
    }

    console.log('✅ Camera saved to Firestore with verification:', camera.id)
    return camera.id
  } catch (error) {
    console.error('❌ Error saving camera to Firestore:', error)
    throw error
  }
}

export const getUserCameras = async (userId: string): Promise<RegisteredCamera[]> => {
  try {
    const camerasRef = collection(db, 'cameras')
    // Use existing index: status, userId, createdAt
    const q = query(
      camerasRef,
      where('status', 'in', ['active', 'inactive', 'maintenance']),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )
    
    const querySnapshot = await getDocs(q)
    const cameras: RegisteredCamera[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      
      // Convert GeoPoints back to Location objects
      cameras.push({
        ...data,
        id: doc.id,
        location: {
          lat: data.location.latitude,
          lng: data.location.longitude
        },
        displayLocation: {
          lat: data.displayLocation.latitude,
          lng: data.displayLocation.longitude
        },
        createdAt: data.createdAt?.toDate() || new Date(),
        lastUpdated: data.lastUpdated?.toDate() || new Date(),
        
        // Handle legacy cameras without verification data
        verification: data.verification || {
          status: 'pending',
          submittedAt: data.createdAt || serverTimestamp(),
          evidence: {
            userNotes: 'Legacy camera - verification data added during migration'
          },
          history: [],
          priority: 'normal'
        },
        
        // Use status field (matches your existing data)
        operationalStatus: data.status || 'active'
      } as RegisteredCamera)
    })

    return cameras
  } catch (error) {
    console.error('❌ Error fetching user cameras:', error)
    throw error
  }
}

export const getNearbyCameras = async (location: Location, radiusKm: number = 1): Promise<RegisteredCamera[]> => {
  try {
    // For now, get all active cameras and filter by distance
    // TODO: Implement proper geospatial queries with geohash
    const camerasRef = collection(db, 'cameras')
    const q = query(
      camerasRef,
      where('status', '==', 'active'),
      where('privacySettings.shareWithCommunity', '==', true)
    )
    
    const querySnapshot = await getDocs(q)
    const cameras: RegisteredCamera[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      const cameraLocation = {
        lat: data.displayLocation.latitude, // Use fuzzy location for privacy
        lng: data.displayLocation.longitude
      }
      
      // Calculate distance
      const distance = calculateDistance(location, cameraLocation)
      
      if (distance <= radiusKm) {
        cameras.push({
          ...data,
          id: doc.id,
          location: {
            lat: data.location.latitude,
            lng: data.location.longitude
          },
          displayLocation: cameraLocation,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastUpdated: data.lastUpdated?.toDate() || new Date()
        } as RegisteredCamera)
      }
    })

    return cameras
  } catch (error) {
    console.error('❌ Error fetching nearby cameras:', error)
    throw error
  }
}

export const updateCamera = async (cameraId: string, updates: Partial<RegisteredCamera>): Promise<void> => {
  try {
    const cameraRef = doc(db, 'cameras', cameraId)
    const updateData: any = {
      ...updates,
      lastUpdated: serverTimestamp()
    }
    
    // Handle location updates - convert to GeoPoint for Firestore
    if (updates.location) {
      updateData.location = new GeoPoint(updates.location.lat, updates.location.lng)
      updateData.locationGeohash = generateGeohash(updates.location.lat, updates.location.lng)
    }
    if (updates.displayLocation) {
      updateData.displayLocation = new GeoPoint(updates.displayLocation.lat, updates.displayLocation.lng)
      updateData.displayLocationGeohash = generateGeohash(updates.displayLocation.lat, updates.displayLocation.lng)
    }

    await updateDoc(cameraRef, updateData)
    console.log('✅ Camera updated successfully:', cameraId)
  } catch (error) {
    console.error('❌ Error updating camera:', error)
    throw error
  }
}

export const deleteCamera = async (cameraId: string, userId: string): Promise<void> => {
  try {
    const cameraRef = doc(db, 'cameras', cameraId)
    
    // Soft delete by updating status
    await updateDoc(cameraRef, {
      status: 'deleted',
      lastUpdated: serverTimestamp()
    })

    // Update user stats
    await updateUserStats(userId, { camerasRegistered: -1 })

    console.log('✅ Camera deleted successfully:', cameraId)
  } catch (error) {
    console.error('❌ Error deleting camera:', error)
    throw error
  }
}

// ==========================================
// SECURITY: REGENERATE FUZZY LOCATIONS
// ==========================================

/**
 * Regenerate fuzzy locations for all user cameras with new cryptographic randomization
 * This fixes the predictable pattern issue by recalculating displayLocation
 */
export const regenerateCameraFuzzyLocations = async (userId: string): Promise<void> => {
  try {
    console.log('🔄 Regenerating fuzzy locations with new cryptographic randomization...')
    
    // Import the new fuzzy location function
    const { fuzzyLocation } = await import('./camera-utils')
    
    // Get all user cameras
    const userCameras = await getUserCameras(userId)
    
    if (userCameras.length === 0) {
      console.log('ℹ️ No cameras found for user')
      return
    }
    
    // Update each camera with new cryptographically random fuzzy location (25m radius for optimal privacy/utility balance)
    const updatePromises = userCameras.map(async (camera) => {
      const newDisplayLocation = fuzzyLocation(camera.location, 25)
      
      const cameraRef = doc(db, 'cameras', camera.id)
      await updateDoc(cameraRef, {
        displayLocation: new GeoPoint(newDisplayLocation.lat, newDisplayLocation.lng),
        displayLocationGeohash: generateGeohash(newDisplayLocation.lat, newDisplayLocation.lng),
        lastUpdated: serverTimestamp(),
        // Add a flag to track that this was regenerated
        fuzzyLocationRegenerated: true,
        fuzzyLocationRegeneratedAt: serverTimestamp()
      })
      
      console.log(`✅ Updated fuzzy location for camera: ${camera.name}`)
    })
    
    await Promise.all(updatePromises)
    
    console.log(`🔐 Successfully regenerated fuzzy locations for ${userCameras.length} cameras with cryptographic randomization`)
  } catch (error) {
    console.error('❌ Error regenerating fuzzy locations:', error)
    throw error
  }
}

/**
 * Regenerate fuzzy locations for ALL cameras in the system (admin function)
 * WARNING: This is a heavy operation that should be run carefully
 */
export const regenerateAllCameraFuzzyLocations = async (): Promise<void> => {
  try {
    console.log('🔄 ADMIN: Regenerating fuzzy locations for ALL cameras...')
    
    const { fuzzyLocation } = await import('./camera-utils')
    
    const camerasRef = collection(db, 'cameras')
    const q = query(
      camerasRef,
      where('status', 'in', ['active', 'inactive', 'maintenance'])
    )
    
    const querySnapshot = await getDocs(q)
    let updatedCount = 0
    
    // Process in batches to avoid overwhelming Firestore
    const batchSize = 10
    const cameras: any[] = []
    
    querySnapshot.forEach((doc) => {
      cameras.push({ id: doc.id, data: doc.data() })
    })
    
    for (let i = 0; i < cameras.length; i += batchSize) {
      const batch = cameras.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async ({ id, data }) => {
        const originalLocation = {
          lat: data.location.latitude,
          lng: data.location.longitude
        }
        
        const newDisplayLocation = fuzzyLocation(originalLocation, 25)
        
        const cameraRef = doc(db, 'cameras', id)
        await updateDoc(cameraRef, {
          displayLocation: new GeoPoint(newDisplayLocation.lat, newDisplayLocation.lng),
          displayLocationGeohash: generateGeohash(newDisplayLocation.lat, newDisplayLocation.lng),
          lastUpdated: serverTimestamp(),
          fuzzyLocationRegenerated: true,
          fuzzyLocationRegeneratedAt: serverTimestamp()
        })
        
        updatedCount++
      })
      
      await Promise.all(batchPromises)
      console.log(`✅ Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(cameras.length / batchSize)}`)
      
      // Small delay between batches to be gentle on Firestore
      if (i + batchSize < cameras.length) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    console.log(`🔐 ADMIN: Successfully regenerated fuzzy locations for ${updatedCount} cameras`)
  } catch (error) {
    console.error('❌ Error regenerating all fuzzy locations:', error)
    throw error
  }
}

// ==========================================
// INCIDENT/REQUEST OPERATIONS
// ==========================================

export const submitIncidentReport = async (
  userId: string,
  userEmail: string,
  location: Location,
  incidentData: IncidentFormData
): Promise<string> => {
  try {
    const requestData = {
      requesterId: userId,
      requesterEmail: userEmail,
      location: new GeoPoint(location.lat, location.lng),
      locationGeohash: generateGeohash(location.lat, location.lng),
      incident: {
        type: incidentData.incidentType,
        dateTime: incidentData.incidentDateTime,
        description: incidentData.description
      },
      searchRadius: incidentData.requestRadius,
      status: 'active',
      createdAt: serverTimestamp(),
      expiresAt: new Timestamp(
        Math.floor((Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000), 0 // 7 days from now
      ),
      responses: [],
      metadata: {
        ipAddress: '', // Will be set by Cloud Functions
        userAgent: navigator.userAgent,
        location: 'UK' // General area
      }
    }

    const requestsRef = collection(db, 'requests')
    const docRef = await addDoc(requestsRef, requestData)

    // Update user stats
    await updateUserStats(userId, { requestsMade: 1 })

    // TODO: Trigger Cloud Function to notify nearby camera owners
    console.log('✅ Incident report submitted:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('❌ Error submitting incident report:', error)
    throw error
  }
}

export const getUserRequests = async (userId: string): Promise<FootageRequest[]> => {
  try {
    const requestsRef = collection(db, 'requests')
    const q = query(
      requestsRef,
      where('requesterId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    )
    
    const querySnapshot = await getDocs(q)
    const requests: FootageRequest[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      requests.push({
        id: doc.id,
        requesterId: data.requesterId,
        requesterEmail: data.requesterEmail,
        incidentLocation: {
          lat: data.location.latitude,
          lng: data.location.longitude
        },
        incidentType: data.incident?.type || 'other',
        incidentDateTime: data.incident?.dateTime || data.createdAt,
        description: data.incident?.description || '',
        requestRadius: data.searchRadius || 100,
        status: data.status,
        responses: data.responses || [],
        createdAt: data.createdAt,
        expiresAt: data.expiresAt
      } as FootageRequest)
    })

    return requests
  } catch (error) {
    console.error('❌ Error fetching user requests:', error)
    throw error
  }
}

export const getRequestsForCameraOwner = async (userId: string): Promise<FootageRequest[]> => {
  try {
    // Get user's cameras first
    const userCameras = await getUserCameras(userId)
    
    if (userCameras.length === 0) {
      return []
    }

    // Get requests near user's cameras
    // TODO: Implement proper geospatial queries
    const requestsRef = collection(db, 'requests')
    const q = query(
      requestsRef,
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(100)
    )
    
    const querySnapshot = await getDocs(q)
    const relevantRequests: FootageRequest[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      const requestLocation = {
        lat: data.location.latitude,
        lng: data.location.longitude
      }

      // Check if any of user's cameras are within range
      const isWithinRange = userCameras.some(camera => {
        const distance = calculateDistance(requestLocation, camera.location) * 1000 // Convert to meters
        return distance <= camera.privacySettings.maxRequestRadius
      })

      if (isWithinRange) {
        relevantRequests.push({
          id: doc.id,
          requesterId: data.requesterId,
          requesterEmail: data.requesterEmail,
          incidentLocation: requestLocation,
          incidentType: data.incident?.type || 'other',
          incidentDateTime: data.incident?.dateTime || data.createdAt,
          description: data.incident?.description || '',
          requestRadius: data.searchRadius || 100,
          status: data.status,
          responses: data.responses || [],
          createdAt: data.createdAt,
          expiresAt: data.expiresAt
        } as FootageRequest)
      }
    })

    return relevantRequests
  } catch (error) {
    console.error('❌ Error fetching requests for camera owner:', error)
    throw error
  }
}

// GLOBAL CAMERA VISIBILITY - NO DISTANCE LIMITS
export const getCommunityCamerasForMap = async (userLocation: Location): Promise<RegisteredCamera[]> => {
  try {
    console.log('🌍 GLOBAL HEATMAP: Loading all verified cameras worldwide...')
    
    const camerasRef = collection(db, 'cameras')
    const q = query(
      camerasRef,
      where('status', '==', 'active'),
      where('privacySettings.shareWithCommunity', '==', true),
      where('verification.status', '==', 'approved') // Only show verified cameras
    )
    
    const querySnapshot = await getDocs(q)
    const cameras: RegisteredCamera[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      const cameraLocation = {
        lat: data.displayLocation?.latitude || data.location?.latitude,
        lng: data.displayLocation?.longitude || data.location?.longitude
      }
      
      // NO DISTANCE FILTERING - Include ALL verified cameras globally
      cameras.push({
        ...data,
        id: doc.id,
        location: {
          lat: data.location?.latitude || cameraLocation.lat,
          lng: data.location?.longitude || cameraLocation.lng
        },
        displayLocation: cameraLocation,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastUpdated: data.lastUpdated?.toDate() || new Date()
      } as RegisteredCamera)
    })

    console.log(`🌍 GLOBAL HEATMAP: Loaded ${cameras.length} verified cameras (visible from anywhere in the world)`)
    return cameras
  } catch (error) {
    console.error('❌ Error in global heatmap function:', error)
    throw error
  }
}

export const getCommunityHeatmapCameras = getCommunityCamerasForMap

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

const updateUserStats = async (userId: string, statUpdates: Partial<UserProfile['stats']>): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId)
    const userSnap = await getDoc(userRef)
    
    if (userSnap.exists()) {
      const userData = userSnap.data() as UserProfile
      const currentStats = userData.stats || {
        camerasRegistered: 0,
        requestsMade: 0,
        footageShared: 0,
        communityHelpScore: 0
      }

      const updatedStats = {
        camerasRegistered: Math.max(0, (currentStats.camerasRegistered || 0) + (statUpdates?.camerasRegistered || 0)),
        requestsMade: Math.max(0, (currentStats.requestsMade || 0) + (statUpdates?.requestsMade || 0)),
        footageShared: Math.max(0, (currentStats.footageShared || 0) + (statUpdates?.footageShared || 0)),
        communityHelpScore: Math.max(0, (currentStats.communityHelpScore || 0) + (statUpdates?.communityHelpScore || 0))
      }

      await updateDoc(userRef, {
        stats: updatedStats,
        lastActiveAt: serverTimestamp()
      })
    }
  } catch (error) {
    console.error('❌ Error updating user stats:', error)
    // Don't throw error as this is not critical
  }
}

// Simple distance calculation using Haversine formula
const calculateDistance = (point1: Location, point2: Location): number => {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRad(point2.lat - point1.lat)
  const dLon = toRad(point2.lng - point1.lng)
  const lat1 = toRad(point1.lat)
  const lat2 = toRad(point2.lat)

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  
  return R * c
}

const toRad = (degrees: number): number => {
  return degrees * (Math.PI/180)
}

// Simple geohash generation (basic implementation)
const generateGeohash = (lat: number, lng: number, precision: number = 8): string => {
  // This is a simplified geohash - in production, use a proper geohash library
  const base32 = '0123456789bcdefghjkmnpqrstuvwxyz'
  let geohash = ''
  let latRange = [-90, 90]
  let lngRange = [-180, 180]
  let isEven = true
  let bit = 0
  let ch = 0

  while (geohash.length < precision) {
    if (isEven) {
      const mid = (lngRange[0] + lngRange[1]) / 2
      if (lng >= mid) {
        ch |= (1 << (4 - bit))
        lngRange[0] = mid
      } else {
        lngRange[1] = mid
      }
    } else {
      const mid = (latRange[0] + latRange[1]) / 2
      if (lat >= mid) {
        ch |= (1 << (4 - bit))
        latRange[0] = mid
      } else {
        latRange[1] = mid
      }
    }

    isEven = !isEven
    if (bit < 4) {
      bit++
    } else {
      geohash += base32[ch]
      bit = 0
      ch = 0
    }
  }

  return geohash
}
