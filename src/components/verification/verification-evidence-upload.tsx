'use client'

import React, { useState, useCallback, useRef } from 'react'
import { 
  Upload, 
  X, 
  Camera, 
  FileText, 
  Image as ImageIcon, 
  AlertCircle,
  CheckCircle,
  Loader2,
  Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { VerificationEvidence } from '@/types/verification'

interface VerificationEvidenceUploadProps {
  onEvidenceSubmit: (evidence: VerificationEvidence) => Promise<void>
  initialEvidence?: VerificationEvidence
  isSubmitting?: boolean
  allowMultiplePhotos?: boolean
  maxPhotos?: number
  maxFileSize?: number // in MB
  showUserNotes?: boolean
  showInstallationDate?: boolean
  showPurchaseReceipt?: boolean
  className?: string
}

interface UploadedFile {
  file: File
  url: string // Preview URL
  uploadUrl?: string // Actual storage URL after upload
  isUploading: boolean
  error?: string
}

export default function VerificationEvidenceUpload({
  onEvidenceSubmit,
  initialEvidence,
  isSubmitting = false,
  allowMultiplePhotos = true,
  maxPhotos = 5,
  maxFileSize = 10, // 10MB default
  showUserNotes = true,
  showInstallationDate = true,
  showPurchaseReceipt = true,
  className
}: VerificationEvidenceUploadProps) {
  const [photos, setPhotos] = useState<UploadedFile[]>([])
  const [documents, setDocuments] = useState<UploadedFile[]>([])
  const [userNotes, setUserNotes] = useState(initialEvidence?.userNotes || '')
  const [installationDate, setInstallationDate] = useState(
    initialEvidence?.installationDate ? 
    new Date(initialEvidence.installationDate).toISOString().split('T')[0] : 
    ''
  )
  const [purchaseReceipt, setPurchaseReceipt] = useState<UploadedFile | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const photoInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)
  const receiptInputRef = useRef<HTMLInputElement>(null)

  // File validation
  const validateFile = useCallback((file: File, type: 'image' | 'document'): string | null => {
    const maxSizeBytes = maxFileSize * 1024 * 1024
    
    if (file.size > maxSizeBytes) {
      return `File size must be less than ${maxFileSize}MB`
    }
    
    if (type === 'image') {
      if (!file.type.startsWith('image/')) {
        return 'File must be an image'
      }
    } else if (type === 'document') {
      const validTypes = ['image/', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats']
      if (!validTypes.some(t => file.type.includes(t))) {
        return 'File must be an image or PDF/Word document'
      }
    }
    
    return null
  }, [maxFileSize])

  // Handle photo upload
  const handlePhotoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setError(null)
    
    if (!allowMultiplePhotos && photos.length > 0) {
      setError('Only one photo allowed')
      return
    }
    
    if (photos.length + files.length > maxPhotos) {
      setError(`Maximum ${maxPhotos} photos allowed`)
      return
    }
    
    const newPhotos: UploadedFile[] = []
    
    for (const file of files) {
      const validationError = validateFile(file, 'image')
      if (validationError) {
        setError(validationError)
        continue
      }
      
      newPhotos.push({
        file,
        url: URL.createObjectURL(file),
        isUploading: false
      })
    }
    
    setPhotos(prev => [...prev, ...newPhotos])
    
    if (e.target) {
      e.target.value = ''
    }
  }, [photos, allowMultiplePhotos, maxPhotos, validateFile])

  // Handle document upload
  const handleDocumentUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setError(null)
    
    const newDocuments: UploadedFile[] = []
    
    for (const file of files) {
      const validationError = validateFile(file, 'document')
      if (validationError) {
        setError(validationError)
        continue
      }
      
      newDocuments.push({
        file,
        url: URL.createObjectURL(file),
        isUploading: false
      })
    }
    
    setDocuments(prev => [...prev, ...newDocuments])
    
    if (e.target) {
      e.target.value = ''
    }
  }, [validateFile])

  // Handle receipt upload
  const handleReceiptUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setError(null)
    
    const validationError = validateFile(file, 'document')
    if (validationError) {
      setError(validationError)
      return
    }
    
    setPurchaseReceipt({
      file,
      url: URL.createObjectURL(file),
      isUploading: false
    })
    
    if (e.target) {
      e.target.value = ''
    }
  }, [validateFile])

  // Remove photo
  const removePhoto = useCallback((index: number) => {
    setPhotos(prev => {
      const updated = [...prev]
      URL.revokeObjectURL(updated[index].url)
      updated.splice(index, 1)
      return updated
    })
  }, [])

  // Remove document
  const removeDocument = useCallback((index: number) => {
    setDocuments(prev => {
      const updated = [...prev]
      URL.revokeObjectURL(updated[index].url)
      updated.splice(index, 1)
      return updated
    })
  }, [])

  // Remove receipt
  const removeReceipt = useCallback(() => {
    if (purchaseReceipt) {
      URL.revokeObjectURL(purchaseReceipt.url)
      setPurchaseReceipt(null)
    }
  }, [purchaseReceipt])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (photos.length === 0) {
      setError('At least one camera photo is required')
      return
    }
    
    const evidence: VerificationEvidence = {
      photos: photos.map(p => p.url),
      documents: documents.map(d => d.url),
      purchaseReceipt: purchaseReceipt?.url,
      userNotes: userNotes || undefined,
      installationDate: installationDate ? new Date(installationDate) : undefined
    }
    
    try {
      await onEvidenceSubmit(evidence)
    } catch (err: any) {
      setError(err.message || 'Failed to submit evidence')
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Camera Photos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Camera Photos *
          </CardTitle>
          <CardDescription>
            Upload clear photos of your camera installation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Button */}
          <div className="flex flex-wrap gap-3">
            {photos.map((photo, index) => (
              <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-gray-200">
                <img 
                  src={photo.url} 
                  alt={`Camera photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            
            {photos.length < maxPhotos && (
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-gray-400 transition-colors"
              >
                <Plus className="w-6 h-6 text-gray-400 mb-1" />
                <span className="text-xs text-gray-500">Add Photo</span>
              </button>
            )}
          </div>
          
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            multiple={allowMultiplePhotos}
            onChange={handlePhotoUpload}
            className="hidden"
          />
          
          <p className="text-xs text-gray-500">
            {allowMultiplePhotos 
              ? `Upload up to ${maxPhotos} photos (${photos.length}/${maxPhotos})`
              : 'Upload one clear photo of your camera'
            }
          </p>
        </CardContent>
      </Card>

      {/* Installation Date */}
      {showInstallationDate && (
        <div className="space-y-2">
          <Label htmlFor="installationDate">Installation Date (Optional)</Label>
          <Input
            id="installationDate"
            type="date"
            value={installationDate}
            onChange={(e) => setInstallationDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
      )}

      {/* Purchase Receipt */}
      {showPurchaseReceipt && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Purchase Receipt (Optional)
            </CardTitle>
            <CardDescription>
              Upload proof of purchase to strengthen verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            {purchaseReceipt ? (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <FileText className="w-8 h-8 text-blue-600" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{purchaseReceipt.file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(purchaseReceipt.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={removeReceipt}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => receiptInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Receipt
                </Button>
                <input
                  ref={receiptInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleReceiptUpload}
                  className="hidden"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* User Notes */}
      {showUserNotes && (
        <div className="space-y-2">
          <Label htmlFor="userNotes">Additional Notes (Optional)</Label>
          <Textarea
            id="userNotes"
            value={userNotes}
            onChange={(e) => setUserNotes(e.target.value)}
            placeholder="Any additional information about your camera installation..."
            rows={4}
          />
        </div>
      )}

      {/* Submit Button */}
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={isSubmitting || photos.length === 0}
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Submit Evidence
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
