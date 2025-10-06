'use client'

import React, { useState } from 'react'
import { EyeIcon, EyeOffIcon, InfoIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CameraDensityArea } from '@/lib/heatmap-utils'
import { getDensityColor, getDensityDescription } from '@/lib/heatmap-utils'

interface HeatmapControlsProps {
  isVisible: boolean
  onToggle: (visible: boolean) => void
  densityAreas?: CameraDensityArea[]
  className?: string
}

export default function HeatmapControls({
  isVisible,
  onToggle,
  densityAreas = [],
  className
}: HeatmapControlsProps) {
  const [showLegend, setShowLegend] = useState(false)

  const totalCameras = densityAreas.reduce((sum, area) => sum + area.cameraCount, 0)
  const avgDensity = densityAreas.length > 0 
    ? densityAreas.reduce((sum, area) => sum + area.density, 0) / densityAreas.length 
    : 0

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Toggle Button */}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onToggle(!isVisible)}
        className={cn(
          'shadow-lg border bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm',
          'hover:bg-white dark:hover:bg-gray-800 transition-all duration-200',
          isVisible && 'ring-2 ring-blue-500/50'
        )}
      >
        {isVisible ? (
          <EyeOffIcon className="w-4 h-4 mr-2" />
        ) : (
          <EyeIcon className="w-4 h-4 mr-2" />
        )}
        Coverage Map
      </Button>

      {/* Info Panel */}
      {isVisible && (
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-200/50 dark:border-gray-700/50 min-w-[200px]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
              Camera Coverage
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowLegend(!showLegend)}
              className="w-6 h-6"
            >
              <InfoIcon className="w-4 h-4" />
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex justify-between">
              <span>Total cameras:</span>
              <span className="font-medium">~{totalCameras}</span>
            </div>
            <div className="flex justify-between">
              <span>Avg coverage:</span>
              <span className="font-medium">{(avgDensity * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Areas mapped:</span>
              <span className="font-medium">{densityAreas.length}</span>
            </div>
          </div>

          {/* Coverage Legend */}
          {showLegend && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Coverage Levels
              </h4>
              <div className="space-y-1.5">
                {[
                  { density: 0.8, label: 'Excellent (70%+)' },
                  { density: 0.5, label: 'Good (40-70%)' },
                  { density: 0.3, label: 'Limited (20-40%)' },
                  { density: 0.1, label: 'Minimal (<20%)' }
                ].map(({ density, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full border border-white/50"
                      style={{ backgroundColor: getDensityColor(density) }}
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Privacy Notice */}
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                <strong className="text-gray-700 dark:text-gray-300">Privacy Protected:</strong> Shows general coverage areas only. Exact camera locations remain private.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
