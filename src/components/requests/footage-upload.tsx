'use client'

import React, { useState, useCallback } from 'react'
import { 
  Upload, 
  File, 
  X, 
  Check, 
  AlertCircle, 
  Play,
  Image as ImageIcon,
  Camera,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  uploadFootage, 
  validateMediaFile, 
  formatFileSize, 
  generateVideoThumbnail,
  type UploadProgress 
} from '@/lib/storage'
import type { FootageRequest, CameraResponse } from '@/types/requests'

interface FootageUploadProps {
  request: FootageRequest
  cameraResponse: CameraResponse
  userId: string
  onUploadComplete: () => void
  onCancel: () => void
}

export default function FootageUpload({ 
  request, 
  cameraResponse, 
  userId, 
  onUploadComplete, 
  onCancel 
}: FootageUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    setUploadError(null)
    
    // Validate file
    const validation = validateMediaFile(file)
    if (!validation.valid) {
      setUploadError(validation.error!)
      return
    }

    setSelectedFile(file)

    // Generate thumbnail for videos
    if (file.type.startsWith('video/')) {
      try {
        const thumbnailUrl = await generateVideoThumbnail(file)
        setThumbnail(thumbnailUrl)
      } catch (error) {
        console.warn('Failed to generate thumbnail:', error)
      }
    }
  }, [])

  // Handle file input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  // Upload file
  const handleUpload = useCallback(async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadError(null)
    setUploadProgress(null)

    try {
      await uploadFootage(selectedFile, request.id, cameraResponse.cameraId, userId, {
        onProgress: (progress) => {
          setUploadProgress(progress)
        },
        onError: (error) => {
          setUploadError(error.message)
          setIsUploading(false)
        },
        onComplete: () => {
          setIsUploading(false)
          onUploadComplete()
        }
      })

    } catch (error: any) {
      setUploadError(error.message || 'Upload failed')
      setIsUploading(false)
    }
  }, [selectedFile, request.id, cameraResponse.cameraId, userId, onUploadComplete])

  // Reset form
  const handleReset = useCallback(() => {
    setSelectedFile(null)
    setUploadProgress(null)
    setIsUploading(false)
    setUploadError(null)
    setNotes('')
    setThumbnail(null)
  }, [])

  // Get file icon
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('video/')) return Play
    if (file.type.startsWith('image/')) return ImageIcon
    return File
  }

  // Get upload status
  const getUploadStatus = () => {
    if (uploadProgress?.state === 'success') return 'success'
    if (uploadError) return 'error'
    if (isUploading) return 'uploading'
    return 'idle'
  }

  const status = getUploadStatus()

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Upload Footage</CardTitle>
              <CardDescription>
                {cameraResponse.cameraName} - {request.incidentType.replace(/_/g, ' ')}
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Request Details */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-sm">Request Details</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p><strong>Incident:</strong> {request.incidentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
            <p><strong>Date:</strong> {(request.incidentDate instanceof Date ? request.incidentDate : request.incidentDate.toDate()).toLocaleDateString()} at {request.incidentTime}</p>
            <p><strong>Description:</strong> {request.description}</p>
          </div>
        </div>

        {/* File Upload Area */}
        {!selectedFile && (
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors relative",
              isDragOver
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-medium text-lg mb-2">Upload Video or Image</h3>
            <p className="text-gray-500 mb-4">
              Drag and drop your file here, or click to browse
            </p>
            <div className="text-sm text-gray-400 mb-4">
              <p>Supported formats: MP4, AVI, MOV, WMV, JPEG, PNG, GIF</p>
              <p>Maximum file size: 500MB</p>
            </div>
            <Button variant="outline" className="mx-auto">
              <Upload className="w-4 h-4 mr-2" />
              Choose File
            </Button>
            <input
              type="file"
              accept="video/*,image/*"
              onChange={handleInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        )}

        {/* Selected File Preview */}
        {selectedFile && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {thumbnail ? (
                    <img 
                      src={thumbnail} 
                      alt="Thumbnail" 
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                      {React.createElement(getFileIcon(selectedFile), { 
                        className: "w-8 h-8 text-gray-400" 
                      })}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{selectedFile.name}</h4>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                    <span>{formatFileSize(selectedFile.size)}</span>
                    <span>{selectedFile.type}</span>
                    {selectedFile.type.startsWith('video/') && (
                      <Badge variant="outline" className="text-xs">
                        Video
                      </Badge>
                    )}
                    {selectedFile.type.startsWith('image/') && (
                      <Badge variant="outline" className="text-xs">
                        Image
                      </Badge>
                    )}
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleReset}
                  disabled={isUploading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Progress */}
        {uploadProgress && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  {status === 'success' ? 'Upload Complete' : 'Uploading...'}
                </span>
                <span className="text-sm text-gray-500">
                  {uploadProgress.progress}%
                </span>
              </div>
              <Progress value={uploadProgress.progress} className="w-full" />
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <span>
                  {formatFileSize(uploadProgress.bytesTransferred)} of {formatFileSize(uploadProgress.totalBytes)}
                </span>
                <span>
                  {status === 'success' ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <Check className="w-3 h-3" />
                      Complete
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Uploading
                    </div>
                  )}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {uploadError && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">Upload Failed</span>
              </div>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                {uploadError}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Additional Notes (Optional)
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any relevant details about the footage..."
            rows={3}
            disabled={isUploading}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={onCancel} disabled={isUploading}>
            Cancel
          </Button>
          
          <div className="flex gap-2">
            {selectedFile && status === 'idle' && (
              <Button onClick={handleReset} variant="ghost">
                Choose Different File
              </Button>
            )}
            
            <Button 
              onClick={handleUpload} 
              disabled={!selectedFile || isUploading || status === 'success'}
              className="min-w-24"
            >
              {isUploading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading
                </div>
              ) : status === 'success' ? (
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Complete
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Footage
                </div>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
