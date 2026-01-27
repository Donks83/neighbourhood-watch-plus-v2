# Update roles to new tier system
file_path = r'C:\Claude\neighbourhood-watch-plus-v2-main\src\components\admin\user-management.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Update role badge config
old_role_config = """    const roleConfig = {
      super_admin: { icon: Crown, label: 'Super Admin', className: 'bg-purple-600 text-white' },
      admin: { icon: ShieldCheck, label: 'Admin', className: 'bg-blue-600 text-white' },
      police: { icon: Shield, label: 'Police', className: 'bg-indigo-600 text-white' },
      insurance: { icon: ShieldAlert, label: 'Insurance', className: 'bg-teal-600 text-white' },
      security: { icon: ShieldCheck, label: 'Security', className: 'bg-gray-600 text-white' }
    }"""

new_role_config = """    const roleConfig = {
      super_admin: { icon: Crown, label: 'Super Admin', className: 'bg-purple-600 text-white' },
      admin: { icon: ShieldCheck, label: 'Admin', className: 'bg-blue-600 text-white' },
      police: { icon: Shield, label: 'Police', className: 'bg-indigo-600 text-white' },
      premium_business: { icon: ShieldAlert, label: 'Premium Business', className: 'bg-teal-600 text-white' },
      business: { icon: Users, label: 'Business', className: 'bg-green-600 text-white' }
    }"""

content = content.replace(old_role_config, new_role_config)

# Update dropdown menu options for regular users
old_dropdown = """                            <DropdownMenuItem onClick={() => handleAssignRole(userItem.uid, 'admin')}>
                              <ShieldCheck className="w-4 h-4 mr-2" />
                              Make Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAssignRole(userItem.uid, 'police')}>
                              <Shield className="w-4 h-4 mr-2" />
                              Make Police
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAssignRole(userItem.uid, 'insurance')}>
                              <ShieldAlert className="w-4 h-4 mr-2" />
                              Make Insurance
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAssignRole(userItem.uid, 'security')}>
                              <ShieldCheck className="w-4 h-4 mr-2" />
                              Make Security
                            </DropdownMenuItem>"""

new_dropdown = """                            <DropdownMenuItem onClick={() => handleAssignRole(userItem.uid, 'business')}>
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
                            </DropdownMenuItem>"""

content = content.replace(old_dropdown, new_dropdown)

# Update dropdown for existing role holders
old_change_dropdown = """                            {/* Role Change Options */}
                            {userItem.userRole.role !== 'admin' && (
                              <DropdownMenuItem onClick={() => handleAssignRole(userItem.uid, 'admin')}>
                                <ShieldCheck className="w-4 h-4 mr-2" />
                                Change to Admin
                              </DropdownMenuItem>
                            )}
                            {userItem.userRole.role !== 'police' && (
                              <DropdownMenuItem onClick={() => handleAssignRole(userItem.uid, 'police')}>
                                <Shield className="w-4 h-4 mr-2" />
                                Change to Police
                              </DropdownMenuItem>
                            )}
                            {userItem.userRole.role !== 'insurance' && (
                              <DropdownMenuItem onClick={() => handleAssignRole(userItem.uid, 'insurance')}>
                                <ShieldAlert className="w-4 h-4 mr-2" />
                                Change to Insurance
                              </DropdownMenuItem>
                            )}
                            {userItem.userRole.role !== 'security' && (
                              <DropdownMenuItem onClick={() => handleAssignRole(userItem.uid, 'security')}>
                                <ShieldCheck className="w-4 h-4 mr-2" />
                                Change to Security
                              </DropdownMenuItem>
                            )}"""

new_change_dropdown = """                            {/* Role Change Options */}
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
                            )}"""

content = content.replace(old_change_dropdown, new_change_dropdown)

# Update filter dropdown
old_filter = """            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Roles</option>
              <option value="user">Users</option>
              <option value="admin">Admins</option>
              <option value="super_admin">Super Admins</option>
              <option value="police">Police</option>
              <option value="insurance">Insurance</option>
              <option value="security">Security</option>
            </select>"""

new_filter = """            <select
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
            </select>"""

content = content.replace(old_filter, new_filter)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated to new tier system!")
