import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCoordinates(lat: number, lng: number, precision: number = 6): string {
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`
}

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3 // Earth's radius in metres
  const φ1 = lat1 * Math.PI/180 // φ, λ in radians
  const φ2 = lat2 * Math.PI/180
  const Δφ = (lat2-lat1) * Math.PI/180
  const Δλ = (lng2-lng1) * Math.PI/180

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

  const d = R * c // in metres
  return Math.round(d)
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters}m`
  } else {
    return `${(meters / 1000).toFixed(1)}km`
  }
}

export function fuzzyLocation(
  lat: number, 
  lng: number, 
  radiusMeters: number = 50
): { lat: number; lng: number } {
  // Add random offset within the specified radius for privacy
  const radiusInDegrees = radiusMeters / 111000 // Approximate conversion
  const u = Math.random()
  const v = Math.random()
  const w = radiusInDegrees * Math.sqrt(u)
  const t = 2 * Math.PI * v
  const x = w * Math.cos(t)
  const y = w * Math.sin(t)
  
  return {
    lat: lat + y,
    lng: lng + x / Math.cos(lat * Math.PI / 180)
  }
}

export function isValidLocation(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}
