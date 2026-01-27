/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'images.unsplash.com',
      'firebasestorage.googleapis.com',
    ],
  },
  typescript: {
    // !! WARN !! Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: false,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: false,
  },
  experimental: {
    // Enable the latest features
    serverComponentsExternalPackages: ['maplibre-gl', '@sendgrid/mail'],
  },
  
  // Webpack configuration to exclude SendGrid from client bundle
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle SendGrid for client-side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        '@sendgrid/mail': false,
        '@sendgrid/client': false,
        '@sendgrid/helpers': false,
      }
    }
    return config
  },
  
  // Security Headers Configuration
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()'
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
