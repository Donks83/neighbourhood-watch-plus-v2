# Fix visibleTo array in enhanced-incident-report-panel.tsx
file_path = r'C:\Claude\neighbourhood-watch-plus-v2-main\src\components\premium\enhanced-incident-report-panel.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the visibleTo default values (line 183)
old_visible = "visibleTo: isCommunityUser ? ['police'] : ['police', 'insurance'],"
new_visible = "visibleTo: isCommunityUser ? ['police'] : ['police', 'premium_business'],"

content = content.replace(old_visible, new_visible)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed visibleTo array!")
print("Old: ['police', 'insurance']")
print("New: ['police', 'premium_business']")
