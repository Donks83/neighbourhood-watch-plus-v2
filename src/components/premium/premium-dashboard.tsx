'use client'

import React from 'react'
import { 
  Shield, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp,
  MapPin,
  Users,
  PoundSterling,
  Calendar,
  FileText,
  Download,
  Eye,
  Ban,
  CrownIcon,
  BarChart3,
  Target
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { UserRole } from '@/types/premium/subscription'

interface EvidenceRequest {
  id: string
  title: string
  type: 'criminal_activity' | 'property_damage' | 'traffic_incident' | 'insurance_claim'
  location: string
  status: 'active' | 'fulfilled' | 'expired' | 'cancelled'
  urgency: 'routine' | 'priority' | 'urgent' | 'emergency'
  sources: number
  responses: number
  cost: number
  createdAt: Date
  responseDeadline: Date
}

interface DashboardStats {
  requestsThisMonth: number
  budgetUsed: number
  budgetRemaining: number
  averageResponseTime: number
  successRate: number
  totalSources: number
  casesClosed: number
}

interface PremiumDashboardProps {
  userRole: UserRole
  organization?: string
  subscription?: {
    tier: string
    features: string[]
    limits: {
      monthlyRequests: number
      maxRadius: number
      requestsRemaining: number
    }
  }
  onCreateRequest?: () => void
  onViewRequest?: (requestId: string) => void
}

const ROLE_CONFIGS = {
  police: {
    title: 'Police Evidence Portal',
    icon: Shield,
    color: 'blue',
    primaryAction: 'Request Evidence',
    description: 'Investigate incidents and collect evidence from community cameras'
  },
  insurance: {
    title: 'Insurance Investigation Portal',
    icon: FileText,
    color: 'green', 
    primaryAction: 'Validate Claim',
    description: 'Verify claims and prevent fraud with community evidence'
  },
  security: {
    title: 'Security Operations Center',
    icon: Eye,
    color: 'purple',
    primaryAction: 'Monitor Area',
    description: 'Monitor client areas and coordinate incident response'
  }
} as const

const URGENCY_COLORS = {
  routine: 'gray',
  priority: 'blue',
  urgent: 'orange',
  emergency: 'red'
} as const

export default function PremiumDashboard({
  userRole,
  organization = 'Your Organization',
  subscription,
  onCreateRequest,
  onViewRequest
}: PremiumDashboardProps) {
  const roleConfig = ROLE_CONFIGS[userRole as keyof typeof ROLE_CONFIGS]
  const RoleIcon = roleConfig?.icon || Shield

  // Mock data - in real implementation, this would come from API
  const stats: DashboardStats = {
    requestsThisMonth: 47,
    budgetUsed: 3250,
    budgetRemaining: 1750,
    averageResponseTime: 18.5,
    successRate: 84,
    totalSources: 156,
    casesClosed: 23
  }

  const recentRequests: EvidenceRequest[] = [
    {
      id: 'REQ-2024-0315-001',
      title: 'Break-in Investigation - Chester Road',
      type: 'criminal_activity',
      location: 'Chester Road, Durham',
      status: 'fulfilled',
      urgency: 'priority',
      sources: 8,
      responses: 6,
      cost: 285,
      createdAt: new Date('2024-03-15T06:30:00'),
      responseDeadline: new Date('2024-03-16T06:30:00')
    },
    {
      id: 'REQ-2024-0315-002', 
      title: 'Vehicle Damage Claim Validation',
      type: 'insurance_claim',
      location: 'Market Square, Durham',
      status: 'active',
      urgency: 'routine',
      sources: 5,
      responses: 3,
      cost: 125,
      createdAt: new Date('2024-03-15T14:20:00'),
      responseDeadline: new Date('2024-03-18T14:20:00')
    },
    {
      id: 'REQ-2024-0314-003',
      title: 'Traffic Incident - A1 Junction',
      type: 'traffic_incident', 
      location: 'A1 Junction, Newcastle',
      status: 'expired',
      urgency: 'urgent',
      sources: 12,
      responses: 8,
      cost: 450,
      createdAt: new Date('2024-03-14T16:45:00'),
      responseDeadline: new Date('2024-03-14T22:45:00')
    }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'fulfilled': return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'active': return <Clock className="w-4 h-4 text-blue-500" />
      case 'expired': return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'cancelled': return <Ban className="w-4 h-4 text-gray-500" />
      default: return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getUrgencyBadge = (urgency: string) => {
    const color = URGENCY_COLORS[urgency as keyof typeof URGENCY_COLORS]
    return (
      <Badge variant="outline" className={`text-${color}-600 border-${color}-200 bg-${color}-50`}>
        {urgency.toUpperCase()}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 bg-${roleConfig?.color}-100 dark:bg-${roleConfig?.color}-900 rounded-lg flex items-center justify-center`}>
                <RoleIcon className={`w-6 h-6 text-${roleConfig?.color}-600 dark:text-${roleConfig?.color}-400`} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {roleConfig?.title}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {organization}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {subscription && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <CrownIcon className="w-3 h-3" />
                  {subscription.tier}
                </Badge>
              )}
              <Button 
                onClick={onCreateRequest}
                className={`bg-${roleConfig?.color}-600 hover:bg-${roleConfig?.color}-700 text-white`}
              >
                <Search className="w-4 h-4 mr-2" />
                {roleConfig?.primaryAction}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Requests This Month
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.requestsThisMonth}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Search className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              {subscription && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Used</span>
                    <span>{subscription.limits.monthlyRequests - subscription.limits.requestsRemaining}/{subscription.limits.monthlyRequests}</span>
                  </div>
                  <Progress 
                    value={((subscription.limits.monthlyRequests - subscription.limits.requestsRemaining) / subscription.limits.monthlyRequests) * 100} 
                    className="h-2"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Budget Used
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    £{stats.budgetUsed.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <PoundSterling className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                £{stats.budgetRemaining.toLocaleString()} remaining
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Avg Response Time
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.averageResponseTime}h
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div className="flex items-center text-xs text-green-600 mt-2">
                <TrendingUp className="w-3 h-3 mr-1" />
                15% faster than last month
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Success Rate
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.successRate}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {stats.casesClosed} cases closed this month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Content */}
        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="requests">Active Requests</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="sources">Evidence Sources</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Active Requests Tab */}
          <TabsContent value="requests" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Recent Evidence Requests</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={onCreateRequest}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    New Request
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentRequests.map((request) => (
                    <div 
                      key={request.id}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {getStatusIcon(request.status)}
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {request.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {request.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {request.responses}/{request.sources} responses
                            </span>
                            <span className="flex items-center gap-1">
                              <PoundSterling className="w-3 h-3" />
                              £{request.cost}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {getUrgencyBadge(request.urgency)}
                        <div className="text-right text-sm text-gray-500">
                          <div>Created {request.createdAt.toLocaleDateString()}</div>
                          <div className="text-xs">
                            Deadline: {request.responseDeadline.toLocaleDateString()}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewRequest?.(request.id)}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Monthly Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Evidence Requests</span>
                      <span className="text-lg font-bold">{stats.requestsThisMonth}</span>
                    </div>
                    <Progress value={75} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Success Rate</span>
                      <span className="text-lg font-bold">{stats.successRate}%</span>
                    </div>
                    <Progress value={stats.successRate} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Community Sources</span>
                      <span className="text-lg font-bold">{stats.totalSources}</span>
                    </div>
                    <Progress value={65} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Response Time Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {stats.averageResponseTime}h
                      </div>
                      <div className="text-sm text-gray-500">Average Response Time</div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-semibold">12h</div>
                        <div className="text-xs text-gray-500">Emergency</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold">18h</div>
                        <div className="text-xs text-gray-500">Priority</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold">45h</div>
                        <div className="text-xs text-gray-500">Routine</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Evidence Sources Tab */}
          <TabsContent value="sources" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Community Evidence Network</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.totalSources}</div>
                    <div className="text-sm text-gray-500">Active Cameras</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">89%</div>
                    <div className="text-sm text-gray-500">Response Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">4.2/5</div>
                    <div className="text-sm text-gray-500">Quality Rating</div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="font-medium mb-4">Coverage by Area</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Durham City Centre</span>
                      <div className="flex items-center gap-2">
                        <Progress value={85} className="w-24 h-2" />
                        <span className="text-sm text-gray-500">45 cameras</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Chester Road Area</span>
                      <div className="flex items-center gap-2">
                        <Progress value={72} className="w-24 h-2" />
                        <span className="text-sm text-gray-500">38 cameras</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Newcastle Outskirts</span>
                      <div className="flex items-center gap-2">
                        <Progress value={60} className="w-24 h-2" />
                        <span className="text-sm text-gray-500">23 cameras</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Details</CardTitle>
              </CardHeader>
              <CardContent>
                {subscription && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Current Plan</span>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <CrownIcon className="w-3 h-3" />
                        {subscription.tier}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">Monthly Requests</div>
                        <div className="font-medium">
                          {subscription.limits.requestsRemaining}/{subscription.limits.monthlyRequests}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Max Search Radius</div>
                        <div className="font-medium">{subscription.limits.maxRadius}m</div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-500 mb-2">Included Features</div>
                      <div className="flex flex-wrap gap-2">
                        {subscription.features.map((feature, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Email Notifications</div>
                      <div className="text-sm text-gray-500">Receive updates via email</div>
                    </div>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">SMS Alerts</div>
                      <div className="text-sm text-gray-500">Urgent notifications via SMS</div>
                    </div>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Auto-Response</div>
                      <div className="text-sm text-gray-500">Automatic follow-up on requests</div>
                    </div>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
