'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Trash2, Shield, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { getAccountDeletionSummary, deleteUserAccount, type DeletionSummary } from '@/lib/account-deletion'

export default function AccountSettings() {
  const { user, userProfile, logout } = useAuth()
  const router = useRouter()
  
  const [deletionSummary, setDeletionSummary] = useState<DeletionSummary | null>(null)
  const [isLoadingSummary, setIsLoadingSummary] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Load deletion summary when showing delete section
  useEffect(() => {
    if (showDeleteConfirm && user && !deletionSummary) {
      loadDeletionSummary()
    }
  }, [showDeleteConfirm, user])

  const loadDeletionSummary = async () => {
    if (!user) return
    
    setIsLoadingSummary(true)
    try {
      const summary = await getAccountDeletionSummary(user.uid)
      setDeletionSummary(summary)
    } catch (error) {
      console.error('Error loading deletion summary:', error)
    } finally {
      setIsLoadingSummary(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user || confirmText !== 'DELETE') return
    
    setIsDeleting(true)
    setDeleteError(null)
    
    try {
      await deleteUserAccount(user.uid)
      await logout()
      router.push('/')
    } catch (error: any) {
      console.error('Error deleting account:', error)
      setDeleteError(error.message || 'Failed to delete account. Please try again.')
      setIsDeleting(false)
    }
  }

  if (!user || !userProfile) {
    return null
  }

  const accountAge = user.metadata.creationTime 
    ? Math.floor((Date.now() - new Date(user.metadata.creationTime).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <div className="space-y-6">
      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm text-gray-600">Email</Label>
            <p className="text-base font-medium">{user.email}</p>
          </div>
          <div>
            <Label className="text-sm text-gray-600">Display Name</Label>
            <p className="text-base font-medium">{userProfile?.displayName || 'Not set'}</p>
          </div>
          <div>
            <Label className="text-sm text-gray-600">Account Age</Label>
            <p className="text-base font-medium">{accountAge} days</p>
          </div>
          <div>
            <Label className="text-sm text-gray-600">Role</Label>
            <p className="text-base font-medium capitalize">{userProfile?.role || 'user'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone - Delete Account */}
      <Card className="border-red-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
          </div>
          <CardDescription>
            Permanently delete your account and all associated data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showDeleteConfirm ? (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-2">
                  What will be deleted:
                </h3>
                <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                  <li>Your user profile and account</li>
                  <li>All registered cameras</li>
                  <li>All footage requests you've sent</li>
                  <li>All footage responses you've provided</li>
                  <li>All temporary evidence markers</li>
                  <li>All notifications</li>
                  <li>All archived data</li>
                </ul>
                <p className="text-sm text-red-900 mt-3 font-semibold">
                  ⚠️ This action cannot be undone!
                </p>
              </div>

              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete My Account
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {isLoadingSummary ? (
                <div className="text-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-600" />
                  <p className="text-sm text-gray-600">Loading your data summary...</p>
                </div>
              ) : deletionSummary && (
                <>
                  <div className="bg-gray-100 rounded-lg p-4 space-y-2 text-sm">
                    <h3 className="font-semibold mb-3">Data to be deleted:</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div>📷 Cameras:</div>
                      <div className="font-mono">{deletionSummary.cameras}</div>
                      
                      <div>📤 Sent Requests:</div>
                      <div className="font-mono">{deletionSummary.sentRequests}</div>
                      
                      <div>📥 Received Responses:</div>
                      <div className="font-mono">{deletionSummary.receivedResponses}</div>
                      
                      <div>🎯 Temporary Markers:</div>
                      <div className="font-mono">{deletionSummary.temporaryMarkers}</div>
                      
                      <div>🔔 Notifications:</div>
                      <div className="font-mono">{deletionSummary.notifications}</div>
                      
                      <div>📦 Archived Items:</div>
                      <div className="font-mono">{deletionSummary.archivedRequests}</div>
                    </div>
                  </div>

                  <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-4">
                      <Shield className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-red-900 mb-1">
                          Final Confirmation Required
                        </h4>
                        <p className="text-sm text-red-800">
                          This will permanently delete your account and all data. This action cannot be undone.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="confirm-delete" className="text-sm font-medium mb-2 block">
                          Type <span className="font-mono font-bold">DELETE</span> to confirm:
                        </Label>
                        <Input
                          id="confirm-delete"
                          type="text"
                          value={confirmText}
                          onChange={(e) => setConfirmText(e.target.value)}
                          placeholder="Type DELETE here"
                          className="font-mono"
                          disabled={isDeleting}
                        />
                      </div>

                      {deleteError && (
                        <div className="bg-red-100 border border-red-300 rounded p-3">
                          <p className="text-sm text-red-800">{deleteError}</p>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowDeleteConfirm(false)
                            setConfirmText('')
                            setDeleteError(null)
                          }}
                          disabled={isDeleting}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleDeleteAccount}
                          disabled={confirmText !== 'DELETE' || isDeleting}
                          className="flex-1"
                        >
                          {isDeleting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Permanently Delete
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
