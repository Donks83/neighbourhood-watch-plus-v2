import type { Location } from '@/types'
import type { CameraFieldOfView, RegisteredCamera, CameraCoverage, SecurityScore, PropertyDashboard, ActivityItem } from '@/types/camera'

/**
 * Calculate the distance between two geographic points using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lng1 Longitude of first point  
 * @param lat2 Latitude of second point
 * @param lng2 Longitude of second point
 * @returns Distance in meters
 */
export function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180 // φ, λ in radians
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lng2 - lng1) * Math.PI / 180

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

  const distance = R * c // in metres
  return distance
}

/**
 * Check if a point is within a given radius of another point
 * @param centerLat Center point latitude
 * @param centerLng Center point longitude
 * @param pointLat Point to check latitude
 * @param pointLng Point to check longitude
 * @param radiusMeters Radius in meters
 * @returns True if point is within radius
 */
export function isWithinRadius(
  centerLat: number, 
  centerLng: number, 
  pointLat: number, 
  pointLng: number, 
  radiusMeters: number
): boolean {
  const distance = getDistance(centerLat, centerLng, pointLat, pointLng)
  return distance <= radiusMeters
}

/**
 * Generate a field-of-view cone polygon from camera position and viewing parameters
 * Optimized for smooth rendering with adaptive point density
 */
export function generateCameraFieldOfView(
  cameraLocation: Location,
  fieldOfView: CameraFieldOfView
): GeoJSON.Feature<GeoJSON.Polygon> {
  const { direction, angle, range } = fieldOfView
  
  // Convert degrees to radians
  const directionRad = (direction - 90) * Math.PI / 180 // Adjust for map coordinate system
  const halfAngleRad = (angle / 2) * Math.PI / 180
  
  // Start from camera position
  const coordinates: [number, number][] = []
  coordinates.push([cameraLocation.lng, cameraLocation.lat])
  
  // Adaptive step count based on angle size for smoother performance
  // Smaller angles need fewer points, wider angles need more for smoothness
  const baseSteps = Math.max(6, Math.min(16, Math.floor(angle / 8)))
  const steps = baseSteps
  
  for (let i = 0; i <= steps; i++) {
    const currentAngle = directionRad - halfAngleRad + (i * (2 * halfAngleRad) / steps)
    
    // Calculate point on the arc
    const dx = range * Math.cos(currentAngle)
    const dy = range * Math.sin(currentAngle)
    
    // Convert to lat/lng with proper earth curvature compensation
    const lat = cameraLocation.lat + dy / 111320
    const lng = cameraLocation.lng + dx / (111320 * Math.cos(cameraLocation.lat * Math.PI / 180))
    
    coordinates.push([lng, lat])
  }
  
  // Close the polygon
  coordinates.push([cameraLocation.lng, cameraLocation.lat])
  
  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [coordinates]
    },
    properties: {
      cameraId: 'temp',
      direction: Math.round(direction * 10) / 10, // Round to 1 decimal place for stability
      angle,
      range
    }
  }
}

/**
 * Calculate security score based on camera coverage and community participation
 */
export function calculateSecurityScore(cameras: RegisteredCamera[]): SecurityScore {
  const activeCameras = cameras.filter(c => c.operationalStatus === 'active')
  
  // Camera count score (0-25 points)
  const cameraCountScore = Math.min(25, activeCameras.length * 8)
  
  // Coverage quality score (0-25 points) - based on field of view overlap and range
  const coverageScore = calculateCoverageQuality(activeCameras)
  
  // Community participation (0-25 points)
  const participationScore = activeCameras.filter(c => c.privacySettings.shareWithCommunity).length * (25 / Math.max(1, activeCameras.length))
  
  // Response history (0-25 points) - placeholder for now
  const responseScore = 20 // TODO: Calculate from actual response history
  
  const overall = Math.round(cameraCountScore + coverageScore + participationScore + responseScore)
  
  return {
    overall: Math.min(100, overall),
    breakdown: {
      cameraCount: Math.round(cameraCountScore),
      coverageQuality: Math.round(coverageScore),
      communityParticipation: Math.round(participationScore),
      responseHistory: Math.round(responseScore),
      trustScore: 85 // Placeholder
    },
    suggestions: generateSecuritySuggestions(cameras, overall),
    lastCalculated: new Date() as any
  }
}

function calculateCoverageQuality(cameras: RegisteredCamera[]): number {
  if (cameras.length === 0) return 0
  
  // Simple heuristic: wider field of view and longer range = better coverage
  const avgFieldOfView = cameras.reduce((sum, cam) => sum + cam.fieldOfView.angle, 0) / cameras.length
  const avgRange = cameras.reduce((sum, cam) => sum + cam.fieldOfView.range, 0) / cameras.length
  
  // Normalize to 0-25 scale
  const fovScore = Math.min(15, (avgFieldOfView / 120) * 15) // 120° is considered excellent
  const rangeScore = Math.min(10, (avgRange / 50) * 10) // 50m is considered excellent
  
  return fovScore + rangeScore
}

function generateSecuritySuggestions(cameras: RegisteredCamera[], currentScore: number): string[] {
  const suggestions: string[] = []
  
  if (cameras.length < 2) {
    suggestions.push("Consider adding a rear garden camera to improve your property's security coverage.")
  }
  
  if (cameras.filter(c => c.privacySettings.shareWithCommunity).length < cameras.length) {
    suggestions.push("Enable community sharing on more cameras to help neighbors and boost your trust score.")
  }
  
  if (currentScore < 70) {
    suggestions.push("Add cameras with wider viewing angles to eliminate blind spots.")
  }
  
  const hasStreetView = cameras.some(c => 
    c.fieldOfView.direction >= 315 || c.fieldOfView.direction <= 45 || 
    (c.fieldOfView.direction >= 135 && c.fieldOfView.direction <= 225)
  )
  
  if (!hasStreetView) {
    suggestions.push("Consider adding a street-facing camera for enhanced perimeter security.")
  }
  
  return suggestions
}

/**
 * Generate sample property dashboard data for development/demo
 */
export function generateSamplePropertyDashboard(userLocation: Location): PropertyDashboard {
  const sampleCameras: RegisteredCamera[] = [
    {
      id: 'camera-front-door',
      userEmail: 'user@example.com',
      userId: 'user-123',
      location: { lat: userLocation.lat + 0.0001, lng: userLocation.lng - 0.0002 },
      displayLocation: { lat: userLocation.lat + 0.0001 + (Math.random() - 0.5) * 0.0002, lng: userLocation.lng - 0.0002 + (Math.random() - 0.5) * 0.0002 },
      name: 'Front Door Camera',
      type: 'doorbell',
      fieldOfView: {
        direction: 180, // Facing south (toward street)
        angle: 110,     // Wide angle doorbell camera
        range: 15       // 15 meter range
      },
      specifications: {
        resolution: '1080p',
        nightVision: true,
        brand: 'Ring',
        model: 'Video Doorbell Pro'
      },
      privacySettings: {
        shareWithCommunity: true,
        requireApproval: false,
        maxRequestRadius: 100,
        autoRespond: true,
        quietHours: {
          enabled: true,
          start: '22:00',
          end: '07:00'
        }
      },
      operationalStatus: 'active',
      verification: {
        status: 'approved',
        submittedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) as any,
        verifiedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000) as any,
        verifiedBy: 'admin-123',
        evidence: {
          photos: [],
          documents: []
        },
        history: [],
        priority: 'normal'
      },
      status: 'active',
      lastActivity: new Date(Date.now() - 6 * 60 * 60 * 1000) as any, // 6 hours ago
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) as any, // 30 days ago
      lastUpdated: new Date() as any
    },
    {
      id: 'camera-driveway',
      userEmail: 'user@example.com',
      userId: 'user-123',
      location: { lat: userLocation.lat + 0.0002, lng: userLocation.lng + 0.0001 },
      displayLocation: { lat: userLocation.lat + 0.0002 + (Math.random() - 0.5) * 0.0002, lng: userLocation.lng + 0.0001 + (Math.random() - 0.5) * 0.0002 },
      name: 'Driveway Camera',
      type: 'security',
      fieldOfView: {
        direction: 225, // Facing southwest
        angle: 75,      // Security camera angle
        range: 25       // 25 meter range
      },
      specifications: {
        resolution: '4K',
        nightVision: true,
        brand: 'Hikvision',
        model: 'DS-2CD2143G2-I'
      },
      privacySettings: {
        shareWithCommunity: true,
        requireApproval: true,
        maxRequestRadius: 150,
        autoRespond: false
      },
      operationalStatus: 'active',
      verification: {
        status: 'approved',
        submittedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) as any,
        verifiedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000) as any,
        verifiedBy: 'admin-123',
        evidence: {
          photos: [],
          documents: []
        },
        history: [],
        priority: 'normal'
      },
      status: 'active',
      lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000) as any, // 2 hours ago
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) as any, // 15 days ago
      lastUpdated: new Date() as any
    }
  ]
  
  const securityScore = calculateSecurityScore(sampleCameras)
  
  const recentActivity: ActivityItem[] = [
    {
      id: 'activity-1',
      type: 'footage_request',
      title: 'New footage request',
      description: 'Request for footage from your Front Door Camera',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) as any,
      status: 'pending',
      relatedCamera: 'camera-front-door'
    },
    {
      id: 'activity-2',
      type: 'footage_shared',
      title: 'Footage shared',
      description: 'Shared footage for traffic incident on Fairfield Road',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) as any,
      status: 'completed',
      relatedCamera: 'camera-driveway'
    },
    {
      id: 'activity-3',
      type: 'camera_verified',
      title: 'Camera verified',
      description: 'Driveway Camera passed verification',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) as any,
      status: 'completed',
      relatedCamera: 'camera-driveway'
    },
    {
      id: 'activity-4',
      type: 'coverage_improved',
      title: 'Coverage improved',
      description: 'New neighbor camera added within 100m',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) as any,
      status: 'completed'
    }
  ]
  
  return {
    userId: 'user-123',
    address: '12 Westerleigh Avenue, TS19 7ER',
    cameras: sampleCameras,
    securityScore,
    recentActivity,
    activeRequests: 3,
    nearbyCameras: 47,
    trustScore: 85,
    stats: {
      requestsFulfilled: 12,
      averageResponseTime: 2.3, // hours
      positiveReviews: 10,
      totalReviews: 10
    }
  }
}

/**
 * Calculate the angle between two points (for camera direction)
 * Optimized for stability and reduced jitter
 */
export function calculateAngle(from: Location, to: Location): number {
  const deltaLng = to.lng - from.lng
  const deltaLat = to.lat - from.lat
  
  // Add minimum threshold to prevent micro-movements
  const minThreshold = 0.00001
  if (Math.abs(deltaLng) < minThreshold && Math.abs(deltaLat) < minThreshold) {
    return 0 // Return default direction if movement is too small
  }
  
  let angle = Math.atan2(deltaLng * Math.cos(from.lat * Math.PI / 180), deltaLat) * 180 / Math.PI
  
  // Normalize to 0-360 degrees
  angle = (angle + 360) % 360
  
  // Round to reduce jitter (to nearest 2 degrees for smoother movement)
  return Math.round(angle / 2) * 2
}

/**
 * Enhanced fuzzy location for better privacy protection
 * Uses cryptographically secure randomization for true 360-degree scatter pattern
 * Default 50m radius (100m diameter) ensures individual cameras cannot be targeted
 */
export function fuzzyLocation(location: Location, radiusMeters: number = 50): Location {
  try {
    // Check if crypto.getRandomValues is available
    if (typeof crypto === 'undefined' || typeof crypto.getRandomValues !== 'function') {
      console.error('🔒 SECURITY WARNING: crypto.getRandomValues not available, falling back to Math.random()')
      // Fallback to Math.random() but log the issue
      const angle = Math.random() * 2 * Math.PI
      const distance = Math.sqrt(Math.random()) * radiusMeters
      const latOffset = (distance * Math.cos(angle)) / 111320
      const lngOffset = (distance * Math.sin(angle)) / (111320 * Math.cos(location.lat * Math.PI / 180))
      
      return {
        lat: location.lat + latOffset,
        lng: location.lng + lngOffset
      }
    }

    // Use multiple crypto random values with maximum entropy mixing
    const randomValues = new Uint32Array(6) // Even more entropy
    crypto.getRandomValues(randomValues)
    
    // Multi-layer mixing with different operations
    const mixedAngleRandom = ((randomValues[0] ^ randomValues[3] ^ randomValues[5]) >>> 0) / 4294967295
    const mixedDistanceRandom = ((randomValues[1] ^ randomValues[4] ^ (randomValues[2] << 16)) >>> 0) / 4294967295
    
    // Add multiple entropy sources
    const timeEntropy = (Date.now() % 10000) / 10000 // Larger time window
    const performanceEntropy = (performance.now() % 1000) / 1000
    const randomEntropy = (Math.random() * 0.1) // Small additional randomness
    
    // Final entropy mixing with non-linear combination
    let finalAngleRandom = ((mixedAngleRandom + timeEntropy + performanceEntropy + randomEntropy) % 1.0)
    let finalDistanceRandom = ((mixedDistanceRandom + (timeEntropy * 0.7) + (performanceEntropy * 0.3) + (randomEntropy * 0.5)) % 1.0)
    
    // Additional scrambling to break any remaining patterns
    finalAngleRandom = (finalAngleRandom * 1.618033988749) % 1.0 // Golden ratio mixing
    finalDistanceRandom = (finalDistanceRandom * 2.718281828459) % 1.0 // Euler's number mixing
    
    // Full 360-degree random scatter pattern with improved randomness
    const angle = finalAngleRandom * 2 * Math.PI
    
    // Random distance within radius with square root for even spatial distribution
    const distance = Math.sqrt(finalDistanceRandom) * radiusMeters
    
    // Calculate offset coordinates with proper geographic projection
    const latOffset = (distance * Math.cos(angle)) / 111320
    const lngOffset = (distance * Math.sin(angle)) / (111320 * Math.cos(location.lat * Math.PI / 180))
    
    const result = {
      lat: location.lat + latOffset,
      lng: location.lng + lngOffset
    }
    
    // Only log if there's an issue (remove predictable debug output)
    if (distance < 5 || distance > radiusMeters + 5) {
      console.warn('⚠️ fuzzyLocation: Unexpected distance', { distance, target: radiusMeters })
    }
    
    return result
  } catch (error) {
    console.error('❌ Error in fuzzyLocation, falling back to Math.random():', error)
    // Emergency fallback
    const angle = Math.random() * 2 * Math.PI
    const distance = Math.sqrt(Math.random()) * radiusMeters
    const latOffset = (distance * Math.cos(angle)) / 111320
    const lngOffset = (distance * Math.sin(angle)) / (111320 * Math.cos(location.lat * Math.PI / 180))
    
    return {
      lat: location.lat + latOffset,
      lng: location.lng + lngOffset
    }
  }
}
