'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  CalendarIcon, 
  MapPinIcon, 
  AlertTriangleIcon, 
  XIcon,
  ShieldIcon,
  CrownIcon,
  EyeOffIcon,
  PoundSterlingIcon,
  ClockIcon,
  UsersIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import type { Location } from '@/types'
import type { UserRole, IncidentType, IncidentSeverity } from '@/types/premium/subscription'
import { formatCoordinates, cn } from '@/lib/utils'

// Enhanced schema for premium features
const enhancedIncidentSchema = z.object({
  // Basic incident data (existing)
  incidentType: z.enum(['criminal_activity', 'antisocial_behavior', 'property_damage', 'traffic_incident', 'suspicious_activity', 'emergency', 'other']),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  incidentDateTime: z.string(),
  requestRadius: z.number().min(50).max(2000, 'Radius must be between 50m and 2000m'),
  
  // Premium features
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  title: z.string().min(5, 'Title must be at least 5 characters').optional(),
  tags: z.array(z.string()).optional(),
  
  // Privacy controls
  visibleTo: z.array(z.enum(['community', 'police', 'insurance', 'security'])),
  anonymousReporting: z.boolean(),
  contactAllowed: z.boolean(),
  
  // Evidence request (premium users only)
  requestEvidence: z.boolean().optional(),
  legalBasis: z.string().optional(),
  urgency: z.enum(['routine', 'priority', 'urgent', 'emergency']).optional(),
  maxBudget: z.number().optional(),
})

const ENHANCED_INCIDENT_TYPES = [
  { 
    value: 'criminal_activity', 
    label: '🚨 Criminal Activity', 
    description: 'Break-ins, theft, assault, drug activity',
    severity: 'high',
    premiumReward: 75
  },
  { 
    value: 'antisocial_behavior', 
    label: '👥 Antisocial Behavior', 
    description: 'Noise, harassment, public disturbance',
    severity: 'medium',
    premiumReward: 25
  },
  { 
    value: 'property_damage', 
    label: '🏠 Property Damage', 
    description: 'Vandalism, graffiti, deliberate damage',
    severity: 'medium',
    premiumReward: 35
  },
  { 
    value: 'traffic_incident', 
    label: '🚗 Traffic Incident', 
    description: 'Accidents, dangerous driving, hit and run',
    severity: 'medium',
    premiumReward: 45
  },
  { 
    value: 'suspicious_activity', 
    label: '👀 Suspicious Activity', 
    description: 'Unusual behavior, potential threats',
    severity: 'low',
    premiumReward: 15
  },
  { 
    value: 'emergency', 
    label: '🚨 Emergency Situation', 
    description: 'Immediate danger, ongoing crime',
    severity: 'critical',
    premiumReward: 100
  },
  { 
    value: 'other', 
    label: '❓ Other Incident', 
    description: 'Other incidents requiring investigation',
    severity: 'low',
    premiumReward: 20
  },
] as const

const URGENCY_LEVELS = [
  { value: 'routine', label: 'Routine', cost: 0, time: '48-72 hours' },
  { value: 'priority', label: 'Priority', cost: 25, time: '24 hours' },
  { value: 'urgent', label: 'Urgent', cost: 75, time: '6 hours' },
  { value: 'emergency', label: 'Emergency', cost: 200, time: '1 hour' },
] as const

interface EnhancedIncidentFormData {
  incidentType: IncidentType
  description: string
  incidentDateTime: string
  requestRadius: number
  // Premium fields
  severity?: IncidentSeverity
  title?: string
  tags?: string[]
  visibleTo: UserRole[]
  anonymousReporting: boolean
  contactAllowed: boolean
  // Evidence request fields
  requestEvidence?: boolean
  legalBasis?: string
  urgency?: 'routine' | 'priority' | 'urgent' | 'emergency'
  maxBudget?: number
}

interface EnhancedIncidentReportPanelProps {
  isOpen: boolean
  onClose: () => void
  location: Location
  onSubmit: (data: EnhancedIncidentFormData) => Promise<void>
  onRadiusChange?: (radius: number) => void
  isSubmitting?: boolean
  // Premium features
  userRole: UserRole
  subscription?: {
    tier: string
    features: string[]
    limits: {
      monthlyRequests: number
      maxRadius: number
      requestsRemaining: number
    }
  }
}

export default function EnhancedIncidentReportPanel({
  isOpen,
  onClose,
  location,
  onSubmit,
  onRadiusChange,
  isSubmitting = false,
  userRole,
  subscription
}: EnhancedIncidentReportPanelProps) {
  const isPremiumUser = ['premium_business', 'police', 'admin', 'super_admin'].includes(userRole)
  const isCommunityUser = userRole === 'user' || userRole === 'business'
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid }
  } = useForm<EnhancedIncidentFormData>({
    resolver: zodResolver(enhancedIncidentSchema),
    defaultValues: {
      incidentType: 'other',
      description: '',
      incidentDateTime: new Date().toISOString().slice(0, 16),
      requestRadius: parseInt(process.env.NEXT_PUBLIC_DEFAULT_REQUEST_RADIUS || '200'),
      severity: 'medium',
      title: '',
      tags: [],
      visibleTo: isCommunityUser ? ['police'] : ['police', 'premium_business'],
      anonymousReporting: isCommunityUser, // Default to anonymous for community
      contactAllowed: !isCommunityUser, // Premium users allow contact by default
      requestEvidence: isPremiumUser,
      urgency: 'routine',
      maxBudget: 150
    },
    mode: 'onChange'
  })

  const selectedRadius = watch('requestRadius')
  const selectedType = watch('incidentType')
  const selectedUrgency = watch('urgency')
  const requestEvidence = watch('requestEvidence')
  const maxBudget = watch('maxBudget')

  // Calculate estimated evidence cost
  const selectedIncidentType = ENHANCED_INCIDENT_TYPES.find(t => t.value === selectedType)
  const selectedUrgencyLevel = URGENCY_LEVELS.find(u => u.value === selectedUrgency)
  const estimatedCameras = Math.min(15, Math.floor(selectedRadius / 50)) // Rough estimate
  const baseCost = (selectedIncidentType?.premiumReward || 20) * estimatedCameras * 0.6
  const urgencyCost = selectedUrgencyLevel?.cost || 0
  const totalEstimatedCost = baseCost + urgencyCost

  // Update map radius in real-time
  React.useEffect(() => {
    if (onRadiusChange && selectedRadius) {
      onRadiusChange(selectedRadius)
    }
  }, [selectedRadius, onRadiusChange])

  const handleFormSubmit = async (data: EnhancedIncidentFormData) => {
    try {
      await onSubmit({
        ...data,
        requestRadius: Number(data.requestRadius)
      })
      reset()
      onClose()
    } catch (error) {
      console.error('Error submitting enhanced incident report:', error)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <>
      {/* Enhanced Slide-out Panel */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full z-[1100] transition-transform duration-300 ease-in-out',
          'w-[480px] bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-700',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Enhanced Header with Role Indicator */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
              <AlertTriangleIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {isPremiumUser ? 'Evidence Request' : 'Report Incident'}
                </h2>
                {isPremiumUser && (
                  <Badge variant="outline" className="text-xs">
                    <CrownIcon className="w-3 h-3 mr-1" />
                    {userRole.toUpperCase()}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isPremiumUser 
                  ? 'Request evidence from community cameras' 
                  : 'Report to help community safety'
                }
              </p>
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 pb-24">
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            
            {/* Location Display */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPinIcon className="w-4 h-4 text-gray-500" />
                <Label className="text-sm font-medium">Location</Label>
                {isCommunityUser && (
                  <Badge variant="outline" className="text-xs">
                    <EyeOffIcon className="w-3 h-3 mr-1" />
                    Privacy Protected
                  </Badge>
                )}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {formatCoordinates(location.lat, location.lng)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {isCommunityUser 
                  ? '⚡ Your exact location is hidden from community view'
                  : '📍 Premium users see exact location for accurate targeting'
                }
              </div>
            </div>

            {/* Premium Title Field */}
            {isPremiumUser && (
              <div>
                <Label htmlFor="title" className="text-sm font-medium mb-2 block">
                  Case/Investigation Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  {...register('title')}
                  placeholder="Brief case title or reference number"
                  className="w-full"
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                )}
              </div>
            )}

            {/* Enhanced Incident Type Selection */}
            <div>
              <Label className="text-sm font-medium mb-3 block">
                What happened? <span className="text-red-500">*</span>
              </Label>
              <div className="space-y-2">
                {ENHANCED_INCIDENT_TYPES.map((type) => (
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
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm">{type.label}</div>
                        {isPremiumUser && (
                          <Badge variant="secondary" className="text-xs">
                            <PoundSterlingIcon className="w-3 h-3 mr-1" />
                            {type.premiumReward}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-sm font-medium mb-2 block">
                Detailed Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                {...register('description')}
                placeholder={isPremiumUser 
                  ? "Provide detailed description for evidence collection. Include specific details that will help camera owners identify relevant footage."
                  : "Please provide details about the incident. This helps camera owners understand what to look for."
                }
                rows={4}
                className="resize-none"
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Enhanced Date & Time */}
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
                      setValue('incidentDateTime', now.toISOString().slice(0, 16))
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
                      setValue('incidentDateTime', oneHourAgo.toISOString().slice(0, 16))
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
                      setValue('incidentDateTime', thisMorning.toISOString().slice(0, 16))
                    }}
                  >
                    This morning
                  </Button>
                </div>
              </div>
              
              {/* Manual Date/Time Selection */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-600 mb-1 block">Date</Label>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <Input
                        type="date"
                        value={watch('incidentDateTime')?.slice(0, 10) || ''}
                        onChange={(e) => {
                          const currentDateTime = watch('incidentDateTime') || new Date().toISOString().slice(0, 16)
                          const currentTime = currentDateTime.slice(11, 16)
                          setValue('incidentDateTime', `${e.target.value}T${currentTime}`)
                        }}
                        className="flex-1"
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs text-gray-600 mb-1 block">Time</Label>
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <Input
                        type="time"
                        value={watch('incidentDateTime')?.slice(11, 16) || ''}
                        onChange={(e) => {
                          const currentDateTime = watch('incidentDateTime') || new Date().toISOString().slice(0, 16)
                          const currentDate = currentDateTime.slice(0, 10)
                          setValue('incidentDateTime', `${currentDate}T${e.target.value}`)
                        }}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Radius with Premium Limits */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Search radius: <span className="font-bold text-blue-600">{selectedRadius}m</span>
                {isPremiumUser && subscription && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    Max: {subscription.limits.maxRadius}m
                  </Badge>
                )}
              </Label>
              <div className="px-3">
                <input
                  type="range"
                  min="50"
                  max={isPremiumUser ? (subscription?.limits.maxRadius || 2000) : 500}
                  step="25"
                  {...register('requestRadius', { valueAsNumber: true })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>50m</span>
                  <span>{Math.floor((isPremiumUser ? (subscription?.limits.maxRadius || 2000) : 500) / 2)}m</span>
                  <span>{isPremiumUser ? (subscription?.limits.maxRadius || 2000) : 500}m</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {isCommunityUser 
                  ? 'Camera owners within this radius will be notified privately'
                  : `Estimated ${estimatedCameras} cameras in range. Larger radius = more potential evidence sources.`
                }
              </p>
            </div>

            {/* Premium Evidence Request Section */}
            {isPremiumUser && (
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-sm font-medium">Request Evidence Collection</Label>
                  <Switch
                    checked={requestEvidence}
                    onCheckedChange={(checked) => setValue('requestEvidence', checked)}
                  />
                </div>

                {requestEvidence && (
                  <div className="space-y-4 bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
                    
                    {/* Urgency Level */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Response Urgency</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {URGENCY_LEVELS.map((level) => (
                          <label
                            key={level.value}
                            className="flex items-center gap-2 p-2 rounded border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-white dark:hover:bg-gray-800 transition-colors"
                          >
                            <input
                              type="radio"
                              value={level.value}
                              {...register('urgency')}
                            />
                            <div className="flex-1">
                              <div className="font-medium text-xs">{level.label}</div>
                              <div className="text-xs text-gray-500">
                                {level.time} (+£{level.cost})
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Budget Allocation */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        Maximum Budget: £{maxBudget}
                      </Label>
                      <Slider
                        value={[maxBudget || 150]}
                        onValueChange={(value) => setValue('maxBudget', value[0])}
                        max={subscription?.limits.monthlyRequests ? subscription.limits.monthlyRequests * 10 : 1000}
                        min={50}
                        step={25}
                        className="w-full"
                      />
                      <div className="text-xs text-gray-500 mt-2">
                        Estimated cost: £{totalEstimatedCost.toFixed(0)} 
                        ({estimatedCameras} cameras × £{selectedIncidentType?.premiumReward || 20} + urgency fee)
                      </div>
                    </div>

                    {/* Legal Basis */}
                    <div>
                      <Label htmlFor="legalBasis" className="text-sm font-medium mb-2 block">
                        Legal Basis for Request
                      </Label>
                      <Textarea
                        {...register('legalBasis')}
                        placeholder="e.g., Criminal investigation under PACE 1984, Insurance claim validation, etc."
                        rows={2}
                        className="resize-none"
                      />
                    </div>

                    {/* Usage Tracking */}
                    {subscription && (
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Requests remaining this month:</span>
                        <span className="font-medium">
                          {subscription.limits.requestsRemaining}/{subscription.limits.monthlyRequests}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Privacy Controls */}
            <div className="border-t pt-6">
              <Label className="text-sm font-medium mb-4 block">
                <ShieldIcon className="w-4 h-4 inline mr-2" />
                Privacy & Sharing Controls
              </Label>

              {/* Visibility Controls */}
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-gray-600 mb-2 block">Who can see this report?</Label>
                  <div className="space-y-2">
                    {(['police', 'insurance', 'security', 'community'] as UserRole[]).map((role) => (
                      <label key={role} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          value={role}
                          checked={watch('visibleTo')?.includes(role) || false}
                          onChange={(e) => {
                            const current = watch('visibleTo') || []
                            if (e.target.checked) {
                              setValue('visibleTo', [...current, role])
                            } else {
                              setValue('visibleTo', current.filter(r => r !== role))
                            }
                          }}
                          className="rounded"
                        />
                        <span className="capitalize">{role === 'community' ? 'Community (anonymized)' : role}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Anonymous Reporting Toggle */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label className="text-sm font-medium">Anonymous Reporting</Label>
                    <p className="text-xs text-gray-500">Hide your identity from all reports</p>
                  </div>
                  <Switch
                    checked={watch('anonymousReporting')}
                    onCheckedChange={(checked) => setValue('anonymousReporting', checked)}
                  />
                </div>

                {/* Contact Permission Toggle */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label className="text-sm font-medium">Allow Follow-up Contact</Label>
                    <p className="text-xs text-gray-500">Permit authorities to contact you for more information</p>
                  </div>
                  <Switch
                    checked={watch('contactAllowed')}
                    onCheckedChange={(checked) => setValue('contactAllowed', checked)}
                  />
                </div>
              </div>
            </div>

            {/* Enhanced Privacy Notice */}
            <div className={cn(
              "border rounded-lg p-4",
              isCommunityUser 
                ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                : "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
            )}>
              <h4 className={cn(
                "text-sm font-medium mb-2",
                isCommunityUser ? "text-green-900 dark:text-green-100" : "text-blue-900 dark:text-blue-100"
              )}>
                {isCommunityUser ? '🔒 Community Privacy Protection' : '⚖️ Premium Evidence Collection'}
              </h4>
              <ul className={cn(
                "text-xs space-y-1",
                isCommunityUser ? "text-green-800 dark:text-green-200" : "text-blue-800 dark:text-blue-200"
              )}>
                {isCommunityUser ? (
                  <>
                    <li>• Your exact location is hidden from community view (±25m privacy zone)</li>
                    <li>• Camera owners can choose whether to share footage</li>
                    <li>• All footage sharing is voluntary and secure</li>
                    <li>• Potential earnings: £{selectedIncidentType?.premiumReward || 20} if evidence helps case</li>
                  </>
                ) : (
                  <>
                    <li>• Evidence requests sent to verified cameras in exact radius</li>
                    <li>• Legal chain of custody maintained for all evidence</li>
                    <li>• Camera owners remain anonymous in legal proceedings</li>
                    <li>• Estimated response time: {selectedUrgencyLevel?.time || '48-72 hours'}</li>
                  </>
                )}
              </ul>
            </div>
          </form>
        </div>

        {/* Enhanced Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          {/* Cost Summary for Premium Users */}
          {isPremiumUser && requestEvidence && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex justify-between items-center text-sm">
                <span>Estimated total cost:</span>
                <span className="font-bold text-lg">£{totalEstimatedCost.toFixed(0)}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {estimatedCameras} cameras × £{selectedIncidentType?.premiumReward || 20} + £{urgencyCost} urgency fee
              </div>
            </div>
          )}

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
              disabled={!isValid || isSubmitting}
              className={cn(
                "flex-1 text-white",
                isPremiumUser 
                  ? "bg-blue-600 hover:bg-blue-700" 
                  : "bg-red-600 hover:bg-red-700"
              )}
            >
              {isSubmitting ? 'Submitting...' : (
                isPremiumUser ? 'Request Evidence' : 'Report Incident'
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/10 z-[1050] pointer-events-none"
          style={{ backdropFilter: 'blur(1px)' }}
        />
      )}
    </>
  )
}
