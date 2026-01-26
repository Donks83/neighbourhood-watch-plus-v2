'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  Bell, 
  FileVideo, 
  Check, 
  X, 
  Clock, 
  AlertCircle, 
  Camera,
  MapPin,
  Calendar,
  ChevronDown,
  ChevronUp,
  Upload,
  Eye,
  Archive,
  RotateCcw,
  Trash2,
  Filter,
  XCircle,
  Search
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { formatDate, formatDateTime, formatRelativeTime } from '@/lib/date-utils'
import { useAuth } from '@/contexts/auth-context'
import FootageUpload from '@/components/requests/footage-upload'
import FootageViewer from '@/components/requests/footage-viewer'
import PrivacyWarningModal from '@/components/safety/privacy-warning-modal'
import { 
  getRequestsForOwner, 
  getRequestsByUser,
  updateCameraResponse,
  markNotificationRead,
  getUserNotifications,
  cancelFootageRequest
} from '@/lib/footage-requests'
import {
  getUserArchivedRequests,
  restoreRequest,
  autoArchiveOldRequests,
  type ArchivedRequest
} from '@/lib/archive-service'
import type { FootageRequest, RequestNotification, CameraResponse } from '@/types/requests'
import type { RegisteredCamera } from '@/types/camera'

interface RequestManagementProps {
  isOpen: boolean
  onClose: () => void
}

export default function RequestManagement({ isOpen, onClose }: RequestManagementProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'received' | 'sent' | 'archived'>('received')
  const [receivedRequests, setReceivedRequests] = useState<FootageRequest[]>([])
  const [sentRequests, setSentRequests] = useState<FootageRequest[]>([])
  const [archivedRequests, setArchivedRequests] = useState<ArchivedRequest[]>([])
  const [notifications, setNotifications] = useState<RequestNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRunningCleanup, setIsRunningCleanup] = useState(false)
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null)
  const [responseReasons, setResponseReasons] = useState<Record<string, string>>({})
  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedUploadRequest, setSelectedUploadRequest] = useState<FootageRequest | null>(null)
  const [selectedCameraResponse, setSelectedCameraResponse] = useState<CameraResponse | null>(null)
  const [showFootageViewer, setShowFootageViewer] = useState(false)
  const [selectedViewerRequest, setSelectedViewerRequest] = useState<FootageRequest | null>(null)
  
  // Filter states
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterDateFrom, setFilterDateFrom] = useState<string>('')
  const [filterDateTo, setFilterDateTo] = useState<string>('')
  const [filterReference, setFilterReference] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  
  // Privacy warning modal state
  const [showPrivacyWarning, setShowPrivacyWarning] = useState(false)
  const [privacyWarningAction, setPrivacyWarningAction] = useState<'upload' | 'approve'>('upload')
  const [pendingApproveData, setPendingApproveData] = useState<{
    requestId: string
    cameraId: string
    reason?: string
  } | null>(null)
  const [pendingUploadData, setPendingUploadData] = useState<{
    request: FootageRequest
    response: CameraResponse
  } | null>(null)
  const [cancellingRequest, setCancellingRequest] = useState<string | null>(null)

  // Load requests and notifications
  const loadData = useCallback(async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      // Load requests for camera owner
      const received = await getRequestsForOwner(user.uid)
      // Convert Firestore timestamps to proper dates
      const processedReceived = received.map(request => ({
        ...request,
        incidentDate: request.incidentDate instanceof Date ? request.incidentDate : request.incidentDate.toDate(),
        createdAt: request.createdAt instanceof Date ? request.createdAt : request.createdAt.toDate(),
        expiresAt: request.expiresAt instanceof Date ? request.expiresAt : request.expiresAt.toDate()
      }))
      setReceivedRequests(processedReceived)
      
      // Load requests made by user
      const sent = await getRequestsByUser(user.uid)
      const processedSent = sent.map(request => ({
        ...request,
        incidentDate: request.incidentDate instanceof Date ? request.incidentDate : request.incidentDate.toDate(),
        createdAt: request.createdAt instanceof Date ? request.createdAt : request.createdAt.toDate(),
        expiresAt: request.expiresAt instanceof Date ? request.expiresAt : request.expiresAt.toDate()
      }))
      setSentRequests(processedSent)
      
      // Load notifications
      const notifs = await getUserNotifications(user.uid)
      setNotifications(notifs)
      
      // Load archived requests
      const archived = await getUserArchivedRequests(user.uid)
      setArchivedRequests(archived)
      
      // Mark notifications as read
      const unreadNotifs = notifs.filter(n => !n.read)
      for (const notif of unreadNotifs) {
        await markNotificationRead(notif.id)
      }
      
    } catch (error) {
      console.error('❌ Error loading requests:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (isOpen && user) {
      loadData()
    }
  }, [isOpen, user, loadData])

  // Filter logic for received and sent requests
  const filteredReceivedRequests = useMemo(() => {
    return receivedRequests.filter(request => {
      // Status filter
      if (filterStatus !== 'all' && request.status !== filterStatus) return false
      
      // Priority filter
      if (filterPriority !== 'all' && request.priority !== filterPriority) return false
      
      // Date range filter
      if (filterDateFrom) {
        const fromDate = new Date(filterDateFrom)
        if (request.incidentDate < fromDate) return false
      }
      if (filterDateTo) {
        const toDate = new Date(filterDateTo)
        toDate.setHours(23, 59, 59, 999) // End of day
        if (request.incidentDate > toDate) return false
      }
      
      // Reference number search
      if (filterReference) {
        const searchTerm = filterReference.toLowerCase()
        if (!request.referenceNumber?.toLowerCase().includes(searchTerm)) return false
      }
      
      return true
    })
  }, [receivedRequests, filterStatus, filterPriority, filterDateFrom, filterDateTo, filterReference])

  const filteredSentRequests = useMemo(() => {
    return sentRequests.filter(request => {
      // Status filter
      if (filterStatus !== 'all' && request.status !== filterStatus) return false
      
      // Priority filter
      if (filterPriority !== 'all' && request.priority !== filterPriority) return false
      
      // Date range filter
      if (filterDateFrom) {
        const fromDate = new Date(filterDateFrom)
        if (request.incidentDate < fromDate) return false
      }
      if (filterDateTo) {
        const toDate = new Date(filterDateTo)
        toDate.setHours(23, 59, 59, 999) // End of day
        if (request.incidentDate > toDate) return false
      }
      
      // Reference number search
      if (filterReference) {
        const searchTerm = filterReference.toLowerCase()
        if (!request.referenceNumber?.toLowerCase().includes(searchTerm)) return false
      }
      
      return true
    })
  }, [sentRequests, filterStatus, filterPriority, filterDateFrom, filterDateTo, filterReference])

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filterStatus !== 'all') count++
    if (filterPriority !== 'all') count++
    if (filterDateFrom) count++
    if (filterDateTo) count++
    if (filterReference) count++
    return count
  }, [filterStatus, filterPriority, filterDateFrom, filterDateTo, filterReference])

  // Clear all filters
  const clearAllFilters = () => {
    setFilterStatus('all')
    setFilterPriority('all')
    setFilterDateFrom('')
    setFilterDateTo('')
    setFilterReference('')
  }

  // Handle camera response
  const handleCameraResponse = async (
    requestId: string, 
    cameraId: string, 
    status: 'approved' | 'denied' | 'no-footage'
  ) => {
    if (!user) return
    
    // Show privacy warning for approve action
    if (status === 'approved') {
      const reason = responseReasons[`${requestId}-${cameraId}`]
      setPendingApproveData({ requestId, cameraId, reason })
      setPrivacyWarningAction('approve')
      setShowPrivacyWarning(true)
      return
    }
    
    setRespondingTo(`${requestId}-${cameraId}`)
    try {
      const reason = responseReasons[`${requestId}-${cameraId}`]
      await updateCameraResponse(requestId, cameraId, status, reason)
      
      // Reload data
      await loadData()
      
      // Clear reason
      setResponseReasons(prev => {
        const newReasons = { ...prev }
        delete newReasons[`${requestId}-${cameraId}`]
        return newReasons
      })
      
      alert(`✅ Response submitted: ${status}`)
    } catch (error) {
      console.error('❌ Error responding to request:', error)
      alert('Failed to submit response. Please try again.')
    } finally {
      setRespondingTo(null)
    }
  }

  // Handle opening upload modal (with privacy warning)
  const handleOpenUpload = (request: FootageRequest, response: CameraResponse) => {
    // Show privacy warning first
    setPendingUploadData({ request, response })
    setPrivacyWarningAction('upload')
    setShowPrivacyWarning(true)
  }
  
  // Actually open upload modal (after privacy warning accepted)
  const proceedWithUpload = () => {
    if (!pendingUploadData) return
    setSelectedUploadRequest(pendingUploadData.request)
    setSelectedCameraResponse(pendingUploadData.response)
    setShowUploadModal(true)
    setPendingUploadData(null)
  }

  // Handle upload completion
  const handleUploadComplete = async () => {
    setShowUploadModal(false)
    setSelectedUploadRequest(null)
    setSelectedCameraResponse(null)
    
    // Reload data to show updated status
    await loadData()
    
    alert('✅ Footage uploaded successfully!')
  }

  // Handle upload cancel
  const handleUploadCancel = () => {
    setShowUploadModal(false)
    setSelectedUploadRequest(null)
    setSelectedCameraResponse(null)
  }
  
  // Handle privacy warning acceptance
  const handlePrivacyWarningAccept = async () => {
    setShowPrivacyWarning(false)
    
    if (privacyWarningAction === 'approve' && pendingApproveData) {
      // Proceed with approve action
      const { requestId, cameraId, reason } = pendingApproveData
      setRespondingTo(`${requestId}-${cameraId}`)
      try {
        await updateCameraResponse(requestId, cameraId, 'approved', reason)
        await loadData()
        
        // Clear reason
        setResponseReasons(prev => {
          const newReasons = { ...prev }
          delete newReasons[`${requestId}-${cameraId}`]
          return newReasons
        })
        
        alert('✅ Response submitted: approved')
      } catch (error) {
        console.error('❌ Error responding to request:', error)
        alert('Failed to submit response. Please try again.')
      } finally {
        setRespondingTo(null)
        setPendingApproveData(null)
      }
    } else if (privacyWarningAction === 'upload') {
      // Proceed with upload
      proceedWithUpload()
    }
  }
  
  // Handle privacy warning cancellation
  const handlePrivacyWarningClose = () => {
    setShowPrivacyWarning(false)
    setPendingApproveData(null)
    setPendingUploadData(null)
  }

  // Handle opening footage viewer
  const handleOpenFootageViewer = (request: FootageRequest) => {
    setSelectedViewerRequest(request)
    setShowFootageViewer(true)
  }

  // Handle footage viewer close
  const handleCloseFootageViewer = () => {
    setShowFootageViewer(false)
    setSelectedViewerRequest(null)
  }

  // Handle cancel request
  const handleCancelRequest = async (requestId: string) => {
    if (!user) return
    
    const confirmed = window.confirm(
      'Are you sure you want to cancel this request? This action cannot be undone.'
    )
    
    if (!confirmed) return
    
    setCancellingRequest(requestId)
    try {
      await cancelFootageRequest(requestId, user.uid, 'Cancelled by user')
      
      // Reload data
      await loadData()
      
      alert('✅ Request cancelled successfully')
    } catch (error: any) {
      console.error('❌ Error cancelling request:', error)
      alert(`Failed to cancel request: ${error.message}`)
    } finally {
      setCancellingRequest(null)
    }
  }

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary'
      case 'approved': return 'default'
      case 'denied': return 'destructive'
      case 'no-footage': return 'outline'
      case 'expired': return 'secondary'
      case 'fulfilled': return 'default'
      default: return 'secondary'
    }
  }

  // Get priority badge variant
  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive'
      case 'high': return 'destructive'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'secondary'
    }
  }

  if (!isOpen || !user) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[2000] bg-black/50" onClick={onClose} />
      
      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-[2001] w-full md:w-[600px] bg-white dark:bg-gray-900 shadow-2xl">
        
        {/* Header */}
        <div className="h-16 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Footage Requests
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage and respond to footage requests
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex">
            <button
              onClick={() => setActiveTab('received')}
              className={cn(
                "flex-1 px-6 py-3 text-sm font-medium transition-colors",
                activeTab === 'received' 
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              Received ({receivedRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={cn(
                "flex-1 px-6 py-3 text-sm font-medium transition-colors",
                activeTab === 'sent'
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              Sent ({sentRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={cn(
                "flex-1 px-6 py-3 text-sm font-medium transition-colors",
                activeTab === 'archived'
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <div className="flex items-center justify-center gap-2">
                <Archive className="w-4 h-4" />
                Archived ({archivedRequests.length})
              </div>
            </button>
          </div>
        </div>

        {/* Filters Section - Only show for Received and Sent tabs */}
        {(activeTab === 'received' || activeTab === 'sent') && (
          <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            {/* Filter Toggle Button */}
            <div className="px-6 py-3 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="default" className="ml-1 h-5 px-2">
                    {activeFilterCount}
                  </Badge>
                )}
                {showFilters ? (
                  <ChevronUp className="w-4 h-4 ml-1" />
                ) : (
                  <ChevronDown className="w-4 h-4 ml-1" />
                )}
              </Button>
              
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                >
                  <XCircle className="w-4 h-4" />
                  Clear All
                </Button>
              )}
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="px-6 pb-4 space-y-4">
                {/* Reference Number Search */}
                <div>
                  <Label htmlFor="filter-reference" className="text-xs font-medium mb-1 block">
                    Search by Reference Number
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="filter-reference"
                      type="text"
                      placeholder="e.g., INC-123..."
                      value={filterReference}
                      onChange={(e) => setFilterReference(e.target.value)}
                      className="pl-9 h-9 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Status Filter */}
                  <div>
                    <Label htmlFor="filter-status" className="text-xs font-medium mb-1 block">
                      Status
                    </Label>
                    <select
                      id="filter-status"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full h-9 px-3 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="denied">Denied</option>
                      <option value="expired">Expired</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="fulfilled">Fulfilled</option>
                    </select>
                  </div>

                  {/* Priority Filter */}
                  <div>
                    <Label htmlFor="filter-priority" className="text-xs font-medium mb-1 block">
                      Priority
                    </Label>
                    <select
                      id="filter-priority"
                      value={filterPriority}
                      onChange={(e) => setFilterPriority(e.target.value)}
                      className="w-full h-9 px-3 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900"
                    >
                      <option value="all">All Priorities</option>
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="filter-date-from" className="text-xs font-medium mb-1 block">
                      From Date
                    </Label>
                    <Input
                      id="filter-date-from"
                      type="date"
                      value={filterDateFrom}
                      onChange={(e) => setFilterDateFrom(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="filter-date-to" className="text-xs font-medium mb-1 block">
                      To Date
                    </Label>
                    <Input
                      id="filter-date-to"
                      type="date"
                      value={filterDateTo}
                      onChange={(e) => setFilterDateTo(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      min={filterDateFrom}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                {/* Results Count */}
                <div className="text-xs text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                  Showing {activeTab === 'received' ? filteredReceivedRequests.length : filteredSentRequests.length} of {activeTab === 'received' ? receivedRequests.length : sentRequests.length} requests
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6" style={{ height: 'calc(100% - 144px)' }}>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading requests...</p>
            </div>
          ) : (
            <>
              {/* Received Requests Tab */}
              {activeTab === 'received' && (
                <div className="space-y-4">
                  {filteredReceivedRequests.length === 0 ? (
                    <div className="text-center py-8">
                      <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                        {receivedRequests.length === 0 ? 'No requests received' : 'No requests match filters'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {receivedRequests.length === 0 
                          ? "You'll be notified when someone needs footage from your cameras."
                          : 'Try adjusting your filters to see more results.'
                        }
                      </p>
                    </div>
                  ) : (
                    filteredReceivedRequests.map((request) => (
                      <Card key={request.id} className="overflow-hidden">
                        <CardHeader 
                          className="cursor-pointer"
                          onClick={() => setExpandedRequest(
                            expandedRequest === request.id ? null : request.id
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <AlertCircle className="w-4 h-4 text-red-500" />
                                <CardTitle className="text-base">
                                  {request.incidentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </CardTitle>
                                <Badge variant={getPriorityVariant(request.priority)}>
                                  {request.priority}
                                </Badge>
                              </div>
                              <CardDescription className="text-xs">
                                {request.referenceNumber && (
                                  <div className="mb-1 text-blue-600 dark:text-blue-400 font-mono">
                                    Ref: {request.referenceNumber}
                                  </div>
                                )}
                                <div className="flex items-center gap-4 mt-1">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(request.incidentDate)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {request.incidentTime}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {request.searchRadius}m radius
                                  </span>
                                </div>
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={getStatusVariant(request.status)}>
                                {request.status}
                              </Badge>
                              {expandedRequest === request.id ? (
                                <ChevronUp className="w-4 h-4 text-gray-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                          </div>
                        </CardHeader>

                        {expandedRequest === request.id && (
                          <CardContent className="space-y-4">
                            {/* Description */}
                            <div>
                              <h4 className="font-medium text-sm mb-1">Description</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {request.description}
                              </p>
                            </div>

                            {/* Your Cameras */}
                            <div>
                              <h4 className="font-medium text-sm mb-2">
                                Your Cameras ({request.responses.filter(r => 
                                  request.targetCameraIds.includes(r.cameraId)
                                ).length})
                              </h4>
                              <div className="space-y-2">
                                {request.responses
                                  .filter(r => request.targetCameraIds.includes(r.cameraId))
                                  .map((response) => (
                                    <div 
                                      key={response.cameraId}
                                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                    >
                                      <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <Camera className="w-4 h-4 text-blue-600" />
                                          <span className="font-medium text-sm">
                                            {response.cameraName}
                                          </span>
                                          <Badge variant={getStatusVariant(response.status)}>
                                            {response.status}
                                          </Badge>
                                        </div>
                                      </div>

                                      {response.status === 'pending' && (
                                        <>
                                          <Textarea
                                            placeholder="Optional: Add a reason for your response"
                                            value={responseReasons[`${request.id}-${response.cameraId}`] || ''}
                                            onChange={(e) => setResponseReasons(prev => ({
                                              ...prev,
                                              [`${request.id}-${response.cameraId}`]: e.target.value
                                            }))}
                                            className="mb-2 text-sm"
                                            rows={2}
                                          />
                                          <div className="flex gap-2">
                                            <Button
                                              size="sm"
                                              variant="default"
                                              onClick={() => handleCameraResponse(
                                                request.id, 
                                                response.cameraId, 
                                                'approved'
                                              )}
                                              disabled={respondingTo === `${request.id}-${response.cameraId}`}
                                              className="flex-1"
                                            >
                                              <Check className="w-3 h-3 mr-1" />
                                              Approve & Upload
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => handleCameraResponse(
                                                request.id, 
                                                response.cameraId, 
                                                'no-footage'
                                              )}
                                              disabled={respondingTo === `${request.id}-${response.cameraId}`}
                                              className="flex-1"
                                            >
                                              No Footage
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="destructive"
                                              onClick={() => handleCameraResponse(
                                                request.id, 
                                                response.cameraId, 
                                                'denied'
                                              )}
                                              disabled={respondingTo === `${request.id}-${response.cameraId}`}
                                            >
                                              <X className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        </>
                                      )}

                                      {response.status === 'approved' && (
                                      <div className="mt-2">
                                      <Button 
                                      size="sm" 
                                      variant="outline" 
                                        className="w-full"
                                          onClick={() => handleOpenUpload(request, response)}
                                          >
                            <Upload className="w-3 h-3 mr-1" />
                            Upload Footage
                          </Button>
                        </div>
                      )}

                                      {response.status === 'denied' && response.denialReason && (
                                        <p className="text-xs text-gray-500 mt-2">
                                          Reason: {response.denialReason}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                              </div>
                            </div>

                            {/* Request Info */}
                            <div className="text-xs text-gray-500">
                              <p>Request ID: {request.id}</p>
                              <p>Created: {formatDateTime(request.createdAt)}</p>
                              <p>Expires: {formatDateTime(request.expiresAt)}</p>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    ))
                  )}
                </div>
              )}

              {/* Sent Requests Tab */}
              {activeTab === 'sent' && (
                <div className="space-y-4">
                  {filteredSentRequests.length === 0 ? (
                    <div className="text-center py-8">
                      <FileVideo className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                        {sentRequests.length === 0 ? 'No requests sent' : 'No requests match filters'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {sentRequests.length === 0
                          ? 'Your footage requests will appear here.'
                          : 'Try adjusting your filters to see more results.'
                        }
                      </p>
                    </div>
                  ) : (
                    filteredSentRequests.map((request) => (
                      <Card key={request.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <AlertCircle className="w-4 h-4 text-red-500" />
                                <CardTitle className="text-base">
                                  {request.incidentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </CardTitle>
                                <Badge variant={getStatusVariant(request.status)}>
                                  {request.status}
                                </Badge>
                              </div>
                              <CardDescription className="text-xs">
                                {request.referenceNumber && (
                                  <div className="text-blue-600 dark:text-blue-400 font-mono mb-1">
                                    Ref: {request.referenceNumber}
                                  </div>
                                )}
                                {formatDate(request.incidentDate)} at {request.incidentTime}
                              </CardDescription>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">
                                {request.responses.filter(r => r.status === 'approved').length}/{request.responses.length}
                              </div>
                              <div className="text-xs text-gray-500">cameras responded</div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {/* Response Summary */}
                          <div className="grid grid-cols-4 gap-2 mb-4">
                            <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              <div className="text-lg font-bold text-gray-900 dark:text-white">
                                {request.responses.filter(r => r.status === 'pending').length}
                              </div>
                              <div className="text-xs text-gray-500">Pending</div>
                            </div>
                            <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                              <div className="text-lg font-bold text-green-600">
                                {request.responses.filter(r => r.status === 'approved').length}
                              </div>
                              <div className="text-xs text-gray-500">Approved</div>
                            </div>
                            <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                              <div className="text-lg font-bold text-red-600">
                                {request.responses.filter(r => r.status === 'denied').length}
                              </div>
                              <div className="text-xs text-gray-500">Denied</div>
                            </div>
                            <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              <div className="text-lg font-bold text-gray-600">
                                {request.responses.filter(r => r.status === 'no-footage').length}
                              </div>
                              <div className="text-xs text-gray-500">No Footage</div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            {/* View Available Footage */}
                            {request.responses.filter(r => r.status === 'approved').length > 0 && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleOpenFootageViewer(request)}
                                className="flex-1"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                View Available Footage
                              </Button>
                            )}
                            
                            {/* Cancel Request */}
                            {(request.status === 'pending' || request.status === 'approved') && (
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleCancelRequest(request.id)}
                                disabled={cancellingRequest === request.id}
                                className="flex-1"
                              >
                                {cancellingRequest === request.id ? (
                                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-1" />
                                ) : (
                                  <X className="w-3 h-3 mr-1" />
                                )}
                                {cancellingRequest === request.id ? 'Cancelling...' : 'Cancel Request'}
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}

              {/* Archived Requests Tab */}
              {activeTab === 'archived' && (
                <div className="space-y-4">
                  {/* Archive Controls */}
                  <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                          Archive Management
                        </h4>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          Archived requests are old requests that have been automatically cleaned up. 
                          You can restore them if needed.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          setIsRunningCleanup(true)
                          try {
                            const result = await autoArchiveOldRequests()
                            await loadData() // Reload to show newly archived
                            alert(`✅ Cleanup complete! Archived ${result.archived} requests:\n${result.details.fulfilled} fulfilled, ${result.details.expired} expired, ${result.details.cancelled} cancelled`)
                          } catch (error) {
                            console.error('Error running cleanup:', error)
                            alert('Failed to run cleanup. Please try again.')
                          } finally {
                            setIsRunningCleanup(false)
                          }
                        }}
                        disabled={isRunningCleanup}
                        className="whitespace-nowrap"
                      >
                        {isRunningCleanup ? (
                          <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin mr-1" />
                        ) : (
                          <Archive className="w-3 h-3 mr-1" />
                        )}
                        {isRunningCleanup ? 'Running...' : 'Run Cleanup'}
                      </Button>
                    </div>
                  </div>

                  {/* Archived Requests List */}
                  {archivedRequests.length === 0 ? (
                    <div className="text-center py-8">
                      <Archive className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                        No archived requests
                      </h3>
                      <p className="text-sm text-gray-500">
                        Old requests will be automatically archived after 30 days.
                      </p>
                    </div>
                  ) : (
                    archivedRequests.map((request) => (
                      <Card key={request.id} className="border-gray-300 dark:border-gray-600">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Archive className="w-4 h-4 text-gray-500" />
                                <CardTitle className="text-base text-gray-700 dark:text-gray-300">
                                  {request.incidentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </CardTitle>
                                <Badge variant="outline" className="text-xs">
                                  {request.archivedReason}
                                </Badge>
                              </div>
                              <CardDescription className="text-xs">
                                Incident: {formatDate(request.incidentDate)} • 
                                Archived: {formatRelativeTime(request.archivedAt)}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                try {
                                  await restoreRequest(request.id)
                                  await loadData()
                                  alert('✅ Request restored successfully')
                                } catch (error) {
                                  console.error('Error restoring request:', error)
                                  alert('Failed to restore request. Please try again.')
                                }
                              }}
                              className="flex-1"
                            >
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Restore
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && selectedUploadRequest && selectedCameraResponse && user && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-[2100] bg-black/50" onClick={handleUploadCancel} />
          
          {/* Modal */}
          <div className="fixed inset-0 z-[2101] flex items-center justify-center p-4">
            <FootageUpload
              request={selectedUploadRequest}
              cameraResponse={selectedCameraResponse}
              userId={user.uid}
              onUploadComplete={handleUploadComplete}
              onCancel={handleUploadCancel}
            />
          </div>
        </>
      )}

      {/* Footage Viewer Modal */}
      {showFootageViewer && selectedViewerRequest && (
        <FootageViewer
          request={selectedViewerRequest}
          onClose={handleCloseFootageViewer}
        />
      )}
      
      {/* Privacy Warning Modal */}
      <PrivacyWarningModal
        isOpen={showPrivacyWarning}
        onClose={handlePrivacyWarningClose}
        onAccept={handlePrivacyWarningAccept}
        action={privacyWarningAction}
      />
    </>
  )
}
