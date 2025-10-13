import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Security Headers Middleware
 * 
 * Implements comprehensive security headers including:
 * - Content Security Policy (CSP)
 * - X-Frame-Options
 * - X-Content-Type-Options
 * - Referrer-Policy
 * - Permissions-Policy
 * - Strict-Transport-Security (HSTS)
 */

export function middleware(request: NextRequest) {
  // Clone the request headers
  const requestHeaders = new Headers(request.headers)
  
  // Create response
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // Get nonce for inline scripts (for CSP)
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  
  // Set CSP nonce in header for use in HTML
  response.headers.set('x-nonce', nonce)

  // Content Security Policy
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://www.gstatic.com https://cdn.jsdelivr.net https://unpkg.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.maptiler.com https://cdn.jsdelivr.net;
    img-src 'self' data: blob: https: https://api.maptiler.com https://tiles.stadiamaps.com https://*.tile.openstreetmap.org https://firebasestorage.googleapis.com https://images.unsplash.com;
    font-src 'self' data: https://fonts.gstatic.com https://api.maptiler.com;
    connect-src 'self' 
      https://*.googleapis.com 
      https://*.google.com
      https://*.firebaseio.com 
      https://*.cloudfunctions.net 
      https://firestore.googleapis.com 
      https://identitytoolkit.googleapis.com
      https://securetoken.googleapis.com
      https://api.maptiler.com 
      https://tiles.stadiamaps.com
      https://*.tile.openstreetmap.org
      wss://*.firebaseio.com
      http://localhost:*;
    frame-src 'self' https://*.google.com https://*.firebaseapp.com;
    worker-src 'self' blob:;
    child-src 'self' blob:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim()

  response.headers.set('Content-Security-Policy', cspHeader)

  // X-Frame-Options: Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')

  // X-Content-Type-Options: Prevent MIME sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Referrer-Policy: Control referrer information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions-Policy: Control browser features
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), interest-cohort=()'
  )

  // Strict-Transport-Security: Enforce HTTPS (only in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    )
  }

  // X-DNS-Prefetch-Control: Control DNS prefetching
  response.headers.set('X-DNS-Prefetch-Control', 'on')

  // X-XSS-Protection: Legacy XSS protection (backup for older browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block')

  return response
}

// Configure which routes this middleware applies to
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, icons, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
