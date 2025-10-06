import { Timestamp } from 'firebase/firestore'
import type { Location } from '../index'

// =============================================================================
// TEMPORARY EVIDENCE MARKER TYPES
// =============================================================================

export type PortableDeviceType = 
  | 'mobile_phone'
  | 'dashcam'
  | 'action_camera'
  | 'other'

export interface TemporaryEvidenceMarker {
  id?: string // Firestore document ID
  
  // Owner information
  ownerId: string
  ownerEmail: string
  ownerPhone?: string // For SMS notifications
  
  // Location and timing
  location: Location // Exact location where incident was captured
  recordedAt: Timestamp // When the incident was actually recorded
  
  // Device information
  deviceType: PortableDeviceType
  deviceDescription?: string // e.g., "iPhone 14 Pro", "Nextbase 622GW"
  
  // Incident details
  incidentDescription?: string // Brief description: "Hit and run", "Theft", etc.
  
  // Preview image (optional)
  previewImageUrl?: string
  previewImageMetadata?: {
    width: number
    height: number
    fileSize: number
  }
  
  // Status and lifecycle
  status: 'active' | 'matched' | 'expired' | 'withdrawn'
  expiresAt: Timestamp // Auto-expire after 14 days
  createdAt: Timestamp
  updatedAt: Timestamp
  
  // Matching and requests
  matchedRequests?: string[] // IDs of evidence requests this marker matched
  responsesSent: number // How many times owner has responded to requests
  
  // Privacy and verification
  isVerified: boolean // Whether preview image was provided
  trustScore: number // 0-100, affects matching priority
}

export interface TemporaryMarkerFormData {
  location: Location
  recordedAt: Date
  deviceType: PortableDeviceType
  deviceDescription?: string
  incidentDescription?: string
  previewImage?: File
  ownerPhone?: string // Optional for SMS notifications
}

export interface TemporaryMarkerMatch {
  markerId: string
  marker: TemporaryEvidenceMarker
  confidence: number // 0-1 relevance score
  matchFactors: {
    timeProximity: number // How close in time (seconds)
    distanceFromIncident: number // meters
    deviceReliability: number // Score based on device type
  }
  estimatedReward: number
}

// =============================================================================
// NOTIFICATION PREFERENCES
// =============================================================================

export interface NotificationPreferences {
  userId: string
  channels: {
    app: boolean
    email: boolean
    sms: boolean
  }
  temporaryMarkers: {
    onMatch: boolean // Notify when marker matches a request
    onExpiry: boolean // Notify 24h before expiry
    onReward: boolean // Notify when reward is earned
  }
  updatedAt: Timestamp
}

// =============================================================================
// GEOGRAPHIC VALIDATION
// =============================================================================

export interface AddressValidation {
  userId: string
  registeredAddresses: {
    id: string
    type: 'home' | 'business' | 'other'
    location: Location
    address: string
    verifiedAt?: Timestamp
  }[]
  restrictions: {
    maxCameraDistance: number // in meters (2000m = 2km)
    requiresVerification: boolean
  }
}
