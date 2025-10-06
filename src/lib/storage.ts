import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject,
  UploadTask
} from 'firebase/storage'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db, storage } from './firebase'
import type { FootageUpload } from '@/types/requests'

export interface UploadProgress {
  progress: number // 0-100
  bytesTransferred: number
  totalBytes: number
  state: 'running' | 'paused' | 'success' | 'error'
}

export interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void
  onError?: (error: Error) => void
  onComplete?: (downloadUrl: string) => void
}

/**
 * Upload footage file to Firebase Storage
 */
export async function uploadFootage(
  file: File,
  requestId: string,
  cameraId: string,
  userId: string,
  options?: UploadOptions
): Promise<FootageUpload> {
  try {
    // Validate file
    if (!file) {
      throw new Error('No file provided')
    }

    // Check file size (max 500MB)
    const maxSize = 500 * 1024 * 1024 // 500MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 500MB limit')
    }

    // Check file type
    const allowedTypes = [
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/x-msvideo', // .avi
      'video/x-ms-wmv',  // .wmv
      'image/jpeg',
      'image/png',
      'image/gif'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Unsupported file type. Please upload video or image files.')
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `${requestId}_${cameraId}_${timestamp}.${fileExtension}`
    
    // Create storage reference
    const storageRef = ref(storage, `footage/${requestId}/${fileName}`)
    
    // Start upload with resumable upload
    const uploadTask: UploadTask = uploadBytesResumable(storageRef, file)
    
    // Monitor upload progress
    const uploadPromise = new Promise<string>((resolve, reject) => {
      uploadTask.on('state_changed',
        // Progress callback
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
          
          if (options?.onProgress) {
            options.onProgress({
              progress,
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              state: snapshot.state as any
            })
          }
        },
        // Error callback
        (error) => {
          console.error('❌ Upload error:', error)
          if (options?.onError) {
            options.onError(error)
          }
          reject(error)
        },
        // Complete callback
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
            if (options?.onComplete) {
              options.onComplete(downloadURL)
            }
            resolve(downloadURL)
          } catch (error) {
            reject(error)
          }
        }
      )
    })

    // Wait for upload to complete
    const downloadUrl = await uploadPromise

    // Create footage upload record
    const uploadId = `upload-${timestamp}-${Math.random().toString(36).substr(2, 9)}`
    const footageUpload: FootageUpload = {
      id: uploadId,
      requestId,
      cameraId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      url: downloadUrl,
      uploadedBy: userId,
      uploadedAt: new Date(),
      processingStatus: 'completed'
    }

    // Save to Firestore
    await setDoc(doc(db, 'footageUploads', uploadId), {
      ...footageUpload,
      uploadedAt: serverTimestamp()
    })

    console.log('✅ Footage uploaded successfully:', uploadId)
    return footageUpload

  } catch (error) {
    console.error('❌ Error uploading footage:', error)
    throw error
  }
}

/**
 * Delete footage file from storage and database
 */
export async function deleteFootage(footageUpload: FootageUpload): Promise<void> {
  try {
    // Delete from storage
    const fileRef = ref(storage, footageUpload.url)
    await deleteObject(fileRef)

    // Delete from Firestore would be handled by admin/cleanup functions
    console.log('✅ Footage deleted successfully:', footageUpload.id)

  } catch (error) {
    console.error('❌ Error deleting footage:', error)
    throw error
  }
}

/**
 * Generate thumbnail for video files (client-side)
 */
export function generateVideoThumbnail(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('video/')) {
      reject(new Error('File is not a video'))
      return
    }

    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    video.onloadedmetadata = () => {
      // Set canvas dimensions
      canvas.width = Math.min(video.videoWidth, 320)
      canvas.height = Math.min(video.videoHeight, 240)

      // Seek to 1 second or 10% of video duration
      video.currentTime = Math.min(1, video.duration * 0.1)
    }

    video.onseeked = () => {
      // Draw frame to canvas
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Convert to data URL
      const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7)
      resolve(thumbnailUrl)
      
      // Clean up
      video.remove()
      canvas.remove()
    }

    video.onerror = () => {
      reject(new Error('Failed to generate thumbnail'))
      video.remove()
      canvas.remove()
    }

    // Load video
    video.src = URL.createObjectURL(file)
    video.load()
  })
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Validate video/image file
 */
export function validateMediaFile(file: File): { valid: boolean; error?: string } {
  // Check file size (max 500MB)
  const maxSize = 500 * 1024 * 1024
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds 500MB limit`
    }
  }

  // Check file type
  const allowedTypes = [
    'video/mp4',
    'video/mpeg', 
    'video/quicktime',
    'video/x-msvideo',
    'video/x-ms-wmv',
    'image/jpeg',
    'image/png',
    'image/gif'
  ]

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Unsupported file type. Please upload MP4, AVI, MOV, WMV videos or JPEG, PNG, GIF images.'
    }
  }

  return { valid: true }
}
