'use client'

import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { cn } from '@/lib/utils'
import { getMapStyle, validateMapTilerKey } from '@/lib/map-config'
import type { Location, MapMarker } from '@/types'
import type { CameraDensityArea, HeatmapPoint } from '@/lib/heatmap-utils'
import type { CameraPlacementData, RegisteredCamera } from '@/types/camera'
import { generateHeatmapPoints, generateSampleDensityAreas, createDensityAreasFromCameras, createHeatmapPointsFromCameras } from '@/lib/heatmap-utils'

interface MapProps {
  onMapClick?: (coords: Location, screenPosition?: { x: number; y: number }) => void
  selectedLocation?: Location | null
  selectedRadius?: number
  temporaryMarkerLocation?: Location | null
  temporaryMarkerRadius?: number
  markers?: MapMarker[]
  onMarkerClick?: (marker: MapMarker) => void
  showHeatmap?: boolean
  showCameraMarkers?: boolean
  showOwnerView?: boolean // Show exact camera locations and view radius (for Property Dashboard)
  placementData?: CameraPlacementData | null
  registeredCameras?: RegisteredCamera[]
  onDensityAreasChange?: (areas: CameraDensityArea[]) => void
  initialCenter?: Location // Initial map center - takes precedence over geolocation
  heatmapRegenerationKey?: number // Force heatmap regeneration when this changes
  className?: string
}

// Default UK center (Sheffield area - central to your location)
const DEFAULT_CENTER: Location = { lat: 53.3811, lng: -1.4701 }
const DEFAULT_ZOOM = 18 // Much more zoomed in for camera placement

// Expose navigation methods through ref
export interface MapRef {
  flyTo: (location: Location, zoom?: number) => void
  getZoom: () => number | undefined
  setZoom: (zoom: number) => void
}

const Map = forwardRef<MapRef, MapProps>(function Map({
  onMapClick,
  selectedLocation,
  selectedRadius = 200,
  temporaryMarkerLocation,
  temporaryMarkerRadius = 8,
  markers = [],
  onMarkerClick,
  showHeatmap = false,
  showCameraMarkers = false,
  showOwnerView = false,
  placementData,
  registeredCameras = [],
  onDensityAreasChange,
  initialCenter,
  heatmapRegenerationKey = 0,
  className
}, ref) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const prevCameraData = useRef<string>('')
  const onMapClickRef = useRef(onMapClick) // Store latest callback
  const [isLoaded, setIsLoaded] = useState(false)
  const [userLocation, setUserLocation] = useState<Location | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [densityAreas, setDensityAreas] = useState<CameraDensityArea[]>([])
  const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>([])
  const [mapError, setMapError] = useState<string | null>(null)
  const [criticalError, setCriticalError] = useState<string | null>(null)

  // Expose navigation methods to parent component
  useImperativeHandle(ref, () => ({
    flyTo: (location: Location, zoom?: number) => {
      if (map.current) {
        map.current.flyTo({
          center: [location.lng, location.lat],
          zoom: zoom || 16,
          duration: 1500,
          essential: true
        })
      }
    },
    getZoom: () => {
      return map.current?.getZoom()
    },
    setZoom: (zoom: number) => {
      if (map.current) {
        map.current.setZoom(zoom)
      }
    }
  }), [])

  // Keep onMapClick ref up to date
  useEffect(() => {
    onMapClickRef.current = onMapClick
  }, [onMapClick])

  // Get user's current location or use provided initial center
  useEffect(() => {
    // If initialCenter is provided (e.g., user's address), use it directly
    if (initialCenter) {
      console.log('🎯 Using provided initial center (user address):', initialCenter)
      setUserLocation(initialCenter)
      setLocationError(null)
      return
    }

    // Otherwise, try to get geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          console.log('✅ Geolocation obtained:', latitude, longitude)
          setUserLocation({ lat: latitude, lng: longitude })
          setLocationError(null)
        },
        (error) => {
          // User denied location or unavailable, use default
          setLocationError('Using default location (Sheffield area)')
          setUserLocation(DEFAULT_CENTER)
        },
        {
          timeout: 10000,
          enableHighAccuracy: true,
          maximumAge: 300000 // 5 minutes
        }
      )
    } else {
      setLocationError('Geolocation not supported. Using default location.')
      setUserLocation(DEFAULT_CENTER)
    }
  }, [initialCenter])

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current || !userLocation) return

    // Validate MapTiler API key
    const apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY
    if (!validateMapTilerKey(apiKey)) {
      const error = 'MapTiler API key is missing or invalid.'
      setCriticalError(error)
      return
    }

    try {
      // Initialize the map
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: getMapStyle(),
        center: [userLocation.lng, userLocation.lat],
        zoom: DEFAULT_ZOOM
      })

      // Add navigation control
      map.current.addControl(new maplibregl.NavigationControl(), 'top-right')

      // Geolocation control removed to eliminate red circle issue

      // Handle map errors - distinguish between critical and non-critical
      map.current.on('error', (e) => {
        console.warn('⚠️ Map loading issue (non-critical)')  
        // Don't show error UI for minor loading issues
        // Only log to console for debugging
      })

      // Handle map click for pin dropping - using ref to always call latest callback
      const handleClick = (e: any) => {
        if (onMapClickRef.current) {
          // Get screen coordinates of the click
          const screenPosition = {
            x: e.point.x + mapContainer.current!.getBoundingClientRect().left,
            y: e.point.y + mapContainer.current!.getBoundingClientRect().top
          }
          onMapClickRef.current({ lat: e.lngLat.lat, lng: e.lngLat.lng }, screenPosition)
        }
      }
      
      map.current.on('click', handleClick)

      map.current.on('load', () => {
        console.log('🎉 Map with heatmap ready!')
        setIsLoaded(true)
        setMapError(null)
        setCriticalError(null) // Clear any previous critical errors
      })

      // Map initialized, heatmap data will be set by separate useEffect

    } catch (error) {
      console.error('💥 Critical map initialization failed')
      setCriticalError(`Failed to initialize map`)
    }

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [userLocation]) // Removed onMapClick from dependencies

  // Update heatmap when registered cameras change
  useEffect(() => {
    if (!map.current || !isLoaded || !userLocation) return

    try {
      // Check if camera data actually changed using ref
      const currentCameraData = JSON.stringify(registeredCameras)
      if (currentCameraData === prevCameraData.current) {
        return // No change, skip update
      }
      prevCameraData.current = currentCameraData

      // Force regeneration by clearing any cached data
      const regenerationTriggered = heatmapRegenerationKey > 0
      
      if (regenerationTriggered) {
        console.log('🔄 Heatmap: Coverage button pressed - forcing regeneration with key:', heatmapRegenerationKey)
      } else {
        console.log('🔄 Heatmap: Camera data changed - regenerating...')
      }

      // Generate new density areas from updated camera data
      const updatedDensityAreas = createDensityAreasFromCameras(registeredCameras, userLocation)
      setDensityAreas(updatedDensityAreas)
      
      // Generate new heatmap points with timestamp for uniqueness
      const timestamp = Date.now() + heatmapRegenerationKey // Include regeneration key for uniqueness
      const updatedHeatmapPoints = registeredCameras.length > 0 
        ? createHeatmapPointsFromCameras(registeredCameras).map((point, index) => ({
            ...point,
            id: `heatmap-point-${timestamp}-${index}` // Unique ID to force refresh
          }))
        : generateHeatmapPoints(updatedDensityAreas).map((point, index) => ({
            ...point, 
            id: `heatmap-point-${timestamp}-${index}` // Unique ID to force refresh
          }))
      
      setHeatmapPoints(updatedHeatmapPoints)
      
      // Notify parent component
      if (onDensityAreasChange) {
        onDensityAreasChange(updatedDensityAreas)
      }

      console.log(`🔄 Heatmap regenerated: ${registeredCameras.length} cameras, ${updatedDensityAreas.length} areas, ${updatedHeatmapPoints.length} points`)
    } catch (error) {
      console.warn('⚠️ Error updating heatmap with new camera data:', error)
    }
  }, [registeredCameras, userLocation, isLoaded, onDensityAreasChange, heatmapRegenerationKey]) // Added heatmapRegenerationKey for Coverage button regeneration

  // Update selected location marker and radius circle
  useEffect(() => {
    if (!map.current || !isLoaded) return

    // Remove existing selected location layers safely
    const selectedLayers = [
      'selected-location-pulse',
      'selected-location-point', 
      'selected-location-circle-stroke',
      'selected-location-circle'
    ]
    
    const selectedSources = [
      'selected-location-point',
      'selected-location-circle'
    ]
    
    // Remove layers first
    selectedLayers.forEach(layerId => {
      try {
        if (map.current!.getLayer(layerId)) {
          map.current!.removeLayer(layerId)
        }
      } catch (e) {
        // Layer doesn't exist, ignore
      }
    })
    
    // Then remove sources
    selectedSources.forEach(sourceId => {
      try {
        if (map.current!.getSource(sourceId)) {
          map.current!.removeSource(sourceId)
        }
      } catch (e) {
        // Source doesn't exist, ignore
      }
    })

    if (selectedLocation) {
      try {
        // Add radius circle
        const circleGeoJSON = createCircleGeoJSON(selectedLocation, selectedRadius)
        
        map.current.addSource('selected-location-circle', {
          type: 'geojson',
          data: circleGeoJSON
        })

        map.current.addLayer({
          id: 'selected-location-circle',
          type: 'fill',
          source: 'selected-location-circle',
          paint: {
            'fill-color': '#ef4444',
            'fill-opacity': 0.15
          }
        })

        map.current.addLayer({
          id: 'selected-location-circle-stroke',
          type: 'line',
          source: 'selected-location-circle',
          paint: {
            'line-color': '#ef4444',
            'line-width': 2,
            'line-dasharray': [3, 3]
          }
        })

        // Add center point marker
        map.current.addSource('selected-location-point', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [selectedLocation.lng, selectedLocation.lat]
            },
            properties: {}
          }
        })

        map.current.addLayer({
          id: 'selected-location-point',
          type: 'circle',
          source: 'selected-location-point',
          paint: {
            'circle-radius': 8,
            'circle-color': '#ef4444',
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 2
          }
        })

        // Add pulsing animation
        map.current.addLayer({
          id: 'selected-location-pulse',
          type: 'circle',
          source: 'selected-location-point',
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              12, ['*', 15, ['sin', ['*', ['get', 'time', ['literal', ['get', 'timestamp']]], 0.01]]],
              16, ['*', 30, ['sin', ['*', ['get', 'time', ['literal', ['get', 'timestamp']]], 0.01]]]
            ],
            'circle-color': '#ef4444',
            'circle-opacity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              12, ['*', 0.3, ['abs', ['sin', ['*', ['get', 'time', ['literal', ['get', 'timestamp']]], 0.01]]]],
              16, ['*', 0.2, ['abs', ['sin', ['*', ['get', 'time', ['literal', ['get', 'timestamp']]], 0.01]]]]
            ]
          }
        })
      } catch (selectedLocationError) {
        console.warn('⚠️ Error updating selected location (non-critical):', selectedLocationError)
      }
    }
  }, [selectedLocation, selectedRadius, isLoaded])

  // Update temporary marker location (blue circle for footage)
  useEffect(() => {
    if (!map.current || !isLoaded) return

    // Remove existing temporary marker layers safely
    const temporaryLayers = [
      'temporary-marker-pulse',
      'temporary-marker-point',
      'temporary-marker-circle-stroke',
      'temporary-marker-circle'
    ]
    
    const temporarySources = [
      'temporary-marker-point',
      'temporary-marker-circle'
    ]
    
    // Remove layers first
    temporaryLayers.forEach(layerId => {
      try {
        if (map.current!.getLayer(layerId)) {
          map.current!.removeLayer(layerId)
        }
      } catch (e) {
        // Layer doesn't exist, ignore
      }
    })
    
    // Then remove sources
    temporarySources.forEach(sourceId => {
      try {
        if (map.current!.getSource(sourceId)) {
          map.current!.removeSource(sourceId)
        }
      } catch (e) {
        // Source doesn't exist, ignore
      }
    })

    if (temporaryMarkerLocation) {
      try {
        // Add radius circle (blue for footage)
        const circleGeoJSON = createCircleGeoJSON(temporaryMarkerLocation, temporaryMarkerRadius)
        
        map.current.addSource('temporary-marker-circle', {
          type: 'geojson',
          data: circleGeoJSON
        })

        map.current.addLayer({
          id: 'temporary-marker-circle',
          type: 'fill',
          source: 'temporary-marker-circle',
          paint: {
            'fill-color': '#3b82f6',
            'fill-opacity': 0.15
          }
        })

        map.current.addLayer({
          id: 'temporary-marker-circle-stroke',
          type: 'line',
          source: 'temporary-marker-circle',
          paint: {
            'line-color': '#3b82f6',
            'line-width': 2,
            'line-dasharray': [3, 3]
          }
        })

        // Add center point marker (blue)
        map.current.addSource('temporary-marker-point', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [temporaryMarkerLocation.lng, temporaryMarkerLocation.lat]
            },
            properties: {}
          }
        })

        map.current.addLayer({
          id: 'temporary-marker-point',
          type: 'circle',
          source: 'temporary-marker-point',
          paint: {
            'circle-radius': 8,
            'circle-color': '#3b82f6',
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 2
          }
        })

        // Add pulsing animation
        map.current.addLayer({
          id: 'temporary-marker-pulse',
          type: 'circle',
          source: 'temporary-marker-point',
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              12, ['*', 15, ['sin', ['*', ['get', 'time', ['literal', ['get', 'timestamp']]], 0.01]]],
              16, ['*', 30, ['sin', ['*', ['get', 'time', ['literal', ['get', 'timestamp']]], 0.01]]]
            ],
            'circle-color': '#3b82f6',
            'circle-opacity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              12, ['*', 0.3, ['abs', ['sin', ['*', ['get', 'time', ['literal', ['get', 'timestamp']]], 0.01]]]],
              16, ['*', 0.2, ['abs', ['sin', ['*', ['get', 'time', ['literal', ['get', 'timestamp']]], 0.01]]]]
            ]
          }
        })
      } catch (temporaryMarkerError) {
        console.warn('⚠️ Error updating temporary marker (non-critical):', temporaryMarkerError)
      }
    }
  }, [temporaryMarkerLocation, temporaryMarkerRadius, isLoaded, createCircleGeoJSON])

  // Update markers with better error handling
  useEffect(() => {
    if (!map.current || !isLoaded) return

    try {
      // Group markers by type
      const incidentMarkers = markers.filter(m => m.type === 'incident')
      const cameraMarkers = markers.filter(m => m.type === 'camera')

      // Remove existing markers layers safely
      const markerLayers = ['incident-markers', 'camera-markers']
      markerLayers.forEach(layerId => {
        try {
          if (map.current!.getLayer(layerId)) {
            map.current!.removeLayer(layerId)
          }
          if (map.current!.getSource(layerId)) {
            map.current!.removeSource(layerId)
          }
        } catch (e) {
          // Ignore errors when removing non-existent layers
        }
      })

      // Add incident markers
      if (incidentMarkers.length > 0) {
        try {
          map.current.addSource('incident-markers', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: incidentMarkers.map(marker => ({
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [marker.location.lng, marker.location.lat]
                },
                properties: {
                  id: marker.id,
                  type: marker.type
                }
              }))
            }
          })

          map.current.addLayer({
            id: 'incident-markers',
            type: 'circle',
            source: 'incident-markers',
            paint: {
              'circle-radius': 10,
              'circle-color': '#f59e0b',
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': 2
            }
          })

          // Add click handler for incident markers
          map.current.on('click', 'incident-markers', (e) => {
            if (e.features && e.features[0] && onMarkerClick) {
              const markerId = e.features[0].properties?.id
              const marker = markers.find(m => m.id === markerId)
              if (marker) {
                onMarkerClick(marker)
              }
            }
          })

          // Change cursor on hover
          map.current.on('mouseenter', 'incident-markers', () => {
            if (map.current) {
              map.current.getCanvas().style.cursor = 'pointer'
            }
          })
          map.current.on('mouseleave', 'incident-markers', () => {
            if (map.current) {
              map.current.getCanvas().style.cursor = ''
            }
          })
        } catch (markerError) {
          console.warn('⚠️ Error adding incident markers (non-critical):', markerError)
        }
      }

      // Add camera markers
      if (cameraMarkers.length > 0) {
        try {
          map.current.addSource('camera-markers', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: cameraMarkers.map(marker => ({
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [marker.location.lng, marker.location.lat]
                },
                properties: {
                  id: marker.id,
                  type: marker.type,
                  data: marker.data // Include data for conditional styling
                }
              }))
            }
          })

          map.current.addLayer({
            id: 'camera-markers',
            type: 'circle',
            source: 'camera-markers',
            paint: {
              'circle-radius': [
                'case',
                ['has', 'isPlacementPreview', ['get', 'data']],
                10, // Larger for placement preview
                8   // Normal size for regular cameras
              ],
              'circle-color': [
                'case',
                ['has', 'isPlacementPreview', ['get', 'data']],
                '#3b82f6', // Blue for placement preview
                '#22c55e'  // Green for regular cameras
              ],
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': [
                'case',
                ['has', 'isPlacementPreview', ['get', 'data']],
                3, // Thicker stroke for placement preview
                2  // Normal stroke for regular cameras
              ],
              'circle-opacity': [
                'case',
                ['has', 'isPlacementPreview', ['get', 'data']],
                0.9, // More opaque for placement preview
                0.7  // Normal opacity for regular cameras
              ]
            }
          })
        } catch (markerError) {
          console.warn('⚠️ Error adding camera markers (non-critical):', markerError)
        }
      }
    } catch (error) {
      console.warn('⚠️ Error updating markers (non-critical):', error)
      // Don't show error UI for marker update issues - just log them
    }
  }, [markers, isLoaded, onMarkerClick])

  // Update heatmap layers - SECURITY: Only show density areas, no individual points
  useEffect(() => {
    if (!map.current || !isLoaded || heatmapPoints.length === 0) return

    try {
      // Remove existing heatmap layers
      if (map.current.getLayer('heatmap')) {
        map.current.removeLayer('heatmap')
      }
      if (map.current.getLayer('heatmap-points')) {
        map.current.removeLayer('heatmap-points')
      }
      if (map.current.getSource('heatmap-source')) {
        map.current.removeSource('heatmap-source')
      }

      // Add heatmap source
      const heatmapGeoJSON = {
        type: 'FeatureCollection' as const,
        features: heatmapPoints.map((point, index) => ({
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [point.location.lng, point.location.lat]
          },
          properties: {
            weight: point.weight,
            id: `heatmap-point-${index}`
          }
        }))
      }

      map.current.addSource('heatmap-source', {
        type: 'geojson',
        data: heatmapGeoJSON
      })

      // Add heatmap layer - ONLY density visualization for security
      map.current.addLayer({
        id: 'heatmap',
        type: 'heatmap',
        source: 'heatmap-source',
        layout: {
          visibility: showHeatmap ? 'visible' : 'none'
        },
        paint: {
          // Increase the heatmap weight based on frequency and property weight
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'weight'],
            0, 0,
            1, 1
          ],
          // Reduce intensity at low zoom levels - more intense at street level
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 0.3,   // Very low intensity at world view
            8, 0.8,   // Low intensity at city level
            12, 1.5,  // Medium intensity at neighborhood level  
            16, 3,    // Good intensity at street level
            20, 5     // Full intensity at building level
          ],
          // Massive color spread - red almost eliminated (top 1%)
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(0,100,255,0)',      // Transparent blue at zero density
            0.2, 'rgb(0,150,255)',       // Blue - low coverage (extended)
            0.45, 'rgb(0,255,150)',      // Green - medium coverage (extended)
            0.75, 'rgb(255,255,0)',      // Yellow - good coverage (extended)
            0.9, 'rgb(255,200,0)',       // Light orange - high coverage
            0.97, 'rgb(255,150,0)',      // Orange - very high coverage
            0.99, 'rgb(255,80,0)',       // Red-orange - extreme coverage
            1, 'rgb(200,0,0)'            // Deep red - only top 1% maximum coverage
          ],
          // Scale heatmap radius - much larger when zoomed in close
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 0.5,   // Extremely small at world view (barely visible)
            8, 1,     // Very small at city level  
            12, 4,    // Small at neighborhood level
            16, 25,   // Good size at street level (increased)
            18, 50,   // Large at close street level (increased)
            20, 100   // Very large at building level (increased)
          ],
          // 50% transparent as requested
          'heatmap-opacity': 0.5
        }
      })

      // SECURITY: Individual heatmap points layer removed entirely
      // This prevents showing exact camera locations even at high zoom levels
    } catch (heatmapError) {
      console.warn('⚠️ Error updating heatmap (non-critical):', heatmapError)
    }
  }, [heatmapPoints, isLoaded, showHeatmap])

  // Update camera markers with simple circular coverage
  useEffect(() => {
    if (!map.current || !isLoaded || !showCameraMarkers) return

    try {
      // Remove existing camera layers
      const cameraLayers = ['camera-coverage-fill', 'camera-coverage-stroke', 'camera-points']
      const cameraSources = ['camera-coverage-source', 'camera-points-source']
      
      cameraLayers.forEach(layerId => {
        try {
          if (map.current!.getLayer(layerId)) {
            map.current!.removeLayer(layerId)
          }
        } catch (e) {
          // Layer doesn't exist, ignore
        }
      })
      
      cameraSources.forEach(sourceId => {
        try {
          if (map.current!.getSource(sourceId)) {
            map.current!.removeSource(sourceId)
          }
        } catch (e) {
          // Source doesn't exist, ignore
        }
      })

      // Collect camera coverage circles and points
      const coverageFeatures: GeoJSON.Feature<GeoJSON.Polygon>[] = []
      const pointFeatures: GeoJSON.Feature<GeoJSON.Point>[] = []
      
      // Add existing cameras with proper null checks
      markers.forEach(marker => {
        if (marker.type === 'camera' && marker.data) {
          const camera = marker.data as RegisteredCamera
          
          // Use exact location for owner view, fuzzy location for community view
          const cameraLocation = showOwnerView && camera.location ? camera.location : camera.displayLocation
          if (!cameraLocation) return // Skip if no location data
          
          // Use actual view distance for owner, default range for community with null checks
          const radius = showOwnerView 
            ? (camera.privacySettings?.maxRequestRadius || 12)
            : (camera.fieldOfView?.range || 12)
          
          // Create coverage circle
          const circleGeoJSON = createCircleGeoJSON(cameraLocation, radius)
          coverageFeatures.push({
            type: 'Feature',
            geometry: circleGeoJSON.geometry,
            properties: {
              cameraId: marker.id,
              isPreview: false,
              isOwnerView: showOwnerView
            }
          })
          
          // Create center point
          pointFeatures.push({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [cameraLocation.lng, cameraLocation.lat]
            },
            properties: {
              cameraId: marker.id,
              isPreview: false,
              isOwnerView: showOwnerView
            }
          })
        }
      })
      
      // Add placement preview
      if (placementData) {
        const previewRadius = placementData.fieldOfView?.range || 12
        
        // Create preview coverage circle
        const previewCircle = createCircleGeoJSON(placementData.location, previewRadius)
        coverageFeatures.push({
          type: 'Feature',
          geometry: previewCircle.geometry,
          properties: {
            cameraId: placementData.tempId || 'preview',
            isPreview: true
          }
        })
        
        // Create preview center point
        pointFeatures.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [placementData.location.lng, placementData.location.lat]
          },
          properties: {
            cameraId: placementData.tempId || 'preview',
            isPreview: true
          }
        })
      }

      // Add coverage circles
      if (coverageFeatures.length > 0) {
        map.current.addSource('camera-coverage-source', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: coverageFeatures
          }
        })

        // Add fill layer
        map.current.addLayer({
          id: 'camera-coverage-fill',
          type: 'fill',
          source: 'camera-coverage-source',
          paint: {
            'fill-color': [
              'case',
              ['get', 'isPreview'], '#3b82f6', // Blue for preview
              ['get', 'isOwnerView'], '#8b5cf6', // Purple for owner view (exact location)
              '#22c55e' // Green for community view (fuzzy location)
            ],
            'fill-opacity': [
              'case',
              ['get', 'isPreview'], 0.2,
              ['get', 'isOwnerView'], 0.25, // Slightly more visible for owner
              0.15
            ]
          }
        })

        // Add stroke layer
        map.current.addLayer({
          id: 'camera-coverage-stroke',
          type: 'line',
          source: 'camera-coverage-source',
          paint: {
            'line-color': [
              'case',
              ['get', 'isPreview'], '#3b82f6', // Blue for preview
              ['get', 'isOwnerView'], '#8b5cf6', // Purple for owner view
              '#22c55e' // Green for community view
            ],
            'line-width': [
              'case',
              ['get', 'isPreview'], 2,
              ['get', 'isOwnerView'], 2.5, // Thicker for owner view
              1.5
            ],
            'line-opacity': 0.7
          },
          layout: {
            'line-cap': 'round',
            'line-join': 'round'
          }
        })
      }

      // Add camera points
      if (pointFeatures.length > 0) {
        map.current.addSource('camera-points-source', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: pointFeatures
          }
        })

        map.current.addLayer({
          id: 'camera-points',
          type: 'circle',
          source: 'camera-points-source',
          paint: {
            'circle-radius': [
              'case',
              ['get', 'isPreview'], 8,
              ['get', 'isOwnerView'], 7, // Slightly larger for owner view
              6
            ],
            'circle-color': [
              'case',
              ['get', 'isPreview'], '#3b82f6', // Blue for preview
              ['get', 'isOwnerView'], '#8b5cf6', // Purple for owner view
              '#22c55e' // Green for community view
            ],
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': [
              'case',
              ['get', 'isPreview'], 3,
              ['get', 'isOwnerView'], 3, // Consistent stroke for owner
              2
            ]
          }
        })
      }
    } catch (cameraError) {
      console.warn('⚠️ Error updating camera markers (non-critical):', cameraError)
    }
  }, [markers, placementData, isLoaded, showCameraMarkers, showOwnerView]) // Stable dependencies

  // Helper function to create circle GeoJSON
  const createCircleGeoJSON = useCallback((center: Location, radiusInMeters: number) => {
    const points = 64
    const coords: [number, number][] = []

    for (let i = 0; i < points; i++) {
      const angle = (i / points) * 2 * Math.PI
      const dx = radiusInMeters * Math.cos(angle)
      const dy = radiusInMeters * Math.sin(angle)
      
      const lat = center.lat + dy / 111320
      const lng = center.lng + dx / (111320 * Math.cos(center.lat * Math.PI / 180))
      
      coords.push([lng, lat])
    }
    
    coords.push(coords[0]) // Close the polygon

    return {
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [coords]
      },
      properties: {}
    }
  }, [])

  // Don't spam console with render states
  // console.log('🔍 Map render state:', { userLocation: !!userLocation, mapError: !!mapError, isLoaded })
  
  if (!userLocation || criticalError) {
    return (
      <div className={cn('w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center', className)}>
        {criticalError ? (
          <div className="text-center p-6 max-w-md">
            <div className="text-red-500 mb-2">⚠️ Critical Map Error</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {criticalError}
            </div>
            <div className="text-xs text-gray-500 mb-4">
              API Key: {process.env.NEXT_PUBLIC_MAPTILER_API_KEY ? 'Configured ✓' : 'Missing ✗'}
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="text-gray-500 map-loading">Loading map...</div>
        )}
      </div>
    )
  }

  return (
    <div className={cn('w-full h-full relative', className)}>
      {/* Map Error Overlay - Non-critical errors */}
      {mapError && (
        <div className="absolute top-20 left-4 right-4 z-[1000] bg-amber-100 dark:bg-amber-900 border border-amber-300 dark:border-amber-700 rounded-lg px-4 py-3 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="text-amber-600 dark:text-amber-400 text-lg">⚠️</div>
            <div>
              <h3 className="font-semibold text-sm text-amber-800 dark:text-amber-200 mb-1">
                Minor Map Issue
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                {mapError} Map functionality should continue working.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Location status indicator */}
      {locationError && !criticalError && (
        <div className="absolute top-20 left-4 z-[1000] bg-amber-100 dark:bg-amber-900 border border-amber-300 dark:border-amber-700 rounded-lg px-3 py-2 shadow-sm">
          <div className="text-xs text-amber-800 dark:text-amber-200">
            📍 {locationError}
          </div>
        </div>
      )}

      {/* Map container */}
      <div
        ref={mapContainer}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />

      {/* Map instructions overlay - Removed per user request */}
    </div>
  )
})

export default Map
