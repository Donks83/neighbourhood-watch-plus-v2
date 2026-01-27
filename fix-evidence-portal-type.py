# Fix evidence-upload-portal.tsx role type
file_path = r'C:\Claude\neighbourhood-watch-plus-v2-main\src\components\premium\evidence-upload-portal.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the role type in EvidenceRequest interface (line 63)
old_type = "role: 'police' | 'insurance' | 'security'"
new_type = "role: 'police' | 'premium_business' | 'business'"

content = content.replace(old_type, new_type)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed evidence-upload-portal.tsx role type!")
print("Updated: police | insurance | security")
print("To: police | premium_business | business")
