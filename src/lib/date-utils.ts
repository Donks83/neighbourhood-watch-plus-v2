import type { Timestamp } from 'firebase/firestore'

/**
 * Convert Firestore Timestamp or Date to JavaScript Date
 */
export function toDate(dateValue: Date | Timestamp | string | number): Date {
  if (!dateValue) return new Date()
  
  // If it's already a Date object
  if (dateValue instanceof Date) {
    return dateValue
  }
  
  // If it's a Firestore Timestamp
  if (dateValue && typeof dateValue === 'object' && 'toDate' in dateValue) {
    return (dateValue as Timestamp).toDate()
  }
  
  // If it's a string or number, convert to Date
  return new Date(dateValue)
}

/**
 * Format date for display
 */
export function formatDate(dateValue: Date | Timestamp | string | number): string {
  try {
    const date = toDate(dateValue)
    return date.toLocaleDateString()
  } catch (error) {
    console.warn('Invalid date value:', dateValue)
    return 'Invalid date'
  }
}

/**
 * Format date and time for display
 */
export function formatDateTime(dateValue: Date | Timestamp | string | number): string {
  try {
    const date = toDate(dateValue)
    return date.toLocaleString()
  } catch (error) {
    console.warn('Invalid date value:', dateValue)
    return 'Invalid date'
  }
}

/**
 * Format time for display
 */
export function formatTime(dateValue: Date | Timestamp | string | number): string {
  try {
    const date = toDate(dateValue)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch (error) {
    console.warn('Invalid time value:', dateValue)
    return 'Invalid time'
  }
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateValue: Date | Timestamp | string | number): string {
  try {
    const date = toDate(dateValue)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return formatDate(date)
  } catch (error) {
    console.warn('Invalid date value:', dateValue)
    return 'Unknown'
  }
}

/**
 * Check if a date is valid
 */
export function isValidDate(dateValue: any): boolean {
  try {
    const date = toDate(dateValue)
    return date instanceof Date && !isNaN(date.getTime())
  } catch (error) {
    return false
  }
}

/**
 * Get current timestamp for Firestore
 */
export function getCurrentTimestamp(): Date {
  return new Date()
}

/**
 * Format date for input fields (YYYY-MM-DD)
 */
export function formatDateForInput(dateValue: Date | Timestamp | string | number): string {
  try {
    const date = toDate(dateValue)
    return date.toISOString().split('T')[0]
  } catch (error) {
    return new Date().toISOString().split('T')[0]
  }
}

/**
 * Format time for input fields (HH:MM)
 */
export function formatTimeForInput(dateValue: Date | Timestamp | string | number): string {
  try {
    const date = toDate(dateValue)
    return date.toTimeString().slice(0, 5)
  } catch (error) {
    const now = new Date()
    return now.toTimeString().slice(0, 5)
  }
}
