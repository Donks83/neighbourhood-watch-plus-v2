'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CalendarIcon, MapPinIcon, AlertTriangleIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { Location, IncidentFormData } from '@/types'
import { formatCoordinates } from '@/lib/utils'

const incidentSchema = z.object({
  incidentType: z.enum(['vehicle_accident', 'theft', 'vandalism', 'suspicious_activity', 'other']),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  incidentDateTime: z.string(),
  requestRadius: z.number().min(50).max(500, 'Radius must be between 50m and 500m'),
})

const INCIDENT_TYPES = [
  { value: 'vehicle_accident', label: '🚗 Vehicle Accident', description: 'Car crashes, collisions, or traffic incidents' },
  { value: 'theft', label: '🔓 Theft', description: 'Stolen property, burglary, or break-ins' },
  { value: 'vandalism', label: '🏠 Vandalism', description: 'Property damage or graffiti' },
  { value: 'suspicious_activity', label: '👀 Suspicious Activity', description: 'Unusual or concerning behavior' },
  { value: 'other', label: '❓ Other', description: 'Other incidents requiring footage' },
] as const

interface IncidentReportFormProps {
  isOpen: boolean
  onClose: () => void
  location: Location
  onSubmit: (data: IncidentFormData) => Promise<void>
  isSubmitting?: boolean
}

export default function IncidentReportForm({
  isOpen,
  onClose,
  location,
  onSubmit,
  isSubmitting = false
}: IncidentReportFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid }
  } = useForm<IncidentFormData>({
    resolver: zodResolver(incidentSchema),
    defaultValues: {
      incidentType: 'other',
      description: '',
      incidentDateTime: new Date(), // Use Date object, react-hook-form will handle conversion
      requestRadius: parseInt(process.env.NEXT_PUBLIC_DEFAULT_REQUEST_RADIUS || '200'),
    },
    mode: 'onChange'
  })

  const selectedRadius = watch('requestRadius')

  const handleFormSubmit = async (data: IncidentFormData) => {
    try {
      await onSubmit({
        ...data,
        incidentDateTime: new Date(data.incidentDateTime),
        requestRadius: Number(data.requestRadius)
      } as IncidentFormData)
      reset()
      onClose()
    } catch (error) {
      console.error('Error submitting incident report:', error)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangleIcon className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <DialogTitle>Report Incident</DialogTitle>
              <DialogDescription>
                Request camera footage from nearby residents
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Location Display */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPinIcon className="w-4 h-4 text-gray-500" />
              <Label className="text-sm font-medium">Incident Location</Label>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {formatCoordinates(location.lat, location.lng)}
            </div>
          </div>

          {/* Incident Type */}
          <div>
            <Label htmlFor="incidentType" className="text-sm font-medium mb-3 block">
              What happened? <span className="text-red-500">*</span>
            </Label>
            <div className="space-y-2">
              {INCIDENT_TYPES.map((type) => (
                <label
                  key={type.value}
                  className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    value={type.value}
                    {...register('incidentType')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{type.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                  </div>
                </label>
              ))}
            </div>
            {errors.incidentType && (
              <p className="text-red-500 text-sm mt-1">{errors.incidentType.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium mb-2 block">
              Describe what happened <span className="text-red-500">*</span>
            </Label>
            <Textarea
              {...register('description')}
              placeholder="Please provide details about the incident. This will help camera owners understand what to look for in their footage."
              rows={4}
              className="resize-none"
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Date & Time */}
          <div>
            <Label htmlFor="incidentDateTime" className="text-sm font-medium mb-2 block">
              When did this happen? <span className="text-red-500">*</span>
            </Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-gray-400" />
                <Input
                  type="datetime-local"
                  {...register('incidentDateTime')}
                  className="flex-1"
                  max={new Date().toISOString().slice(0, 16)} // Prevent future dates
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    const now = new Date()
                    setValue('incidentDateTime', now)
                  }}
                >
                  Now
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
                    setValue('incidentDateTime', oneHourAgo)
                  }}
                >
                  1 Hour Ago
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    const today = new Date()
                    today.setHours(9, 0, 0, 0) // 9 AM today
                    setValue('incidentDateTime', today)
                  }}
                >
                  This Morning
                </Button>
              </div>
            </div>
            {errors.incidentDateTime && (
              <p className="text-red-500 text-sm mt-1">{errors.incidentDateTime.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Select the approximate time the incident occurred
            </p>
          </div>

          {/* Request Radius */}
          <div>
            <Label htmlFor="requestRadius" className="text-sm font-medium mb-2 block">
              Search radius: {selectedRadius}m
            </Label>
            <div className="px-3">
              <input
                type="range"
                min="50"
                max="500"
                step="25"
                {...register('requestRadius', { valueAsNumber: true })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>50m</span>
                <span>250m</span>
                <span>500m</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Camera owners within this radius will be notified of your request
            </p>
            {errors.requestRadius && (
              <p className="text-red-500 text-sm mt-1">{errors.requestRadius.message}</p>
            )}
          </div>

          {/* Privacy Notice */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              🔒 Privacy & Sharing
            </h4>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Only camera owners can choose to share footage</li>
              <li>• Your location is slightly randomized for privacy</li>
              <li>• All footage sharing is voluntary and secure</li>
            </ul>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!isValid || isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? 'Submitting...' : 'Request Footage'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
