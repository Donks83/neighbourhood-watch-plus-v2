'use client'

import React, { useState, useEffect } from 'react'
import { 
  X, 
  Play, 
  Download, 
  Calendar,
  Clock,
  Camera,
  User,
  AlertCircle,
  FileVideo,
  Image as ImageIcon,
  ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatDate, formatDateTime } from '@/lib/date-utils'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { FootageRequest, FootageUpload } from '@/types/requests'

interface FootageViewerProps {
  request: FootageRequest
  onClose: () => void
}

export default function FootageViewer({ request, onClose }: FootageViewerProps) {
  const [footageFiles, setFootageFiles] = useState<FootageUpload[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFootage, setSelectedFootage] = useState<FootageUpload | null>(null)

  // Load footage files for this request
  useEffect(() => {
    const loadFootageFiles = async () => {
      try {
        setIsLoading(true)
        
        // Query footage uploads for this request
        const footageQuery = query(
          collection(db, 'footageUploads'),
          where('requestId', '==', request.id)
        )
        
        const snapshot = await getDocs(footageQuery)
        const files: FootageUpload[] = []
        
        snapshot.forEach(doc => {
          files.push({
            ...doc.data(),
            id: doc.id,
            uploadedAt: doc.data().uploadedAt?.toDate() || new Date()
          } as FootageUpload)
        })
        
        // Sort by upload date (newest first)
        files.sort((a, b) => {
          const aDate = a.uploadedAt instanceof Date ? a.uploadedAt : a.uploadedAt.toDate()
          const bDate = b.uploadedAt instanceof Date ? b.uploadedAt : b.uploadedAt.toDate()
          return bDate.getTime() - aDate.getTime()
        })
        
        setFootageFiles(files)
        console.log(`✅ Loaded ${files.length} footage files for request ${request.id}`)
        
      } catch (error) {
        console.error('❌ Error loading footage files:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadFootageFiles()
  }, [request.id])

  // Get file type icon
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('video/')) return FileVideo
    if (fileType.startsWith('image/')) return ImageIcon
    return FileVideo
  }

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Get camera name from response
  const getCameraName = (cameraId: string): string => {
    const response = request.responses.find(r => r.cameraId === cameraId)
    return response?.cameraName || `Camera ${cameraId.slice(-4)}`
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[2200] bg-black/70" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed inset-0 z-[2201] flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                  <Play className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Available Footage</CardTitle>
                  <CardDescription>
                    {request.incidentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} - {formatDate(request.incidentDate)}
                  </CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Request Summary */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-sm">Request Summary</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Date & Time</div>
                  <div className="font-medium">{formatDate(request.incidentDate)} at {request.incidentTime}</div>
                </div>
                <div>
                  <div className="text-gray-500">Priority</div>
                  <Badge variant={request.priority === 'urgent' ? 'destructive' : 'secondary'}>
                    {request.priority}
                  </Badge>
                </div>
                <div>
                  <div className="text-gray-500">Status</div>
                  <Badge variant="default">{request.status}</Badge>
                </div>
                <div>
                  <div className="text-gray-500">Files Available</div>
                  <div className="font-medium">{footageFiles.length} files</div>
                </div>
              </div>
              {request.description && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-gray-500 text-sm mb-1">Description</div>
                  <p className="text-sm">{request.description}</p>
                </div>
              )}
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading footage files...</p>
              </div>
            )}

            {/* No Files */}
            {!isLoading && footageFiles.length === 0 && (
              <div className="text-center py-8">
                <FileVideo className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  No Footage Available
                </h3>
                <p className="text-sm text-gray-500">
                  Camera owners haven't uploaded any footage yet, or uploads are still in progress.
                </p>
              </div>
            )}

            {/* Footage Files Grid */}
            {!isLoading && footageFiles.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-lg">Footage Files ({footageFiles.length})</h3>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download All
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {footageFiles.map((footage) => (
                    <Card key={footage.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative">
                        {footage.fileType.startsWith('video/') ? (
                          <video 
                            src={footage.url} 
                            className="w-full h-full object-cover"
                            controls
                            preload="metadata"
                          >
                            <source src={footage.url} type={footage.fileType} />
                            Your browser does not support the video tag.
                          </video>
                        ) : footage.fileType.startsWith('image/') ? (
                          <img 
                            src={footage.url} 
                            alt={footage.fileName}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => setSelectedFootage(footage)}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {React.createElement(getFileIcon(footage.fileType), { 
                              className: "w-16 h-16 text-gray-400" 
                            })}
                          </div>
                        )}

                        {/* File Type Badge */}
                        <div className="absolute top-2 left-2">
                          <Badge variant="secondary" className="text-xs">
                            {footage.fileType.startsWith('video/') ? 'Video' : 'Image'}
                          </Badge>
                        </div>
                      </div>

                      <CardContent className="p-4 space-y-3">
                        {/* File Info */}
                        <div>
                          <h4 className="font-medium text-sm truncate" title={footage.fileName}>
                            {footage.fileName}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <span>{formatFileSize(footage.fileSize)}</span>
                            <span>•</span>
                            <span>{formatDateTime(footage.uploadedAt)}</span>
                          </div>
                        </div>

                        {/* Camera Info */}
                        <div className="flex items-center gap-2">
                          <Camera className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-600">
                            {getCameraName(footage.cameraId)}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1 text-xs"
                            onClick={() => window.open(footage.url, '_blank')}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View Full
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1 text-xs"
                            onClick={() => {
                              const link = document.createElement('a')
                              link.href = footage.url
                              link.download = footage.fileName
                              document.body.appendChild(link)
                              link.click()
                              document.body.removeChild(link)
                            }}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-200 mb-1">
                    Important: Evidence Handling
                  </p>
                  <p className="text-blue-800 dark:text-blue-300">
                    This footage may be important evidence. Please preserve the original files and 
                    contact local authorities if this relates to a crime or emergency.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Image Lightbox */}
      {selectedFootage && selectedFootage.fileType.startsWith('image/') && (
        <>
          <div className="fixed inset-0 z-[2300] bg-black/90" onClick={() => setSelectedFootage(null)} />
          <div className="fixed inset-0 z-[2301] flex items-center justify-center p-4">
            <div className="relative max-w-full max-h-full">
              <img 
                src={selectedFootage.url} 
                alt={selectedFootage.fileName}
                className="max-w-full max-h-full object-contain"
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => setSelectedFootage(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
