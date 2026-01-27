import type { Timestamp } from 'firebase/firestore'

// Verification Status Types
export type VerificationStatus = 
  | 'pending'        // Awaiting admin review
  | 'approved'       // Admin approved camera
  | 'rejected'       // Admin rejected camera
  | 'requires_info'  // Admin needs more evidence
  | 'disputed'       // User appealing rejection
  | 'auto_approved'  // Automatically approved (trusted users)

export type RejectionReason = 
  | 'invalid_location'     // Camera location doesn't match address
  | 'fake_camera'          // Not a real security camera
  | 'policy_violation'     // Violates community guidelines
  | 'insufficient_evidence' // Not enough verification evidence
  | 'privacy_concerns'     // Camera violates privacy rules
  | 'duplicate_camera'     // Camera already registered
  | 'other'               // Custom reason provided

// User Role and Permission System
// Includes community roles (user) and premium roles (police, insurance, security)
export type UserRoleType = 'user' | 'police' | 'insurance' | 'security' | 'admin' | 'super_admin'

export interface UserPermissions {
  canVerifyCameras: boolean
  canManageUsers: boolean
  canViewAnalytics: boolean
  canManageReports: boolean
  canAssignModerators: boolean
  canDeleteContent: boolean
  canExportData: boolean
}

export interface UserRole {
  uid: string
  email: string
  role: UserRoleType
  permissions: UserPermissions
  assignedAt: Timestamp
  assignedBy: string // UID of admin who assigned role
  isActive: boolean
  lastActiveAt?: Timestamp
}

// Camera Verification System
export interface VerificationEvidence {
  photos?: string[]      // URLs to verification photos
  documents?: string[]   // URLs to supporting documents
  userNotes?: string    // User-provided explanation/notes
  installationDate?: Date // When camera was installed
  purchaseReceipt?: string // Receipt/proof of purchase
}

export interface VerificationHistoryItem {
  id: string
  action: 'submitted' | 'approved' | 'rejected' | 'info_requested' | 'disputed' | 'resubmitted'
  performedBy: string   // UID of user/admin who performed action
  performedAt: Timestamp
  reason?: string       // Reason for action
  adminNotes?: string   // Internal admin notes
  evidence?: VerificationEvidence // Evidence submitted at this step
}

export interface CameraVerification {
  status: VerificationStatus
  submittedAt: Timestamp
  verifiedAt?: Timestamp
  verifiedBy?: string   // Admin UID who verified
  rejectionReason?: RejectionReason
  customRejectionReason?: string // If rejectionReason is 'other'
  adminNotes?: string   // Internal admin notes
  publicNotes?: string  // Notes visible to user
  evidence: VerificationEvidence
  history: VerificationHistoryItem[]
  priority: 'low' | 'normal' | 'high' | 'urgent' // Admin can prioritize
  
  // Appeals system
  appealSubmittedAt?: Timestamp
  appealReason?: string
  appealEvidence?: VerificationEvidence
  appealDecision?: 'approved' | 'rejected' | 'pending'
  appealDecisionBy?: string
  appealDecisionAt?: Timestamp
}

// Trust Score System v2.0
export interface TrustScoreBreakdown {
  base: number                    // Base score (50)
  verifiedCameras: number         // +15 per verified camera
  communityParticipation: number  // +10 for active participation
  successfulRequests: number      // +5 per successful footage share
  accountAge: number             // +5 after 6 months
  penalties: number              // -10 per rejected camera, etc.
  total: number                  // Calculated total (max 100)
}

export interface TrustScoreHistory {
  date: Timestamp
  previousScore: number
  newScore: number
  reason: string               // What caused the change
  details?: string            // Additional details
  relatedCameraId?: string    // If related to camera verification
}

export interface EnhancedTrustScore {
  current: number
  breakdown: TrustScoreBreakdown
  history: TrustScoreHistory[]
  lastCalculated: Timestamp
  level: 'new' | 'bronze' | 'silver' | 'gold' | 'platinum' // Achievement levels
  badges: TrustBadge[]
}

export interface TrustBadge {
  id: string
  name: string
  description: string
  icon: string              // Icon identifier
  earnedAt: Timestamp
  criteria: string         // How this badge was earned
}

// Admin Dashboard & Analytics
export interface VerificationQueueItem {
  cameraId: string
  userId: string
  userEmail: string
  userName: string
  submittedAt: Timestamp
  priority: CameraVerification['priority']
  status: VerificationStatus
  evidence: VerificationEvidence
  location: {
    street?: string
    city?: string
    postcode?: string
  }
  cameraDetails: {
    name: string
    type: string
    model?: string
    brand?: string
    resolution?: string
    nightVision?: boolean
    viewDistance?: number
  }
  daysPending: number      // Calculated field for admin priority
}

export interface VerificationStats {
  totalPending: number
  totalApproved: number
  totalRejected: number
  averageProcessingTime: number  // In hours
  pendingByPriority: {
    urgent: number
    high: number
    normal: number
    low: number
  }
  monthlyVerifications: {
    approved: number
    rejected: number
  }
  adminProductivity: {
    adminId: string
    adminName: string
    verificationsThisMonth: number
    averageProcessingTime: number
  }[]
}

// Notification System
export type NotificationType = 
  | 'camera_submitted'      // Camera submitted for verification
  | 'camera_approved'       // Camera approved by admin
  | 'camera_rejected'       // Camera rejected by admin
  | 'info_requested'        // Admin requests more info
  | 'trust_score_updated'   // Trust score changed
  | 'badge_earned'          // New badge earned
  | 'admin_assigned'        // User assigned admin role

export interface VerificationNotification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  cameraId?: string
  adminId?: string          // If action performed by admin
  createdAt: Timestamp
  readAt?: Timestamp
  sentViaEmail: boolean
  sentViaPush: boolean
  data?: Record<string, any> // Additional data for the notification
}

// Automated Verification System (Future)
export interface AutoVerificationCriteria {
  minTrustScore: number     // Minimum trust score for auto-approval
  minVerifiedCameras: number // Must have X verified cameras already
  maxTimeAsUser: number     // Must be user for less than X months
  locationVerificationRequired: boolean // Must verify address first
  adminOverrideRequired: boolean // Always require admin review
}

export interface AutoVerificationResult {
  eligible: boolean
  reasons: string[]         // Why eligible/ineligible
  confidence: number        // 0-100 confidence in auto-approval
  recommendedAction: 'approve' | 'reject' | 'manual_review'
}

// Appeals and Disputes
export interface VerificationAppeal {
  id: string
  cameraId: string
  userId: string
  originalRejection: {
    reason: RejectionReason
    adminNotes?: string
    rejectedAt: Timestamp
    rejectedBy: string
  }
  appeal: {
    reason: string
    evidence: VerificationEvidence
    submittedAt: Timestamp
  }
  resolution?: {
    decision: 'approved' | 'rejected' | 'escalated'
    reason: string
    decidedBy: string
    decidedAt: Timestamp
    newTrustScore?: number
  }
  status: 'pending' | 'resolved' | 'escalated'
  escalatedTo?: string      // Super admin UID if escalated
}


