import { NextRequest, NextResponse } from 'next/server'

/**
 * Email API Route - Server-Side Only
 * POST /api/email/send
 */

interface EmailRequest {
  type: 'welcome' | 'footage-request' | 'footage-match' | 'footage-shared' | 'camera-approved' | 'camera-rejected' | 'request-expired'
  to: string
  data: any
}

export async function POST(request: NextRequest) {
  try {
    const body: EmailRequest = await request.json()
    
    // Dynamic import SendGrid only on server
    const sgMail = (await import('@sendgrid/mail')).default
    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || ''
    const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@neighbourhoodwatchplus.com'
    
    if (!SENDGRID_API_KEY) {
      console.log(`📧 [EMAIL LOG] Would send ${body.type} email to ${body.to}`)
      return NextResponse.json({ success: false, message: 'API key not configured' })
    }
    
    sgMail.setApiKey(SENDGRID_API_KEY)
    
    // Generate email based on type
    let subject = ''
    let html = ''
    
    switch (body.type) {
      case 'welcome':
        subject = 'Welcome to Neighbourhood Watch+! 🏘️'
        html = generateWelcomeEmail(body.data.userName)
        break
      
      case 'footage-request':
        subject = `🔔 New Footage Request: ${body.data.incidentType}`
        html = generateFootageRequestEmail(body.data)
        break
        
      case 'footage-match':
        subject = '✨ Your Footage Matched an Incident'
        html = generateFootageMatchEmail(body.data)
        break
        
      case 'footage-shared':
        subject = '📹 Footage Available for Your Request'
        html = generateFootageSharedEmail(body.data)
        break
        
      case 'camera-approved':
        subject = '✅ Camera Verified and Approved'
        html = generateCameraApprovedEmail(body.data)
        break
        
      case 'camera-rejected':
        subject = 'Camera Verification Update'
        html = generateCameraRejectedEmail(body.data)
        break
        
      case 'request-expired':
        subject = 'Footage Request Expired'
        html = generateRequestExpiredEmail(body.data)
        break
        
      default:
        return NextResponse.json({ success: false, message: 'Invalid email type' }, { status: 400 })
    }
    
    await sgMail.send({
      to: body.to,
      from: { email: FROM_EMAIL, name: 'Neighbourhood Watch+' },
      subject,
      html
    })
    
    console.log(`✅ Email sent to ${body.to}: ${subject}`)
    return NextResponse.json({ success: true })
    
  } catch (error: any) {
    console.error('❌ Email API error:', error)
    return NextResponse.json({ 
      success: false, 
      message: error.message 
    }, { status: 500 })
  }
}

// Email template generators (simplified versions)
function emailTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; margin: 0 auto;">
    <tr><td style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🏘️ Neighbourhood Watch+</h1>
    </td></tr>
    <tr><td style="padding: 40px 30px;">${content}</td></tr>
    <tr><td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-radius: 0 0 8px 8px;">
      <p style="margin: 0; font-size: 12px; color: #6b7280;">Neighbourhood Watch+ | Privacy-First Community Security</p>
    </td></tr>
  </table>
</body>
</html>`
}

function generateWelcomeEmail(userName: string): string {
  return emailTemplate(`
    <h2 style="color: #111827; margin: 0 0 20px 0;">Welcome! 👋</h2>
    <p style="color: #374151;">Hi ${userName}, thank you for joining Neighbourhood Watch+.</p>
  `)
}

function generateFootageRequestEmail(data: any): string {
  return emailTemplate(`
    <h2 style="color: #111827; margin: 0 0 20px 0;">📹 New Footage Request</h2>
    <p style="color: #374151;">Hi ${data.ownerName}, a community member has requested footage.</p>
    <div style="background-color: #f9fafb; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Type:</strong> ${data.incidentType}</p>
      <p style="margin: 0;"><strong>Location:</strong> ${data.incidentLocation}</p>
    </div>
  `)
}

function generateFootageMatchEmail(data: any): string {
  return emailTemplate(`
    <h2 style="color: #111827;">🎯 Your Footage Matches!</h2>
    <p style="color: #374151;">Hi ${data.ownerName}, your footage matches a nearby incident (${data.matchDistance}m away).</p>
  `)
}

function generateFootageSharedEmail(data: any): string {
  return emailTemplate(`
    <h2 style="color: #111827;">✅ Footage Shared</h2>
    <p style="color: #374151;">Hi ${data.requesterName}, ${data.cameraOwner} has shared footage for your ${data.incidentType} request.</p>
  `)
}

function generateCameraApprovedEmail(data: any): string {
  return emailTemplate(`
    <h2 style="color: #111827;">✅ Camera Approved!</h2>
    <p style="color: #374151;">Hi ${data.ownerName}, your camera "${data.cameraName}" has been verified and is now active.</p>
  `)
}

function generateCameraRejectedEmail(data: any): string {
  return emailTemplate(`
    <h2 style="color: #111827;">Camera Update</h2>
    <p style="color: #374151;">Hi ${data.ownerName}, we couldn't approve "${data.cameraName}" at this time.</p>
    <p style="color: #991b1b;"><strong>Reason:</strong> ${data.reason}</p>
  `)
}

function generateRequestExpiredEmail(data: any): string {
  return emailTemplate(`
    <h2 style="color: #111827;">⏰ Request Expired</h2>
    <p style="color: #374151;">Hi ${data.ownerName}, a ${data.incidentType} footage request has expired.</p>
  `)
}
