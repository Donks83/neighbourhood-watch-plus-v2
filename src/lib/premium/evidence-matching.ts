import type { 
  EvidenceRequest, 
  EvidenceMatch, 
  UserRole,
  IncidentType 
} from '@/types/premium/subscription'
import type { RegisteredCamera } from '@/types/camera'
import type { Location } from '@/types'

// =============================================================================
// EVIDENCE MATCHING ALGORITHM
// =============================================================================

export interface MatchingCriteria {
  incident: {
    location: Location
    timeWindow: { start: Date; end: Date }
    radius: number
    type: IncidentType
    urgency: 'routine' | 'priority' | 'urgent' | 'emergency'
  }
  targeting: {
    evidenceTypes: ('cctv' | 'dashcam' | 'mobile' | 'doorbell')[]
    qualityRequirements: 'any' | 'good' | 'excellent'
    maxSources: number
  }
  budget: {
    maxTotalReward: number
    rewardPerSource: number
  }
}

export interface CameraAnalysis {
  camera: RegisteredCamera
  distance: number
  timeActive: boolean
  viewingAngle: number
  capabilities: string[]
  confidenceFactors: {
    spatial: number     // 0-1 based on distance and coverage
    temporal: number    // 0-1 based on time availability
    technical: number   // 0-1 based on camera capabilities
    historical: number  // 0-1 based on past performance
  }
  overallConfidence: number
  estimatedReward: number
}

export class EvidenceMatchingEngine {
  private readonly EARTH_RADIUS_M = 6371000 // Earth's radius in meters

  /**
   * Main matching function - finds and scores potential evidence sources
   */
  async findPotentialSources(
    criteria: MatchingCriteria,
    availableCameras: RegisteredCamera[]
  ): Promise<EvidenceMatch[]> {
    // Step 1: Spatial filtering - cameras within radius
    const nearbyDevices = this.filterByLocation(availableCameras, criteria.incident)
    
    console.log(`Found ${nearbyDevices.length} cameras within ${criteria.incident.radius}m radius`)

    // Step 2: Temporal filtering - cameras active during incident time
    const activeDevices = this.filterByTimeWindow(nearbyDevices, criteria.incident.timeWindow)
    
    console.log(`${activeDevices.length} cameras were active during incident timeframe`)

    // Step 3: Capability filtering - cameras that can capture relevant evidence
    const capableDevices = this.filterByCapabilities(activeDevices, criteria)
    
    console.log(`${capableDevices.length} cameras meet capability requirements`)

    // Step 4: Detailed analysis and confidence scoring
    const analyzedCameras = await Promise.all(
      capableDevices.map(camera => this.analyzeCameraMatch(camera, criteria))
    )

    // Step 5: Sort by confidence and apply budget constraints
    const sortedCameras = analyzedCameras
      .sort((a, b) => b.overallConfidence - a.overallConfidence)
      .slice(0, criteria.targeting.maxSources)

    // Step 6: Convert to EvidenceMatch format
    return this.createEvidenceMatches(sortedCameras, criteria)
  }

  /**
   * Filter cameras by spatial proximity to incident
   */
  private filterByLocation(
    cameras: RegisteredCamera[], 
    incident: { location: Location; radius: number }
  ): RegisteredCamera[] {
    return cameras.filter(camera => {
      // Use EXACT camera location for targeting (not fuzzy display location)
      const distance = this.calculateDistance(camera.location, incident.location)
      return distance <= incident.radius
    })
  }

  /**
   * Filter cameras by temporal availability
   */
  private filterByTimeWindow(
    cameras: RegisteredCamera[],
    timeWindow: { start: Date; end: Date }
  ): RegisteredCamera[] {
    return cameras.filter(camera => {
      // Check if camera was operational during incident time
      const incidentTime = timeWindow.start.getTime()
      const cameraCreated = camera.createdAt.toDate().getTime()
      
      // Camera must have existed before incident
      if (cameraCreated > incidentTime) return false
      
      // Check operational status
      if (camera.operationalStatus !== 'active') return false
      
      // Check quiet hours if enabled
      if (camera.privacySettings.quietHours?.enabled) {
        const incidentHour = timeWindow.start.getHours()
        const quietStart = parseInt(camera.privacySettings.quietHours.start.split(':')[0])
        const quietEnd = parseInt(camera.privacySettings.quietHours.end.split(':')[0])
        
        if (this.isInQuietHours(incidentHour, quietStart, quietEnd)) {
          return false
        }
      }
      
      return true
    })
  }

  /**
   * Filter cameras by technical capabilities
   */
  private filterByCapabilities(
    cameras: RegisteredCamera[],
    criteria: MatchingCriteria
  ): RegisteredCamera[] {
    return cameras.filter(camera => {
      // Check camera type matches evidence types needed
      const cameraType = this.mapCameraType(camera.type)
      if (!criteria.targeting.evidenceTypes.includes(cameraType)) {
        return false
      }
      
      // Check quality requirements
      if (criteria.targeting.qualityRequirements === 'excellent') {
        // Require 4K resolution for excellent quality
        const hasHighRes = camera.specifications?.resolution?.includes('4K') || 
                          camera.specifications?.resolution?.includes('2160p')
        if (!hasHighRes) return false
      } else if (criteria.targeting.qualityRequirements === 'good') {
        // Require at least 1080p for good quality
        const hasGoodRes = camera.specifications?.resolution?.includes('1080p') ||
                          camera.specifications?.resolution?.includes('4K') ||
                          camera.specifications?.resolution?.includes('2160p')
        if (!hasGoodRes) return false
      }
      
      // Check night vision for nighttime incidents
      const isNighttime = this.isNighttime(criteria.incident.timeWindow.start)
      if (isNighttime && !camera.specifications?.nightVision) {
        return false
      }
      
      return true
    })
  }

  /**
   * Perform detailed analysis of camera match quality
   */
  private async analyzeCameraMatch(
    camera: RegisteredCamera,
    criteria: MatchingCriteria
  ): Promise<CameraAnalysis> {
    const distance = this.calculateDistance(camera.location, criteria.incident.location)
    const viewingAngle = this.calculateViewingAngle(camera, criteria.incident.location)
    const capabilities = this.extractCapabilities(camera)
    
    // Calculate confidence factors
    const spatial = this.calculateSpatialConfidence(distance, criteria.incident.radius, viewingAngle)
    const temporal = this.calculateTemporalConfidence(camera, criteria.incident.timeWindow)
    const technical = this.calculateTechnicalConfidence(camera, criteria)
    const historical = await this.calculateHistoricalConfidence(camera.id)
    
    // Overall confidence is weighted average
    const overallConfidence = (
      spatial * 0.3 +      // 30% weight on location
      temporal * 0.2 +     // 20% weight on timing
      technical * 0.3 +    // 30% weight on capabilities
      historical * 0.2     // 20% weight on reliability
    )
    
    // Calculate estimated reward based on confidence and urgency
    const estimatedReward = this.calculateReward(overallConfidence, criteria)
    
    return {
      camera,
      distance,
      timeActive: true,
      viewingAngle,
      capabilities,
      confidenceFactors: { spatial, temporal, technical, historical },
      overallConfidence,
      estimatedReward
    }
  }

  /**
   * Calculate spatial confidence based on distance and viewing angle
   */
  private calculateSpatialConfidence(
    distance: number, 
    maxRadius: number, 
    viewingAngle: number
  ): number {
    // Distance factor: closer = higher confidence
    const distanceFactor = Math.max(0, 1 - (distance / maxRadius))
    
    // Viewing angle factor: more direct view = higher confidence
    const angleFactor = Math.max(0, 1 - (Math.abs(viewingAngle) / 180))
    
    // Weighted combination
    return (distanceFactor * 0.7) + (angleFactor * 0.3)
  }

  /**
   * Calculate temporal confidence based on camera availability
   */
  private calculateTemporalConfidence(
    camera: RegisteredCamera,
    timeWindow: { start: Date; end: Date }
  ): number {
    let confidence = 1.0
    
    // Reduce confidence if camera was newly installed
    const daysSinceInstall = (timeWindow.start.getTime() - camera.createdAt.toDate().getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceInstall < 7) {
      confidence *= 0.8 // New cameras are less reliable
    }
    
    // Reduce confidence if incident was during quiet hours
    if (camera.privacySettings.quietHours?.enabled) {
      const incidentHour = timeWindow.start.getHours()
      const quietStart = parseInt(camera.privacySettings.quietHours.start.split(':')[0])
      const quietEnd = parseInt(camera.privacySettings.quietHours.end.split(':')[0])
      
      if (this.isInQuietHours(incidentHour, quietStart, quietEnd)) {
        confidence *= 0.5 // Reduced confidence during quiet hours
      }
    }
    
    return Math.max(0, confidence)
  }

  /**
   * Calculate technical confidence based on camera specifications
   */
  private calculateTechnicalConfidence(
    camera: RegisteredCamera,
    criteria: MatchingCriteria
  ): number {
    let confidence = 0.5 // Base confidence
    
    // Resolution bonus
    if (camera.specifications?.resolution?.includes('4K')) {
      confidence += 0.3
    } else if (camera.specifications?.resolution?.includes('1080p')) {
      confidence += 0.2
    }
    
    // Night vision bonus for nighttime incidents
    const isNighttime = this.isNighttime(criteria.incident.timeWindow.start)
    if (isNighttime && camera.specifications?.nightVision) {
      confidence += 0.2
    }
    
    // Camera type bonus
    const cameraType = camera.type
    if (cameraType === 'security') {
      confidence += 0.1 // Security cameras are typically high quality
    } else if (cameraType === 'doorbell') {
      confidence += 0.05 // Doorbell cameras are decent but limited range
    }
    
    return Math.min(1, confidence)
  }

  /**
   * Calculate historical confidence based on past performance
   */
  private async calculateHistoricalConfidence(cameraId: string): Promise<number> {
    // In a real implementation, this would query historical response data
    // For now, return a baseline confidence
    
    // TODO: Implement database query for:
    // - Response rate to previous requests
    // - Quality of footage provided
    // - Timeliness of responses
    // - User satisfaction ratings
    
    return 0.7 // Default to 70% confidence for established cameras
  }

  /**
   * Create EvidenceMatch objects from analyzed cameras
   */
  private createEvidenceMatches(
    analyzedCameras: CameraAnalysis[],
    criteria: MatchingCriteria
  ): EvidenceMatch[] {
    return analyzedCameras.map(analysis => ({
      id: `match-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      requestId: '', // Will be set by calling function
      sourceId: this.generateAnonymousSourceId(analysis.camera.id),
      ownerId: analysis.camera.userId,
      confidence: analysis.overallConfidence,
      matchFactors: {
        timeOverlap: this.calculateTimeOverlap(analysis.camera, criteria.incident.timeWindow),
        distanceFromIncident: analysis.distance,
        viewingAngle: analysis.viewingAngle,
        cameraCapabilities: analysis.capabilities
      },
      estimatedReward: analysis.estimatedReward,
      createdAt: new Date() as any, // Will be converted to Timestamp
      updatedAt: new Date() as any
    }))
  }

  /**
   * Utility function to calculate distance between two points
   */
  private calculateDistance(point1: Location, point2: Location): number {
    const lat1Rad = (point1.lat * Math.PI) / 180
    const lat2Rad = (point2.lat * Math.PI) / 180
    const deltaLatRad = ((point2.lat - point1.lat) * Math.PI) / 180
    const deltaLngRad = ((point2.lng - point1.lng) * Math.PI) / 180

    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    
    return this.EARTH_RADIUS_M * c
  }

  /**
   * Calculate viewing angle between camera and incident
   */
  private calculateViewingAngle(camera: RegisteredCamera, incidentLocation: Location): number {
    // Calculate bearing from camera to incident
    const cameraBearing = this.calculateBearing(camera.location, incidentLocation)
    
    // Compare with camera's field of view direction
    const cameraDirection = camera.fieldOfView.direction
    
    // Calculate angle difference
    let angleDiff = Math.abs(cameraBearing - cameraDirection)
    if (angleDiff > 180) {
      angleDiff = 360 - angleDiff
    }
    
    return angleDiff
  }

  /**
   * Calculate bearing between two points
   */
  private calculateBearing(from: Location, to: Location): number {
    const lat1Rad = (from.lat * Math.PI) / 180
    const lat2Rad = (to.lat * Math.PI) / 180
    const deltaLngRad = ((to.lng - from.lng) * Math.PI) / 180

    const y = Math.sin(deltaLngRad) * Math.cos(lat2Rad)
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(deltaLngRad)

    const bearing = Math.atan2(y, x)
    return ((bearing * 180) / Math.PI + 360) % 360
  }

  /**
   * Check if a time is within quiet hours
   */
  private isInQuietHours(hour: number, quietStart: number, quietEnd: number): boolean {
    if (quietEnd > quietStart) {
      // Normal case: 22:00 to 07:00 (same day)
      return hour >= quietStart && hour < quietEnd
    } else {
      // Overnight case: 22:00 to 07:00 (next day)
      return hour >= quietStart || hour < quietEnd
    }
  }

  /**
   * Check if incident occurred during nighttime
   */
  private isNighttime(date: Date): boolean {
    const hour = date.getHours()
    return hour < 6 || hour > 20 // 8 PM to 6 AM considered nighttime
  }

  /**
   * Map camera type to evidence type
   */
  private mapCameraType(cameraType: string): 'cctv' | 'dashcam' | 'mobile' | 'doorbell' {
    switch (cameraType) {
      case 'security': return 'cctv'
      case 'doorbell': return 'doorbell'
      case 'dash': return 'dashcam'
      case 'indoor':
      case 'other':
      default: return 'cctv'
    }
  }

  /**
   * Extract camera capabilities as string array
   */
  private extractCapabilities(camera: RegisteredCamera): string[] {
    const capabilities: string[] = []
    
    if (camera.specifications?.nightVision) capabilities.push('night_vision')
    if (camera.specifications?.resolution?.includes('4K')) capabilities.push('4k_resolution')
    if (camera.specifications?.resolution?.includes('1080p')) capabilities.push('hd_resolution')
    
    // Add camera type as capability
    capabilities.push(camera.type)
    
    return capabilities
  }

  /**
   * Calculate time overlap between camera availability and incident window
   */
  private calculateTimeOverlap(
    camera: RegisteredCamera, 
    timeWindow: { start: Date; end: Date }
  ): number {
    // For now, assume camera was recording during entire incident window
    // In reality, this would check actual recording schedules
    return (timeWindow.end.getTime() - timeWindow.start.getTime()) / 1000 // seconds
  }

  /**
   * Calculate reward amount based on confidence and criteria
   */
  private calculateReward(confidence: number, criteria: MatchingCriteria): number {
    const baseReward = criteria.budget.rewardPerSource
    
    // Apply confidence multiplier
    let reward = baseReward * confidence
    
    // Apply urgency multiplier
    const urgencyMultipliers = {
      routine: 1.0,
      priority: 1.2,
      urgent: 1.5,
      emergency: 2.0
    }
    
    reward *= urgencyMultipliers[criteria.incident.urgency]
    
    // Round to nearest £5
    return Math.round(reward / 5) * 5
  }

  /**
   * Generate anonymous source ID for privacy
   */
  private generateAnonymousSourceId(cameraId: string): string {
    // Create a hash-based anonymous ID that's consistent but untraceable
    // In production, use a proper cryptographic hash
    const hashInput = cameraId + process.env.NEXT_PUBLIC_ANONYMOUS_SALT
    return `CAM-${hashInput.split('').reduce((a, b) => {
      const hash = ((a << 5) - a) + b.charCodeAt(0)
      return hash & hash
    }, 0).toString(36).toUpperCase().substr(0, 8)}`
  }
}

// =============================================================================
// CONFIDENCE SCORING UTILITIES
// =============================================================================

export class ConfidenceCalculator {
  /**
   * Calculate overall match confidence using weighted factors
   */
  static calculateOverallConfidence(factors: {
    spatial: number
    temporal: number
    technical: number
    historical: number
  }): number {
    const weights = {
      spatial: 0.35,    // Location is most important
      temporal: 0.20,   // Timing is important
      technical: 0.30,  // Camera quality matters
      historical: 0.15  // Past performance indicates reliability
    }
    
    return (
      factors.spatial * weights.spatial +
      factors.temporal * weights.temporal +
      factors.technical * weights.technical +
      factors.historical * weights.historical
    )
  }

  /**
   * Get confidence level description
   */
  static getConfidenceLevel(confidence: number): {
    level: 'excellent' | 'good' | 'fair' | 'poor'
    description: string
    color: string
  } {
    if (confidence >= 0.8) {
      return {
        level: 'excellent',
        description: 'High-quality evidence very likely',
        color: 'green'
      }
    } else if (confidence >= 0.6) {
      return {
        level: 'good',
        description: 'Good chance of useful evidence',
        color: 'blue'
      }
    } else if (confidence >= 0.4) {
      return {
        level: 'fair',
        description: 'May provide supporting evidence',
        color: 'yellow'
      }
    } else {
      return {
        level: 'poor',
        description: 'Limited evidence potential',
        color: 'red'
      }
    }
  }
}

// =============================================================================
// EVIDENCE REQUEST HELPERS
// =============================================================================

export const EVIDENCE_REQUEST_TEMPLATES = {
  police: {
    routine: {
      subject: 'Police Evidence Request - Routine Investigation',
      message: 'We are investigating an incident in your area and would appreciate any relevant camera footage you may have.',
      urgency: 'routine' as const,
      responseTime: '48-72 hours'
    },
    priority: {
      subject: 'Police Evidence Request - Priority Investigation',
      message: 'We are conducting a priority investigation and urgently need any relevant camera footage from your area.',
      urgency: 'priority' as const,
      responseTime: '24 hours'
    },
    urgent: {
      subject: 'Police Evidence Request - Urgent Investigation',
      message: 'URGENT: We are investigating a serious incident and need immediate access to any relevant camera footage.',
      urgency: 'urgent' as const,
      responseTime: '6 hours'
    },
    emergency: {
      subject: 'Police Evidence Request - EMERGENCY',
      message: 'EMERGENCY INVESTIGATION: Critical evidence needed immediately. Please respond ASAP with any relevant footage.',
      urgency: 'emergency' as const,
      responseTime: '1 hour'
    }
  },
  insurance: {
    routine: {
      subject: 'Insurance Investigation - Footage Request',
      message: 'We are investigating an insurance claim and would appreciate any relevant camera footage for validation.',
      urgency: 'routine' as const,
      responseTime: '5-7 days'
    }
  },
  security: {
    routine: {
      subject: 'Security Investigation - Evidence Request',
      message: 'We are conducting a security investigation and would appreciate access to relevant camera footage.',
      urgency: 'routine' as const,
      responseTime: '2-3 days'
    }
  }
} as const

export default EvidenceMatchingEngine
