/**
 * Email Blocking Service
 * Prevents disposable and blocked email domains from registering
 */

import { 
  collection, 
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp
} from 'firebase/firestore'
import { db } from './firebase'

// Common disposable email domains (initial list)
const DEFAULT_BLOCKED_DOMAINS = [
  // Popular disposable email services
  'mailinator.com',
  'guerrillamail.com',
  '10minutemail.com',
  'tempmail.com',
  'throwaway.email',
  'temp-mail.org',
  'fakeinbox.com',
  'yopmail.com',
  'maildrop.cc',
  'getnada.com',
  
  // Additional disposable services
  'trashmail.com',
  'sharklasers.com',
  'guerrillamail.info',
  'grr.la',
  'guerrillamail.biz',
  'guerrillamail.de',
  'spam4.me',
  'mailnesia.com',
  'mytrashmail.com',
  'mt2009.com',
  
  // Temporary inboxes
  'mohmal.com',
  'emailondeck.com',
  'dispostable.com',
  'mintemail.com',
  'jetable.org',
  'throwawaymail.com',
  'getairmail.com',
  'mailcatch.com',
  'mailexpire.com',
  'tempemail.net'
]

export interface BlockedEmailConfig {
  domains: string[]
  lastUpdated: any
  updatedBy?: string
  blockAttempts?: number
}

/**
 * Initialize blocked email configuration if it doesn't exist
 */
export async function initializeBlockedEmails(): Promise<void> {
  try {
    const configRef = doc(db, 'config', 'blockedEmails')
    const configSnap = await getDoc(configRef)
    
    if (!configSnap.exists()) {
      await setDoc(configRef, {
        domains: DEFAULT_BLOCKED_DOMAINS,
        lastUpdated: serverTimestamp(),
        blockAttempts: 0
      })
      console.log('✅ Initialized blocked emails configuration')
    }
  } catch (error) {
    console.error('❌ Error initializing blocked emails:', error)
    throw error
  }
}

/**
 * Get list of blocked email domains
 */
export async function getBlockedDomains(): Promise<string[]> {
  try {
    const configRef = doc(db, 'config', 'blockedEmails')
    const configSnap = await getDoc(configRef)
    
    if (!configSnap.exists()) {
      // Initialize if doesn't exist
      await initializeBlockedEmails()
      return DEFAULT_BLOCKED_DOMAINS
    }
    
    const data = configSnap.data() as BlockedEmailConfig
    return data.domains || []
  } catch (error) {
    console.error('❌ Error getting blocked domains:', error)
    // Fallback to default list on error
    return DEFAULT_BLOCKED_DOMAINS
  }
}

/**
 * Check if an email address uses a blocked domain
 */
export async function isEmailBlocked(email: string): Promise<boolean> {
  try {
    const domain = email.toLowerCase().split('@')[1]
    if (!domain) return false
    
    const blockedDomains = await getBlockedDomains()
    const isBlocked = blockedDomains.includes(domain)
    
    if (isBlocked) {
      // Increment block attempt counter
      await incrementBlockAttempts()
      console.log(`🚫 Blocked email attempt: ${email}`)
    }
    
    return isBlocked
  } catch (error) {
    console.error('❌ Error checking email:', error)
    // Fail open - don't block on error
    return false
  }
}

/**
 * Add a domain to the blocked list (admin only)
 */
export async function addBlockedDomain(domain: string, adminId: string): Promise<void> {
  try {
    const normalizedDomain = domain.toLowerCase().trim()
    
    // Validate domain format
    if (!normalizedDomain.includes('.') || normalizedDomain.includes('@')) {
      throw new Error('Invalid domain format. Use format: example.com')
    }
    
    const configRef = doc(db, 'config', 'blockedEmails')
    await updateDoc(configRef, {
      domains: arrayUnion(normalizedDomain),
      lastUpdated: serverTimestamp(),
      updatedBy: adminId
    })
    
    console.log(`✅ Added blocked domain: ${normalizedDomain}`)
  } catch (error) {
    console.error('❌ Error adding blocked domain:', error)
    throw error
  }
}

/**
 * Remove a domain from the blocked list (admin only)
 */
export async function removeBlockedDomain(domain: string, adminId: string): Promise<void> {
  try {
    const normalizedDomain = domain.toLowerCase().trim()
    
    const configRef = doc(db, 'config', 'blockedEmails')
    await updateDoc(configRef, {
      domains: arrayRemove(normalizedDomain),
      lastUpdated: serverTimestamp(),
      updatedBy: adminId
    })
    
    console.log(`✅ Removed blocked domain: ${normalizedDomain}`)
  } catch (error) {
    console.error('❌ Error removing blocked domain:', error)
    throw error
  }
}

/**
 * Increment the block attempt counter
 */
async function incrementBlockAttempts(): Promise<void> {
  try {
    const configRef = doc(db, 'config', 'blockedEmails')
    const configSnap = await getDoc(configRef)
    
    if (configSnap.exists()) {
      const currentCount = configSnap.data().blockAttempts || 0
      await updateDoc(configRef, {
        blockAttempts: currentCount + 1
      })
    }
  } catch (error) {
    // Non-critical, just log
    console.warn('⚠️ Failed to increment block attempts:', error)
  }
}

/**
 * Get blocked email statistics
 */
export async function getBlockedEmailStats(): Promise<{
  totalBlockedDomains: number
  blockAttempts: number
  lastUpdated: any
}> {
  try {
    const configRef = doc(db, 'config', 'blockedEmails')
    const configSnap = await getDoc(configRef)
    
    if (!configSnap.exists()) {
      return {
        totalBlockedDomains: 0,
        blockAttempts: 0,
        lastUpdated: null
      }
    }
    
    const data = configSnap.data() as BlockedEmailConfig
    return {
      totalBlockedDomains: data.domains?.length || 0,
      blockAttempts: data.blockAttempts || 0,
      lastUpdated: data.lastUpdated
    }
  } catch (error) {
    console.error('❌ Error getting blocked email stats:', error)
    return {
      totalBlockedDomains: 0,
      blockAttempts: 0,
      lastUpdated: null
    }
  }
}

/**
 * Validate email format
 */
export function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Get user-friendly error message for blocked email
 */
export function getBlockedEmailMessage(email: string): string {
  const domain = email.split('@')[1]
  return `The email domain "${domain}" is not allowed. Please use a permanent email address from a standard email provider (Gmail, Outlook, Yahoo, etc.).`
}
