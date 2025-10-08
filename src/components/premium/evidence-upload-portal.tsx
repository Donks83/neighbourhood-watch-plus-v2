'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { 
  Upload, 
  FileVideo, 
  FileImage, 
  Shield, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Download,
  Eye,
  Lock,
  FileCheck,
  Hash,
  Calendar,
  MapPin,
  User,
  XIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface EvidenceFile {
  id: string
  file: File
  preview?: string
  uploadProgress: number
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error'
  metadata: {
    originalName: string
    size: number
    type: string
    duration?: number // for videos
    resolution?: string
    timestamp?: Date
    location?: { lat: number; lng: number }
  }
  chainOfCustody?: {
    uploaderId: string
    uploadTime: Date
    fileHash: string
    verified: boolean
  }
  error?: string
}

interface EvidenceRequest {
  id: string
  title: string
  description: string
  location: string
  timeWindow: { start: Date; end: Date }
  requestedBy: {
    organization: string
    role: 'police' | 'insurance' | 'security'
    badgeNumber?: string
  }
  legalBasis: string
  reward: number
  urgency: 'routine' | 'priority' | 'urgent' | 'emergency'
  deadline: Date
}

interface EvidenceUploadPortalProps {
  isOpen: boolean
  onClose: () => void
  evidenceRequest: EvidenceRequest
  userRole: 'community' | 'verified_user'
  onSubmitEvidence: (files: EvidenceFile[], message: string) => Promise<void>
}

const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB
const ACCEPTED_FILE_TYPES = {
  'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.mkv'],
  'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
}

const URGENCY_COLORS = {
  routine: 'gray',
  priority: 'blue', 
  urgent: 'orange',
  emergency: 'red'
} as const

export default function EvidenceUploadPortal({
  isOpen,
  onClose,
  evidenceRequest,
  userRole,
  onSubmitEvidence
}: EvidenceUploadPortalProps) {
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([])
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: EvidenceFile[] = acceptedFiles.map(file => {
      const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // Create preview for images/videos
      let preview: string | undefined
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file)
      }

      return {
        id: fileId,
        file,
        preview,
        uploadProgress: 0,
        status: 'pending',
        metadata: {
          originalName: file.name,
          size: file.size,
          type: file.type,
          timestamp: new Date()
        }
      }
    })
    
    setEvidenceFiles(prev => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: true
  })

  const removeFile = (fileId: string) => {
    setEvidenceFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId)
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview)
      }
      return prev.filter(f => f.id !== fileId)
    })
  }

  const simulateUpload = async (file: EvidenceFile) => {
    // Simulate file upload with progress
    setEvidenceFiles(prev => prev.map(f => 
      f.id === file.id ? { ...f, status: 'uploading' } : f
    ))

    // Simulate progress updates
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 100))
      setEvidenceFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, uploadProgress: progress } : f
      ))
    }

    // Simulate processing and hash generation
    setEvidenceFiles(prev => prev.map(f => 
      f.id === file.id ? { 
        ...f, 
        status: 'processing',
        chainOfCustody: {
          uploaderId: 'anonymous-user-' + Math.random().toString(36).substr(2, 8),
          uploadTime: new Date(),
          fileHash: 'sha256:' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(''),
          verified: true
        }
      } : f
    ))

    await new Promise(resolve => setTimeout(resolve, 1000))

    setEvidenceFiles(prev => prev.map(f => 
      f.id === file.id ? { ...f, status: 'completed' } : f
    ))
  }

  const uploadAllFiles = async () => {
    const pendingFiles = evidenceFiles.filter(f => f.status === 'pending')
    
    for (const file of pendingFiles) {
      await simulateUpload(file)
    }
  }

  const handleSubmit = async () => {
    if (!agreedToTerms) {
      alert('Please agree to the terms and conditions')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Upload any pending files first
      await uploadAllFiles()
      
      // Submit evidence
      await onSubmitEvidence(evidenceFiles, message)
      
      // Close portal
      onClose()
    } catch (error) {
      console.error('Error submitting evidence:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusIcon = (status: EvidenceFile['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-gray-500" />
      case 'uploading': return <Upload className="w-4 h-4 text-blue-500 animate-pulse" />
      case 'processing': return <FileCheck className="w-4 h-4 text-yellow-500 animate-spin" />
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const canSubmit = evidenceFiles.length > 0 && 
                   evidenceFiles.every(f => f.status === 'completed') && 
                   agreedToTerms && 
                   !isSubmitting

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-[1100]" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed inset-0 z-[1110] overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Secure Evidence Upload
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Chain of custody protected • Anonymous submission
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge 
                  variant="outline" 
                  className={`text-${URGENCY_COLORS[evidenceRequest.urgency]}-600 border-${URGENCY_COLORS[evidenceRequest.urgency]}-200 bg-${URGENCY_COLORS[evidenceRequest.urgency]}-50`}
                >
                  {evidenceRequest.urgency.toUpperCase()}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="w-8 h-8"
                >
                  <XIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Request Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Evidence Request Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                      {evidenceRequest.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {evidenceRequest.description}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span>{evidenceRequest.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span>
                        {evidenceRequest.timeWindow.start.toLocaleDateString()} - 
                        {evidenceRequest.timeWindow.end.toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-gray-500" />
                      <span>{evidenceRequest.requestedBy.organization}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <span className="font-medium">Reward: £{evidenceRequest.reward}</span>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Deadline: {evidenceRequest.deadline.toLocaleDateString()} at {evidenceRequest.deadline.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* File Upload Area */}
              <Card>
                <CardHeader>
                  <CardTitle>Upload Evidence Files</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    {...getRootProps()}
                    className={cn(
                      "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                      isDragActive 
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950" 
                        : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                    )}
                  >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                        <Upload className="w-8 h-8 text-gray-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          {isDragActive ? 'Drop files here' : 'Drag & drop evidence files'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          or <span className="text-blue-600 font-medium">browse files</span> to upload
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          Supports: Videos (MP4, AVI, MOV) and Images (JPG, PNG) • Max 500MB per file
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* File Rejection Errors */}
                  {fileRejections.length > 0 && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                      <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">File Upload Errors:</h4>
                      {fileRejections.map(({ file, errors }) => (
                        <div key={file.name} className="text-sm text-red-600 dark:text-red-400">
                          • {file.name}: {errors.map(e => e.message).join(', ')}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Uploaded Files */}
              {evidenceFiles.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Evidence Files ({evidenceFiles.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {evidenceFiles.map((evidenceFile) => (
                        <div 
                          key={evidenceFile.id}
                          className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                        >
                          {/* File Icon/Preview */}
                          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                            {evidenceFile.file.type.startsWith('video/') ? (
                              <FileVideo className="w-6 h-6 text-blue-600" />
                            ) : (
                              <FileImage className="w-6 h-6 text-green-600" />
                            )}
                          </div>
                          
                          {/* File Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                {evidenceFile.metadata.originalName}
                              </h4>
                              {getStatusIcon(evidenceFile.status)}
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>{formatFileSize(evidenceFile.metadata.size)}</span>
                              <span className="capitalize">{evidenceFile.file.type.split('/')[0]}</span>
                              {evidenceFile.chainOfCustody && (
                                <div className="flex items-center gap-1 text-green-600">
                                  <Lock className="w-3 h-3" />
                                  <span>Secured</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Upload Progress */}
                            {evidenceFile.status === 'uploading' && (
                              <div className="mt-2">
                                <Progress value={evidenceFile.uploadProgress} className="h-2" />
                                <div className="text-xs text-gray-500 mt-1">
                                  Uploading... {evidenceFile.uploadProgress}%
                                </div>
                              </div>
                            )}
                            
                            {/* Chain of Custody Info */}
                            {evidenceFile.chainOfCustody && (
                              <div className="mt-2 p-2 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded text-xs">
                                <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                                  <Hash className="w-3 h-3" />
                                  <span className="font-mono">{evidenceFile.chainOfCustody.fileHash.substring(0, 32)}...</span>
                                </div>
                                <div className="text-green-600 dark:text-green-400 mt-1">
                                  Uploaded: {evidenceFile.chainOfCustody.uploadTime.toLocaleString()}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {evidenceFile.preview && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => window.open(evidenceFile.preview, '_blank')}
                                className="w-8 h-8"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFile(evidenceFile.id)}
                              className="w-8 h-8 text-red-500 hover:text-red-700"
                            >
                              <XIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {/* Upload All Button */}
                      {evidenceFiles.some(f => f.status === 'pending') && (
                        <Button
                          onClick={uploadAllFiles}
                          className="w-full"
                          disabled={isSubmitting}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Secure Upload All Files
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Additional Message */}
              <Card>
                <CardHeader>
                  <CardTitle>Additional Information (Optional)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Provide any additional context about the evidence, what it shows, or timing details that might be helpful..."
                    rows={4}
                    className="resize-none"
                  />
                </CardContent>
              </Card>

              {/* Legal Terms */}
              <Card className="border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">
                      🔒 Legal and Privacy Protection
                    </h4>
                    
                    <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Your identity remains anonymous in all legal proceedings</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Files are encrypted and chain of custody is automatically maintained</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Evidence may be used in legal proceedings or insurance claims</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Reward payment processed within 3-5 business days after verification</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="terms"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="terms" className="text-sm">
                        I agree to the terms and understand that this evidence may be used in legal proceedings
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {evidenceFiles.length} file(s) • Estimated reward: £{evidenceRequest.reward}
                </div>
                
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <Upload className="w-4 h-4 mr-2 animate-pulse" />
                        Submitting Evidence...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Submit Evidence
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
