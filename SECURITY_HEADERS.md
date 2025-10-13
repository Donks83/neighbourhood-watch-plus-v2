# 🛡️ Security Headers Implementation

## Overview
This document describes the comprehensive security headers implementation for Neighbourhood Watch+ v2, including Content Security Policy (CSP) and other critical security measures.

## Implementation Approach

We've implemented a **dual-layer security approach**:

1. **middleware.ts** - Runtime security headers with CSP
2. **next.config.js** - Build-time security headers

This redundancy ensures maximum protection across different deployment scenarios.

---

## 🔐 Security Headers Implemented

### 1. Content Security Policy (CSP)
**Location**: `src/middleware.ts`

Restricts which resources can be loaded and from where, preventing XSS attacks.

#### Directives:
- `default-src 'self'` - Only load resources from same origin by default
- `script-src` - Allow scripts from self, Google APIs, CDNs (for MapLibre, Firebase)
- `style-src` - Allow styles from self, inline styles (for Tailwind), Google Fonts, MapTiler
- `img-src` - Allow images from self, data URIs, blob URIs, MapTiler, Firebase Storage
- `font-src` - Allow fonts from self, data URIs, Google Fonts, MapTiler
- `connect-src` - Allow connections to Firebase, MapTiler, Google APIs, localhost (dev)
- `frame-src` - Allow iframes from Google and Firebase
- `worker-src` - Allow web workers from self and blob URIs
- `object-src 'none'` - Block all plugins (Flash, etc.)
- `base-uri 'self'` - Prevent base tag hijacking
- `form-action 'self'` - Forms can only submit to same origin
- `frame-ancestors 'none'` - Prevent site from being framed (anti-clickjacking)
- `upgrade-insecure-requests` - Automatically upgrade HTTP to HTTPS

### 2. X-Frame-Options: DENY
Prevents the site from being embedded in iframes, protecting against clickjacking attacks.

### 3. X-Content-Type-Options: nosniff
Prevents browsers from MIME-sniffing responses, protecting against MIME confusion attacks.

### 4. Referrer-Policy: strict-origin-when-cross-origin
Controls how much referrer information is sent with requests:
- Same-origin: Full URL
- Cross-origin: Only origin (no path/query)
- Downgrade (HTTPS→HTTP): No referrer

### 5. Permissions-Policy
Controls which browser features can be used:
- `camera=()` - Blocks camera access
- `microphone=()` - Blocks microphone access
- `geolocation=(self)` - Allows geolocation only from same origin
- `interest-cohort=()` - Opts out of FLoC tracking

### 6. Strict-Transport-Security (HSTS)
**Production Only**: Forces browsers to use HTTPS for 2 years, including all subdomains.
- `max-age=63072000` (2 years)
- `includeSubDomains` - Apply to all subdomains
- `preload` - Eligible for browser HSTS preload list

### 7. X-DNS-Prefetch-Control: on
Allows browser to perform DNS prefetching for better performance.

### 8. X-XSS-Protection: 1; mode=block
Legacy XSS protection for older browsers (backup defense).

---

## 📋 Whitelisted Domains

### Firebase Services
- `*.googleapis.com` - Firebase APIs
- `*.google.com` - Google auth
- `*.firebaseio.com` - Realtime Database
- `*.cloudfunctions.net` - Cloud Functions
- `firestore.googleapis.com` - Firestore
- `identitytoolkit.googleapis.com` - Auth
- `securetoken.googleapis.com` - Auth tokens
- `firebasestorage.googleapis.com` - Storage

### Map Services
- `api.maptiler.com` - MapTiler API
- `tiles.stadiamaps.com` - Map tiles
- `*.tile.openstreetmap.org` - OSM tiles

### Fonts & Styles
- `fonts.googleapis.com` - Google Fonts CSS
- `fonts.gstatic.com` - Google Fonts files

### Images
- `images.unsplash.com` - Unsplash images

### Development
- `http://localhost:*` - Local development (all ports)

---

## 🧪 Testing Security Headers

### Option 1: Browser DevTools
1. Open your deployed site
2. Open DevTools (F12)
3. Go to Network tab
4. Refresh page
5. Click on the main document request
6. Check "Headers" → "Response Headers"
7. Verify all security headers are present

### Option 2: Online Security Scanners

**Security Headers Scanner**:
```
https://securityheaders.com/?q=https://neighbourhood-watch-plus-v2.vercel.app
```

**Mozilla Observatory**:
```
https://observatory.mozilla.org/analyze/neighbourhood-watch-plus-v2.vercel.app
```

**CSP Evaluator (Google)**:
```
https://csp-evaluator.withgoogle.com/
```

### Option 3: Command Line (curl)
```bash
curl -I https://neighbourhood-watch-plus-v2.vercel.app | grep -i "content-security\|x-frame\|x-content"
```

### Option 4: Browser Console
Paste this in the browser console on your site:
```javascript
// Check for CSP
console.log('CSP:', document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content || 'Check Response Headers');

// Check for X-Frame-Options
fetch(window.location.href)
  .then(r => r.headers.get('x-frame-options'))
  .then(v => console.log('X-Frame-Options:', v));
```

---

## 🚨 Common CSP Issues & Fixes

### Issue 1: Inline Scripts Blocked
**Error**: "Refused to execute inline script because it violates CSP"
**Fix**: 
- Use external script files instead
- OR add `'unsafe-inline'` to script-src (not recommended)
- OR use nonces (implemented in middleware)

### Issue 2: Images Not Loading
**Error**: "Refused to load image because it violates img-src"
**Fix**: Add the image domain to the `img-src` directive in middleware.ts

### Issue 3: Styles Not Applied
**Error**: "Refused to apply inline style because it violates style-src"
**Fix**: 
- Tailwind requires `'unsafe-inline'` in style-src (already configured)
- For other styles, add domain to style-src

### Issue 4: Third-Party Scripts Blocked
**Error**: "Refused to load script from [URL]"
**Fix**: Add the domain to script-src in middleware.ts

---

## 🔧 Modifying CSP for New Services

If you need to add a new external service:

1. **Open**: `src/middleware.ts`
2. **Find**: The `cspHeader` constant
3. **Add** the domain to the appropriate directive:
   - Scripts: `script-src`
   - Styles: `style-src`
   - Images: `img-src`
   - API calls: `connect-src`
   - Fonts: `font-src`
   - Iframes: `frame-src`

4. **Example**: Adding Stripe
```typescript
connect-src 'self' 
  https://*.googleapis.com 
  https://api.stripe.com  // ← ADD HERE
  ...
```

5. **Test** locally and in production

---

## 📊 Security Scoring Goals

Target scores from security scanners:

- **Security Headers**: A+ rating
- **Mozilla Observatory**: A+ (90-100 points)
- **CSP Evaluator**: No high-severity issues

### Current Configuration Strengths:
✅ Strong CSP with minimal `unsafe-inline` usage
✅ HSTS with preload
✅ Frame protection (DENY)
✅ MIME sniffing protection
✅ Referrer policy configured
✅ Permissions policy (blocks camera/mic)
✅ XSS protection

---

## 🚀 Deployment Notes

### Automatic Application
Both middleware and next.config.js headers are automatically applied on deployment to Vercel. No manual configuration needed.

### Vercel-Specific
Vercel respects both approaches:
1. `next.config.js` headers are applied at the CDN edge
2. `middleware.ts` runs on Vercel's Edge Network

### Environment Variables
No additional environment variables needed for security headers.

---

## 🔍 Monitoring & Maintenance

### Regular Checks (Monthly):
1. Run security scanners (securityheaders.com, observatory.mozilla.org)
2. Review CSP violation reports (if CSP reporting is enabled)
3. Update CSP if new services are added
4. Check for new security best practices

### When Adding New Features:
- Test thoroughly in development
- Check browser console for CSP violations
- Add necessary domains to CSP
- Re-test after deployment

---

## 📚 Additional Resources

- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [OWASP: Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [Google: CSP Best Practices](https://csp.withgoogle.com/docs/index.html)
- [Next.js: Security Headers](https://nextjs.org/docs/advanced-features/security-headers)

---

## ✅ Implementation Checklist

- [x] Created `src/middleware.ts` with comprehensive CSP
- [x] Updated `next.config.js` with security headers
- [x] Configured all required domains for Firebase
- [x] Configured all required domains for MapTiler
- [x] Added Google Fonts domains
- [x] Configured localhost for development
- [x] Enabled HSTS for production
- [x] Added clickjacking protection
- [x] Added MIME sniffing protection
- [x] Configured referrer policy
- [x] Configured permissions policy
- [ ] Test on deployed site
- [ ] Run security scanner
- [ ] Monitor for CSP violations
- [ ] Update documentation if needed

---

**Last Updated**: October 2025
**Status**: ✅ Ready for Production Testing
