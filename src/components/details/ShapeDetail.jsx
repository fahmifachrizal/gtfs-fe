"use client"

import React, { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { MapPin, Trash2, GripVertical, Plus, Navigation, Edit2, Check, X, Save } from "lucide-react"
import { toast } from "sonner"
import { useUser } from "@/contexts/UserContext"
import { projectService } from "@/services/projectService"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function ShapeDetail({ route, shape, initialDirection = 0, onSave, onClose, onDirectionChange, onWaypointHover, onWaypointDrag }) {
    const { currentProject } = useUser()
    const [isSaving, setIsSaving] = useState(false)
    const [selectedDirection, setSelectedDirection] = useState(initialDirection)
    const [waypoints, setWaypoints] = useState([])
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [hoveredIndex, setHoveredIndex] = useState(null)
    const [editingCoordinates, setEditingCoordinates] = useState(null)
    const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
    const initialWaypointsRef = useRef(null)

    useEffect(() => {
        let newWaypoints = []
        if (shape?.waypoints) {
            newWaypoints = shape.waypoints
        } else if (route?.directions) {
            // Initialize waypoints from route stops for selected direction
            const directionStops = route.directions[selectedDirection] || []
            newWaypoints = directionStops.map((stop, index) => ({
                id: `stop-${stop.stop_id}-${index}`,
                type: 'stop',
                stop_id: stop.stop_id,
                stop_name: stop.stop_name,
                lat: stop.stop_lat,
                lon: stop.stop_lon,
                sequence: index,
                shape_dist_traveled: 0,
            }))
        }
        setWaypoints(newWaypoints)
        // Store initial state for unsaved changes detection
        if (initialWaypointsRef.current === null) {
            initialWaypointsRef.current = JSON.stringify(newWaypoints)
        }
    }, [shape, route, selectedDirection])

    // Check if there are unsaved changes
    const hasUnsavedChanges = () => {
        if (initialWaypointsRef.current === null) return false
        return JSON.stringify(waypoints) !== initialWaypointsRef.current
    }

    // Handle close attempt - check for unsaved changes
    const handleCloseAttempt = () => {
        if (hasUnsavedChanges()) {
            setShowUnsavedDialog(true)
        } else {
            onClose?.()
        }
    }

    // Discard changes and close
    const handleDiscardAndClose = () => {
        setShowUnsavedDialog(false)
        onClose?.()
    }

    // Notify parent when direction changes
    useEffect(() => {
        onDirectionChange?.(selectedDirection)
    }, [selectedDirection, onDirectionChange])

    const handleAddWaypoint = (afterIndex) => {
        if (afterIndex < 0 || afterIndex >= waypoints.length - 1) return

        const prev = waypoints[afterIndex]
        const next = waypoints[afterIndex + 1]

        // Calculate midpoint
        const midLat = (prev.lat + next.lat) / 2
        const midLon = (prev.lon + next.lon) / 2

        const newWaypoint = {
            id: `waypoint-${Date.now()}`,
            type: 'waypoint',
            lat: midLat,
            lon: midLon,
            sequence: afterIndex + 0.5,
        }

        const newWaypoints = [...waypoints]
        newWaypoints.splice(afterIndex + 1, 0, newWaypoint)

        // Resequence
        newWaypoints.forEach((wp, index) => {
            wp.sequence = index
        })

        notifyWaypointChange(newWaypoints)
        toast.success("Waypoint added - drag it on the map to adjust")
    }

    const handleDeleteWaypoint = (index) => {
        const waypoint = waypoints[index]

        if (waypoint.type === 'stop') {
            setDeleteConfirm({ index, waypoint })
        } else {
            // Delete waypoint immediately
            const newWaypoints = waypoints.filter((_, i) => i !== index)
            newWaypoints.forEach((wp, i) => {
                wp.sequence = i
            })
            notifyWaypointChange(newWaypoints)
            toast.success("Waypoint deleted")
        }
    }

    const confirmDeleteStop = () => {
        if (deleteConfirm) {
            const newWaypoints = waypoints.filter((_, i) => i !== deleteConfirm.index)
            newWaypoints.forEach((wp, i) => {
                wp.sequence = i
            })
            notifyWaypointChange(newWaypoints)
            toast.success(`Stop "${deleteConfirm.waypoint.stop_name}" removed from shape`)
            setDeleteConfirm(null)
        }
    }

    const handleWaypointUpdate = (index, lat, lon) => {
        const newWaypoints = [...waypoints]
        newWaypoints[index] = {
            ...newWaypoints[index],
            lat: parseFloat(lat),
            lon: parseFloat(lon),
        }
        notifyWaypointChange(newWaypoints)
        setEditingCoordinates(null)
    }

    const handleStartEditCoordinates = (index) => {
        setEditingCoordinates({
            index,
            lat: waypoints[index].lat.toString(),
            lon: waypoints[index].lon.toString(),
        })
    }

    const handleCancelEditCoordinates = () => {
        setEditingCoordinates(null)
    }

    const handleSaveCoordinates = () => {
        if (editingCoordinates) {
            const lat = parseFloat(editingCoordinates.lat)
            const lon = parseFloat(editingCoordinates.lon)

            if (isNaN(lat) || isNaN(lon)) {
                toast.error("Invalid coordinates")
                return
            }

            if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
                toast.error("Coordinates out of valid range")
                return
            }

            handleWaypointUpdate(editingCoordinates.index, lat, lon)
        }
    }

    const handleSave = async () => {
        if (!currentProject) {
            toast.error("No project selected")
            return
        }

        if (waypoints.length < 2) {
            toast.error("Shape must have at least 2 waypoints")
            return
        }

        setIsSaving(true)

        try {
            const shapeData = {
                route_id: route.route_id,
                shape_id: shape?.shape_id || `shape-${route.route_id}-${Date.now()}`,
                waypoints: waypoints.map((wp, index) => ({
                    shape_pt_lat: wp.lat,
                    shape_pt_lon: wp.lon,
                    shape_pt_sequence: index,
                    shape_dist_traveled: wp.shape_dist_traveled || 0,
                })),
            }

            const response = await projectService.saveShape(currentProject.id, shapeData)

            if (response.success) {
                // Update the initial state reference after successful save
                initialWaypointsRef.current = JSON.stringify(waypoints)
                toast.success("Shape saved successfully")
                onSave?.(response.shape)
            } else {
                throw new Error(response.message || "Failed to save shape")
            }
        } catch (error) {
            console.error("[ShapeDetail] Save error:", error)
            toast.error(error.message || "Failed to save shape")
        } finally {
            setIsSaving(false)
        }
    }

    const handleMouseEnterGap = (index) => {
        setHoveredIndex(index)
        const prev = waypoints[index]
        const next = waypoints[index + 1]
        const midLat = (prev.lat + next.lat) / 2
        const midLon = (prev.lon + next.lon) / 2
        onWaypointHover?.({ lat: midLat, lon: midLon })
    }

    const handleMouseLeaveGap = () => {
        setHoveredIndex(null)
        onWaypointHover?.(null)
    }

    // Notify parent of waypoint changes - only on user modifications, not initial load
    const notifyWaypointChange = (newWaypoints) => {
        setWaypoints(newWaypoints)
        onWaypointDrag?.(newWaypoints)
    }

    return (
        <>
            {/* Custom layout without dismiss button - shape editor always stays open */}
            <div className="space-y-3 h-full flex flex-col">
                {/* Header - No close button */}
                <div className="space-y-1 flex-none border-b pb-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-[10px] uppercase tracking-wider font-semibold">
                            Shape Editor
                        </span>
                    </div>
                    <h2 className="text-lg font-bold truncate leading-tight">
                        {shape ? "Edit Shape" : "Create Shape"}
                    </h2>
                    <p className="text-[10px] text-muted-foreground">
                        Route: {route?.route_short_name || route?.route_long_name || 'Unknown'}
                    </p>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto px-1 min-h-0">
                    <div className="space-y-4">
                        {/* Route Info */}
                        <div className="p-3 bg-muted/50 rounded-lg">
                            <div className="text-xs text-muted-foreground">Route</div>
                            <div className="font-semibold">
                                {route?.route_short_name && (
                                    <Badge variant="outline" className="mr-2">
                                        {route.route_short_name}
                                    </Badge>
                                )}
                                {route?.route_long_name || 'Unknown Route'}
                            </div>
                        </div>

                        {/* Direction Selector - Only show if multiple directions available */}
                        {route?.available_directions && route.available_directions.length > 1 && (
                            <div>
                                <Label className="text-xs font-semibold mb-2 block">Direction</Label>
                                <div className="flex bg-muted rounded-md p-0.5">
                                    {route.available_directions.map((dirId) => (
                                        <button
                                            key={dirId}
                                            type="button"
                                            onClick={() => setSelectedDirection(dirId)}
                                            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${
                                                selectedDirection === dirId
                                                    ? "bg-background shadow-sm text-foreground"
                                                    : "text-muted-foreground hover:text-foreground"
                                            }`}
                                        >
                                            {dirId === 0 ? "Outbound" : dirId === 1 ? "Inbound" : `Direction ${dirId}`}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <Separator />

                        {/* Instructions */}
                        <div className="text-sm space-y-2">
                            <p className="text-muted-foreground">
                                Define the path vehicles travel along this route by:
                            </p>
                            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                                <li>Hover between waypoints to add intermediate points</li>
                                <li>Drag waypoints on the map to adjust the path</li>
                                <li>Delete waypoints that are not needed</li>
                                <li>Stops can be deleted from the shape (with confirmation)</li>
                            </ul>
                        </div>

                        <Separator />

                        {/* Waypoints List */}
                        <div>
                            <Label className="text-sm font-semibold mb-3 block">
                                Waypoints ({waypoints.length})
                            </Label>

                            <div className="space-y-1 max-h-[400px] overflow-y-auto">
                            {waypoints.map((waypoint, index) => (
                                <React.Fragment key={waypoint.id}>
                                    {/* Waypoint Item */}
                                    <div
                                        className={`flex items-center gap-2 p-2 rounded border ${
                                            waypoint.type === 'stop'
                                                ? 'bg-primary/5 border-primary/20'
                                                : 'bg-muted/30 border-border'
                                        }`}
                                    >
                                        <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            {waypoint.type === 'stop' ? (
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-3 h-3 text-primary shrink-0" />
                                                        <span className="text-sm font-medium truncate">
                                                            {waypoint.stop_name}
                                                        </span>
                                                    </div>
                                                    {editingCoordinates?.index === index ? (
                                                        <div className="flex items-center gap-1 ml-5 mt-1">
                                                            <Input
                                                                type="number"
                                                                step="0.000001"
                                                                value={editingCoordinates.lat}
                                                                onChange={(e) => setEditingCoordinates({
                                                                    ...editingCoordinates,
                                                                    lat: e.target.value
                                                                })}
                                                                placeholder="Latitude"
                                                                className="h-6 text-xs w-24"
                                                            />
                                                            <Input
                                                                type="number"
                                                                step="0.000001"
                                                                value={editingCoordinates.lon}
                                                                onChange={(e) => setEditingCoordinates({
                                                                    ...editingCoordinates,
                                                                    lon: e.target.value
                                                                })}
                                                                placeholder="Longitude"
                                                                className="h-6 text-xs w-24"
                                                            />
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 w-6 p-0"
                                                                onClick={handleSaveCoordinates}
                                                            >
                                                                <Check className="w-3 h-3 text-green-600" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 w-6 p-0"
                                                                onClick={handleCancelEditCoordinates}
                                                            >
                                                                <X className="w-3 h-3 text-destructive" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 ml-5">
                                                            <span className="text-xs text-muted-foreground">
                                                                {waypoint.lat.toFixed(6)}, {waypoint.lon.toFixed(6)}
                                                            </span>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-5 w-5 p-0"
                                                                onClick={() => handleStartEditCoordinates(index)}
                                                            >
                                                                <Edit2 className="w-2.5 h-2.5" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <Navigation className="w-3 h-3 text-muted-foreground shrink-0" />
                                                        <span className="text-sm text-muted-foreground">
                                                            Waypoint {index + 1}
                                                        </span>
                                                    </div>
                                                    {editingCoordinates?.index === index ? (
                                                        <div className="flex items-center gap-1 ml-5 mt-1">
                                                            <Input
                                                                type="number"
                                                                step="0.000001"
                                                                value={editingCoordinates.lat}
                                                                onChange={(e) => setEditingCoordinates({
                                                                    ...editingCoordinates,
                                                                    lat: e.target.value
                                                                })}
                                                                placeholder="Latitude"
                                                                className="h-6 text-xs w-24"
                                                            />
                                                            <Input
                                                                type="number"
                                                                step="0.000001"
                                                                value={editingCoordinates.lon}
                                                                onChange={(e) => setEditingCoordinates({
                                                                    ...editingCoordinates,
                                                                    lon: e.target.value
                                                                })}
                                                                placeholder="Longitude"
                                                                className="h-6 text-xs w-24"
                                                            />
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 w-6 p-0"
                                                                onClick={handleSaveCoordinates}
                                                            >
                                                                <Check className="w-3 h-3 text-green-600" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 w-6 p-0"
                                                                onClick={handleCancelEditCoordinates}
                                                            >
                                                                <X className="w-3 h-3 text-destructive" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 ml-5">
                                                            <span className="text-xs text-muted-foreground">
                                                                {waypoint.lat.toFixed(6)}, {waypoint.lon.toFixed(6)}
                                                            </span>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-5 w-5 p-0"
                                                                onClick={() => handleStartEditCoordinates(index)}
                                                            >
                                                                <Edit2 className="w-2.5 h-2.5" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="shrink-0"
                                            onClick={() => handleDeleteWaypoint(index)}
                                        >
                                            <Trash2 className="w-3 h-3 text-destructive" />
                                        </Button>
                                    </div>

                                    {/* Gap for adding waypoints */}
                                    {index < waypoints.length - 1 && (
                                        <div
                                            className={`relative h-6 flex items-center justify-center cursor-pointer group ${
                                                hoveredIndex === index ? 'bg-primary/10' : ''
                                            }`}
                                            onMouseEnter={() => handleMouseEnterGap(index)}
                                            onMouseLeave={handleMouseLeaveGap}
                                            onClick={() => handleAddWaypoint(index)}
                                        >
                                            <div className="h-px w-full bg-border absolute" />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={`h-6 px-2 bg-background border transition-all ${
                                                    hoveredIndex === index
                                                        ? 'opacity-100 scale-100'
                                                        : 'opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100'
                                                }`}
                                            >
                                                <Plus className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>
                </div>

                {/* Footer with Save and Close buttons */}
                <div className="pt-3 border-t mt-auto flex-none space-y-2">
                    <Button
                        onClick={handleSave}
                        className="w-full h-9 text-sm font-medium"
                        disabled={isSaving}
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? "Saving..." : "Save Shape"}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleCloseAttempt}
                        className="w-full h-9 text-sm font-medium"
                        disabled={isSaving}
                    >
                        Close
                    </Button>
                </div>
            </div>

            {/* Unsaved Changes Confirmation Dialog */}
            <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
                        <AlertDialogDescription>
                            You have unsaved changes to this shape. Are you sure you want to close without saving?
                            Your changes will be lost.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Continue Editing</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDiscardAndClose} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Discard Changes
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Stop Confirmation Dialog */}
            <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Stop from Shape?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove stop "{deleteConfirm?.waypoint?.stop_name}" from this shape?
                            This will not delete the stop itself, only remove it from the shape path.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteStop} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Remove Stop
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
