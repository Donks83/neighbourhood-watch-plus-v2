# Remove old users TabsContent section
import re

with open('page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the old users TabsContent section (from line 413 to the end of that TabsContent)
# Pattern: from "<!-- User Management Tab WITH ROLE ASSIGNMENT -->" to the closing TabsContent before "Verification Tab"
pattern = r'\s*\{/\* User Management Tab WITH ROLE ASSIGNMENT \*/\}\s*<TabsContent value="users".*?</TabsContent>\s*(?=\s*\{/\* Verification Tab \*/\})'

content = re.sub(pattern, '\n          ', content, flags=re.DOTALL)

with open('page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Removed old users TabsContent section!")
