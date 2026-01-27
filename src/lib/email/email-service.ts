/**
 * SendGrid Email Service
 * Handles all email notifications for Neighbourhood Watch+
 */

// Email sending is only available in server-side contexts
// This module should only be imported in API routes or server components

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * Send email via SendGrid API
 * Only works server-side (API routes, server actions)
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
  const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'notifications@neighbourhoodwatchplus.com'
  
  if (!SENDGRID_API_KEY) {
    console.log(`📧 [EMAIL LOG] To: ${options.to}`)
    console.log(`📧 [EMAIL LOG] Subject: ${options.subject}`)
    console.log(`📧 [EMAIL LOG] SendGrid not configured - email logged only`)
    return false
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: options.to }]
        }],
        from: {
          email: FROM_EMAIL,
          name: 'Neighbourhood Watch+'
        },
        subject: options.subject,
        content: [
          {
            type: 'text/html',
            value: options.html
          },
          ...(options.text ? [{
            type: 'text/plain',
            value: options.text
          }] : [])
        ]
      })
    })

    if (response.ok) {
      console.log(`✅ Email sent to ${options.to}: ${options.subject}`)
      return true
    } else {
      const error = await response.text()
      console.error(`❌ SendGrid error:`, error)
      return false
    }
  } catch (error: any) {
    console.error(`❌ Failed to send email:`, error.message)
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
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
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
                You can manage notification preferences in your account settings
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
// EMAIL NOTIFICATION FUNCTIONS
// =============================================================================

/**
 * 1. New footage request - sent to camera owners
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
    ${emailButton('View Request', `${process.env.NEXT_PUBLIC_APP_URL || 'https://neighbourhoodwatchplus.com'}/dashboard`)}
    <p style="color: #6b7280; line-height: 1.6; margin: 20px 0 0 0; font-size: 14px;">
      Request ID: ${requestId}
    </p>
  `

  return sendEmail({
    to: ownerEmail,
    subject: `🔔 New Footage Request: ${incidentType}`,
    html: emailTemplate(content)
  })
}

/**
 * 2. Footage shared - sent to requester
 */
export async function sendFootageSharedEmail(
  requesterEmail: string,
  requesterName: string,
  cameraOwnerName: string,
  incidentType: string
): Promise<boolean> {
  const content = `
    <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 20px;">✅ Footage Has Been Shared</h2>
    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
      Hi ${requesterName},
    </p>
    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
      Good news! A camera owner has shared footage for your <strong>${incidentType}</strong> incident report.
    </p>
    <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #065f46; font-weight: 600;">
        ✓ Footage is now available for download
      </p>
    </div>
    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
      You can now view and download the footage from your dashboard.
    </p>
    ${emailButton('View Footage', `${process.env.NEXT_PUBLIC_APP_URL || 'https://neighbourhoodwatchplus.com'}/dashboard`, '#10b981')}
    <p style="color: #6b7280; line-height: 1.6; margin: 20px 0 0 0; font-size: 14px;">
      <strong>Remember:</strong> Please treat shared footage respectfully and use it only for its intended purpose.
    </p>
  `

  return sendEmail({
    to: requesterEmail,
    subject: '📹 Footage Available for Your Request',
    html: emailTemplate(content)
  })
}

/**
 * 3. Camera approved - sent to camera owner
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
      Your camera will now appear on the community map (with privacy protection) and you'll start receiving footage requests when incidents occur nearby.
    </p>
    ${emailButton('View Dashboard', `${process.env.NEXT_PUBLIC_APP_URL || 'https://neighbourhoodwatchplus.com'}/dashboard`, '#10b981')}
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
 * 4. Camera rejected - sent to camera owner
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
        We were unable to approve your camera at this time.
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
    </ul>
    ${emailButton('Update Camera', `${process.env.NEXT_PUBLIC_APP_URL || 'https://neighbourhoodwatchplus.com'}/dashboard`, '#3b82f6')}
  `

  return sendEmail({
    to: ownerEmail,
    subject: 'Camera Verification Update',
    html: emailTemplate(content)
  })
}

/**
 * 5. Temporary marker matched - sent to marker owner
 */
export async function sendTemporaryMarkerMatchEmail(
  ownerEmail: string,
  ownerName: string,
  incidentType: string,
  matchDistance: number
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
    ${emailButton('View Match', `${process.env.NEXT_PUBLIC_APP_URL || 'https://neighbourhoodwatchplus.com'}/dashboard`, '#10b981')}
  `

  return sendEmail({
    to: ownerEmail,
    subject: '✨ Your Footage Matched an Incident',
    html: emailTemplate(content)
  })
}

/**
 * 6. Welcome email for new users
 */
export async function sendWelcomeEmail(
  userEmail: string,
  userName: string
): Promise<boolean> {
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
      <li>🔒 Your privacy is always protected</li>
    </ul>
    ${emailButton('Get Started', `${process.env.NEXT_PUBLIC_APP_URL || 'https://neighbourhoodwatchplus.com'}/dashboard`)}
  `

  return sendEmail({
    to: userEmail,
    subject: 'Welcome to Neighbourhood Watch+! 🏘️',
    html: emailTemplate(content)
  })
}

export default {
  sendEmail,
  sendFootageRequestEmail,
  sendFootageSharedEmail,
  sendCameraApprovedEmail,
  sendCameraRejectedEmail,
  sendTemporaryMarkerMatchEmail,
  sendWelcomeEmail
}
