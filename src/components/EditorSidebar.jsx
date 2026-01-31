"use client"

import * as React from "react"
import { useLocation, Link } from "react-router-dom"
import {
    Home,
    MapPin,
    Route,
    Clock,
    Calendar,
    CreditCard,
    Database,
    Shapes,
    FolderOpen,
    Settings
} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
} from "@/components/ui/sidebar"
import { NavUser } from "@/components/nav-user"
import { useUser } from "@/contexts/UserContext"

const editorPages = [
    {
        title: "Welcome",
        href: "/editor",
        icon: Home,
    },
    {
        title: "Stops",
        href: "/editor/stops",
        icon: MapPin,
    },
    {
        title: "Routes",
        href: "/editor/routes",
        icon: Route,
    },
    {
        title: "Trips",
        href: "/editor/trips",
        icon: Clock,
    },
    {
        title: "Stop Times",
        href: "/editor/stop-times",
        icon: Database,
    },
    {
        title: "Calendar",
        href: "/editor/calendar",
        icon: Calendar,
    },
    {
        title: "Shapes",
        href: "/editor/shapes",
        icon: Shapes,
    },
    {
        title: "Fares",
        href: "/editor/fares",
        icon: CreditCard,
    },
]

export function EditorSidebar({ children, ...props }) {
    const location = useLocation()
    const { user, currentProject } = useUser()

    return (
        <Sidebar
            collapsible="none"
            className="overflow-hidden border-r"
            {...props}>

            {/* List Sidebar (Content) */}
            <SidebarContent className="h-full overflow-hidden p-0">
                {children}
            </SidebarContent>

        </Sidebar>
    )
}
