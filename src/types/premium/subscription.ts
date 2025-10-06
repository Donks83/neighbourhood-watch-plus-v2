import { Timestamp } from 'firebase/firestore'
import type { Location } from '../index'

// =============================================================================
// USER SUBSCRIPTION SYSTEM
// =============================================================================

export type UserRole = 'community' | 'police' | 'insurance' | 'security' | 'admin'

export interface SubscriptionTier {
  id: string
  name: string
  role: UserRole
  features: string[]
  limits: {
    monthlyRequests: number
    concurrentRequests: number
    searchRadius: number // max radius in meters
    evidenceRetention: number // days
    prioritySupport: boolean
  }
  pricing: {
    monthlyFee: number
    perRequestFee?: number
    setupFee?: number
  }
}

export interface UserSubscription {
  userId: string
  tier: SubscriptionTier
  role: UserRole
  status: 'active' | 'cancelled' | 'suspended' | 'trial'
  billing: {
    billingEmail: string
    paymentMethod?: string
    lastPayment?: Timestamp
    nextBilling?: Timestamp
  }
  usage: {
    monthlyRequests: number
    totalSpent: number
    requestsRemaining: number
  }
  verification: {
    organizationName?: string
    badgeNumber?: string // For police
    licenseNumber?: string // For insurance
    verificationStatus: 'pending' | 'verified' | 'rejected'
    verificationDocuments?: string[] // File URLs
    verifiedBy?: string // Admin user ID
    verifiedAt?: Timestamp
  }
  createdAt: Timestamp
  updatedAt: Timestamp
}

// =============================================================================
// INCIDENT EVIDENCE SYSTEM
// =============================================================================

export type IncidentType = 
  | 'criminal_activity' 
  | 'antisocial_behavior' 
  | 'property_damage' 
  | 'traffic_incident' 
  | 'suspicious_activity'
  | 'emergency' 
  | 'other'

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface CommunityIncident {
  id: string
  reporterId: string // Anonymous ID for community users
  reporterRole: UserRole
  
  // Location and timing
  location: Location // Exact location (hidden from community view)
  displayLocation: Location // Fuzzy location for community display
  incidentDateTime: Timestamp
  reportedAt: Timestamp
  
  // Incident details
  type: IncidentType
  severity: IncidentSeverity
  title: string // Brief title
  description: string
  
  // Evidence attached by reporter
  attachedEvidence?: {
    photos?: string[] // File URLs
    videos?: string[] // File URLs
    audio?: string[] // File URLs
  }
  
  // Privacy and visibility
  privacy: {
    visibleTo: UserRole[] // Which user types can see this
    anonymousReporting: boolean
    contactAllowed: boolean
  }
  
  // Status tracking
  status: 'reported' | 'investigating' | 'evidence_gathering' | 'resolved' | 'archived'
  tags: string[] // searchable tags
  
  // Legal and compliance
  legalCompliance: {
    retentionPeriod: number // days
    dataProcessingBasis: string // GDPR basis
    consentGiven: boolean
  }
  
  updatedAt: Timestamp
}

// =============================================================================
// EVIDENCE REQUEST SYSTEM
// =============================================================================

export interface EvidenceRequest {
  id: string
  requesterId: string // Premium user ID
  requesterRole: UserRole
  requesterOrganization: string
  
  // Source incident (if any)
  sourceIncidentId?: string
  
  // Request details
  incident: {
    location: Location
    timeWindow: {
      start: Timestamp
      end: Timestamp
    }
    radius: number // search radius in meters
    description: string
    type: IncidentType
    urgency: 'routine' | 'priority' | 'urgent' | 'emergency'
  }
  
  // Legal basis for request
  legalBasis: {
    type: 'police_investigation' | 'insurance_claim' | 'legal_proceedings' | 'other'
    caseNumber?: string
    description: string
    authorizedBy: string
  }
  
  // Targeting and matching
  targeting: {
    evidenceTypes: ('cctv' | 'dashcam' | 'mobile' | 'doorbell')[]
    qualityRequirements: 'any' | 'good' | 'excellent'
    maxSources: number
  }
  
  // Budget and rewards
  budget: {
    maxTotalReward: number
    rewardPerSource: number
    expediteFee?: number
  }
  
  // Status and responses
  status: 'active' | 'fulfilled' | 'expired' | 'cancelled'
  matches?: EvidenceMatch[]
  
  createdAt: Timestamp
  expiresAt: Timestamp
  updatedAt: Timestamp
}

export interface EvidenceMatch {
  id: string
  requestId: string
  sourceId: string // Anonymous camera/device ID
  ownerId: string // Camera owner user ID
  
  // Matching details
  confidence: number // 0-1 relevance score
  matchFactors: {
    timeOverlap: number // seconds of overlap
    distanceFromIncident: number // meters
    viewingAngle: number // degrees from incident
    cameraCapabilities: string[] // night vision, etc.
  }
  
  // Reward and payment
  estimatedReward: number
  actualReward?: number
  
  // Response from camera owner
  response?: {
    status: 'accepted' | 'rejected' | 'no_footage' | 'pending'
    message?: string
    evidenceUrl?: string
    evidenceMetadata?: {
      duration: number // seconds
      resolution: string
      fileSize: number // bytes
      timestamp: Timestamp
    }
    respondedAt: Timestamp
  }
  
  // Legal and chain of custody
  chainOfCustody?: ChainOfCustody
  
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface ChainOfCustody {
  evidenceId: string
  originalSource: string // Anonymous camera ID
  
  // Timestamps
  timestamps: {
    captured: Timestamp
    uploaded: Timestamp
    verified: Timestamp
    accessed: Timestamp[]
  }
  
  // Handlers
  handlers: {
    uploadedBy: string // Anonymous camera owner ID
    verifiedBy: string // Platform admin ID
    accessedBy: string[] // Premium user IDs who accessed
  }
  
  // Integrity verification
  integrity: {
    originalHash: string
    currentHash: string
    verified: boolean
    checksums: string[]
  }
  
  // Legal status
  legalStatus: 'collected' | 'verified' | 'submitted' | 'admitted' | 'archived'
  legalDocuments?: string[] // Court submission documents
}

// =============================================================================
// REWARDS AND PAYMENT SYSTEM
// =============================================================================

export interface TokenReward {
  id: string
  recipientId: string
  evidenceMatchId: string
  requestId: string
  
  // Reward details
  amount: number
  rewardType: 'evidence_provided' | 'incident_reported' | 'verification_bonus' | 'quality_bonus'
  
  // Payment processing
  paymentStatus: 'pending' | 'processed' | 'failed' | 'cancelled'
  paymentMethod: 'platform_credit' | 'bank_transfer' | 'paypal'
  
  // Platform commission
  platformCommission: number
  netAmount: number
  
  // Processing details
  processedAt?: Timestamp
  paymentReference?: string
  
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface UserWallet {
  userId: string
  balance: number
  pendingEarnings: number
  totalEarned: number
  totalWithdrawn: number
  
  // Payment preferences
  paymentPreferences: {
    method: 'platform_credit' | 'bank_transfer' | 'paypal'
    minimumWithdrawal: number
    autoWithdraw: boolean
    autoWithdrawThreshold?: number
  }
  
  // Transaction history
  transactions: WalletTransaction[]
  
  updatedAt: Timestamp
}

export interface WalletTransaction {
  id: string
  type: 'credit' | 'debit' | 'withdrawal' | 'refund'
  amount: number
  description: string
  relatedRewardId?: string
  timestamp: Timestamp
  status: 'completed' | 'pending' | 'failed'
}

// =============================================================================
// ANALYTICS AND REPORTING
// =============================================================================

export interface EvidenceAnalytics {
  requestId: string
  
  // Performance metrics
  performance: {
    responseTime: number // hours to first response
    fulfillmentRate: number // 0-1
    qualityScore: number // 0-1 based on user feedback
    costEffectiveness: number // evidence quality / cost
  }
  
  // Geographic insights
  geographic: {
    coverageHeatmap: HeatmapPoint[]
    responsesByArea: { [area: string]: number }
    effectiveRadius: number // actual useful radius
  }
  
  // Temporal patterns
  temporal: {
    responsesByTimeOfDay: { [hour: string]: number }
    responsesByDayOfWeek: { [day: string]: number }
    seasonalTrends: { [month: string]: number }
  }
  
  // User engagement
  engagement: {
    participationRate: number // % of contacted users who responded
    repeatParticipants: number
    averageRewardAccepted: number
  }
  
  createdAt: Timestamp
}

export interface HeatmapPoint {
  location: Location
  weight: number // 0-1 intensity
  dataType: 'incident_density' | 'camera_density' | 'response_rate' | 'evidence_quality'
}

// =============================================================================
// COMPLIANCE AND LEGAL
// =============================================================================

export interface LegalDocument {
  id: string
  type: 'privacy_policy' | 'terms_of_service' | 'evidence_handling' | 'user_agreement'
  version: string
  content: string
  effectiveDate: Timestamp
  userAcceptances: UserAcceptance[]
}

export interface UserAcceptance {
  userId: string
  documentId: string
  documentVersion: string
  acceptedAt: Timestamp
  ipAddress: string
  userAgent: string
}

export interface DataRetentionPolicy {
  dataType: 'incident_reports' | 'evidence_files' | 'user_data' | 'payment_records'
  retentionPeriod: number // days
  automaticDeletion: boolean
  legalBasis: string
  exceptions: string[] // scenarios where longer retention applies
}
