#!/usr/bin/env node

/**
 * Security Headers Test Script
 * 
 * Tests if all security headers are properly configured on the deployed site.
 * Run: node test-security-headers.js [URL]
 * Example: node test-security-headers.js https://neighbourhood-watch-plus-v2.vercel.app
 */

const https = require('https');
const http = require('http');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Expected security headers
const expectedHeaders = {
  'content-security-policy': {
    required: true,
    description: 'Content Security Policy',
    check: (value) => value && value.includes('default-src'),
  },
  'x-frame-options': {
    required: true,
    description: 'Clickjacking Protection',
    check: (value) => value === 'DENY' || value === 'SAMEORIGIN',
  },
  'x-content-type-options': {
    required: true,
    description: 'MIME Sniffing Protection',
    check: (value) => value === 'nosniff',
  },
  'referrer-policy': {
    required: true,
    description: 'Referrer Policy',
    check: (value) => value && value.length > 0,
  },
  'permissions-policy': {
    required: true,
    description: 'Permissions Policy',
    check: (value) => value && value.length > 0,
  },
  'strict-transport-security': {
    required: false, // Only in production HTTPS
    description: 'HSTS (HTTPS Enforcement)',
    check: (value) => value && value.includes('max-age'),
  },
  'x-xss-protection': {
    required: false,
    description: 'XSS Protection (Legacy)',
    check: (value) => value === '1; mode=block',
  },
};

function testSecurityHeaders(url) {
  console.log(`${colors.cyan}🔍 Testing Security Headers${colors.reset}`);
  console.log(`${colors.blue}URL: ${url}${colors.reset}\n`);

  const protocol = url.startsWith('https') ? https : http;

  protocol.get(url, (res) => {
    console.log(`${colors.cyan}Status Code: ${res.statusCode}${colors.reset}\n`);

    let passCount = 0;
    let failCount = 0;
    let warningCount = 0;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    Object.entries(expectedHeaders).forEach(([headerName, config]) => {
      const headerValue = res.headers[headerName] || res.headers[headerName.toLowerCase()];
      const exists = !!headerValue;
      const passes = exists && config.check(headerValue);

      let status, color;
      if (passes) {
        status = '✅ PASS';
        color = colors.green;
        passCount++;
      } else if (exists && !passes) {
        status = '❌ FAIL';
        color = colors.red;
        failCount++;
      } else if (config.required) {
        status = '❌ MISSING';
        color = colors.red;
        failCount++;
      } else {
        status = '⚠️  OPTIONAL';
        color = colors.yellow;
        warningCount++;
      }

      console.log(`${color}${status}${colors.reset} ${config.description}`);
      console.log(`     Header: ${headerName}`);
      
      if (exists) {
        // Truncate long values
        const displayValue = headerValue.length > 80 
          ? headerValue.substring(0, 77) + '...'
          : headerValue;
        console.log(`     Value:  ${displayValue}`);
      } else {
        console.log(`     Value:  ${colors.red}Not present${colors.reset}`);
      }
      console.log('');
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Summary
    console.log(`${colors.cyan}📊 Summary${colors.reset}`);
    console.log(`${colors.green}✅ Passed: ${passCount}${colors.reset}`);
    console.log(`${colors.red}❌ Failed: ${failCount}${colors.reset}`);
    console.log(`${colors.yellow}⚠️  Optional: ${warningCount}${colors.reset}\n`);

    // Overall score
    const totalRequired = Object.values(expectedHeaders).filter(h => h.required).length;
    const score = (passCount / totalRequired) * 100;
    
    if (score === 100) {
      console.log(`${colors.green}🎉 Excellent! All required security headers are configured correctly.${colors.reset}`);
    } else if (score >= 80) {
      console.log(`${colors.yellow}⚠️  Good, but some headers need attention.${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ Security headers need improvement.${colors.reset}`);
    }

    console.log(`\n${colors.cyan}Security Score: ${Math.round(score)}%${colors.reset}\n`);

    // Recommendations
    if (failCount > 0) {
      console.log(`${colors.yellow}💡 Recommendations:${colors.reset}`);
      console.log('   - Review SECURITY_HEADERS.md for configuration details');
      console.log('   - Check middleware.ts and next.config.js');
      console.log('   - Redeploy if changes were made recently');
      console.log('   - Allow 5-10 minutes for CDN cache to clear\n');
    }

  }).on('error', (err) => {
    console.error(`${colors.red}❌ Error fetching URL: ${err.message}${colors.reset}`);
    process.exit(1);
  });
}

// Main execution
const args = process.argv.slice(2);
const url = args[0] || 'https://neighbourhood-watch-plus-v2.vercel.app';

if (!url.startsWith('http://') && !url.startsWith('https://')) {
  console.error(`${colors.red}❌ Error: URL must start with http:// or https://${colors.reset}`);
  console.log(`${colors.yellow}Usage: node test-security-headers.js https://your-site.com${colors.reset}`);
  process.exit(1);
}

testSecurityHeaders(url);
