import { Timestamp } from 'firebase/firestore'

export interface Location {
  lat: number
  lng: number
}

export interface FootageRequest {
  id: string
  requesterId: string
  requesterEmail: string
  incidentLocation: Location
  incidentType: 'vehicle_accident' | 'theft' | 'vandalism' | 'suspicious_activity' | 'other'
  incidentDateTime: Timestamp
  description: string
  requestRadius: number
  status: 'active' | 'fulfilled' | 'expired'
  responses?: FootageResponse[]
  createdAt: Timestamp
  expiresAt: Timestamp
}

export interface FootageResponse {
  id: string
  cameraOwnerId: string
  cameraOwnerEmail: string
  requestId: string
  responseType: 'have_footage' | 'no_footage' | 'declined'
  message?: string
  footageUrl?: string
  createdAt: Timestamp
}



export interface User {
  uid: string
  email: string
  displayName?: string
  registeredCameras: string[] // Array of camera IDs
  footageRequests: string[] // Array of request IDs
  notifications: Notification[]
}

export interface Notification {
  id: string
  type: 'footage_request' | 'response_received' | 'request_expired'
  requestId: string
  message: string
  read: boolean
  createdAt: Timestamp
}

export interface IncidentFormData {
  incidentType: FootageRequest['incidentType']
  description: string
  incidentDateTime: string  // ISO string format for form handling
  requestRadius: number
}



export interface MapMarker {
  id: string
  location: Location
  type: 'incident' | 'camera' | 'selected'
  data?: FootageRequest | any // Use any for now to avoid circular imports
}

export interface MapState {
  center: Location
  zoom: number
  selectedLocation: Location | null
  selectedRadius: number
  markers: MapMarker[]
  showHeatmap: boolean
}

export interface CameraDensityArea {
  id: string
  center: Location
  radius: number // in meters
  density: number // 0-1 (0 = no cameras, 1 = high density)
  cameraCount: number // approximate count for this area
  areaType: 'residential' | 'commercial' | 'mixed'
}

export interface HeatmapPoint {
  location: Location
  weight: number // 0-1 intensity
}

// Re-export camera types
export type { RegisteredCamera, CameraFormData } from './camera'
