# Fix broken JSX in admin-verification-queue-enhanced.tsx
import re

with open('admin-verification-queue-enhanced.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix line 606 - Night Vision
content = content.replace("nightVision ? 'Yes ?' : 'No'", "nightVision ? 'Yes ✓' : 'No'")

# Fix line 610 - View Distance (broken template string)
content = re.sub(
    r'viewDistance \? \\\\m\\ : \'Unknown\'',
    'viewDistance ? `${item.cameraDetails.viewDistance}m` : \'Unknown\'',
    content
)

with open('admin-verification-queue-enhanced.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed broken JSX!")
