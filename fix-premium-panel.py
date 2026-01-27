# Fix enhanced-incident-report-panel.tsx to use new tier system
file_path = r'C:\Claude\neighbourhood-watch-plus-v2-main\src\components\premium\enhanced-incident-report-panel.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix isPremiumUser check (line 163)
old_premium_check = "const isPremiumUser = ['police', 'insurance', 'security'].includes(userRole)"
new_premium_check = "const isPremiumUser = ['premium_business', 'police', 'admin', 'super_admin'].includes(userRole)"

content = content.replace(old_premium_check, new_premium_check)

# Fix isCommunityUser check (line 164)
old_community_check = "const isCommunityUser = userRole === 'community'"
new_community_check = "const isCommunityUser = userRole === 'user' || userRole === 'business'"

content = content.replace(old_community_check, new_community_check)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed enhanced-incident-report-panel.tsx!")
print("Updated isPremiumUser: premium_business, police, admin, super_admin")
print("Updated isCommunityUser: user or business")
