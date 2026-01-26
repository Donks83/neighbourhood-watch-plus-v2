'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CalendarIcon, MapPinIcon, AlertTriangleIcon, XIcon, ShieldAlertIcon, RefreshCwIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { Location, IncidentFormData } from '@/types'
import { formatCoordinates, cn } from '@/lib/utils'
import { checkRateLimit, incrementRequestCount, type RateLimitStatus } from '@/lib/rate-limiting'
import { useAuth } from '@/contexts/auth-context'

// Generate incident reference number
const generateReferenceNumber = (): string => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `INC-${timestamp}-${random}`
}

const incidentSchema = z.object({
  referenceNumber: z.string().optional(),
  incidentType: z.enum(['vehicle_accident', 'theft', 'vandalism', 'suspicious_activity', 'other']),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  incidentDateTime: z.string(),
  requestRadius: z.number().min(30).max(100, 'Radius must be between 30m and 100m'),
})

const INCIDENT_TYPES = [
  { value: 'vehicle_accident', label: '🚗 Vehicle Accident', description: 'Car crashes, collisions, or traffic incidents' },
  { value: 'theft', label: '🔓 Theft', description: 'Stolen property, burglary, or break-ins' },
  { value: 'vandalism', label: '🏠 Vandalism', description: 'Property damage or graffiti' },
  { value: 'suspicious_activity', label: '👀 Suspicious Activity', description: 'Unusual or concerning behavior' },
  { value: 'other', label: '❓ Other', description: 'Other incidents requiring footage' },
] as const

interface IncidentReportPanelProps {
  isOpen: boolean
  onClose: () => void
  location: Location
  onSubmit: (data: IncidentFormData) => Promise<void>
  onRadiusChange?: (radius: number) => void
  isSubmitting?: boolean
}

export default function IncidentReportPanel({
  isOpen,
  onClose,
  location,
  onSubmit,
  onRadiusChange,
  isSubmitting = false
}: IncidentReportPanelProps) {
  const { user } = useAuth()
  const [rateLimitStatus, setRateLimitStatus] = useState<RateLimitStatus | null>(null)
  const [isCheckingLimit, setIsCheckingLimit] = useState(false)
  
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
      incidentDateTime: new Date().toISOString(), // FIX: Use ISO string instead of Date object
      requestRadius: 50, // Default 50m - good middle ground
    },
    mode: 'onChange'
  })

  const selectedRadius = watch('requestRadius')
  
  // Check rate limit when panel opens
  useEffect(() => {
    async function loadRateLimit() {
      if (!user || !isOpen) {
        setRateLimitStatus(null)
        return
      }
      
      setIsCheckingLimit(true)
      try {
        const status = await checkRateLimit(user.uid)
        setRateLimitStatus(status)
        console.log('📊 Rate limit status:', status)
      } catch (error) {
        console.error('Error checking rate limit:', error)
      } finally {
        setIsCheckingLimit(false)
      }
    }
    
    loadRateLimit()
  }, [user, isOpen])

  // Update map radius in real-time as user drags slider
  React.useEffect(() => {
    if (onRadiusChange && selectedRadius) {
      onRadiusChange(selectedRadius)
    }
  }, [selectedRadius, onRadiusChange])

  const handleFormSubmit = async (data: IncidentFormData) => {
    if (!user) return
    
    let requestCreated = false
    
    try {
      // Check rate limit before submission
      const limitCheck = await checkRateLimit(user.uid)
      
      if (!limitCheck.allowed) {
        alert(limitCheck.message || 'Weekly request limit reached. Please try again after the reset date.')
        return
      }
      
      // Submit the request
      await onSubmit({
        ...data,
        requestRadius: Number(data.requestRadius)
      })
      
      // Mark as successfully created
      requestCreated = true
      
      // Increment rate limit counter ONLY after successful submission
      await incrementRequestCount(user.uid)
      
      // Update local rate limit status
      const newStatus = await checkRateLimit(user.uid)
      setRateLimitStatus(newStatus)
      
      console.log('✅ Request submitted and rate limit updated')
      
      reset()
      onClose()
    } catch (error) {
      console.error('❌ Error submitting incident report:', error)
      
      // Only show alert if request was not created
      if (!requestCreated) {
        alert('❌ Failed to submit footage request. Please try again.')
      } else {
        // Request was created but rate limit update failed - this is less critical
        console.warn('⚠️ Request created but rate limit update failed')
        alert('⚠️ Request submitted but there was an issue updating your rate limit. Please contact support if this persists.')
      }
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <>
      {/* Slide-out Panel */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full z-[1100] transition-transform duration-300 ease-in-out',
          'w-96 bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-700',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-red-950">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
              <AlertTriangleIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Report Incident</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Request footage from nearby cameras</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="w-8 h-8 hover:bg-red-100 dark:hover:bg-red-900"
          >
            <XIcon className="w-4 h-4" />
          </Button>
        </div>

        {/* Rate Limit Indicator */}
        {rateLimitStatus && (
          <div className={cn(
            'px-4 py-3 border-b border-gray-200 dark:border-gray-700',
            rateLimitStatus.remaining === 0 
              ? 'bg-red-50 dark:bg-red-950' 
              : rateLimitStatus.remaining === 1 
              ? 'bg-yellow-50 dark:bg-yellow-950'
              : 'bg-blue-50 dark:bg-blue-950'
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlertIcon className={cn(
                  'w-4 h-4',
                  rateLimitStatus.remaining === 0 
                    ? 'text-red-600 dark:text-red-400' 
                    : rateLimitStatus.remaining === 1
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-blue-600 dark:text-blue-400'
                )} />
                <span className={cn(
                  'text-sm font-medium',
                  rateLimitStatus.remaining === 0 
                    ? 'text-red-900 dark:text-red-100' 
                    : rateLimitStatus.remaining === 1
                    ? 'text-yellow-900 dark:text-yellow-100'
                    : 'text-blue-900 dark:text-blue-100'
                )}>
                  {rateLimitStatus.remaining === 0 
                    ? 'Weekly limit reached' 
                    : `${rateLimitStatus.remaining} request${rateLimitStatus.remaining === 1 ? '' : 's'} remaining`
                  }
                </span>
              </div>
              <span className={cn(
                'text-xs',
                rateLimitStatus.remaining === 0 
                  ? 'text-red-700 dark:text-red-300' 
                  : 'text-gray-600 dark:text-gray-400'
              )}>
                {rateLimitStatus.remaining === 0 
                  ? `Resets ${rateLimitStatus.resetDate.toLocaleDateString()}`
                  : `${rateLimitStatus.limit}/week`
                }
              </span>
            </div>
          </div>
        )}

        {/* Panel Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 pb-20">
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Location Display */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPinIcon className="w-4 h-4 text-gray-500" />
                <Label className="text-sm font-medium">Incident Location</Label>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {formatCoordinates(location.lat, location.lng)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Click a different location on the map to change
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

            {/* Reference Number (Optional) */}
            <div>
              <Label htmlFor="referenceNumber" className="text-sm font-medium mb-2 block">
                Incident Reference Number (Optional)
              </Label>
              <div className="flex gap-2">
                <Input
                  {...register('referenceNumber')}
                  placeholder="e.g., INC-1234567890-ABC123 or your own reference"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setValue('referenceNumber', generateReferenceNumber())}
                  className="flex items-center gap-1"
                >
                  <RefreshCwIcon className="w-3 h-3" />
                  Generate
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Auto-generate a unique reference or enter your own (e.g., police report number)
              </p>
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

            {/* Date & Time - Improved */}
            <div>
              <Label className="text-sm font-medium mb-3 block">
                When did this happen? <span className="text-red-500">*</span>
              </Label>
              
              {/* Quick Time Presets */}
              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-2">Quick options:</div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      const now = new Date()
                      setValue('incidentDateTime', now.toISOString())
                    }}
                  >
                    Just now
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
                      setValue('incidentDateTime', oneHourAgo.toISOString())
                    }}
                  >
                    1 hour ago
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      const thisMorning = new Date()
                      thisMorning.setHours(8, 0, 0, 0)
                      setValue('incidentDateTime', thisMorning.toISOString())
                    }}
                  >
                    This morning
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
                      yesterday.setHours(18, 0, 0, 0)
                      setValue('incidentDateTime', yesterday.toISOString())
                    }}
                  >
                    Yesterday evening
                  </Button>
                </div>
              </div>
              
              {/* Manual Date/Time Selection */}
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-gray-600 mb-1 block">Date</Label>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <Input
                      type="date"
                      value={watch('incidentDateTime') ? new Date(watch('incidentDateTime')).toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        const currentDateTime = watch('incidentDateTime')
                        const currentDate = currentDateTime ? new Date(currentDateTime) : new Date()
                        const newDate = new Date(e.target.value)
                        newDate.setHours(currentDate.getHours(), currentDate.getMinutes(), 0, 0)
                        setValue('incidentDateTime', newDate.toISOString())
                      }}
                      className="flex-1"
                      max={new Date().toISOString().split('T')[0]} // Can't select future dates
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs text-gray-600 mb-1 block">Time</Label>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 text-gray-400 flex-shrink-0 flex items-center justify-center text-xs">🕐</div>
                    <Input
                      type="time"
                      value={watch('incidentDateTime') ? new Date(watch('incidentDateTime')).toTimeString().slice(0, 5) : ''}
                      onChange={(e) => {
                        const currentDateTime = watch('incidentDateTime')
                        const currentDate = currentDateTime ? new Date(currentDateTime) : new Date()
                        const [hours, minutes] = e.target.value.split(':').map(Number)
                        currentDate.setHours(hours, minutes, 0, 0)
                        setValue('incidentDateTime', currentDate.toISOString())
                      }}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              
              {/* Current Selection Display */}
              <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                <span className="text-gray-500">Selected time: </span>
                <span className="font-medium">
                  {watch('incidentDateTime') ? 
                    new Date(watch('incidentDateTime')).toLocaleDateString('en-GB', {
                      weekday: 'short',
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Not selected'
                  }
                </span>
              </div>
              
              {errors.incidentDateTime && (
                <p className="text-red-500 text-sm mt-1">{errors.incidentDateTime.message}</p>
              )}
            </div>

            {/* Request Radius with Real-time Map Update */}
            <div>
              <Label htmlFor="requestRadius" className="text-sm font-medium mb-2 block">
                Search radius: <span className="font-bold text-blue-600">{selectedRadius}m</span>
              </Label>
              <div className="px-3">
                <input
                  type="range"
                  min="30"
                  max="100"
                  step="5"
                  {...register('requestRadius', { valueAsNumber: true })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>30m</span>
                  <span>65m</span>
                  <span>100m</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Camera owners within this radius will be notified. <strong>Watch the red circle on the map update as you drag!</strong>
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
                ℹ️ Premium users (companies, police) can request up to 500m radius
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
          </form>
        </div>

        {/* Panel Footer - Fixed at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
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
              onClick={handleSubmit(handleFormSubmit)}
              disabled={!isValid || isSubmitting || (rateLimitStatus?.allowed === false)}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
              title={rateLimitStatus?.allowed === false ? rateLimitStatus.message : undefined}
            >
              {isSubmitting 
                ? 'Submitting...' 
                : rateLimitStatus && !rateLimitStatus.allowed 
                ? 'Limit Reached' 
                : 'Request Footage'
              }
            </Button>
          </div>
        </div>
      </div>

      {/* Optional: Light backdrop that doesn't block interaction but provides visual separation */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/5 z-[1050] pointer-events-none"
          style={{ backdropFilter: 'blur(0.5px)' }}
        />
      )}
    </>
  )
}
