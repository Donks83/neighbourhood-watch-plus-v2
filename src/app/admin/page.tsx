'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import AdminVerificationQueue from '@/components/admin/admin-verification-queue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Shield, 
  ArrowLeft,
  AlertCircle,
  Users,
  BarChart3,
  Archive,
  FileText,
  Settings
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { collection, getDocs, query, limit, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { getArchiveStatistics } from '@/lib/archive-service'
import { getRateLimitStatus, setCustomRateLimit, resetRateLimit } from '@/lib/rate-limiting'

// Available user roles
const USER_ROLES = [
  { value: 'user', label: 'User', description: 'Regular community member' },
  { value: 'police', label: 'Police', description: 'Law enforcement - sees hex grid' },
  { value: 'insurance', label: 'Insurance', description: 'Insurance company - sees hex grid' },
  { value: 'security', label: 'Security', description: 'Security firm - sees hex grid' },
  { value: 'admin', label: 'Admin', description: 'Platform administrator' },
  { value: 'super_admin', label: 'Super Admin', description: 'Full system access' },
]

export default function AdminPage() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  const [hasAdminAccess, setHasAdminAccess] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  
  // Admin statistics state
  const [stats, setStats] = useState<{
    totalUsers: number
    totalRequests: number
    totalCameras: number
    archivedRequests: number
    archiveBreakdown: Record<string, number>
  }>({
    totalUsers: 0,
    totalRequests: 0,
    totalCameras: 0,
    archivedRequests: 0,
    archiveBreakdown: { fulfilled: 0, expired: 0, cancelled: 0, manual: 0 }
  })
  
  // User management state
  const [users, setUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [newRateLimit, setNewRateLimit] = useState<number>(3)

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
  // Load admin statistics
  useEffect(() => {
    async function loadStatistics() {
      if (!hasAdminAccess) return
      
      try {
        // Get total users
        const usersSnapshot = await getDocs(collection(db, 'users'))
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setUsers(usersData)
        
        // Get total requests
        const requestsSnapshot = await getDocs(collection(db, 'footageRequests'))
        
        // Get total cameras
        const camerasSnapshot = await getDocs(collection(db, 'cameras'))
        
        // Get archive statistics
        const archiveStats = await getArchiveStatistics()
        
        setStats({
          totalUsers: usersSnapshot.size,
          totalRequests: requestsSnapshot.size,
          totalCameras: camerasSnapshot.size,
          archivedRequests: archiveStats.total,
          archiveBreakdown: archiveStats.byReason
        })
        
        console.log('📊 Admin stats loaded:', stats)
      } catch (error) {
        console.error('Error loading admin statistics:', error)
      }
    }
    
    if (hasAdminAccess) {
      loadStatistics()
    }
  }, [hasAdminAccess])

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
              <strong>Welcome to the Admin Dashboard!</strong> Manage users, monitor system statistics, review camera verifications, and maintain community safety.
            </AlertDescription>
          </Alert>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="verification">
              <Shield className="w-4 h-4 mr-2" />
              Camera Verification
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Users Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Registered community members
                  </p>
                </CardContent>
              </Card>

              {/* Total Requests Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Active Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalRequests}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Current footage requests
                  </p>
                </CardContent>
              </Card>

              {/* Total Cameras Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Cameras
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalCameras}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Registered security cameras
                  </p>
                </CardContent>
              </Card>

              {/* Archived Requests Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Archived Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.archivedRequests}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Old requests cleaned up
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Archive Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Archive Breakdown</CardTitle>
                <CardDescription>
                  How archived requests were categorized
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {stats.archiveBreakdown.fulfilled || 0}
                    </div>
                    <div className="text-sm text-gray-600">Fulfilled</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {stats.archiveBreakdown.expired || 0}
                    </div>
                    <div className="text-sm text-gray-600">Expired</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {stats.archiveBreakdown.cancelled || 0}
                    </div>
                    <div className="text-sm text-gray-600">Cancelled</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-gray-600">
                      {stats.archiveBreakdown.manual || 0}
                    </div>
                    <div className="text-sm text-gray-600">Manual</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Management Tab WITH ROLE ASSIGNMENT */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage user roles and rate limits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.slice(0, 20).map((userData) => (
                    <div 
                      key={userData.id}
                      className="relative flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{userData.displayName || 'Unknown User'}</div>
                        <div className="text-sm text-gray-500">{userData.email}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          Rate Limit: {userData.rateLimits?.weeklyRequestCount || 0}/{userData.rateLimits?.weeklyLimit || 3} requests/week
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={userData.role === 'police' || userData.role === 'insurance' || userData.role === 'security' ? 'default' : 'secondary'}>
                          {userData.role || 'user'}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedUser(selectedUser === userData.id ? null : userData.id)}
                        >
                          <Settings className="w-3 h-3 mr-1" />
                          Manage
                        </Button>
                      </div>
                      
                      {/* User Management Controls (expanded) - WITH ROLE DROPDOWN */}
                      {selectedUser === userData.id && (
                        <div className="absolute right-4 mt-2 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-10">
                          <h4 className="font-medium mb-4">User Management</h4>
                          
                          {/* ROLE ASSIGNMENT SECTION */}
                          <div className="space-y-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                            <div>
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                User Role
                              </label>
                              <Select
                                value={userData.role || 'user'}
                                onValueChange={async (newRole) => {
                                  try {
                                    const userRef = doc(db, 'users', userData.id)
                                    await updateDoc(userRef, { role: newRole })
                                    
                                    alert(`✅ Role updated to "${newRole}"`)
                                    
                                    // Reload users
                                    const usersSnapshot = await getDocs(collection(db, 'users'))
                                    setUsers(usersSnapshot.docs.map(doc => ({
                                      id: doc.id,
                                      ...doc.data()
                                    })))
                                  } catch (error) {
                                    console.error('Error updating role:', error)
                                    alert('❌ Failed to update role')
                                  }
                                }}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {USER_ROLES.map((role) => (
                                    <SelectItem key={role.value} value={role.value}>
                                      <div className="flex flex-col items-start py-1">
                                        <span className="font-medium">{role.label}</span>
                                        <span className="text-xs text-gray-500">{role.description}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-gray-500 mt-1.5">
                                🔒 Police, Insurance, Security roles can see hexagonal coverage grid
                              </p>
                            </div>
                          </div>
                          
                          {/* RATE LIMIT CONTROLS SECTION */}
                          <div className="space-y-3">
                            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Rate Limit Controls</h5>
                            <div>
                              <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">
                                Weekly Request Limit
                              </label>
                              <div className="flex gap-2">
                                <Input
                                  type="number"
                                  min="0"
                                  max="999"
                                  value={newRateLimit}
                                  onChange={(e) => setNewRateLimit(parseInt(e.target.value))}
                                  className="flex-1"
                                />
                                <Button
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      await setCustomRateLimit(userData.id, newRateLimit)
                                      alert(`✅ Rate limit updated to ${newRateLimit} requests/week`)
                                      // Reload users
                                      const usersSnapshot = await getDocs(collection(db, 'users'))
                                      setUsers(usersSnapshot.docs.map(doc => ({
                                        id: doc.id,
                                        ...doc.data()
                                      })))
                                    } catch (error) {
                                      console.error('Error updating rate limit:', error)
                                      alert('Failed to update rate limit')
                                    }
                                  }}
                                >
                                  Set
                                </Button>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              onClick={async () => {
                                try {
                                  await resetRateLimit(userData.id)
                                  alert('✅ Rate limit reset successfully')
                                  // Reload users
                                  const usersSnapshot = await getDocs(collection(db, 'users'))
                                  setUsers(usersSnapshot.docs.map(doc => ({
                                    id: doc.id,
                                    ...doc.data()
                                  })))
                                } catch (error) {
                                  console.error('Error resetting rate limit:', error)
                                  alert('Failed to reset rate limit')
                                }
                              }}
                            >
                              Reset Counter to 0
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {users.length > 20 && (
                    <div className="text-center text-sm text-gray-500 pt-4">
                      Showing first 20 of {users.length} users
                    </div>
                  )}
                  
                  {users.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No users found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Verification Tab */}
          <TabsContent value="verification">
            <AdminVerificationQueue />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}