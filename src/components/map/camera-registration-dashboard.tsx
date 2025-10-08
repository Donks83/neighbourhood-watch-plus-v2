'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { X, Plus, Settings, Eye, EyeOff, Trash2, Edit, MapPin, Shield, Activity, Users, Camera, Bell, Home, Map as MapIcon, MousePointer, RefreshCw, AlertCircle, Clock, Wifi, WifiOff } from 'lucide-react'
import Map from './map'
import CameraPopupConfig from './camera-popup-config'
import CameraEditModal from './camera-edit-modal'
import AddressCollectionForm from '../auth/address-collection-form'
import VerificationStatusBadge, { TrustVerificationBadge } from '../verification/verification-status-badge'
import VerificationTrackingCard from '../verification/verification-tracking-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import { getUserCameras, updateCamera, deleteCamera } from '@/lib/firestore'
import { formatDisplayAddress } from '@/lib/geocoding'
import type { Location, MapMarker } from '@/types'
import type { RegisteredCamera, PropertyDashboard, CameraPlacementData, CameraFieldOfView, UserAddress } from '@/types/camera'

interface CameraRegistrationDashboardProps {
  isOpen: boolean
  onClose: () => void
  onCamerasChange?: (cameras: RegisteredCamera[]) => void
}

export default function CameraRegistrationDashboard({
  isOpen,
  onClose,
  onCamerasChange
}: CameraRegistrationDashboardProps) {
  const { user, userProfile, updateUserAddress } = useAuth()
  const [userCameras, setUserCameras] = useState<RegisteredCamera[]>([])
  const [isLoadingCameras, setIsLoadingCameras] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [isUpdatingAddress, setIsUpdatingAddress] = useState(false)
  
  // NEW: Toggle for viewing fuzzy vs exact locations (for testing)
  const [showFuzzyLocations, setShowFuzzyLocations] = useState(false)
  
  const [isPlacingCamera, setIsPlacingCamera] = useState(false)
  const [placementData, setPlacementData] = useState<CameraPlacementData | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [hoveredCamera, setHoveredCamera] = useState<string | null>(null)
  const [isConfigPopupOpen, setIsConfigPopupOpen] = useState(false)
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [pendingCameraPlacement, setPendingCameraPlacement] = useState<CameraPlacementData | null>(null)
  const [isSavingCamera, setIsSavingCamera] = useState(false)
  const [recentlySavedCamera, setRecentlySavedCamera] = useState<string | null>(null)
  const hasLoadedCameras = useRef(false)
  const isPlacingCameraRef = useRef(false)

  // New state for improved UX
  const [showPlacementPin, setShowPlacementPin] = useState(false)
  const [mapContainerRef, setMapContainerRef] = useState<HTMLDivElement | null>(null)

  // Map ref for navigation
  const mapRef = useRef<any>(null)
  
  // Note: Map centering is now handled by passing initialCenter prop to Map component

  // Handle address form submission
  const handleAddressUpdate = useCallback(async (address: UserAddress) => {
    setIsUpdatingAddress(true)
    try {
      await updateUserAddress(address)
      setShowAddressForm(false)
      
      // Focus map on new address location
      if (address.coordinates && mapRef.current) {
        console.log('🎯 Focusing map on new address:', address.coordinates)
        mapRef.current.flyTo(address.coordinates, 16)
      }
      
      console.log('✅ Address updated successfully')
    } catch (error: any) {
      console.error('❌ Error updating address:', error)
      throw error // Let the form handle the error
    } finally {
      setIsUpdatingAddress(false)
    }
  }, [updateUserAddress])

  // Handle closing address form
  const handleCloseAddressForm = useCallback(() => {
    setShowAddressForm(false)
  }, [])

  // Load user cameras from Firestore - stable version
  const loadUserCameras = useCallback(async () => {
    if (!user || hasLoadedCameras.current) return

    setIsLoadingCameras(true)
    setLoadError(null)
    
    try {
      const cameras = await getUserCameras(user.uid)
      setUserCameras(cameras)
      hasLoadedCameras.current = true
      
      // Notify parent component
      if (onCamerasChange) {
        onCamerasChange(cameras)
      }
      
      console.log(`✅ Loaded ${cameras.length} cameras from Firestore - initial load`)
    } catch (error: any) {
      console.error('❌ Error loading user cameras:', error)
      setLoadError('Failed to load your cameras. Please try refreshing.')
    } finally {
      setIsLoadingCameras(false)
    }
  }, [user]) // Stable dependencies only

  // Load cameras when dashboard opens or user changes - prevent unnecessary reloads
  useEffect(() => {
    if (isOpen && user) {
      loadUserCameras()
    }
  }, [isOpen, user, loadUserCameras])

  // Reset loading flag when user changes
  useEffect(() => {
    hasLoadedCameras.current = false
  }, [user])

  // Map will automatically center on user's address via initialCenter prop
  // Additional focusing can be done here if needed for specific actions
  useEffect(() => {
    if (isOpen && userProfile?.address?.coordinates && mapRef.current) {
      console.log('🎯 Dashboard opened - map already centered on user address via initialCenter')
    }
  }, [isOpen, userProfile?.address?.coordinates])

  // Handle camera placement on map
  const handleMapClick = useCallback((coords: Location, screenPosition?: { x: number; y: number }) => {
    console.log('🖱️ Map clicked:', {
      coords,
      isPlacingCamera: isPlacingCameraRef.current,
      isConfigPopupOpen,
      showPlacementPin
    })
    
    if (isPlacingCameraRef.current && !isConfigPopupOpen) {
      if (!showPlacementPin) {
        console.log('📍 Creating new camera placement...')
        // FIRST CLICK: Show immediate visual feedback AND open config popup
        const newCamera: CameraPlacementData = {
          location: coords,
          type: 'security',
          name: `Camera ${userCameras.length + 1}`,
          fieldOfView: {
            direction: 0,
            angle: 90,
            range: 12 // 12 meter radius for camera coverage
          },
          tempId: `temp-${Date.now()}`
        }
        
        setPlacementData(newCamera)
        setShowPlacementPin(true)
        setPendingCameraPlacement(newCamera)
        setIsConfigPopupOpen(true)
        
        // Calculate popup position next to the click (simple offset)
        if (screenPosition) {
          // Position popup to the right and slightly above the click
          const popupX = Math.min(screenPosition.x + 20, window.innerWidth - 350)
          const popupY = Math.max(screenPosition.y - 50, 20)
          setPopupPosition({ x: popupX, y: popupY })
        } else if (mapContainerRef) {
          // Fallback to center-right of map
          const mapRect = mapContainerRef.getBoundingClientRect()
          setPopupPosition({ x: mapRect.left + mapRect.width - 340, y: mapRect.top + 50 })
        }
        
        console.log('📍 Camera pin placed & popup opened next to marker')
      } else {
        console.log('🔄 Moving existing camera pin...')
        // SUBSEQUENT CLICKS: Move the pin (repositioning while popup is open)
        setPlacementData(prev => prev ? {
          ...prev,
          location: coords,
          tempId: `temp-${Date.now()}` // Update temp ID to trigger re-render
        } : null)
        
        // Update pending placement data too
        setPendingCameraPlacement(prev => prev ? {
          ...prev,
          location: coords,
          tempId: `temp-${Date.now()}`
        } : null)
        
        // Update popup position if we have screen coordinates
        if (screenPosition) {
          const popupX = Math.min(screenPosition.x + 20, window.innerWidth - 350)
          const popupY = Math.max(screenPosition.y - 50, 20)
          setPopupPosition({ x: popupX, y: popupY })
        }
        
        console.log('🔄 Camera pin moved to new location with popup following')
      }
    } else {
      console.log('❌ Click ignored. Conditions not met:', {
        isPlacingCamera: isPlacingCameraRef.current,
        isConfigPopupOpen
      })
    }
  }, [isConfigPopupOpen, showPlacementPin, userCameras.length, mapContainerRef]) // Removed isPlacingCamera from deps

  // Remove the old handleConfirmPlacement - no longer needed since config opens immediately

  // Handle saving the configured camera
  const handleSaveCamera = useCallback(async (camera: RegisteredCamera) => {
    setIsSavingCamera(true)
    try {
      console.log('💾 Saving camera to Firestore...', camera)
      
      // VALIDATE: Check if camera is within 2km of user's registered address (for permanent cameras)
      if (userProfile?.address?.coordinates) {
        const { GeographicValidationService } = await import('@/lib/temporary-evidence-service')
        const validation = await GeographicValidationService.validateCameraLocation(
          camera.location,
          [userProfile.address.coordinates]
        )
        
        if (!validation.isValid) {
          alert(
            `⚠️ Camera Location Outside Allowed Area

` +
            `This camera is ${validation.distance?.toFixed(0) || 'unknown'}m from your registered address.\n` +
            `Permanent cameras must be within ${validation.maxAllowedDistance}m (2km) of your registered address.\n\n` +
            `Reason: ${validation.reason}\n\n` +
            `To register cameras at other locations, please add additional addresses in your settings.`
          )
          setIsSavingCamera(false)
          return
        }
        
        console.log(`✅ Camera location validated: ${validation.distance?.toFixed(0) || 'unknown'}m from registered address`)
      } else {
        // No address registered - require address first
        alert(
          '⚠️ Address Required\n\n' +
          'Please add your registered address before adding cameras. This helps ensure cameras are within your property area.\n\n' +
          'Click "Add Address" in the top right to continue.'
        )
        setIsSavingCamera(false)
        return
      }
      
      // Import and call the Firestore save function
      const { saveCamera } = await import('@/lib/firestore')
      await saveCamera(camera)
      
      console.log('💾 Camera saved to Firestore successfully')
      
      // Small delay to ensure Firestore write consistency
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Reset loading flag to allow refresh after save
      hasLoadedCameras.current = false
      
      // Reload cameras from Firestore to get the latest data
      console.log('🔄 Reloading cameras from Firestore...')
      await loadUserCameras()
      
      // Clear ALL placement-related state
      setPlacementData(null)
      setPendingCameraPlacement(null)
      setIsConfigPopupOpen(false)
      setIsPlacingCamera(false)
      isPlacingCameraRef.current = false
      setShowPlacementPin(false)
      
      console.log('✅ Camera saved and data refreshed from Firestore')
      
      // Show success feedback
      setRecentlySavedCamera(camera.name)
      setTimeout(() => {
        setRecentlySavedCamera(null)
      }, 3000)
    } catch (error: any) {
      console.error('❌ Error saving camera:', error)
      alert('Failed to save camera to database. Please try again.')
    } finally {
      setIsSavingCamera(false)
    }
  }, [loadUserCameras])

  // Handle real-time radius updates from configuration popup - stabilized
  const handleViewDistanceChange = useCallback((distance: number) => {
    setPlacementData(prev => {
      if (!prev) return null
      return {
        ...prev,
        fieldOfView: {
          ...prev.fieldOfView,
          range: distance
        }
      }
    })
  }, []) // Remove placementData dependency to prevent infinite loop

  // Handle closing configuration popup
  const handleConfigPopupClose = useCallback(() => {
    setIsConfigPopupOpen(false)
    // Keep placement data visible on map but clear popup state
    setPendingCameraPlacement(null)
  }, [])

  // Generate map markers for cameras - with optional fuzzy locations for testing
  const cameraMarkers: MapMarker[] = userCameras.map(camera => ({
    id: camera.id,
    location: showFuzzyLocations ? camera.displayLocation : camera.location, // Toggle between exact and fuzzy
    type: 'camera',
    data: camera
  }))

  // Add temporary placement marker - ALWAYS ADD WHEN PLACEMENT DATA EXISTS
  if (placementData) {
    console.log('📍 Adding placement marker to map:', placementData)
    cameraMarkers.push({
      id: placementData.tempId || 'placement-preview',
      location: placementData.location,
      type: 'camera',
      data: {
        ...placementData,
        isPlacementPreview: true // Mark as preview for Map component
      }
    })
    console.log('📍 Placement marker added to markers array. Total markers:', cameraMarkers.length)
  } else {
    console.log('📍 No placement data, placement marker not added')
  }

  const startCameraPlacement = () => {
    console.log('🎯 Starting camera placement mode')
    setIsPlacingCamera(true)
    isPlacingCameraRef.current = true
    setPlacementData(null)
    setShowPlacementPin(false)
  }

  const cancelCameraPlacement = () => {
    // Clear ALL placement state
    setIsPlacingCamera(false)
    isPlacingCameraRef.current = false
    setPlacementData(null)
    setShowPlacementPin(false)
    setIsDragging(false)
    
    // Also close config if open
    setIsConfigPopupOpen(false)
    setPendingCameraPlacement(null)
  }

  // Handle camera deletion with better feedback
  const [deletingCameraId, setDeletingCameraId] = useState<string | null>(null)
  const [deletedCameraId, setDeletedCameraId] = useState<string | null>(null)
  
  // Handle camera editing
  const [editingCamera, setEditingCamera] = useState<RegisteredCamera | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  
  const handleDeleteCamera = async (camera: RegisteredCamera) => {
    if (!user || !window.confirm(`Delete "${camera.name}"? This action cannot be undone.`)) {
      return
    }

    setDeletingCameraId(camera.id)
    try {
      await deleteCamera(camera.id, user.uid)
      
      // Show success feedback
      setDeletedCameraId(camera.id)
      
      // Reset loading flag to allow refresh
      hasLoadedCameras.current = false
      
      // Reload cameras from Firestore
      await loadUserCameras()
      
      console.log('✅ Camera deleted successfully')
      
      // Clear success feedback after 2 seconds
      setTimeout(() => {
        setDeletedCameraId(null)
      }, 2000)
    } catch (error: any) {
      console.error('❌ Error deleting camera:', error)
      alert('Failed to delete camera. Please try again.')
    } finally {
      setDeletingCameraId(null)
    }
  }

  // Handle camera offline/online toggle
  const [togglingStatusId, setTogglingStatusId] = useState<string | null>(null)
  // Handle camera visibility toggle  
  const [togglingCameraId, setTogglingCameraId] = useState<string | null>(null)
  
  const handleToggleCameraStatus = async (camera: RegisteredCamera) => {
    setTogglingStatusId(camera.id)
    try {
      const newStatus = camera.operationalStatus === 'active' ? 'offline' : 'active'
      
      await updateCamera(camera.id, {
        operationalStatus: newStatus
      })
      
      // Reset loading flag and reload
      hasLoadedCameras.current = false
      await loadUserCameras()
      
      console.log(`✅ Camera status changed to ${newStatus}`)
    } catch (error: any) {
      console.error('❌ Error updating camera status:', error)
      alert('Failed to update camera status. Please try again.')
    } finally {
      setTogglingStatusId(null)
    }
  }

  const handleToggleCameraVisibility = async (camera: RegisteredCamera) => {
    setTogglingCameraId(camera.id)
    try {
      const newShareSetting = !camera.privacySettings.shareWithCommunity
      
      await updateCamera(camera.id, {
        privacySettings: {
          ...camera.privacySettings,
          shareWithCommunity: newShareSetting
        }
      })
      
      // Reset loading flag and reload
      hasLoadedCameras.current = false
      await loadUserCameras()
      
      console.log(`✅ Camera visibility ${newShareSetting ? 'enabled' : 'disabled'}`)
    } catch (error: any) {
      console.error('❌ Error updating camera visibility:', error)
      alert('Failed to update camera settings. Please try again.')
    } finally {
      setTogglingCameraId(null)
    }
  }

  // Handle camera editing
  const handleEditCamera = (camera: RegisteredCamera) => {
    console.log('🔧 Edit camera:', camera.name)
    setEditingCamera(camera)
    setIsEditModalOpen(true)
  }

  // Handle saving camera edits
  const handleSaveEdit = async (cameraId: string, updates: Partial<RegisteredCamera>) => {
    setIsSavingEdit(true)
    try {
      await updateCamera(cameraId, updates)
      
      // Reset loading flag and reload cameras
      hasLoadedCameras.current = false
      await loadUserCameras()
      
      console.log('✅ Camera updated successfully')
    } catch (error: any) {
      console.error('❌ Error updating camera:', error)
      throw error // Let the modal handle the error
    } finally {
      setIsSavingEdit(false)
    }
  }

  // Handle regenerating fuzzy locations for security
  const [regeneratingLocations, setRegeneratingLocations] = useState(false)
  
  const handleRegenerateFuzzyLocations = async () => {
    if (!user || userCameras.length === 0) return
    
    const confirmed = window.confirm(
      'Regenerate security positions?\n\n' +
      'This will randomize your camera positions on the community map with new cryptographic security. ' +
      'Your cameras will appear in different locations to the community while maintaining the same coverage areas. ' +
      'This improves privacy and prevents targeting.\n\n' +
      'Continue?'
    )
    
    if (!confirmed) return
    
    setRegeneratingLocations(true)
    try {
      const { regenerateCameraFuzzyLocations } = await import('@/lib/firestore')
      await regenerateCameraFuzzyLocations(user.uid)
      
      // Reset loading flag and reload cameras to show new positions
      hasLoadedCameras.current = false
      await loadUserCameras()
      
      console.log('✅ Camera security positions regenerated successfully')
      alert('✅ Camera security positions updated!\n\nYour cameras now appear in new random locations on the community map for better privacy protection.')
    } catch (error: any) {
      console.error('❌ Error regenerating fuzzy locations:', error)
      alert('Failed to update camera positions. Please try again.')
    } finally {
      setRegeneratingLocations(false)
    }
  }

  if (!isOpen || !user) return null

  // Calculate security score based on number of cameras
  const securityScore = Math.min(90, 20 + (userCameras.length * 15))

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[1500] bg-black/20" onClick={onClose} />
      
      {/* Dashboard Panel */}
      <div className="fixed inset-12 z-[1600] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        
        {/* Header */}
        <div className="h-16 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Your Property Dashboard
              </h1>
              <div className="flex items-center gap-2">
                {userProfile?.address ? (
                  <>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDisplayAddress(userProfile.address)}
                    </p>
                    {userProfile.address.isVerified ? (
                      <Badge variant="default" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Pending
                      </Badge>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    No address set
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {recentlySavedCamera && (
              <div className="bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-lg px-3 py-1 text-xs text-green-800 dark:text-green-200 flex items-center gap-2 animate-in slide-in-from-right duration-300">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                ✅ "{recentlySavedCamera}" saved
              </div>
            )}
            
            {/* Address Management Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddressForm(true)}
              className="text-xs"
            >
              <MapPin className="w-3 h-3 mr-1" />
              {userProfile?.address ? 'Update Address' : 'Add Address'}
            </Button>
            
            {/* Refresh Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={loadUserCameras}
              disabled={isLoadingCameras}
              className="w-10 h-10"
            >
              <RefreshCw className={cn("w-4 h-4", isLoadingCameras && "animate-spin")} />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="w-10 h-10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Statistics Bar */}
        <div className="h-20 border-b border-gray-200 dark:border-gray-700 flex items-center px-6 gap-8 bg-white dark:bg-gray-900">
          {/* Verification Status Alert */}
          {userCameras.length > 0 && (
            (() => {
              const pendingCount = userCameras.filter(c => c.verification?.status === 'pending').length
              const requiresActionCount = userCameras.filter(c => 
                c.verification?.status === 'requires_info' || c.verification?.status === 'rejected'
              ).length
              const unsubmittedCount = userCameras.filter(c => !c.verification).length
              
              if (requiresActionCount > 0) {
                return (
                  <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg px-3 py-2">
                    <div className="text-xs font-medium text-red-800 dark:text-red-200 flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      ⚠️ {requiresActionCount} camera{requiresActionCount > 1 ? 's need' : ' needs'} your attention
                    </div>
                  </div>
                )
              } else if (unsubmittedCount > 0) {
                return (
                  <div className="bg-amber-100 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg px-3 py-2">
                    <div className="text-xs font-medium text-amber-800 dark:text-amber-200 flex items-center gap-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      📋 {unsubmittedCount} camera{unsubmittedCount > 1 ? 's ready' : ' ready'} for verification
                    </div>
                  </div>
                )
              } else if (pendingCount > 0) {
                return (
                  <div className="bg-blue-100 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg px-3 py-2">
                    <div className="text-xs font-medium text-blue-800 dark:text-blue-200 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      ⏳ {pendingCount} camera{pendingCount > 1 ? 's' : ''} pending review
                    </div>
                  </div>
                )
              } else {
                return (
                  <div className="bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg px-3 py-2">
                    <div className="text-xs font-medium text-green-800 dark:text-green-200 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      ✅ All cameras verified
                    </div>
                  </div>
                )
              }
            })()
          )}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Camera className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {userCameras.length}
              </div>
              <div className="text-sm text-gray-500">
                Total Cameras
                {userCameras.filter(c => c.verification?.status === 'approved').length > 0 && (
                  <span className="text-green-600 ml-1">
                    ({userCameras.filter(c => c.verification?.status === 'approved').length} verified)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
              <Bell className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {userProfile?.stats?.requestsMade || 0}
              </div>
              <div className="text-sm text-gray-500">Requests Made</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {securityScore}
              </div>
              <div className="text-sm text-gray-500">Security Score</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {userProfile?.enhancedTrustScore?.current || userProfile?.trustScore || 0}
              </div>
              <div className="text-sm text-gray-500">
                Trust Score
                {userProfile?.enhancedTrustScore?.level && (
                  <span className="text-purple-600 ml-1 capitalize">({userProfile.enhancedTrustScore.level})</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Address Alert */}
        {!userProfile?.address && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-6 py-4">
            <Alert className="bg-transparent border-0 p-0">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                Add your address to center the map on your property and improve security services.
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setShowAddressForm(true)}
                  className="h-auto p-0 ml-2 text-amber-800 dark:text-amber-200 underline"
                >
                  Add address now
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Error State */}
        {loadError && (
          <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-6 py-4">
            <div className="text-sm text-red-800 dark:text-red-200 flex items-center gap-2">
              <X className="w-4 h-4" />
              {loadError}
              <Button
                variant="outline"
                size="sm"
                onClick={loadUserCameras}
                className="ml-auto"
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Main Content Area - NEW LAYOUT: Map 50% + Dashboard Info 50% */}
        <div className="flex-1 flex overflow-hidden" style={{ height: 'calc(100% - 144px)' }}>
          
          {/* Left Panel - Map Section - NOW 50% WIDTH */}
          <div className="w-1/2 flex flex-col bg-gray-50 dark:bg-gray-800 p-6">
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Your Property Coverage
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {userProfile?.address ? (
                      <>Map centered on your registered address: <span className="font-medium">{formatDisplayAddress(userProfile.address)}</span></>
                    ) : (
                      "Add your address to center the map on your property location"
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  {/* Testing Toggle */}
                  <Button
                    variant={showFuzzyLocations ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowFuzzyLocations(!showFuzzyLocations)}
                    className={showFuzzyLocations ? "bg-purple-600 hover:bg-purple-700" : ""}
                    title={showFuzzyLocations ? "Showing fuzzy locations (community view)" : "Showing exact locations (owner view)"}
                  >
                    {showFuzzyLocations ? (
                      <><EyeOff className="w-4 h-4 mr-1" />Fuzzy View</>
                    ) : (
                      <><Eye className="w-4 h-4 mr-1" />Exact View</>
                    )}
                  </Button>
                  
                  {/* Add Camera Button */}
                  {!isPlacingCamera ? (
                    <Button onClick={startCameraPlacement} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Camera
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={cancelCameraPlacement}>
                      Cancel Placement
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Map Container - Square-ish aspect ratio */}
            <div 
              ref={setMapContainerRef}
              className="flex-1 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm relative"
            >
              {/* Loading Overlay */}
              {isLoadingCameras && (
                <div className="absolute inset-0 z-[1200] bg-white/80 dark:bg-gray-800/80 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Loading cameras...</div>
                  </div>
                </div>
              )}
              
              <Map
                ref={mapRef}
                onMapClick={handleMapClick}
                selectedLocation={null} // No location selection needed in property dashboard
                selectedRadius={200}
                markers={cameraMarkers}
                onMarkerClick={() => {}} // No marker interaction needed in dashboard
                showHeatmap={false}
                showCameraMarkers={true}
                showOwnerView={!showFuzzyLocations} // Show exact locations when not testing fuzzy mode
                placementData={placementData}
                registeredCameras={userCameras}
                onDensityAreasChange={() => {}} // Not needed in dashboard context
                initialCenter={userProfile?.address?.coordinates} // Use user's address coordinates for map centering
                className="w-full h-full"
                key={`placement-${isPlacingCamera}-${userProfile?.address?.coordinates?.lat || 'no-address'}`} // Force re-render when placement state or address changes
              />
              
              {/* Map Status Overlays */}
              {isPlacingCamera && (
                <div className="absolute top-4 left-4 z-[1000] space-y-2">
                  {!showPlacementPin && (
                    <div className="bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700 rounded-lg px-3 py-2 shadow-sm">
                      <div className="text-sm font-medium text-blue-800 dark:text-blue-200 flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        📍 Camera Placement Mode
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-300">
                        Click anywhere on the map to place your camera
                      </div>
                    </div>
                  )}
                  
                  {showPlacementPin && isConfigPopupOpen && (
                    <div className="bg-purple-100 dark:bg-purple-900 border border-purple-300 dark:border-purple-700 rounded-lg px-3 py-2 shadow-sm">
                      <div className="text-sm font-medium text-purple-800 dark:text-purple-200 flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                        🛠️ Configuration Mode
                      </div>
                      <div className="text-xs text-purple-600 dark:text-purple-300">
                        Click elsewhere to move pin • Adjust settings to watch coverage update live
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Map Legend */}
              <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700">
                <div className="text-sm font-medium mb-2">Camera Coverage</div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500/20 border border-purple-500 rounded-full"></div>
                    <span>Your cameras ({showFuzzyLocations ? 'fuzzy location (community view)' : 'exact location & view distance'})</span>
                  </div>
                  {showPlacementPin && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500/20 border border-blue-500 rounded-full"></div>
                      <span>New camera placement</span>
                    </div>
                  )}
                  {showFuzzyLocations && (
                    <div className="mt-2 p-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded text-xs">
                      <span className="text-purple-800 dark:text-purple-200">🔍 Testing Mode: Seeing cameras as community would (randomized locations for privacy)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Dashboard Information - NOW 50% WIDTH (EXPANDED) */}
          <div className="w-1/2 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-y-auto">
            <div className="p-6 space-y-6">
              
              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Verification Action Button - Dynamic based on status */}
                  {(() => {
                  const requiresActionCount = userCameras.filter(c => 
                  c.verification?.status === 'requires_info' || c.verification?.status === 'rejected'
                  ).length
                  const unsubmittedCount = userCameras.filter(c => !c.verification).length
                  const pendingCount = userCameras.filter(c => c.verification?.status === 'pending').length
                  
                  if (requiresActionCount > 0) {
                  return (
                  <Button variant="destructive" className="w-full justify-start">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Fix {requiresActionCount} Camera{requiresActionCount > 1 ? 's' : ''}
                  <Badge variant="outline" className="ml-auto bg-white text-red-700 border-red-200">
                  {requiresActionCount}
                  </Badge>
                  </Button>
                  )
                  } else if (unsubmittedCount > 0) {
                  return (
                  <Button variant="outline" className="w-full justify-start border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100">
                  <Shield className="w-4 h-4 mr-2" />
                  Submit for Verification
                  <Badge variant="outline" className="ml-auto bg-amber-100 text-amber-700 border-amber-300">
                  {unsubmittedCount}
                  </Badge>
                  </Button>
                  )
                  } else if (pendingCount > 0) {
                  return (
                  <Button variant="outline" className="w-full justify-start border-blue-300 text-blue-700 bg-blue-50">
                  <Clock className="w-4 h-4 mr-2" />
                  Track Verification
                  <Badge variant="outline" className="ml-auto bg-blue-100 text-blue-700 border-blue-300">
                  {pendingCount}
                  </Badge>
                  </Button>
                  )
                  } else {
                  return null // All verified, no special button needed
                  }
                  })()}
                  
                  {/* Security & Debug Actions */}
                  <Button variant="outline" className="w-full justify-start border-purple-300 text-purple-700 bg-purple-50" onClick={handleRegenerateFuzzyLocations} disabled={regeneratingLocations || userCameras.length === 0}>
                  {regeneratingLocations ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    Updating Positions...
                  </div>
                  ) : (
                  <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate Security Positions
                  </>
                  )}
                  </Button>
                  
                  <Button variant="ghost" className="w-full justify-start text-xs" onClick={() => {
                  console.log('=== CAMERA COORDINATE DEBUG ===')
                  userCameras.forEach((camera, index) => {
                  console.log(`Camera ${index + 1} "${camera.name}":`)
                    console.log('  Original Location:', camera.location)
                      console.log('  Display Location (fuzzy):', camera.displayLocation)
                  const distance = Math.sqrt(
                      Math.pow((camera.displayLocation.lat - camera.location.lat) * 111320, 2) +
                    Math.pow((camera.displayLocation.lng - camera.location.lng) * 111320 * Math.cos(camera.location.lat * Math.PI / 180), 2)
                    )
                      console.log(`  Fuzzy Distance: ${distance.toFixed(1)}m`)
                  console.log('---')
                })
              }}>
                <Settings className="w-4 h-4 mr-2" />
                Debug: Check Coordinates
              </Button>
                  
                  <Button variant="default" className="w-full justify-start" onClick={onClose}>
                    <MapIcon className="w-4 h-4 mr-2" />
                    Back to Community Map
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={startCameraPlacement}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Camera
                  </Button>
                </CardContent>
              </Card>

              {/* Your Cameras - Real Data from Firestore */}
              <Card>
                <CardHeader className="flex-row items-center justify-between pb-4">
                  <div>
                    <CardTitle className="text-lg">Your Cameras</CardTitle>
                    <CardDescription>
                      Cameras registered to your account ({userCameras.length} total)
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={startCameraPlacement} disabled={isLoadingCameras}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {isLoadingCameras ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <div className="text-sm text-gray-600">Loading your cameras...</div>
                    </div>
                  ) : userCameras.length === 0 ? (
                    <div className="text-center py-8">
                      <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">No cameras registered</h3>
                      <p className="text-sm text-gray-500 mb-4">Add your first camera to start building your security coverage.</p>
                      <Button onClick={startCameraPlacement} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Camera
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {userCameras.map((camera) => (
                        <div
                          key={camera.id}
                          className={cn(
                            "p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
                            hoveredCamera === camera.id && "ring-2 ring-blue-500"
                          )}
                          onMouseEnter={() => setHoveredCamera(camera.id)}
                          onMouseLeave={() => setHoveredCamera(null)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Camera className="w-4 h-4 text-blue-600" />
                                <span className="font-medium text-sm">{camera.name}</span>
                                
                                {/* Verification Status Badge - More Prominent */}
                                {camera.verification ? (
                                  <VerificationStatusBadge 
                                    status={camera.verification.status} 
                                    size="sm" 
                                    variant="default"
                                  />
                                ) : (
                                  <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 bg-amber-50">
                                    📋 Submit for Verification
                                  </Badge>
                                )}
                                
                                {/* Operational Status */}
                                <Badge
                                  variant={camera.operationalStatus === 'active' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {camera.operationalStatus || camera.status || 'unknown'}
                                </Badge>
                              </div>
                              <div className="text-xs text-gray-500 space-y-1">
                                <div>{camera.specifications?.resolution} • {camera.specifications?.nightVision ? 'Night vision' : 'Day only'}</div>
                                <div>Coverage: {camera.privacySettings.maxRequestRadius}m radius</div>
                                <div>Added: {camera.createdAt?.toLocaleDateString()}</div>
                                
                                {/* Enhanced Verification Details */}
                                {camera.verification ? (
                                  <div className="mt-1">
                                    {camera.verification.status === 'pending' && (
                                      <div className="text-amber-600 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                                        ⏳ Pending review (submitted {Math.floor((Date.now() - (camera.verification.submittedAt?.toMillis() || Date.now())) / (1000 * 60 * 60 * 24))} days ago)
                                      </div>
                                    )}
                                    {camera.verification.status === 'approved' && (
                                      <div className="text-green-600 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        ✅ Verified on {camera.verification.verifiedAt?.toDate().toLocaleDateString()}
                                      </div>
                                    )}
                                    {camera.verification.status === 'rejected' && (
                                      <div className="text-red-600 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                        ❌ Rejected: {camera.verification.rejectionReason?.replace(/_/g, ' ')}
                                      </div>
                                    )}
                                    {camera.verification.status === 'requires_info' && (
                                      <div className="text-blue-600 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                        📋 Additional info requested - action required
                                      </div>
                                    )}
                                    {camera.verification.status === 'auto_approved' && (
                                      <div className="text-emerald-600 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                        ⚡ Auto-verified (high trust score)
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-amber-600 flex items-center gap-2 mt-1">
                                    <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                                    📋 Ready for verification submission
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              {/* Online/Offline Status Toggle */}
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="w-6 h-6"
                                onClick={() => handleToggleCameraStatus(camera)}
                                disabled={togglingStatusId === camera.id}
                                title={camera.operationalStatus === 'active' ? 'Set camera offline' : 'Set camera online'}
                              >
                                {togglingStatusId === camera.id ? (
                                  <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                                ) : camera.operationalStatus === 'active' ? (
                                  <Wifi className="w-3 h-3 text-green-600" />
                                ) : (
                                  <WifiOff className="w-3 h-3 text-red-600" />
                                )}
                              </Button>
                              
                              {/* Camera Visibility Toggle */}
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="w-6 h-6"
                                onClick={() => handleToggleCameraVisibility(camera)}
                                disabled={togglingCameraId === camera.id}
                                title={camera.privacySettings.shareWithCommunity ? 'Hide from community' : 'Share with community'}
                              >
                                {togglingCameraId === camera.id ? (
                                  <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                                ) : camera.privacySettings.shareWithCommunity ? (
                                  <Eye className="w-3 h-3 text-green-600" />
                                ) : (
                                  <EyeOff className="w-3 h-3 text-gray-400" />
                                )}
                              </Button>
                              
                              {/* Edit Camera */}
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="w-6 h-6"
                                onClick={() => handleEditCamera(camera)}
                                title="Edit camera settings"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              
                              {/* Delete Camera */}
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="w-6 h-6 hover:text-red-600"
                                onClick={() => handleDeleteCamera(camera)}
                                disabled={deletingCameraId === camera.id}
                                title="Delete camera"
                              >
                                {deletingCameraId === camera.id ? (
                                  <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Trash2 className="w-3 h-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                          
                          {/* Success feedback for deletion */}
                          {deletedCameraId === camera.id && (
                            <div className="mt-2 text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              Camera deleted successfully
                            </div>
                          )}
                          
                          {/* Verification Status Messages */}
                          {camera.verification?.publicNotes && (
                            <div className="mt-2 text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                              📝 {camera.verification.publicNotes}
                            </div>
                          )}
                          
                          {camera.privacySettings.requireApproval && (
                            <div className="mt-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded">
                              📋 Requests require approval
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Security Score - Dynamic */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Property Security Score
                  </CardTitle>
                  <CardDescription>
                    Based on your camera coverage and community participation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {securityScore}
                      </div>
                      <div className="text-sm text-green-600 font-medium">
                        {securityScore >= 80 ? 'Excellent' : securityScore >= 60 ? 'Good' : securityScore >= 40 ? 'Fair' : 'Needs Improvement'}
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${securityScore}%` }}
                      />
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", userCameras.length > 0 ? "bg-green-500" : "bg-gray-400")}></div>
                        <span>{userCameras.length > 0 ? `${userCameras.length} cameras registered` : 'No cameras registered'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", (userProfile?.stats?.requestsMade || 0) > 0 ? "bg-green-500" : "bg-gray-400")}></div>
                        <span>Community participation</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", userProfile?.verified ? "bg-green-500" : "bg-gray-400")}></div>
                        <span>{userProfile?.verified ? 'Account verified' : 'Account verification pending'}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      {/* Address Collection Dialog */}
      {showAddressForm && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm"
            onClick={handleCloseAddressForm}
          />
          
          {/* Dialog */}
          <div className="fixed left-[50%] top-[50%] z-[2001] translate-x-[-50%] translate-y-[-50%] w-full max-w-md">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
              
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {userProfile?.address ? 'Update Address' : 'Add Address'}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Center your dashboard map on your property
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCloseAddressForm}
                  className="w-8 h-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="p-6">
                <AddressCollectionForm
                  onSubmit={handleAddressUpdate}
                  initialData={userProfile?.address}
                  submitButtonText={userProfile?.address ? 'Update Address' : 'Add Address'}
                  isStandalone={false}
                />
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Camera Configuration Popup - Small popup next to marker */}
      {pendingCameraPlacement && (
        <CameraPopupConfig
          isOpen={isConfigPopupOpen}
          onClose={handleConfigPopupClose}
          placementData={pendingCameraPlacement}
          onSave={handleSaveCamera}
          onViewDistanceChange={handleViewDistanceChange}
          isSubmitting={isSavingCamera}
          position={popupPosition}
        />
      )}
      
      {/* Camera Edit Modal */}
      {editingCamera && (
        <CameraEditModal
          camera={editingCamera}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setEditingCamera(null)
          }}
          onSave={handleSaveEdit}
          isSaving={isSavingEdit}
        />
      )}
    </>
  )
}
