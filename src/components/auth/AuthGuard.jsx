// components/auth/AuthGuard.js - Route protection component
"use client"
import React from "react"
import { useRequireAuth } from "@/hooks/useAuth"
import { Spinner } from "../ui/spinner"

/**
 * Authentication guard component that protects routes
 */
export function AuthGuard({ children, fallback = null, redirectTo = "/login" }) {
  const { isAuthenticated, isLoading } = useRequireAuth(redirectTo)

  if (isLoading) {
    return fallback || <Spinner />
  }

  if (!isAuthenticated) {
    return fallback || <div>Redirecting to login...</div>
  }

  return children
}