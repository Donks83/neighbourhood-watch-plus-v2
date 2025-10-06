'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Location } from '@/types'
import type { CameraPlacementData, RegisteredCamera } from '@/types/camera'
import { formatCoordinates } from '@/lib/utils'
import { fuzzyLocation } from '@/lib/camera-utils'
import { useAuth } from '@/contexts/auth-context'
import type { CameraVerification, VerificationEvidence } from '@/types/verification'

const cameraConfigSchema = z.object({
  name: z.string().min(3, 'Camera name must be at least 3 characters'),
  type: z.enum(['doorbell', 'security', 'other']), // Removed dash and indoor as requested
  resolution: z.enum(['720p', '1080p', '4K', 'Other']),
  nightVision: z.boolean(),
  viewDistance: z.number().min(1).max(40) // Changed to 1-40m as requested
})

type CameraConfigFormData = z.infer<typeof cameraConfigSchema>

const CAMERA_TYPES = [
  { value: 'doorbell', label: '🚪 Video Doorbell', description: 'Ring, Nest Hello, etc.' },
  { value: 'security', label: '🎥 Security Camera', description: 'CCTV, outdoor cameras' },
  { value: 'other', label: '📹 Other', description: 'Other camera types' },
] as const

interface CameraPopupConfigProps {
  isOpen: boolean
  onClose: () => void
  placementData: CameraPlacementData
  onSave: (camera: RegisteredCamera) => void
  onViewDistanceChange?: (distance: number) => void
  isSubmitting?: boolean
  position: { x: number; y: number }
}

export default function CameraPopupConfig({
  isOpen,
  onClose,
  placementData,
  onSave,
  onViewDistanceChange,
  isSubmitting = false,
  position
}: CameraPopupConfigProps) {
  const { user } = useAuth()
  
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid }
  } = useForm<CameraConfigFormData>({
    resolver: zodResolver(cameraConfigSchema),
    defaultValues: {
      name: placementData.name,
      type: placementData.type === 'dash' || placementData.type === 'indoor' ? 'other' : placementData.type,
      resolution: '1080p',
      nightVision: true,
      viewDistance: 12 // Default to 12m
    },
    mode: 'onChange'
  })

  const watchedViewDistance = watch('viewDistance')

  // Update placement data in real-time for map visualization - use ref to prevent infinite loops
  const prevViewDistance = React.useRef<number>(watchedViewDistance)
  React.useEffect(() => {
    if (typeof watchedViewDistance === 'number' && onViewDistanceChange && watchedViewDistance !== prevViewDistance.current) {
      prevViewDistance.current = watchedViewDistance
      onViewDistanceChange(watchedViewDistance)
    }
  }, [watchedViewDistance]) // Removed onViewDistanceChange from deps

  const handleFormSubmit = async (data: CameraConfigFormData) => {
    try {
      if (!user) {
        throw new Error('User not authenticated')
      }

      console.log('💾 Starting camera save process...', data)
      console.log('💾 User:', { uid: user.uid, email: user.email })
      console.log('💾 Placement location:', placementData.location)

      // Create default verification evidence
      const defaultEvidence: VerificationEvidence = {
        userNotes: 'Camera registered through property dashboard'
      }

      // Create verification object - cameras default to pending status
      const verification: CameraVerification = {
        status: 'pending',
        submittedAt: new Date() as any,
        evidence: defaultEvidence,
        history: [{
          id: `submit-${Date.now()}`,
          action: 'submitted',
          performedBy: user.uid,
          performedAt: new Date() as any,
          evidence: defaultEvidence
        }],
        priority: 'normal'
      }

      const newCamera: RegisteredCamera = {
        id: `camera-${Date.now()}`,
        userEmail: user.email || '',
        userId: user.uid,
        location: placementData.location,
        displayLocation: fuzzyLocation(placementData.location, 25),
        name: data.name,
        type: data.type,
        fieldOfView: {
          ...placementData.fieldOfView,
          range: data.viewDistance
        },
        specifications: {
          resolution: data.resolution,
          nightVision: data.nightVision,
          brand: '',
          model: ''
        },
        privacySettings: {
          shareWithCommunity: true,
          requireApproval: true,
          maxRequestRadius: data.viewDistance,
          autoRespond: false
        },
        // New verification system fields
        operationalStatus: 'active', // Camera is operational
        verification, // Verification data with pending status
        
        // Legacy field for backwards compatibility
        status: 'active',
        
        createdAt: new Date() as any,
        lastUpdated: new Date() as any
      }

      console.log('💾 Camera object created with verification:', newCamera)
      await onSave(newCamera)
      console.log('💾 onSave completed, closing popup')
      
      reset()
      onClose()
    } catch (error) {
      console.error('❌ Error saving camera:', error)
      alert('Failed to save camera. Please try again.')
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  if (!isOpen) return null

  // Calculate optimal position to avoid screen edges
  const popupWidth = 320
  const popupHeight = 400
  const safePosition = {
    x: Math.min(position.x, window.innerWidth - popupWidth - 20),
    y: Math.min(position.y, window.innerHeight - popupHeight - 20)
  }

  return (
    <>
      {/* No backdrop - keep map fully interactive */}
      
      {/* Small Popup Window */}
      <div 
        className="fixed z-[1800] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border-2 border-blue-200 dark:border-blue-700 w-80 overflow-hidden"
        style={{
          left: `${safePosition.x}px`,
          top: `${safePosition.y}px`,
        }}
      >
        
        {/* Popup Header */}
        <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950 border-b border-blue-200 dark:border-blue-700">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
              <Camera className="w-3 h-3 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                Configure Camera
              </h3>
              <p className="text-xs text-gray-500">
                {formatCoordinates(placementData.location.lat, placementData.location.lng)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="w-6 h-6 rounded-full"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>

        {/* Scrollable Form Content */}
        <div className="p-4 max-h-96 overflow-y-auto space-y-4">
          
          {/* Live Preview Notice */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <div className="text-xs text-green-800 dark:text-green-200 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Live Preview: Coverage updates as you adjust settings!
            </div>
          </div>
          
          {/* Verification Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="text-xs text-blue-800 dark:text-blue-200">
              🔍 <strong>Verification Required:</strong> Your camera will be submitted for community verification after registration. Verified cameras build trust and receive more footage requests.
            </div>
          </div>
          
          <form id="camera-popup-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            
            {/* Camera Name */}
            <div>
              <Label htmlFor="name" className="text-sm font-medium mb-2 block">
                Camera Name <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register('name')}
                placeholder="e.g., Front Door Camera"
                className="text-sm"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Camera Type - Simplified Options */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Camera Type <span className="text-red-500">*</span>
              </Label>
              <div className="space-y-2">
                {CAMERA_TYPES.map((type) => (
                  <label
                    key={type.value}
                    className="flex items-start gap-2 p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors text-sm"
                  >
                    <input
                      type="radio"
                      value={type.value}
                      {...register('type')}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-gray-500">{type.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Technical Specs - Simplified */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium mb-2 block">Resolution</Label>
                <select {...register('resolution')} className="w-full p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800">
                  <option value="720p">720p HD</option>
                  <option value="1080p">1080p Full HD</option>
                  <option value="4K">4K Ultra HD</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Night Vision</Label>
                <label className="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded-md cursor-pointer text-sm">
                  <input type="checkbox" {...register('nightVision')} />
                  <span>Has night vision</span>
                </label>
              </div>
            </div>

            {/* View Distance - 1-40m Range */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                View Distance: {watch('viewDistance')}m 
                <span className="text-blue-600 text-xs">🔄 Live preview!</span>
              </Label>
              <div className="px-2">
                <input
                  type="range"
                  min="1"
                  max="40"
                  step="1"
                  {...register('viewDistance', { valueAsNumber: true })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1m</span>
                  <span>20m</span>
                  <span>40m</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Effective view distance of your camera. <span className="text-blue-600 font-medium">Watch the coverage circle update on the map!</span>
              </p>
            </div>
          </form>
        </div>

        {/* Fixed Footer with Save Button */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 text-sm"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              form="camera-popup-form"
              disabled={!isValid || isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </div>
              ) : (
                'Save Camera'
              )}
            </Button>
          </div>
          
          {/* Status Indicator */}
          <div className="text-center mt-2">
            <span className={`text-xs ${
              isValid ? "text-green-600" : "text-red-500"
            }`}>
              {isValid ? '✅ Ready to save' : '❌ Fill required fields'}
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
