import React, { useState, useEffect } from "react"
import { useLocation, Link, Outlet } from "react-router-dom"
import { MainMenu, UserPreferences } from "@/components/navigation"
import { useUser } from "@/contexts/UserContext"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ThemeToggle"

export function NavigationHeader() {
    const { user } = useUser()
    const location = useLocation()
    const isHomePage = location.pathname === "/"
    const [isScrolled, setIsScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50)
        }

        window.addEventListener("scroll", handleScroll)
        handleScroll() // Check initial state
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    // Don't show navigation on editor pages (they have their own header)
    const isEditorPage = location.pathname?.startsWith("/editor")

    if (isEditorPage) {
        return null
    }

    return (
        <header className={`fixed top-0 z-50 w-full transition-all duration-300 ease-in-out ${
            !isHomePage || isScrolled 
                ? "bg-background/95 backdrop-blur border-b border-border/40" 
                : "bg-transparent border-transparent"
        }`}>
            <div className="container flex h-14 max-w-7xl items-center justify-between mx-auto px-4 py-2">
                {/* Left side - Brand and Navigation */}
                <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                        <Link to="/" className="flex items-center space-x-2">
                            <h1 className="text-lg font-bold">GTFS Editor</h1>
                        </Link>
                    </div>

                    {/* Main Navigation */}
                    <MainMenu />
                </div>

                {/* Right side - User Preferences or Login Button */}
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    {user ? (
                        <div className="flex items-center">
                            <UserPreferences />
                        </div>
                    ) : (
                        <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" asChild>
                                <Link to="/login">Log in</Link>
                            </Button>
                            <Button size="sm" asChild>
                                <Link to="/register">Sign up</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}

export default function HomeLayout() {
    const location = useLocation()
    // const isDebugPage = location.pathname?.startsWith("/debug") // Not used in current App

    return (
        <div className="min-h-screen bg-background font-sans antialiased">
            <NavigationHeader />
            <main className="relative flex min-h-screen flex-col pt-14">
                <Outlet />
            </main>
        </div>
    )
}
