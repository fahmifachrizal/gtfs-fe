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
  Building2,
  Radio,
  ArrowRightLeft,
  Check,
  Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const editorPages = [
  {
    title: "Welcome",
    href: "/editor",
    icon: Home,
    description: "Start here",
    step: 1,
    id: "welcome",
    required: false,
  },
  {
    title: "Agency",
    href: "/editor/agency",
    icon: Building2,
    description: "Transit agency information",
    step: 2,
    id: "agency",
    required: true,
  },
  {
    title: "Stops",
    href: "/editor/stops",
    icon: MapPin,
    description: "Transit stops & stations",
    step: 3,
    id: "stops",
    required: true,
  },
  {
    title: "Routes",
    href: "/editor/routes",
    icon: Route,
    description: "Transit routes & lines",
    step: 4,
    id: "routes",
    required: true,
  },
  {
    title: "Shapes",
    href: "/editor/shapes",
    icon: Shapes,
    description: "Route geometry & waypoints",
    step: 5,
    id: "shapes",
    required: false,
  },
  {
    title: "Calendar",
    href: "/editor/calendar",
    icon: Calendar,
    description: "Service dates & schedules",
    step: 6,
    id: "calendar",
    required: true,
  },
  {
    title: "Trips",
    href: "/editor/trips",
    icon: Clock,
    description: "Vehicle trips & schedules",
    step: 7,
    id: "trips",
    required: true,
  },
  {
    title: "Stop Times",
    href: "/editor/stop-times",
    icon: Database,
    description: "Trip timing data",
    step: 8,
    id: "stop-times",
    required: true,
  },
  {
    title: "Frequencies",
    href: "/editor/frequencies",
    icon: Radio,
    description: "Headway-based service",
    step: 9,
    id: "frequencies",
    required: false,
  },
  {
    title: "Transfers",
    href: "/editor/transfers",
    icon: ArrowRightLeft,
    description: "Transfer rules between stops",
    step: 10,
    id: "transfers",
    required: false,
  },
  {
    title: "Fares",
    href: "/editor/fares",
    icon: CreditCard,
    description: "Fare rules & pricing",
    step: 11,
    id: "fares",
    required: false,
  },
]

export function EditorMenu() {
  const location = useLocation()
  const pathname = location.pathname

  const currentStepIndex = editorPages.findIndex(
    (page) => page.href === pathname
  )

  // Check if user can navigate to a specific step (sequential access only)
  const canNavigateToStep = (targetIndex) => {
    // Always allow navigating to welcome
    if (targetIndex === 0) return true

    // Only allow navigation to the next page or previously visited pages
    // Allow navigation to any page that's before or equal to one step ahead of current
    return targetIndex <= currentStepIndex + 1
  }

  const getStepState = (page, index) => {
    if (index === currentStepIndex) return "current"
    // Remove completion status check - now only based on position
    if (index < currentStepIndex) return "completed"
    if (!canNavigateToStep(index)) return "locked"
    return "upcoming"
  }

  const getStepStyles = (state, page) => {
    const baseStyles = "flex items-center text-sm"

    switch (state) {
      case "current":
        return cn(baseStyles, "text-foreground font-semibold")
      case "completed":
        return cn(baseStyles, "text-foreground")
      case "locked":
        return cn(baseStyles, "text-muted-foreground/20 cursor-not-allowed")
      case "upcoming":
        return cn(baseStyles, "text-muted-foreground/40")
      default:
        return baseStyles
    }
  }

  const getChevronStyles = (page) => {
    const stepState = getStepState(page, editorPages.findIndex(p => p.id === page.id))

    if (stepState === "completed" || stepState === "current") {
      return "text-foreground/60"
    }
    return "text-muted-foreground/40"
  }

  return (
    <nav className="border-t border-border/40 bg-linear-to-r from-background/50 to-background/30 backdrop-blur-sm">
      <div className="px-6 py-3">
        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide">
          {editorPages.map((page, index) => {
            const Icon = page.icon
            const stepState = getStepState(page, index)
            const isCompleted = stepState === "completed"
            const isLocked = stepState === "locked"
            const canNavigate = canNavigateToStep(index)

            const tooltipText = isLocked
              ? `Complete previous pages first to unlock this step`
              : page.description

            const content = (
              <div className="flex items-center space-x-2">
                {isCompleted ? (
                  <div className="relative">
                    <Icon className="h-4 w-4 shrink-0 opacity-30" />
                    <Check className="h-3 w-3 shrink-0 absolute -bottom-0.5 -right-0.5" />
                  </div>
                ) : isLocked ? (
                  <div className="relative">
                    <Icon className="h-4 w-4 shrink-0 opacity-20" />
                    <Lock className="h-3 w-3 shrink-0 absolute -bottom-0.5 -right-0.5 opacity-50" />
                  </div>
                ) : (
                  <Icon className="h-4 w-4 shrink-0" />
                )}
                <span className={stepState === "current" ? "font-semibold" : "font-medium"}>
                  {page.title}
                </span>
              </div>
            )

            return (
              <React.Fragment key={page.href}>
                {/* Navigation Item */}
                <Button variant="link" size="sm" className="px-0 group relative">
                  {canNavigate ? (
                    <Link
                      style={{ textDecoration: "none" }}
                      to={page.href}
                      className={getStepStyles(stepState, page)}
                      title={tooltipText}>
                      {content}
                    </Link>
                  ) : (
                    <span
                      className={getStepStyles(stepState, page)}
                      title={tooltipText}>
                      {content}
                    </span>
                  )}
                </Button>

                {/* Chevron Separator */}
                {index < editorPages.length - 1 && (
                  <div className="flex items-center px-1">
                    <ChevronRight
                      className={cn(
                        "h-5 w-5 shrink-0 transition-colors duration-200",
                        getChevronStyles(page)
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
