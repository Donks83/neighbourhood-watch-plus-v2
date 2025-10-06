# 🚀 Premium Features Integration Guide

## Quick Integration Checklist

### ✅ 1. Update Main Page Component

Replace your existing `incident-report-panel.tsx` with the enhanced version:

```typescript
// src/app/page.tsx - Update imports
import EnhancedIncidentReportPanel from '@/components/premium/enhanced-incident-report-panel'
import { useAuth } from '@/contexts/auth-context' // Your existing auth
import { SubscriptionService } from '@/lib/premium/premium-services'

// In your main component:
const { user } = useAuth()
const [userRole, setUserRole] = useState<UserRole>('community')
const [subscription, setSubscription] = useState(null)

// Load user subscription on mount
useEffect(() => {
  if (user?.uid) {
    SubscriptionService.getUserSubscription(user.uid)
      .then(sub => {
        if (sub) {
          setSubscription(sub)
          setUserRole(sub.role)
        }
      })
  }
}, [user])

// Replace old incident panel with enhanced version
<EnhancedIncidentReportPanel
  isOpen={isIncidentPanelOpen}
  onClose={() => setIsIncidentPanelOpen(false)}
  location={selectedLocation}
  onSubmit={handleEnhancedIncidentSubmit} // New handler
  onRadiusChange={setSelectedRadius}
  userRole={userRole}
  subscription={subscription}
/>
```

### ✅ 2. Add Premium Route Guards

```typescript
// src/components/premium/premium-route-guard.tsx
'use client'

import { useAuth } from '@/contexts/auth-context'
import { SubscriptionService } from '@/lib/premium/premium-services'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { UserRole } from '@/types/premium/subscription'

interface PremiumRouteGuardProps {
  children: React.ReactNode
  requiredRole: UserRole
  fallbackPath?: string
}

export default function PremiumRouteGuard({
  children,
  requiredRole,
  fallbackPath = '/'
}: PremiumRouteGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [hasAccess, setHasAccess] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function checkAccess() {
      if (loading) return
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      try {
        const subscription = await SubscriptionService.getUserSubscription(user.uid)
        
        if (!subscription || subscription.role !== requiredRole) {
          router.push(fallbackPath)
          return
        }

        setHasAccess(true)
      } catch (error) {
        console.error('Error checking access:', error)
        router.push(fallbackPath)
      } finally {
        setChecking(false)
      }
    }

    checkAccess()
  }, [user, loading, requiredRole, router, fallbackPath])

  if (loading || checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return hasAccess ? <>{children}</> : null
}
```

### ✅ 3. Create Premium Dashboard Pages

```typescript
// src/app/premium/police/page.tsx
import PremiumRouteGuard from '@/components/premium/premium-route-guard'
import PremiumDashboard from '@/components/premium/premium-dashboard'
import { Suspense } from 'react'

export default function PoliceDashboard() {
  return (
    <PremiumRouteGuard requiredRole="police">
      <Suspense fallback={<div>Loading dashboard...</div>}>
        <PremiumDashboard
          userRole="police"
          organization="Durham Police"
          onCreateRequest={() => {
            // Navigate to evidence request form
          }}
          onViewRequest={(requestId) => {
            // Navigate to request details
          }}
        />
      </Suspense>
    </PremiumRouteGuard>
  )
}
```

### ✅ 4. Update Firestore Security Rules

```javascript
// firestore.rules - Add these rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Existing rules...
    
    // Premium subscriptions - users can only access their own
    match /userSubscriptions/{subscriptionId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Community incidents - role-based access
    match /communityIncidents/{incidentId} {
      allow read: if request.auth != null &&
        (getUserRole(request.auth.uid) in resource.data.privacy.visibleTo);
      allow create: if request.auth != null &&
        request.auth.uid == request.resource.data.reporterId;
    }
    
    // Evidence requests - premium users only
    match /evidenceRequests/{requestId} {
      allow read, write: if request.auth != null &&
        isPremiumUser(request.auth.uid);
    }
    
    // Evidence matches - camera owners and requesters
    match /evidenceMatches/{matchId} {
      allow read: if request.auth != null &&
        (request.auth.uid == resource.data.ownerId ||
         request.auth.uid == getRequesterId(resource.data.requestId));
      allow update: if request.auth != null &&
        request.auth.uid == resource.data.ownerId;
    }
    
    // User wallets - users can only access their own
    match /userWallets/{userId} {
      allow read, write: if request.auth != null &&
        request.auth.uid == userId;
    }
    
    // Token rewards - users can only read their own
    match /tokenRewards/{rewardId} {
      allow read: if request.auth != null &&
        request.auth.uid == resource.data.recipientId;
    }
    
    // Helper functions
    function getUserRole(userId) {
      return get(/databases/$(database)/documents/users/$(userId)).data.role;
    }
    
    function isPremiumUser(userId) {
      let user = get(/databases/$(database)/documents/users/$(userId)).data;
      return user.role in ['police', 'insurance', 'security', 'admin'];
    }
    
    function getRequesterId(requestId) {
      return get(/databases/$(database)/documents/evidenceRequests/$(requestId)).data.requesterId;
    }
  }
}
```

### ✅ 5. Environment Variables

Add these to your `.env.local`:

```bash
# Premium Feature Configuration
NEXT_PUBLIC_ANONYMOUS_SALT=your-secret-anonymization-salt
NEXT_PUBLIC_CUSTODY_SALT=your-secret-custody-salt
NEXT_PUBLIC_PREMIUM_FEATURES_ENABLED=true

# Payment Integration (Stripe)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email Service (SendGrid)
SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=noreply@neighbourhoodwatchplus.com
```

## 📋 Step-by-Step Integration

### Step 1: Basic Premium Features

**Update your main page to use enhanced incident reporting:**

```typescript
// Replace your existing incident submit handler
const handleEnhancedIncidentSubmit = async (data: EnhancedIncidentFormData) => {
  try {
    if (data.requestEvidence && userRole !== 'community') {
      // Premium evidence request
      const result = await EvidenceRequestService.createEvidenceRequest(
        {
          requesterId: user!.uid,
          requesterRole: userRole,
          requesterOrganization: subscription?.verification.organizationName || 'Unknown',
          incident: {
            location: selectedLocation,
            timeWindow: {
              start: Timestamp.fromDate(data.incidentDateTime),
              end: Timestamp.fromDate(new Date(data.incidentDateTime.getTime() + 2 * 60 * 60 * 1000)) // +2 hours
            },
            radius: data.requestRadius,
            description: data.description,
            type: data.incidentType,
            urgency: data.urgency || 'routine'
          },
          targeting: {
            evidenceTypes: ['cctv', 'doorbell', 'dashcam'],
            qualityRequirements: 'good',
            maxSources: 15
          },
          budget: {
            maxTotalReward: data.maxBudget || 200,
            rewardPerSource: 50
          },
          legalBasis: data.legalBasis || 'Investigation purposes',
          status: 'active',
          expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) // +7 days
        },
        cameras // Your existing camera data
      )
      
      console.log(`Evidence request created: ${result.requestId}`)
      console.log(`Found ${result.matches.length} potential sources`)
      console.log(`Estimated cost: £${result.estimatedCost}`)
      
    } else {
      // Community incident report
      await IncidentReportingService.createCommunityIncident({
        reporterId: generateAnonymousId(user!.uid),
        reporterRole: userRole,
        location: selectedLocation,
        displayLocation: selectedLocation, // Will be automatically fuzzed if anonymous
        incidentDateTime: Timestamp.fromDate(data.incidentDateTime),
        type: data.incidentType,
        severity: data.severity || 'medium',
        title: data.title || `${data.incidentType} incident`,
        description: data.description,
        privacy: {
          visibleTo: data.visibleTo,
          anonymousReporting: data.anonymousReporting,
          contactAllowed: data.contactAllowed
        },
        status: 'reported',
        tags: data.tags || [],
        legalCompliance: {
          retentionPeriod: 2555, // 7 years
          dataProcessingBasis: 'Public task (community safety)',
          consentGiven: true
        }
      })
    }
    
    // Show success message
    setNotification({
      type: 'success',
      message: data.requestEvidence ? 'Evidence request sent to nearby cameras' : 'Incident reported successfully'
    })
    
  } catch (error) {
    console.error('Error submitting incident:', error)
    setNotification({
      type: 'error',
      message: 'Failed to submit incident. Please try again.'
    })
  }
}
```

### Step 2: Add Premium Dashboard Navigation

```typescript
// Add to your existing navigation component
const PremiumNavigation = ({ userRole }: { userRole: UserRole }) => {
  if (userRole === 'community') return null
  
  const dashboardPaths = {
    police: '/premium/police',
    insurance: '/premium/insurance', 
    security: '/premium/security'
  }
  
  return (
    <div className="premium-nav">
      <Link href={dashboardPaths[userRole]} className="premium-dashboard-link">
        <CrownIcon className="w-4 h-4 mr-2" />
        Professional Dashboard
      </Link>
    </div>
  )
}
```

### Step 3: Add Real-time Evidence Notifications

```typescript
// In your main app or layout component
const useEvidenceNotifications = (userRole: UserRole, userId: string) => {
  const [pendingRequests, setPendingRequests] = useState<EvidenceMatch[]>([])
  
  useEffect(() => {
    if (userRole === 'community' && userId) {
      // Listen for evidence requests for community users
      const unsubscribe = RealtimeService.listenToEvidenceRequests(
        userId,
        (matches) => {
          setPendingRequests(matches)
          
          // Show notification for new requests
          if (matches.length > 0) {
            showNotification({
              title: 'New Evidence Request',
              message: `£${matches[0].estimatedReward} reward for camera footage`,
              action: () => openEvidenceUploadPortal(matches[0])
            })
          }
        }
      )
      
      return unsubscribe
    }
  }, [userRole, userId])
  
  return pendingRequests
}
```

### Step 4: Add Subscription Management

```typescript
// Create subscription upgrade flow
const SubscriptionUpgrade = () => {
  const handleSelectPlan = async (tier: SubscriptionTier, orgDetails: OrganizationDetails) => {
    try {
      // Create subscription
      const subscriptionId = await SubscriptionService.createSubscription({
        userId: user!.uid,
        tier,
        role: tier.role,
        status: 'trial', // Start with trial
        billing: {
          billingEmail: orgDetails.contactEmail,
          nextBilling: Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)) // 14 days
        },
        usage: {
          monthlyRequests: 0,
          totalSpent: 0,
          requestsRemaining: tier.limits.monthlyRequests
        },
        verification: {
          organizationName: orgDetails.name,
          badgeNumber: orgDetails.badgeNumber,
          licenseNumber: orgDetails.licenseNumber,
          verificationStatus: 'pending'
        }
      })
      
      // Redirect to premium dashboard
      router.push(`/premium/${tier.role}`)
      
    } catch (error) {
      console.error('Error creating subscription:', error)
    }
  }
  
  return (
    <SubscriptionPortal
      onSelectPlan={handleSelectPlan}
      onStartTrial={handleSelectPlan}
    />
  )
}
```

## 🔧 Testing the Integration

### 1. Test Community Features

```bash
# Start your development server
npm run dev

# Test community incident reporting:
# 1. Create incident report (should create fuzzy location)
# 2. Check Firestore for communityIncidents collection
# 3. Verify privacy settings are applied
```

### 2. Test Premium Features

```bash
# Create test premium user:
# 1. Register new user
# 2. Manually add subscription to Firestore:
```

```json
{
  "userId": "test-user-id",
  "role": "police",
  "status": "active",
  "tier": { "name": "Police Basic" },
  "usage": { "requestsRemaining": 25 }
}
```

```bash
# 3. Test evidence request creation
# 4. Check evidenceRequests and evidenceMatches collections
```

### 3. Test Wallet System

```bash
# Create test reward:
# 1. Create evidence match response
# 2. Check tokenRewards collection
# 3. Verify wallet balance updates
```

## 📊 Monitoring & Analytics

Add these to track premium feature usage:

```typescript
// Analytics tracking
const trackPremiumEvent = (event: string, properties: any) => {
  // Google Analytics 4
  gtag('event', event, {
    event_category: 'premium_features',
    ...properties
  })
  
  // Custom analytics
  console.log('Premium Event:', { event, properties })
}

// Track key events
trackPremiumEvent('evidence_request_created', {
  user_role: userRole,
  estimated_cost: result.estimatedCost,
  match_count: result.matches.length
})

trackPremiumEvent('subscription_created', {
  tier: tier.name,
  role: tier.role,
  monthly_fee: tier.pricing.monthlyFee
})
```

## 🚨 Important Notes

1. **Security**: Never expose exact user locations to community users
2. **Legal**: Ensure GDPR compliance with data retention policies
3. **Performance**: Use Firestore indexes for efficient queries
4. **Billing**: Integrate with Stripe for production payments
5. **Support**: Set up customer support for premium users

## 🎯 Quick Start Checklist

- [ ] Copy premium components to your project
- [ ] Update main page with enhanced incident panel
- [ ] Add premium route guards
- [ ] Create dashboard pages for each role
- [ ] Update Firestore security rules
- [ ] Add environment variables
- [ ] Test community incident reporting
- [ ] Test premium evidence requests
- [ ] Integrate payment processing
- [ ] Set up real-time notifications

Your premium evidence marketplace is now ready! 🎉
