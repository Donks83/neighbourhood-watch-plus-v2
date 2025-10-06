'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive'
  size?: 'default' | 'sm' | 'lg'
}

export function Badge({ 
  className, 
  variant = 'default', 
  size = 'default',
  ...props 
}: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        {
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80': variant === 'default',
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
          'text-foreground': variant === 'outline',
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80': variant === 'destructive',
        },
        {
          'text-xs px-2.5 py-0.5': size === 'default',
          'text-xs px-2 py-0.5': size === 'sm',
          'text-sm px-3 py-1': size === 'lg',
        },
        className
      )}
      {...props}
    />
  )
}
