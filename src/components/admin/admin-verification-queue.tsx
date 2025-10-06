'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  Check, 
  X, 
  AlertCircle, 
  Eye, 
  Clock, 
  MapPin, 
  User,
  RefreshCw,
  MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import VerificationStatusBadge, { VerificationPriorityBadge } from './verification-status-badge'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import type { 
  VerificationQueueItem, 
  VerificationStats,
  RejectionReason,
  VerificationStatus
} from '@/types/verification'

interface AdminVerificationQueueProps {
  className?: string
}

interface ReviewingItem {
  id: string
  action: 'approve' | 'reject' | 'request_info'
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

export default function AdminVerificationQueue({ className }: AdminVerificationQueueProps) {
  const { user } = useAuth()
  const [queueItems, setQueueItems] = useState<VerificationQueueItem[]>([])
  const [stats, setStats] = useState<VerificationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFilters, setSelectedFilters] = useState<{
    status: VerificationStatus | 'all'
    priority: 'all' | 'urgent' | 'high' | 'normal' | 'low'
    timeframe: 'all' | '24h' | '7d' | '30d'
  }>({
    status: 'all',
    priority: 'all', 
    timeframe: 'all'
  })
  const [reviewing, setReviewing] = useState<ReviewingItem | null>(null)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
  
  // Load verification queue and stats
  const loadVerificationData = useCallback(async () => {
    if (!user) return
    
    try {
      setLoading(true)
      setError(null)
      console.log('Loading verification data for admin:', user.uid)
      
      // Import admin functions dynamically
      const { getPendingVerifications, getVerificationStats, hasPermission } = await import('@/lib/admin')
      
      // Check permissions
      const canVerify = await hasPermission(user.uid, 'canVerifyCameras')
      console.log('Can verify cameras:', canVerify)
      
      if (!canVerify) {
        setError('You do not have permission to view verification queue')
        return
      }
      
      // Load data in parallel
      const [queueData, statsData] = await Promise.all([
        getPendingVerifications(user.uid, 50),
        getVerificationStats()
      ])
      
      console.log('Loaded queue items:', queueData.length)
      console.log('Loaded stats:', statsData)
      
      setQueueItems(queueData)
      setStats(statsData)
    } catch (err: any) {
      console.error('Error loading verification data:', err)
      setError(err.message || 'Failed to load verification data')
    } finally {
      setLoading(false)
    }
  }, [user])
  
  // Load data on mount and setup refresh interval
  useEffect(() => {
    loadVerificationData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadVerificationData, 30000)
    return () => clearInterval(interval)
  }, [loadVerificationData])
  
  // Filter queue items based on selected filters
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
    
    return true
  })
  
  // Sort by priority and date
  const sortedItems = filteredItems.sort((a, b) => {
    // Priority order: urgent > high > normal > low
    const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 }
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
    
    if (priorityDiff !== 0) return priorityDiff
    
    // If same priority, sort by submission date (oldest first)
    return a.submittedAt.toMillis() - b.submittedAt.toMillis()
  })
  
  // Handle approval
  const handleApprove = useCallback(async (item: VerificationQueueItem) => {
    if (!user) return
    
    try {
      setProcessingIds(prev => new Set(prev).add(item.cameraId))
      
      const { approveCameraVerification } = await import('@/lib/admin')
      
      await approveCameraVerification(
        item.cameraId,
        user.uid,
        reviewing?.notes,
        'Camera verified by community moderator'
      )
      
      // Remove from queue
      setQueueItems(prev => prev.filter(i => i.cameraId !== item.cameraId))
      setReviewing(null)
      
      // Refresh stats
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
  }, [user, reviewing, loadVerificationData])
  
  // Handle rejection
  const handleReject = useCallback(async (item: VerificationQueueItem) => {
    if (!user || !reviewing?.rejectionReason) return
    
    try {
      setProcessingIds(prev => new Set(prev).add(item.cameraId))
      
      const { rejectCameraVerification } = await import('@/lib/admin')
      
      await rejectCameraVerification(
        item.cameraId,
        user.uid,
        reviewing.rejectionReason,
        reviewing.customReason,
        reviewing.notes,
        'Camera verification rejected by community moderator'
      )
      
      // Remove from queue
      setQueueItems(prev => prev.filter(i => i.cameraId !== item.cameraId))
      setReviewing(null)
      
      // Refresh stats
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
  }, [user, reviewing, loadVerificationData])
  
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
      {/* Header and Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Camera Verification Queue</h1>
          <p className="text-gray-600">Review and approve community camera registrations</p>
        </div>
        <div className="flex items-center gap-3">
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
      
      {/* Debug Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Debug Information</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <div>Total items in queue: {queueItems.length}</div>
          <div>Filtered items: {sortedItems.length}</div>
          <div>User ID: {user?.uid}</div>
          <div>Loading: {loading.toString()}</div>
        </div>
      </div>
      
      {/* Queue Items */}
      <div className="space-y-4">
        {sortedItems.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No items in queue</h3>
              <p className="text-gray-600">
                {queueItems.length === 0 
                  ? "No camera verifications pending. New camera registrations will appear here."
                  : "All items filtered out by current filter settings."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          sortedItems.map((item) => (
            <Card key={item.cameraId} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{item.cameraDetails.name}</h3>
                      <VerificationStatusBadge status={item.status} size="sm" />
                      <VerificationPriorityBadge priority={item.priority} size="sm" />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {item.userName} ({item.userEmail})
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {item.daysPending} days pending
                      </div>
                      {item.location.postcode && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {item.location.postcode}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!reviewing || reviewing.id !== item.cameraId ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setReviewing({ id: item.cameraId, action: 'approve' })}
                        disabled={processingIds.has(item.cameraId)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Review
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setReviewing(null)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {reviewing && reviewing.id === item.cameraId && (
                <CardContent className="pt-0 border-t">
                  <div className="space-y-4">
                    {/* Camera Details */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Camera Type</Label>
                        <p className="text-sm capitalize">{item.cameraDetails.type}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Model/Brand</Label>
                        <p className="text-sm">
                          {item.cameraDetails.brand} {item.cameraDetails.model}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Registered Address</Label>
                        <p className="text-sm">
                          {item.location.street}, {item.location.city}, {item.location.postcode}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Submitted</Label>
                        <p className="text-sm">{item.submittedAt.toDate().toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setReviewing(null)}
                        disabled={processingIds.has(item.cameraId)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => handleApprove(item)}
                        disabled={processingIds.has(item.cameraId)}
                        variant="default"
                      >
                        {processingIds.has(item.cameraId) ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4 mr-2" />
                        )}
                        Approve Camera
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  )
}