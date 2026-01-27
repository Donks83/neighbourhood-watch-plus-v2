# Fix subscription-portal.tsx to use new tier system
file_path = r'C:\Claude\neighbourhood-watch-plus-v2-main\src\components\premium\subscription-portal.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix all setSelectedRole calls
content = content.replace("setSelectedRole('insurance')", "setSelectedRole('premium_business')")
content = content.replace("setSelectedRole('security')", "setSelectedRole('business')")

# Fix default selected role
content = content.replace("const [selectedRole, setSelectedRole] = useState<UserRole>('police')", 
                         "const [selectedRole, setSelectedRole] = useState<UserRole>('business')")

# Fix org details default
content = content.replace("type: 'police'", "type: 'business'")

# Update card titles and content
content = content.replace("Insurance Services", "Premium Business")
content = content.replace("Security Services", "Business")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed subscription-portal.tsx!")
print("Updated: insurance -> premium_business")
print("Updated: security -> business")
print("Updated: Default selection -> business")
