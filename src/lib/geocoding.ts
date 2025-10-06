import type { Location } from '@/types'
import type { UserAddress } from '@/types/camera'

interface GeocodingResult {
  place_name: string
  center: [number, number] // [lng, lat]
  place_type: string[]
  relevance: number
  address?: string
  context?: Array<{
    id: string
    text: string
  }>
}

interface GeocodingResponse {
  features: GeocodingResult[]
  query: string[]
  type: string
}

/**
 * Geocode an address string to coordinates using MapTiler Geocoding API
 * Uses intelligent fallback strategy for house numbers
 */
export async function geocodeAddress(address: string): Promise<Location | null> {
  const apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY
  
  if (!apiKey) {
    console.error('❌ MapTiler API key not found')
    return null
  }

  try {
    // Format UK postcodes properly before geocoding
    let searchAddress = address.trim()
    if (validateUKPostcode(searchAddress)) {
      searchAddress = searchAddress.toUpperCase()
      if (!searchAddress.includes(' ') && searchAddress.length >= 5) {
        searchAddress = searchAddress.slice(0, -3) + ' ' + searchAddress.slice(-3)
      }
      searchAddress = `${searchAddress}, UK`
    } else if (!searchAddress.toLowerCase().includes('uk') && 
               !searchAddress.toLowerCase().includes('united kingdom')) {
      searchAddress = `${searchAddress}, UK`
    }
    
    console.log('🌍 Geocoding address:', address)
    
    // Strategy 1: Try with the full address including house number
    let result = await attemptGeocode(searchAddress, apiKey)
    
    // Strategy 2: If failed or low relevance, try without house number
    if (!result || (result.relevance && result.relevance < 0.8)) {
      console.log('🔄 Trying without house number for better accuracy...')
      
      // Extract street name without house number
      const addressParts = address.split(',')
      if (addressParts.length > 0) {
        const streetPart = addressParts[0].trim()
        // Remove house number (assumes house number is at the start)
        const streetWithoutNumber = streetPart.replace(/^\d+\s*/, '').trim()
        
        if (streetWithoutNumber && streetWithoutNumber !== streetPart) {
          // Reconstruct address without house number
          const addressWithoutNumber = [streetWithoutNumber, ...addressParts.slice(1)]
            .filter(part => part.trim()) // Remove empty parts
            .join(', ')
          let searchWithoutNumber = addressWithoutNumber.trim()
          
          // Add UK suffix if needed
          if (!searchWithoutNumber.toLowerCase().includes('uk') && 
              !searchWithoutNumber.toLowerCase().includes('united kingdom')) {
            searchWithoutNumber = `${searchWithoutNumber}, UK`
          }
          
          console.log('🌍 Trying without house number:', searchWithoutNumber)
          const fallbackResult = await attemptGeocode(searchWithoutNumber, apiKey)
          
          // Use fallback if it has better relevance or if original failed
          if (fallbackResult && (!result || (fallbackResult.relevance && fallbackResult.relevance > (result.relevance || 0)))) {
            console.log('✅ Better result found without house number')
            result = fallbackResult
          }
        }
      }
    }
    
    if (result) {
      console.log('✅ Address geocoded successfully:', { 
        lat: result.lat, 
        lng: result.lng, 
        relevance: result.relevance 
      })
      return { lat: result.lat, lng: result.lng }
    } else {
      console.warn('⚠️ No geocoding results found for address:', address)
      return null
    }
  } catch (error) {
    console.error('❌ Error geocoding address:', error)
    return null
  }
}

/**
 * Helper function to attempt geocoding with a specific search string
 */
async function attemptGeocode(searchAddress: string, apiKey: string): Promise<{ lat: number, lng: number, relevance?: number } | null> {
  try {
    const encodedAddress = encodeURIComponent(searchAddress)
    const url = `https://api.maptiler.com/geocoding/${encodedAddress}.json?key=${apiKey}&country=gb&limit=1`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`)
    }
    
    const data: GeocodingResponse = await response.json()
    
    if (data.features && data.features.length > 0) {
      const feature = data.features[0]
      const [lng, lat] = feature.center
      
      return { 
        lat, 
        lng, 
        relevance: feature.relevance 
      }
    }
    
    return null
  } catch (error) {
    console.warn('⚠️ Geocoding attempt failed:', error)
    return null
  }
}

/**
 * Reverse geocode coordinates to address using MapTiler Geocoding API
 */
export async function reverseGeocode(location: Location): Promise<string | null> {
  const apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY
  
  if (!apiKey) {
    console.error('❌ MapTiler API key not found')
    return null
  }

  try {
    const url = `https://api.maptiler.com/geocoding/${location.lng},${location.lat}.json?key=${apiKey}&limit=1`
    
    console.log('🌍 Reverse geocoding coordinates:', location)
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Reverse geocoding API error: ${response.status}`)
    }
    
    const data: GeocodingResponse = await response.json()
    
    if (data.features && data.features.length > 0) {
      const result = data.features[0]
      
      console.log('✅ Coordinates reverse geocoded successfully:', result.place_name)
      
      return result.place_name
    } else {
      console.warn('⚠️ No reverse geocoding results found for coordinates:', location)
      return null
    }
  } catch (error) {
    console.error('❌ Error reverse geocoding coordinates:', error)
    return null
  }
}

/**
 * Validate and parse a UK postcode
 */
export function validateUKPostcode(postcode: string): boolean {
  // UK postcode regex pattern
  const ukPostcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i
  
  return ukPostcodeRegex.test(postcode.trim())
}

/**
 * Format a user address into a geocodable string
 */
export function formatAddressForGeocoding(address: Partial<UserAddress>): string {
  const parts: string[] = []
  
  if (address.street) parts.push(address.street)
  if (address.city) parts.push(address.city)
  if (address.postcode) parts.push(address.postcode)
  if (address.country) parts.push(address.country)
  
  return parts.join(', ')
}

/**
 * Validate address completeness
 */
export function validateAddress(address: Partial<UserAddress>): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!address.street?.trim()) {
    errors.push('Street address is required')
  }
  
  if (!address.city?.trim()) {
    errors.push('City is required')
  }
  
  if (!address.postcode?.trim()) {
    errors.push('Postcode is required')
  } else if (!validateUKPostcode(address.postcode)) {
    errors.push('Please enter a valid UK postcode')
  }
  
  if (!address.country?.trim()) {
    errors.push('Country is required')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Get a displayable address string from UserAddress
 */
export function formatDisplayAddress(address: UserAddress): string {
  return `${address.street}, ${address.city}, ${address.postcode}`
}

/**
 * Search for multiple location results with better UK postcode support
 */
export async function searchLocations(
  query: string, 
  limit: number = 5
): Promise<{ address: string; location: Location }[] | null> {
  const apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY
  
  if (!apiKey) {
    console.error('❌ MapTiler API key not found')
    return null
  }

  try {
    // Clean up the query
    let searchQuery = query.trim()
    
    // For UK postcodes, ensure proper formatting
    if (validateUKPostcode(searchQuery)) {
      // Format postcode properly (add space if missing)
      searchQuery = searchQuery.toUpperCase()
      if (!searchQuery.includes(' ') && searchQuery.length >= 5) {
        // Insert space before last 3 characters for full postcodes
        searchQuery = searchQuery.slice(0, -3) + ' ' + searchQuery.slice(-3)
      }
      
      // Add "UK" to help with UK postcode searches
      searchQuery = `${searchQuery}, UK`
      console.log('🔍 Searching for UK postcode:', searchQuery)
    } else {
      // For non-postcode searches, add UK context if not already present
      if (!searchQuery.toLowerCase().includes('uk') && 
          !searchQuery.toLowerCase().includes('united kingdom') &&
          !searchQuery.toLowerCase().includes('england') &&
          !searchQuery.toLowerCase().includes('scotland') &&
          !searchQuery.toLowerCase().includes('wales')) {
        searchQuery = `${searchQuery}, UK`
      }
    }
    
    const encodedQuery = encodeURIComponent(searchQuery)
    
    // Use MapTiler with UK bias and multiple results
    // Note: MapTiler uses 'gb' country code and specific place types
    const url = `https://api.maptiler.com/geocoding/${encodedQuery}.json?` +
      `key=${apiKey}` +
      `&country=gb` + // Great Britain country code
      `&limit=${limit}` +
      `&language=en`
    
    // For UK-specific searches, we could also try bbox for UK bounds:
    // &bbox=-8.17,49.86,1.77,60.86 (west,south,east,north of UK)
    
    console.log('🌍 Searching locations:', searchQuery)
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`)
    }
    
    const data: GeocodingResponse = await response.json()
    
    if (data.features && data.features.length > 0) {
      const results = data.features.map(feature => {
        const [lng, lat] = feature.center
        
        // Clean up the address for display
        let displayAddress = feature.place_name
        
        // Remove redundant "United Kingdom" if it's already clear from context
        displayAddress = displayAddress.replace(/, United Kingdom$/, '')
        
        return {
          address: displayAddress,
          location: { lat, lng }
        }
      })
      
      console.log(`✅ Found ${results.length} location results`)
      
      return results
    } else {
      console.warn('⚠️ No results found for query:', query)
      
      // If it's a valid UK postcode but no results, try without formatting
      if (validateUKPostcode(query.trim())) {
        console.log('🔄 Retrying with raw postcode...')
        const rawUrl = `https://api.maptiler.com/geocoding/${encodeURIComponent(query.trim())}.json?` +
          `key=${apiKey}&country=GB&limit=${limit}`
        
        const rawResponse = await fetch(rawUrl)
        if (rawResponse.ok) {
          const rawData: GeocodingResponse = await rawResponse.json()
          
          if (rawData.features && rawData.features.length > 0) {
            return rawData.features.map(feature => {
              const [lng, lat] = feature.center
              return {
                address: feature.place_name.replace(/, United Kingdom$/, ''),
                location: { lat, lng }
              }
            })
          }
        }
      }
      
      return null
    }
  } catch (error) {
    console.error('❌ Error searching locations:', error)
    return null
  }
}
