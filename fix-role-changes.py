# Add role change options for existing admins
file_path = r'C:\Claude\neighbourhood-watch-plus-v2-main\src\components\admin\user-management.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the section after "Make Security" and before the closing tag
# Add role management options for users who already have roles

old_section = """                          </>
                        ) : (
                          <>
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
                            <DropdownMenuItem 
                              onClick={() => handleRevokeRole(userItem.uid)}
                              className="text-red-600"
                            >
                              <Ban className="w-4 h-4 mr-2" />
                              Revoke Role
                            </DropdownMenuItem>
                          </>"""

new_section = """                          </>
                        ) : (
                          <>
                            {/* Role Change Options */}
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
                          </>"""

content = content.replace(old_section, new_section)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Added role change options for existing admins!")
