// Enhanced User Details Dialog
// Add this to the user-management.tsx file

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Add to component state:
const [selectedUser, setSelectedUser] = useState<any>(null)
const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
const [editingLimits, setEditingLimits] = useState({ weeklyLimit: 3, monthlyLimit: 12 })

// Function to open user details
const openUserDetails = (userItem: any) => {
  setSelectedUser(userItem)
  setEditingLimits({
    weeklyLimit: userItem.rateLimits?.weeklyLimit || 3,
    monthlyLimit: userItem.rateLimits?.monthlyLimit || 12
  })
  setIsEditDialogOpen(true)
}

// Function to update user limits
const updateUserLimits = async () => {
  if (!selectedUser) return
  
  try {
    const userRef = doc(db, 'users', selectedUser.uid)
    await updateDoc(userRef, {
      'rateLimits.weeklyLimit': editingLimits.weeklyLimit,
      'rateLimits.monthlyLimit': editingLimits.monthlyLimit,
      updatedAt: new Date()
    })
    
    toast({
      title: 'Limits Updated',
      description: `Request limits updated for ${selectedUser.email}`
    })
    
    setIsEditDialogOpen(false)
    loadUsers()
  } catch (error) {
    console.error('Error updating limits:', error)
    toast({
      title: 'Error',
      description: 'Failed to update request limits',
      variant: 'destructive'
    })
  }
}

// Add this JSX at the end of the component (before the final closing div):

{/* User Details Dialog */}
<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>User Management</DialogTitle>
      <DialogDescription>
        View and manage user settings for {selectedUser?.email}
      </DialogDescription>
    </DialogHeader>

    {selectedUser && (
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="limits">Limits</TabsTrigger>
          <TabsTrigger value="cameras">Cameras</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
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
              <p className="text-sm text-gray-600">{selectedUser.userRole?.role || 'user'}</p>
            </div>
            <div>
              <Label className="text-sm font-semibold">Status</Label>
              <p className="text-sm text-gray-600">
                {selectedUser.userRole?.isActive === false ? 'Inactive' : 'Active'}
              </p>
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
              <p className="text-sm text-gray-600 font-mono text-xs">{selectedUser.uid}</p>
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

        {/* Limits Tab */}
        <TabsContent value="limits" className="space-y-4">
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
                Maximum footage requests per week (default: 3 for free users)
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
              <Label className="text-sm font-semibold">Current Usage</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <p className="text-xs text-gray-500">This Week</p>
                  <p className="text-lg font-semibold">
                    {selectedUser.rateLimits?.weeklyRequestCount || 0} / {selectedUser.rateLimits?.weeklyLimit || 3}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Reset Date</p>
                  <p className="text-sm">
                    {selectedUser.rateLimits?.resetDate 
                      ? new Date(selectedUser.rateLimits.resetDate).toLocaleDateString()
                      : 'Not set'}
                  </p>
                </div>
              </div>
            </div>

            <Button onClick={updateUserLimits} className="w-full">
              Save Limits
            </Button>
          </div>
        </TabsContent>

        {/* Cameras Tab */}
        <TabsContent value="cameras" className="space-y-4">
          <div>
            <Label className="text-sm font-semibold mb-2 block">Registered Cameras</Label>
            <p className="text-sm text-gray-500 mb-4">
              User has registered {selectedUser.cameras?.length || 0} camera(s)
            </p>
            {/* TODO: Add camera list here when implementing camera management */}
            <div className="text-sm text-gray-400">
              Camera details will be displayed here
            </div>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <div>
            <Label className="text-sm font-semibold mb-2 block">Recent Activity</Label>
            <p className="text-sm text-gray-500 mb-4">
              Recent actions and events for this user
            </p>
            {/* TODO: Add activity log here */}
            <div className="text-sm text-gray-400">
              Activity log will be displayed here
            </div>
          </div>
        </TabsContent>
      </Tabs>
    )}
  </DialogContent>
</Dialog>

// Add "View Details" option to the dropdown menu (around line 350):
<DropdownMenuItem onClick={() => openUserDetails(userItem)}>
  <Eye className="w-4 h-4 mr-2" />
  View & Edit Details
</DropdownMenuItem>
