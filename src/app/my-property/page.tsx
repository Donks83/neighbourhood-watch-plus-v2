'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { ArrowLeft, Home, Camera, Plus, Shield, Settings, Edit, Trash2, Eye, EyeOff, MapPin, Activity, Bell, Clock, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Map from '@/components/map/map'
import CameraPopupConfig from '@/components/map/camera-popup-config'
import CameraEditModal from '@/components/map/camera-edit-modal'
import VerificationStatusBadge, { TrustVerificationBadge } from '@/components/verification/verification-status-badge'
import VerificationTrackingCard from '@/components/verification/verification-tracking-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import { getUserCameras, updateCamera, deleteCamera } from '@/lib/firestore'
import { formatDisplayAddress } from '@/lib/geocoding'
import type { Location, MapMarker } from '@/types'
import type { RegisteredCamera, CameraPlacementData } from '@/types/camera'

export default function MyPropertyPage() {
  const router = useRouter()
  const { user, userProfile } = useAuth()
  const [userCameras, setUserCameras] = useState<RegisteredCamera[]>([])
  const [isLoadingCameras, setIsLoadingCameras] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>('cameras')
  
  // Camera placement state
  const [isPlacingCamera, setIsPlacingCamera] = useState(false)
  const [placementData, setPlacementData] = useState<CameraPlacementData | null>(null)
  const [isConfigPopupOpen, setIsConfigPopupOpen] = useState(false)
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [pendingCameraPlacement, setPendingCameraPlacement] = useState<CameraPlacementData | null>(null)
  const [isSavingCamera, setIsSavingCamera] = useState(false)
  
  // Camera editing state
  const [editingCamera, setEditingCamera] = useState<RegisteredCamera | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  
  const mapRef = useRef<any>(null)
  const hasLoadedCameras = useRef(false)

  // Load user's cameras
  const loadUserCameras = useCallback(async () => {
    if (!user || hasLoadedCameras.current) return
    
    try {
      setIsLoadingCameras(true)
      setLoadError(null)
      const cameras = await getUserCameras(user.uid)
      setUserCameras(cameras)
      hasLoadedCameras.current = true
      console.log(`✅ Loaded ${cameras.length} cameras for user`)
    } catch (error) {
      console.error('❌ Error loading cameras:', error)
      setLoadError('Failed to load cameras')
    } finally {
      setIsLoadingCameras(false)
    }
  }, [user])

  useEffect(() => {
    loadUserCameras()
  }, [loadUserCameras])

  // Handle map click for camera placement
  const handleMapClick = useCallback((coords: Location, screenPosition?: { x: number; y: number }) => {
    if (!isPlacingCamera) return
    
    if (!placementData) {
      // First click: place the pin and open popup
      const newPlacement: CameraPlacementData = {
        location: coords,
        tempId: `temp-${Date.now()}`,
        name: `Camera ${userCameras.length + 1}`,
        type: 'security',
        fieldOfView: {
          direction: 0,
          angle: 90,
          range: 12 // 12 meter radius for camera coverage
        }
      }
      
      setPlacementData(newPlacement)
      setPendingCameraPlacement(newPlacement)
      setIsConfigPopupOpen(true)
      
      // Center the popup on screen
      const popupX = (window.innerWidth - 320) / 2
      const popupY = Math.max(50, (window.innerHeight - 600) / 2)
      setPopupPosition({ x: popupX, y: popupY })
      
      console.log('📍 Camera pin placed & popup opened')
    } else {
      // Subsequent clicks: move the pin
      setPlacementData(prev => prev ? {
        ...prev,
        location: coords,
        tempId: `temp-${Date.now()}`
      } : null)
      
      setPendingCameraPlacement(prev => prev ? {
        ...prev,
        location: coords,
        tempId: `temp-${Date.now()}`
      } : null)
      
      console.log('🔄 Camera pin moved to new location')
    }
  }, [isPlacingCamera, placementData, userCameras.length])

  // Handle save camera
  const handleSaveCamera = async (camera: RegisteredCamera) => {
    if (!user) return
    
    try {
      setIsSavingCamera(true)
      console.log('💾 Saving camera:', camera)
      
      // Camera is saved in the popup component
      // Just reload cameras here
      await loadUserCameras()
      hasLoadedCameras.current = false
      await loadUserCameras()
      
      // Close popup and reset
      setIsConfigPopupOpen(false)
      setIsPlacingCamera(false)
      setPlacementData(null)
      setPendingCameraPlacement(null)
      
      // Switch to cameras tab to see the new camera
      setActiveTab('cameras')
      
      console.log('✅ Camera saved successfully')
    } catch (error) {
      console.error('❌ Error in handleSaveCamera:', error)
    } finally {
      setIsSavingCamera(false)
    }
  }

  // Handle view distance change (for real-time map updates)
  const handleViewDistanceChange = (distance: number) => {
    if (placementData) {
      const updated = {
        ...placementData,
        fieldOfView: {
          ...placementData.fieldOfView,
          range: distance
        }
      }
      setPlacementData(updated)
      setPendingCameraPlacement(updated)
    }
  }

  // Start adding camera
  const handleStartAddingCamera = () => {
    setActiveTab('add-camera')
    setIsPlacingCamera(true)
    setPlacementData(null)
    setPendingCameraPlacement(null)
    setIsConfigPopupOpen(false)
  }

  // Cancel adding camera
  const handleCancelAddCamera = () => {
    setIsPlacingCamera(false)
    setPlacementData(null)
    setPendingCameraPlacement(null)
    setIsConfigPopupOpen(false)
    setActiveTab('cameras')
  }

  // Handle camera edit
  const handleEditCamera = (camera: RegisteredCamera) => {
    setEditingCamera(camera)
    setIsEditModalOpen(true)
  }

  // Handle save edit
  const handleSaveEdit = async (updatedCamera: RegisteredCamera) => {
    if (!user) return
    
    try {
      setIsSavingEdit(true)
      await updateCamera(updatedCamera.id, updatedCamera)
      
      // Reload cameras
      hasLoadedCameras.current = false
      await loadUserCameras()
      
      setIsEditModalOpen(false)
      setEditingCamera(null)
      
      console.log('✅ Camera updated successfully')
    } catch (error) {
      console.error('❌ Error updating camera:', error)
      alert('Failed to update camera')
    } finally {
      setIsSavingEdit(false)
    }
  }

  // Handle delete camera
  const handleDeleteCamera = async (cameraId: string) => {
    if (!user) return
    
    const confirmed = window.confirm('Are you sure you want to delete this camera? This action cannot be undone.')
    if (!confirmed) return
    
    try {
      await deleteCamera(cameraId)
      
      // Reload cameras
      hasLoadedCameras.current = false
      await loadUserCameras()
      
      console.log('✅ Camera deleted successfully')
    } catch (error) {
      console.error('❌ Error deleting camera:', error)
      alert('Failed to delete camera')
    }
  }

  // Toggle camera status
  const handleToggleStatus = async (camera: RegisteredCamera) => {
    if (!user) return
    
    try {
      const newStatus = camera.status === 'active' ? 'inactive' : 'active'
      await updateCamera(camera.id, { status: newStatus })
      
      // Reload cameras
      hasLoadedCameras.current = false
      await loadUserCameras()
      
      console.log(`✅ Camera ${newStatus}`)
    } catch (error) {
      console.error('❌ Error toggling camera status:', error)
      alert('Failed to update camera status')
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to manage your cameras</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/')} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Map
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                    My Property
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Manage your security cameras
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {userCameras.length} {userCameras.length === 1 ? 'Camera' : 'Cameras'}
              </Badge>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {user.email}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cameras">
              <Camera className="w-4 h-4 mr-2" />
              My Cameras
            </TabsTrigger>
            <TabsTrigger value="add-camera">
              <Plus className="w-4 h-4 mr-2" />
              Add Camera
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* My Cameras Tab */}
          <TabsContent value="cameras" className="space-y-6">
            {isLoadingCameras ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Loading cameras...</p>
                </CardContent>
              </Card>
            ) : loadError ? (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-900">
                  {loadError}
                </AlertDescription>
              </Alert>
            ) : userCameras.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Camera className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold mb-2">No Cameras Yet</h3>
                  <p className="text-gray-500 mb-6">Add your first security camera to start sharing footage with your community.</p>
                  <Button onClick={handleStartAddingCamera}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Camera
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {userCameras.map((camera) => (
                  <Card key={camera.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{camera.name}</h3>
                            <VerificationStatusBadge status={camera.verification.status} />
                            {camera.status === 'active' ? (
                              <Badge className="bg-green-100 text-green-800">
                                <Wifi className="w-3 h-3 mr-1" />
                                Online
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <WifiOff className="w-3 h-3 mr-1" />
                                Offline
                              </Badge>
                            )}
                          </div>
                          
                          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            <p className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              {formatDisplayAddress(camera.location.lat, camera.location.lng)}
                            </p>
                            <p className="flex items-center gap-2">
                              <Eye className="w-4 h-4" />
                              View distance: {camera.viewDistance}m
                            </p>
                            <p className="flex items-center gap-2">
                              <Camera className="w-4 h-4" />
                              Type: {camera.type === 'doorbell' ? '🚪 Video Doorbell' : camera.type === 'security' ? '🎥 Security Camera' : '📹 Other'}
                            </p>
                          </div>

                          {camera.verification.status === 'pending' && (
                            <Alert className="mt-4 border-amber-200 bg-amber-50">
                              <Clock className="h-4 w-4 text-amber-600" />
                              <AlertDescription className="text-amber-900 text-sm">
                                Verification pending. Your camera will be reviewed by our team soon.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleStatus(camera)}
                          >
                            {camera.status === 'active' ? (
                              <><EyeOff className="w-3 h-3 mr-1" /> Disable</>
                            ) : (
                              <><Eye className="w-3 h-3 mr-1" /> Enable</>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditCamera(camera)}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteCamera(camera.id)}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Add Camera Tab */}
          <TabsContent value="add-camera" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add New Camera</CardTitle>
                <CardDescription>
                  Click on the map below to place your camera, then configure its details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!isPlacingCamera && (
                  <Button onClick={handleStartAddingCamera} className="w-full mb-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Start Placing Camera
                  </Button>
                )}

                {isPlacingCamera && (
                  <div className="space-y-4">
                    <Alert className="border-blue-200 bg-blue-50">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-900">
                        <strong>Click on the map</strong> to place your camera at its exact location.
                        {placementData && ' Click again to move the pin.'}
                      </AlertDescription>
                    </Alert>

                    <div className="relative h-[500px] rounded-lg overflow-hidden border-2 border-blue-300">
                      <Map
                        ref={mapRef}
                        initialCenter={userProfile?.address?.coordinates || { lat: 52.0406, lng: 1.1556 }}
                        initialZoom={16}
                        onMapClick={handleMapClick}
                        markers={placementData ? [{
                          id: placementData.tempId,
                          position: placementData.location,
                          type: 'camera-placement'
                        }] : []}
                        temporaryMarkerRadius={0}
                        showHeatmap={false}
                        showCameraMarkers={false}
                        registeredCameras={userCameras}
                        onDensityAreasChange={() => {}}
                        className="w-full h-full"
                      />
                    </div>

                    {isPlacingCamera && (
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={handleCancelAddCamera} className="flex-1">
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Camera Settings</CardTitle>
                <CardDescription>Manage your camera preferences and notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Bell className="h-4 w-4" />
                  <AlertDescription>
                    Notification settings coming soon! You'll be able to configure alerts for footage requests and verification updates.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Camera Config Popup */}
      {isConfigPopupOpen && pendingCameraPlacement && (
        <CameraPopupConfig
          isOpen={isConfigPopupOpen}
          onClose={handleCancelAddCamera}
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
    </div>
  )
}
