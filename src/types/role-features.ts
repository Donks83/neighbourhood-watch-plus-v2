// Updated role types for Neighbourhood Watch+
export type UserRoleType = 
  | 'user'              // Public (FREE) - Basic residents
  | 'business'          // Business (£49/mo) - Local businesses  
  | 'premium_business'  // Premium Business (£1,200-3,500/mo) - Insurance/Security
  | 'police'            // Police (£800-4,500/mo) - Law enforcement
  | 'admin'             // Admin (FREE) - Platform moderators
  | 'super_admin'       // Super Admin (FREE) - Platform owner

// Feature flags by role
export const ROLE_FEATURES = {
  user: {
    displayName: 'Public',
    price: 'FREE',
    maxCameras: 2,
    weeklyRequests: 3,
    historyDays: 7,
    hexMap: false,
    routeAnalysis: false,
    apiAccess: false,
    bulkOperations: false,
    teamAccounts: 1,
    support: 'community'
  },
  business: {
    displayName: 'Business',
    price: '£49/month',
    maxCameras: 10,
    weeklyRequests: 10,
    historyDays: 30,
    hexMap: false,
    routeAnalysis: false,
    apiAccess: false,
    bulkOperations: false,
    teamAccounts: 1,
    priorityResponse: true,
    support: 'email'
  },
  premium_business: {
    displayName: 'Premium Business',
    price: '£1,200-3,500/month',
    maxCameras: 999,
    weeklyRequests: 999,
    historyDays: 90,
    hexMap: true,
    routeAnalysis: true,
    apiAccess: true,
    bulkOperations: true,
    teamAccounts: 15,
    priorityResponse: true,
    support: 'dedicated'
  },
  police: {
    displayName: 'Police',
    price: '£800-4,500/month',
    maxCameras: 999,
    weeklyRequests: 999,
    historyDays: 999,
    hexMap: true,
    routeAnalysis: true,
    apiAccess: true,
    bulkOperations: true,
    teamAccounts: 50,
    priorityResponse: true,
    emergencyFlag: true,
    support: 'dedicated'
  },
  admin: {
    displayName: 'Admin',
    price: 'N/A',
    maxCameras: 0,
    weeklyRequests: 0,
    historyDays: 999,
    hexMap: true,
    routeAnalysis: true,
    apiAccess: false,
    bulkOperations: false,
    teamAccounts: 1,
    canVerify: true,
    canModerate: true,
    support: 'platform'
  },
  super_admin: {
    displayName: 'Super Admin',
    price: 'N/A',
    maxCameras: 999,
    weeklyRequests: 999,
    historyDays: 999,
    hexMap: true,
    routeAnalysis: true,
    apiAccess: true,
    bulkOperations: true,
    teamAccounts: 999,
    canVerify: true,
    canModerate: true,
    canManageUsers: true,
    canManageAdmins: true,
    support: 'platform'
  }
} as const
