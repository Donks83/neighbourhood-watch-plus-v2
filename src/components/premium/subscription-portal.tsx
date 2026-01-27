'use client'

import React, { useState } from 'react'
import { 
  Shield, 
  FileText, 
  Eye, 
  CrownIcon, 
  Check, 
  Star,
  Users,
  Clock,
  Target,
  MapPin,
  Zap,
  Phone,
  CreditCard,
  Building,
  Badge as BadgeIcon,
  Upload,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import type { UserRole, SubscriptionTier } from '@/types/premium/subscription'

interface SubscriptionPortalProps {
  onSelectPlan: (tier: SubscriptionTier, organizationDetails: OrganizationDetails) => Promise<void>
  onStartTrial: (role: UserRole, organizationDetails: OrganizationDetails) => Promise<void>
}

interface OrganizationDetails {
  name: string
  type: UserRole
  contactEmail: string
  contactName: string
  phone: string
  address: string
  badgeNumber?: string // For police
  licenseNumber?: string // For insurance/security
  verificationDocuments?: File[]
}

export default function SubscriptionPortal({
  onSelectPlan,
  onStartTrial
}: SubscriptionPortalProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>('business')
  const [orgDetails, setOrgDetails] = useState<Partial<OrganizationDetails>>({
    type: 'business'
  })

  return (
    <div className="container mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">
          Premium Subscription Portal
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Access advanced evidence collection features for verified organizations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Police Card */}
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Police Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-3xl font-bold">£299<span className="text-sm font-normal">/month</span></div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>Unlimited evidence requests</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>2km search radius</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>Priority response</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>Chain of custody documentation</span>
                </li>
              </ul>
              <Button className="w-full" onClick={() => setSelectedRole('police')}>
                Select Plan
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Insurance Card */}
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600" />
              Premium Business
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-3xl font-bold">£199<span className="text-sm font-normal">/month</span></div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>100 requests/month</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>1km search radius</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>Claim validation tools</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>Standard support</span>
                </li>
              </ul>
              <Button className="w-full" onClick={() => setSelectedRole('premium_business')}>
                Select Plan
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Card */}
        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5 text-purple-600" />
              Business
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-3xl font-bold">£149<span className="text-sm font-normal">/month</span></div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>50 requests/month</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>500m search radius</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>Client management</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>Standard support</span>
                </li>
              </ul>
              <Button className="w-full" onClick={() => setSelectedRole('business')}>
                Select Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organization Details Form */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="orgName">Organization Name</Label>
              <Input
                id="orgName"
                placeholder="Your organization name"
                value={orgDetails.name || ''}
                onChange={(e) => setOrgDetails({ ...orgDetails, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="contactName">Contact Name</Label>
              <Input
                id="contactName"
                placeholder="Primary contact person"
                value={orgDetails.contactName || ''}
                onChange={(e) => setOrgDetails({ ...orgDetails, contactName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email">Contact Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@organization.com"
                value={orgDetails.contactEmail || ''}
                onChange={(e) => setOrgDetails({ ...orgDetails, contactEmail: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+44 20 1234 5678"
                value={orgDetails.phone || ''}
                onChange={(e) => setOrgDetails({ ...orgDetails, phone: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                placeholder="Organization address"
                value={orgDetails.address || ''}
                onChange={(e) => setOrgDetails({ ...orgDetails, address: e.target.value })}
              />
            </div>
            {selectedRole === 'police' && (
              <div>
                <Label htmlFor="badge">Badge Number</Label>
                <Input
                  id="badge"
                  placeholder="Police badge number"
                  value={orgDetails.badgeNumber || ''}
                  onChange={(e) => setOrgDetails({ ...orgDetails, badgeNumber: e.target.value })}
                />
              </div>
            )}
            {(selectedRole === 'insurance' || selectedRole === 'security') && (
              <div>
                <Label htmlFor="license">License Number</Label>
                <Input
                  id="license"
                  placeholder="Professional license number"
                  value={orgDetails.licenseNumber || ''}
                  onChange={(e) => setOrgDetails({ ...orgDetails, licenseNumber: e.target.value })}
                />
              </div>
            )}
          </div>
          <div className="mt-6 flex gap-4">
            <Button 
              onClick={() => onStartTrial(selectedRole, orgDetails as OrganizationDetails)}
              variant="outline"
            >
              Start Free Trial
            </Button>
            <Button 
              onClick={() => onSelectPlan({} as SubscriptionTier, orgDetails as OrganizationDetails)}
            >
              Subscribe Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
