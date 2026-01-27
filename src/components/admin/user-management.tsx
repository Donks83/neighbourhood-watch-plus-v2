'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  Users, 
  Search, 
  Shield, 
  ShieldAlert, 
  ShieldCheck,
  UserCheck,
  UserX,
  Crown,
  Mail,
  Calendar,
  MoreVertical,
  Ban,
  CheckCircle,
  Eye,
  Settings,
  Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { useAuth } from '@/contexts/auth-context'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { UserRoleType, UserRole } from '@/types/verification'
import type { UserProfile } from '@/types/camera'

interface UserManagementProps {
  className?: string
}

interface UserWithRole extends UserProfile {
  userRole: UserRole | null
}

export default function UserManagement({ className }: UserManagementProps) {
  const { user } = useAuth()
  const [users, setUsers] = useState<UserWithRole[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserWithRole[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | UserRoleType>('all')
  const [processingUserId, setProcessingUserId] = useState<string | null>(null)
  const [assigningRole, setAssigningRole] = useState<{ userId: string; role: UserRoleType } | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  // Enhanced user details dialog
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingLimits, setEditingLimits] = useState({
    weeklyLimit: 3,
    monthlyLimit: 12
  })

  // Load all users
  const loadUsers = useCallback(async () => {
    if (!user) return
    
    try {
      setLoading(true)
      setError(null)
      
      const { getAllUsers } = await import('@/lib/admin')
      const allUsers = await getAllUsers(200)
      
      setUsers(allUsers)
      setFilteredUsers(allUsers)
    } catch (err: any) {
      console.error('Error loading users:', err)
      setError(err.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  // Filter users
  useEffect(() => {
    let filtered = users

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.userRole?.role === roleFilter)
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(u =>
        u.email.toLowerCase().includes(search) ||
        u.displayName?.toLowerCase().includes(search)
      )
    }

    setFilteredUsers(filtered)
  }, [users, roleFilter, searchTerm])

  // Open user details dialog
  const openUserDetails = (userItem: UserWithRole) => {
    setSelectedUser(userItem)
    setEditingLimits({
      weeklyLimit: userItem.rateLimits?.weeklyLimit || 3,
      monthlyLimit: userItem.rateLimits?.monthlyLimit || 12
    })
    setIsEditDialogOpen(true)
  }

  // Update user request limits
  const updateUserLimits = async () => {
    if (!selectedUser) return
    
    try {
      const userRef = doc(db, 'users', selectedUser.uid)
      await updateDoc(userRef, {
        'rateLimits.weeklyLimit': editingLimits.weeklyLimit,
        'rateLimits.monthlyLimit': editingLimits.monthlyLimit,
        updatedAt: new Date()
      })
      
      setSuccessMessage(`Request limits updated for ${selectedUser.email}`)
      setTimeout(() => setSuccessMessage(null), 5000)
      
      setIsEditDialogOpen(false)
      await loadUsers()
    } catch (error) {
      console.error('Error updating limits:', error)
      setError('Failed to update request limits')
    }
  }

  // Assign role
  const handleAssignRole = useCallback(async (userId: string, role: UserRoleType) => {
    if (!user) return
    
    try {
      setProcessingUserId(userId)
      
      const { assignUserRole, logAdminAction } = await import('@/lib/admin')
      
      await assignUserRole(userId, role, user.uid)
      await logAdminAction(
        user.uid,
        'role_assigned',
        `Assigned ${role} role to user ${userId}`,
        { userId, role }
      )
      
      // Reload users
      await loadUsers()
      setAssigningRole(null)
    } catch (err: any) {
      console.error('Error assigning role:', err)
      setError(err.message || 'Failed to assign role')
    } finally {
      setProcessingUserId(null)
    }
  }, [user, loadUsers])

  // Revoke role
  const handleRevokeRole = useCallback(async (userId: string) => {
    if (!user) return
    if (!confirm('Are you sure you want to revoke this user\'s admin role?')) return
    
    try {
      setProcessingUserId(userId)
      
      const { revokeUserRole } = await import('@/lib/admin')
      
      await revokeUserRole(userId, user.uid, 'Role revoked by super admin')
      
      // Reload users
      await loadUsers()
    } catch (err: any) {
      console.error('Error revoking role:', err)
      setError(err.message || 'Failed to revoke role')
    } finally {
      setProcessingUserId(null)
    }
  }, [user, loadUsers])

  // Toggle admin status
  const handleToggleStatus = useCallback(async (userId: string, currentStatus: boolean) => {
    if (!user) return
    
    const newStatus = !currentStatus
    const action = newStatus ? 'activate' : 'deactivate'
    
    if (!confirm(`Are you sure you want to ${action} this admin?`)) return
    
    try {
      setProcessingUserId(userId)
      
      const { toggleAdminStatus } = await import('@/lib/admin')
      
      await toggleAdminStatus(userId, user.uid, newStatus, `Admin ${action}d by super admin`)
      
      // Reload users
      await loadUsers()
    } catch (err: any) {
      console.error('Error toggling status:', err)
      setError(err.message || 'Failed to toggle admin status')
    } finally {
      setProcessingUserId(null)
    }
  }, [user, loadUsers])

  // Get role badge
  const getRoleBadge = (role: UserRoleType | null | undefined) => {
    if (!role || role === 'user') {
      return <Badge variant="outline" className="gap-1"><Users className="w-3 h-3" />User</Badge>
    }
    
    const roleConfig = {
      super_admin: { icon: Crown, label: 'Super Admin', className: 'bg-purple-600 text-white' },
      admin: { icon: ShieldCheck, label: 'Admin', className: 'bg-blue-600 text-white' },
      police: { icon: Shield, label: 'Police', className: 'bg-indigo-600 text-white' },
      premium_business: { icon: ShieldAlert, label: 'Premium Business', className: 'bg-teal-600 text-white' },
      business: { icon: Users, label: 'Business', className: 'bg-green-600 text-white' }
    }
    
    const config = roleConfig[role as keyof typeof roleConfig]
    if (!config) return <Badge variant="outline">Unknown</Badge>
    
    const Icon = config.icon
    return (
      <Badge className={`gap-1 ${config.className}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-600">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{users.length}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {users.filter(u => u.userRole?.role === 'admin' || u.userRole?.role === 'super_admin').length}
            </div>
            <div className="text-sm text-gray-600">Admins</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {users.filter(u => u.userRole?.isActive).length}
            </div>
            <div className="text-sm text-gray-600">Active Admins</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {users.filter(u => u.userRole?.role === 'super_admin').length}
            </div>
            <div className="text-sm text-gray-600">Super Admins</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Roles</option>
              <option value="user">Public (FREE)</option>
              <option value="business">Business (£49/mo)</option>
              <option value="premium_business">Premium Business</option>
              <option value="police">Police</option>
              <option value="admin">Admins</option>
              <option value="super_admin">Super Admins</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        Showing {filteredUsers.length} of {users.length} users
      </div>

      {/* Users List */}
      <div className="space-y-3">
        {filteredUsers.map((userItem) => {
          const isProcessing = processingUserId === userItem.uid
          const isCurrentUser = userItem.uid === user?.uid
          
          return (
            <Card key={userItem.uid} className={isProcessing ? 'opacity-50' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {userItem.displayName?.[0]?.toUpperCase() || userItem.email[0].toUpperCase()}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">
                          {userItem.displayName || 'No Name'}
                        </h3>
                        {getRoleBadge(userItem.userRole?.role)}
                        {isCurrentUser && (
                          <Badge variant="outline" className="text-xs">You</Badge>
                        )}
                        {userItem.userRole && !userItem.userRole.isActive && (
                          <Badge variant="destructive" className="gap-1">
                            <Ban className="w-3 h-3" />
                            Inactive
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {userItem.email}
                        </div>
                        {userItem.createdAt && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Joined {typeof userItem.createdAt === 'object' && 'toDate' in userItem.createdAt 
                              ? userItem.createdAt.toDate().toLocaleDateString()
                              : new Date(userItem.createdAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Menu */}
                  {!isCurrentUser && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={isProcessing}>
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {/* View & Edit Details - NEW! */}
                        <DropdownMenuItem onClick={() => openUserDetails(userItem)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View & Edit Details
                        </DropdownMenuItem>
                        
                        {!userItem.userRole || userItem.userRole.role === 'user' ? (
                          <>
                            <DropdownMenuItem onClick={() => handleAssignRole(userItem.uid, 'business')}>
                              <Users className="w-4 h-4 mr-2" />
                              Make Business
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAssignRole(userItem.uid, 'premium_business')}>
                              <ShieldAlert className="w-4 h-4 mr-2" />
                              Make Premium Business
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAssignRole(userItem.uid, 'police')}>
                              <Shield className="w-4 h-4 mr-2" />
                              Make Police
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAssignRole(userItem.uid, 'admin')}>
                              <ShieldCheck className="w-4 h-4 mr-2" />
                              Make Admin
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <>
                            {/* Role Change Options */}
                            {userItem.userRole.role !== 'business' && (
                              <DropdownMenuItem onClick={() => handleAssignRole(userItem.uid, 'business')}>
                                <Users className="w-4 h-4 mr-2" />
                                Change to Business
                              </DropdownMenuItem>
                            )}
                            {userItem.userRole.role !== 'premium_business' && (
                              <DropdownMenuItem onClick={() => handleAssignRole(userItem.uid, 'premium_business')}>
                                <ShieldAlert className="w-4 h-4 mr-2" />
                                Change to Premium Business
                              </DropdownMenuItem>
                            )}
                            {userItem.userRole.role !== 'police' && (
                              <DropdownMenuItem onClick={() => handleAssignRole(userItem.uid, 'police')}>
                                <Shield className="w-4 h-4 mr-2" />
                                Change to Police
                              </DropdownMenuItem>
                            )}
                            {userItem.userRole.role !== 'admin' && (
                              <DropdownMenuItem onClick={() => handleAssignRole(userItem.uid, 'admin')}>
                                <ShieldCheck className="w-4 h-4 mr-2" />
                                Change to Admin
                              </DropdownMenuItem>
                            )}
                            
                            {/* Status Toggle */}
                            {userItem.userRole.isActive ? (
                              <DropdownMenuItem 
                                onClick={() => handleToggleStatus(userItem.uid, true)}
                                className="text-orange-600"
                              >
                                <UserX className="w-4 h-4 mr-2" />
                                Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => handleToggleStatus(userItem.uid, false)}
                                className="text-green-600"
                              >
                                <UserCheck className="w-4 h-4 mr-2" />
                                Activate
                              </DropdownMenuItem>
                            )}
                            
                            {/* Revoke Role */}
                            <DropdownMenuItem 
                              onClick={() => handleRevokeRole(userItem.uid)}
                              className="text-red-600"
                            >
                              <Ban className="w-4 h-4 mr-2" />
                              Revoke Role (Back to User)
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredUsers.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600">
              {searchTerm || roleFilter !== 'all' 
                ? "No users match your filters."
                : "No users to display."
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Enhanced User Details Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Management</DialogTitle>
            <DialogDescription>
              View and manage settings for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="limits">Request Limits</TabsTrigger>
                <TabsTrigger value="stats">Statistics</TabsTrigger>
              </TabsList>

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold">Display Name</Label>
                    <p className="text-sm text-gray-600">{selectedUser.displayName || 'Not set'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Email</Label>
                    <p className="text-sm text-gray-600">{selectedUser.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Role</Label>
                    <div className="mt-1">{getRoleBadge(selectedUser.userRole?.role)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Status</Label>
                    <div className="mt-1">
                      <Badge variant={selectedUser.userRole?.isActive === false ? 'destructive' : 'default'}>
                        {selectedUser.userRole?.isActive === false ? 'Inactive' : 'Active'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Joined</Label>
                    <p className="text-sm text-gray-600">
                      {typeof selectedUser.createdAt === 'object' && 'toDate' in selectedUser.createdAt 
                        ? selectedUser.createdAt.toDate().toLocaleDateString()
                        : new Date(selectedUser.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">User ID</Label>
                    <p className="text-sm text-gray-600 font-mono text-xs break-all">{selectedUser.uid}</p>
                  </div>
                </div>

                {selectedUser.address && (
                  <div>
                    <Label className="text-sm font-semibold">Address</Label>
                    <p className="text-sm text-gray-600">
                      {selectedUser.address.formattedAddress || 'Not set'}
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* Request Limits Tab - THIS IS THE KEY FEATURE! */}
              <TabsContent value="limits" className="space-y-4">
                <Alert>
                  <Settings className="w-4 h-4" />
                  <AlertDescription>
                    Adjust request limits for this user. Changes take effect immediately.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="weeklyLimit">Weekly Request Limit</Label>
                    <Input
                      id="weeklyLimit"
                      type="number"
                      min="0"
                      max="100"
                      value={editingLimits.weeklyLimit}
                      onChange={(e) => setEditingLimits({ ...editingLimits, weeklyLimit: parseInt(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum footage requests per week (default: 3 for Public tier)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="monthlyLimit">Monthly Request Limit</Label>
                    <Input
                      id="monthlyLimit"
                      type="number"
                      min="0"
                      max="500"
                      value={editingLimits.monthlyLimit}
                      onChange={(e) => setEditingLimits({ ...editingLimits, monthlyLimit: parseInt(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum footage requests per month
                    </p>
                  </div>

                  <div className="pt-4 border-t">
                    <Label className="text-sm font-semibold mb-3 block">Current Usage</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="pt-4">
                          <p className="text-xs text-gray-500">This Week</p>
                          <p className="text-2xl font-semibold">
                            {selectedUser.rateLimits?.weeklyRequestCount || 0}
                            <span className="text-sm text-gray-500"> / {selectedUser.rateLimits?.weeklyLimit || 3}</span>
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4">
                          <p className="text-xs text-gray-500">Reset Date</p>
                          <p className="text-sm font-medium">
                            {selectedUser.rateLimits?.resetDate 
                              ? new Date(selectedUser.rateLimits.resetDate).toLocaleDateString()
                              : 'Not set'}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <Button onClick={updateUserLimits} className="w-full" size="lg">
                    <Settings className="w-4 h-4 mr-2" />
                    Save Request Limits
                  </Button>
                </div>
              </TabsContent>

              {/* Statistics Tab */}
              <TabsContent value="stats" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Total Cameras</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">0</p>
                      <p className="text-xs text-gray-500 mt-1">Registered cameras</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">0</p>
                      <p className="text-xs text-gray-500 mt-1">Footage requests made</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Footage Shared</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">0</p>
                      <p className="text-xs text-gray-500 mt-1">Times shared footage</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Account Age</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">
                        {Math.floor((Date.now() - (typeof selectedUser.createdAt === 'object' && 'toDate' in selectedUser.createdAt 
                          ? selectedUser.createdAt.toDate().getTime()
                          : new Date(selectedUser.createdAt).getTime())) / (1000 * 60 * 60 * 24))}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Days since joining</p>
                    </CardContent>
                  </Card>
                </div>

                <Alert>
                  <Activity className="w-4 h-4" />
                  <AlertDescription>
                    Detailed activity logs and statistics will be available here in a future update.
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
