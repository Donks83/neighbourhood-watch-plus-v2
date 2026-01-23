'use client'

import React, { useState } from 'react'
import {
  AlertTriangle,
  Shield,
  Phone,
  Eye,
  X,
  FileText,
  CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface PrivacyWarningModalProps {
  isOpen: boolean
  onClose: () => void
  onAccept: () => void
  action: 'upload' | 'approve'  // Different warnings for different actions
}

export default function PrivacyWarningModal({
  isOpen,
  onClose,
  onAccept,
  action
}: PrivacyWarningModalProps) {
  const [hasReadGuidelines, setHasReadGuidelines] = useState(false)
  const [confirmLegitimate, setConfirmLegitimate] = useState(false)

  const canProceed = hasReadGuidelines && confirmLegitimate

  const handleAccept = () => {
    if (canProceed) {
      onAccept()
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[2200] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[2201] flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <CardHeader className="bg-amber-50 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-800">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Privacy & Safety Notice</CardTitle>
                  <CardDescription className="text-amber-700 dark:text-amber-300 mt-1">
                    Please read carefully before {action === 'upload' ? 'uploading footage' : 'approving this request'}
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Critical Warnings */}
            <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <AlertDescription className="text-red-900 dark:text-red-100 space-y-2">
                <p className="font-semibold text-base">When NOT to Share Footage:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>No actual crime or incident occurred</li>
                  <li>Request is trying to track someone's whereabouts</li>
                  <li>Request appears to be surveillance or stalking</li>
                  <li>You have privacy concerns about the request</li>
                  <li>Request seems suspicious or inappropriate</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Police Reporting Guidance */}
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
              <Phone className="h-5 w-5 text-blue-600" />
              <AlertDescription className="text-blue-900 dark:text-blue-100 space-y-2">
                <p className="font-semibold text-base">For Serious Crimes:</p>
                <p className="text-sm">
                  If the incident involves serious crime (assault, break-in, violence), the requester should 
                  <strong> report to police first</strong> before requesting community footage. This platform 
                  is <strong>supplementary</strong>, not a replacement for official police investigations.
                </p>
                <div className="flex items-center gap-2 mt-2 text-sm font-semibold">
                  <Phone className="w-4 h-4" />
                  <span>UK Emergency: 999 | Non-Emergency: 101</span>
                </div>
              </AlertDescription>
            </Alert>

            {/* Appropriate Use Cases */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Legitimate Use Cases:
              </h3>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Minor property crimes (vandalism, theft, graffiti)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Hit-and-run incidents or traffic violations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Anti-social behavior affecting the community</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Insurance claim evidence (with police report number)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Package theft or delivery issues</span>
                </li>
              </ul>
            </div>

            {/* Privacy Reminder */}
            <Alert className="border-gray-200 bg-gray-50 dark:bg-gray-900">
              <Eye className="h-5 w-5 text-gray-600" />
              <AlertDescription className="text-gray-700 dark:text-gray-300 text-sm">
                <p className="font-semibold mb-2">Your Rights & Responsibilities:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>You can refuse any request without giving a reason</li>
                  <li>You're not obligated to share footage, even if approved</li>
                  <li>Report suspicious requests using the "Report" button</li>
                  <li>Review footage before sharing to ensure no privacy violations</li>
                  <li>Only share the relevant timeframe (not entire recordings)</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Confirmation Checkboxes */}
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="guidelines"
                  checked={hasReadGuidelines}
                  onCheckedChange={(checked) => setHasReadGuidelines(checked as boolean)}
                />
                <label
                  htmlFor="guidelines"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  I have read and understand the <Link href="/community-guidelines" className="text-blue-600 hover:underline" target="_blank">Community Guidelines</Link>
                </label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="legitimate"
                  checked={confirmLegitimate}
                  onCheckedChange={(checked) => setConfirmLegitimate(checked as boolean)}
                />
                <label
                  htmlFor="legitimate"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  I confirm this is a legitimate request and I'm comfortable sharing footage for this incident
                </label>
              </div>
            </div>

            {/* Additional Resources */}
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500 pt-2">
              <Link href="/privacy" className="hover:text-blue-600 flex items-center gap-1" target="_blank">
                <FileText className="w-3 h-3" />
                Privacy Policy
              </Link>
              <span>•</span>
              <Link href="/terms" className="hover:text-blue-600 flex items-center gap-1" target="_blank">
                <FileText className="w-3 h-3" />
                Terms of Service
              </Link>
              <span>•</span>
              <Link href="/community-guidelines" className="hover:text-blue-600 flex items-center gap-1" target="_blank">
                <FileText className="w-3 h-3" />
                Community Guidelines
              </Link>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAccept}
                disabled={!canProceed}
                className={cn(
                  "flex-1",
                  !canProceed && "opacity-50 cursor-not-allowed"
                )}
              >
                {action === 'upload' ? 'Proceed to Upload' : 'Proceed to Approve'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
