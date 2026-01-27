# Fix User Management - Add all role options
file_path = r'C:\Claude\neighbourhood-watch-plus-v2-main\src\components\admin\user-management.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the role options section
old_section = """                            <DropdownMenuItem onClick={() => handleAssignRole(userItem.uid, 'admin')}>
                              <ShieldCheck className="w-4 h-4 mr-2" />
                              Make Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAssignRole(userItem.uid, 'police')}>
                              <Shield className="w-4 h-4 mr-2" />
                              Make Police
                            </DropdownMenuItem>
                          </>"""

new_section = """                            <DropdownMenuItem onClick={() => handleAssignRole(userItem.uid, 'admin')}>
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
                            </DropdownMenuItem>
                          </>"""

content = content.replace(old_section, new_section)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Added insurance and security role options!")
