'use client'

import React, { useState, useEffect } from 'react'
import { Bell, Mail, Smartphone, Check, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/contexts/auth-context'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface NotificationPreferences {
  emailNotifications: boolean
  smsNotifications: boolean
  notificationTypes: {
    newRequests: boolean
    footageShared: boolean
    cameraVerification: boolean
    temporaryMarkerMatch: boolean
  }
}

export default function NotificationPreferences() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    emailNotifications: true,
    smsNotifications: false,
    notificationTypes: {
      newRequests: true,
      footageShared: true,
      cameraVerification: true,
      temporaryMarkerMatch: true
    }
  })

  useEffect(() => {
    loadPreferences()
  }, [user])

  const loadPreferences = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      
      if (userDoc.exists()) {
        const data = userDoc.data()
        setPrefs({
          emailNotifications: data.emailNotifications ?? true,
          smsNotifications: data.smsNotifications ?? false,
          notificationTypes: data.notificationTypes ?? {
            newRequests: true,
            footageShared: true,
            cameraVerification: true,
            temporaryMarkerMatch: true
          }
        })
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const savePreferences = async () => {
    if (!user) return
    
    try {
      setSaving(true)
      setMessage(null)
      
      await updateDoc(doc(db, 'users', user.uid), {
        emailNotifications: prefs.emailNotifications,
        smsNotifications: prefs.smsNotifications,
        notificationTypes: prefs.notificationTypes,
        updatedAt: new Date()
      })
      
      setMessage({ type: 'success', text: 'Notification preferences saved successfully!' })
      setTimeout(() => setMessage(null), 5000)
    } catch (error) {
      console.error('Error saving preferences:', error)
      setMessage({ type: 'error', text: 'Failed to save preferences. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading preferences...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Choose how you want to be notified about important events
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {message && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'} 
                   className={message.type === 'success' ? 'bg-green-50 border-green-200' : ''}>
              {message.type === 'success' ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <X className="w-4 h-4" />
              )}
              <AlertDescription className={message.type === 'success' ? 'text-green-800' : ''}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          {/* Email Notifications */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-blue-600" />
                <div>
                  <Label className="text-base font-semibold">Email Notifications</Label>
                  <p className="text-sm text-gray-600">Receive updates via email</p>
                </div>
              </div>
              <button
                onClick={() => setPrefs({ ...prefs, emailNotifications: !prefs.emailNotifications })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  prefs.emailNotifications ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    prefs.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {prefs.emailNotifications && (
              <div className="ml-8 space-y-3 p-4 bg-gray-50 rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.notificationTypes.newRequests}
                    onChange={(e) => setPrefs({
                      ...prefs,
                      notificationTypes: { ...prefs.notificationTypes, newRequests: e.target.checked }
                    })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm">New footage requests</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.notificationTypes.footageShared}
                    onChange={(e) => setPrefs({
                      ...prefs,
                      notificationTypes: { ...prefs.notificationTypes, footageShared: e.target.checked }
                    })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm">Footage shared with you</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.notificationTypes.cameraVerification}
                    onChange={(e) => setPrefs({
                      ...prefs,
                      notificationTypes: { ...prefs.notificationTypes, cameraVerification: e.target.checked }
                    })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm">Camera verification updates</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.notificationTypes.temporaryMarkerMatch}
                    onChange={(e) => setPrefs({
                      ...prefs,
                      notificationTypes: { ...prefs.notificationTypes, temporaryMarkerMatch: e.target.checked }
                    })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm">Temporary footage matches</span>
                </label>
              </div>
            )}
          </div>

          {/* SMS Notifications */}
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-green-600" />
                <div>
                  <Label className="text-base font-semibold">SMS Notifications</Label>
                  <p className="text-sm text-gray-600">Receive urgent alerts via SMS</p>
                  <p className="text-xs text-amber-600 mt-1">⚠️ Coming soon</p>
                </div>
              </div>
              <button
                disabled
                className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300 opacity-50 cursor-not-allowed"
              >
                <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t">
            <Button 
              onClick={savePreferences} 
              disabled={saving}
              className="w-full"
              size="lg"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Bell className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">About Notifications</p>
              <ul className="space-y-1 text-blue-800">
                <li>• You'll always see in-app notifications regardless of these settings</li>
                <li>• Email notifications help you stay updated when you're away</li>
                <li>• You can change these preferences at any time</li>
                <li>• Critical security alerts are always sent</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
