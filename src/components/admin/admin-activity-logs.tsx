'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  Activity, 
  Calendar,
  User,
  Filter,
  Download,
  RefreshCw,
  Clock,
  Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/contexts/auth-context'
import type { AdminActionLog } from '@/lib/admin'

interface AdminActivityLogsProps {
  className?: string
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  'role_assigned': { label: 'Role Assigned', color: 'bg-green-100 text-green-800' },
  'role_revoked': { label: 'Role Revoked', color: 'bg-red-100 text-red-800' },
  'admin_activated': { label: 'Admin Activated', color: 'bg-blue-100 text-blue-800' },
  'admin_deactivated': { label: 'Admin Deactivated', color: 'bg-orange-100 text-orange-800' },
  'camera_approved': { label: 'Camera Approved', color: 'bg-green-100 text-green-800' },
  'camera_rejected': { label: 'Camera Rejected', color: 'bg-red-100 text-red-800' },
  'camera_info_requested': { label: 'Info Requested', color: 'bg-yellow-100 text-yellow-800' },
  'user_deleted': { label: 'User Deleted', color: 'bg-red-100 text-red-800' }
}

export default function AdminActivityLogs({ className }: AdminActivityLogsProps) {
  const { user } = useAuth()
  const [logs, setLogs] = useState<AdminActionLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<AdminActionLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [filters, setFilters] = useState({
    adminId: '',
    action: '',
    dateRange: '7d' as '24h' | '7d' | '30d' | 'all'
  })

  // Load logs
  const loadLogs = useCallback(async () => {
    if (!user) return
    
    try {
      setLoading(true)
      setError(null)
      
      const { getAdminActivityLogs } = await import('@/lib/admin')
      
      // Calculate date range
      let startDate: Date | undefined
      if (filters.dateRange !== 'all') {
        startDate = new Date()
        switch (filters.dateRange) {
          case '24h':
            startDate.setDate(startDate.getDate() - 1)
            break
          case '7d':
            startDate.setDate(startDate.getDate() - 7)
            break
          case '30d':
            startDate.setDate(startDate.getDate() - 30)
            break
        }
      }
      
      const allLogs = await getAdminActivityLogs({
        adminId: filters.adminId || undefined,
        action: filters.action || undefined,
        startDate,
        limit: 200
      })
      
      setLogs(allLogs)
      setFilteredLogs(allLogs)
    } catch (err: any) {
      console.error('Error loading logs:', err)
      setError(err.message || 'Failed to load activity logs')
    } finally {
      setLoading(false)
    }
  }, [user, filters])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  // Export logs to CSV
  const handleExport = useCallback(() => {
    if (filteredLogs.length === 0) return
    
    const headers = ['Timestamp', 'Admin', 'Action', 'Description']
    const rows = filteredLogs.map(log => [
      log.timestamp.toDate().toISOString(),
      log.adminEmail,
      log.action,
      log.description
    ])
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `admin-activity-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [filteredLogs])

  // Get action badge
  const getActionBadge = (action: string) => {
    const config = ACTION_LABELS[action] || { label: action, color: 'bg-gray-100 text-gray-800' }
    return (
      <Badge className={config.color} variant="outline">
        {config.label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-600">Loading activity logs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{logs.length}</div>
            <div className="text-sm text-gray-600">Total Actions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {logs.filter(l => l.action.includes('approved')).length}
            </div>
            <div className="text-sm text-gray-600">Approvals</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {logs.filter(l => l.action.includes('role')).length}
            </div>
            <div className="text-sm text-gray-600">Role Changes</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs mb-2 block">Time Range</Label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
                className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>
            
            <div>
              <Label className="text-xs mb-2 block">Action Type</Label>
              <select
                value={filters.action}
                onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
                className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md"
              >
                <option value="">All Actions</option>
                <option value="role_assigned">Role Assigned</option>
                <option value="role_revoked">Role Revoked</option>
                <option value="admin_activated">Admin Activated</option>
                <option value="admin_deactivated">Admin Deactivated</option>
                <option value="camera_approved">Camera Approved</option>
                <option value="camera_rejected">Camera Rejected</option>
              </select>
            </div>
            
            <div className="md:col-span-2 flex items-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadLogs}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="gap-2"
                disabled={filteredLogs.length === 0}
              >
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        Showing {filteredLogs.length} activity log{filteredLogs.length !== 1 ? 's' : ''}
      </div>

      {/* Logs List */}
      <div className="space-y-3">
        {filteredLogs.map((log) => (
          <Card key={log.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Activity className="w-5 h-5 text-gray-400" />
                    <div className="flex items-center gap-2 flex-wrap">
                      {getActionBadge(log.action)}
                      <span className="text-sm text-gray-600">by</span>
                      <div className="flex items-center gap-1">
                        <Shield className="w-3 h-3 text-blue-600" />
                        <span className="font-medium text-sm">{log.adminEmail}</span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-2">{log.description}</p>
                  
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <div className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded">
                      {JSON.stringify(log.metadata, null, 2)}
                    </div>
                  )}
                </div>
                
                <div className="text-right">
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                    <Clock className="w-3 h-3" />
                    {log.timestamp.toDate().toLocaleTimeString()}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    {log.timestamp.toDate().toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredLogs.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No activity logs found</h3>
            <p className="text-gray-600">
              {filters.action || filters.dateRange !== 'all'
                ? "No logs match your filters."
                : "No admin activity to display."
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
