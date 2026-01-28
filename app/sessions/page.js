// app/sessions/page.js
"use client"
import React, { useEffect } from "react"
import { AuthGuard } from "@/components/auth/AuthGuard"
import { useSessionManagement } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"

export default function SessionsPage() {
  return (
    <AuthGuard>
      <div className="container mx-auto py-8">
        <SessionsList />
      </div>
    </AuthGuard>
  )
}

function SessionsList() {
  const { 
    sessions, 
    refreshSessions, 
    revokeSession, 
    revokeAllOtherSessions,
    isLoading 
  } = useSessionManagement()

  useEffect(() => {
    refreshSessions()
  }, [])

  const handleRevokeSession = async (sessionId) => {
    if (confirm('Are you sure you want to revoke this session?')) {
      await revokeSession(sessionId)
    }
  }

  const handleRevokeAllOthers = async () => {
    if (confirm('Are you sure you want to revoke all other sessions?')) {
      await revokeAllOtherSessions()
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Active Sessions</h1>
        <div className="space-x-2">
          <Button onClick={refreshSessions} disabled={isLoading}>
            Refresh
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleRevokeAllOthers}
            disabled={isLoading}
          >
            Revoke All Others
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {sessions.map((session) => (
          <div 
            key={session.id}
            className={`border rounded-lg p-4 ${
              session.is_current 
                ? 'bg-green-50 border-green-200' 
                : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold">
                    {session.user_agent || 'Unknown Device'}
                  </h3>
                  {session.is_current && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 text-xs rounded-full">
                      Current Session
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  IP: {session.ip_address || 'Unknown'}
                </p>
                <p className="text-sm text-gray-600">
                  Last active: {formatDistanceToNow(new Date(session.last_active))} ago
                </p>
                <p className="text-sm text-gray-600">
                  Created: {formatDistanceToNow(new Date(session.created_at))} ago
                </p>
              </div>
              {!session.is_current && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRevokeSession(session.id)}
                  disabled={isLoading}
                >
                  Revoke
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}