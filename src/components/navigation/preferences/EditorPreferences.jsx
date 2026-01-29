// components/navigation/preferences/EditorPreferences.jsx - Editor-specific action buttons and controls
"use client"
import React, { useState } from "react"
import { Save, Download, Trash2 } from "lucide-react"
import { useTheme } from "next-themes"
import { useUser } from "@/contexts/UserContext"
import { Button } from "@/components/ui/button"

export function EditorPreferences({ onExport, onReset, loading = false }) {
  const { theme } = useTheme()
  const { currentProject } = useUser()
  const [isDarkMode, setIsDarkMode] = useState(theme === "dark")

  const switchThemeMode = () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    theme.setTheme && theme.setTheme(newTheme)
    setIsDarkMode(newTheme === "dark")
  }

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onExport}
        title="Export GTFS Data"
        className="hidden sm:flex h-7 px-2 text-xs"
        disabled={!currentProject}>
        <Download className="w-3 h-3 mr-1" />
        Export
      </Button>

      <Button
        title="Save Project"
        variant="outline"
        size="sm"
        className="hidden sm:flex h-7 px-2 text-xs"
        disabled={!currentProject}>
        <Save className="w-3 h-3 mr-1" />
        Save
      </Button>

      <Button
        variant="destructive"
        size="sm"
        onClick={onReset}
        disabled={loading || !currentProject}
        className="hidden md:flex h-7 px-2 text-xs">
        <Trash2 className="w-3 h-3 mr-1" />
        {loading ? "Resetting..." : "Reset"}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={switchThemeMode}
        title="Toggle theme"
        className="h-7 w-7 p-0">
        🌓
      </Button>
    </div>
  )
}
