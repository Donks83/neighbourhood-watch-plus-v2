# Fix all old role references in page.tsx
file_path = r'C:\Claude\neighbourhood-watch-plus-v2-main\src\app\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the role check in badge styling (line 616)
old_role_check = "(userProfile?.role === 'police' || userProfile?.role === 'insurance' || userProfile?.role === 'security') && \"bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200\""
new_role_check = """userProfile?.role === 'business' && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                            userProfile?.role === 'premium_business' && "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
                            userProfile?.role === 'police' && "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"""

content = content.replace(old_role_check, new_role_check)

# Fix the badge text labels
old_labels = """                            {userProfile?.role === 'police' && 'Police'}
                            {userProfile?.role === 'insurance' && 'Insurance'}
                            {userProfile?.role === 'security' && 'Security'}"""

new_labels = """                            {userProfile?.role === 'business' && 'Business'}
                            {userProfile?.role === 'premium_business' && 'Premium Business'}
                            {userProfile?.role === 'police' && 'Police'}"""

content = content.replace(old_labels, new_labels)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed all role badge references!")
print("Updated: role check styling")
print("Updated: badge text labels")
print("Added: business and premium_business roles")
