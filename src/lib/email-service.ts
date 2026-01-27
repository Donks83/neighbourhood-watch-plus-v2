/**
 * SendGrid Email Service (Server-Side Only)
 * Handles all email notifications for Neighbourhood Watch+
 * 
 * IMPORTANT: This module uses Node.js APIs and can only run on the server.
 * All functions check for server-side execution automatically.
 */

// Dynamic import helper for SendGrid (server-side only)
async function getSendGridClient() {
  if (typeof window !== 'undefined') {
    console.warn('⚠️ SendGrid cannot be used in browser context')
    return null
  }
  
  const sgMail = (await import('@sendgrid/mail')).default
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || ''
  
  if (SENDGRID_API_KEY && !sgMail.apiKey) {
    sgMail.setApiKey(SENDGRID_API_KEY)
  }
  
  return SENDGRID_API_KEY ? sgMail : null
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@neighbourhoodwatchplus.com'
const FROM_NAME = 'Neighbourhood Watch+'

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * Send email via SendGrid (Server-Side Only)
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // Server-side check
  if (typeof window !== 'undefined') {
    console.warn('⚠️ sendEmail called from browser - emails can only be sent from server')
    return false
  }

  try {
    const sgMail = await getSendGridClient()
    
    // If no API key, just log
    if (!sgMail) {
      console.log(`📧 [EMAIL LOG] To: ${options.to}`)
      console.log(`📧 [EMAIL LOG] Subject: ${options.subject}`)
      console.log(`📧 [EMAIL LOG] Would send email (API key not configured)`)
      return false
    }

    const msg = {
      to: options.to,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME
      },
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, '') // Strip HTML for text version
    }

    await sgMail.send(msg)
    console.log(`✅ Email sent to ${options.to}: ${options.subject}`)
    return true
  } catch (error: any) {
    console.error(`❌ Failed to send email to ${options.to}:`, error.response?.body || error.message)
    return false
  }
}

/**
 * Email template wrapper with consistent styling
 */
function emailTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Neighbourhood Watch+</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">🏘️ Neighbourhood Watch+</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; font-size: 12px; color: #6b7280;">
                Neighbourhood Watch+ | Privacy-First Community Security
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                <a href="https://neighbourhoodwatchplus.com/settings" style="color: #3b82f6; text-decoration: none;">Manage Preferences</a> | 
                <a href="https://neighbourhoodwatchplus.com/privacy" style="color: #3b82f6; text-decoration: none;">Privacy Policy</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

/**
 * Button component for emails
 */
function emailButton(text: string, url: string, color: string = '#3b82f6'): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
      <tr>
        <td align="center">
          <a href="${url}" style="display: inline-block; padding: 12px 30px; background-color: ${color}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `
}

// =============================================================================
// EMAIL TEMPLATES
// =============================================================================

/**
 * Welcome email for new users
 */
export async function sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean> {
  const content = `
    <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 20px;">Welcome to Neighbourhood Watch+! 👋</h2>
    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
      Hi ${userName || 'there'},
    </p>
    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
      Thank you for joining Neighbourhood Watch+, the privacy-first community security platform.
    </p>
    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
      <strong>What you can do:</strong>
    </p>
    <ul style="color: #374151; line-height: 1.8; margin: 0 0 20px 0; padding-left: 20px;">
      <li>📹 Register your security cameras to help the community</li>
      <li>🔍 Report incidents and request footage from nearby cameras</li>
      <li>🤝 Share footage voluntarily when you can help</li>
      <li>🔒 Your privacy is always protected with location fuzzing</li>
    </ul>
    ${emailButton('Get Started', 'https://neighbourhoodwatchplus.com/dashboard')}
    <p style="color: #6b7280; line-height: 1.6; margin: 20px 0 0 0; font-size: 14px;">
      Need help getting started? Check out our <a href="https://neighbourhoodwatchplus.com/help" style="color: #3b82f6;">Help Center</a>.
    </p>
  `

  return sendEmail({
    to: userEmail,
    subject: 'Welcome to Neighbourhood Watch+! 🏘️',
    html: emailTemplate(content)
  })
}

/**
 * Footage request notification to camera owner
 */
export async function sendFootageRequestEmail(
  ownerEmail: string,
  ownerName: string,
  incidentType: string,
  incidentLocation: string,
  requestedTime: string,
  requestId: string
): Promise<boolean> {
  const content = `
    <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 20px;">📹 New Footage Request</h2>
    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
      Hi ${ownerName},
    </p>
    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
      A community member has requested footage from your camera for an incident near your location.
    </p>
    <div style="background-color: #f9fafb; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0 0 10px 0; color: #374151;"><strong>Incident Type:</strong> ${incidentType}</p>
      <p style="margin: 0 0 10px 0; color: #374151;"><strong>Location:</strong> ${incidentLocation}</p>
      <p style="margin: 0; color: #374151;"><strong>Time:</strong> ${requestedTime}</p>
    </div>
    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
      <strong>Your privacy is protected:</strong> Your exact camera location is never revealed. You can choose to approve or decline this request.
    </p>
    ${emailButton('View Request', `https://neighbourhoodwatchplus.com/requests/${requestId}`)}
    <p style="color: #6b7280; line-height: 1.6; margin: 20px 0 0 0; font-size: 14px;">
      You're receiving this because your camera is registered with Neighbourhood Watch+. You can manage notification preferences in your account settings.
    </p>
  `

  return sendEmail({
    to: ownerEmail,
    subject: `🔔 New Footage Request: ${incidentType}`,
    html: emailTemplate(content)
  })
}

/**
 * Footage match notification for temporary marker owners
 */
export async function sendFootageMatchEmail(
  ownerEmail: string,
  ownerName: string,
  incidentType: string,
  matchDistance: number,
  requestId: string
): Promise<boolean> {
  const content = `
    <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 20px;">🎯 Your Footage Matches an Incident!</h2>
    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
      Hi ${ownerName},
    </p>
    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
      Great news! The temporary footage you registered matches a nearby incident report.
    </p>
    <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0 0 10px 0; color: #374151;"><strong>Incident Type:</strong> ${incidentType}</p>
      <p style="margin: 0; color: #374151;"><strong>Distance:</strong> Approximately ${matchDistance}m from your footage</p>
    </div>
    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
      Your footage could help resolve this incident. You can review the request and decide whether to share.
    </p>
    ${emailButton('View Match', `https://neighbourhoodwatchplus.com/requests/${requestId}`, '#10b981')}
  `

  return sendEmail({
    to: ownerEmail,
    subject: '✨ Your Footage Matched an Incident',
    html: emailTemplate(content)
  })
}

/**
 * Footage shared confirmation to requester
 */
export async function sendFootageSharedEmail(
  requesterEmail: string,
  requesterName: string,
  cameraOwner: string,
  incidentType: string,
  requestId: string
): Promise<boolean> {
  const content = `
    <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 20px;">✅ Footage Has Been Shared</h2>
    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
      Hi ${requesterName},
    </p>
    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
      Good news! A camera owner has shared footage for your incident report.
    </p>
    <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0 0 10px 0; color: #374151;"><strong>Incident Type:</strong> ${incidentType}</p>
      <p style="margin: 0; color: #374151;"><strong>From:</strong> ${cameraOwner}</p>
    </div>
    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
      You can now view and download the footage to help with your investigation.
    </p>
    ${emailButton('View Footage', `https://neighbourhoodwatchplus.com/requests/${requestId}`, '#10b981')}
    <p style="color: #6b7280; line-height: 1.6; margin: 20px 0 0 0; font-size: 14px;">
      <strong>Remember:</strong> All footage is shared voluntarily. Please treat it respectfully and use it only for its intended purpose.
    </p>
  `

  return sendEmail({
    to: requesterEmail,
    subject: '📹 Footage Available for Your Request',
    html: emailTemplate(content)
  })
}

/**
 * Camera verification approved
 */
export async function sendCameraApprovedEmail(
  ownerEmail: string,
  ownerName: string,
  cameraName: string
): Promise<boolean> {
  const content = `
    <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 20px;">✅ Camera Approved!</h2>
    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
      Hi ${ownerName},
    </p>
    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
      Great news! Your camera "<strong>${cameraName}</strong>" has been verified and approved.
    </p>
    <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #065f46; font-weight: 600;">
        ✓ Your camera is now active and visible to the community
      </p>
    </div>
    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
      Your camera will now appear on the community map (with privacy fuzzing) and you'll start receiving footage requests when incidents occur nearby.
    </p>
    ${emailButton('View Dashboard', 'https://neighbourhoodwatchplus.com/dashboard', '#10b981')}
    <p style="color: #6b7280; line-height: 1.6; margin: 20px 0 0 0; font-size: 14px;">
      Thank you for contributing to community safety! 🙏
    </p>
  `

  return sendEmail({
    to: ownerEmail,
    subject: '✅ Camera Verified and Approved',
    html: emailTemplate(content)
  })
}

/**
 * Camera verification rejected
 */
export async function sendCameraRejectedEmail(
  ownerEmail: string,
  ownerName: string,
  cameraName: string,
  reason: string
): Promise<boolean> {
  const content = `
    <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 20px;">Camera Verification Update</h2>
    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
      Hi ${ownerName},
    </p>
    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
      We've reviewed your camera registration for "<strong>${cameraName}</strong>".
    </p>
    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0 0 10px 0; color: #991b1b; font-weight: 600;">
        Unfortunately, we were unable to approve your camera at this time.
      </p>
      <p style="margin: 0; color: #7f1d1d;">
        <strong>Reason:</strong> ${reason}
      </p>
    </div>
    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
      <strong>What you can do:</strong>
    </p>
    <ul style="color: #374151; line-height: 1.8; margin: 0 0 20px 0; padding-left: 20px;">
      <li>Review the feedback above</li>
      <li>Update your camera details if needed</li>
      <li>Resubmit for verification</li>
      <li>Contact support if you have questions</li>
    </ul>
    ${emailButton('Update Camera', 'https://neighbourhoodwatchplus.com/cameras', '#3b82f6')}
    <p style="color: #6b7280; line-height: 1.6; margin: 20px 0 0 0; font-size: 14px;">
      Need help? <a href="mailto:support@neighbourhoodwatchplus.com" style="color: #3b82f6;">Contact our support team</a>.
    </p>
  `

  return sendEmail({
    to: ownerEmail,
    subject: 'Camera Verification Update',
    html: emailTemplate(content)
  })
}

/**
 * Request expired notification
 */
export async function sendRequestExpiredEmail(
  ownerEmail: string,
  ownerName: string,
  incidentType: string
): Promise<boolean> {
  const content = `
    <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 20px;">⏰ Footage Request Expired</h2>
    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
      Hi ${ownerName},
    </p>
    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
      A footage request for a <strong>${incidentType}</strong> incident has expired without receiving footage.
    </p>
    <p style="color: #6b7280; line-height: 1.6; margin: 0 0 15px 0; font-size: 14px;">
      The 7-day response window has closed. If you still have relevant footage and want to help, you can contact the requester directly.
    </p>
  `

  return sendEmail({
    to: ownerEmail,
    subject: 'Footage Request Expired',
    html: emailTemplate(content)
  })
}

export default {
  sendEmail,
  sendWelcomeEmail,
  sendFootageRequestEmail,
  sendFootageMatchEmail,
  sendFootageSharedEmail,
  sendCameraApprovedEmail,
  sendCameraRejectedEmail,
  sendRequestExpiredEmail
}
