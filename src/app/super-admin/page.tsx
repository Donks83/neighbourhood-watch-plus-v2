'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Users, Camera, Shield, Trash2, Edit, Search } from 'lucide-react'
import Link from 'next/link'
import { 
  getAllUsers, 
  getAllCameras, 
  updateUserRole, 
  deleteUser,
  deleteCamera 
} from '@/lib/admin-super'
import type { RegisteredCamera } from '@/types/camera'

interface UserData {
  uid: string
  email: string
  displayName: string
  role: string
  createdAt: Date
  cameraCount: number
  trustScore: number
}

interface CameraWithOwner extends RegisteredCamera {
  ownerEmail: string
  ownerName: string
  createdAt: Date  // Explicitly type as Date (overrides Timestamp)
  lastUpdated: Date  // Explicitly type as Date (overrides Timestamp)
}

export default function SuperAdminPage() {
  const router = useRouter()
  const { user, userRole } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState<UserData[]>([])
  const [cameras, setCameras] = useState<CameraWithOwner[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [editingRole, setEditingRole] = useState<string>('')
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'user' | 'camera', id: string, name: string } | null>(null)

  // Check super admin access
  useEffect(() => {
    if (!user || userRole?.role !== 'super_admin') {
      router.push('/')
    }
  }, [user, userRole, router])

  // Load data
  useEffect(() => {
    if (user && userRole?.role === 'super_admin') {
      loadData()
    }
  }, [user, userRole])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [usersData, camerasData] = await Promise.all([
        getAllUsers(),
        getAllCameras()
      ])
      setUsers(usersData)
      setCameras(camerasData)
    } catch (error) {
      console.error('Error loading admin data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateRole = async () => {
    if (!selectedUser || !editingRole) return

    try {
      await updateUserRole(selectedUser.uid, editingRole as any)
      await loadData()
      setSelectedUser(null)
      setEditingRole('')
    } catch (error) {
      console.error('Error updating role:', error)
      alert('Failed to update user role')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    try {
      if (deleteTarget.type === 'user') {
        await deleteUser(deleteTarget.id)
      } else {
        await deleteCamera(deleteTarget.id)
      }
      await loadData()
      setDeleteTarget(null)
    } catch (error) {
      console.error('Error deleting:', error)
      alert(`Failed to delete ${deleteTarget.type}`)
    }
  }

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredCameras = cameras.filter(c =>
    c.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Group cameras by user
  const camerasByUser = cameras.reduce((acc, camera) => {
    const key = camera.userId
    if (!acc[key]) {
      acc[key] = {
        userId: camera.userId,
        ownerEmail: camera.ownerEmail,
        ownerName: camera.ownerName,
        cameras: []
      }
    }
    acc[key].cameras.push(camera)
    return acc
  }, {} as Record<string, { userId: string, ownerEmail: string, ownerName: string, cameras: CameraWithOwner[] }>)

  if (!user || userRole?.role !== 'super_admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Map
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Super Admin Panel
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    System-wide management
                  </p>
                </div>
              </div>
            </div>
            <Badge variant="destructive">SUPER ADMIN</Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cameras</CardTitle>
              <Camera className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cameras.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(u => u.role === 'admin' || u.role === 'super_admin').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search users or cameras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
            <TabsTrigger value="cameras">Cameras ({cameras.length})</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>Manage user accounts and roles</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Cameras</TableHead>
                      <TableHead>Trust Score</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.uid}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>{user.displayName}</TableCell>
                        <TableCell>
                          <Badge variant={
                            user.role === 'super_admin' ? 'destructive' :
                            user.role === 'admin' ? 'default' :
                            'secondary'
                          }>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.cameraCount}</TableCell>
                        <TableCell>{user.trustScore || 50}</TableCell>
                        <TableCell>{user.createdAt.toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUser(user)
                                setEditingRole(user.role)
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setDeleteTarget({ 
                                type: 'user', 
                                id: user.uid, 
                                name: user.email 
                              })}
                              disabled={user.uid === userRole?.uid}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cameras Tab */}
          <TabsContent value="cameras" className="space-y-4">
            {Object.values(camerasByUser).map(({ userId, ownerEmail, ownerName, cameras: userCameras }) => (
              <Card key={userId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{ownerName || ownerEmail}</CardTitle>
                      <CardDescription>{userCameras.length} camera(s)</CardDescription>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (confirm(`Delete all ${userCameras.length} cameras for ${ownerEmail}?`)) {
                          Promise.all(userCameras.map(c => deleteCamera(c.id)))
                            .then(() => loadData())
                        }
                      }}
                    >
                      Delete All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Verification</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userCameras.map((camera) => (
                        <TableRow key={camera.id}>
                          <TableCell className="font-medium">{camera.name}</TableCell>
                          <TableCell>{camera.type}</TableCell>
                          <TableCell>
                            <Badge variant={camera.status === 'active' ? 'default' : 'secondary'}>
                              {camera.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              camera.verification?.status === 'approved' ? 'default' :
                              camera.verification?.status === 'pending' ? 'secondary' :
                              'destructive'
                            }>
                              {camera.verification?.status || 'unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>{camera.createdAt.toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setDeleteTarget({
                                type: 'camera',
                                id: camera.id,
                                name: camera.name
                              })}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Role Dialog */}
      {selectedUser && (
        <AlertDialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Edit User Role</AlertDialogTitle>
              <AlertDialogDescription>
                Change role for {selectedUser.email}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label>Role</Label>
              <Select value={editingRole} onValueChange={setEditingRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="police">Police</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleUpdateRole}>Update</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {deleteTarget.type} "{deleteTarget.name}"?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
