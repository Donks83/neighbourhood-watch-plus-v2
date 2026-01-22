/**
 * Archive Service
 * Manages archiving old footage requests to keep main database clean
 * Automatically archives:
 * - Fulfilled requests after 30 days
 * - Expired requests immediately
 * - Cancelled requests after 7 days
 */

import { 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore'
import { db } from './firebase'
import type { FootageRequest } from '@/types/requests'

export interface ArchivedRequest extends FootageRequest {
  archivedAt: Date
  archivedReason: 'fulfilled' | 'expired' | 'cancelled' | 'manual'
  originalId: string
}

/**
 * Archive a single footage request
 * Moves from footageRequests → archivedRequests collection
 */
export async function archiveRequest(
  requestId: string, 
  reason: 'fulfilled' | 'expired' | 'cancelled' | 'manual'
): Promise<void> {
  try {
    // Get the original request
    const requestRef = doc(db, 'footageRequests', requestId)
    const requestSnap = await getDoc(requestRef)
    
    if (!requestSnap.exists()) {
      throw new Error(`Request ${requestId} not found`)
    }
    
    const requestData = requestSnap.data() as FootageRequest
    
    // Create archived version with metadata
    const archivedData: ArchivedRequest = {
      ...requestData,
      archivedAt: new Date(),
      archivedReason: reason,
      originalId: requestId
    }
    
    // Move to archived collection
    await setDoc(doc(db, 'archivedRequests', requestId), {
      ...archivedData,
      archivedAt: serverTimestamp()
    })
    
    // Delete from active requests
    await deleteDoc(requestRef)
    
    console.log(`✅ Archived request ${requestId} (reason: ${reason})`)
    
  } catch (error) {
    console.error('Error archiving request:', error)
    throw error
  }
}


/**
 * Restore an archived request back to active requests
 * Useful if request was archived by mistake
 */
export async function restoreRequest(requestId: string): Promise<void> {
  try {
    // Get the archived request
    const archivedRef = doc(db, 'archivedRequests', requestId)
    const archivedSnap = await getDoc(archivedRef)
    
    if (!archivedSnap.exists()) {
      throw new Error(`Archived request ${requestId} not found`)
    }
    
    const archivedData = archivedSnap.data() as ArchivedRequest
    
    // Remove archive metadata
    const { archivedAt, archivedReason, originalId, ...requestData } = archivedData
    
    // Restore to active requests
    await setDoc(doc(db, 'footageRequests', requestId), requestData)
    
    // Delete from archive
    await deleteDoc(archivedRef)
    
    console.log(`✅ Restored request ${requestId} from archive`)
    
  } catch (error) {
    console.error('Error restoring request:', error)
    throw error
  }
}

/**
 * Get all archived requests for a specific user
 */
export async function getUserArchivedRequests(userId: string): Promise<ArchivedRequest[]> {
  try {
    const q = query(
      collection(db, 'archivedRequests'),
      where('requesterId', '==', userId)
    )
    
    const snapshot = await getDocs(q)
    
    const archived: ArchivedRequest[] = []
    snapshot.forEach(doc => {
      const data = doc.data()
      
      // Convert Firestore Timestamps to Dates
      archived.push({
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
        expiresAt: data.expiresAt?.toDate?.() || new Date(data.expiresAt),
        archivedAt: data.archivedAt?.toDate?.() || new Date(data.archivedAt),
        incidentDate: data.incidentDate?.toDate?.() || new Date(data.incidentDate)
      } as ArchivedRequest)
    })
    
    return archived.sort((a, b) => b.archivedAt.getTime() - a.archivedAt.getTime())
    
  } catch (error) {
    console.error('Error getting archived requests:', error)
    return []
  }
}


/**
 * Bulk archive multiple requests at once
 * Useful for cleanup operations
 */
export async function bulkArchiveRequests(
  requestIds: string[], 
  reason: 'fulfilled' | 'expired' | 'cancelled' | 'manual'
): Promise<{ succeeded: string[], failed: string[] }> {
  const succeeded: string[] = []
  const failed: string[] = []
  
  for (const requestId of requestIds) {
    try {
      await archiveRequest(requestId, reason)
      succeeded.push(requestId)
    } catch (error) {
      console.error(`Failed to archive ${requestId}:`, error)
      failed.push(requestId)
    }
  }
  
  console.log(`📦 Bulk archive: ${succeeded.length} succeeded, ${failed.length} failed`)
  
  return { succeeded, failed }
}

/**
 * Get count of archived requests by reason
 * Useful for admin statistics
 */
export async function getArchiveStatistics(): Promise<{
  total: number
  byReason: Record<string, number>
}> {
  try {
    const snapshot = await getDocs(collection(db, 'archivedRequests'))
    
    const stats: {
      total: number
      byReason: Record<string, number>
    } = {
      total: snapshot.size,
      byReason: {
        fulfilled: 0,
        expired: 0,
        cancelled: 0,
        manual: 0
      }
    }
    
    snapshot.forEach(doc => {
      const data = doc.data()
      const reason = (data.archivedReason || 'manual') as string
      stats.byReason[reason] = (stats.byReason[reason] || 0) + 1
    })
    
    return stats
    
  } catch (error) {
    console.error('Error getting archive statistics:', error)
    return {
      total: 0,
      byReason: { fulfilled: 0, expired: 0, cancelled: 0, manual: 0 }
    }
  }
}


/**
 * Automatically archive requests based on rules
 * Rules:
 * - Fulfilled requests: 30 days old
 * - Expired requests: immediately
 * - Cancelled requests: 7 days old
 */
export async function autoArchiveOldRequests(): Promise<{
  archived: number
  details: { fulfilled: number, expired: number, cancelled: number }
}> {
  try {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const allRequestsSnapshot = await getDocs(collection(db, 'footageRequests'))
    
    const toArchive: { id: string, reason: 'fulfilled' | 'expired' | 'cancelled' }[] = []
    
    allRequestsSnapshot.forEach(doc => {
      const data = doc.data()
      const status = data.status
      const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt)
      const expiresAt = data.expiresAt?.toDate?.() || new Date(data.expiresAt)
      
      // Rule 1: Fulfilled requests older than 30 days
      if (status === 'fulfilled' && createdAt < thirtyDaysAgo) {
        toArchive.push({ id: doc.id, reason: 'fulfilled' })
      }
      
      // Rule 2: Expired requests (immediately)
      if (status === 'expired' || expiresAt < now) {
        toArchive.push({ id: doc.id, reason: 'expired' })
      }
      
      // Rule 3: Cancelled requests older than 7 days
      if (status === 'cancelled' && createdAt < sevenDaysAgo) {
        toArchive.push({ id: doc.id, reason: 'cancelled' })
      }
    })
    
    // Archive all matching requests
    const details = { fulfilled: 0, expired: 0, cancelled: 0 }
    
    for (const item of toArchive) {
      try {
        await archiveRequest(item.id, item.reason)
        details[item.reason]++
      } catch (error) {
        console.error(`Failed to auto-archive ${item.id}:`, error)
      }
    }
    
    console.log(`🤖 Auto-archive complete: ${toArchive.length} requests archived`, details)
    
    return {
      archived: toArchive.length,
      details
    }
    
  } catch (error) {
    console.error('Error in auto-archive:', error)
    return {
      archived: 0,
      details: { fulfilled: 0, expired: 0, cancelled: 0 }
    }
  }
}


/**
 * Check if a request should be archived based on current rules
 * Returns null if should not be archived, otherwise returns the reason
 */
export function shouldArchive(request: FootageRequest): 'fulfilled' | 'expired' | 'cancelled' | null {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  const createdAt = request.createdAt instanceof Date 
    ? request.createdAt 
    : request.createdAt?.toDate?.() || new Date(request.createdAt)
    
  const expiresAt = request.expiresAt instanceof Date 
    ? request.expiresAt 
    : request.expiresAt?.toDate?.() || new Date(request.expiresAt)
  
  // Check archiving rules
  if (request.status === 'fulfilled' && createdAt < thirtyDaysAgo) {
    return 'fulfilled'
  }
  
  if (request.status === 'expired' || expiresAt < now) {
    return 'expired'
  }
  
  if (request.status === 'cancelled' && createdAt < sevenDaysAgo) {
    return 'cancelled'
  }
  
  return null
}

/**
 * Permanently delete an archived request
 * Use with caution - this cannot be undone
 */
export async function permanentlyDeleteArchived(requestId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'archivedRequests', requestId))
    console.log(`🗑️ Permanently deleted archived request ${requestId}`)
  } catch (error) {
    console.error('Error deleting archived request:', error)
    throw error
  }
}
