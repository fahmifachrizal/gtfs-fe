"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Trash2, GripVertical, Plus, Navigation, Edit2, Check, X, Save } from "lucide-react"
import { toast } from "sonner"
import { useUser } from "@/contexts/UserContext"
import { service } from "@/services"
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
    const [isLoading, setIsLoading] = useState(false)
    const [selectedDirection, setSelectedDirection] = useState(initialDirection)
    const [waypoints, setWaypoints] = useState([])
    const [stops, setStops] = useState([])
    const [selectedWaypointIndex, setSelectedWaypointIndex] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [hoveredIndex, setHoveredIndex] = useState(null)
    const [editingCoordinates, setEditingCoordinates] = useState(null)
    const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
    const initialWaypointsRef = useRef(null)

    // Fetch route path and stops from backend
    useEffect(() => {
        if (!currentProject || !route?.route_id) return

        const fetchRoutePathAndStops = async () => {
            setIsLoading(true)
            try {
                const response = await service.routes.getRoutePathAndStops(
                    currentProject.id,
                    route.route_id,
                    selectedDirection
                )

                if (response.success && response.data) {
                    const { polyline, stops: fetchedStops } = response.data

                    // Set stops (red markers)
                    const stopsData = fetchedStops.map((stop, index) => ({
                        id: `stop-${stop.stop_id}`,
                        type: 'stop',
                        stop_id: stop.stop_id,
                        stop_name: stop.stop_name,
                        lat: stop.stop_lat,
                        lon: stop.stop_lon,
                        sequence: stop.stop_sequence,
                        distance: stop.distance,
                    }))
                    setStops(stopsData)

                    // Set waypoints (blue markers - shape points)
                    const waypointsData = polyline.map((pt, index) => ({
                        id: `waypoint-${index}`,
                        type: 'waypoint',
                        lat: pt.latitude,
                        lon: pt.longitude,
                        sequence: pt.sequence,
                        distance: pt.distance,
                    }))
                    setWaypoints(waypointsData)

                    // Store initial state
                    if (initialWaypointsRef.current === null) {
                        initialWaypointsRef.current = JSON.stringify({
                            waypoints: waypointsData,
                            stops: stopsData
                        })
                    }

                    // Notify parent immediately on load
                    if (onWaypointDrag) {
                        onWaypointDrag({
                            waypoints: waypointsData,
                            stops: stopsData,
                            selectedWaypointIndex: null,
                            routeColor: route?.route_color || '3388ff'
                        })
                    }
                } else if (route?.directions) {
                    // Fallback: Initialize from route stops if no shape exists
                    const directionStops = route.directions[selectedDirection] || []
                    const stopsData = directionStops.map((stop, index) => ({
                        id: `stop-${stop.stop_id}-${index}`,
                        type: 'stop',
                        stop_id: stop.stop_id,
                        stop_name: stop.stop_name,
                        lat: stop.stop_lat,
                        lon: stop.stop_lon,
                        sequence: index,
                        distance: 0,
                    }))
                    setStops(stopsData)
                    setWaypoints(stopsData) // Use stops as waypoints for creating new shape

                    if (initialWaypointsRef.current === null) {
                        initialWaypointsRef.current = JSON.stringify({
                            waypoints: stopsData,
                            stops: stopsData
                        })
                    }

                    // Notify parent immediately on load
                    if (onWaypointDrag) {
                        onWaypointDrag({
                            waypoints: stopsData,
                            stops: stopsData,
                            selectedWaypointIndex: null,
                            routeColor: route?.route_color || '3388ff'
                        })
                    }
                }
            } catch (error) {
                console.error("[ShapeDetail] Failed to fetch path and stops:", error)
                toast.error("Failed to load shape data")
            } finally {
                setIsLoading(false)
            }
        }

        fetchRoutePathAndStops()
    }, [currentProject, route, selectedDirection])

    // Listen for waypoint drag updates from the map
    useEffect(() => {
        const handleWaypointDragUpdate = (event) => {
            const { lat, lon, waypointIndex } = event.detail
            if (waypointIndex !== undefined && waypointIndex === selectedWaypointIndex) {
                setWaypoints(prev => {
                    const newWaypoints = [...prev]
                    if (newWaypoints[waypointIndex]) {
                        newWaypoints[waypointIndex] = {
                            ...newWaypoints[waypointIndex],
                            lat: parseFloat(lat),
                            lon: parseFloat(lon),
                        }
                    }
                    return newWaypoints
                })
            }
        }

        window.addEventListener('waypoint-drag-update', handleWaypointDragUpdate)
        return () => window.removeEventListener('waypoint-drag-update', handleWaypointDragUpdate)
    }, [selectedWaypointIndex])

    // Check if there are unsaved changes
    const hasUnsavedChanges = () => {
        if (initialWaypointsRef.current === null) return false
        const currentState = JSON.stringify({ waypoints, stops })
        return currentState !== initialWaypointsRef.current
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

    // Handle direction button click - notify parent explicitly
    const handleDirectionClick = (dirId) => {
        if (dirId !== selectedDirection) {
            setSelectedDirection(dirId)
            onDirectionChange?.(dirId)
        }
    }

    const handleAddWaypoint = (afterIndex) => {
        if (afterIndex < 0 || afterIndex >= waypoints.length - 1) return

        const prev = waypoints[afterIndex]
        const next = waypoints[afterIndex + 1]

        // Calculate midpoint - halfway between prev and next
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

        // Set the new waypoint as selected (active) so it's highlighted and draggable
        setSelectedWaypointIndex(afterIndex + 1)
        notifyWaypointChange(newWaypoints, afterIndex + 1)
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
            // Clear selection if deleting selected waypoint
            if (selectedWaypointIndex === index) {
                setSelectedWaypointIndex(null)
            } else if (selectedWaypointIndex > index) {
                setSelectedWaypointIndex(selectedWaypointIndex - 1)
            }
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
            // Clear selection if deleting selected waypoint
            if (selectedWaypointIndex === deleteConfirm.index) {
                setSelectedWaypointIndex(null)
            } else if (selectedWaypointIndex > deleteConfirm.index) {
                setSelectedWaypointIndex(selectedWaypointIndex - 1)
            }
            notifyWaypointChange(newWaypoints)
            toast.success(`Stop "${deleteConfirm.waypoint.stop_name}" removed from shape`)
            setDeleteConfirm(null)
        }
    }

    // Handle waypoint click to select it
    const handleWaypointClick = (index) => {
        const waypoint = waypoints[index]
        // Only allow selecting waypoints (not stops)
        if (waypoint.type === 'waypoint') {
            setSelectedWaypointIndex(selectedWaypointIndex === index ? null : index)
            // Notify change to update map display
            notifyWaypointChange(waypoints, selectedWaypointIndex === index ? null : index)
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
                shape_id: shape?.shape_id || `shape-${route.route_id}-${selectedDirection}-${Date.now()}`,
                points: waypoints.map((wp, index) => ({
                    shape_pt_lat: wp.lat,
                    shape_pt_lon: wp.lon,
                    shape_pt_sequence: index,
                    shape_dist_traveled: wp.shape_dist_traveled || 0,
                })),
            }

            const response = await service.shapes.saveShape(currentProject.id, shapeData)

            if (response.success) {
                // Update the initial state reference after successful save
                initialWaypointsRef.current = JSON.stringify({ waypoints, stops })
                toast.success("Shape saved successfully")
                onSave?.(response.data)
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

    const handleMouseEnterCard = (index) => {
        // Show preview for gap after this card
        if (index < waypoints.length - 1) {
            setHoveredIndex(index)
            const prev = waypoints[index]
            const next = waypoints[index + 1]
            const midLat = (prev.lat + next.lat) / 2
            const midLon = (prev.lon + next.lon) / 2
            onWaypointHover?.({ lat: midLat, lon: midLon })
        }
    }

    const handleMouseLeaveCard = () => {
        setHoveredIndex(null)
        onWaypointHover?.(null)
    }

    // Notify parent of waypoint changes - includes stops and selected waypoint index
    const notifyWaypointChange = (newWaypoints, selectedIndex = selectedWaypointIndex) => {
        setWaypoints(newWaypoints)

        // Combine waypoints and stops for map display, with selected waypoint info
        const mapData = {
            waypoints: newWaypoints,
            stops: stops,
            selectedWaypointIndex: selectedIndex,
            routeColor: route?.route_color || '3388ff'
        }

        onWaypointDrag?.(mapData)
    }

    // Combine waypoints and stops into a single sorted list for display
    const combinedList = useMemo(() => {
        const combined = [...waypoints, ...stops]
        // Sort by distance if available, otherwise maintain order
        return combined.sort((a, b) => {
            if (a.distance !== undefined && b.distance !== undefined) {
                return a.distance - b.distance
            }
            return a.sequence - b.sequence
        })
    }, [waypoints, stops])

    return (
        <>
            <div className="space-y-3 h-full flex flex-col">
                {/* Content */}
                <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="space-y-3">
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
                                <Tabs value={String(selectedDirection)} onValueChange={(v) => handleDirectionClick(Number(v))}>
                                    <TabsList className="w-full">
                                        {route.available_directions.map((dirId) => (
                                            <TabsTrigger key={dirId} value={String(dirId)} className="flex-1">
                                                {dirId === 0 ? "Outbound" : dirId === 1 ? "Inbound" : `Direction ${dirId}`}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                </Tabs>
                            </div>
                        )}

                        <Separator />

                        {/* Waypoints and Stops List */}
                        <div className="flex-1 min-h-0 flex flex-col">
                            <Label className="text-sm font-semibold mb-3 block">
                                Waypoints ({waypoints.length}) & Stops ({stops.length})
                            </Label>

                            <div className="space-y-1 flex-1 overflow-y-auto">
                            {combinedList.map((waypoint) => {
                                // Find actual index in waypoints array for operations
                                const waypointIndex = waypoints.findIndex(w => w.id === waypoint.id)
                                const index = waypointIndex >= 0 ? waypointIndex : -1
                                return (
                                <React.Fragment key={waypoint.id}>
                                    {/* Waypoint Item */}
                                    <div
                                        className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                                            waypoint.type === 'stop'
                                                ? 'bg-muted/30 border-border'
                                                : selectedWaypointIndex === index
                                                    ? 'bg-accent border-accent-foreground/20 border-2 shadow-sm cursor-pointer'
                                                    : 'bg-card border-border cursor-pointer hover:bg-accent/50 hover:border-accent-foreground/20'
                                        }`}
                                        onClick={() => waypoint.type === 'waypoint' && handleWaypointClick(index)}
                                        onMouseEnter={() => handleMouseEnterCard(index)}
                                        onMouseLeave={handleMouseLeaveCard}
                                    >
                                        <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            {waypoint.type === 'stop' ? (
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                                                        <MapPin className="w-3 h-3 text-red-600 shrink-0" />
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
                                                        <div className={`w-3 h-3 rounded-full shrink-0 ${
                                                            selectedWaypointIndex === index
                                                                ? 'bg-orange-500'
                                                                : 'bg-blue-500'
                                                        }`} />
                                                        <Navigation className={`w-3 h-3 shrink-0 ${
                                                            selectedWaypointIndex === index
                                                                ? 'text-orange-600'
                                                                : 'text-blue-600'
                                                        }`} />
                                                        <span className={`text-sm ${
                                                            selectedWaypointIndex === index
                                                                ? 'font-semibold text-foreground'
                                                                : 'text-muted-foreground'
                                                        }`}>
                                                            Waypoint {index + 1}
                                                            {selectedWaypointIndex === index && ' (Selected)'}
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

                                    {/* Gap for adding waypoints - only visible on card hover */}
                                    {index < waypoints.length - 1 && hoveredIndex === index && (
                                        <div
                                            className="relative h-8 flex items-center justify-center cursor-pointer bg-primary/10 animate-in fade-in duration-200"
                                            onClick={() => handleAddWaypoint(index)}
                                        >
                                            <div className="h-px w-full bg-border absolute" />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 px-2 bg-background border shadow-sm"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    )}
                                </React.Fragment>
                                )
                            })}
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
