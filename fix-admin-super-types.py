# Fix admin-super.ts role type
file_path = r'C:\Claude\neighbourhood-watch-plus-v2-main\src\lib\admin-super.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the newRole type parameter
old_type = "newRole: 'user' | 'admin' | 'super_admin' | 'police' | 'insurance'"
new_type = "newRole: 'user' | 'business' | 'premium_business' | 'police' | 'admin' | 'super_admin'"

content = content.replace(old_type, new_type)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed admin-super.ts role type!")
print("Removed: 'insurance'")
print("Added: 'business', 'premium_business'")
