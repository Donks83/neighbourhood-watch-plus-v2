'use client'

import { Check, X, Shield, Users, Building2, ShieldCheck, Crown, Zap } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function PricingPage() {
  const tiers = [
    {
      name: 'Public',
      price: 'FREE',
      period: 'forever',
      description: 'Perfect for residents who want to contribute to community safety',
      icon: Users,
      color: 'bg-gray-100 text-gray-800',
      iconColor: 'text-gray-600',
      features: [
        { name: 'Report incidents', included: true },
        { name: 'Register up to 2 cameras', included: true },
        { name: '3 footage requests per week', included: true },
        { name: 'Voluntary footage sharing', included: true },
        { name: 'Community support', included: true },
        { name: '7-day request history', included: true },
        { name: 'Hex map camera density view', included: false },
        { name: 'Route analysis', included: false },
        { name: 'Priority response', included: false },
        { name: 'API access', included: false }
      ]
    },
    {
      name: 'Business',
      price: '£49',
      period: 'per month',
      description: 'Ideal for local businesses, shops, and restaurants',
      icon: Building2,
      color: 'bg-green-100 text-green-800',
      iconColor: 'text-green-600',
      popular: false,
      features: [
        { name: 'Everything in Public, plus:', included: true, bold: true },
        { name: 'Register up to 10 cameras', included: true },
        { name: '10 footage requests per week', included: true },
        { name: 'Priority incident response (24h)', included: true },
        { name: 'Business profile badge', included: true },
        { name: 'Email notifications', included: true },
        { name: '30-day request history', included: true },
        { name: 'Download footage archives', included: true },
        { name: 'Hex map camera density view', included: false },
        { name: 'API access', included: false }
      ],
      savings: 'Save £98 with annual plan (2 months free)'
    },
    {
      name: 'Premium Business',
      price: '£1,200 - £3,500',
      period: 'per month',
      description: 'For insurance companies, security firms, and enterprises',
      icon: ShieldCheck,
      color: 'bg-teal-100 text-teal-800',
      iconColor: 'text-teal-600',
      popular: true,
      features: [
        { name: 'Everything in Business, plus:', included: true, bold: true },
        { name: 'Unlimited cameras', included: true },
        { name: 'Unlimited footage requests', included: true },
        { name: 'Hex map camera density view', included: true, highlight: true },
        { name: 'Route analysis & prediction', included: true, highlight: true },
        { name: 'Bulk operations', included: true },
        { name: 'API access', included: true, highlight: true },
        { name: 'Multiple team accounts (1-15 users)', included: true },
        { name: '90-day request history', included: true },
        { name: 'Dedicated account manager', included: true },
        { name: '12-hour response SLA', included: true }
      ],
      tiers: [
        { name: 'Starter', price: '£1,200/mo', users: '1 user', requests: '50/month' },
        { name: 'Professional', price: '£2,200/mo', users: '5 users', requests: '200/month' },
        { name: 'Enterprise', price: '£3,500/mo', users: '15 users', requests: 'Unlimited' }
      ]
    },
    {
      name: 'Police',
      price: '£800 - £4,500',
      period: 'per month',
      description: 'Designed for law enforcement agencies and police forces',
      icon: Shield,
      color: 'bg-indigo-100 text-indigo-800',
      iconColor: 'text-indigo-600',
      features: [
        { name: 'Everything in Premium Business, plus:', included: true, bold: true },
        { name: 'Law enforcement badge', included: true },
        { name: 'Priority community cooperation', included: true },
        { name: 'Emergency request flagging', included: true, highlight: true },
        { name: 'Evidence chain tracking', included: true },
        { name: 'Case management integration', included: true },
        { name: 'Secure evidence storage', included: true },
        { name: 'Legal compliance tools (GDPR, FOIA)', included: true },
        { name: 'Multi-jurisdiction support', included: true },
        { name: '6-hour response SLA', included: true },
        { name: 'Dedicated support line', included: true }
      ],
      tiers: [
        { name: 'Single Force', price: '£800/mo', users: '3 officers', requests: '50/month' },
        { name: 'Regional', price: '£2,000/mo', users: '10 officers', requests: '200/month' },
        { name: 'National', price: '£4,500/mo', users: '50 officers', requests: '500/month' }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-blue-600">Pricing Plans</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            From free community protection to enterprise-grade investigation tools.
            Select the perfect plan for your needs.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
            * Prices shown are indicative and subject to confirmation
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {tiers.map((tier) => {
            const Icon = tier.icon
            return (
              <Card 
                key={tier.name} 
                className={`relative ${tier.popular ? 'ring-2 ring-teal-500 shadow-xl' : ''}`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-teal-600 text-white px-4 py-1">
                      <Zap className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <Badge className={tier.color}>
                      <Icon className={`w-4 h-4 mr-1 ${tier.iconColor}`} />
                      {tier.name}
                    </Badge>
                  </div>
                  
                  <div className="mb-2">
                    <span className="text-3xl font-bold">{tier.price}</span>
                    {tier.period && (
                      <span className="text-gray-600 dark:text-gray-400 ml-2">
                        /{tier.period}
                      </span>
                    )}
                  </div>
                  
                  <CardDescription>{tier.description}</CardDescription>
                  
                  {tier.savings && (
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs text-green-600">
                        💰 {tier.savings}
                      </Badge>
                    </div>
                  )}
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        {feature.included ? (
                          <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                            (feature as any).highlight ? 'text-teal-600' : 'text-green-600'
                          }`} />
                        ) : (
                          <X className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={`${
                          (feature as any).bold ? 'font-semibold' : ''
                        } ${
                          !feature.included ? 'text-gray-400 line-through' : ''
                        } ${
                          (feature as any).highlight ? 'text-teal-600 font-medium' : ''
                        }`}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {tier.tiers && (
                    <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xs font-semibold mb-2">Available Tiers:</p>
                      <div className="space-y-2">
                        {tier.tiers.map((subTier, idx) => (
                          <div key={idx} className="text-xs">
                            <span className="font-semibold">{subTier.name}:</span>{' '}
                            <span className="text-gray-600 dark:text-gray-400">
                              {subTier.price} • {subTier.users} • {subTier.requests}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button 
                    className="w-full" 
                    variant={tier.popular ? 'default' : 'outline'}
                  >
                    {tier.price === 'FREE' ? 'Get Started' : 'Contact Sales'}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Feature Comparison Table */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>Feature Comparison</CardTitle>
            <CardDescription>Detailed breakdown of what's included in each plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Feature</th>
                    <th className="text-center py-3 px-4">Public</th>
                    <th className="text-center py-3 px-4">Business</th>
                    <th className="text-center py-3 px-4">Premium Business</th>
                    <th className="text-center py-3 px-4">Police</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-medium">Cameras</td>
                    <td className="text-center py-3 px-4">2</td>
                    <td className="text-center py-3 px-4">10</td>
                    <td className="text-center py-3 px-4">Unlimited</td>
                    <td className="text-center py-3 px-4">Unlimited</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-medium">Requests/Week</td>
                    <td className="text-center py-3 px-4">3</td>
                    <td className="text-center py-3 px-4">10</td>
                    <td className="text-center py-3 px-4">Unlimited</td>
                    <td className="text-center py-3 px-4">Unlimited</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-medium">History</td>
                    <td className="text-center py-3 px-4">7 days</td>
                    <td className="text-center py-3 px-4">30 days</td>
                    <td className="text-center py-3 px-4">90 days</td>
                    <td className="text-center py-3 px-4">Unlimited</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-medium">Hex Map</td>
                    <td className="text-center py-3 px-4"><X className="w-4 h-4 text-gray-400 inline" /></td>
                    <td className="text-center py-3 px-4"><X className="w-4 h-4 text-gray-400 inline" /></td>
                    <td className="text-center py-3 px-4"><Check className="w-4 h-4 text-green-600 inline" /></td>
                    <td className="text-center py-3 px-4"><Check className="w-4 h-4 text-green-600 inline" /></td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-medium">Route Analysis</td>
                    <td className="text-center py-3 px-4"><X className="w-4 h-4 text-gray-400 inline" /></td>
                    <td className="text-center py-3 px-4"><X className="w-4 h-4 text-gray-400 inline" /></td>
                    <td className="text-center py-3 px-4"><Check className="w-4 h-4 text-green-600 inline" /></td>
                    <td className="text-center py-3 px-4"><Check className="w-4 h-4 text-green-600 inline" /></td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-medium">API Access</td>
                    <td className="text-center py-3 px-4"><X className="w-4 h-4 text-gray-400 inline" /></td>
                    <td className="text-center py-3 px-4"><X className="w-4 h-4 text-gray-400 inline" /></td>
                    <td className="text-center py-3 px-4"><Check className="w-4 h-4 text-green-600 inline" /></td>
                    <td className="text-center py-3 px-4"><Check className="w-4 h-4 text-green-600 inline" /></td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-medium">Team Accounts</td>
                    <td className="text-center py-3 px-4">1</td>
                    <td className="text-center py-3 px-4">1</td>
                    <td className="text-center py-3 px-4">1-15</td>
                    <td className="text-center py-3 px-4">3-50</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium">Support</td>
                    <td className="text-center py-3 px-4">Community</td>
                    <td className="text-center py-3 px-4">Email</td>
                    <td className="text-center py-3 px-4">Dedicated</td>
                    <td className="text-center py-3 px-4">Priority Line</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* FAQ / Contact */}
        <div className="mt-12 text-center">
          <h3 className="text-2xl font-bold mb-4">Questions?</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Contact our sales team to discuss custom enterprise plans or to learn more about any tier.
          </p>
          <Button size="lg">Contact Sales</Button>
        </div>
      </div>
    </div>
  )
}
