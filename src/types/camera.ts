import type { Location } from './index'
import type { Timestamp } from 'firebase/firestore'
import type { CameraVerification, EnhancedTrustScore, UserRoleType } from './verification'

// User profile and address information
export interface UserAddress {
  street: string
  city: string
  postcode: string
  country: string
  coordinates: Location // Geocoded coordinates
  isVerified?: boolean // Whether address has been verified
}

export interface UserProfile {
  uid: string
  email: string
  displayName?: string
  address?: UserAddress
  verified: boolean
  
  // Enhanced trust score system v2.0
  enhancedTrustScore: EnhancedTrustScore
  
  // User role and permissions (stored as simple string in Firestore)
  role?: UserRoleType
  
  stats?: {
    camerasRegistered: number
    camerasVerified: number      // New: count of verified cameras
    camerasRejected: number      // New: count of rejected cameras
    requestsMade: number
    footageShared: number
    communityHelpScore: number
    successfulVerifications: number // New: successful verification rate
  }
  createdAt: Timestamp
  lastActiveAt: Timestamp
  
  // Legacy support - will be deprecated
  trustScore?: number // Keep for backwards compatibility during migration
}

export interface CameraFieldOfView {
  direction: number // 0-360 degrees (0 = North, 90 = East, etc.)
  angle: number // Field of view angle in degrees (e.g., 110 for wide angle)
  range: number // Maximum effective range in meters
}

export interface RegisteredCamera {
  id: string
  userEmail: string
  userId: string
  location: Location // Exact location for the camera owner
  displayLocation: Location // Fuzzy location shown to community
  name: string // "Front Door Camera", "Driveway Camera", etc.
  type: 'doorbell' | 'security' | 'dash' | 'indoor' | 'other'
  fieldOfView: CameraFieldOfView
  specifications?: {
    resolution?: string // "1080p", "4K", etc.
    nightVision?: boolean
    model?: string
    brand?: string
  }
  privacySettings: {
    shareWithCommunity: boolean
    requireApproval: boolean
    maxRequestRadius: number
    autoRespond: boolean
    quietHours?: {
      enabled: boolean
      start: string // "22:00"
      end: string   // "07:00"
    }
  }
  // Operational status - how the camera is functioning
  operationalStatus: 'active' | 'inactive' | 'maintenance' | 'offline'
  // Verification system - admin approval status  
  verification: CameraVerification
  lastActivity?: Timestamp
  createdAt: Timestamp
  lastUpdated: Timestamp

  // Legacy support - will be deprecated
  status?: 'active' | 'inactive' | 'maintenance' // Keep for backwards compatibility
}

export interface CameraCoverage {
  cameraId: string
  coverageArea: {
    type: 'Polygon'
    coordinates: number[][][] // GeoJSON polygon coordinates
  }
  effectiveRange: number
  qualityZones: {
    excellent: number // distance in meters where quality is excellent
    good: number      // distance where quality is good
    fair: number      // distance where quality is fair
  }
}

export interface SecurityScore {
  overall: number // 0-100
  breakdown: {
    cameraCount: number
    coverageQuality: number
    communityParticipation: number
    responseHistory: number
    trustScore: number
  }
  suggestions: string[]
  lastCalculated: Timestamp
}

export interface PropertyDashboard {
  userId: string
  address: string
  cameras: RegisteredCamera[]
  securityScore: SecurityScore
  recentActivity: ActivityItem[]
  activeRequests: number
  nearbyCameras: number
  trustScore: number
  stats: {
    requestsFulfilled: number
    averageResponseTime: number
    positiveReviews: number
    totalReviews: number
  }
}

export interface ActivityItem {
  id: string
  type: 'footage_request' | 'footage_shared' | 'camera_verified' | 'coverage_improved' | 'request_fulfilled'
  title: string
  description: string
  timestamp: Timestamp
  status?: 'pending' | 'completed' | 'expired'
  relatedCamera?: string
}

// For interactive camera placement
export interface CameraPlacementData {
  location: Location
  type: RegisteredCamera['type']
  name: string
  fieldOfView: CameraFieldOfView
  tempId: string // Temporary ID during placement
}

export interface CameraFormData {
  name: string
  type: RegisteredCamera['type']
  fieldOfView: CameraFieldOfView
  specifications: {
    resolution: string
    nightVision: boolean
    model?: string
    brand?: string
  }
  privacySettings: RegisteredCamera['privacySettings']
}
