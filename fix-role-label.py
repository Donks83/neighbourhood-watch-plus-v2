# Fix role display label in enhanced-incident-report-panel.tsx
file_path = r'C:\Claude\neighbourhood-watch-plus-v2-main\src\components\premium\enhanced-incident-report-panel.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the role display label (line 612)
old_label = "{role === 'community' ? 'Community (anonymized)' : role}"
new_label = "{role === 'user' ? 'Public (anonymized)' : role.replace('_', ' ')}"

content = content.replace(old_label, new_label)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed role display label!")
print("Old: 'community' -> 'Community (anonymized)'")
print("New: 'user' -> 'Public (anonymized)'")
print("Also: Added replace for premium_business -> 'premium business'")
