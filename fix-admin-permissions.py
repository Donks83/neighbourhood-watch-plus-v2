# Fix admin.ts permissions object to use new tier system
file_path = r'C:\Claude\neighbourhood-watch-plus-v2-main\src\lib\admin.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace 'insurance' key with 'premium_business'
content = content.replace('    insurance: {', '    premium_business: {')

# Replace 'security' key with 'business'
content = content.replace('    security: {', '    business: {')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed admin.ts permissions object!")
print("Replaced: insurance -> premium_business")
print("Replaced: security -> business")
