import * as React from "react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import {
  Home,
  MapPin,
  Route,
  Clock,
  Calendar,
  CreditCard,
  ChevronRight,
  Database,
  Shapes,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const editorPages = [
  {
    title: "Welcome",
    href: "/editor",
    icon: Home,
    description: "Start here",
    step: 1,
  },
  {
    title: "Stops",
    href: "/editor/stops",
    icon: MapPin,
    description: "Transit stops & stations",
    step: 2,
  },
  {
    title: "Routes",
    href: "/editor/routes",
    icon: Route,
    description: "Transit routes & lines",
    step: 3,
  },
  {
    title: "Trips",
    href: "/editor/trips",
    icon: Clock,
    description: "Vehicle trips & schedules",
    step: 4,
  },
  {
    title: "Stop Times",
    href: "/editor/stop-times",
    icon: Database,
    description: "Trip timing data",
    step: 5,
  },
  {
    title: "Calendar",
    href: "/editor/calendar",
    icon: Calendar,
    description: "Service dates & schedules",
    step: 6,
  },
  {
    title: "Shapes",
    href: "/editor/shapes",
    icon: Shapes,
    description: "Route geometry",
    step: 7,
  },
  {
    title: "Fares",
    href: "/editor/fares",
    icon: CreditCard,
    description: "Fare rules & pricing",
    step: 8,
  },
]

export function EditorMenu() {
  const location = useLocation()
  const pathname = location.pathname
  const currentStepIndex = editorPages.findIndex(
    (page) => page.href === pathname
  )

  const getStepState = (index) => {
    if (index === currentStepIndex) return "current"
    if (index < currentStepIndex) return "completed"
    return "upcoming"
  }

  const getStepStyles = (state, index) => {
    const baseStyles = "flex items-center text-sm"

    switch (state) {
      case "current":
        return cn(baseStyles, "text-foreground")
      case "completed":
        return cn(baseStyles, "text-foreground/80")
      case "upcoming":
        return cn(baseStyles, "text-muted-foreground/40")
      default:
        return baseStyles
    }
  }

  const getChevronStyles = (index) => {
    const stepState = getStepState(index)

    if (stepState === "completed" || stepState === "current") {
      return "text-foreground/60"
    }
    return "text-muted-foreground/40"
  }

  return (
    <nav className="border-t border-border/40 bg-gradient-to-r from-background/50 to-background/30 backdrop-blur-sm">
      <div className="px-6 py-3">
        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide">
          {editorPages.map((page, index) => {
            const Icon = page.icon
            const stepState = getStepState(index)

            return (
              <React.Fragment key={page.href}>
                {/* Navigation Item */}
                <Button variant="link" size="sm" className="px-0">
                  <Link
                    style={{ textDecoration: "none" }}
                    to={page.href}
                    className={getStepStyles(stepState, index)}>
                    {/* Icon and Title */}
                    <div className="flex items-center space-x-2">
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="font-medium">{page.title}</span>
                    </div>
                  </Link>
                </Button>

                {/* Chevron Separator */}
                {index < editorPages.length - 1 && (
                  <div className="flex items-center px-1">
                    <ChevronRight
                      className={cn(
                        "h-5 w-5 shrink-0 transition-colors duration-200",
                        getChevronStyles(index)
                      )}
                    />
                  </div>
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
