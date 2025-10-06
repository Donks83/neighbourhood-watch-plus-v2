/**
 * Map configuration utilities for MapTiler integration
 */

export const getMapStyle = (): string => {
  const apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY

  if (!apiKey || apiKey === 'get_your_free_key_from_maptiler.com') {
    console.warn('MapTiler API key not configured. Using OpenStreetMap fallback.')
    // Fallback to basic OpenStreetMap style
    return 'https://api.maptiler.com/maps/openstreetmap/style.json?key=demo'
  }

  // Use the streets-v2 style with user's API key
  return `https://api.maptiler.com/maps/streets-v2/style.json?key=${apiKey}`
}

export const validateMapTilerKey = (key?: string): boolean => {
  return !!(key && key !== 'demo' && key !== 'get_your_free_key_from_maptiler.com' && key.length > 10)
}

export const getMapTilerAttribution = (): string => {
  return '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>'
}
