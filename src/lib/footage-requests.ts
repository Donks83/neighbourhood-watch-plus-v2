import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  serverTimestamp,
  Timestamp,
  arrayUnion
} from 'firebase/firestore'
import { db } from './firebase'
import type { FootageRequest, CameraResponse, CreateFootageRequestInput, RequestNotification } from '@/types/requests'
import type { RegisteredCamera } from '@/types/camera'
import type { Location } from '@/types'
import { getDistance } from './camera-utils'

/**
 * Cancel a footage request
 */
export async function cancelFootageRequest(
  requestId: string,
  userId: string,
  reason: string
): Promise<void> {
  try {
    const requestRef = doc(db, 'footageRequests', requestId)
    const requestDoc = await getDoc(requestRef)
    
    if (!requestDoc.exists()) {
      throw new Error('Request not found')
    }
    
    const request = requestDoc.data() as FootageRequest
    
    // Verify user is the requester
    if (request.requesterId !== userId) {
      throw new Error('Only the requester can cancel this request')
    }
    
    // Update request status
    await updateDoc(requestRef, {
      status: 'cancelled',
      updatedAt: serverTimestamp(),
      cancelledAt: serverTimestamp(),
      cancelReason: reason,
      statusHistory: arrayUnion({
        status: 'cancelled',
        changedAt: new Date(),
        changedBy: userId,
        reason: reason
      })
    })
    
    console.log('✅ Request cancelled successfully:', requestId)
    
  } catch (error) {
    console.error('❌ Error cancelling request:', error)
    throw error
  }
}

/**
 * Create a new footage request and notify camera owners AND temporary marker owners
 */
export async function createFootageRequest(
  userId: string,
  userEmail: string,
  input: CreateFootageRequestInput
): Promise<FootageRequest> {
  try {
    console.log('📹 Creating footage request...', input)
    
    // Find BOTH permanent cameras AND temporary markers within the search radius
    const nearbyCameras = await findCamerasWithinRadius(
      input.incidentLocation,
      input.searchRadius
    )
    
    // Find temporary markers that match this incident
    const { TemporaryMarkerService } = await import('./temporary-evidence-service')
    const matchingMarkers = await TemporaryMarkerService.findMatchingMarkers(
      input.incidentLocation,
      input.searchRadius,
      new Date(input.incidentDate)
    )
    
    console.log(`🎯 Found ${nearbyCameras.length} permanent cameras + ${matchingMarkers.length} temporary markers within ${input.searchRadius}m radius`)
    
    // Create camera response entries for permanent cameras
    const cameraResponses: CameraResponse[] = nearbyCameras.map(camera => ({
      cameraId: camera.id,
      cameraOwnerId: camera.userId,
      cameraOwnerEmail: camera.userEmail,
      cameraName: camera.name,
      status: 'pending'
    }))
    
    // Create response entries for temporary markers
    const markerResponses: CameraResponse[] = matchingMarkers.map(match => ({
      cameraId: match.markerId,
      cameraOwnerId: match.marker.ownerId,
      cameraOwnerEmail: match.marker.ownerEmail,
      cameraName: `${match.marker.deviceType} (Temporary)`,
      status: 'pending'
    }))
    
    // Combine all responses
    const responses = [...cameraResponses, ...markerResponses]
    
    // Calculate expiry date (7 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)
    
    // Create the footage request
    const requestId = `request-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const footageRequest: FootageRequest = {
      id: requestId,
      ...input,
      requesterId: userId,
      requesterEmail: userEmail,
      targetCameraIds: [...nearbyCameras.map(c => c.id), ...matchingMarkers.map(m => m.markerId)],
      responses,
      status: 'pending',
      statusHistory: [{
        status: 'pending',
        changedAt: new Date(),
        changedBy: userId
      }],
      createdAt: new Date(),
      expiresAt
    }
    
    // Save to Firestore
    await setDoc(doc(db, 'footageRequests', requestId), {
      ...footageRequest,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt)
    })
    
    // Create notifications for camera owners AND temporary marker owners
    await createNotificationsForRequest(footageRequest, nearbyCameras, matchingMarkers)
    
    console.log('✅ Footage request created successfully:', requestId)
    return footageRequest
    
  } catch (error) {
    console.error('❌ Error creating footage request:', error)
    throw error
  }
}

/**
 * Find cameras within a specified radius of a location
 */
async function findCamerasWithinRadius(
  location: Location,
  radiusInMeters: number
): Promise<RegisteredCamera[]> {
  try {
    console.log('🔍 Searching for cameras within radius...', { location, radiusInMeters })
    
    // Get all active community-shared AND VERIFIED cameras
    const camerasQuery = query(
      collection(db, 'cameras'),
      where('status', '==', 'active'),
      where('privacySettings.shareWithCommunity', '==', true),
      where('verification.status', '==', 'approved') // ONLY target verified cameras
    )
    
    const snapshot = await getDocs(camerasQuery)
    console.log(`📹 Found ${snapshot.size} total verified cameras`)
    
    const nearbyCameras: RegisteredCamera[] = []
    
    snapshot.forEach(doc => {
      const data = doc.data()
      
      // Convert GeoPoints back to Location objects
      const camera: RegisteredCamera = {
        ...data,
        id: doc.id,
        location: {
          lat: data.location.latitude,  // Use REAL location for targeting
          lng: data.location.longitude
        },
        displayLocation: {
          lat: data.displayLocation.latitude,
          lng: data.displayLocation.longitude
        },
        createdAt: data.createdAt?.toDate() || new Date(),
        lastUpdated: data.lastUpdated?.toDate() || new Date()
      } as RegisteredCamera
      
      console.log('🎥 Checking camera:', {
        id: camera.id,
        name: camera.name,
        realLocation: camera.location,
        owner: camera.userId
      })
      
      // Calculate distance using REAL location (not fuzzy) for accurate targeting
      const distance = getDistance(
        location.lat,
        location.lng,
        camera.location.lat,    // Use REAL location
        camera.location.lng     // Use REAL location
      )
      
      console.log(`📏 Distance to camera ${camera.name}: ${Math.round(distance)}m`)
      
      // Only include cameras within the EXACT radius (no buffer for targeting)
      if (distance <= radiusInMeters) {
        console.log(`✅ Camera ${camera.name} is within range (${Math.round(distance)}m <= ${radiusInMeters}m)`)
        nearbyCameras.push(camera)
      } else {
        console.log(`❌ Camera ${camera.name} is too far (${Math.round(distance)}m > ${radiusInMeters}m)`)
      }
    })
    
    console.log(`🎯 Final result: ${nearbyCameras.length} verified cameras within ${radiusInMeters}m radius`)
    return nearbyCameras
    
  } catch (error) {
    console.error('❌ Error finding cameras within radius:', error)
    return []
  }
}

/**
 * Create notifications for camera owners AND temporary marker owners about new request
 */
async function createNotificationsForRequest(
  request: FootageRequest,
  cameras: RegisteredCamera[],
  temporaryMarkers: any[] = []
): Promise<void> {
  try {
    const notifications: RequestNotification[] = []
    
    // Get unique camera owners
    const cameraOwnerIds = Array.from(new Set(cameras.map(c => c.userId)))
    
    // Create notification for each camera owner
    for (const ownerId of cameraOwnerIds) {
      const ownerCameras = cameras.filter(c => c.userId === ownerId)
      const cameraCount = ownerCameras.length
      const cameraNames = ownerCameras.map(c => c.name).join(', ')
      
      const incidentDateStr = request.incidentDate instanceof Date 
        ? request.incidentDate.toLocaleDateString()
        : request.incidentDate.toDate().toLocaleDateString()
      
      const notification: RequestNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: ownerId,
        email: ownerCameras[0].userEmail, // All cameras have same owner email
        type: 'new-request',
        requestId: request.id,
        title: `New Footage Request (${request.priority} priority)`,
        message: `${request.incidentType} incident on ${incidentDateStr}. ` +
                 `${cameraCount} of your cameras (${cameraNames}) may have captured footage.`,
        actionUrl: `/requests/${request.id}`,
        read: false,
        sent: false,
        createdAt: new Date()
      }
      
      notifications.push(notification)
    }
    
    // Get unique temporary marker owners
    const markerOwnerIds = Array.from(new Set(temporaryMarkers.map(m => m.marker.ownerId)))
    
    // Create notification for each temporary marker owner
    for (const ownerId of markerOwnerIds) {
      const ownerMarkers = temporaryMarkers.filter(m => m.marker.ownerId === ownerId)
      const markerCount = ownerMarkers.length
      const deviceTypes = ownerMarkers.map(m => m.marker.deviceType).join(', ')
      
      const incidentDateStr = request.incidentDate instanceof Date 
        ? request.incidentDate.toLocaleDateString()
        : request.incidentDate.toDate().toLocaleDateString()
      
      const notification: RequestNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: ownerId,
        email: ownerMarkers[0].marker.ownerEmail,
        type: 'new-request',
        requestId: request.id,
        title: `Footage Match Found! (${request.priority} priority)`,
        message: `${request.incidentType} incident on ${incidentDateStr}. ` +
                 `Your ${markerCount} temporary marker(s) (${deviceTypes}) matched this incident. Someone needs your footage!`,
        actionUrl: `/requests/${request.id}`,
        read: false,
        sent: false,
        createdAt: new Date()
      }
      
      notifications.push(notification)
      
      // Also send SMS/App notification if preferences are set
      const { NotificationPreferenceService } = await import('./temporary-evidence-service')
      const prefs = await NotificationPreferenceService.getNotificationPreferences(ownerId)
      if (prefs) {
        if (prefs.channels.sms && ownerMarkers[0].marker.ownerPhone) {
          console.log(`📱 Would send SMS to ${ownerMarkers[0].marker.ownerPhone}`)
          // TODO: Integrate real SMS service (Twilio, AWS SNS, etc.)
        }
        if (prefs.channels.email) {
          console.log(`📧 Would send email to ${ownerMarkers[0].marker.ownerEmail}`)
          // TODO: Integrate real email service (SendGrid, AWS SES, etc.)
        }
      }
    }
    
    // Save notifications to Firestore
    const batch = notifications.map(notif => 
      setDoc(doc(db, 'notifications', notif.id), {
        ...notif,
        createdAt: serverTimestamp()
      })
    )
    
    await Promise.all(batch)
    console.log(`📬 Created ${notifications.length} notifications (${cameraOwnerIds.length} camera owners + ${markerOwnerIds.length} marker owners)`)
    
  } catch (error) {
    console.error('❌ Error creating notifications:', error)
  }
}

/**
 * Get footage requests for a camera owner
 */
export async function getRequestsForOwner(userId: string): Promise<FootageRequest[]> {
  try {
    // First get all cameras owned by this user
    const camerasQuery = query(
      collection(db, 'cameras'),
      where('userId', '==', userId)
    )
    
    const camerasSnapshot = await getDocs(camerasQuery)
    const cameraIds = camerasSnapshot.docs.map(doc => doc.id)
    
    if (cameraIds.length === 0) {
      return []
    }
    
    // Get requests that target any of these cameras
    const requestsQuery = query(
      collection(db, 'footageRequests'),
      where('targetCameraIds', 'array-contains-any', cameraIds),
      orderBy('createdAt', 'desc'),
      limit(50)
    )
    
    const requestsSnapshot = await getDocs(requestsQuery)
    const requests: FootageRequest[] = []
    
    requestsSnapshot.forEach(doc => {
      requests.push({
        ...doc.data(),
        id: doc.id
      } as FootageRequest)
    })
    
    return requests
    
  } catch (error) {
    console.error('❌ Error getting requests for owner:', error)
    return []
  }
}

/**
 * Get footage requests made by a user
 */
export async function getRequestsByUser(userId: string): Promise<FootageRequest[]> {
  try {
    const requestsQuery = query(
      collection(db, 'footageRequests'),
      where('requesterId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    )
    
    const snapshot = await getDocs(requestsQuery)
    const requests: FootageRequest[] = []
    
    snapshot.forEach(doc => {
      requests.push({
        ...doc.data(),
        id: doc.id
      } as FootageRequest)
    })
    
    return requests
    
  } catch (error) {
    console.error('❌ Error getting requests by user:', error)
    return []
  }
}

/**
 * Update camera response to a footage request
 */
export async function updateCameraResponse(
  requestId: string,
  cameraId: string,
  status: 'approved' | 'denied' | 'no-footage',
  reason?: string
): Promise<void> {
  try {
    const requestRef = doc(db, 'footageRequests', requestId)
    const requestDoc = await getDoc(requestRef)
    
    if (!requestDoc.exists()) {
      throw new Error('Request not found')
    }
    
    const request = requestDoc.data() as FootageRequest
    
    // Update the specific camera response
    const updatedResponses = request.responses.map(response => {
      if (response.cameraId === cameraId) {
        const updatedResponse: any = {
          ...response,
          status,
          respondedAt: new Date() // Use Date() instead of serverTimestamp() inside arrays
        }
        
        // Only add denialReason if status is denied and reason exists
        if (status === 'denied' && reason) {
          updatedResponse.denialReason = reason
        }
        
        return updatedResponse
      }
      return response
    })
    
    // Update request status if all cameras have responded
    const allResponded = updatedResponses.every(r => r.status !== 'pending')
    const anyApproved = updatedResponses.some(r => r.status === 'approved')
    
    const newStatus = allResponded 
      ? (anyApproved ? 'approved' : 'denied')
      : 'pending'
    
    // Update the request
    await updateDoc(requestRef, {
      responses: updatedResponses,
      status: newStatus,
      updatedAt: serverTimestamp(),
      ...(newStatus !== 'pending' && {
        statusHistory: arrayUnion({
          status: newStatus,
          changedAt: new Date(), // Use Date() instead of serverTimestamp() inside arrayUnion
          changedBy: 'system'
        })
      })
    })
    
    console.log(`✅ Updated camera response for ${cameraId} to ${status}`)
    
  } catch (error) {
    console.error('❌ Error updating camera response:', error)
    throw error
  }
}

/**
 * Get a single footage request by ID
 */
export async function getFootageRequest(requestId: string): Promise<FootageRequest | null> {
  try {
    const requestDoc = await getDoc(doc(db, 'footageRequests', requestId))
    
    if (!requestDoc.exists()) {
      return null
    }
    
    return {
      ...requestDoc.data(),
      id: requestDoc.id
    } as FootageRequest
    
  } catch (error) {
    console.error('❌ Error getting footage request:', error)
    return null
  }
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(
  userId: string,
  unreadOnly: boolean = false
): Promise<RequestNotification[]> {
  try {
    let notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId)
    )
    
    if (unreadOnly) {
      notificationsQuery = query(
        notificationsQuery,
        where('read', '==', false)
      )
    }
    
    notificationsQuery = query(
      notificationsQuery,
      orderBy('createdAt', 'desc'),
      limit(20)
    )
    
    const snapshot = await getDocs(notificationsQuery)
    const notifications: RequestNotification[] = []
    
    snapshot.forEach(doc => {
      notifications.push({
        ...doc.data(),
        id: doc.id
      } as RequestNotification)
    })
    
    return notifications
    
  } catch (error) {
    console.error('❌ Error getting notifications:', error)
    return []
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(notificationId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true,
      readAt: serverTimestamp()
    })
  } catch (error) {
    console.error('❌ Error marking notification as read:', error)
  }
}

/**
 * Check for expired requests and update their status
 */
export async function checkExpiredRequests(): Promise<void> {
  try {
    const now = new Date()
    const expiredQuery = query(
      collection(db, 'footageRequests'),
      where('status', '==', 'pending'),
      where('expiresAt', '<=', Timestamp.fromDate(now))
    )
    
    const snapshot = await getDocs(expiredQuery)
    
    const updates = snapshot.docs.map(doc => 
      updateDoc(doc.ref, {
        status: 'expired',
        updatedAt: serverTimestamp(),
        statusHistory: arrayUnion({
          status: 'expired',
          changedAt: new Date(), // Use Date() instead of serverTimestamp() inside arrayUnion
          changedBy: 'system',
          reason: 'Request expired after 7 days'
        })
      })
    )
    
    await Promise.all(updates)
    console.log(`⏰ Marked ${snapshot.size} requests as expired`)
    
  } catch (error) {
    console.error('❌ Error checking expired requests:', error)
  }
}
