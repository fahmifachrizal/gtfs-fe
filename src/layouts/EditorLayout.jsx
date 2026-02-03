import React, { useState } from "react"
import { toast } from "sonner"
import { useLocation, Outlet, Link } from "react-router-dom"
// import { AuthGuard } from "@/components/auth/AuthGuard" // Ensure this exists or implement simple check
import { EditorProvider, useEditorContext } from "@/contexts/EditorContext"
import { useUser } from "@/contexts/UserContext"
import {
  MainMenu,
  EditorMenu,
  UserPreferences,
  EditorPreferences,
} from "@/components/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { EditorSidebar } from "@/components/EditorSidebar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getApiUrl } from "@/config/api"
import LeafletDynamic from "@/components/maps/leaflet-dynamic"
import "leaflet/dist/leaflet.css"

function EditorLayoutContent({ children }) {
  const location = useLocation()
  const { user, currentProject } = useUser()
  const [loading, setLoading] = useState(false)

  const handleExport = () => {
    const exportData = {
      project: currentProject,
      exportedAt: new Date().toISOString(),
      exportedBy: user?.id,
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

  return (
    <EditorProvider>
      <EditorLayoutInner onExport={handleExport} loading={loading}>
        {children}
      </EditorLayoutInner>
    </EditorProvider>
  )
}

function EditorLayoutInner({ children, onExport, loading: initialLoading }) {
  const location = useLocation()
  const { user, currentProject } = useUser()
  const { center, mapData, mapBounds, resetEditorState, onMarkerDragEnd } =
    useEditorContext()
  const [loading, setLoading] = useState(false) // Local loading for reset
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)

  // Check if we're at home
  const isAtHome = location.pathname === "/" || location.pathname === "/editor"

  const handleResetClick = () => {
    if (!currentProject) {
      toast.error("No project selected")
      return
    }
    setIsResetDialogOpen(true)
  }

  const confirmReset = async () => {
    setLoading(true)
    try {
      const fullUrl = getApiUrl(`/api/gtfs/reset`)
      const res = await fetch(fullUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ project_id: currentProject.id }),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Failed to reset tables")

      toast.success("All GTFS tables reset!")
      if (resetEditorState) resetEditorState()
      setIsResetDialogOpen(false)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Animation event handlers (optional - for debugging/monitoring)
  const handleInstanceCreate = (instanceId, routeId, info) => {
    console.log(
      `[Editor] Animation instance created: ${instanceId} for route ${routeId}`,
      info,
    )
  }

  const handleInstanceComplete = (instanceId, routeId, info) => {
    console.log(
      `[Editor] Animation instance completed: ${instanceId} for route ${routeId}`,
      info,
    )
  }

  const handleProgress = (instanceId, routeId, progress, latLng) => {
    // Optional: track animation progress
    // console.log(`[Editor] Progress ${instanceId}: ${Math.round(progress * 100)}%`)
  }

  const {
    activeDetail,
    isDetailOpen,
    detailTitle,
    closeDetail,
    hasUnsavedChanges,
    setHasUnsavedChanges,
  } = useEditorContext()
  const detailRef = React.useRef(null)
  const [isUnsavedChangesDialogOpen, setIsUnsavedChangesDialogOpen] =
    useState(false)

  // Handle close button click
  const handleCloseClick = () => {
    if (hasUnsavedChanges) {
      setIsUnsavedChangesDialogOpen(true)
    } else {
      closeDetail()
    }
  }

  // Discard changes and close
  const handleDiscardChanges = () => {
    setIsUnsavedChangesDialogOpen(false)
    setHasUnsavedChanges(false)
    closeDetail()
  }

  return (
    <div className="h-screen flex flex-col text-foreground bg-background">
      {/* HEADER (Horizontal Menus) */}
      <div className="w-full border-b border-border/40 bg-background/95 backdrop-blur z-20">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {isAtHome ? (
                <h1 className="text-lg font-bold">GTFS Editor</h1>
              ) : (
                <Link
                  to="/"
                  className="text-lg font-bold hover:text-primary transition-colors cursor-pointer">
                  GTFS Editor
                </Link>
              )}
            </div>
            <MainMenu />
            {currentProject && (
              <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
                📁 {currentProject.name}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <EditorPreferences
              onExport={onExport}
              onReset={handleResetClick}
              loading={loading}
            />
            {user ? (
              <UserPreferences />
            ) : (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Log in</Link>
              </Button>
            )}
          </div>
        </div>
        <EditorMenu />
      </div>

      {/* SIDEBARS & CONTENT */}
      <SidebarProvider
        style={{
          "--sidebar-width": "500px",
          "--sidebar-width-icon": "3rem",
        }}
        className="flex-1 min-h-0 overflow-hidden">
        <EditorSidebar className="mt-0 h-full border-r">
          {children}
          <Outlet />
        </EditorSidebar>

        <SidebarInset className="relative flex flex-col h-full overflow-hidden">
          <div className="flex-1 relative overflow-hidden">
            {/* MAP LAYER */}
            <div className="absolute inset-0 z-0">
              <LeafletDynamic
                center={center || [-6.175389, 106.827139]}
                zoom={13}
                className="h-full w-full"
                geojsonData={mapData}
                bounds={mapBounds}
                routes={[]}
                onInstanceCreate={handleInstanceCreate}
                onInstanceComplete={handleInstanceComplete}
                onProgress={handleProgress}
                onMarkerDragEnd={onMarkerDragEnd}
                rightPadding={isDetailOpen ? 400 : 0}
              />
            </div>

            {/* MAP LEGEND (Bottom Left) */}
            <div className="absolute bottom-4 left-4 z-10 bg-background/95 backdrop-blur shadow-lg border border-border/50 rounded-lg p-3">
              <div className="text-xs font-semibold mb-2 text-foreground">
                Legend
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                  <span className="text-muted-foreground">Stop</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                  <span className="text-muted-foreground">Waypoint</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500 shrink-0" />
                  <span className="text-muted-foreground">Selected</span>
                </div>
              </div>
            </div>

            {/* DETAIL SIDEBAR (Floating Right) */}
            {isDetailOpen && (
              <div
                ref={detailRef}
                className="absolute top-4 right-4 bottom-4 w-100 z-20 bg-background/95 backdrop-blur shadow-xl border border-border/50 rounded-xl overflow-hidden flex flex-col animate-in slide-in-from-right-10 fade-in duration-200">
                <div className="flex-1 overflow-y-auto p-4">{activeDetail}</div>
              </div>
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>

      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Project Data?</DialogTitle>
            <DialogDescription>
              Are you sure you want to reset all GTFS data for project{" "}
              <span className="font-semibold">{currentProject?.name}</span>?
              <br />
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsResetDialogOpen(false)}
              disabled={loading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReset}
              disabled={loading}>
              {loading ? "Resetting..." : "Reset Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isUnsavedChangesDialogOpen}
        onOpenChange={setIsUnsavedChangesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Do you want to save them before closing?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleDiscardChanges}>
              Discard Changes
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsUnsavedChangesDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                // Trigger save action - the detail component should handle this via a ref or callback
                const saveEvent = new CustomEvent("detail-save-requested")
                window.dispatchEvent(saveEvent)
                setIsUnsavedChangesDialogOpen(false)
              }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function EditorLayout() {
  // AuthGuard logic should be handled here or higher up
  // For now simple wrapper
  return (
    // <AuthGuard>
    <EditorLayoutContent>
      {/* <Outlet /> moved inside EditorLayoutContent to be in sidebar */}
    </EditorLayoutContent>
    // </AuthGuard>
  )
}
