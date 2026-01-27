/**
 * Email Helper (Client-Safe)
 * Calls the email API route instead of using SendGrid directly
 * Can be safely imported by both client and server code
 */

interface EmailData {
  // Welcome
  userName?: string
  
  // Footage Request
  ownerName?: string
  incidentType?: string
  incidentLocation?: string
  requestedTime?: string
  requestId?: string
  
  // Footage Match
  matchDistance?: number
  
  // Footage Shared
  requesterName?: string
  cameraOwner?: string
  
  // Camera Approved/Rejected
  cameraName?: string
  reason?: string
}

async function sendEmailViaAPI(type: string, to: string, data: EmailData): Promise<boolean> {
  try {
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, to, data })
    })
    
    const result = await response.json()
    return result.success
  } catch (error) {
    console.error(`❌ Failed to send ${type} email:`, error)
    return false
  }
}

export async function sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean> {
  return sendEmailViaAPI('welcome', userEmail, { userName })
}

export async function sendFootageRequestEmail(
  ownerEmail: string,
  ownerName: string,
  incidentType: string,
  incidentLocation: string,
  requestedTime: string,
  requestId: string
): Promise<boolean> {
  return sendEmailViaAPI('footage-request', ownerEmail, {
    ownerName,
    incidentType,
    incidentLocation,
    requestedTime,
    requestId
  })
}

export async function sendFootageMatchEmail(
  ownerEmail: string,
  ownerName: string,
  incidentType: string,
  matchDistance: number,
  requestId: string
): Promise<boolean> {
  return sendEmailViaAPI('footage-match', ownerEmail, {
    ownerName,
    incidentType,
    matchDistance,
    requestId
  })
}

export async function sendFootageSharedEmail(
  requesterEmail: string,
  requesterName: string,
  cameraOwner: string,
  incidentType: string,
  requestId: string
): Promise<boolean> {
  return sendEmailViaAPI('footage-shared', requesterEmail, {
    requesterName,
    cameraOwner,
    incidentType,
    requestId
  })
}

export async function sendCameraApprovedEmail(
  ownerEmail: string,
  ownerName: string,
  cameraName: string
): Promise<boolean> {
  return sendEmailViaAPI('camera-approved', ownerEmail, {
    ownerName,
    cameraName
  })
}

export async function sendCameraRejectedEmail(
  ownerEmail: string,
  ownerName: string,
  cameraName: string,
  reason: string
): Promise<boolean> {
  return sendEmailViaAPI('camera-rejected', ownerEmail, {
    ownerName,
    cameraName,
    reason
  })
}

export async function sendRequestExpiredEmail(
  ownerEmail: string,
  ownerName: string,
  incidentType: string
): Promise<boolean> {
  return sendEmailViaAPI('request-expired', ownerEmail, {
    ownerName,
    incidentType
  })
}

export default {
  sendWelcomeEmail,
  sendFootageRequestEmail,
  sendFootageMatchEmail,
  sendFootageSharedEmail,
  sendCameraApprovedEmail,
  sendCameraRejectedEmail,
  sendRequestExpiredEmail
}
