# Add Firestore security rules for admin_logs and blocked_emails
file_path = r'C:\Claude\neighbourhood-watch-plus-v2-main\firestore.rules'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add the new rules before the closing braces
old_ending = """    // ============================================
    // ARCHIVED REQUESTS COLLECTION (for admin)
    // ============================================
    
    match /archivedRequests/{requestId} {
      // Read: Admin or original requester
      allow read: if isAdmin() || (isAuthenticated() && request.auth.uid == resource.data.requesterId);
      
      // Write: Admin only
      allow write: if isAdmin();
    }
  }
}"""

new_ending = """    // ============================================
    // ARCHIVED REQUESTS COLLECTION (for admin)
    // ============================================
    
    match /archivedRequests/{requestId} {
      // Read: Admin or original requester
      allow read: if isAdmin() || (isAuthenticated() && request.auth.uid == resource.data.requesterId);
      
      // Write: Admin only
      allow write: if isAdmin();
    }
    
    // ============================================
    // ADMIN LOGS COLLECTION (for activity tracking)
    // ============================================
    
    match /admin_logs/{logId} {
      // Read: Admin only (for viewing activity logs)
      allow read: if isAdmin();
      
      // Create: Admin only (system creates logs)
      allow create: if isAdmin();
      
      // Update/Delete: Super admin only
      allow update, delete: if isSuperAdmin();
    }
    
    // ============================================
    // BLOCKED EMAILS COLLECTION (for spam prevention)
    // ============================================
    
    match /blocked_emails/{domain} {
      // Read: Admin only
      allow read: if isAdmin();
      
      // Write: Super admin only
      allow write: if isSuperAdmin();
    }
  }
}"""

content = content.replace(old_ending, new_ending)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Added Firestore security rules for admin_logs and blocked_emails!")
