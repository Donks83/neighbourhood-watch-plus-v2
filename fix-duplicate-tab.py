# Remove duplicate User Management tab
file_path = r'C:\Claude\neighbourhood-watch-plus-v2-main\src\app\admin\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the old "users" tab trigger
old_tab = """            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              User Management
            </TabsTrigger>
            """

content = content.replace(old_tab, '')

# Update grid columns from 5 to 4
content = content.replace('grid-cols-5', 'grid-cols-4')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Removed duplicate User Management tab!")
