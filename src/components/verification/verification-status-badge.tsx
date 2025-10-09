'use client'

import React from 'react'
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle, 
  HelpCircle, 
  Shield,
  AlertTriangle,
  Zap
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { VerificationStatus } from '@/types/verification'

interface VerificationStatusBadgeProps {
  status: VerificationStatus
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'minimal' | 'detailed'
  showIcon?: boolean
  showTooltip?: boolean
  className?: string
  onClick?: () => void
}

interface StatusConfig {
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  borderColor: string
  description: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
}

const statusConfigs: Record<VerificationStatus, StatusConfig> = {
  pending: {
    label: 'Pending Review',
    icon: Clock,
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
    description: 'Camera is awaiting admin verification',
    priority: 'normal'
  },
  approved: {
    label: 'Verified',
    icon: CheckCircle,
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    description: 'Camera has been verified by community moderators',
    priority: 'low'
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    description: 'Camera verification was rejected',
    priority: 'normal'
  },
  requires_info: {
    label: 'Info Needed',
    icon: AlertCircle,
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    description: 'Admin needs additional information to verify camera',
    priority: 'high'
  },
  disputed: {
    label: 'Under Review',
    icon: AlertTriangle,
    color: 'text-purple-700 dark:text-purple-300',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    description: 'Camera verification is being disputed/appealed',
    priority: 'high'
  },
  auto_approved: {
    label: 'Auto-Verified',
    icon: Zap,
    color: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    description: 'Camera was automatically verified based on user trust score',
    priority: 'low'
  }
}

export default function VerificationStatusBadge({
  status,
  size = 'md',
  variant = 'default',
  showIcon = true,
  showTooltip = true,
  className,
  onClick
}: VerificationStatusBadgeProps) {
  const config = statusConfigs[status]
  const Icon = config.icon
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  }
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  // Base badge with custom styling
  const badgeContent = (
    <div 
      className={cn(
        'inline-flex items-center gap-2 rounded-full font-medium border transition-all duration-200',
        config.color,
        config.bgColor,
        config.borderColor,
        sizeClasses[size],
        onClick && 'cursor-pointer hover:shadow-sm',
        className
      )}
      onClick={onClick}
      title={showTooltip ? config.description : undefined}
    >
      {showIcon && (
        <Icon className={cn(iconSizes[size], 'flex-shrink-0')} />
      )}
      
      {variant === 'minimal' ? (
        <span className="sr-only">{config.label}</span>
      ) : (
        <span className="font-medium">
          {variant === 'detailed' ? config.description : config.label}
        </span>
      )}
    </div>
  )

  return badgeContent
}

// Specialized badge variants for common use cases
export function VerificationStatusIcon({ 
  status, 
  size = 'md', 
  className,
  showTooltip = true 
}: {
  status: VerificationStatus
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showTooltip?: boolean
}) {
  const config = statusConfigs[status]
  const Icon = config.icon
  
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }
  
  return (
    <span title={showTooltip ? config.description : undefined}>
      <Icon 
        className={cn(
          iconSizes[size],
          config.color,
          className
        )}
      />
    </span>
  )
}

// Trust badge component for verified cameras
export function TrustVerificationBadge({ 
  isVerified,
  trustScore,
  size = 'sm',
  className 
}: {
  isVerified: boolean
  trustScore?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  if (!isVerified) {
    return null
  }
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5', 
    lg: 'text-base px-4 py-2'
  }
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }
  
  return (
    <div 
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium border',
        'text-blue-700 dark:text-blue-300',
        'bg-blue-50 dark:bg-blue-900/20',
        'border-blue-200 dark:border-blue-800',
        sizeClasses[size],
        className
      )}
      title={`Verified camera${trustScore ? ` (Trust Score: ${trustScore})` : ''}`}
    >
      <Shield className={cn(iconSizes[size], 'flex-shrink-0')} />
      <span>Verified</span>
      {trustScore && size !== 'sm' && (
        <span className="text-xs opacity-75">({trustScore})</span>
      )}
    </div>
  )
}

// Verification priority badge for admin use
export function VerificationPriorityBadge({ 
  priority,
  size = 'sm',
  className
}: {
  priority: 'low' | 'normal' | 'high' | 'urgent'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const priorityConfigs = {
    low: {
      label: 'Low',
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-50 dark:bg-gray-900/20',
      borderColor: 'border-gray-200 dark:border-gray-700'
    },
    normal: {
      label: 'Normal',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800'
    },
    high: {
      label: 'High',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-800'
    },
    urgent: {
      label: 'Urgent',
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800'
    }
  }
  
  const config = priorityConfigs[priority]
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  }
  
  return (
    <div 
      className={cn(
        'inline-flex items-center rounded-full font-medium border',
        config.color,
        config.bgColor,
        config.borderColor,
        sizeClasses[size],
        className
      )}
    >
      {config.label} Priority
    </div>
  )
}

// Export status configurations for use in other components
export { statusConfigs }
