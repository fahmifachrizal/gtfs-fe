// providers/AppProvider.js - Main app provider that wraps UserContext
"use client"
import React from "react"
import { UserProvider } from "@/contexts/UserContext"
import { ThemeProvider } from "next-themes"

/**
 * Main App Provider that combines all context providers
 * This should wrap your entire application at the root level
 */
export function AppProvider({ children }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <UserProvider>
        {children}
      </UserProvider>
    </ThemeProvider>
  )
}