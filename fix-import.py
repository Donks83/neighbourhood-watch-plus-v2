# Fix duplicate import in admin page.tsx
import re

file_path = r'C:\Claude\neighbourhood-watch-plus-v2-main\src\app\admin\page.tsx'

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove the incorrect import line 8
    content = content.replace(
        "import EmailBlockingManager from '@/components/admin/admin-verification-queue-enhanced'\n",
        ""
    )
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Fixed duplicate import!")
    
except Exception as e:
    print(f"❌ Error: {e}")
