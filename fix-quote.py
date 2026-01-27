# Fix missing quote in page.tsx
file_path = r'C:\Claude\neighbourhood-watch-plus-v2-main\src\app\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the malformed string - move the comma outside the closing quote
old_line = 'userProfile?.role === \'police\' && "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200,'
new_line = 'userProfile?.role === \'police\' && "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",'

content = content.replace(old_line, new_line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed missing closing quote!")
print("Old: ...dark:text-indigo-200,")
print('New: ...dark:text-indigo-200",')
