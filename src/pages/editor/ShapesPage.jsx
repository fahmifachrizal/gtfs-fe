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
import { service } from "@/services"

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
    const [isSearching, setIsSearching] = useState(false)
    const [searchResults, setSearchResults] = useState(null)
    const [selectedRoute, setSelectedRoute] = useState(null)
    const [selectedDirection, setSelectedDirection] = useState(0)
    const [shapeWaypoints, setShapeWaypoints] = useState([])
    const [shapeStops, setShapeStops] = useState([])
    const [selectedWaypointIndex, setSelectedWaypointIndex] = useState(null)
    const [routeColor, setRouteColor] = useState('3388ff')
    const [previewWaypoint, setPreviewWaypoint] = useState(null)
    const [isDragging, setIsDragging] = useState(false)
    const [isLoadingRoute, setIsLoadingRoute] = useState(false)

    // Fetch routes
    useEffect(() => {
        if (currentProject && isAuthenticated && !hasAttemptedLoad) {
            fetchRoutes()
        }
    }, [currentProject, isAuthenticated, hasAttemptedLoad])

    // Debounced backend search
    useEffect(() => {
        if (!currentProject) return

        // If no search term, clear search results
        if (!searchTerm.trim()) {
            setSearchResults(null)
            setIsSearching(false)
            return
        }

        // Set searching state immediately
        setIsSearching(true)

        // Debounce the search
        const timeoutId = setTimeout(async () => {
            try {
                const response = await service.routes.getRoutes(currentProject.id, {
                    search: searchTerm.trim()
                })

                if (response.success && response.data) {
                    setSearchResults(response.data)
                } else {
                    setSearchResults([])
                }
            } catch (error) {
                console.error("[ShapesPage] Search failed:", error)
                setSearchResults([])
            } finally {
                setIsSearching(false)
            }
        }, 500) // 500ms debounce

        return () => clearTimeout(timeoutId)
    }, [searchTerm, currentProject])

    // Cleanup when unmounting (navigating away from shapes page)
    useEffect(() => {
        return () => {
            clearMap()
            setMapBounds(null)
            setDetailView(null)
        }
    }, [clearMap, setMapBounds, setDetailView])

    // Handle waypoint drag start - prevent bounds recalculation
    const handleWaypointDragStart = useCallback(() => {
        setIsDragging(true)
    }, [])

    // Handle waypoint drag - only allow dragging selected waypoints
    const handleWaypointDragEnd = useCallback((dragData) => {
        const { lat, lon, waypointIndex } = dragData
        if (waypointIndex !== undefined && waypointIndex === selectedWaypointIndex) {
            // Dispatch event for ShapeDetail to update coordinates in real-time
            const updateEvent = new CustomEvent('waypoint-drag-update', {
                detail: { lat, lon, waypointIndex }
            })
            window.dispatchEvent(updateEvent)

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
        // End dragging state after a small delay to prevent bounds update
        setTimeout(() => setIsDragging(false), 100)
    }, [selectedWaypointIndex])

    // Set marker drag handler when component mounts
    useEffect(() => {
        setOnMarkerDragEnd(handleWaypointDragEnd)
        return () => setOnMarkerDragEnd(null)
    }, [handleWaypointDragEnd, setOnMarkerDragEnd])

    // Memoize GeoJSON features to avoid recreating on every render
    const mapFeatures = useMemo(() => {
        if (shapeWaypoints.length === 0) return null

        const features = []

        // Add stops as RED markers (circular)
        shapeStops.forEach((stop, index) => {
            features.push({
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [stop.lon, stop.lat],
                },
                properties: {
                    id: stop.id,
                    type: 'stop',
                    stop_name: stop.stop_name,
                    stop_id: stop.stop_id,
                    sequence: stop.sequence,
                    isStop: true,
                    isDraggable: false, // Stops are not draggable
                    markerColor: 'red',
                    markerShape: 'circle',
                },
            })
        })

        // Add waypoints as BLUE/ROUTE COLOR markers (circular)
        shapeWaypoints.forEach((wp, index) => {
            const isSelected = index === selectedWaypointIndex
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
                    isDraggable: isSelected, // Only selected waypoint is draggable
                    waypointIndex: index,
                    markerColor: isSelected ? 'orange' : routeColor, // Selected = orange, others = route color
                    markerShape: 'circle',
                    isSelected: isSelected,
                },
            })
        })

        // Add polyline connecting all waypoints
        if (shapeWaypoints.length >= 2) {
            features.push({
                type: "Feature",
                geometry: {
                    type: "LineString",
                    coordinates: shapeWaypoints.map(wp => [wp.lon, wp.lat]),
                },
                properties: {
                    type: "shape-path",
                    route_color: routeColor,
                },
            })
        }

        // Add preview waypoint if hovering (semi-transparent)
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
                    markerColor: routeColor,
                    opacity: 0.5,
                },
            })
        }

        return {
            type: "FeatureCollection",
            features,
        }
    }, [shapeWaypoints, shapeStops, selectedWaypointIndex, routeColor, previewWaypoint])

    // Memoize bounds calculation - include both waypoints and stops
    const mapBoundsData = useMemo(() => {
        const allPoints = [...shapeWaypoints, ...shapeStops]
        if (allPoints.length === 0) return null
        if (allPoints.length === 1) {
            return { type: 'center', coords: [allPoints[0].lat, allPoints[0].lon] }
        }

        let minLat = Infinity, maxLat = -Infinity
        let minLon = Infinity, maxLon = -Infinity

        allPoints.forEach(pt => {
            if (pt.lat && pt.lon) {
                minLat = Math.min(minLat, pt.lat)
                maxLat = Math.max(maxLat, pt.lat)
                minLon = Math.min(minLon, pt.lon)
                maxLon = Math.max(maxLon, pt.lon)
            }
        })

        if (minLat !== Infinity) {
            return { type: 'bounds', coords: [[minLat, minLon], [maxLat, maxLon]] }
        }
        return null
    }, [shapeWaypoints, shapeStops])

    // Simple useEffect to update map with memoized data
    // Delay polyline drawing until after zoom animation completes
    useEffect(() => {
        // Don't update map while loading route data
        if (isLoadingRoute) return

        if (mapFeatures) {
            // Only update bounds if not currently dragging
            if (!isDragging && mapBoundsData) {
                if (mapBoundsData.type === 'center') {
                    setCenter(mapBoundsData.coords)
                    setMapBounds(null)
                    // Draw immediately if just centering
                    updateMapData(mapFeatures)
                } else if (mapBoundsData.type === 'bounds') {
                    setMapBounds(mapBoundsData.coords)
                    // Delay drawing polyline until zoom animation completes (600ms to be safe)
                    const timer = setTimeout(() => {
                        updateMapData(mapFeatures)
                    }, 600)
                    return () => clearTimeout(timer)
                }
            } else if (isDragging) {
                // Update immediately when dragging
                updateMapData(mapFeatures)
            }
        } else {
            clearMap()
            setMapBounds(null)
        }
    }, [mapFeatures, mapBoundsData, updateMapData, clearMap, setCenter, setMapBounds, isDragging, isLoadingRoute])

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
            const response = await service.routes.getRoutePathAndStops(
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
        const title = `Shape Editor - ${route.route_short_name || route.route_long_name || route.route_id}`

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
                    // Clear map first for smooth zoom out
                    clearMap()
                    setShapeWaypoints([])
                    setShapeStops([])
                    setPreviewWaypoint(null)
                    setSelectedWaypointIndex(null)
                    setMapBounds(null)

                    // Then close detail panel
                    setTimeout(() => {
                        setDetailView(null, 'Details')
                        setSelectedRoute(null)
                        setSelectedDirection(0)
                    }, 100)
                }}
                onDirectionChange={async (newDirection) => {
                    setSelectedDirection(newDirection)
                    // Refetch shape for new direction
                    const newShape = await fetchShapeForRoute(route.route_id, newDirection)
                    // Update shapeWaypoints with new data
                    if (newShape?.waypoints) {
                        setShapeWaypoints(newShape.waypoints)
                    } else {
                        setShapeWaypoints([])
                    }
                    // Re-render detail view with new shape
                    const content = renderShapeDetail(route, routeData, newShape, newDirection)
                    setDetailView(content, title)
                }}
                onWaypointHover={(waypoint) => {
                    setPreviewWaypoint(waypoint)
                }}
                onWaypointDrag={(mapData) => {
                    // mapData contains: { waypoints, stops, selectedWaypointIndex, routeColor }
                    if (mapData.waypoints) {
                        setShapeWaypoints(mapData.waypoints)
                    }
                    if (mapData.stops) {
                        setShapeStops(mapData.stops)
                    }
                    if (mapData.selectedWaypointIndex !== undefined) {
                        setSelectedWaypointIndex(mapData.selectedWaypointIndex)
                    }
                    if (mapData.routeColor) {
                        setRouteColor(mapData.routeColor)
                    }
                }}
            />
        )
    }, [clearMap, setDetailView, setPreviewWaypoint, setShapeWaypoints, handleSaveShape, fetchShapeForRoute])

    const handleRouteSelect = async (route) => {
        // Don't allow deselecting - if clicking on already selected route, do nothing
        if (selectedRoute?.route_id === route.route_id) {
            return
        }

        setSelectedRoute(route)
        setIsLoading(true)
        setIsLoadingRoute(true)

        try {
            // Fetch route details with stops
            const response = await service.routes.getRouteDetails(currentProject.id, route.route_id)
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

                // Initialize shapeWaypoints and stops from loaded shape data
                if (existingShape?.waypoints) {
                    setShapeWaypoints(existingShape.waypoints)
                } else {
                    setShapeWaypoints([])
                }

                if (existingShape?.stops) {
                    setShapeStops(existingShape.stops.map(stop => ({
                        ...stop,
                        lat: stop.stop_lat,
                        lon: stop.stop_lon
                    })))
                } else {
                    setShapeStops([])
                }

                const title = `Shape Editor - ${route.route_short_name || route.route_long_name || route.route_id}`
                const content = renderShapeDetail(route, routeData, existingShape, selectedDirection)
                setDetailView(content, title)
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
            setIsLoadingRoute(false)
        }
    }

    if (!currentProject) {
        return <div className="p-8 text-center text-muted-foreground">Please select a project to continue.</div>
    }

    // Use search results if searching, otherwise use all routes from gtfsData
    const routes = searchResults !== null ? searchResults : (gtfsData.routes || [])
    const displayedRoutes = routes

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
                <div className="relative max-w-md">
                    <Input
                        placeholder="Search routes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {isSearching && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                        </div>
                    )}
                </div>
            </div>

            {/* Routes List */}
            {isLoading && !routes.length ? (
                <div className="text-center py-8 text-muted-foreground">Loading routes...</div>
            ) : displayedRoutes.length > 0 ? (
                <div className="space-y-2">
                    {displayedRoutes.map((route) => {
                        const isSelected = selectedRoute?.route_id === route.route_id
                        return (
                            <Card
                                key={route.route_id}
                                className={`cursor-pointer transition-all ${
                                    isSelected
                                        ? 'bg-accent border-accent-foreground/20 border-2 shadow-md'
                                        : 'hover:bg-accent/50 hover:border-accent-foreground/10'
                                }`}
                                onClick={() => handleRouteSelect(route)}
                            >
                                <CardContent className="p-3">
                                    <div className="flex items-center gap-3">
                                        <RouteIcon className={`w-5 h-5 shrink-0 ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`} />
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            {route.route_short_name && (
                                                <Badge
                                                    variant="outline"
                                                    className="shrink-0"
                                                    style={{
                                                        backgroundColor: route.route_color ? `#${route.route_color}` : undefined,
                                                        color: route.route_text_color ? `#${route.route_text_color}` : undefined,
                                                        borderColor: route.route_color ? `#${route.route_color}` : undefined,
                                                    }}
                                                >
                                                    {route.route_short_name}
                                                </Badge>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h3 className={`font-semibold text-sm truncate ${isSelected ? 'text-foreground' : ''}`}>
                                                    {route.route_long_name || route.route_id}
                                                </h3>
                                            </div>
                                            {route.route_type !== undefined && (
                                                <span className="text-xs text-muted-foreground shrink-0">
                                                    {['Tram', 'Subway', 'Rail', 'Bus', 'Ferry', 'Cable car', 'Gondola', 'Funicular'][route.route_type] || 'Unknown'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
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
