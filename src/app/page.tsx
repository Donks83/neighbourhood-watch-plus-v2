'use client'

import React, { useState, useCallback, useRef } from 'react'
import { AlertCircleIcon, CameraIcon, BellIcon, MenuIcon, ShieldIcon, UserIcon, LogOutIcon, SettingsIcon, HomeIcon, ChevronDownIcon, AlertCircle, Shield, Camera } from 'lucide-react'
import Link from 'next/link'
import Map, { type MapRef } from '@/components/map/map'
import IncidentReportPanel from '@/components/map/incident-report-panel'
import TemporaryMarkerRegistration from '@/components/temporary-evidence/temporary-marker-registration'
import CameraRegistrationDashboard from '@/components/map/camera-registration-dashboard'
import LocationSearch from '@/components/map/location-search'
import AuthDialog from '@/components/auth/auth-dialog'
import RequestManagement from '@/components/requests/request-management'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import type { Location, IncidentFormData, MapMarker, CameraDensityArea } from '@/types'
import type { RequestPriority } from '@/types/requests'
import type { RegisteredCamera } from '@/types/camera'

export default function HomePage() {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [selectedRadius, setSelectedRadius] = useState(200)
  const [isReportFormOpen, setIsReportFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [markers, setMarkers] = useState<MapMarker[]>([])
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [heatmapRegenerationKey, setHeatmapRegenerationKey] = useState(0)
  const [densityAreas, setDensityAreas] = useState<CameraDensityArea[]>([])
  const [isCameraRegistrationOpen, setIsCameraRegistrationOpen] = useState(false)
  const [userLocation, setUserLocation] = useState<Location | null>(null)
  const [registeredCameras, setRegisteredCameras] = useState<RegisteredCamera[]>([])
  const [communityHeatmapCameras, setCommunityHeatmapCameras] = useState<RegisteredCamera[]>([])
  
  // Authentication state
  const { user, userProfile, isAdmin, logout, loading } = useAuth()
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isRequestManagementOpen, setIsRequestManagementOpen] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  
  // Temporary Evidence Marker state
  const [isTemporaryMarkerFormOpen, setIsTemporaryMarkerFormOpen] = useState(false)
  const [temporaryMarkerLocation, setTemporaryMarkerLocation] = useState<Location | null>(null)
  const [isSubmittingTemporaryMarker, setIsSubmittingTemporaryMarker] = useState(false)
  
  // Check for unread notifications
  React.useEffect(() => {
    const loadNotificationCount = async () => {
      if (!user) {
        setUnreadNotifications(0)
        return
      }
      
      try {
        const { getUserNotifications } = await import('@/lib/footage-requests')
        const notifications = await getUserNotifications(user.uid, true) // unread only
        setUnreadNotifications(notifications.length)
      } catch (error) {
        console.error('Error loading notifications:', error)
      }
    }
    
    loadNotificationCount()
    
    // Refresh every 30 seconds
    const interval = setInterval(loadNotificationCount, 30000)
    return () => clearInterval(interval)
  }, [user])
  
  // Map navigation state
  const mapRef = useRef<MapRef>(null)
  const [searchLocation, setSearchLocation] = useState<Location | null>(null)
  
  // Handle location search selection
  const handleLocationSelect = useCallback((location: Location, address: string) => {
    setSearchLocation(location)
    console.log(`🌍 Navigating to: ${address}`, location)
    
    // Navigate the map to the selected location
    if (mapRef.current) {
      mapRef.current.flyTo(location, 16) // Zoom level 16 for good detail
    }
  }, [])

  // Handle map clicks for incident reporting OR temporary markers
  const handleMapClick = useCallback((coords: Location, screenPosition?: { x: number; y: number }) => {
    if (!user) {
      // Show auth dialog if not logged in
      setIsAuthDialogOpen(true)
      return
    }
    
    // Show choice modal
    const choice = window.confirm(
      'Click OK to report an incident (request footage from cameras)\n\n' +
      'Click Cancel to register footage YOU captured (mobile/dashcam)'
    )
    
    if (choice) {
      // Report incident
      setSelectedLocation(coords)
      setIsReportFormOpen(true)
    } else {
      // Register temporary marker
      handleOpenTemporaryMarkerForm(coords)
    }
  }, [user])

  // Handle incident report submission and create footage request
  const handleIncidentSubmit = async (data: IncidentFormData) => {
    if (!selectedLocation || !user || !userProfile) return

    setIsSubmitting(true)
    try {
      // Import the footage request creation function
      const { createFootageRequest } = await import('@/lib/footage-requests')
      
      // Determine priority based on incident type
      const priorityMap: Record<string, RequestPriority> = {
        'vehicle_accident': 'high',
        'theft': 'urgent',
        'vandalism': 'medium',
        'suspicious_activity': 'medium',
        'other': 'low'
      }
      
      // Create the footage request in Firestore
      const footageRequest = await createFootageRequest(
        user.uid,
        user.email!,
        {
          incidentType: data.incidentType,
          incidentDate: data.incidentDateTime,
          incidentTime: data.incidentDateTime.toLocaleTimeString(),
          description: data.description,
          incidentLocation: selectedLocation,
          searchRadius: data.requestRadius,
          priority: priorityMap[data.incidentType] || 'medium',
        }
      )
      
      console.log('✅ Footage request created:', footageRequest.id)
      
      // Add a marker to show the incident
      const newMarker: MapMarker = {
        id: `incident-${footageRequest.id}`,
        location: selectedLocation,
        type: 'incident',
        data: {
          ...footageRequest,
          status: 'active',
        }
      }

      setMarkers(prev => [...prev, newMarker])
      
      // Clear selection
      setSelectedLocation(null)
      setSelectedRadius(200)
      
      // Show success message
      alert(`✅ Footage request submitted! ${footageRequest.responses.length} camera owners have been notified.`)
      
    } catch (error: any) {
      console.error('❌ Error submitting incident report:', error)
      alert('Failed to submit footage request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle marker clicks
  const handleMarkerClick = useCallback((marker: MapMarker) => {
    console.log('Marker clicked:', marker)
    // TODO: Show marker details popup
  }, [])

  // Handle temporary marker submission
  const handleTemporaryMarkerSubmit = async (data: any) => {
    if (!user || !userProfile) return
    
    setIsSubmittingTemporaryMarker(true)
    try {
      const { TemporaryMarkerService } = await import('@/lib/temporary-evidence-service')
      
      const markerId = await TemporaryMarkerService.createTemporaryMarker(
        user.uid,
        user.email!,
        {
          location: data.location,
          recordedAt: data.recordedAt,
          deviceType: data.deviceType,
          deviceDescription: data.deviceDescription,
          incidentDescription: data.incidentDescription,
          ownerPhone: data.ownerPhone,
          previewImage: data.previewImage
        }
      )
      
      console.log(`✅ Temporary marker created: ${markerId}`)
      alert('✅ Footage registered! You\'ll be notified if someone needs it. Active for 14 days.')
      setIsTemporaryMarkerFormOpen(false)
      setTemporaryMarkerLocation(null)
    } catch (error: any) {
      console.error('❌ Error creating temporary marker:', error)
      alert('Failed to register footage. Please try again.')
    } finally {
      setIsSubmittingTemporaryMarker(false)
    }
  }

  // Handle opening temporary marker form
  const handleOpenTemporaryMarkerForm = (coords: Location) => {
    setTemporaryMarkerLocation(coords)
    setIsTemporaryMarkerFormOpen(true)
  }

  // Handle real-time radius updates from the incident form
  const handleRadiusChange = useCallback((radius: number) => {
    setSelectedRadius(radius)
  }, [])

  // Handle incident report form close
  const handleReportFormClose = () => {
    setIsReportFormOpen(false)
    setSelectedLocation(null)
    setSelectedRadius(parseInt(process.env.NEXT_PUBLIC_DEFAULT_REQUEST_RADIUS || '200'))
  }

  // Load community cameras for heatmap
  const loadCommunityHeatmapCameras = useCallback(async () => {
    if (!userLocation) return
    
    try {
      const { getCommunityHeatmapCameras } = await import('@/lib/firestore')
      const communityCameras = await getCommunityHeatmapCameras(userLocation, 5) // 5km radius
      setCommunityHeatmapCameras(communityCameras)
      console.log(`🌍 Loaded ${communityCameras.length} community cameras for heatmap`)
    } catch (error) {
      console.error('❌ Error loading community heatmap cameras:', error)
    }
  }, [userLocation])

  // Handle camera registration
  const handleCameraRegistrationOpen = () => {
    if (!user) {
      setIsAuthDialogOpen(true)
      return
    }
    setIsCameraRegistrationOpen(true)
  }

  const handleCameraRegistrationClose = () => {
    setIsCameraRegistrationOpen(false)
  }

  const handleCamerasChange = (cameras: RegisteredCamera[]) => {
    setRegisteredCameras(cameras)
    
    // When user's cameras change, reload community heatmap to include new data
    loadCommunityHeatmapCameras()
    
    console.log(`✅ Updated user cameras: ${cameras.length} registered cameras`)
  }

  // Handle density areas change with stable callback
  const handleDensityAreasChange = useCallback((areas: CameraDensityArea[]) => {
    setDensityAreas(areas)
  }, [])

  // Handle user logout
  const handleLogout = async () => {
    try {
      await logout()
      setShowUserMenu(false)
      // Clear user-specific data only (keep community heatmap data)
      setRegisteredCameras([])
      setIsCameraRegistrationOpen(false)
      setIsReportFormOpen(false)
      setSelectedLocation(null)
      // Community heatmap cameras remain available for anonymous users
    } catch (error) {
      console.error('❌ Error logging out:', error)
    }
  }

  // Get user location for camera dashboard - Only when user interacts
  React.useEffect(() => {
    // Don't auto-request location on page load to avoid browser warnings
    // Location will be requested when user opens camera dashboard or clicks location button
  }, [])

  // Load community cameras when user location is available
  React.useEffect(() => {
    // Only load community cameras if we have a user location
    // Location will be set when user opens dashboard or searches
    if (userLocation) {
      loadCommunityHeatmapCameras()
    } else {
      // Use a default UK location for community heatmap if no user location
      const defaultLocation = { lat: 53.3811, lng: -1.4701 } // Sheffield area
      setUserLocation(defaultLocation)
    }
  }, [userLocation, loadCommunityHeatmapCameras])

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Neighbourhood Watch+...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Full-screen map */}
      <Map
        ref={mapRef}
        onMapClick={handleMapClick}
        selectedLocation={selectedLocation}
        selectedRadius={selectedRadius}
        markers={markers}
        onMarkerClick={handleMarkerClick}
        showHeatmap={showHeatmap}
        showCameraMarkers={false} // SECURITY: Hide individual camera markers to prevent targeting
        registeredCameras={communityHeatmapCameras} // Use community cameras for heatmap
        onDensityAreasChange={handleDensityAreasChange}
        initialCenter={userProfile?.address?.coordinates} // Use user's address if available, fallback to geolocation
        heatmapRegenerationKey={heatmapRegenerationKey} // Force heatmap regeneration
        className="absolute inset-0"
      />

      {/* App Header */}
      <div className="absolute top-0 left-0 right-0 z-[1000] bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <ShieldIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-gray-900 dark:text-white">
                  Neighbourhood Watch+
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Privacy-first community security
                </p>
              </div>
            </div>
            
            {/* Location Search */}
            <div className="hidden md:block">
              <LocationSearch
                onLocationSelect={handleLocationSelect}
                placeholder="Search locations..."
                className="w-64"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Notification Center */}
            {user && (
              <div className="flex items-center gap-1">
                {/* Footage Requests to Review */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowUserMenu(false)
                    setIsRequestManagementOpen(true)
                  }}
                  className="relative text-xs font-medium px-3 py-1.5"
                >
                  <BellIcon className="w-4 h-4 mr-1" />
                  Requests
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                  )}
                </Button>
                
                {/* Camera Status Alert */}
                {(() => {
                  const pendingCount = registeredCameras.filter(c => c.verification?.status === 'pending').length
                  const requiresActionCount = registeredCameras.filter(c => 
                    c.verification?.status === 'requires_info' || c.verification?.status === 'rejected'
                  ).length
                  const unverifiedCount = registeredCameras.filter(c => !c.verification).length
                  
                  if (requiresActionCount > 0) {
                    return (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCameraRegistrationOpen}
                        className="relative text-xs font-medium px-3 py-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Fix {requiresActionCount}
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                          !
                        </span>
                      </Button>
                    )
                  } else if (unverifiedCount > 0) {
                    return (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCameraRegistrationOpen}
                        className="relative text-xs font-medium px-3 py-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                      >
                        <Shield className="w-4 h-4 mr-1" />
                        Verify {unverifiedCount}
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center">
                          {unverifiedCount}
                        </span>
                      </Button>
                    )
                  } else if (pendingCount > 0) {
                    return (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCameraRegistrationOpen}
                        className="relative text-xs font-medium px-3 py-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Camera className="w-4 h-4 mr-1" />
                        Pending {pendingCount}
                      </Button>
                    )
                  }
                  return null
                })()}
              </div>
            )}

            {/* Coverage Map Toggle */}
            <Button
              variant={showHeatmap ? "default" : "outline"}
              size="sm"
              onClick={() => {
                // Toggle heatmap visibility
                setShowHeatmap(!showHeatmap)
                
                // Force heatmap regeneration with new random patterns
                if (!showHeatmap || showHeatmap) {
                  // Regenerate every time (both when turning on and off, and when already on)
                  console.log('🔄 Forcing heatmap regeneration...')
                  setHeatmapRegenerationKey(Date.now()) // Unique key to force regeneration
                }
              }}
              className={cn(
                "text-xs font-medium transition-all duration-200",
                showHeatmap && "bg-blue-600 hover:bg-blue-700 text-white"
              )}
            >
              {showHeatmap ? (
                <>
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-red-500 rounded-full mr-2 animate-pulse" />
                  Coverage On
                </>
              ) : (
                <>
                  <div className="w-3 h-3 bg-gray-400 rounded-full mr-2" />
                  Coverage Map
                </>
              )}
            </Button>

            {/* User Authentication Area */}
            {user ? (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3"
                >
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <UserIcon className="w-3 h-3 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm font-medium">
                    {userProfile?.displayName || user.email?.split('@')[0]}
                  </span>
                  <ChevronDownIcon className="w-3 h-3" />
                </Button>

                {/* User Menu Dropdown */}
                {showUserMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-[1900]" 
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 z-[2000] w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
                      <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {userProfile?.displayName || 'User'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {user.email}
                        </p>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCameraRegistrationOpen}
                        className="w-full justify-start px-3 py-2 text-sm"
                      >
                        <HomeIcon className="w-4 h-4 mr-2" />
                        My Property
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowUserMenu(false)
                          setIsRequestManagementOpen(true)
                        }}
                        className="w-full justify-start px-3 py-2 text-sm relative"
                      >
                        <BellIcon className="w-4 h-4 mr-2" />
                        Footage Requests
                        {unreadNotifications > 0 && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center">
                            {unreadNotifications}
                          </span>
                        )}
                      </Button>
                      
                      {/* Admin Panel - Only show for admin users */}
                      {isAdmin && (
                        <Link href="/admin" className="block">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowUserMenu(false)}
                            className="w-full justify-start px-3 py-2 text-sm bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/40 dark:hover:to-purple-900/40"
                          >
                            <ShieldIcon className="w-4 h-4 mr-2" />
                            Admin Panel
                            <span className="ml-auto text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 px-2 py-0.5 rounded-full">
                              NEW
                            </span>
                          </Button>
                        </Link>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start px-3 py-2 text-sm"
                      >
                        <SettingsIcon className="w-4 h-4 mr-2" />
                        Settings
                      </Button>
                      
                      <div className="border-t border-gray-200 dark:border-gray-700 mt-1 pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleLogout}
                          className="w-full justify-start px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400"
                        >
                          <LogOutIcon className="w-4 h-4 mr-2" />
                          Sign Out
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAuthDialogOpen(true)}
                className="text-sm font-medium"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-3">
        {/* I Have Footage Button - Temporary Evidence Marker */}
        <Button
          size="lg"
          className={cn(
            "rounded-full shadow-lg hover:shadow-xl transition-all duration-200",
            "bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-6 h-14"
          )}
          onClick={() => {
            if (!user) {
              setIsAuthDialogOpen(true)
            } else {
              alert('Click anywhere on the map where you recorded the incident')
            }
          }}
        >
          <CameraIcon className="w-5 h-5" />
          <span className="text-sm font-medium">I Have Footage</span>
        </Button>

        {/* Report Incident Button */}
        <Button
          size="lg"
          className={cn(
            "w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200",
            "bg-red-600 hover:bg-red-700 text-white",
            "relative overflow-hidden"
          )}
          onClick={() => {
            if (!user) {
              setIsAuthDialogOpen(true)
            } else {
              // User can click on map next to report incident
            }
          }}
        >
          <AlertCircleIcon className="w-6 h-6" />
          
          {/* Pulse animation ring */}
          <div className="absolute inset-0 rounded-full bg-red-600/30 animate-ping scale-110" />
        </Button>
      </div>

      {/* Instructions Banner */}
      {!selectedLocation && !showHeatmap && (
        <div className="absolute bottom-6 left-6 z-[1000] max-w-sm">
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertCircleIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                  Report Incident
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  {user ? (
                    <>Click the red <strong>emergency button</strong> below, then click anywhere on the map to report an incident and request footage from nearby cameras.</>
                  ) : (
                    <>Sign in to report incidents and request footage. The red button will guide you through reporting after signing in.</>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Heatmap Instructions */}
      {showHeatmap && !selectedLocation && (
        <div className="absolute bottom-6 left-6 z-[1000] max-w-sm">
          <div className="bg-blue-50/90 dark:bg-blue-950/90 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-blue-200/50 dark:border-blue-800/50">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-3 h-3 bg-gradient-to-br from-blue-400 to-red-500 rounded-full" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-1">
                  Camera Coverage Map
                </h3>
                <p className="text-xs text-blue-700 dark:text-blue-200 leading-relaxed">
                  <strong>Blue areas</strong> have low camera coverage, <strong>red areas</strong> have high coverage. 
                  {user ? " You can still report incidents while viewing the heatmap." : " Sign in to report incidents and register your cameras."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Incident Report Panel - Slides in from right */}
      <IncidentReportPanel
        isOpen={isReportFormOpen && !!selectedLocation && !!user}
        onClose={handleReportFormClose}
        location={selectedLocation || { lat: 0, lng: 0 }}
        onSubmit={handleIncidentSubmit}
        onRadiusChange={handleRadiusChange}
        isSubmitting={isSubmitting}
      />

      {/* Camera Registration Dashboard */}
      {user && (
        <CameraRegistrationDashboard
          isOpen={isCameraRegistrationOpen}
          onClose={handleCameraRegistrationClose}
          onCamerasChange={handleCamerasChange}
        />
      )}

      {/* Authentication Dialog */}
      <AuthDialog
        isOpen={isAuthDialogOpen}
        onClose={() => setIsAuthDialogOpen(false)}
        initialMode="login"
      />

      {/* Footage Request Management */}
      {user && (
        <RequestManagement
          isOpen={isRequestManagementOpen}
          onClose={() => setIsRequestManagementOpen(false)}
        />
      )}

      {/* Temporary Evidence Marker Registration */}
      {user && temporaryMarkerLocation && (
        <TemporaryMarkerRegistration
          isOpen={isTemporaryMarkerFormOpen}
          onClose={() => {
            setIsTemporaryMarkerFormOpen(false)
            setTemporaryMarkerLocation(null)
          }}
          location={temporaryMarkerLocation}
          onSubmit={handleTemporaryMarkerSubmit}
          isSubmitting={isSubmittingTemporaryMarker}
        />
      )}

      {/* Status Indicators */}
      <div className="absolute top-20 left-4 z-[1000] flex flex-col gap-2">
        {user && (
          <div className="bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-lg px-3 py-2 shadow-sm">
            <div className="text-xs text-green-800 dark:text-green-200 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              Signed in as {userProfile?.displayName || user.email?.split('@')[0]}
            </div>
          </div>
        )}

        {markers.length > 0 && (
          <div className="bg-amber-100 dark:bg-amber-900 border border-amber-300 dark:border-amber-700 rounded-lg px-3 py-2 shadow-sm">
            <div className="text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              {markers.length} incident{markers.length !== 1 ? 's' : ''} reported
            </div>
          </div>
        )}
        
        {selectedLocation && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg px-3 py-2 shadow-sm">
            <div className="text-xs text-red-800 dark:text-red-200">
              📍 Location selected • Coverage: <strong>{selectedRadius}m radius</strong>
            </div>
          </div>
        )}
        
        {showHeatmap && (
          <div className="bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700 rounded-lg px-3 py-2 shadow-sm">
            <div className="text-xs text-blue-800 dark:text-blue-200 flex items-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-red-500 rounded-full animate-pulse" />
              Coverage map active - {communityHeatmapCameras.length} community cameras, {densityAreas.length} areas
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
