'use client'

import React, { useState } from 'react'
import { 
  PoundSterling, 
  Wallet, 
  TrendingUp, 
  Download, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  CreditCard,
  Landmark,
  Smartphone,
  Gift,
  Star,
  Trophy,
  Target,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { TokenReward, UserWallet, WalletTransaction } from '@/types/premium/subscription'

interface RewardSystemProps {
  userId: string
  userWallet: UserWallet
  recentRewards: TokenReward[]
  onWithdraw: (amount: number, method: string) => Promise<void>
  onUpdatePaymentPreferences: (preferences: UserWallet['paymentPreferences']) => Promise<void>
}

interface EvidenceSubmission {
  id: string
  requestId: string
  caseTitle: string
  submittedAt: Date
  status: 'pending' | 'verified' | 'rejected' | 'paid'
  estimatedReward: number
  actualReward?: number
  quality: 'excellent' | 'good' | 'fair' | 'poor'
  reviewNotes?: string
}

const PAYMENT_METHODS = [
  { value: 'platform_credit', label: 'Platform Credit', icon: Wallet, description: 'Keep in your account for future use' },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: Landmark, description: 'Direct deposit to your bank account' },
  { value: 'paypal', label: 'PayPal', icon: CreditCard, description: 'Transfer to your PayPal account' }
] as const

const REWARD_TYPES = {
  evidence_provided: { label: 'Evidence Provided', icon: Target, color: 'blue' },
  incident_reported: { label: 'Incident Reported', icon: AlertCircle, color: 'orange' },
  verification_bonus: { label: 'Verification Bonus', icon: CheckCircle2, color: 'green' },
  quality_bonus: { label: 'Quality Bonus', icon: Star, color: 'purple' }
} as const

export default function RewardSystem({
  userId,
  userWallet,
  recentRewards,
  onWithdraw,
  onUpdatePaymentPreferences
}: RewardSystemProps) {
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawMethod, setWithdrawMethod] = useState(userWallet.paymentPreferences.method)
  const [isWithdrawing, setIsWithdrawing] = useState(false)

  // Mock data for evidence submissions
  const evidenceSubmissions: EvidenceSubmission[] = [
    {
      id: 'SUB-2024-0315-001',
      requestId: 'REQ-2024-0315-001', 
      caseTitle: 'Break-in Investigation - Chester Road',
      submittedAt: new Date('2024-03-15T08:30:00'),
      status: 'paid',
      estimatedReward: 65,
      actualReward: 75,
      quality: 'excellent',
      reviewNotes: 'Clear facial identification, perfect timing, high resolution'
    },
    {
      id: 'SUB-2024-0315-002',
      requestId: 'REQ-2024-0315-002',
      caseTitle: 'Vehicle Damage Validation',
      submittedAt: new Date('2024-03-15T16:20:00'),
      status: 'verified',
      estimatedReward: 35,
      actualReward: 40,
      quality: 'good',
      reviewNotes: 'Good coverage of incident area, helpful timeline'
    },
    {
      id: 'SUB-2024-0314-003',
      requestId: 'REQ-2024-0314-003',
      caseTitle: 'Traffic Incident Documentation',
      submittedAt: new Date('2024-03-14T14:15:00'),
      status: 'pending',
      estimatedReward: 45,
      quality: 'good'
    }
  ]

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount)
    if (amount <= 0 || amount > userWallet.balance) {
      alert('Invalid withdrawal amount')
      return
    }

    if (amount < userWallet.paymentPreferences.minimumWithdrawal) {
      alert(`Minimum withdrawal is £${userWallet.paymentPreferences.minimumWithdrawal}`)
      return
    }

    setIsWithdrawing(true)
    try {
      await onWithdraw(amount, withdrawMethod)
      setWithdrawAmount('')
    } catch (error) {
      console.error('Withdrawal failed:', error)
    } finally {
      setIsWithdrawing(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'verified': return <Clock className="w-4 h-4 text-blue-500" />
      case 'pending': return <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />
      case 'rejected': return <AlertCircle className="w-4 h-4 text-red-500" />
      default: return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getQualityBadge = (quality: string) => {
    const colors = {
      excellent: 'green',
      good: 'blue', 
      fair: 'yellow',
      poor: 'red'
    }
    const color = colors[quality as keyof typeof colors]
    return (
      <Badge variant="outline" className={`text-${color}-600 border-${color}-200 bg-${color}-50`}>
        {quality.toUpperCase()}
      </Badge>
    )
  }

  const getRewardTypeIcon = (type: keyof typeof REWARD_TYPES) => {
    const config = REWARD_TYPES[type]
    const Icon = config.icon
    return <Icon className={`w-4 h-4 text-${config.color}-500`} />
  }

  return (
    <div className="space-y-6">
      
      {/* Wallet Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Available Balance</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                  £{userWallet.balance.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <Wallet className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-green-600 dark:text-green-400">
              <TrendingUp className="w-4 h-4 mr-1" />
              +£{userWallet.pendingEarnings.toFixed(2)} pending
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Earned</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  £{userWallet.totalEarned.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Since joining the platform
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Withdrawn</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  £{userWallet.totalWithdrawn.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <Download className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Lifetime withdrawals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="earnings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Earnings Tab */}
        <TabsContent value="earnings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Rewards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentRewards.map((reward) => (
                  <div 
                    key={reward.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      {getRewardTypeIcon(reward.rewardType)}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {REWARD_TYPES[reward.rewardType].label}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Evidence ID: {reward.evidenceMatchId.substring(0, 16)}...
                        </p>
                        <p className="text-xs text-gray-400">
                          {reward.createdAt.toDate().toLocaleDateString()} • {reward.paymentStatus}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        +£{reward.amount.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Net: £{reward.netAmount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}

                {recentRewards.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Gift className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No rewards yet</p>
                    <p className="text-sm">Start submitting evidence to earn rewards!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userWallet.transactions.map((transaction) => (
                  <div 
                    key={transaction.id}
                    className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        transaction.type === 'credit' ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"
                      )}>
                        {transaction.type === 'credit' ? (
                          <ArrowUpRight className="w-4 h-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {transaction.timestamp.toDate().toLocaleDateString()} • {transaction.status}
                        </p>
                      </div>
                    </div>
                    
                    <div className={cn(
                      "font-medium",
                      transaction.type === 'credit' ? "text-green-600" : "text-red-600"
                    )}>
                      {transaction.type === 'credit' ? '+' : '-'}£{transaction.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Withdraw Tab */}
        <TabsContent value="withdraw" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Withdraw Funds</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                  <Wallet className="w-5 h-5" />
                  <span className="font-medium">Available Balance: £{userWallet.balance.toFixed(2)}</span>
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  Minimum withdrawal: £{userWallet.paymentPreferences.minimumWithdrawal}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="amount" className="text-sm font-medium mb-2 block">
                    Withdrawal Amount
                  </Label>
                  <div className="relative">
                    <PoundSterling className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="amount"
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      className="pl-10"
                      min={userWallet.paymentPreferences.minimumWithdrawal}
                      max={userWallet.balance}
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Payment Method
                  </Label>
                  <Select value={withdrawMethod} onValueChange={(value) => setWithdrawMethod(value as typeof withdrawMethod)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((method) => {
                        const Icon = method.icon
                        return (
                          <SelectItem key={method.value} value={method.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              {method.label}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Quick Amounts</h4>
                <div className="grid grid-cols-4 gap-3">
                  {[25, 50, 100, userWallet.balance].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => setWithdrawAmount(amount.toFixed(2))}
                      disabled={amount > userWallet.balance || amount < userWallet.paymentPreferences.minimumWithdrawal}
                    >
                      £{amount === userWallet.balance ? 'All' : amount}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    <p className="font-medium mb-1">Processing Times</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Platform Credit: Instant</li>
                      <li>• Bank Transfer: 3-5 business days</li>
                      <li>• PayPal: 1-2 business days</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleWithdraw}
                disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || isWithdrawing || parseFloat(withdrawAmount) > userWallet.balance}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                {isWithdrawing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing Withdrawal...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Withdraw £{withdrawAmount || '0.00'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Submissions Tab */}
        <TabsContent value="submissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Evidence Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {evidenceSubmissions.map((submission) => (
                  <div 
                    key={submission.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      {getStatusIcon(submission.status)}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {submission.caseTitle}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Submitted {submission.submittedAt.toLocaleDateString()}
                        </p>
                        {submission.reviewNotes && (
                          <p className="text-xs text-gray-400 mt-1">
                            "{submission.reviewNotes}"
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {getQualityBadge(submission.quality)}
                      <div className="text-right">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {submission.actualReward ? `£${submission.actualReward}` : `~£${submission.estimatedReward}`}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {submission.status}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Default Payment Method
                </Label>
                <Select 
                  value={userWallet.paymentPreferences.method} 
                  onValueChange={(value) => {
                    onUpdatePaymentPreferences({
                      ...userWallet.paymentPreferences,
                      method: value as any
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => {
                      const Icon = method.icon
                      return (
                        <SelectItem key={method.value} value={method.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            <div>
                              <div>{method.label}</div>
                              <div className="text-xs text-gray-500">{method.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="minWithdraw" className="text-sm font-medium mb-2 block">
                  Minimum Withdrawal Amount
                </Label>
                <div className="relative">
                  <PoundSterling className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="minWithdraw"
                    type="number"
                    value={userWallet.paymentPreferences.minimumWithdrawal}
                    onChange={(e) => {
                      onUpdatePaymentPreferences({
                        ...userWallet.paymentPreferences,
                        minimumWithdrawal: parseFloat(e.target.value) || 25
                      })
                    }}
                    className="pl-10"
                    min="25"
                    step="5"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Minimum allowed: £25
                </p>
              </div>

              <div className="flex items-center justify-between py-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <Label className="text-sm font-medium">Auto-Withdraw</Label>
                  <p className="text-xs text-gray-500">Automatically withdraw when balance reaches threshold</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onUpdatePaymentPreferences({
                      ...userWallet.paymentPreferences,
                      autoWithdraw: !userWallet.paymentPreferences.autoWithdraw
                    })
                  }}
                >
                  {userWallet.paymentPreferences.autoWithdraw ? 'Enabled' : 'Disabled'}
                </Button>
              </div>

              {userWallet.paymentPreferences.autoWithdraw && (
                <div>
                  <Label htmlFor="autoThreshold" className="text-sm font-medium mb-2 block">
                    Auto-Withdraw Threshold
                  </Label>
                  <div className="relative">
                    <PoundSterling className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="autoThreshold"
                      type="number"
                      value={userWallet.paymentPreferences.autoWithdrawThreshold || 100}
                      onChange={(e) => {
                        onUpdatePaymentPreferences({
                          ...userWallet.paymentPreferences,
                          autoWithdrawThreshold: parseFloat(e.target.value) || 100
                        })
                      }}
                      className="pl-10"
                      min="50"
                      step="25"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
