'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Shield, AlertCircle, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  getBlockedDomains, 
  addBlockedDomain, 
  removeBlockedDomain, 
  getBlockedEmailStats,
  initializeBlockedEmails
} from '@/lib/email-blocking'

interface EmailBlockingManagerProps {
  userId: string
}

export default function EmailBlockingManager({ userId }: EmailBlockingManagerProps) {
  const [blockedDomains, setBlockedDomains] = useState<string[]>([])
  const [stats, setStats] = useState({
    totalBlockedDomains: 0,
    blockAttempts: 0,
    lastUpdated: null as any
  })
  const [isLoading, setIsLoading] = useState(true)
  const [newDomain, setNewDomain] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [isRemoving, setIsRemoving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Load blocked domains and stats
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Initialize if needed
      await initializeBlockedEmails()
      
      // Load domains and stats
      const [domains, statistics] = await Promise.all([
        getBlockedDomains(),
        getBlockedEmailStats()
      ])
      
      setBlockedDomains(domains.sort())
      setStats(statistics)
    } catch (err: any) {
      console.error('Error loading blocked emails:', err)
      setError('Failed to load blocked domains')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddDomain = async () => {
    if (!newDomain.trim()) return
    
    setIsAdding(true)
    setError(null)
    setSuccess(null)
    
    try {
      await addBlockedDomain(newDomain.trim(), userId)
      setSuccess(`Domain "${newDomain.trim()}" added to block list`)
      setNewDomain('')
      await loadData()
    } catch (err: any) {
      setError(err.message || 'Failed to add domain')
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveDomain = async (domain: string) => {
    setIsRemoving(domain)
    setError(null)
    setSuccess(null)
    
    try {
      await removeBlockedDomain(domain, userId)
      setSuccess(`Domain "${domain}" removed from block list`)
      await loadData()
    } catch (err: any) {
      setError(err.message || 'Failed to remove domain')
    } finally {
      setIsRemoving(null)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            <p className="text-sm text-gray-600">Loading blocked domains...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Blocked Domains
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalBlockedDomains}</div>
            <p className="text-xs text-gray-500 mt-1">
              Total domains on block list
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Blocked Attempts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.blockAttempts}</div>
            <p className="text-xs text-gray-500 mt-1">
              Registration attempts blocked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Last Updated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {stats.lastUpdated ? new Date(stats.lastUpdated.toDate()).toLocaleDateString() : 'Never'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Block list modification date
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add Domain */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Blocked Domain
          </CardTitle>
          <CardDescription>
            Add a new email domain to prevent registrations (e.g., tempmail.com)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="border-green-200 bg-green-50 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="new-domain" className="text-sm mb-2 block">
                  Domain to block
                </Label>
                <Input
                  id="new-domain"
                  type="text"
                  placeholder="e.g., tempmail.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddDomain()
                    }
                  }}
                  disabled={isAdding}
                />
              </div>
              <div className="pt-7">
                <Button
                  onClick={handleAddDomain}
                  disabled={!newDomain.trim() || isAdding}
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Domain
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blocked Domains List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Blocked Domains ({blockedDomains.length})
          </CardTitle>
          <CardDescription>
            Email domains that cannot be used for registration
          </CardDescription>
        </CardHeader>
        <CardContent>
          {blockedDomains.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No domains blocked yet
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-96 overflow-y-auto">
              {blockedDomains.map((domain) => (
                <div
                  key={domain}
                  className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <span className="text-sm font-mono">{domain}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveDomain(domain)}
                    disabled={isRemoving === domain}
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {isRemoving === domain ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>How it works:</strong> When users try to register with an email from a blocked domain, 
          they'll see a friendly message suggesting they use a permanent email provider instead. 
          This helps prevent spam and fake accounts.
        </AlertDescription>
      </Alert>
    </div>
  )
}
