/**
 * Rate Limiting Service
 * Manages user footage request limits to prevent abuse
 * Default: 3 requests per week, resets every Monday
 */

import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from './firebase'

export interface RateLimitData {
  weeklyRequestCount: number
  weeklyLimit: number
  resetDate: Date
  lastRequestDate: Date | null
}

export interface RateLimitStatus {
  allowed: boolean
  remaining: number
  limit: number
  resetDate: Date
  message?: string
}

/**
 * Get the next Monday at midnight (rate limit reset date)
 */
function getNextMonday(): Date {
  const now = new Date()
  const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, etc.
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek // If Sunday, next day is Monday
  
  const nextMonday = new Date(now)
  nextMonday.setDate(now.getDate() + daysUntilMonday)
  nextMonday.setHours(0, 0, 0, 0) // Midnight
  
  return nextMonday
}

/**
 * Check if a user has exceeded their rate limit
 */
export async function checkRateLimit(userId: string): Promise<RateLimitStatus> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId))
    
    if (!userDoc.exists()) {
      return {
        allowed: false,
        remaining: 0,
        limit: 3,
        resetDate: getNextMonday(),
        message: 'User not found'
      }
    }
    
    const userData = userDoc.data()
    const rateLimits = userData.rateLimits || {
      weeklyRequestCount: 0,
      weeklyLimit: 3,
      resetDate: null
    }
    
    const now = new Date()
    let resetDate = rateLimits.resetDate
    
    // Convert Firestore Timestamp to Date if needed
    if (resetDate && typeof resetDate.toDate === 'function') {
      resetDate = (resetDate as Timestamp).toDate()
    } else if (resetDate && !(resetDate instanceof Date)) {
      resetDate = new Date(resetDate)
    }
    
    // Check if we need to reset the counter (past the reset date)
    if (!resetDate || now >= resetDate) {
      // Reset counter and set new reset date
      const newResetDate = getNextMonday()
      
      await updateDoc(doc(db, 'users', userId), {
        'rateLimits.weeklyRequestCount': 0,
        'rateLimits.resetDate': newResetDate,
        'rateLimits.weeklyLimit': rateLimits.weeklyLimit || 3
      })
      
      return {
        allowed: true,
        remaining: rateLimits.weeklyLimit || 3,
        limit: rateLimits.weeklyLimit || 3,
        resetDate: newResetDate,
        message: 'Rate limit reset for new week'
      }
    }
    
    // Check if user has requests remaining
    const remaining = rateLimits.weeklyLimit - rateLimits.weeklyRequestCount
    
    if (remaining <= 0) {
      return {
        allowed: false,
        remaining: 0,
        limit: rateLimits.weeklyLimit,
        resetDate: resetDate,
        message: `Weekly limit reached. Resets ${resetDate.toLocaleDateString()}`
      }
    }
    
    return {
      allowed: true,
      remaining,
      limit: rateLimits.weeklyLimit,
      resetDate: resetDate,
      message: `${remaining} request${remaining === 1 ? '' : 's'} remaining this week`
    }
    
  } catch (error) {
    console.error('Error checking rate limit:', error)
    return {
      allowed: false,
      remaining: 0,
      limit: 3,
      resetDate: getNextMonday(),
      message: 'Error checking rate limit'
    }
  }
}


/**
 * Increment the user's request count
 * Call this AFTER successfully creating a footage request
 */
export async function incrementRequestCount(userId: string): Promise<void> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId))
    
    if (!userDoc.exists()) {
      throw new Error('User not found')
    }
    
    const userData = userDoc.data()
    const rateLimits = userData.rateLimits || {
      weeklyRequestCount: 0,
      weeklyLimit: 3,
      resetDate: getNextMonday()
    }
    
    // Increment the counter
    await updateDoc(doc(db, 'users', userId), {
      'rateLimits.weeklyRequestCount': rateLimits.weeklyRequestCount + 1,
      'rateLimits.lastRequestDate': serverTimestamp()
    })
    
    console.log(`✅ Rate limit updated for user ${userId}: ${rateLimits.weeklyRequestCount + 1}/${rateLimits.weeklyLimit}`)
    
  } catch (error) {
    console.error('Error incrementing request count:', error)
    throw error
  }
}

/**
 * Get current rate limit status for display
 * Returns null if user doesn't exist or has no limits
 */
export async function getRateLimitStatus(userId: string): Promise<RateLimitData | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId))
    
    if (!userDoc.exists()) {
      return null
    }
    
    const userData = userDoc.data()
    const rateLimits = userData.rateLimits
    
    if (!rateLimits) {
      return {
        weeklyRequestCount: 0,
        weeklyLimit: 3,
        resetDate: getNextMonday(),
        lastRequestDate: null
      }
    }
    
    // Convert Timestamps to Dates
    let resetDate = rateLimits.resetDate
    if (resetDate && typeof resetDate.toDate === 'function') {
      resetDate = (resetDate as Timestamp).toDate()
    }
    
    let lastRequestDate = rateLimits.lastRequestDate
    if (lastRequestDate && typeof lastRequestDate.toDate === 'function') {
      lastRequestDate = (lastRequestDate as Timestamp).toDate()
    }
    
    return {
      weeklyRequestCount: rateLimits.weeklyRequestCount || 0,
      weeklyLimit: rateLimits.weeklyLimit || 3,
      resetDate: resetDate || getNextMonday(),
      lastRequestDate: lastRequestDate || null
    }
    
  } catch (error) {
    console.error('Error getting rate limit status:', error)
    return null
  }
}


/**
 * Admin function: Set custom rate limit for a specific user
 * Useful for premium users, trusted users, or temporarily banning
 */
export async function setCustomRateLimit(
  userId: string, 
  newLimit: number
): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', userId), {
      'rateLimits.weeklyLimit': newLimit,
      'rateLimits.updatedAt': serverTimestamp()
    })
    
    console.log(`✅ Custom rate limit set for user ${userId}: ${newLimit} requests/week`)
    
  } catch (error) {
    console.error('Error setting custom rate limit:', error)
    throw error
  }
}

/**
 * Admin function: Reset rate limit counter for a user
 * Useful for manual intervention or premium users
 */
export async function resetRateLimit(userId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', userId), {
      'rateLimits.weeklyRequestCount': 0,
      'rateLimits.resetDate': getNextMonday(),
      'rateLimits.updatedAt': serverTimestamp()
    })
    
    console.log(`✅ Rate limit reset for user ${userId}`)
    
  } catch (error) {
    console.error('Error resetting rate limit:', error)
    throw error
  }
}
