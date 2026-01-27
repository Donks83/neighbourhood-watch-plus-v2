# Fix Timestamp conversion in user-management.tsx
import re

file_path = r'C:\Claude\neighbourhood-watch-plus-v2-main\src\components\admin\user-management.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the Timestamp conversion
old_text = "Joined {new Date(userItem.createdAt).toLocaleDateString()}"
new_text = """Joined {typeof userItem.createdAt === 'object' && 'toDate' in userItem.createdAt 
                              ? userItem.createdAt.toDate().toLocaleDateString()
                              : new Date(userItem.createdAt).toLocaleDateString()}"""

content = content.replace(old_text, new_text)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed Timestamp conversion!")
