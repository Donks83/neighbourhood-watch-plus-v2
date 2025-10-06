'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Camera, Shield, Settings, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Location } from '@/types'
import type { CameraPlacementData, RegisteredCamera } from '@/types/camera'
import { formatCoordinates, cn } from '@/lib/utils'
import { fuzzyLocation } from '@/lib/camera-utils'
import { useAuth } from '@/contexts/auth-context'

const cameraConfigSchema = z.object({
  name: z.string().min(3, 'Camera name must be at least 3 characters'),
  type: z.enum(['doorbell', 'security', 'dash', 'indoor', 'other']),
  resolution: z.enum(['720p', '1080p', '4K', 'Other']),
  nightVision: z.boolean(),
  brand: z.string().optional(),
  model: z.string().optional(),
  shareWithCommunity: z.boolean(),
  maxRequestRadius: z.number().min(50).max(500)
})

type CameraConfigFormData = z.infer<typeof cameraConfigSchema>

const CAMERA_TYPES = [
  { value: 'doorbell', label: '🚪 Video Doorbell', description: 'Ring, Nest Hello, etc.' },
  { value: 'security', label: '🎥 Security Camera', description: 'CCTV, outdoor cameras' },
  { value: 'dash', label: '🚗 Dash Camera', description: 'Vehicle dashboard camera' },
  { value: 'indoor', label: '🏠 Indoor Camera', description: 'Indoor security, baby monitor' },
  { value: 'other', label: '📹 Other', description: 'Other camera types' },
] as const

interface CameraConfigurationDialogProps {
  isOpen: boolean
  onClose: () => void
  placementData: CameraPlacementData
  onSave: (camera: RegisteredCamera) => void
  onRadiusChange?: (radius: number) => void // For real-time map updates
  isSubmitting?: boolean
  dashboardContext?: boolean // NEW: Whether panel should slide from dashboard edge
}

export default function CameraConfigurationDialog({
  isOpen,
  onClose,
  placementData,
  onSave,
  onRadiusChange,
  isSubmitting = false,
  dashboardContext = false
}: CameraConfigurationDialogProps) {
  const { user } = useAuth()
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid }
  } = useForm<CameraConfigFormData>({
    resolver: zodResolver(cameraConfigSchema),
    defaultValues: {
      name: placementData.name,
      type: placementData.type,
      resolution: '1080p',
      nightVision: true,
      brand: '',
      model: '',
      shareWithCommunity: true,
      maxRequestRadius: 150
    },
    mode: 'onChange'
  })

  const watchedType = watch('type')
  const watchedShareWithCommunity = watch('shareWithCommunity')
  const watchedRadius = watch('maxRequestRadius')

  // Update placement data in real-time for map visualization
  React.useEffect(() => {
    if (typeof watchedRadius === 'number' && onRadiusChange) {
      // Notify parent component of radius changes for real-time map updates
      onRadiusChange(watchedRadius)
    }
  }, [watchedRadius, onRadiusChange])

  const handleFormSubmit = async (data: CameraConfigFormData) => {
    try {
      if (!user) {
        throw new Error('User not authenticated')
      }

      const newCamera: RegisteredCamera = {
        id: `camera-${Date.now()}`,
        userEmail: user.email || '',
        userId: user.uid,
        location: placementData.location, // Exact location (private to owner)
        displayLocation: fuzzyLocation(placementData.location, 30), // Fuzzy location for privacy
        name: data.name,
        type: data.type,
        fieldOfView: placementData.fieldOfView,
        specifications: {
          resolution: data.resolution,
          nightVision: data.nightVision,
          brand: data.brand,
          model: data.model
        },
        privacySettings: {
          shareWithCommunity: data.shareWithCommunity,
          requireApproval: true, // Always require manual approval
          maxRequestRadius: data.maxRequestRadius,
          autoRespond: false // Never auto-respond, always manual
        },
        status: 'active',
        createdAt: new Date() as any,
        lastUpdated: new Date() as any
      }

      await onSave(newCamera)
      reset()
      onClose()
    } catch (error) {
      console.error('Error saving camera:', error)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  if (!isOpen) return null

  // Dashboard context positioning - relative to dashboard, not viewport
  const panelClasses = dashboardContext 
    ? cn(
        // Dashboard context: absolute positioned within dashboard container, slides from the right edge of dashboard
        "absolute top-0 right-0 h-full w-[420px] bg-white dark:bg-gray-900 shadow-2xl border-l-2 border-blue-200 dark:border-blue-700 z-[1700] transform transition-all duration-300 ease-out flex flex-col",
        isOpen ? "translate-x-0" : "translate-x-full"
      )
    : cn(
        // Standalone context: fixed positioned relative to viewport
        "fixed top-0 right-0 h-full w-[420px] bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-700 z-[2000] transform transition-transform duration-300 ease-in-out flex flex-col",
        isOpen ? "translate-x-0" : "translate-x-full"
      )

  return (
    <>
      {/* Conditional backdrop - Only show for non-dashboard context, dashboard should NOT blur background */}
      {!dashboardContext && isOpen && (
        <div 
          className="fixed inset-0 z-[1900] bg-black/20 backdrop-blur-sm transition-opacity duration-300"
          onClick={handleClose} 
        />
      )}
      
      {/* Slide-out Side Panel */}
      <div className={panelClasses}>
        
        {/* Panel Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-950 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Configure Camera
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {dashboardContext ? 'Watch coverage update live on map!' : 'Complete camera setup'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="w-8 h-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 relative">
          {/* Live Map Tip - Enhanced for dashboard context */}
          {dashboardContext && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                🔄 Live Preview Active!
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                Watch your camera coverage update instantly on the map as you adjust settings!<br />You can also click elsewhere on the map to move the camera pin.
              </div>
            </div>
          )}
          
          <form id="camera-config-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              
            {/* Location Display */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Camera Location
                </CardTitle>
                <CardDescription>
                  Placed at: {formatCoordinates(placementData.location.lat, placementData.location.lng)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Coverage: {placementData.fieldOfView.range}m radius • Your exact location will be slightly randomized for privacy
                </div>
              </CardContent>
            </Card>

            {/* Camera Details */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Camera Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Camera Name */}
                <div>
                  <Label htmlFor="name" className="text-sm font-medium mb-2 block">
                    Camera Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register('name')}
                    placeholder="e.g., Front Door Camera, Driveway Camera"
                    className="w-full"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                {/* Camera Type */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">
                    Camera Type <span className="text-red-500">*</span>
                  </Label>
                  <div className="space-y-2">
                    {CAMERA_TYPES.map((type) => (
                      <label
                        key={type.value}
                        className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                      >
                        <input
                          type="radio"
                          value={type.value}
                          {...register('type')}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{type.label}</div>
                          <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Technical Specs */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Resolution</Label>
                    <select {...register('resolution')} className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800">
                      <option value="720p">720p HD</option>
                      <option value="1080p">1080p Full HD</option>
                      <option value="4K">4K Ultra HD</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Night Vision</Label>
                    <label className="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded-md cursor-pointer">
                      <input type="checkbox" {...register('nightVision')} />
                      <span className="text-sm">Has night vision</span>
                    </label>
                  </div>
                </div>

                {/* Brand & Model (Optional) */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Brand (Optional)</Label>
                    <Input
                      {...register('brand')}
                      placeholder="e.g., Ring, Nest, Hikvision"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Model (Optional)</Label>
                    <Input
                      {...register('model')}
                      placeholder="e.g., Video Doorbell Pro"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Privacy & Sharing Settings
                </CardTitle>
                <CardDescription>
                  Control how your camera participates in the community
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Community Sharing */}
                <div className="flex items-start gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <input
                    type="checkbox"
                    {...register('shareWithCommunity')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">Share with Community</span>
                      {watchedShareWithCommunity ? (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          <Eye className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          <EyeOff className="w-3 h-3 mr-1" />
                          Private
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Allow neighbors to request footage from this camera during incidents
                    </div>
                  </div>
                </div>

                {/* Max Request Radius - Enhanced with live preview note */}
                {watchedShareWithCommunity && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Camera View Distance: {watch('maxRequestRadius')}m
                      {dashboardContext && (
                        <span className="text-blue-600 ml-2 text-xs">🔄 Updates map live!</span>
                      )}
                    </Label>
                    <div className="px-3">
                      <input
                        type="range"
                        min="50"
                        max="500"
                        step="25"
                        {...register('maxRequestRadius', { valueAsNumber: true })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>50m</span>
                        <span>250m</span>
                        <span>500m</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Maximum effective view distance of your camera. 
                      {dashboardContext && (
                        <span className="text-blue-600 font-medium"> Watch the blue circle on the map update as you drag this slider!</span>
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </form>
        </div>

        {/* Fixed Footer with Save Buttons */}
        <div className="border-t-2 border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800 flex-shrink-0 shadow-lg">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              form="camera-config-form"
              disabled={!isValid || isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving Camera...
                </div>
              ) : (
                'Save Camera'
              )}
            </Button>
          </div>
          {/* Validation Summary - helpful for users */}
          <div className="text-xs text-gray-500 mt-2 text-center flex items-center justify-center gap-4">
            <span className={cn("flex items-center gap-1", isValid ? "text-green-600" : "text-red-500")}>
              {isValid ? '✅' : '❌'} Form {isValid ? 'Ready' : 'Incomplete'}
            </span>
            {isSubmitting && (
              <span className="text-blue-600 flex items-center gap-1">
                ⏳ Saving...
              </span>
            )}
            {dashboardContext && (
              <span className="text-blue-600 flex items-center gap-1">
                🔄 Live Preview Active
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
