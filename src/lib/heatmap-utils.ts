import type { Location } from '@/types'
import type { RegisteredCamera } from '@/types/camera'

export interface CameraDensityArea {
  id: string
  center: Location
  radius: number // in meters
  density: number // 0-1 (0 = no cameras, 1 = high density)
  cameraCount: number // approximate count for this area
  areaType: 'residential' | 'commercial' | 'mixed'
  actualCameras?: RegisteredCamera[] // Real cameras contributing to this area
}

export interface HeatmapPoint {
  location: Location
  weight: number // 0-1 intensity
}

/**
 * Converts camera density areas into heatmap points for visualization
 */
export function generateHeatmapPoints(densityAreas: CameraDensityArea[]): HeatmapPoint[] {
  const points: HeatmapPoint[] = []
  
  densityAreas.forEach(area => {
    // Generate multiple points within each density area for smooth heatmap
    const pointsPerArea = Math.max(2, Math.floor(area.density * 8)) // Reduced clustering
    
    for (let i = 0; i < pointsPerArea; i++) {
      // Use cryptographic randomization for unpredictable patterns
      const randomValues = new Uint32Array(3)
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(randomValues)
      } else {
        // Fallback
        randomValues[0] = Math.floor(Math.random() * 4294967295)
        randomValues[1] = Math.floor(Math.random() * 4294967295)
        randomValues[2] = Math.floor(Math.random() * 4294967295)
      }
      
      // Convert to normalized random values
      const angleRandom = (randomValues[0] / 4294967295) * 2 * Math.PI
      const distanceRandom = Math.sqrt(randomValues[1] / 4294967295) // Square root for even distribution
      const weightRandom = randomValues[2] / 4294967295
      
      // Generate random points within the area radius with better distribution
      const distance = distanceRandom * area.radius * 0.9 // Use more of the area
      
      const lat = area.center.lat + (distance * Math.cos(angleRandom)) / 111320
      const lng = area.center.lng + (distance * Math.sin(angleRandom)) / (111320 * Math.cos(area.center.lat * Math.PI / 180))
      
      points.push({
        location: { lat, lng },
        weight: area.density * (0.6 + weightRandom * 0.4) // More varied weights
      })
    }
    
    // Add center point with varied weight (not always full weight)
    const centerRandomValue = new Uint32Array(1)
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(centerRandomValue)
    } else {
      centerRandomValue[0] = Math.floor(Math.random() * 4294967295)
    }
    const centerWeight = area.density * (0.8 + (centerRandomValue[0] / 4294967295) * 0.2)
    
    points.push({
      location: area.center,
      weight: centerWeight
    })
  })
  
  return points
}

/**
 * Creates density areas from real registered cameras
 * Groups nearby cameras into density zones for heatmap visualization
 */
export function createDensityAreasFromCameras(
  cameras: RegisteredCamera[], 
  centerLocation: Location,
  includeUserCameras: boolean = true
): CameraDensityArea[] {
  if (cameras.length === 0) {
    // Fall back to sample data if no real cameras
    return generateSampleDensityAreas(centerLocation)
  }

  const densityAreas: CameraDensityArea[] = []
  const processedCameras = new Set<string>()
  const clusterRadius = 300 // meters - cameras within this distance are grouped

  cameras.forEach((camera, index) => {
    if (processedCameras.has(camera.id)) return

    // Find nearby cameras to cluster (using fuzzy locations for privacy)
    const nearbyCameras = cameras.filter(otherCamera => {
      if (processedCameras.has(otherCamera.id) || otherCamera.id === camera.id) return false
      const distance = calculateDistance(camera.displayLocation, otherCamera.displayLocation)
      return distance <= clusterRadius
    })

    // Add current camera to nearby cameras
    const clusterCameras = [camera, ...nearbyCameras]
    
    // Mark all cameras in this cluster as processed
    clusterCameras.forEach(cam => processedCameras.add(cam.id))

    // Calculate cluster center (weighted by camera range)
    const clusterCenter = calculateClusterCenter(clusterCameras)
    
    // Calculate density based on camera count and coverage
    const density = Math.min(1, clusterCameras.length / 8) // 8 cameras = max density
    
    // Determine area type based on camera types
    const areaType = determineAreaType(clusterCameras)
    
    // Calculate effective radius based on camera coverage
    const effectiveRadius = Math.max(
      200, // minimum radius
      Math.min(500, // maximum radius
        clusterCameras.reduce((max, cam) => 
          Math.max(max, cam.fieldOfView.range), 0
        ) + 100 // add buffer
      )
    )

    densityAreas.push({
      id: `real-density-${index}`,
      center: clusterCenter,
      radius: effectiveRadius,
      density,
      cameraCount: clusterCameras.length,
      areaType,
      actualCameras: clusterCameras
    })
  })

  // If we don't have enough density areas, supplement with sample areas
  if (densityAreas.length < 3) {
    const sampleAreas = generateSampleDensityAreas(centerLocation)
    // Add sample areas that don't overlap with real camera areas
    sampleAreas.forEach(sampleArea => {
      const hasOverlap = densityAreas.some(realArea => 
        calculateDistance(realArea.center, sampleArea.center) < (realArea.radius + sampleArea.radius) / 2
      )
      if (!hasOverlap) {
        densityAreas.push({
          ...sampleArea,
          id: `${sampleArea.id}-supplemental`
        })
      }
    })
  }

  return densityAreas
}

/**
 * Creates heatmap points from real registered cameras using localized splats
 * This prevents patterns while keeping coverage relevant to actual camera locations
 */
export function createHeatmapPointsFromCameras(cameras: RegisteredCamera[]): HeatmapPoint[] {
  if (cameras.length === 0) return []
  
  const points: HeatmapPoint[] = []
  
  console.log(`🎯 Creating heatmap from ${cameras.length} cameras`)
  
  // Create bigger, more visible splats around each camera's fuzzy location
  cameras.forEach((camera, cameraIndex) => {
    // Generate 3-5 splats per camera for bigger coverage appearance
    const randomValues = new Uint32Array(2)
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(randomValues)
    } else {
      randomValues[0] = Math.floor(Math.random() * 4294967295)
      randomValues[1] = Math.floor(Math.random() * 4294967295)
    }
    
    const splatCount = 4 + Math.floor((randomValues[0] / 4294967295) * 4) // 4-7 splats per camera for better visibility
    const baseWeight = camera.privacySettings?.shareWithCommunity ? 1.0 : 0.8 // Much higher intensity (with null check)
    
    for (let i = 0; i < splatCount; i++) {
      // Use cryptographic randomization for each splat
      const splatRandom = new Uint32Array(4)
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(splatRandom)
      } else {
        for (let j = 0; j < 4; j++) {
          splatRandom[j] = Math.floor(Math.random() * 4294967295)
        }
      }
      
      // Convert to normalized values
      const angle = (splatRandom[0] / 4294967295) * 2 * Math.PI
      const distanceRandom = splatRandom[1] / 4294967295
      const weightVariation = splatRandom[2] / 4294967295
      const pointsInSplat = splatRandom[3] / 4294967295
      
      // 20-30m variation from fuzzy location (as requested) - FIXED DISTANCE
      const splatDistance = 20 + (distanceRandom * 10) // 20-30m range
      
      // Calculate splat center position
      const splatLat = camera.displayLocation.lat + (splatDistance * Math.cos(angle)) / 111320
      const splatLng = camera.displayLocation.lng + (splatDistance * Math.sin(angle)) / 
                      (111320 * Math.cos(camera.displayLocation.lat * Math.PI / 180))
      
      // Create multiple points per splat for bigger, more visible coverage
      const pointsPerSplat = 4 + Math.floor(pointsInSplat * 5) // 4-8 points per splat for better visibility
      const splatWeight = baseWeight * (0.8 + weightVariation * 0.2)
      
      for (let p = 0; p < pointsPerSplat; p++) {
        const pointRandom = new Uint32Array(3)
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
          crypto.getRandomValues(pointRandom)
        } else {
          for (let pr = 0; pr < 3; pr++) {
            pointRandom[pr] = Math.floor(Math.random() * 4294967295)
          }
        }
        
        // Small scatter within splat for organic shape (5-8m)
        const scatterAngle = (pointRandom[0] / 4294967295) * 2 * Math.PI
        const scatterDistance = 5 + (pointRandom[1] / 4294967295) * 3 // 5-8m internal scatter
        const pointWeight = (pointRandom[2] / 4294967295) * 0.2 + 0.8 // 0.8-1.0 weight variation
        
        const finalLat = splatLat + (scatterDistance * Math.cos(scatterAngle)) / 111320
        const finalLng = splatLng + (scatterDistance * Math.sin(scatterAngle)) / 
                        (111320 * Math.cos(splatLat * Math.PI / 180))
        
        points.push({
          location: { lat: finalLat, lng: finalLng },
          weight: Math.min(1, splatWeight * pointWeight) // Ensure max weight is 1
        })
      }
    }
  })
  
  console.log(`🎯 Total heatmap points generated: ${points.length}`)
  return points
}

/**
 * Calculate bounds of all camera fuzzy locations with smaller padding
 */
function calculateCameraBounds(cameras: RegisteredCamera[]) {
  const lats = cameras.map(c => c.displayLocation.lat)
  const lngs = cameras.map(c => c.displayLocation.lng)
  
  const padding = 0.0005 // About 50m padding (reduced from 200m)
  
  return {
    minLat: Math.min(...lats) - padding,
    maxLat: Math.max(...lats) + padding,
    minLng: Math.min(...lngs) - padding,
    maxLng: Math.max(...lngs) + padding
  }
}

/**
 * Helper function to calculate distance between two locations
 */
function calculateDistance(loc1: Location, loc2: Location): number {
  const R = 6371000 // Earth's radius in meters
  const dLat = (loc2.lat - loc1.lat) * Math.PI / 180
  const dLng = (loc2.lng - loc1.lng) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

/**
 * Calculate the center point of a cluster of cameras using fuzzy locations for privacy
 */
function calculateClusterCenter(cameras: RegisteredCamera[]): Location {
  const totalWeight = cameras.reduce((sum, cam) => sum + cam.fieldOfView.range, 0)
  
  const weightedLat = cameras.reduce((sum, cam) => 
    sum + (cam.displayLocation.lat * cam.fieldOfView.range), 0 // Use fuzzy location
  ) / totalWeight
  
  const weightedLng = cameras.reduce((sum, cam) => 
    sum + (cam.displayLocation.lng * cam.fieldOfView.range), 0 // Use fuzzy location
  ) / totalWeight

  return { lat: weightedLat, lng: weightedLng }
}

/**
 * Determine area type based on camera types in cluster
 */
function determineAreaType(cameras: RegisteredCamera[]): CameraDensityArea['areaType'] {
  const types = cameras.map(cam => cam.type)
  
  if (types.includes('security') && types.includes('doorbell')) {
    return 'mixed'
  } else if (types.every(type => ['doorbell', 'indoor'].includes(type))) {
    return 'residential'
  } else if (types.includes('dash') || types.some(type => type === 'security')) {
    return 'commercial'
  }
  
  return 'residential'
}

/**
 * Generate coverage points within camera's field of view with improved randomization
 */
function generateCoveragePoints(camera: RegisteredCamera): HeatmapPoint[] {
  const points: HeatmapPoint[] = []
  const { direction, angle, range } = camera.fieldOfView
  
  // Reduce the number of coverage points to prevent over-clustering
  const pointCount = Math.max(2, Math.min(4, Math.floor(range / 15))) // Fewer, more spread out points
  
  for (let i = 0; i < pointCount; i++) {
    // Use cryptographic randomization for unpredictable coverage patterns
    const randomValues = new Uint32Array(4)
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(randomValues)
    } else {
      // Fallback
      for (let j = 0; j < 4; j++) {
        randomValues[j] = Math.floor(Math.random() * 4294967295)
      }
    }
    
    // Convert to normalized random values
    const distanceRandom = randomValues[0] / 4294967295
    const angleRandom = randomValues[1] / 4294967295 
    const scatterRandom = randomValues[2] / 4294967295
    const weightRandom = randomValues[3] / 4294967295
    
    // More random distance distribution (not just linear steps)
    const distance = range * (0.3 + distanceRandom * 0.7) // 30%-100% of range
    
    // Add more randomness to angle direction 
    const baseAngle = direction + (angleRandom - 0.5) * angle * 1.2 // Wider spread than just field of view
    
    // Add scatter to make it less predictable
    const scatterAngle = (scatterRandom - 0.5) * 60 // ±30 degree scatter
    const finalAngle = baseAngle + scatterAngle
    
    const radians = finalAngle * Math.PI / 180
    
    // Use FUZZY location for privacy in community heatmap
    const lat = camera.displayLocation.lat + (distance * Math.cos(radians)) / 111320
    const lng = camera.displayLocation.lng + (distance * Math.sin(radians)) / 
               (111320 * Math.cos(camera.displayLocation.lat * Math.PI / 180))
    
    // More varied weights
    const baseWeight = camera.privacySettings.shareWithCommunity ? 0.5 : 0.25
    const randomWeight = baseWeight * (0.6 + weightRandom * 0.4)
    
    points.push({
      location: { lat, lng },
      weight: randomWeight
    })
  }
  
  return points
}
export function generateSampleDensityAreas(centerLocation: Location): CameraDensityArea[] {
  const areas: CameraDensityArea[] = []
  
  // Generate truly random density areas around the center location using cryptographic randomization
  const areaCount = 4 + Math.floor(Math.random() * 3) // 4-6 areas
  
  for (let i = 0; i < areaCount; i++) {
    // Use cryptographic randomization for unpredictable patterns
    const randomValues = new Uint32Array(4)
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(randomValues)
    } else {
      // Fallback for environments without crypto
      for (let j = 0; j < 4; j++) {
        randomValues[j] = Math.floor(Math.random() * 4294967295)
      }
    }
    
    // Convert to normalized values
    const latRandom = (randomValues[0] / 4294967295) - 0.5 // -0.5 to 0.5
    const lngRandom = (randomValues[1] / 4294967295) - 0.5 // -0.5 to 0.5
    const densityRandom = randomValues[2] / 4294967295
    const sizeRandom = randomValues[3] / 4294967295
    
    // Random offset with larger spread to avoid clustering
    const maxOffset = 0.006 // About 600m spread
    const latOffset = latRandom * maxOffset
    const lngOffset = lngRandom * maxOffset
    
    // Random properties
    const radius = 120 + Math.floor(sizeRandom * 180) // 120-300m
    const density = 0.2 + (densityRandom * 0.6) // 0.2-0.8 density
    const cameraCount = Math.max(2, Math.floor(density * 12))
    
    // Random area type
    const areaTypes: CameraDensityArea['areaType'][] = ['residential', 'mixed', 'commercial']
    const areaType = areaTypes[Math.floor((densityRandom * 3) % 3)]
    
    areas.push({
      id: `dynamic-density-${i}-${Date.now()}`,
      center: {
        lat: centerLocation.lat + latOffset,
        lng: centerLocation.lng + lngOffset
      },
      radius,
      density,
      cameraCount,
      areaType
    })
  }
  
  return areas
}

/**
 * Gets density color based on camera availability
 */
export function getDensityColor(density: number): string {
  if (density >= 0.7) return '#22c55e' // Green - high coverage
  if (density >= 0.4) return '#f59e0b' // Yellow - medium coverage  
  if (density >= 0.2) return '#f97316' // Orange - low coverage
  return '#ef4444' // Red - very low coverage
}

/**
 * Gets human-readable density description
 */
export function getDensityDescription(density: number): string {
  if (density >= 0.7) return 'Excellent camera coverage'
  if (density >= 0.4) return 'Good camera coverage'
  if (density >= 0.2) return 'Limited camera coverage'
  return 'Minimal camera coverage'
}
