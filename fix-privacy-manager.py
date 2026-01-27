# Fix privacy-manager.ts to use new tier system
file_path = r'C:\Claude\neighbourhood-watch-plus-v2-main\src\lib\premium\privacy-manager.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the exactLocationAccess array (line 27)
old_access = "exactLocationAccess: ['police', 'insurance', 'admin']"
new_access = "exactLocationAccess: ['police', 'premium_business', 'admin', 'super_admin']"

content = content.replace(old_access, new_access)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed privacy-manager.ts!")
print("Old: police, insurance, admin")
print("New: police, premium_business, admin, super_admin")
