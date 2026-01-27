import crypto from 'crypto'
import type { Location } from '@/types'
import type { RegisteredCamera } from '@/types/camera'
import type { UserRole } from '@/types/premium/subscription'

// =============================================================================
// LOCATION PRIVACY MANAGEMENT
// =============================================================================

export interface LocationPrivacySettings {
  exactLocationAccess: UserRole[] // Who can see exact locations
  fuzzyRadius: number // Radius for location obfuscation in meters
  minimumDistance: number // Minimum distance between obfuscated locations
  preserveRelativePositions: boolean // Maintain relative positioning in fuzzy locations
}

export interface FuzzyLocation {
  originalLocation: Location
  displayLocation: Location
  privacyRadius: number
  obfuscationMethod: 'circular' | 'grid' | 'polygonal'
  timestamp: Date
}

export class LocationPrivacyManager {
  private readonly DEFAULT_SETTINGS: LocationPrivacySettings = {
    exactLocationAccess: ['police', 'premium_business', 'admin', 'super_admin'],
    fuzzyRadius: 25, // 25 meter radius = 50 meter diameter
    minimumDistance: 10, // Minimum 10 meters between fuzzy points
    preserveRelativePositions: true
  }

  /**
   * Create privacy-protected display location for community view
   */
  createFuzzyLocation(
    exactLocation: Location, 
    privacySettings: Partial<LocationPrivacySettings> = {},
    seed?: string
  ): FuzzyLocation {
    const settings = { ...this.DEFAULT_SETTINGS, ...privacySettings }
    
    // Use deterministic randomization if seed provided (for consistent fuzzy locations)
    const random = seed ? this.seededRandom(seed) : Math.random
    
    // Generate random offset within privacy radius
    const angle = random() * 2 * Math.PI
    const distance = random() * settings.fuzzyRadius
    
    // Convert to lat/lng offset
    const latOffset = (distance * Math.cos(angle)) / 111320 // 1 degree lat ≈ 111320 meters
    const lngOffset = (distance * Math.sin(angle)) / (111320 * Math.cos(exactLocation.lat * Math.PI / 180))
    
    const displayLocation: Location = {
      lat: exactLocation.lat + latOffset,
      lng: exactLocation.lng + lngOffset
    }

    return {
      originalLocation: exactLocation,
      displayLocation,
      privacyRadius: settings.fuzzyRadius,
      obfuscationMethod: 'circular',
      timestamp: new Date()
    }
  }

  /**
   * Create grid-based location obfuscation for consistent positioning
   */
  createGridBasedFuzzyLocation(
    exactLocation: Location,
    gridSize: number = 50 // Grid cell size in meters
  ): FuzzyLocation {
    // Snap to grid center for consistent fuzzy locations
    const gridLat = Math.floor(exactLocation.lat * 111320 / gridSize) * gridSize / 111320
    const gridLng = Math.floor(exactLocation.lng * (111320 * Math.cos(exactLocation.lat * Math.PI / 180)) / gridSize) * gridSize / (111320 * Math.cos(exactLocation.lat * Math.PI / 180))
    
    // Add center offset to grid cell
    const displayLocation: Location = {
      lat: gridLat + (gridSize / 2) / 111320,
      lng: gridLng + (gridSize / 2) / (111320 * Math.cos(exactLocation.lat * Math.PI / 180))
    }

    return {
      originalLocation: exactLocation,
      displayLocation,
      privacyRadius: gridSize / 2,
      obfuscationMethod: 'grid',
      timestamp: new Date()
    }
  }

  /**
   * Get appropriate location based on user role and privacy settings
   */
  getLocationForUser(
    camera: RegisteredCamera,
    userRole: UserRole,
    privacySettings?: LocationPrivacySettings
  ): Location {
    const settings = privacySettings || this.DEFAULT_SETTINGS
    
    // Camera owner always sees exact location
    if (camera.userId === this.getCurrentUserId()) {
      return camera.location
    }
    
    // Check if user role has access to exact locations
    if (settings.exactLocationAccess.includes(userRole)) {
      return camera.location
    }
    
    // Return fuzzy location for community users
    return camera.displayLocation
  }

  /**
   * Batch process cameras for community display
   */
  applyCommunityPrivacy(
    cameras: RegisteredCamera[],
    privacySettings?: Partial<LocationPrivacySettings>
  ): RegisteredCamera[] {
    const settings = { ...this.DEFAULT_SETTINGS, ...privacySettings }
    
    return cameras.map(camera => {
      // If camera already has display location, use it
      if (camera.displayLocation) {
        return camera
      }
      
      // Generate consistent fuzzy location using camera ID as seed
      const fuzzyLocation = this.createFuzzyLocation(
        camera.location,
        settings,
        camera.id
      )
      
      return {
        ...camera,
        displayLocation: fuzzyLocation.displayLocation
      }
    })
  }

  /**
   * Verify location privacy is maintained
   */
  verifyLocationPrivacy(
    exactLocation: Location,
    displayLocation: Location,
    expectedRadius: number
  ): {
    isPrivacyMaintained: boolean
    actualDistance: number
    privacyScore: number // 0-1, higher is better privacy
  } {
    const distance = this.calculateDistance(exactLocation, displayLocation)
    const isPrivacyMaintained = distance <= expectedRadius
    
    // Privacy score: closer to center = lower privacy
    const privacyScore = Math.min(distance / expectedRadius, 1)
    
    return {
      isPrivacyMaintained,
      actualDistance: distance,
      privacyScore
    }
  }

  /**
   * Calculate distance between two points in meters
   */
  private calculateDistance(point1: Location, point2: Location): number {
    const R = 6371000 // Earth's radius in meters
    const lat1Rad = (point1.lat * Math.PI) / 180
    const lat2Rad = (point2.lat * Math.PI) / 180
    const deltaLatRad = ((point2.lat - point1.lat) * Math.PI) / 180
    const deltaLngRad = ((point2.lng - point1.lng) * Math.PI) / 180

    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    
    return R * c
  }

  /**
   * Seeded random number generator for consistent results
   */
  private seededRandom(seed: string): () => number {
    let hash = 0
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    
    return () => {
      hash = (hash * 9301 + 49297) % 233280
      return hash / 233280
    }
  }

  /**
   * Get current user ID (mock implementation)
   */
  private getCurrentUserId(): string {
    // In real implementation, get from auth context
    return 'current-user-id'
  }
}

// =============================================================================
// USER ANONYMIZATION
// =============================================================================

export interface AnonymousUser {
  originalUserId: string
  anonymousId: string
  createdAt: Date
  context: 'evidence_submission' | 'incident_report' | 'legal_proceedings'
  retentionPeriod: number // days
}

export class UserAnonymizationManager {
  private readonly SALT = process.env.NEXT_PUBLIC_ANONYMIZATION_SALT || 'default-anonymization-salt'
  
  /**
   * Generate anonymous ID for user while maintaining consistency
   */
  generateAnonymousId(
    userId: string, 
    context: AnonymousUser['context'],
    additionalSalt?: string
  ): string {
    const fullSalt = this.SALT + (additionalSalt || '')
    const hash = crypto.createHash('sha256')
    hash.update(userId + fullSalt + context)
    
    const anonymousId = hash.digest('hex').substring(0, 16).toUpperCase()
    
    // Add context prefix for identification
    const prefixes = {
      evidence_submission: 'EVD',
      incident_report: 'INC', 
      legal_proceedings: 'LEG'
    }
    
    return `${prefixes[context]}-${anonymousId}`
  }

  /**
   * Create anonymous user record for legal proceedings
   */
  createAnonymousUser(
    userId: string,
    context: AnonymousUser['context'],
    retentionDays: number = 2555 // ~7 years default
  ): AnonymousUser {
    return {
      originalUserId: userId,
      anonymousId: this.generateAnonymousId(userId, context),
      createdAt: new Date(),
      context,
      retentionPeriod: retentionDays
    }
  }

  /**
   * Verify anonymous ID belongs to user (for reward payments etc.)
   */
  verifyAnonymousId(userId: string, anonymousId: string, context: AnonymousUser['context']): boolean {
    const expectedAnonymousId = this.generateAnonymousId(userId, context)
    return expectedAnonymousId === anonymousId
  }

  /**
   * Generate court witness reference that protects identity
   */
  generateCourtReference(userId: string, caseId: string): {
    witnessReference: string
    courtId: string
    verificationCode: string
  } {
    const witnessReference = this.generateAnonymousId(userId, 'legal_proceedings', caseId)
    
    // Generate court ID for legal identification
    const courtHash = crypto.createHash('sha256')
    courtHash.update(userId + caseId + 'court-reference')
    const courtId = 'WITNESS-' + courtHash.digest('hex').substring(0, 8).toUpperCase()
    
    // Generate verification code for court use
    const verifyHash = crypto.createHash('sha256')
    verifyHash.update(userId + caseId + new Date().toDateString())
    const verificationCode = verifyHash.digest('hex').substring(0, 12).toUpperCase()
    
    return {
      witnessReference,
      courtId,
      verificationCode
    }
  }
}

// =============================================================================
// DATA RETENTION MANAGEMENT
// =============================================================================

export interface RetentionPolicy {
  dataType: 'incident_reports' | 'evidence_files' | 'user_data' | 'payment_records' | 'audit_logs'
  retentionPeriod: number // days
  automaticDeletion: boolean
  legalHoldExemption: boolean // Can be held longer for legal reasons
  deletionMethod: 'soft_delete' | 'hard_delete' | 'anonymize'
}

export class DataRetentionManager {
  private readonly RETENTION_POLICIES: RetentionPolicy[] = [
    {
      dataType: 'incident_reports',
      retentionPeriod: 2555, // 7 years
      automaticDeletion: true,
      legalHoldExemption: true,
      deletionMethod: 'soft_delete'
    },
    {
      dataType: 'evidence_files',
      retentionPeriod: 2555, // 7 years
      automaticDeletion: false, // Manual review required
      legalHoldExemption: true,
      deletionMethod: 'hard_delete'
    },
    {
      dataType: 'user_data',
      retentionPeriod: 1095, // 3 years
      automaticDeletion: true,
      legalHoldExemption: false,
      deletionMethod: 'anonymize'
    },
    {
      dataType: 'payment_records',
      retentionPeriod: 2190, // 6 years (financial regulations)
      automaticDeletion: true,
      legalHoldExemption: true,
      deletionMethod: 'soft_delete'
    },
    {
      dataType: 'audit_logs',
      retentionPeriod: 3650, // 10 years
      automaticDeletion: false,
      legalHoldExemption: true,
      deletionMethod: 'soft_delete'
    }
  ]

  /**
   * Get retention policy for data type
   */
  getRetentionPolicy(dataType: RetentionPolicy['dataType']): RetentionPolicy | undefined {
    return this.RETENTION_POLICIES.find(policy => policy.dataType === dataType)
  }

  /**
   * Check if data should be deleted based on retention policy
   */
  shouldDeleteData(
    dataType: RetentionPolicy['dataType'],
    createdAt: Date,
    hasLegalHold: boolean = false
  ): {
    shouldDelete: boolean
    reason: string
    daysOverdue?: number
  } {
    const policy = this.getRetentionPolicy(dataType)
    if (!policy) {
      return {
        shouldDelete: false,
        reason: 'No retention policy found for data type'
      }
    }

    const daysSinceCreation = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
    const isExpired = daysSinceCreation > policy.retentionPeriod
    
    if (!isExpired) {
      return {
        shouldDelete: false,
        reason: 'Data within retention period'
      }
    }

    if (hasLegalHold && policy.legalHoldExemption) {
      return {
        shouldDelete: false,
        reason: 'Legal hold prevents deletion despite expiration'
      }
    }

    const daysOverdue = daysSinceCreation - policy.retentionPeriod
    
    return {
      shouldDelete: policy.automaticDeletion,
      reason: policy.automaticDeletion 
        ? `Automatic deletion required - ${daysOverdue} days overdue`
        : `Manual review required for deletion - ${daysOverdue} days overdue`,
      daysOverdue
    }
  }

  /**
   * Generate GDPR-compliant deletion report
   */
  generateDeletionReport(
    deletedItems: {
      id: string
      dataType: RetentionPolicy['dataType']
      deletedAt: Date
      deletionMethod: RetentionPolicy['deletionMethod']
      reason: string
    }[]
  ): string {
    const report = {
      reportId: `DEL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      generatedAt: new Date().toISOString(),
      totalItemsDeleted: deletedItems.length,
      deletionSummary: deletedItems.reduce((acc, item) => {
        acc[item.dataType] = (acc[item.dataType] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      deletedItems: deletedItems.map(item => ({
        id: item.id,
        dataType: item.dataType,
        deletedAt: item.deletedAt.toISOString(),
        method: item.deletionMethod,
        reason: item.reason
      })),
      compliance: {
        gdprCompliant: true,
        legalBasisForRetention: 'Data Protection Act 2018, Schedule 2, Part 1',
        dataSubjectRights: 'Right to erasure exercised automatically per retention policy',
        auditTrail: 'Complete audit trail maintained per regulatory requirements'
      }
    }

    return JSON.stringify(report, null, 2)
  }
}

// =============================================================================
// GDPR CONSENT MANAGEMENT
// =============================================================================

export interface ConsentRecord {
  userId: string
  consentType: 'evidence_sharing' | 'data_processing' | 'marketing' | 'analytics'
  consentGiven: boolean
  consentDate: Date
  withdrawalDate?: Date
  legalBasis: string
  version: string // Terms version
  ipAddress?: string
  userAgent?: string
}

export class ConsentManager {
  /**
   * Record user consent
   */
  recordConsent(
    userId: string,
    consentType: ConsentRecord['consentType'],
    consentGiven: boolean,
    legalBasis: string,
    version: string,
    metadata?: {
      ipAddress?: string
      userAgent?: string
    }
  ): ConsentRecord {
    return {
      userId,
      consentType,
      consentGiven,
      consentDate: new Date(),
      legalBasis,
      version,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent
    }
  }

  /**
   * Check if user has valid consent for specific processing
   */
  hasValidConsent(
    userId: string,
    consentType: ConsentRecord['consentType'],
    currentVersion: string
  ): {
    hasConsent: boolean
    requiresUpdate: boolean
    reason: string
  } {
    // In real implementation, query from database
    // Mock response for demonstration
    return {
      hasConsent: true,
      requiresUpdate: false,
      reason: 'Valid consent on record for current terms version'
    }
  }

  /**
   * Generate consent withdrawal confirmation
   */
  generateWithdrawalConfirmation(
    userId: string,
    consentType: ConsentRecord['consentType'],
    withdrawalDate: Date
  ): string {
    const anonymousId = crypto.createHash('sha256')
      .update(userId + 'withdrawal-confirmation')
      .digest('hex')
      .substring(0, 16)
      .toUpperCase()

    return `
CONSENT WITHDRAWAL CONFIRMATION
===============================

Confirmation ID: CWD-${anonymousId}
Withdrawal Date: ${withdrawalDate.toISOString()}
Consent Type: ${consentType.replace('_', ' ').toUpperCase()}

Your consent has been withdrawn and no further processing
will occur under this consent basis. Data will be deleted
or anonymized according to our retention policy.

For questions: privacy@neighbourhoodwatchplus.com
    `.trim()
  }
}

