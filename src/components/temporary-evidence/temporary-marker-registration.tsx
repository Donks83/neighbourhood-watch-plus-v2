'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  XIcon, 
  CameraIcon, 
  MapPinIcon, 
  CalendarIcon,
  ClockIcon,
  SmartphoneIcon,
  VideoIcon,
  AlertCircleIcon,
  UploadIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import type { Location } from '@/types'
import type { PortableDeviceType } from '@/types/temporary-evidence'
import { formatCoordinates, cn } from '@/lib/utils'

const DEVICE_TYPES = [
  { value: 'mobile_phone', label: '📱 Mobile Phone', description: 'Smartphone camera', icon: SmartphoneIcon },
  { value: 'dashcam', label: '🚗 Dashcam', description: 'Car dashboard camera', icon: VideoIcon },
  { value: 'action_camera', label: '🎥 Action Camera', description: 'GoPro, body cam', icon: CameraIcon },
  { value: 'other', label: '📹 Other Device', description: 'Other portable device', icon: VideoIcon },
] as const

const temporaryMarkerSchema = z.object({
  recordedDateTime: z.string(),
  deviceType: z.enum(['mobile_phone', 'dashcam', 'action_camera', 'other']),
  deviceDescription: z.string().optional(),
  incidentDescription: z.string().min(10).max(500),
  ownerPhone: z.string().optional(),
})

interface TemporaryMarkerRegistrationProps {
  isOpen: boolean
  onClose: () => void
  location: Location
  onSubmit: (data: any) => Promise<void>
  isSubmitting?: boolean
}

export default function TemporaryMarkerRegistration({
  isOpen, onClose, location, onSubmit, isSubmitting = false
}: TemporaryMarkerRegistrationProps) {
  const [previewImageFile, setPreviewImageFile] = useState<File | null>(null)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  
  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isValid } } = useForm({
    resolver: zodResolver(temporaryMarkerSchema),
    defaultValues: {
      recordedDateTime: new Date().toISOString().slice(0, 16),
      deviceType: 'mobile_phone' as PortableDeviceType,
      deviceDescription: '',
      incidentDescription: '',
      ownerPhone: '',
    },
    mode: 'onChange'
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { alert('Image must be less than 5MB'); return }
      if (!file.type.startsWith('image/')) { alert('Please upload an image file'); return }
      setPreviewImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => setPreviewImageUrl(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleFormSubmit = async (data: any) => {
    try {
      await onSubmit({ ...data, recordedAt: new Date(data.recordedDateTime), previewImage: previewImageFile, location })
      reset(); setPreviewImageFile(null); setPreviewImageUrl(null); onClose()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleClose = () => { reset(); setPreviewImageFile(null); setPreviewImageUrl(null); onClose() }

  return (
    <>
      <div className={cn('fixed top-0 right-0 h-full z-[1100] transition-transform duration-300', 'w-[480px] bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-700', isOpen ? 'translate-x-0' : 'translate-x-full')}>
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <CameraIcon className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Register Incident Footage</h2>
              <p className="text-sm text-gray-600">Help others by sharing evidence</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}><XIcon className="w-4 h-4" /></Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-24">
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPinIcon className="w-4 h-4 text-gray-500" />
                <Label className="text-sm font-medium">Location</Label>
              </div>
              <div className="text-sm text-gray-600">{formatCoordinates(location.lat, location.lng)}</div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">When recorded? *</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input type="date" value={watch('recordedDateTime')?.slice(0, 10) || ''} onChange={(e) => setValue('recordedDateTime', `${e.target.value}T${watch('recordedDateTime')?.slice(11, 16) || '00:00'}`)} max={new Date().toISOString().split('T')[0]} />
                <Input type="time" value={watch('recordedDateTime')?.slice(11, 16) || ''} onChange={(e) => setValue('recordedDateTime', `${watch('recordedDateTime')?.slice(0, 10)}T${e.target.value}`)} />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Device Type *</Label>
              <div className="space-y-2">
                {DEVICE_TYPES.map((device) => {
                  const Icon = device.icon
                  return (
                    <label key={device.value} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                      <input type="radio" value={device.value} {...register('deviceType')} className="mt-1" />
                      <Icon className="w-5 h-5 text-gray-500" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{device.label}</div>
                        <div className="text-xs text-gray-500">{device.description}</div>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            <div>
              <Label>Device Details (Optional)</Label>
              <Input {...register('deviceDescription')} placeholder="e.g., iPhone 14 Pro, Nextbase 622GW" />
            </div>

            <div>
              <Label>What did you capture? *</Label>
              <Textarea {...register('incidentDescription')} placeholder="Brief description" rows={4} />
              {errors.incidentDescription && <p className="text-red-500 text-sm mt-1">{errors.incidentDescription.message}</p>}
            </div>

            <div>
              <Label>Preview Image (Optional)</Label>
              {!previewImageUrl ? (
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="preview-image" />
                  <label htmlFor="preview-image" className="cursor-pointer">
                    <UploadIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Click to upload preview (max 5MB)</p>
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <img src={previewImageUrl} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                  <Button type="button" variant="destructive" size="sm" className="absolute top-2 right-2" onClick={() => { setPreviewImageFile(null); setPreviewImageUrl(null) }}>Remove</Button>
                </div>
              )}
            </div>

            <div>
              <Label>Mobile (Optional)</Label>
              <Input {...register('ownerPhone')} type="tel" placeholder="+44 7XXX XXXXXX" />
              <p className="text-xs text-gray-500 mt-1">Get SMS alerts</p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">How This Works</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Active for 14 days then auto-expires</li>
                <li>• Location not visible publicly</li>
                <li>• You decide whether to share</li>
                <li>• Earn £15-100 reward if footage helps</li>
              </ul>
            </div>
          </form>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t">
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting} className="flex-1">Cancel</Button>
            <Button onClick={handleSubmit(handleFormSubmit)} disabled={!isValid || isSubmitting} className="flex-1 bg-blue-600">
              {isSubmitting ? 'Registering...' : 'Register Footage'}
            </Button>
          </div>
        </div>
      </div>
      {isOpen && <div className="fixed inset-0 bg-black/10 z-[1050]" />}
    </>
  )
}
