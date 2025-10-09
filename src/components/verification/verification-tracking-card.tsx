'use client'

import React, { useState } from 'react'
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle, 
  Camera,
  Shield,
  Eye,
  MessageSquare,
  RefreshCw,
  ExternalLink,
  FileImage,
  AlertTriangle,
  ChevronRight
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import VerificationStatusBadge from './verification-status-badge'
import { cn } from '@/lib/utils'
import type { RegisteredCamera } from '@/types/camera'
import type { VerificationStatus } from '@/types/verification'

interface VerificationTrackingCardProps {
  cameras: RegisteredCamera[]
  onRefresh?: () => void
  onAddEvidence?: (cameraId: string) => void
  onContactSupport?: () => void
  className?: string
}

interface VerificationSummary {
  total: number
  pending: number
  approved: number
  rejected: number
  requiresInfo: number
  completionRate: number
  oldestPending: number // days
}

export default function VerificationTrackingCard({ 
  cameras, 
  onRefresh, 
  onAddEvidence,
  onContactSupport,
  className 
}: VerificationTrackingCardProps) {
  const [expandedCamera, setExpandedCamera] = useState<string | null>(null)

  // Calculate verification summary
  const summary: VerificationSummary = {
    total: cameras.length,
    pending: cameras.filter(c => c.verification?.status === 'pending').length,
    approved: cameras.filter(c => c.verification?.status === 'approved').length,
    rejected: cameras.filter(c => c.verification?.status === 'rejected').length,
    requiresInfo: cameras.filter(c => c.verification?.status === 'requires_info').length,
    completionRate: cameras.length > 0 ? (cameras.filter(c => c.verification?.status === 'approved').length / cameras.length) * 100 : 0,
    oldestPending: Math.max(...cameras
      .filter(c => c.verification?.status === 'pending')
      .map(c => Math.floor((Date.now() - (c.verification?.submittedAt?.toMillis() || Date.now())) / (1000 * 60 * 60 * 24)))
      .concat([0])
    )
  }

  // Get cameras needing attention (requires_info or rejected)
  const camerasNeedingAttention = cameras.filter(c => 
    c.verification?.status === 'requires_info' || c.verification?.status === 'rejected'
  )

  // Get oldest pending cameras
  const oldPendingCameras = cameras.filter(c => {
    if (c.verification?.status !== 'pending') return false
    const daysPending = Math.floor((Date.now() - (c.verification?.submittedAt?.toMillis() || Date.now())) / (1000 * 60 * 60 * 24))
    return daysPending >= 3
  })

  const getStatusColor = (status?: VerificationStatus) => {
    switch (status) {
      case 'approved': return 'text-green-600'
      case 'rejected': return 'text-red-600'
      case 'requires_info': return 'text-blue-600'
      case 'pending': return 'text-amber-600'
      default: return 'text-gray-600'
    }
  }

  const getNextSteps = (camera: RegisteredCamera) => {
    const status = camera.verification?.status
    switch (status) {
      case 'pending':
        const daysPending = Math.floor((Date.now() - (camera.verification?.submittedAt?.toMillis() || Date.now())) / (1000 * 60 * 60 * 24))
        return daysPending >= 3 
          ? "Verification taking longer than expected. Check back tomorrow or contact support if urgent."
          : "Your camera is in the admin review queue. Typical review time is 1-3 days."
      
      case 'requires_info':
        return "Admin needs more information. Click to see what's required and submit additional evidence."
      
      case 'rejected':
        return "Your camera was rejected. View the reason and consider resubmitting with corrections."
      
      case 'approved':
        return "✅ Your camera is verified and visible to the community!"
      
      default:
        return "Camera not yet submitted for verification."
    }
  }

  const getActionButton = (camera: RegisteredCamera) => {
    const status = camera.verification?.status
    switch (status) {
      case 'requires_info':
        return (
          <Button 
            size="sm" 
            onClick={() => onAddEvidence?.(camera.id)}
            className="gap-2"
          >
            <FileImage className="w-4 h-4" />
            Add Evidence
          </Button>
        )
      
      case 'rejected':
        return (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onAddEvidence?.(camera.id)}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Resubmit
          </Button>
        )
      
      case 'approved':
        return (
          <Button 
            size="sm" 
            variant="outline"
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            View on Map
          </Button>
        )
      
      default:
        return null
    }
  }

  if (cameras.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Camera Verification
          </CardTitle>
          <CardDescription>
            Track the verification status of your security cameras
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600 mb-2">No cameras to verify yet</p>
            <p className="text-xs text-gray-500">Add your first camera to start the verification process</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Camera Verification Status
            </CardTitle>
            <CardDescription>
              {summary.approved} of {summary.total} cameras verified
            </CardDescription>
          </div>
          {onRefresh && (
            <Button variant="ghost" size="sm" onClick={onRefresh}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progress Overview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Verification Progress</span>
            <span className="text-gray-600">{Math.round(summary.completionRate)}% Complete</span>
          </div>
          <Progress value={summary.completionRate} className="h-2" />
          
          {/* Status Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{summary.approved}</div>
              <div className="text-xs text-gray-600">Verified</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-amber-600">{summary.pending}</div>
              <div className="text-xs text-gray-600">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{summary.requiresInfo}</div>
              <div className="text-xs text-gray-600">Need Info</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">{summary.rejected}</div>
              <div className="text-xs text-gray-600">Rejected</div>
            </div>
          </div>
        </div>

        {/* Urgent Actions */}
        {camerasNeedingAttention.length > 0 && (
          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span className="text-amber-800 dark:text-amber-200">
                  {camerasNeedingAttention.length} camera{camerasNeedingAttention.length > 1 ? 's need' : ' needs'} your attention
                </span>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-amber-300 text-amber-800 hover:bg-amber-100"
                >
                  Review Now
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Slow Verification Warning */}
        {oldPendingCameras.length > 0 && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                {oldPendingCameras.length} camera{oldPendingCameras.length > 1 ? 's have' : ' has'} been pending for {summary.oldestPending}+ days
              </span>
              {onContactSupport && (
                <Button size="sm" variant="ghost" onClick={onContactSupport}>
                  Contact Support
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Camera List */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">Camera Status Details</h4>
          {cameras.map((camera) => {
            const isExpanded = expandedCamera === camera.id
            const status = camera.verification?.status
            const daysPending = camera.verification?.submittedAt 
              ? Math.floor((Date.now() - camera.verification.submittedAt.toMillis()) / (1000 * 60 * 60 * 24))
              : 0

            return (
              <div
                key={camera.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              >
                {/* Camera Header */}
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => setExpandedCamera(isExpanded ? null : camera.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Camera className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="font-medium text-sm">{camera.name}</div>
                        <div className="text-xs text-gray-600 capitalize">
                          {camera.type} • Added {camera.createdAt?.toDate().toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <VerificationStatusBadge 
                        status={status || 'pending'} 
                        size="sm" 
                      />
                      <ChevronRight 
                        className={cn(
                          "w-4 h-4 text-gray-400 transition-transform",
                          isExpanded && "rotate-90"
                        )} 
                      />
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <div className="pt-4 space-y-4">
                      
                      {/* Status Details */}
                      <div>
                        <h5 className="text-sm font-medium mb-2">Verification Status</h5>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {getNextSteps(camera)}
                        </div>
                        
                        {/* Timeline */}
                        {camera.verification && (
                          <div className="mt-3 space-y-2 text-xs">
                            <div className="flex items-center gap-2 text-gray-600">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              Submitted {camera.verification.submittedAt?.toDate().toLocaleDateString()}
                              {status === 'pending' && ` (${daysPending} days ago)`}
                            </div>
                            
                            {status === 'approved' && camera.verification.verifiedAt && (
                              <div className="flex items-center gap-2 text-green-600">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                Approved {camera.verification.verifiedAt.toDate().toLocaleDateString()}
                              </div>
                            )}
                            
                            {status === 'rejected' && camera.verification.verifiedAt && (
                              <div className="flex items-center gap-2 text-red-600">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                Rejected {camera.verification.verifiedAt.toDate().toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Admin Messages */}
                      {camera.verification?.publicNotes && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="text-sm font-medium text-blue-800 dark:text-blue-200">Message from Admin</div>
                              <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                {camera.verification.publicNotes}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Rejection Details */}
                      {status === 'rejected' && camera.verification?.rejectionReason && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                          <div className="flex items-start gap-2">
                            <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="text-sm font-medium text-red-800 dark:text-red-200">Rejection Reason</div>
                              <div className="text-sm text-red-700 dark:text-red-300 mt-1 capitalize">
                                {camera.verification.rejectionReason.replace(/_/g, ' ')}
                              </div>
                              {camera.verification.customRejectionReason && (
                                <div className="text-sm text-red-700 dark:text-red-300 mt-1">
                                  {camera.verification.customRejectionReason}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="text-xs text-gray-500">
                          Last updated: {camera.lastUpdated ? 
                            camera.lastUpdated.toDate().toLocaleDateString() : 'Unknown'
                          }
                        </div>
                        {getActionButton(camera)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Help Section */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-2">
              Questions about the verification process?
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="ghost" size="sm" className="text-xs">
                <ExternalLink className="w-3 h-3 mr-1" />
                Verification Guide
              </Button>
              {onContactSupport && (
                <Button variant="ghost" size="sm" onClick={onContactSupport} className="text-xs">
                  <MessageSquare className="w-3 h-3 mr-1" />
                  Contact Support
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}