'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Camera, Upload, Image as ImageIcon, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Location } from '@/types'
import type { CameraPlacementData, RegisteredCamera } from '@/types/camera'
import { formatCoordinates } from '@/lib/utils'
import { fuzzyLocation } from '@/lib/camera-utils'
import { useAuth } from '@/contexts/auth-context'
import type { CameraVerification, VerificationEvidence } from '@/types/verification'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'

const cameraConfigSchema = z.object({
  name: z.string().min(3, 'Camera name must be at least 3 characters'),
  type: z.enum(['doorbell', 'security', 'other']),
  resolution: z.enum(['720p', '1080p', '4K', 'Other']),
  nightVision: z.boolean(),
  brand: z.string().optional(),
  model: z.string().optional(),
  viewDistance: z.number().min(1).max(40),
  userNotes: z.string().optional()
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
  const [verificationPhotos, setVerificationPhotos] = useState<File[]>([])
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  
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
      brand: '',
      model: '',
      viewDistance: 12,
      userNotes: ''
    },
    mode: 'onChange'
  })

  const watchedViewDistance = watch('viewDistance')

  // Update placement data in real-time for map visualization
  const prevViewDistance = React.useRef<number>(watchedViewDistance)
  React.useEffect(() => {
    if (typeof watchedViewDistance === 'number' && onViewDistanceChange && watchedViewDistance !== prevViewDistance.current) {
      prevViewDistance.current = watchedViewDistance
      onViewDistanceChange(watchedViewDistance)
    }
  }, [watchedViewDistance])

  // Handle photo selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    
    // Limit to 4 photos
    const newPhotos = [...verificationPhotos, ...files].slice(0, 4)
    setVerificationPhotos(newPhotos)
    
    // Create preview URLs
    const newPreviewUrls = newPhotos.map(file => URL.createObjectURL(file))
    setPhotoPreviewUrls(newPreviewUrls)
  }

  // Remove photo
  const removePhoto = (index: number) => {
    const newPhotos = verificationPhotos.filter((_, i) => i !== index)
    const newPreviewUrls = photoPreviewUrls.filter((_, i) => i !== index)
    setVerificationPhotos(newPhotos)
    setPhotoPreviewUrls(newPreviewUrls)
  }

  // Upload photos to Firebase Storage
  const uploadPhotos = async (userId: string, cameraId: string): Promise<string[]> => {
    if (verificationPhotos.length === 0) return []
    
    const uploadPromises = verificationPhotos.map(async (file, index) => {
      const fileExt = file.name.split('.').pop()
      const fileName = `${cameraId}-${index}-${Date.now()}.${fileExt}`
      const storageRef = ref(storage, `verification-photos/${userId}/${fileName}`)
      
      await uploadBytes(storageRef, file)
      return getDownloadURL(storageRef)
    })
    
    return Promise.all(uploadPromises)
  }

  const handleFormSubmit = async (data: CameraConfigFormData) => {
    try {
      if (!user) {
        throw new Error('User not authenticated')
      }

      console.log('💾 Starting camera save process...', data)
      setUploadingPhotos(true)

      const cameraId = `camera-${Date.now()}`

      // Upload verification photos
      const photoUrls = await uploadPhotos(user.uid, cameraId)
      console.log('📸 Uploaded photos:', photoUrls)

      // Create verification evidence with photos and notes
      const evidence: VerificationEvidence = {
        photos: photoUrls.length > 0 ? photoUrls : undefined,
        userNotes: data.userNotes || 'Camera registered through property dashboard'
      }

      // Create verification object
      const verification: CameraVerification = {
        status: 'pending',
        submittedAt: new Date() as any,
        evidence,
        history: [{
          id: `submit-${Date.now()}`,
          action: 'submitted',
          performedBy: user.uid,
          performedAt: new Date() as any,
          evidence
        }],
        priority: 'normal'
      }

      const newCamera: RegisteredCamera = {
        id: cameraId,
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
          brand: data.brand || '',
          model: data.model || ''
        },
        privacySettings: {
          shareWithCommunity: true,
          requireApproval: true,
          maxRequestRadius: data.viewDistance,
          autoRespond: false
        },
        operationalStatus: 'active',
        verification,
        status: 'active',
        createdAt: new Date() as any,
        lastUpdated: new Date() as any
      }

      console.log('💾 Camera object created with verification:', newCamera)
      await onSave(newCamera)
      console.log('💾 onSave completed, closing popup')
      
      reset()
      setVerificationPhotos([])
      setPhotoPreviewUrls([])
      onClose()
    } catch (error) {
      console.error('❌ Error saving camera:', error)
      alert('Failed to save camera. Please try again.')
    } finally {
      setUploadingPhotos(false)
    }
  }

  const handleClose = () => {
    reset()
    setVerificationPhotos([])
    setPhotoPreviewUrls([])
    onClose()
  }

  if (!isOpen) return null

  // Calculate optimal position
  const popupWidth = 360
  const popupHeight = 600
  const safePosition = {
    x: Math.min(position.x, window.innerWidth - popupWidth - 20),
    y: Math.min(position.y, window.innerHeight - popupHeight - 20)
  }

  return (
    <>
      <div 
        className="fixed z-[1800] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border-2 border-blue-200 dark:border-blue-700 w-[360px] max-h-[calc(100vh-100px)] flex flex-col"
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
        <div className="p-4 max-h-[500px] overflow-y-auto space-y-4">
          
          {/* Verification Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="text-xs text-blue-800 dark:text-blue-200">
              🔍 <strong>Verification Required:</strong> Upload photos and add notes to help admins verify your camera faster!
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

            {/* Camera Type */}
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

            {/* Technical Specs */}
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
                <label className="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded-md cursor-pointer text-sm h-[42px]">
                  <input type="checkbox" {...register('nightVision')} />
                  <span>Enabled</span>
                </label>
              </div>
            </div>

            {/* Brand & Model */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium mb-2 block">Brand</Label>
                <select {...register('brand')} className="w-full p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800">
                  <option value="">Select...</option>
                  <option value="Ring">Ring</option>
                  <option value="Nest">Nest</option>
                  <option value="Arlo">Arlo</option>
                  <option value="Blink">Blink</option>
                  <option value="Eufy">Eufy</option>
                  <option value="Hikvision">Hikvision</option>
                  <option value="Reolink">Reolink</option>
                  <option value="Wyze">Wyze</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Model</Label>
                <Input
                  {...register('model')}
                  placeholder="Optional"
                  className="text-sm"
                />
              </div>
            </div>

            {/* View Distance */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                View Distance: {watch('viewDistance')}m
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
            </div>

            {/* Verification Photos */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Verification Photos (Optional)
              </Label>
              <p className="text-xs text-gray-600 mb-2">
                Upload photos of your camera for faster verification (max 4)
              </p>
              
              {photoPreviewUrls.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {photoPreviewUrls.map((url, index) => (
                    <div key={index} className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                      <img 
                        src={url} 
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {photoPreviewUrls.length < 4 && (
                <label className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-sm text-gray-600">Click to upload</span>
                  <span className="text-xs text-gray-500">{photoPreviewUrls.length}/4 photos</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* User Notes */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Additional Notes (Optional)
              </Label>
              <Textarea
                {...register('userNotes')}
                placeholder="Any additional information to help admins verify your camera..."
                rows={3}
                className="text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                e.g., Installation date, view angle description, why this camera is important for the community
              </p>
            </div>
          </form>
        </div>

        {/* Fixed Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting || uploadingPhotos}
              className="flex-1 text-sm"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              form="camera-popup-form"
              disabled={!isValid || isSubmitting || uploadingPhotos}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm"
            >
              {uploadingPhotos ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Uploading...
                </div>
              ) : isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </div>
              ) : (
                'Save Camera'
              )}
            </Button>
          </div>
          
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
