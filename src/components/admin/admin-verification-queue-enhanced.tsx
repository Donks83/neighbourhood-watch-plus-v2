'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { 
  Check, 
  X, 
  AlertCircle, 
  Eye, 
  Clock, 
  MapPin, 
  User,
  RefreshCw,
  MessageSquare,
  CheckSquare,
  Square,
  Filter,
  ChevronDown,
  ChevronUp,
  Camera as CameraIcon,
  Mail,
  Calendar,
  Home,
  Ruler
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import VerificationStatusBadge, { VerificationPriorityBadge } from './verification-status-badge'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import type { 
  VerificationQueueItem, 
  VerificationStats,
  RejectionReason,
  VerificationStatus
} from '@/types/verification'

interface AdminVerificationQueueEnhancedProps {
  className?: string
}

interface ReviewingItem {
  id: string
  action: 'approve' | 'reject'
  notes?: string
  rejectionReason?: RejectionReason
  customReason?: string
}

const rejectionReasons: { value: RejectionReason; label: string; description: string }[] = [
  {
    value: 'invalid_location',
    label: 'Invalid Location',
    description: 'Camera location does not match registered address'
  },
  {
    value: 'fake_camera',
    label: 'Not a Real Camera',
    description: 'Submitted item is not a functioning security camera'
  },
  {
    value: 'policy_violation',
    label: 'Policy Violation',
    description: 'Camera setup violates community guidelines'
  },
  {
    value: 'insufficient_evidence',
    label: 'Insufficient Evidence',
    description: 'Not enough photos or documentation provided'
  },
  {
    value: 'privacy_concerns',
    label: 'Privacy Issues',
    description: 'Camera may violate neighbor privacy rights'
  },
  {
    value: 'duplicate_camera',
    label: 'Duplicate Registration',
    description: 'This camera appears to be already registered'
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Custom reason (please specify)'
  }
]

export default function AdminVerificationQueueEnhanced({ className }: AdminVerificationQueueEnhancedProps) {
  const { user, userProfile } = useAuth()
  const [queueItems, setQueueItems] = useState<VerificationQueueItem[]>([])
  const [stats, setStats] = useState<VerificationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFilters, setSelectedFilters] = useState<{
    status: VerificationStatus | 'all'
    priority: 'all' | 'urgent' | 'high' | 'normal' | 'low'
    timeframe: 'all' | '24h' | '7d' | '30d'
  }>({
    status: 'pending',
    priority: 'all', 
    timeframe: 'all'
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [reviewing, setReviewing] = useState<ReviewingItem | null>(null)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  
  // Load verification queue and stats
  const loadVerificationData = useCallback(async () => {
    if (!user) return
    
    try {
      setLoading(true)
      setError(null)
      
      const { getPendingVerifications, getVerificationStats } = await import('@/lib/admin')
      
      const [queueData, statsData] = await Promise.all([
        getPendingVerifications(user.uid, 100),
        getVerificationStats()
      ])
      
      setQueueItems(queueData)
      setStats(statsData)
    } catch (err: any) {
      console.error('Error loading verification data:', err)
      setError(err.message || 'Failed to load verification data')
    } finally {
      setLoading(false)
    }
  }, [user])
  
  useEffect(() => {
    loadVerificationData()
    const interval = setInterval(loadVerificationData, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [loadVerificationData])
  
  // Filter and search queue items
  const filteredItems = queueItems.filter(item => {
    // Status filter
    if (selectedFilters.status !== 'all' && item.status !== selectedFilters.status) {
      return false
    }
    
    // Priority filter
    if (selectedFilters.priority !== 'all' && item.priority !== selectedFilters.priority) {
      return false
    }
    
    // Timeframe filter
    if (selectedFilters.timeframe !== 'all') {
      const now = new Date()
      const submittedDate = item.submittedAt.toDate()
      const hoursDiff = (now.getTime() - submittedDate.getTime()) / (1000 * 60 * 60)
      
      switch (selectedFilters.timeframe) {
        case '24h':
          if (hoursDiff > 24) return false
          break
        case '7d':
          if (hoursDiff > 24 * 7) return false
          break
        case '30d':
          if (hoursDiff > 24 * 30) return false
          break
      }
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        item.cameraDetails.name.toLowerCase().includes(query) ||
        item.userName.toLowerCase().includes(query) ||
        item.userEmail.toLowerCase().includes(query) ||
        item.location.city?.toLowerCase().includes(query) ||
        item.location.postcode?.toLowerCase().includes(query)
      )
    }
    
    return true
  })
  
  // Sort by priority and date
  const sortedItems = filteredItems.sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 }
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
    
    if (priorityDiff !== 0) return priorityDiff
    return a.submittedAt.toMillis() - b.submittedAt.toMillis()
  })
  
  // Handle approval
  const handleApprove = useCallback(async (item: VerificationQueueItem, notes?: string) => {
    if (!user) return
    
    try {
      setProcessingIds(prev => new Set(prev).add(item.cameraId))
      
      const { approveCameraVerification } = await import('@/lib/admin')
      
      await approveCameraVerification(
        item.cameraId,
        user.uid,
        notes,
        'Camera verified by admin'
      )
      
      setQueueItems(prev => prev.filter(i => i.cameraId !== item.cameraId))
      setReviewing(null)
      setExpandedItem(null)
      loadVerificationData()
    } catch (err: any) {
      console.error('Error approving camera:', err)
      setError(err.message || 'Failed to approve camera')
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(item.cameraId)
        return newSet
      })
    }
  }, [user, loadVerificationData])
  
  // Handle rejection
  const handleReject = useCallback(async (
    item: VerificationQueueItem, 
    reason: RejectionReason,
    customReason?: string,
    notes?: string
  ) => {
    if (!user) return
    
    try {
      setProcessingIds(prev => new Set(prev).add(item.cameraId))
      
      const { rejectCameraVerification } = await import('@/lib/admin')
      
      await rejectCameraVerification(
        item.cameraId,
        user.uid,
        reason,
        customReason,
        notes,
        'Camera verification rejected by admin'
      )
      
      setQueueItems(prev => prev.filter(i => i.cameraId !== item.cameraId))
      setReviewing(null)
      setExpandedItem(null)
      loadVerificationData()
    } catch (err: any) {
      console.error('Error rejecting camera:', err)
      setError(err.message || 'Failed to reject camera')
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(item.cameraId)
        return newSet
      })
    }
  }, [user, loadVerificationData])
  
  // Bulk approve
  const handleBulkApprove = useCallback(async () => {
    if (!user || selectedItems.size === 0) return
    
    const itemsToApprove = sortedItems.filter(item => selectedItems.has(item.cameraId))
    
    for (const item of itemsToApprove) {
      await handleApprove(item, 'Bulk approved by admin')
    }
    
    setSelectedItems(new Set())
  }, [user, selectedItems, sortedItems, handleApprove])
  
  // Toggle selection
  const toggleSelect = (cameraId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(cameraId)) {
        newSet.delete(cameraId)
      } else {
        newSet.add(cameraId)
      }
      return newSet
    })
  }
  
  // Select all
  const toggleSelectAll = () => {
    if (selectedItems.size === sortedItems.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(sortedItems.map(item => item.cameraId)))
    }
  }
  
  if (loading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-gray-600">Loading verification queue...</p>
          </div>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className={cn('space-y-6', className)}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadVerificationData}
              className="ml-4"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }
  
  return (
    <div className={cn('space-y-6', className)}>
      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-amber-600">{stats.totalPending}</div>
              <div className="text-sm text-gray-600">Pending Review</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.totalApproved}</div>
              <div className="text-sm text-gray-600">Approved</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.totalRejected}</div>
              <div className="text-sm text-gray-600">Rejected</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">
                {stats.averageProcessingTime.toFixed(1)}h
              </div>
              <div className="text-sm text-gray-600">Avg Processing</div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex-1 flex gap-2">
              <Input
                type="text"
                placeholder="Search by name, email, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
            
            <div className="flex gap-2">
              {selectedItems.size > 0 && (
                <Button
                  onClick={handleBulkApprove}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4" />
                  Approve Selected ({selectedItems.size})
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={loadVerificationData}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </div>
          
          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs mb-2 block">Status</Label>
                <select
                  value={selectedFilters.status}
                  onChange={(e) => setSelectedFilters(prev => ({
                    ...prev,
                    status: e.target.value as any
                  }))}
                  className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              
              <div>
                <Label className="text-xs mb-2 block">Priority</Label>
                <select
                  value={selectedFilters.priority}
                  onChange={(e) => setSelectedFilters(prev => ({
                    ...prev,
                    priority: e.target.value as any
                  }))}
                  className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md"
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                </select>
              </div>
              
              <div>
                <Label className="text-xs mb-2 block">Timeframe</Label>
                <select
                  value={selectedFilters.timeframe}
                  onChange={(e) => setSelectedFilters(prev => ({
                    ...prev,
                    timeframe: e.target.value as any
                  }))}
                  className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md"
                >
                  <option value="all">All Time</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                </select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Results Summary */}
      {sortedItems.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <Checkbox
              checked={selectedItems.size === sortedItems.length && sortedItems.length > 0}
              onCheckedChange={toggleSelectAll}
            />
            <span>
              Showing {sortedItems.length} of {queueItems.length} cameras
              {selectedItems.size > 0 && ` • ${selectedItems.size} selected`}
            </span>
          </div>
        </div>
      )}
      
      {/* Queue Items */}
      <div className="space-y-4">
        {sortedItems.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No items in queue</h3>
              <p className="text-gray-600">
                {queueItems.length === 0 
                  ? "No camera verifications pending."
                  : "No items match the current filters."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          sortedItems.map((item) => {
            const isExpanded = expandedItem === item.cameraId
            const isSelected = selectedItems.has(item.cameraId)
            const isProcessing = processingIds.has(item.cameraId)
            
            return (
              <Card 
                key={item.cameraId} 
                className={cn(
                  "overflow-hidden transition-all",
                  isSelected && "ring-2 ring-blue-500",
                  isProcessing && "opacity-50 pointer-events-none"
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelect(item.cameraId)}
                      className="mt-1"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{item.cameraDetails.name}</h3>
                        <VerificationStatusBadge status={item.status} />
                        <VerificationPriorityBadge priority={item.priority} />
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{item.userName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{item.userEmail}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 flex-shrink-0" />
                          <span>{item.daysPending} days pending</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{item.location.city}, {item.location.postcode}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={isExpanded ? "outline" : "default"}
                        onClick={() => setExpandedItem(isExpanded ? null : item.cameraId)}
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-1" />
                            Collapse
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-1" />
                            Review
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                {isExpanded && (
                  <CardContent className="pt-0 border-t">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                      {/* Left Column: Camera Details */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-3">Camera Information</h4>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <Label className="text-xs text-gray-600">Type</Label>
                              <p className="font-medium capitalize">{item.cameraDetails.type}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-600">Brand/Model</Label>
                              <p className="font-medium">
                                {item.cameraDetails.brand || 'N/A'} {item.cameraDetails.model || ''}
                              </p>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-600">Resolution</Label>
                              <p className="font-medium">{item.cameraDetails.resolution || 'Unknown'}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-600">Night Vision</Label>
                              <p className="font-medium">{item.cameraDetails.nightVision ? 'Yes ✓' : 'No'}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-600">View Distance</Label>
                              <p className="font-medium">{item.cameraDetails.viewDistance ? `${item.cameraDetails.viewDistance}m` : 'Unknown'}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-600">Submitted</Label>
                              <p className="font-medium">{item.submittedAt.toDate().toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-3">Location Details</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-start gap-2">
                              <Home className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-600" />
                              <div>
                                {item.location.street && <p className="font-medium">{item.location.street}</p>}
                                <p className="text-gray-600">{item.location.city}, {item.location.postcode}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Quick Actions */}
                        <div className="pt-4 border-t space-y-3">
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleApprove(item)}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              disabled={isProcessing}
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Quick Approve
                            </Button>
                            <Button
                              onClick={() => setReviewing({ id: item.cameraId, action: 'reject' })}
                              variant="destructive"
                              className="flex-1"
                              disabled={isProcessing}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                          
                          {/* Rejection Form */}
                          {reviewing?.id === item.cameraId && reviewing.action === 'reject' && (
                            <div className="space-y-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200">
                              <Label className="text-sm font-medium">Rejection Reason</Label>
                              <select
                                value={reviewing.rejectionReason || ''}
                                onChange={(e) => setReviewing(prev => prev ? {
                                  ...prev,
                                  rejectionReason: e.target.value as RejectionReason
                                } : null)}
                                className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md"
                              >
                                <option value="">Select reason...</option>
                                {rejectionReasons.map(reason => (
                                  <option key={reason.value} value={reason.value}>
                                    {reason.label}
                                  </option>
                                ))}
                              </select>
                              
                              {reviewing.rejectionReason === 'other' && (
                                <Textarea
                                  placeholder="Please specify the reason..."
                                  value={reviewing.customReason || ''}
                                  onChange={(e) => setReviewing(prev => prev ? {
                                    ...prev,
                                    customReason: e.target.value
                                  } : null)}
                                  rows={3}
                                />
                              )}
                              
                              <Textarea
                                placeholder="Additional notes (optional)..."
                                value={reviewing.notes || ''}
                                onChange={(e) => setReviewing(prev => prev ? {
                                  ...prev,
                                  notes: e.target.value
                                } : null)}
                                rows={2}
                              />
                              
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => setReviewing(null)}
                                  className="flex-1"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => {
                                    if (reviewing.rejectionReason) {
                                      handleReject(
                                        item,
                                        reviewing.rejectionReason,
                                        reviewing.customReason,
                                        reviewing.notes
                                      )
                                    }
                                  }}
                                  disabled={!reviewing.rejectionReason}
                                  className="flex-1"
                                >
                                  Confirm Rejection
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Right Column: Evidence & Notes */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-3">Verification Evidence</h4>
                          {item.evidence.photos && item.evidence.photos.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                              {item.evidence.photos.map((photo, idx) => (
                                <div key={idx} className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                                  <img 
                                    src={photo} 
                                    alt={`Evidence ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-600 p-4 bg-gray-50 rounded-lg">
                              No photos provided
                            </div>
                          )}
                        </div>
                        
                        {item.evidence.userNotes && (
                          <div>
                            <h4 className="font-medium mb-2">User Notes</h4>
                            <div className="text-sm text-gray-700 p-3 bg-gray-50 rounded-lg">
                              {item.evidence.userNotes}
                            </div>
                          </div>
                        )}
                        
                        <div>
                          <h4 className="font-medium mb-2">Location Address</h4>
                          <div className="text-sm space-y-1">
                            {item.location.street && <p className="text-gray-700">{item.location.street}</p>}
                            <p className="text-gray-700">
                              {item.location.city}, {item.location.postcode}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

