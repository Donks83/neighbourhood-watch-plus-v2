import React, { useState, useEffect } from 'react'
import { X, Save, Camera, Shield, Wifi, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { RegisteredCamera } from '@/types/camera'

interface CameraEditModalProps {
  camera: RegisteredCamera
  isOpen: boolean
  onClose: () => void
  onSave: (cameraId: string, updates: Partial<RegisteredCamera>) => Promise<void>
  isSaving?: boolean
}

export default function CameraEditModal({
  camera,
  isOpen,
  onClose,
  onSave,
  isSaving = false
}: CameraEditModalProps) {
  const [formData, setFormData] = useState({
    name: camera.name,
    operationalStatus: camera.operationalStatus || 'active',
    shareWithCommunity: camera.privacySettings.shareWithCommunity,
    requireApproval: camera.privacySettings.requireApproval,
    maxRequestRadius: camera.privacySettings.maxRequestRadius,
    resolution: camera.specifications?.resolution || 'HD',
    nightVision: camera.specifications?.nightVision || false
  })

  const [hasChanges, setHasChanges] = useState(false)

  // Reset form when camera changes
  useEffect(() => {
    setFormData({
      name: camera.name,
      operationalStatus: camera.operationalStatus || 'active',
      shareWithCommunity: camera.privacySettings.shareWithCommunity,
      requireApproval: camera.privacySettings.requireApproval,
      maxRequestRadius: camera.privacySettings.maxRequestRadius,
      resolution: camera.specifications?.resolution || 'HD',
      nightVision: camera.specifications?.nightVision || false
    })
    setHasChanges(false)
  }, [camera])

  // Track changes
  useEffect(() => {
    const originalData = {
      name: camera.name,
      operationalStatus: camera.operationalStatus || 'active',
      shareWithCommunity: camera.privacySettings.shareWithCommunity,
      requireApproval: camera.privacySettings.requireApproval,
      maxRequestRadius: camera.privacySettings.maxRequestRadius,
      resolution: camera.specifications?.resolution || 'HD',
      nightVision: camera.specifications?.nightVision || false
    }
    
    const isDifferent = JSON.stringify(formData) !== JSON.stringify(originalData)
    setHasChanges(isDifferent)
  }, [formData, camera])

  const handleSave = async () => {
    try {
      const updates: Partial<RegisteredCamera> = {
        name: formData.name,
        operationalStatus: formData.operationalStatus as 'active' | 'offline' | 'maintenance',
        privacySettings: {
          ...camera.privacySettings,
          shareWithCommunity: formData.shareWithCommunity,
          requireApproval: formData.requireApproval,
          maxRequestRadius: formData.maxRequestRadius
        },
        specifications: {
          ...camera.specifications,
          resolution: formData.resolution,
          nightVision: formData.nightVision
        }
      }

      await onSave(camera.id, updates)
      onClose()
    } catch (error) {
      console.error('Error saving camera:', error)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed left-[50%] top-[50%] z-[2001] translate-x-[-50%] translate-y-[-50%] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Edit Camera Settings
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Update camera details and privacy settings
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-6 space-y-6">
            
            {/* Basic Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Basic Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="camera-name">Camera Name</Label>
                    <Input
                      id="camera-name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Front Door Camera"
                    />
                  </div>
                  <div>
                    <Label htmlFor="operational-status">Status</Label>
                    <select 
                      id="operational-status"
                      value={formData.operationalStatus} 
                      onChange={(e) => setFormData(prev => ({ ...prev, operationalStatus: e.target.value as 'active' | 'offline' | 'maintenance' }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="active">🟢 Online & Active</option>
                      <option value="offline">🔴 Offline</option>
                      <option value="maintenance">🟡 Maintenance</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Privacy & Community Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Privacy & Community
                </CardTitle>
                <CardDescription>
                  Control how your camera appears to the community
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Share with Community</Label>
                    <p className="text-xs text-gray-500">
                      Make this camera visible on the community map
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.shareWithCommunity}
                    onChange={(e) => setFormData(prev => ({ ...prev, shareWithCommunity: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Require Approval</Label>
                    <p className="text-xs text-gray-500">
                      Manually approve each footage request
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.requireApproval}
                    onChange={(e) => setFormData(prev => ({ ...prev, requireApproval: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>

                <div>
                  <Label htmlFor="max-radius">Maximum Request Radius (meters)</Label>
                  <Input
                    id="max-radius"
                    type="number"
                    min="5"
                    max="50"
                    value={formData.maxRequestRadius}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxRequestRadius: parseInt(e.target.value) || 15 }))}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    How far from your camera users can request footage (5-50m)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Technical Specifications */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Technical Specifications</CardTitle>
                <CardDescription>
                  Camera hardware and capabilities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="resolution">Resolution</Label>
                  <select 
                    id="resolution"
                    value={formData.resolution} 
                    onChange={(e) => setFormData(prev => ({ ...prev, resolution: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="HD">HD (720p)</option>
                    <option value="Full HD">Full HD (1080p)</option>
                    <option value="4K">4K (2160p)</option>
                    <option value="8K">8K (4320p)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="space-y-0.5">
                      <Label>Night Vision</Label>
                      <p className="text-xs text-gray-500">
                        Can record in low light
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.nightVision}
                      onChange={(e) => setFormData(prev => ({ ...prev, nightVision: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Verification:</span>
                    <div className="mt-1">
                      {camera.verification?.status === 'approved' && (
                        <Badge variant="default" className="bg-green-100 text-green-800">Verified</Badge>
                      )}
                      {camera.verification?.status === 'pending' && (
                        <Badge variant="outline" className="border-amber-300 text-amber-700">Pending</Badge>
                      )}
                      {camera.verification?.status === 'rejected' && (
                        <Badge variant="destructive">Rejected</Badge>
                      )}
                      {!camera.verification && (
                        <Badge variant="secondary">Not Submitted</Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <div className="mt-1">{camera.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Updated:</span>
                    <div className="mt-1">{camera.lastUpdated?.toDate?.()?.toLocaleDateString() || camera.updatedAt?.toDate?.()?.toLocaleDateString() || 'N/A'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500">
              {hasChanges && "• Unsaved changes"}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} disabled={isSaving}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={!hasChanges || isSaving || !formData.name.trim()}
              >
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </div>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
