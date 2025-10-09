import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  writeBatch,
  onSnapshot
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { 
  UserSubscription, 
  CommunityIncident, 
  EvidenceRequest, 
  EvidenceMatch, 
  TokenReward, 
  UserWallet, 
  ChainOfCustody,
  UserRole 
} from '@/types/premium/subscription'
import type { RegisteredCamera } from '@/types/camera'
import { EvidenceMatchingEngine, type MatchingCriteria } from './evidence-matching'
import { ChainOfCustodyManager } from './chain-of-custody'
import { LocationPrivacyManager } from './privacy-manager'

// =============================================================================
// FIRESTORE COLLECTIONS
// =============================================================================

export const PREMIUM_COLLECTIONS = {
  userSubscriptions: 'userSubscriptions',
  communityIncidents: 'communityIncidents', 
  evidenceRequests: 'evidenceRequests',
  evidenceMatches: 'evidenceMatches',
  tokenRewards: 'tokenRewards',
  userWallets: 'userWallets',
  chainOfCustody: 'chainOfCustody',
  auditLogs: 'auditLogs',
  anonymousUsers: 'anonymousUsers'
} as const

// =============================================================================
// SUBSCRIPTION MANAGEMENT
// =============================================================================

export class SubscriptionService {
  /**
   * Create new user subscription
   */
  static async createSubscription(subscription: Omit<UserSubscription, 'createdAt' | 'updatedAt'>): Promise<string> {
    const subscriptionData = {
      ...subscription,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }
    
    const docRef = await addDoc(collection(db, PREMIUM_COLLECTIONS.userSubscriptions), subscriptionData)
    
    // Update user profile with subscription info
    await this.updateUserProfile(subscription.userId, {
      role: subscription.role,
      subscription: {
        tier: subscription.tier.name,
        status: subscription.status
      }
    })
    
    return docRef.id
  }

  /**
   * Get user subscription
   */
  static async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    const q = query(
      collection(db, PREMIUM_COLLECTIONS.userSubscriptions),
      where('userId', '==', userId),
      where('status', 'in', ['active', 'trial']),
      limit(1)
    )
    
    const snapshot = await getDocs(q)
    if (snapshot.empty) return null
    
    const doc = snapshot.docs[0]
    return { id: doc.id, ...doc.data() } as UserSubscription
  }

  /**
   * Update subscription usage
   */
  static async updateUsage(userId: string, requestsUsed: number, amountSpent: number): Promise<void> {
    const subscription = await this.getUserSubscription(userId)
    if (!subscription) throw new Error('No active subscription found')
    
    const updatedUsage = {
      monthlyRequests: subscription.usage.monthlyRequests + requestsUsed,
      totalSpent: subscription.usage.totalSpent + amountSpent,
      requestsRemaining: Math.max(0, subscription.usage.requestsRemaining - requestsUsed)
    }
    
    await updateDoc(doc(db, PREMIUM_COLLECTIONS.userSubscriptions, subscription.id!), {
      usage: updatedUsage,
      updatedAt: Timestamp.now()
    })
  }

  /**
   * Check if user can make evidence request
   */
  static async canMakeRequest(userId: string): Promise<{
    canRequest: boolean
    reason?: string
    requestsRemaining?: number
  }> {
    const subscription = await this.getUserSubscription(userId)
    
    if (!subscription) {
      return { canRequest: false, reason: 'No active subscription' }
    }
    
    if (subscription.status !== 'active' && subscription.status !== 'trial') {
      return { canRequest: false, reason: 'Subscription not active' }
    }
    
    if (subscription.usage.requestsRemaining <= 0) {
      return { 
        canRequest: false, 
        reason: 'Monthly request limit reached',
        requestsRemaining: 0
      }
    }
    
    return { 
      canRequest: true, 
      requestsRemaining: subscription.usage.requestsRemaining 
    }
  }

  private static async updateUserProfile(userId: string, updates: any): Promise<void> {
    // Update the existing user profile with subscription info
    await updateDoc(doc(db, 'users', userId), {
      ...updates,
      lastUpdated: Timestamp.now()
    })
  }
}

// =============================================================================
// INCIDENT REPORTING SERVICE
// =============================================================================

export class IncidentReportingService {
  /**
   * Create community incident with privacy protection
   */
  static async createCommunityIncident(
    incident: Omit<CommunityIncident, 'id' | 'reportedAt' | 'updatedAt'>
  ): Promise<string> {
    // Apply location privacy if needed
    const privacyManager = new LocationPrivacyManager()
    let displayLocation = incident.displayLocation
    
    if (incident.privacy.anonymousReporting) {
      const fuzzyLocation = privacyManager.createFuzzyLocation(incident.location)
      displayLocation = fuzzyLocation.displayLocation
    }
    
    const incidentData = {
      ...incident,
      displayLocation,
      reportedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }
    
    const docRef = await addDoc(collection(db, PREMIUM_COLLECTIONS.communityIncidents), incidentData)
    
    // Log the incident creation
    await this.logAuditEvent('incident_created', {
      incidentId: docRef.id,
      reporterId: incident.reporterId,
      type: incident.type,
      location: incident.displayLocation // Use display location for audit
    })
    
    return docRef.id
  }

  /**
   * Get incidents visible to user role
   */
  static async getIncidentsForRole(
    userRole: UserRole,
    location?: { lat: number; lng: number; radius: number }
  ): Promise<CommunityIncident[]> {
    let q = query(
      collection(db, PREMIUM_COLLECTIONS.communityIncidents),
      where('privacy.visibleTo', 'array-contains', userRole),
      orderBy('reportedAt', 'desc'),
      limit(50)
    )
    
    const snapshot = await getDocs(q)
    const incidents = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as CommunityIncident[]
    
    // Filter by location if specified
    if (location) {
      return incidents.filter(incident => {
        const distance = this.calculateDistance(
          incident.displayLocation,
          { lat: location.lat, lng: location.lng }
        )
        return distance <= location.radius
      })
    }
    
    return incidents
  }

  private static calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    const R = 6371000 // Earth's radius in meters
    const lat1Rad = (point1.lat * Math.PI) / 180
    const lat2Rad = (point2.lat * Math.PI) / 180
    const deltaLatRad = ((point2.lat - point1.lat) * Math.PI) / 180
    const deltaLngRad = ((point2.lng - point1.lng) * Math.PI) / 180

    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    
    return R * c
  }

  private static async logAuditEvent(eventType: string, details: any): Promise<void> {
    await addDoc(collection(db, PREMIUM_COLLECTIONS.auditLogs), {
      eventType,
      details,
      timestamp: Timestamp.now(),
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    })
  }
}

// =============================================================================
// EVIDENCE REQUEST SERVICE
// =============================================================================

export class EvidenceRequestService {
  /**
   * Create evidence request and find matching sources
   */
  static async createEvidenceRequest(
    request: Omit<EvidenceRequest, 'id' | 'createdAt' | 'updatedAt' | 'matches'>,
    availableCameras: RegisteredCamera[]
  ): Promise<{
    requestId: string
    matches: EvidenceMatch[]
    estimatedCost: number
  }> {
    // Check if user can make request
    const canRequest = await SubscriptionService.canMakeRequest(request.requesterId)
    if (!canRequest.canRequest) {
      throw new Error(canRequest.reason || 'Cannot make request')
    }
    
    // Create matching criteria
    const criteria: MatchingCriteria = {
      incident: {
        location: request.incident.location,
        timeWindow: {
          start: request.incident.timeWindow.start.toDate(),
          end: request.incident.timeWindow.end.toDate()
        },
        radius: request.incident.radius,
        type: request.incident.type,
        urgency: request.incident.urgency
      },
      targeting: request.targeting,
      budget: request.budget
    }
    
    // Find matching evidence sources
    const matchingEngine = new EvidenceMatchingEngine()
    const matches = await matchingEngine.findPotentialSources(criteria, availableCameras)
    
    // Calculate estimated cost
    const estimatedCost = matches.reduce((total, match) => total + match.estimatedReward, 0)
    
    // Create the evidence request
    const requestData = {
      ...request,
      matches: [], // Will be populated separately
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }
    
    const requestDocRef = await addDoc(collection(db, PREMIUM_COLLECTIONS.evidenceRequests), requestData)
    const requestId = requestDocRef.id
    
    // Create evidence matches
    const batch = writeBatch(db)
    const matchIds: string[] = []
    
    for (const match of matches) {
      const matchData = {
        ...match,
        requestId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }
      
      const matchDocRef = doc(collection(db, PREMIUM_COLLECTIONS.evidenceMatches))
      batch.set(matchDocRef, matchData)
      matchIds.push(matchDocRef.id)
    }
    
    await batch.commit()
    
    // Update request with match IDs
    await updateDoc(requestDocRef, {
      'matches': matchIds
    })
    
    // Send notifications to camera owners
    await this.notifyCameraOwners(matches, request)
    
    return {
      requestId,
      matches,
      estimatedCost
    }
  }

  /**
   * Respond to evidence request
   */
  static async respondToRequest(
    matchId: string,
    response: {
      status: 'accepted' | 'rejected' | 'no_footage'
      message?: string
      evidenceUrl?: string
      evidenceMetadata?: any
    }
  ): Promise<void> {
    const matchDoc = await getDoc(doc(db, PREMIUM_COLLECTIONS.evidenceMatches, matchId))
    if (!matchDoc.exists()) {
      throw new Error('Evidence match not found')
    }
    
    const match = matchDoc.data() as EvidenceMatch
    
    // Create chain of custody if evidence provided
    let chainOfCustodyId: string | undefined
    if (response.evidenceUrl && response.status === 'accepted') {
      const custodyManager = new ChainOfCustodyManager()
      const chainOfCustody = await custodyManager.createChainOfCustody(
        `evidence-${matchId}`,
        {
          id: matchId,
          originalName: `evidence-${Date.now()}`,
          fileSize: response.evidenceMetadata?.fileSize || 0,
          mimeType: response.evidenceMetadata?.mimeType || 'video/mp4',
          uploadedBy: match.ownerId,
          uploadedAt: new Date(),
          metadata: response.evidenceMetadata || {}
        },
        match.requestId
      )
      
      // Store chain of custody
      const custodyDocRef = await addDoc(collection(db, PREMIUM_COLLECTIONS.chainOfCustody), chainOfCustody)
      chainOfCustodyId = custodyDocRef.id
    }
    
    // Update the match with response
    await updateDoc(doc(db, PREMIUM_COLLECTIONS.evidenceMatches, matchId), {
      response: {
        ...response,
        respondedAt: Timestamp.now()
      },
      chainOfCustody: chainOfCustodyId,
      updatedAt: Timestamp.now()
    })
    
    // Create reward if evidence accepted
    if (response.status === 'accepted' && response.evidenceUrl) {
      await this.createTokenReward(match)
    }
  }

  /**
   * Get evidence requests for user
   */
  static async getRequestsForUser(
    userId: string,
    userRole: UserRole,
    status?: EvidenceRequest['status']
  ): Promise<EvidenceRequest[]> {
    let q = query(
      collection(db, PREMIUM_COLLECTIONS.evidenceRequests),
      where('requesterId', '==', userId),
      orderBy('createdAt', 'desc')
    )
    
    if (status) {
      q = query(q, where('status', '==', status))
    }
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as EvidenceRequest[]
  }

  private static async notifyCameraOwners(
    matches: EvidenceMatch[],
    request: Omit<EvidenceRequest, 'id' | 'createdAt' | 'updatedAt' | 'matches'>
  ): Promise<void> {
    // In real implementation, send push notifications, emails, etc.
    console.log(`Sending notifications to ${matches.length} camera owners for request ${request.incident.type}`)
    
    // Could integrate with notification service here
    for (const match of matches) {
      // Send notification to match.ownerId
      await this.sendNotification(match.ownerId, {
        type: 'evidence_request',
        title: 'New Evidence Request',
        message: `Evidence requested for ${request.incident.type} incident`,
        data: {
          matchId: match.id,
          reward: match.estimatedReward,
          urgency: request.incident.urgency
        }
      })
    }
  }

  private static async sendNotification(userId: string, notification: any): Promise<void> {
    // Mock notification service - integrate with Firebase Cloud Messaging, email service, etc.
    console.log(`Notification sent to ${userId}:`, notification)
  }

  private static async createTokenReward(match: EvidenceMatch): Promise<void> {
    const reward: Omit<TokenReward, 'id'> = {
      recipientId: match.ownerId,
      evidenceMatchId: match.id!,
      requestId: match.requestId,
      amount: match.estimatedReward,
      rewardType: 'evidence_provided',
      paymentStatus: 'pending',
      paymentMethod: 'platform_credit',
      platformCommission: match.estimatedReward * 0.15, // 15% commission
      netAmount: match.estimatedReward * 0.85,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }
    
    await addDoc(collection(db, PREMIUM_COLLECTIONS.tokenRewards), reward)
    
    // Update user wallet
    await WalletService.addEarnings(match.ownerId, reward.netAmount)
  }
}

// =============================================================================
// WALLET SERVICE
// =============================================================================

export class WalletService {
  /**
   * Get or create user wallet
   */
  static async getUserWallet(userId: string): Promise<UserWallet> {
    const walletDoc = await getDoc(doc(db, PREMIUM_COLLECTIONS.userWallets, userId))
    
    if (walletDoc.exists()) {
      return walletDoc.data() as UserWallet
    }
    
    // Create new wallet
    const newWallet: UserWallet = {
      userId,
      balance: 0,
      pendingEarnings: 0,
      totalEarned: 0,
      totalWithdrawn: 0,
      paymentPreferences: {
        method: 'platform_credit',
        minimumWithdrawal: 25,
        autoWithdraw: false
      },
      transactions: [],
      updatedAt: Timestamp.now()
    }
    
    await updateDoc(doc(db, PREMIUM_COLLECTIONS.userWallets, userId), newWallet)
    return newWallet
  }

  /**
   * Add earnings to user wallet
   */
  static async addEarnings(userId: string, amount: number): Promise<void> {
    const wallet = await this.getUserWallet(userId)
    
    const transaction = {
      id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'credit' as const,
      amount,
      description: 'Evidence reward received',
      timestamp: Timestamp.now(),
      status: 'completed' as const
    }
    
    const updatedWallet = {
      balance: wallet.balance + amount,
      totalEarned: wallet.totalEarned + amount,
      transactions: [...wallet.transactions, transaction],
      updatedAt: Timestamp.now()
    }
    
    await updateDoc(doc(db, PREMIUM_COLLECTIONS.userWallets, userId), updatedWallet)
  }

  /**
   * Process withdrawal
   */
  static async processWithdrawal(
    userId: string,
    amount: number,
    method: 'platform_credit' | 'bank_transfer' | 'paypal'
  ): Promise<void> {
    const wallet = await this.getUserWallet(userId)
    
    if (wallet.balance < amount) {
      throw new Error('Insufficient balance')
    }
    
    if (amount < wallet.paymentPreferences.minimumWithdrawal) {
      throw new Error(`Minimum withdrawal is £${wallet.paymentPreferences.minimumWithdrawal}`)
    }
    
    const transaction = {
      id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'withdrawal' as const,
      amount,
      description: `Withdrawal via ${method}`,
      timestamp: Timestamp.now(),
      status: 'pending' as const
    }
    
    const updatedWallet = {
      balance: wallet.balance - amount,
      totalWithdrawn: wallet.totalWithdrawn + amount,
      transactions: [...wallet.transactions, transaction],
      updatedAt: Timestamp.now()
    }
    
    await updateDoc(doc(db, PREMIUM_COLLECTIONS.userWallets, userId), updatedWallet)
    
    // Process payment via external service
    await this.processExternalPayment(userId, amount, method, transaction.id)
  }

  private static async processExternalPayment(
    userId: string,
    amount: number,
    method: string,
    transactionId: string
  ): Promise<void> {
    // Integrate with payment processors (Stripe, PayPal, etc.)
    console.log(`Processing ${method} payment of £${amount} for user ${userId}, transaction ${transactionId}`)
    
    // For demo purposes, simulate successful payment
    setTimeout(async () => {
      const wallet = await this.getUserWallet(userId)
      const updatedTransactions = wallet.transactions.map(txn => 
        txn.id === transactionId ? { ...txn, status: 'completed' as const } : txn
      )
      
      await updateDoc(doc(db, PREMIUM_COLLECTIONS.userWallets, userId), {
        transactions: updatedTransactions,
        updatedAt: Timestamp.now()
      })
    }, 5000) // Simulate 5-second processing time
  }
}

// =============================================================================
// REAL-TIME LISTENERS
// =============================================================================

export class RealtimeService {
  /**
   * Listen to evidence requests for camera owner
   */
  static listenToEvidenceRequests(
    cameraOwnerId: string,
    callback: (matches: EvidenceMatch[]) => void
  ): () => void {
    const q = query(
      collection(db, PREMIUM_COLLECTIONS.evidenceMatches),
      where('ownerId', '==', cameraOwnerId),
      where('response', '==', null),
      orderBy('createdAt', 'desc')
    )
    
    return onSnapshot(q, (snapshot) => {
      const matches = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EvidenceMatch[]
      
      callback(matches)
    })
  }

  /**
   * Listen to user wallet updates
   */
  static listenToWallet(
    userId: string,
    callback: (wallet: UserWallet) => void
  ): () => void {
    return onSnapshot(doc(db, PREMIUM_COLLECTIONS.userWallets, userId), (doc) => {
      if (doc.exists()) {
        callback(doc.data() as UserWallet)
      }
    })
  }

  /**
   * Listen to evidence request updates
   */
  static listenToRequestUpdates(
    requestId: string,
    callback: (request: EvidenceRequest) => void
  ): () => void {
    return onSnapshot(doc(db, PREMIUM_COLLECTIONS.evidenceRequests, requestId), (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as EvidenceRequest)
      }
    })
  }
}

export {
  SubscriptionService,
  IncidentReportingService,
  EvidenceRequestService,
  WalletService,
  RealtimeService
}
