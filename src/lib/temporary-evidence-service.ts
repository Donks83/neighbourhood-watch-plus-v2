import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  deleteDoc
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import type { 
  TemporaryEvidenceMarker,
  TemporaryMarkerFormData,
  TemporaryMarkerMatch,
  NotificationPreferences
} from '@/types/temporary-evidence'
import type { Location } from '@/types'
import { calculateDistance } from '@/lib/utils'

// =============================================================================
// FIRESTORE COLLECTIONS
// =============================================================================

export const TEMPORARY_EVIDENCE_COLLECTIONS = {
  temporaryMarkers: 'temporaryEvidenceMarkers',
  notificationPreferences: 'notificationPreferences',
  markerMatches: 'temporaryMarkerMatches'
} as const

// =============================================================================
// TEMPORARY MARKER MANAGEMENT
// =============================================================================

export class TemporaryMarkerService {
  /**
   * Create a new temporary evidence marker
   */
  static async createTemporaryMarker(
    userId: string,
    userEmail: string,
    formData: TemporaryMarkerFormData
  ): Promise<string> {
    let previewImageUrl: string | undefined
    let previewImageMetadata: any | undefined

    // Upload preview image if provided
    if (formData.previewImage) {
      const imageRef = ref(storage, `temporary-markers/${userId}/${Date.now()}-${formData.previewImage.name}`)
      const snapshot = await uploadBytes(imageRef, formData.previewImage)
      previewImageUrl = await getDownloadURL(snapshot.ref)
      
      // Get image metadata
      const img = new Image()
      await new Promise((resolve) => {
        img.onload = resolve
        img.src = URL.createObjectURL(formData.previewImage!)
      })
      
      previewImageMetadata = {
        width: img.width,
        height: img.height,
        fileSize: formData.previewImage.size
      }
    }

    // Calculate expiry date (14 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 14)

    const markerData: Omit<TemporaryEvidenceMarker, 'id'> = {
      ownerId: userId,
      ownerEmail: userEmail,
      ownerPhone: formData.ownerPhone,
      location: formData.location,
      recordedAt: Timestamp.fromDate(formData.recordedAt),
      deviceType: formData.deviceType,
      deviceDescription: formData.deviceDescription,
      incidentDescription: formData.incidentDescription,
      previewImageUrl,
      previewImageMetadata,
      status: 'active',
      expiresAt: Timestamp.fromDate(expiresAt),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      matchedRequests: [],
      responsesSent: 0,
      isVerified: !!previewImageUrl,
      trustScore: previewImageUrl ? 80 : 60 // Higher score if preview provided
    }

    const docRef = await addDoc(
      collection(db, TEMPORARY_EVIDENCE_COLLECTIONS.temporaryMarkers),
      markerData
    )

    console.log(`✅ Temporary marker created: ${docRef.id}`)
    return docRef.id
  }

  /**
   * Get active temporary markers for a user
   */
  static async getUserTemporaryMarkers(userId: string): Promise<TemporaryEvidenceMarker[]> {
    const q = query(
      collection(db, TEMPORARY_EVIDENCE_COLLECTIONS.temporaryMarkers),
      where('ownerId', '==', userId),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    )

    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as TemporaryEvidenceMarker[]
  }

  /**
   * Find temporary markers that match an evidence request
   */
  static async findMatchingMarkers(
    location: Location,
    radius: number,
    incidentDate: Date
  ): Promise<TemporaryMarkerMatch[]> {
    // Get all active markers
    const q = query(
      collection(db, TEMPORARY_EVIDENCE_COLLECTIONS.temporaryMarkers),
      where('status', '==', 'active'),
      where('expiresAt', '>', Timestamp.now())
    )

    const snapshot = await getDocs(q)
    const markers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as TemporaryEvidenceMarker[]

    // Create time window (±24 hours from incident)
    const timeWindow = {
      start: new Date(incidentDate.getTime() - 24 * 60 * 60 * 1000),
      end: new Date(incidentDate.getTime() + 24 * 60 * 60 * 1000)
    }

    // Filter and score matches
    const matches: TemporaryMarkerMatch[] = []

    for (const marker of markers) {
      // Check distance
      const distance = calculateDistance(
        location.lat,
        location.lng,
        marker.location.lat,
        marker.location.lng
      )

      if (distance > radius) continue

      // Check time proximity
      const recordedTime = marker.recordedAt.toDate().getTime()
      const timeStart = timeWindow.start.getTime()
      const timeEnd = timeWindow.end.getTime()

      // Marker should be within the time window or close to it (±2 hours buffer)
      const buffer = 2 * 60 * 60 * 1000 // 2 hours in milliseconds
      const timeProximity = Math.abs(recordedTime - incidentDate.getTime())
      
      if (recordedTime < timeStart - buffer || recordedTime > timeEnd + buffer) {
        continue
      }

      // Calculate confidence score
      const distanceFactor = 1 - (distance / radius) // 0-1, higher is closer
      const timeFactor = Math.max(0, 1 - (timeProximity / (4 * 60 * 60 * 1000))) // 0-1, within 4 hours
      const verificationFactor = marker.isVerified ? 1 : 0.7
      const trustFactor = marker.trustScore / 100
      
      const confidence = (
        distanceFactor * 0.3 +
        timeFactor * 0.4 +
        verificationFactor * 0.2 +
        trustFactor * 0.1
      )

      // Device reliability score
      const deviceReliability = {
        dashcam: 0.9,
        mobile_phone: 0.8,
        action_camera: 0.85,
        other: 0.7
      }[marker.deviceType] || 0.7

      matches.push({
        markerId: marker.id!,
        marker,
        confidence,
        matchFactors: {
          timeProximity: timeProximity / 1000, // in seconds
          distanceFromIncident: distance,
          deviceReliability
        },
        estimatedReward: this.calculateReward(confidence, marker.deviceType)
      })
    }

    // Sort by confidence
    return matches.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Calculate reward based on confidence and device type
   */
  private static calculateReward(confidence: number, deviceType: string): number {
    const baseReward = {
      dashcam: 50,
      mobile_phone: 35,
      action_camera: 45,
      other: 30
    }[deviceType] || 30

    // Confidence multiplier (0.5x to 1.5x)
    const multiplier = 0.5 + confidence

    return Math.round(baseReward * multiplier)
  }

  /**
   * Update marker when matched with a request
   */
  static async markAsMatched(markerId: string, requestId: string): Promise<void> {
    const markerRef = doc(db, TEMPORARY_EVIDENCE_COLLECTIONS.temporaryMarkers, markerId)
    const markerDoc = await getDoc(markerRef)
    
    if (!markerDoc.exists()) {
      throw new Error('Marker not found')
    }

    const marker = markerDoc.data() as TemporaryEvidenceMarker
    const matchedRequests = marker.matchedRequests || []

    await updateDoc(markerRef, {
      matchedRequests: [...matchedRequests, requestId],
      updatedAt: Timestamp.now()
    })
  }

  /**
   * Clean up expired markers (run periodically)
   */
  static async cleanupExpiredMarkers(): Promise<number> {
    const q = query(
      collection(db, TEMPORARY_EVIDENCE_COLLECTIONS.temporaryMarkers),
      where('status', '==', 'active'),
      where('expiresAt', '<', Timestamp.now())
    )

    const snapshot = await getDocs(q)
    let count = 0

    for (const docSnap of snapshot.docs) {
      await updateDoc(docSnap.ref, {
        status: 'expired',
        updatedAt: Timestamp.now()
      })
      count++
    }

    console.log(`🧹 Cleaned up ${count} expired temporary markers`)
    return count
  }

  /**
   * Withdraw a temporary marker
   */
  static async withdrawMarker(markerId: string, userId: string): Promise<void> {
    const markerRef = doc(db, TEMPORARY_EVIDENCE_COLLECTIONS.temporaryMarkers, markerId)
    const markerDoc = await getDoc(markerRef)
    
    if (!markerDoc.exists()) {
      throw new Error('Marker not found')
    }

    const marker = markerDoc.data() as TemporaryEvidenceMarker
    
    // Verify ownership
    if (marker.ownerId !== userId) {
      throw new Error('Unauthorized')
    }

    await updateDoc(markerRef, {
      status: 'withdrawn',
      updatedAt: Timestamp.now()
    })
  }
}

// =============================================================================
// NOTIFICATION PREFERENCES
// =============================================================================

export class NotificationPreferenceService {
  /**
   * Get or create notification preferences
   */
  static async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    const prefDoc = await getDoc(
      doc(db, TEMPORARY_EVIDENCE_COLLECTIONS.notificationPreferences, userId)
    )

    if (prefDoc.exists()) {
      return prefDoc.data() as NotificationPreferences
    }

    // Create default preferences
    const defaultPrefs: NotificationPreferences = {
      userId,
      channels: {
        app: true,
        email: true,
        sms: false // Default off, user can enable
      },
      temporaryMarkers: {
        onMatch: true,
        onExpiry: true,
        onReward: true
      },
      updatedAt: Timestamp.now()
    }

    await updateDoc(
      doc(db, TEMPORARY_EVIDENCE_COLLECTIONS.notificationPreferences, userId),
      defaultPrefs as any
    )

    return defaultPrefs
  }

  /**
   * Update notification preferences
   */
  static async updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    await updateDoc(
      doc(db, TEMPORARY_EVIDENCE_COLLECTIONS.notificationPreferences, userId),
      {
        ...preferences,
        updatedAt: Timestamp.now()
      }
    )
  }

  /**
   * Send notification to marker owner
   */
  static async notifyMarkerOwner(
    marker: TemporaryEvidenceMarker,
    notificationType: 'match' | 'expiry' | 'reward',
    details: any
  ): Promise<void> {
    const prefs = await this.getNotificationPreferences(marker.ownerId)

    const messages = {
      match: {
        title: '🎯 Your Footage is Needed!',
        message: `Someone needs footage you captured on ${marker.recordedAt.toDate().toLocaleDateString()}. Potential reward: £${details.reward}`,
        action: `View Request`
      },
      expiry: {
        title: '⏰ Marker Expiring Soon',
        message: `Your temporary marker will expire in 24 hours`,
        action: 'Extend or Remove'
      },
      reward: {
        title: '💰 Reward Earned!',
        message: `You've earned £${details.amount} for your footage`,
        action: 'View Wallet'
      }
    }

    const notification = messages[notificationType]

    // App notification (in-app)
    if (prefs.channels.app) {
      console.log(`📱 App notification sent to ${marker.ownerEmail}:`, notification)
      // Implement in-app notification
    }

    // Email notification
    if (prefs.channels.email) {
      console.log(`📧 Email sent to ${marker.ownerEmail}:`, notification)
      // Implement email service (SendGrid, etc.)
    }

    // SMS notification
    if (prefs.channels.sms && marker.ownerPhone) {
      console.log(`📲 SMS sent to ${marker.ownerPhone}:`, notification.message)
      // Implement SMS service (Twilio, etc.)
    }
  }
}

// =============================================================================
// GEOGRAPHIC VALIDATION (2KM RESTRICTION)
// =============================================================================

export class GeographicValidationService {
  /**
   * Validate that camera location is within 2km of user's registered address(es)
   */
  static async validateCameraLocation(
    cameraLocation: Location,
    registeredAddresses: Location[],
    maxAllowedDistance: number = 2000 // 2km in meters
  ): Promise<{
    isValid: boolean
    distance?: number
    maxAllowedDistance: number
    reason?: string
  }> {
    if (!registeredAddresses || registeredAddresses.length === 0) {
      return { 
        isValid: false,
        maxAllowedDistance,
        reason: 'No registered addresses found' 
      }
    }

    // Check if camera is within 2km of ANY registered address
    let minDistance = Infinity

    for (const address of registeredAddresses) {
      const distance = calculateDistance(
        address.lat,
        address.lng,
        cameraLocation.lat,
        cameraLocation.lng
      )

      if (distance < minDistance) {
        minDistance = distance
      }
    }

    if (minDistance > maxAllowedDistance) {
      return {
        isValid: false,
        distance: minDistance,
        maxAllowedDistance,
        reason: `Camera must be within ${maxAllowedDistance}m of a registered address`
      }
    }

    return {
      isValid: true,
      distance: minDistance,
      maxAllowedDistance
    }
  }

  /**
   * Check if location is valid for temporary marker (no restriction)
   */
  static validateTemporaryMarkerLocation(
    markerLocation: Location
  ): {
    isValid: boolean
    reason?: string
  } {
    // Temporary markers (mobile/dashcam) have no geographic restriction
    // But we validate the location is reasonable
    
    // Basic validation - check coordinates are valid
    if (
      markerLocation.lat < -90 || markerLocation.lat > 90 ||
      markerLocation.lng < -180 || markerLocation.lng > 180
    ) {
      return {
        isValid: false,
        reason: 'Invalid coordinates'
      }
    }

    return { isValid: true }
  }
}
