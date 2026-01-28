// app/editor/layout.js - Updated editor layout with animation support
"use client"
import React, { useState } from "react"
import { usePathname } from "next/navigation"
import { AuthGuard } from "@/components/auth/AuthGuard"
import { EditorProvider, useEditorContext } from "@/contexts/EditorContext"
import { useUser } from "@/contexts/UserContext"
import {
  MainMenu,
  EditorMenu,
  UserPreferences,
  EditorPreferences,
} from "@/components/navigation"
import LeafletDynamic from "@/components/maps/leaflet-dynamic"
import "/node_modules/leaflet/dist/leaflet.css"

function EditorLayoutContent({ children }) {
  const pathname = usePathname()
  const { user, currentProject } = useUser()
  const [loading, setLoading] = useState(false)

  const handleExport = () => {
    const exportData = {
      project: currentProject,
      exportedAt: new Date().toISOString(),
      exportedBy: user.id,
    }
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `gtfs-data-${currentProject?.name || "project"}-${
      new Date().toISOString().split("T")[0]
    }.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleReset = async () => {
    if (!currentProject) {
      alert("No project selected")
      return
    }

    const confirmed = window.confirm(
      `Are you sure you want to reset all GTFS data for project "${currentProject.name}"? This action cannot be undone.`
    )

    if (!confirmed) return

    setLoading(true)
    try {
      const res = await fetch(
        `/api/gtfs/reset?project_id=${currentProject.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
        }
      )

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Failed to reset tables")

      alert("All GTFS tables reset!")
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <EditorProvider>
      <EditorLayoutInner
        onExport={handleExport}
        onReset={handleReset}
        loading={loading}>
        {children}
      </EditorLayoutInner>
    </EditorProvider>
  )
}

function EditorLayoutInner({ children, onExport, onReset, loading }) {
  const { currentProject } = useUser()
  const { center, mapData, generateAnimationRoutes } = useEditorContext()

  // Animation event handlers (optional - for debugging/monitoring)
  const handleInstanceCreate = (instanceId, routeId, info) => {
    console.log(
      `[Editor] Animation instance created: ${instanceId} for route ${routeId}`,
      info
    )
  }

  const handleInstanceComplete = (instanceId, routeId, info) => {
    console.log(
      `[Editor] Animation instance completed: ${instanceId} for route ${routeId}`,
      info
    )
  }

  const handleProgress = (instanceId, routeId, progress, latLng) => {
    // Optional: track animation progress
    // console.log(`[Editor] Progress ${instanceId}: ${Math.round(progress * 100)}%`)
  }

  return (
    <div className="h-screen flex flex-col text-foreground bg-background">
      {/* Compact Header with Navigation */}
      <div className="w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        {/* Top Row - Brand, Project, Actions, User */}
        <div className="flex items-center justify-between px-4 py-2">
          {/* Left side - Brand and Project */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold">GTFS Editor</h1>
              {currentProject && (
                <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
                  📁 {currentProject.name}
                </span>
              )}
            </div>
            <MainMenu />
          </div>

          {/* Right side - Actions and User Preferences */}
          <div className="flex items-center space-x-2">
            <EditorPreferences
              onExport={onExport}
              onReset={onReset}
              loading={loading}
            />
            <UserPreferences />
          </div>
        </div>

        {/* Second Row - Editor Navigation */}
        <EditorMenu />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-1/4 border-r border-border/40 flex flex-col bg-background">
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {children}
          </div>
        </div>

        {/* Map container with animation support */}
        <div className="w-3/4 flex flex-col relative">
          <LeafletDynamic
            center={center || [-6.175389, 106.827139]}
            zoom={13}
            className="h-full w-full z-0"
            geojsonData={mapData}
            routes={generateAnimationRoutes}
            onInstanceCreate={handleInstanceCreate}
            onInstanceComplete={handleInstanceComplete}
            onProgress={handleProgress}
          />
        </div>
      </div>
    </div>
  )
}

export default function EditorLayout({ children }) {
  return (
    <AuthGuard>
      <EditorLayoutContent>{children}</EditorLayoutContent>
    </AuthGuard>
  )
}
