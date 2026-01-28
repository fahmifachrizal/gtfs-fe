// app/layout.js - Updated root layout with new navigation structure
"use client"
import React, { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { AppProvider } from "@/providers/AppProvider"
import { MainMenu } from "@/components/navigation"
import { UserPreferences } from "@/components/navigation"
import { useUser } from "@/contexts/UserContext"
import "./globals.css"
import { Button } from "@/components/ui/button"
import Link from "next/link"

function NavigationHeader() {
  const { user } = useUser()
  const pathname = usePathname()

  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > (window.innerHeight * 0.9)) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener("scroll", toggleVisibility)
    return () => {
      window.removeEventListener("scroll", toggleVisibility)
    }
  }, [])

  // Don't show navigation on editor pages (they have their own header)
  const isEditorPage = pathname?.startsWith("/editor")

  if (isEditorPage) {
    return null
  }

  return (
    <header className={`fixed top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 ease-in-out ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}`}>
      <div className="flex items-center justify-between px-4 py-2">
        {/* Left side - Brand and Navigation */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold">GTFS Editor</h1>
          </div>

          {/* Main Navigation */}
          <MainMenu />
        </div>

        {/* Right side - User Preferences or Login Button */}
        {user ? (
          <div className="flex items-center">
            <UserPreferences />
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">Sign up</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
function RootLayoutContent({ children }) {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <NavigationHeader />
      <main>{children}</main>
    </div>
  )
}

export default function RootLayout({ children }) {
  const pathname = usePathname()
  const isDebugPage = pathname?.startsWith("/debug")

  if (isDebugPage) {
    return (
      <html lang="en" suppressHydrationWarning>
        <body>
          {children}
        </body>
      </html>
    )
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProvider>
          <RootLayoutContent>{children}</RootLayoutContent>
        </AppProvider>
      </body>
    </html>
  )
}