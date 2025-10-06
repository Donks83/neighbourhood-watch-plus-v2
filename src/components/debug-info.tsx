'use client'

import React, { useEffect, useState } from 'react'

export default function DebugInfo() {
  const [envVars, setEnvVars] = useState<Record<string, string>>({})
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    // Get all NEXT_PUBLIC_ environment variables
    const publicEnvVars: Record<string, string> = {
      'NEXT_PUBLIC_MAPTILER_API_KEY': process.env.NEXT_PUBLIC_MAPTILER_API_KEY || 'undefined',
      'NEXT_PUBLIC_FIREBASE_API_KEY': process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'undefined',
      'NODE_ENV': process.env.NODE_ENV || 'undefined'
    }
    
    setEnvVars(publicEnvVars)
  }, [])

  // Don't render anything until client-side hydration is complete
  if (!isClient) {
    return null
  }

  // Check for browser APIs only on client side
  const hasGeolocation = typeof navigator !== 'undefined' && !!navigator.geolocation
  const hasMapLibre = typeof window !== 'undefined' && 'maplibregl' in window

  return (
    <div className="fixed bottom-4 right-4 z-[9999] bg-gray-900 text-white p-4 rounded-lg text-xs max-w-sm opacity-75 hover:opacity-100 transition-opacity">
      <h3 className="font-bold mb-2">🔍 Debug Info</h3>
      <div className="space-y-1">
        {Object.entries(envVars).map(([key, value]) => (
          <div key={key} className="flex justify-between gap-2">
            <span className="text-gray-300">{key}:</span>
            <span className={value === 'undefined' ? 'text-red-400' : 'text-green-400'}>
              {value === 'undefined' ? 'MISSING' : value.length > 20 ? `${value.substring(0, 8)}...` : value}
            </span>
          </div>
        ))}
        <div className="pt-2 border-t border-gray-700">
          <div className="text-gray-400">Geolocation: {hasGeolocation ? '✅' : '❌'}</div>
          <div className="text-gray-400">MapLibre: {hasMapLibre ? '✅' : '❌'}</div>
        </div>
      </div>
    </div>
  )
}
