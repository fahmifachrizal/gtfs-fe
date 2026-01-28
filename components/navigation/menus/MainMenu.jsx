// components/navigation/menus/MainMenu.jsx - Main navigation menu component
"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import dynamic from "next/dynamic"

const NavigationMenuTrigger = dynamic(
  () => import("@/components/ui/navigation-menu").then((mod) => mod.NavigationMenuTrigger),
  { ssr: false }
)
import {
  Home,
  FolderOpen,
  Settings,
  MapPin,
  Route,
  Clock,
  Calendar,
  CreditCard,
  Database,
  Shapes,
} from "lucide-react"

const editorComponents = [
  {
    title: "Welcome",
    href: "/editor",
    description: "Upload GTFS files or start new projects",
    icon: Home,
  },
  {
    title: "Stops",
    href: "/editor/stops",
    description: "Manage transit stops and stations",
    icon: MapPin,
  },
  {
    title: "Routes",
    href: "/editor/routes",
    description: "Define transit routes and lines",
    icon: Route,
  },
  {
    title: "Trips",
    href: "/editor/trips",
    description: "Schedule trips and services",
    icon: Clock,
  },
  {
    title: "Stop Times",
    href: "/editor/stop-times",
    description: "Manage trip timing data",
    icon: Database,
  },
  {
    title: "Calendar",
    href: "/editor/calendar",
    description: "Set service dates and schedules",
    icon: Calendar,
  },
  {
    title: "Shapes",
    href: "/editor/shapes",
    description: "Define route geometry",
    icon: Shapes,
  },
  {
    title: "Fares",
    href: "/editor/fares",
    description: "Configure fare rules and pricing",
    icon: CreditCard,
  },
]

const ListItem = React.forwardRef(
  ({ className, title, children, href, icon, ...props }, ref) => {
    const pathname = usePathname()
    const isActive = pathname === href

    return (
      <li>
        <NavigationMenuLink asChild>
          <Link
            ref={ref}
            href={href}
            className={cn(
              "block select-none space-y-1 rounded-md p-2 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
              isActive && "bg-accent text-accent-foreground",
              className
            )}
            {...props}>
            <div className="flex items-center gap-2 text-xs font-medium leading-none">
              {icon}
              {title}
            </div>
            <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
              {children}
            </p>
          </Link>
        </NavigationMenuLink>
      </li>
    )
  }
)
ListItem.displayName = "ListItem"

export function MainMenu() {
  const pathname = usePathname()

  return (
    <NavigationMenu>
      <NavigationMenuList className="flex items-center space-x-0">
        {/* Home */}
        <NavigationMenuItem>
          <NavigationMenuLink
            asChild
            className={cn(
              navigationMenuTriggerStyle(),
              "h-8 px-3 py-1 text-sm",
              pathname === "/" && " bg-transparent text-accent-foreground"
            )}>
            <Link href="/" className="flex items-center">
              <Home className="mr-1.5 h-3.5 w-3.5" />
              Home
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        {/* Projects */}
        <NavigationMenuItem>
          <NavigationMenuLink
            asChild
            className={cn(
              navigationMenuTriggerStyle(),
              "h-8 px-3 py-1 text-sm",
              pathname === "/projects" && " bg-transparent text-accent-foreground"
            )}>
            <Link href="/projects" className="flex items-center">
              <FolderOpen className="mr-1.5 h-3.5 w-3.5" />
              Projects
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        {/* Editor with dropdown */}
        <NavigationMenuItem>
          <NavigationMenuTrigger className="h-8 px-3 py-1 text-sm bg-transparent">
            <Settings className="mr-1.5 h-3.5 w-3.5" />
            Editor
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[380px] gap-2 p-3 md:w-[480px] md:grid-cols-2">
              {editorComponents.map((component) => {
                const Icon = component.icon
                return (
                  <ListItem
                    key={component.title}
                    title={component.title}
                    href={component.href}
                    icon={<Icon className="h-3.5 w-3.5" />}>
                    {component.description}
                  </ListItem>
                )
              })}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
