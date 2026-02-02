"use client"

import React, { useEffect, useState, useCallback, useMemo } from "react"
import { Shapes, AlertCircle, Route as RouteIcon } from "lucide-react"
import { useUser } from "@/contexts/UserContext"
import { useEditorContext } from "@/contexts/EditorContext"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { ShapeDetail } from "@/components/details/ShapeDetail"
import { projectService } from "@/services/projectService"

export default function ShapesPage() {
    const { currentProject, isAuthenticated } = useUser()
    const {
        gtfsData,
        handleFetchData,
        setDetailView,
        updateMapData,
        clearMap,
        setCenter,
        setMapBounds,
        setOnMarkerDragEnd,
    } = useEditorContext()

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedRoute, setSelectedRoute] = useState(null)
    const [selectedDirection, setSelectedDirection] = useState(0)
    const [shapeWaypoints, setShapeWaypoints] = useState([])
    const [previewWaypoint, setPreviewWaypoint] = useState(null)

    // Fetch routes
    useEffect(() => {
        if (currentProject && isAuthenticated && !hasAttemptedLoad) {
            fetchRoutes()
        }
    }, [currentProject, isAuthenticated, hasAttemptedLoad])

    // Cleanup when unmounting (navigating away from shapes page)
    useEffect(() => {
        return () => {
            clearMap()
        }
    }, [clearMap])

    // Handle waypoint drag
    const handleWaypointDragEnd = useCallback((dragData) => {
        const { lat, lon, waypointIndex } = dragData
        if (waypointIndex !== undefined) {
            setShapeWaypoints(prev => {
                const newWaypoints = [...prev]
                if (newWaypoints[waypointIndex]) {
                    newWaypoints[waypointIndex] = {
                        ...newWaypoints[waypointIndex],
                        lat,
                        lon,
                    }
                }
                return newWaypoints
            })
        }
    }, [])

    // Set marker drag handler when component mounts
    useEffect(() => {
        setOnMarkerDragEnd(handleWaypointDragEnd)
        return () => setOnMarkerDragEnd(null)
    }, [handleWaypointDragEnd, setOnMarkerDragEnd])

    // Memoize GeoJSON features to avoid recreating on every render
    const mapFeatures = useMemo(() => {
        if (shapeWaypoints.length === 0) return null

        const features = []

        // Add waypoints as points
        shapeWaypoints.forEach((wp, index) => {
            features.push({
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [wp.lon, wp.lat],
                },
                properties: {
                    id: wp.id,
                    type: wp.type,
                    stop_name: wp.stop_name || `Waypoint ${index + 1}`,
                    stop_id: wp.stop_id || `wp-${index}`,
                    sequence: wp.sequence,
                    isWaypoint: wp.type === 'waypoint',
                    isStop: wp.type === 'stop',
                    isDraggable: true,
                    waypointIndex: index,
                },
            })
        })

        // Add line connecting waypoints
        if (shapeWaypoints.length >= 2) {
            features.push({
                type: "Feature",
                geometry: {
                    type: "LineString",
                    coordinates: shapeWaypoints.map(wp => [wp.lon, wp.lat]),
                },
                properties: {
                    type: "shape-path",
                    route_color: selectedRoute?.route_color || "3388ff",
                },
            })
        }

        // Add preview waypoint if hovering
        if (previewWaypoint) {
            features.push({
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [previewWaypoint.lon, previewWaypoint.lat],
                },
                properties: {
                    type: "preview-waypoint",
                    isPreview: true,
                },
            })
        }

        return {
            type: "FeatureCollection",
            features,
        }
    }, [shapeWaypoints, previewWaypoint, selectedRoute])

    // Memoize bounds calculation
    const mapBoundsData = useMemo(() => {
        if (shapeWaypoints.length === 0) return null
        if (shapeWaypoints.length === 1) {
            return { type: 'center', coords: [shapeWaypoints[0].lat, shapeWaypoints[0].lon] }
        }

        let minLat = Infinity, maxLat = -Infinity
        let minLon = Infinity, maxLon = -Infinity

        shapeWaypoints.forEach(wp => {
            if (wp.lat && wp.lon) {
                minLat = Math.min(minLat, wp.lat)
                maxLat = Math.max(maxLat, wp.lat)
                minLon = Math.min(minLon, wp.lon)
                maxLon = Math.max(maxLon, wp.lon)
            }
        })

        if (minLat !== Infinity) {
            return { type: 'bounds', coords: [[minLat, minLon], [maxLat, maxLon]] }
        }
        return null
    }, [shapeWaypoints])

    // Simple useEffect to update map with memoized data
    useEffect(() => {
        if (mapFeatures) {
            updateMapData(mapFeatures)

            if (mapBoundsData) {
                if (mapBoundsData.type === 'center') {
                    setCenter(mapBoundsData.coords)
                    setMapBounds(null)
                } else if (mapBoundsData.type === 'bounds') {
                    setMapBounds(mapBoundsData.coords)
                }
            }
        } else {
            clearMap()
            setMapBounds(null)
        }
    }, [mapFeatures, mapBoundsData, updateMapData, clearMap, setCenter, setMapBounds])

    const fetchRoutes = async () => {
        setIsLoading(true)
        setError(null)

        try {
            const result = await handleFetchData("routes")

            if (result.error) {
                throw new Error(result.error)
            }
        } catch (error) {
            console.error("[ShapesPage] Failed to fetch routes:", error)
            setError(error.message || "Failed to load routes")
        } finally {
            setIsLoading(false)
            setHasAttemptedLoad(true)
        }
    }

    const fetchShapeForRoute = useCallback(async (routeId, directionId = 0) => {
        if (!currentProject?.id) {
            console.warn("[ShapesPage] No current project available")
            return null
        }

        try {
            // Use the new backend endpoint that handles everything
            const response = await projectService.getRoutePathAndStops(
                currentProject.id,
                routeId,
                directionId
            )

            if (!response.success || !response.data) {
                console.log("[ShapesPage] No shape data found for route:", routeId, "direction:", directionId)
                return null
            }

            const { shape_id, polyline, stops } = response.data

            console.log("[ShapesPage] Loaded shape:", shape_id, "Points:", polyline.length, "Stops:", stops.length)

            // Convert polyline points to waypoints
            const waypoints = polyline.map((point, index) => ({
                id: `shape-${shape_id}-${point.sequence}`,
                type: 'waypoint',
                lat: point.latitude,
                lon: point.longitude,
                sequence: index,
                shape_dist_traveled: point.distance || 0,
            }))

            return {
                shape_id,
                waypoints,
                stops // Include stops data for future use
            }

        } catch (error) {
            console.error("[ShapesPage] Error fetching shape:", error)
            return null
        }
    }, [currentProject])

    const handleSaveShape = useCallback((savedShape) => {
        toast.success("Shape saved successfully")
        setDetailView(null)
        setSelectedRoute(null)
        setShapeWaypoints([])
        clearMap()
    }, [setDetailView, clearMap])

    const renderShapeDetail = useCallback((route, routeData, shape, direction) => {
        return (
            <ShapeDetail
                route={{
                    ...route,
                    directions: routeData.directions,
                    available_directions: routeData.available_directions,
                }}
                shape={shape}
                initialDirection={direction}
                onSave={handleSaveShape}
                onClose={() => {
                    setDetailView(null)
                    setSelectedRoute(null)
                    setSelectedDirection(0)
                    setShapeWaypoints([])
                    setPreviewWaypoint(null)
                    clearMap()
                }}
                onDirectionChange={async (newDirection) => {
                    setSelectedDirection(newDirection)
                    // Refetch shape for new direction
                    const newShape = await fetchShapeForRoute(route.route_id, newDirection)
                    // Re-render detail view with new shape
                    setDetailView(renderShapeDetail(route, routeData, newShape, newDirection))
                }}
                onWaypointHover={(waypoint) => {
                    setPreviewWaypoint(waypoint)
                }}
                onWaypointDrag={(waypoints) => {
                    setShapeWaypoints(waypoints)
                }}
            />
        )
    }, [clearMap, setDetailView, setPreviewWaypoint, setShapeWaypoints, handleSaveShape, fetchShapeForRoute])

    const handleRouteSelect = async (route) => {
        setSelectedRoute(route)
        setIsLoading(true)

        try {
            // Fetch route details with stops
            const response = await projectService.getRouteDetails(currentProject.id, route.route_id)
            console.log("[ShapesPage] Route details response:", response)

            if (response.success && response.data) {
                // Route data is directly in response.data, not response.data.route
                const routeData = response.data.route || response.data

                // Check if route has any stops assigned
                const hasDirections = routeData.directions && Object.keys(routeData.directions).length > 0
                const availableDirections = routeData.available_directions ||
                    (hasDirections ? Object.keys(routeData.directions).map(Number) : [])

                if (!hasDirections || availableDirections.length === 0) {
                    toast.error("This route has no stops assigned. Please assign stops to the route first in the Routes page.")
                    setSelectedRoute(null)
                    setIsLoading(false)
                    return
                }

                // Remove duplicate stops from directions (keep only first occurrence)
                if (routeData.directions) {
                    Object.keys(routeData.directions).forEach(directionKey => {
                        const stops = routeData.directions[directionKey]
                        const seenStopIds = new Set()
                        const uniqueStops = []

                        stops.forEach(stop => {
                            if (!seenStopIds.has(stop.stop_id)) {
                                uniqueStops.push(stop)
                                seenStopIds.add(stop.stop_id)
                            }
                        })

                        routeData.directions[directionKey] = uniqueStops
                    })
                }

                // Add available_directions to routeData
                routeData.available_directions = availableDirections

                // Fetch existing shape for this route and direction
                const existingShape = await fetchShapeForRoute(route.route_id, selectedDirection)

                setDetailView(renderShapeDetail(route, routeData, existingShape, selectedDirection))
            } else {
                console.error("[ShapesPage] Invalid response structure:", response)
                throw new Error(response.message || "Failed to fetch route details")
            }
        } catch (error) {
            console.error("[ShapesPage] Failed to load route details:", error)
            toast.error(error.message || "Failed to load route details")
            setSelectedRoute(null)
        } finally {
            setIsLoading(false)
        }
    }

    if (!currentProject) {
        return <div className="p-8 text-center text-muted-foreground">Please select a project to continue.</div>
    }

    const routes = gtfsData.routes || []
    const filteredRoutes = routes.filter((route) => {
        if (!searchTerm) return true
        const term = searchTerm.toLowerCase()
        return (
            route.route_short_name?.toLowerCase().includes(term) ||
            route.route_long_name?.toLowerCase().includes(term) ||
            route.route_id?.toLowerCase().includes(term)
        )
    })

    return (
        <div className="p-4">
            <div className="mb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Shapes className="w-5 h-5" />
                        <h2 className="text-2xl font-bold">Shapes</h2>
                        {isLoading && <span className="text-sm text-muted-foreground animate-pulse ml-2">Loading...</span>}
                    </div>
                </div>
                <p className="text-muted-foreground mt-2">
                    Define the path vehicles travel between stops. Select a route to create or edit its shape.
                </p>
            </div>

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Search */}
            <div className="mb-4">
                <Input
                    placeholder="Search routes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-md"
                />
            </div>

            {/* Routes List */}
            {isLoading && !routes.length ? (
                <div className="text-center py-8 text-muted-foreground">Loading routes...</div>
            ) : filteredRoutes.length > 0 ? (
                <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {filteredRoutes.map((route) => (
                        <Card
                            key={route.route_id}
                            className="cursor-pointer hover:bg-accent/50 transition-colors"
                            onClick={() => handleRouteSelect(route)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            {route.route_short_name && (
                                                <Badge
                                                    variant="outline"
                                                    style={{
                                                        backgroundColor: route.route_color ? `#${route.route_color}` : undefined,
                                                        color: route.route_text_color ? `#${route.route_text_color}` : undefined,
                                                        borderColor: route.route_color ? `#${route.route_color}` : undefined,
                                                    }}
                                                >
                                                    {route.route_short_name}
                                                </Badge>
                                            )}
                                        </div>
                                        <h3 className="font-semibold text-sm truncate">
                                            {route.route_long_name || route.route_id}
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {route.route_type !== undefined && (
                                                <span>
                                                    {['Tram', 'Subway', 'Rail', 'Bus', 'Ferry', 'Cable car', 'Gondola', 'Funicular'][route.route_type] || 'Unknown'}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <RouteIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : searchTerm ? (
                <div className="text-center py-12">
                    <RouteIcon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No routes match your search.</p>
                </div>
            ) : (
                <div className="text-center py-12">
                    <RouteIcon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground mb-4">No routes found.</p>
                    <p className="text-sm text-muted-foreground">
                        Create routes first in the Routes page before defining shapes.
                    </p>
                </div>
            )}
        </div>
    )
}
