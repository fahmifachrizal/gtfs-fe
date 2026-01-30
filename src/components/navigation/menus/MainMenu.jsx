import * as React from "react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
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



const ListItem = React.forwardRef(
  ({ className, title, children, href, icon, ...props }, ref) => {
    const location = useLocation()
    const isActive = location.pathname === href

    return (
      <li>
        <NavigationMenuLink asChild>
          <Link
            ref={ref}
            to={href}
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
  const location = useLocation()

  return (
    <NavigationMenu className="justify-start">
      <NavigationMenuList className="flex items-center justify-start space-x-0">
        {/* Home */}
        <NavigationMenuItem>
          <NavigationMenuLink
            asChild
            className={cn(
              navigationMenuTriggerStyle(),
              "h-8 px-3 py-1 text-sm",
              location.pathname === "/" && " bg-transparent text-accent-foreground"
            )}>
            <Link to="/" className="flex items-center">
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
              location.pathname === "/projects" && " bg-transparent text-accent-foreground"
            )}>
            <Link to="/projects" className="flex items-center">
              <FolderOpen className="mr-1.5 h-3.5 w-3.5" />
              Projects
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>


      </NavigationMenuList>
    </NavigationMenu>
  )
}
