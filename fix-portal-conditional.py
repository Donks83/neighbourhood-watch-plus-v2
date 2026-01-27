# Fix remaining role checks in subscription-portal.tsx
file_path = r'C:\Claude\neighbourhood-watch-plus-v2-main\src\components\premium\subscription-portal.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the conditional check on line 247
old_check = "(selectedRole === 'insurance' || selectedRole === 'security')"
new_check = "(selectedRole === 'premium_business' || selectedRole === 'business')"

content = content.replace(old_check, new_check)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed conditional role check!")
print("Old: insurance || security")
print("New: premium_business || business")
