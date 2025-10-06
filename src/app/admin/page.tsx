'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import AdminVerificationQueue from '@/components/admin/admin-verification-queue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Shield, 
  ArrowLeft,
  AlertCircle
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  const [hasAdminAccess, setHasAdminAccess] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)

  // Check admin permissions on page load
  useEffect(() => {
    async function checkAdminAccess() {
      if (!user) {
        setHasAdminAccess(false)
        setIsLoading(false)
        return
      }

      try {
        // Import admin functions dynamically
        const { getUserRole, hasPermission } = await import('@/lib/admin')
        
        // Check if user has admin permissions
        const canVerify = await hasPermission(user.uid, 'canVerifyCameras')
        const role = await getUserRole(user.uid)
        
        console.log('Admin check - Can verify:', canVerify, 'Role:', role?.role)
        
        setUserRole(role?.role || 'user')
        setHasAdminAccess(canVerify)
      } catch (error) {
        console.error('Error checking admin access:', error)
        setHasAdminAccess(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminAccess()
  }, [user])

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-600">Checking admin permissions...</p>
        </div>
      </div>
    )
  }

  // Show login required if no user
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>
              Please sign in to access the admin dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push('/')} 
              className="w-full"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show access denied if not admin
  if (hasAdminAccess === false) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access the admin dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your current role: <strong>{userRole}</strong>. Admin access is required to view camera verifications and manage community settings.
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.back()} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              <Button onClick={() => router.push('/')} className="flex-1">
                Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show admin dashboard
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Admin Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to App
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Admin Dashboard
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Camera Verification & Community Management
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                {userRole}
              </Badge>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {user.email}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Message */}
        <div className="mb-8">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Welcome to the Admin Dashboard!</strong> You can review camera verifications, manage users, and monitor community activity. 
              Camera verifications help ensure only legitimate security cameras are registered in the community.
            </AlertDescription>
          </Alert>
        </div>

        {/* Main Verification Queue */}
        <AdminVerificationQueue />
      </div>
    </div>
  )
}