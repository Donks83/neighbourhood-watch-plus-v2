import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { cn } from '@/lib/utils'
import { AuthProvider } from '@/contexts/auth-context'
import Footer from '@/components/layout/footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Neighbourhood Watch+ | Privacy-First Community Security',
  description: 'A privacy-first community security camera footage sharing platform. Report incidents and request footage from nearby residents securely.',
  keywords: ['security', 'community', 'privacy', 'cameras', 'neighborhood', 'safety', 'incident-reporting', 'footage-sharing'],
  authors: [{ name: 'Neighbourhood Watch+ Team' }],
  openGraph: {
    title: 'Neighbourhood Watch+ | Privacy-First Community Security',
    description: 'A privacy-first community security camera footage sharing platform',
    type: 'website',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  manifest: '/manifest.json',
  themeColor: '#3b82f6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
      <link rel="icon" href="/favicon.ico" sizes="32x32" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <meta name="application-name" content="Neighbourhood Watch+" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Neighbourhood Watch+" />
      </head>
      <body className={cn(inter.className, 'antialiased')}>
        <AuthProvider>
          <div className="min-h-screen bg-background flex flex-col">
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
