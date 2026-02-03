import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  User,
  Settings,
  LogOut,
  FolderOpen,
  HelpCircle,
  Moon,
  Sun,
  Monitor,
  Shield,
  Activity,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useUser } from "@/contexts/UserContext"
import { useLogout } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function UserPreferences() {
  const { user, getFullName, getInitials, currentProject } = useUser()
  const { handleLogout } = useLogout()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted before rendering theme-dependent content
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!user || !mounted) {
    return null
  }

  const onLogout = () => {
    handleLogout("/")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={user.avatar_url}
              alt={getFullName()}
              className="object-cover"
            />
            <AvatarFallback className="bg-secondary text-foreground text-sm font-medium">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-72 mr-4 mt-2 bg-background backdrop-blur-md border shadow-xl"
        align="end"
        forceMount>
        {/* User Info Header */}
        <DropdownMenuLabel className="font-normal px-4 py-3">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={user.avatar_url}
                alt={getFullName()}
                className="object-cover"
              />
              <AvatarFallback className="bg-secondary text-foreground font-semibold text-sm">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-semibold leading-none">
                {getFullName()}
              </p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              {currentProject && (
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  📁 {currentProject.name}
                </p>
              )}
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Main Menu Items - Disabled */}
        <DropdownMenuGroup>
          <DropdownMenuItem
            disabled
            className="cursor-not-allowed opacity-50">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            disabled
            className="cursor-not-allowed opacity-50">
            <FolderOpen className="mr-2 h-4 w-4" />
            <span>My Projects</span>
            {user.projects?.length > 0 && (
              <span className="ml-auto text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                {user.projects.length}
              </span>
            )}
          </DropdownMenuItem>

          <DropdownMenuItem
            disabled
            className="cursor-not-allowed opacity-50">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Theme Submenu - Disabled */}
        <DropdownMenuItem
          disabled
          className="cursor-not-allowed opacity-50">
          {theme === "dark" ? (
            <Moon className="mr-2 h-4 w-4" />
          ) : theme === "light" ? (
            <Sun className="mr-2 h-4 w-4" />
          ) : (
            <Monitor className="mr-2 h-4 w-4" />
          )}
          <span>Theme</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Security & Account - Disabled */}
        <DropdownMenuGroup>
          <DropdownMenuItem
            disabled
            className="cursor-not-allowed opacity-50">
            <Activity className="mr-2 h-4 w-4" />
            <span>Active Sessions</span>
          </DropdownMenuItem>

          {user.role === "admin" && (
            <DropdownMenuItem
              disabled
              className="cursor-not-allowed opacity-50">
              <Shield className="mr-2 h-4 w-4" />
              <span>Admin Panel</span>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            disabled
            className="cursor-not-allowed opacity-50">
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>Help & Support</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem
          onClick={onLogout}
          className="cursor-pointer text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}