import type { Location } from '@/types'
import type { Timestamp } from 'firebase/firestore'

export type RequestStatus = 'pending' | 'approved' | 'denied' | 'expired' | 'fulfilled' | 'cancelled'
export type RequestPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface FootageRequest {
  id: string
  
  // Request Details
  incidentType: string
  incidentDate: Date | Timestamp
  incidentTime: string
  description: string
  policeReportNumber?: string
  priority: RequestPriority
  
  // Location Information
  incidentLocation: Location
  searchRadius: number // in meters
  
  // Requester Information
  requesterId: string
  requesterEmail: string
  requesterName?: string
  requesterTrustScore?: number
  
  // Target Cameras (cameras within radius)
  targetCameraIds: string[] // IDs of cameras within the search radius
  
  // Response Tracking
  responses: CameraResponse[]
  
  // Request Status
  status: RequestStatus
  statusHistory: StatusChange[]
  
  // Timestamps
  createdAt: Date | Timestamp
  updatedAt?: Date | Timestamp
  expiresAt: Date | Timestamp // Auto-expire after 7 days
  
  // Optional Fields
  additionalNotes?: string
  attachments?: RequestAttachment[]
}

export interface CameraResponse {
  cameraId: string
  cameraOwnerId: string
  cameraOwnerEmail: string
  cameraName: string
  
  // Response Details
  status: 'pending' | 'approved' | 'denied' | 'no-footage'
  respondedAt?: Date | Timestamp
  
  // If approved
  footageUrl?: string
  footageUploadedAt?: Date | Timestamp
  footageNotes?: string
  
  // If denied or no-footage
  denialReason?: string
}

export interface StatusChange {
  status: RequestStatus
  changedAt: Date | Timestamp
  changedBy: string // userId
  reason?: string
}

export interface RequestAttachment {
  type: 'image' | 'document'
  url: string
  fileName: string
  uploadedAt: Date | Timestamp
}

export interface FootageUpload {
  id: string
  requestId: string
  cameraId: string
  
  // File Information
  fileName: string
  fileSize: number // in bytes
  fileType: string // MIME type
  url: string // Storage URL
  thumbnailUrl?: string
  
  // Metadata
  duration?: number // for videos, in seconds
  startTime?: Date | Timestamp
  endTime?: Date | Timestamp
  
  // Upload Information
  uploadedBy: string // userId
  uploadedAt: Date | Timestamp
  
  // Processing
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed'
  processedAt?: Date | Timestamp
}

export interface RequestNotification {
  id: string
  
  // Recipient
  userId: string
  email: string
  
  // Notification Details
  type: 'new-request' | 'request-approved' | 'request-denied' | 'footage-uploaded' | 'request-expired'
  requestId: string
  cameraId?: string
  
  // Content
  title: string
  message: string
  actionUrl?: string
  
  // Status
  read: boolean
  readAt?: Date | Timestamp
  sent: boolean
  sentAt?: Date | Timestamp
  
  // Timestamps
  createdAt: Date | Timestamp
  expiresAt?: Date | Timestamp
}

// Helper type for creating new requests
export interface CreateFootageRequestInput {
  incidentType: string
  incidentDate: Date
  incidentTime: string
  description: string
  incidentLocation: Location
  searchRadius: number
  priority: RequestPriority
  policeReportNumber?: string
  additionalNotes?: string
}

// Helper type for request statistics
export interface RequestStatistics {
  totalRequests: number
  pendingRequests: number
  approvedRequests: number
  deniedRequests: number
  fulfilledRequests: number
  averageResponseTime: number // in hours
  approvalRate: number // percentage
}
