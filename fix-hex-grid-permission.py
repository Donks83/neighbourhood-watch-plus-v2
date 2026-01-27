# Fix page.tsx hex grid permission check
file_path = r'C:\Claude\neighbourhood-watch-plus-v2-main\src\app\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the old role check with new tier system
old_check = "return role === 'police' || role === 'insurance' || role === 'security' || role === 'admin' || role === 'super_admin'"
new_check = "return role === 'premium_business' || role === 'police' || role === 'admin' || role === 'super_admin'"

content = content.replace(old_check, new_check)

# Also update the comment to be clearer
old_comment = "  // Regular community members NEVER see the grid (privacy protection)"
new_comment = "  // Regular community members NEVER see the grid (privacy protection)\n  // Only Premium Business, Police, Admin, and Super Admin can see hex map"

content = content.replace(old_comment, new_comment)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed hex grid permission check!")
print("Removed old roles: insurance, security")
print("Added new role: premium_business")
