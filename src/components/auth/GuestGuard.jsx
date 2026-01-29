// components/auth/GuestGuard.js - Guest-only protection
"use client"
import React from "react"
import { useGuestOnly } from "@/hooks/useAuth"
import { Spinner } from "@/components/ui/spinner"

/**
 * Guest guard component for login/register pages
 */
export function GuestGuard({ children, fallback = null, redirectTo = "/editor" }) {
  const { isAuthenticated, isLoading } = useGuestOnly(redirectTo)

  if (isLoading) {
    return fallback || <Spinner />
  }

  if (isAuthenticated) {
    return fallback || <div>Redirecting to dashboard...</div>
  }

  return children
}