# Update verification types
file_path = r'C:\Claude\neighbourhood-watch-plus-v2-main\src\types\verification.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Update the UserRoleType
old_type = """// User Role and Permission System
// Includes community roles (user) and premium roles (police, insurance, security)
export type UserRoleType = 'user' | 'police' | 'insurance' | 'security' | 'admin' | 'super_admin'"""

new_type = """// User Role and Permission System
// New tier system: Public → Business → Premium Business → Police → Admin → Super Admin
export type UserRoleType = 'user' | 'business' | 'premium_business' | 'police' | 'admin' | 'super_admin'"""

content = content.replace(old_type, new_type)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated verification types!")
