'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Clock, CheckCircle, XCircle, AlertCircle, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VerificationStatus } from '@/types/verification'

interface VerificationStatusBadgeProps {
  status: VerificationStatus | string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

interface VerificationPriorityBadgeProps {
  priority: 'urgent' | 'high' | 'normal' | 'low' | string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function VerificationStatusBadge({ 
  status, 
  size = 'md', 
  className 
}: VerificationStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pending Review',
          variant: 'secondary' as const,
          icon: Clock,
          className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
        }
      case 'approved':
        return {
          label: 'Approved',
          variant: 'secondary' as const,
          icon: CheckCircle,
          className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
        }
      case 'rejected':
        return {
          label: 'Rejected',
          variant: 'secondary' as const,
          icon: XCircle,
          className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }
      case 'requires_info':
        return {
          label: 'Requires Info',
          variant: 'secondary' as const,
          icon: MessageSquare,
          className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        }
      default:
        return {
          label: status,
          variant: 'outline' as const,
          icon: AlertCircle,
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
        }
    }
  }

  const config = getStatusConfig(status)
  const Icon = config.icon
  
  const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'
  const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-xs'

  return (
    <Badge 
      variant={config.variant}
      className={cn(config.className, textSize, className)}
    >
      <Icon className={cn(iconSize, 'mr-1')} />
      {config.label}
    </Badge>
  )
}

export function VerificationPriorityBadge({ 
  priority, 
  size = 'md', 
  className 
}: VerificationPriorityBadgeProps) {
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return {
          label: 'Urgent',
          className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-700'
        }
      case 'high':
        return {
          label: 'High',
          className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-200 dark:border-orange-700'
        }
      case 'normal':
        return {
          label: 'Normal',
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600'
        }
      case 'low':
        return {
          label: 'Low',
          className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-700'
        }
      default:
        return {
          label: priority,
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
        }
    }
  }

  const config = getPriorityConfig(priority)
  const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-xs'

  return (
    <Badge 
      variant="outline"
      className={cn(config.className, textSize, 'font-medium', className)}
    >
      {config.label}
    </Badge>
  )
}