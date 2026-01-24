/**
 * Hexagonal Grid Utility for Camera Density Visualization
 * Uses H3 hexagonal grid system (Uber's geospatial indexing)
 */

import { latLngToCell, cellToBoundary, gridDisk } from 'h3-js'
import type { Location } from '@/types'
import type { RegisteredCamera } from '@/types/camera'

export interface HexagonData {
  id: string
  center: Location
  boundary: Location[]
  cameraCount: number
  densityScore: number // 0-1 normalized score
  color: string
}

/**
 * Get H3 resolution for hexagons of approximately 50-100m across
 * H3 Resolution 9: ~50m edge length, ~8,800 m² area
 * H3 Resolution 10: ~25m edge length, ~2,200 m² area
 * H3 Resolution 11: ~12m edge length, ~500 m² area
 */
const HEXAGON_RESOLUTION = 10 // ~25-50m across (good balance)

/**
 * Calculate camera density and generate hexagonal grid
 */
export function generateHexagonalGrid(
  cameras: RegisteredCamera[],
  center: Location,
  radiusKm: number = 5 // How far to generate hexagons from center
): HexagonData[] {
  if (cameras.length === 0) return []

  try {
    // Validate center coordinates
    if (!center || 
        typeof center.lat !== 'number' || 
        typeof center.lng !== 'number' ||
        center.lat < -90 || center.lat > 90 ||
        center.lng < -180 || center.lng > 180) {
      console.warn('⚠️ Invalid center coordinates for hexagonal grid:', center)
      return []
    }
    
    // Convert center point to H3 cell
    const centerCell = latLngToCell(center.lat, center.lng, HEXAGON_RESOLUTION)
    
    // Calculate how many rings of hexagons we need to cover the radius
    // At resolution 10, each hexagon is ~25-50m, so for 5km we need ~100-200 rings
    // We'll use a more conservative estimate
    const ringsNeeded = Math.ceil((radiusKm * 1000) / 50) // 50m per ring approximate
    
    // Get all hexagons within the radius (this returns an array of H3 cell IDs)
    const hexagonCells = gridDisk(centerCell, ringsNeeded)
    
    // Count cameras in each hexagon
    const hexagonCameraCount = new Map<string, number>()
    
    // For each camera, find which hexagon it belongs to
    cameras.forEach(camera => {
      // Use display location (fuzzy) for community view, or real location for owner view
      const location = camera.displayLocation || camera.location
      
      // Validate coordinates before processing
      if (!location || 
          typeof location.lat !== 'number' || 
          typeof location.lng !== 'number' ||
          location.lat < -90 || location.lat > 90 ||
          location.lng < -180 || location.lng > 180) {
        console.warn('⚠️ Skipping camera with invalid coordinates:', camera.id, location)
        return
      }
      
      const cameraCell = latLngToCell(location.lat, location.lng, HEXAGON_RESOLUTION)
      
      // Only count if this hexagon is in our grid
      if (hexagonCells.includes(cameraCell)) {
        hexagonCameraCount.set(
          cameraCell,
          (hexagonCameraCount.get(cameraCell) || 0) + 1
        )
      }
    })
    
    // Find max camera count for normalization
    const maxCameras = Math.max(...Array.from(hexagonCameraCount.values()), 1)
    
    // Generate hexagon data only for hexagons with cameras
    const hexagons: HexagonData[] = []
    
    hexagonCameraCount.forEach((count, cellId) => {
      const boundary = cellToBoundary(cellId, true) // true = GeoJSON format [lng, lat]
      
      // Convert boundary coordinates from [lng, lat] to Location objects
      const boundaryLocations: Location[] = boundary.map(([lng, lat]) => ({
        lat,
        lng
      }))
      
      // Calculate center (average of boundary points)
      const centerLat = boundaryLocations.reduce((sum, loc) => sum + loc.lat, 0) / boundaryLocations.length
      const centerLng = boundaryLocations.reduce((sum, loc) => sum + loc.lng, 0) / boundaryLocations.length
      
      // Normalize density score
      const densityScore = count / maxCameras
      
      // Assign color based on density (blue = low, red = high)
      const color = getDensityColor(densityScore)
      
      hexagons.push({
        id: cellId,
        center: { lat: centerLat, lng: centerLng },
        boundary: boundaryLocations,
        cameraCount: count,
        densityScore,
        color
      })
    })
    
    console.log(`🔷 Generated ${hexagons.length} hexagons with cameras out of ${hexagonCells.length} total hexagons`)
    console.log(`📊 Camera distribution: min=1, max=${maxCameras}, total=${cameras.length}`)
    
    return hexagons
  } catch (error) {
    console.error('❌ Error generating hexagonal grid:', error)
    return []
  }
}

/**
 * Get color based on density score (0-1)
 * Blue (low) → Green → Yellow → Red (high)
 */
function getDensityColor(score: number): string {
  if (score < 0.25) return '#3b82f6' // Blue - low density
  if (score < 0.5) return '#10b981'  // Green - medium-low density
  if (score < 0.75) return '#f59e0b' // Yellow/Orange - medium-high density
  return '#ef4444'                    // Red - high density
}

/**
 * Convert hexagon data to GeoJSON for MapLibre rendering
 */
export function hexagonsToGeoJSON(hexagons: HexagonData[]): any {
  return {
    type: 'FeatureCollection',
    features: hexagons.map(hex => ({
      type: 'Feature',
      id: hex.id,
      properties: {
        cameraCount: hex.cameraCount,
        densityScore: hex.densityScore,
        color: hex.color
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          // Close the polygon by adding the first point at the end
          [...hex.boundary.map(loc => [loc.lng, loc.lat]), [hex.boundary[0].lng, hex.boundary[0].lat]]
        ]
      }
    }))
  }
}
