# Fix subscription.ts to use new tier system
file_path = r'C:\Claude\neighbourhood-watch-plus-v2-main\src\types\premium\subscription.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Update the UserRole type definition
old_type = "export type UserRole = 'community' | 'police' | 'insurance' | 'security' | 'admin'"
new_type = "export type UserRole = 'user' | 'business' | 'premium_business' | 'police' | 'admin' | 'super_admin'"

content = content.replace(old_type, new_type)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed subscription.ts UserRole type!")
print("Old: 'community' | 'police' | 'insurance' | 'security' | 'admin'")
print("New: 'user' | 'business' | 'premium_business' | 'police' | 'admin' | 'super_admin'")
