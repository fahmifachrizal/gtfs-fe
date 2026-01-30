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
        link.download = `gtfs-data-${currentProject?.name || "project"}-${new Date().toISOString().split("T")[0]
            }.json`
        link.click()
        URL.revokeObjectURL(url)
    }

    return (
        <EditorProvider>
            <EditorLayoutInner
                onExport={handleExport}
                loading={loading}>
                {children}
            </EditorLayoutInner>
        </EditorProvider>
    )
}

function EditorLayoutInner({ children, onExport, loading: initialLoading }) {
    const { user, currentProject } = useUser()
    const { center, mapData, generateAnimationRoutes, resetEditorState } = useEditorContext()
    const [loading, setLoading] = useState(false) // Local loading for reset
    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)

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
            const res = await fetch(
                fullUrl,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ project_id: currentProject.id }),
                }
            )

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
            <div className="w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 z-10">
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

                {/* Second Row - Editor Navigation */}
                <EditorMenu />
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <div className="w-[500px] flex-shrink-0 border-r border-border/40 flex flex-col bg-background">
                    <div className="flex-1 overflow-y-auto scrollbar-hide">
                        {children}
                        <Outlet />
                    </div>
                </div>

                {/* Map container with animation support */}
                <div className="flex-1 flex flex-col relative min-w-0">
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

            <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reset Project Data?</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to reset all GTFS data for project <span className="font-semibold">{currentProject?.name}</span>?
                            <br />This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsResetDialogOpen(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmReset} disabled={loading}>
                            {loading ? "Resetting..." : "Reset Data"}
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
