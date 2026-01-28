// app/editor/routes/page.js - With map integration and stop reset
"use client"
import React, { useEffect, useState, useCallback, useRef } from "react"
import { Route, Plus, Search, ChevronLeft, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import RouteItem from "@/components/route-item"
import { useEditorContext } from "@/contexts/EditorContext"

export default function RoutesPage() {
  const {
    gtfsData,
    handleFetchData,
    handleHoverCoordinate,
    handleSelectData,
    getMeta,
    updateMeta,
    setCenter,
    updateMapData,
    clearMap
  } = useEditorContext()

  // Update the existing cleanup useEffect
  useEffect(() => {
    return () => {
      clearMap() // Clear map when leaving routes page
    }
  }, [clearMap])

  const [expandedRoutes, setExpandedRoutes] = useState(new Set())
  const [routeDetails, setRouteDetails] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingDetails, setIsLoadingDetails] = useState(new Set())
  const [localSearch, setLocalSearch] = useState("")
  const [selectedRouteForMap, setSelectedRouteForMap] = useState(null)

  // Debounce timer ref
  const debounceTimer = useRef(null)

  // Get current meta information for routes
  const routesMeta = getMeta("routes")
  const {
    page,
    totalPages,
    totalItems,
    search: searchValue,
    pageSize,
  } = routesMeta

  // Debounced search function
  const debouncedSearch = useCallback((searchTerm) => {
    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // Set new timer
    debounceTimer.current = setTimeout(() => {
      fetchRoutes(1, searchTerm, true)
    }, 500) // 500ms debounce delay like stops page
  }, [])

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [])

  const fetchRoutes = async (pageNum = 1, search = "", resetPage = false) => {
    if (isLoading) return

    setIsLoading(true)

    try {
      updateMeta("routes", {
        page: resetPage ? 1 : pageNum,
        search: search,
      })

      await handleFetchData("routes", {
        page: resetPage ? 1 : pageNum,
        search,
      })
    } catch (error) {
      updateMeta("routes", {
        totalPages: 1,
        totalItems: 0,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch route details with all directions
  const fetchRouteDetails = async (routeId) => {
    if (routeDetails[routeId] || isLoadingDetails.has(routeId)) return

    setIsLoadingDetails((prev) => new Set([...prev, routeId]))

    try {
      const response = await fetch(`/api/gtfs/routes/${routeId}`)
      const data = await response.json()

      if (data.success && data.data.route) {
        const route = data.data.route
        setRouteDetails((prev) => ({
          ...prev,
          [routeId]: route,
        }))
      }
    } catch (error) {
      setRouteDetails((prev) => ({
        ...prev,
        [routeId]: { directions: {}, available_directions: [] },
      }))
    } finally {
      setIsLoadingDetails((prev) => {
        const newSet = new Set(prev)
        newSet.delete(routeId)
        return newSet
      })
    }
  }

  // Initial load and map reset
  useEffect(() => {
    // Set local search from stored value first
    setLocalSearch(searchValue || "")

    // Clear the map data immediately when component mounts (routes tab opened)
    updateMapData({ type: "FeatureCollection", features: [] })

    // Clear any selected route
    setSelectedRouteForMap(null)

    // Clear expanded routes
    setExpandedRoutes(new Set())

    // Only fetch if we don't have data already, and use the stored search value
    if ((gtfsData.routes?.length || 0) === 0) {
      fetchRoutes(1, searchValue || "")
    }
  }, []) // This runs when the routes page is first mounted

  // Handle search input change with debouncing
  useEffect(() => {
    if (localSearch !== searchValue) {
      debouncedSearch(localSearch)
    }
  }, [localSearch, debouncedSearch, searchValue])

  const toggleRoute = async (routeId) => {
    const newExpanded = new Set(expandedRoutes)

    if (newExpanded.has(routeId)) {
      // Collapsing the route
      newExpanded.delete(routeId)

      // If this was the selected route for map, clear the map
      if (selectedRouteForMap === routeId) {
        setSelectedRouteForMap(null)
        updateMapData({ type: "FeatureCollection", features: [] })
      }
    } else {
      // Expanding the route - first clear any existing selection
      if (selectedRouteForMap && selectedRouteForMap !== routeId) {
        // Clear the previous route's expansion
        newExpanded.delete(selectedRouteForMap)
      }

      newExpanded.add(routeId)

      // Fetch route details when expanding for the first time
      await fetchRouteDetails(routeId)

      // Set this route as selected for map display
      setSelectedRouteForMap(routeId)

      // Center map on first stop of first direction
      const details = routeDetails[routeId]
      if (details && details.directions) {
        const firstDirection = details.available_directions?.[0]
        const firstStop = details.directions[firstDirection]?.[0]
        if (firstStop && firstStop.stop_lat && firstStop.stop_lon) {
          setCenter([firstStop.stop_lat, firstStop.stop_lon])
        }
      }
    }
    setExpandedRoutes(newExpanded)
  }

  const handleAddRoute = () => {
    // TODO: Implement add route functionality
  }

  const handleStopClick = (stop) => {
    handleSelectData(stop)
    if (stop.stop_lat && stop.stop_lon) {
      handleHoverCoordinate({ lat: stop.stop_lat, lon: stop.stop_lon })
    }
  }

  const handleSearchChange = (event) => {
    setLocalSearch(event.target.value)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()

    // Cancel any pending debounced search
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // Execute search immediately
    fetchRoutes(1, localSearch, true)
  }

  const handleClearSearch = () => {
    setLocalSearch("")

    // Cancel any pending debounced search
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // Execute search immediately with empty term
    fetchRoutes(1, "", true)
  }

  const handlePageChange = (newPage) => {
    fetchRoutes(newPage, searchValue)
  }

  // Generate map data for the selected route ONLY
  const generateMapData = () => {
    if (!selectedRouteForMap || !routeDetails[selectedRouteForMap]) {
      // Return empty features when no route is selected
      return { type: "FeatureCollection", features: [] }
    }

    const details = routeDetails[selectedRouteForMap]
    const features = []

    // Add stops as points for the selected route only
    Object.values(details.directions || {}).forEach(
      (directionStops, dirIndex) => {
        directionStops.forEach((stop, stopIndex) => {
          if (stop.stop_lat && stop.stop_lon) {
            features.push({
              type: "Feature",
              properties: {
                type: "route", // Mark as route stop to get different styling
                stop_id: stop.stop_id,
                stop_name: stop.stop_name,
                direction_id: stop.direction_id,
                stop_sequence: stop.stop_sequence || stopIndex + 1,
                route_id: selectedRouteForMap,
                route_color: details.route_color,
                route_short_name: details.route_short_name,
              },
              geometry: {
                type: "Point",
                coordinates: [stop.stop_lon, stop.stop_lat],
              },
            })
          }
        })
      }
    )

    // Add route lines connecting stops
    Object.entries(details.directions || {}).forEach(
      ([directionId, directionStops]) => {
        if (directionStops.length > 1) {
          const coordinates = directionStops
            .filter((stop) => stop.stop_lat && stop.stop_lon)
            .map((stop) => [stop.stop_lon, stop.stop_lat])

          if (coordinates.length > 1) {
            features.push({
              type: "Feature",
              properties: {
                type: "route",
                route_id: selectedRouteForMap,
                direction_id: parseInt(directionId),
                route_color: details.route_color,
                route_short_name: details.route_short_name,
              },
              geometry: {
                type: "LineString",
                coordinates: coordinates,
              },
            })
          }
        }
      }
    )

    return { type: "FeatureCollection", features }
  }

  // Update the map with route data whenever selection changes
  useEffect(() => {
    const mapData = generateMapData()
    updateMapData(mapData)
  }, [selectedRouteForMap, routeDetails])

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      // Optional: Clear map data when leaving the routes page
      // updateMapData({ type: "FeatureCollection", features: [] })
    }
  }, [])

  const hasResults = gtfsData.routes && gtfsData.routes.length > 0
  const showPagination = hasResults && (!searchValue || totalPages > 1)

  // Calculate display information
  const currentStart = hasResults ? (page - 1) * pageSize + 1 : 0
  const currentEnd = Math.min(page * pageSize, totalItems)

  // Loading state for initial load
  if (isLoading && !hasResults) {
    return (
      <div className="flex flex-col h-full">
        <div className="bg-background">
          <div className="p-4">
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Route className="w-5 h-5" />
                  <h2 className="text-2xl font-bold">Routes</h2>
                </div>
                <Button onClick={handleAddRoute} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Route
                </Button>
              </div>
              <p className="text-muted-foreground mt-2">
                Manage transit routes and lines. Click on a route to view its
                stops and directions on the map.
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Sticky Header Section */}
      <div className="bg-background">
        <div className="px-4 pt-4">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Route className="w-5 h-5" />
                <h2 className="text-2xl font-bold">Routes</h2>
              </div>
              <Button onClick={handleAddRoute} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Route
              </Button>
            </div>
            <p className="text-muted-foreground mt-2">
              Manage transit routes and lines. Click on a route to view its
              stops and directions on the map.
            </p>
          </div>

          {/* Search Bar */}
          <div className="flex items-center w-full relative">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search routes by name or ID..."
                  value={localSearch}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-10"
                />
                {localSearch && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSearch}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted">
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </form>
            {isLoading && (
              <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              </div>
            )}
          </div>

          {/* Results summary and pagination */}
          {(searchValue || routesMeta?.totalItems > 0) && (
            <div className="flex pt-4 justify-between items-center text-xs text-muted-foreground">
              {/* Pagination controls */}
              {showPagination && (
                <div className="flex gap-x-2 items-center">
                  <div className="flex gap-x-2 items-center select-none">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1 || isLoading || !hasResults}>
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Prev
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={
                        page === totalPages || isLoading || !hasResults
                      }>
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Page <strong>{page}</strong> of{" "}
                    <strong>{totalPages}</strong>
                  </div>
                </div>
              )}

              {/* Results info */}
              {hasResults && totalItems > gtfsData.routes.length && (
                <div>
                  Showing{" "}
                  <strong>
                    {currentStart}-{currentEnd}
                  </strong>{" "}
                  {`of `}
                  {searchValue ? (
                    hasResults ? (
                      <>
                        <strong>{totalItems}</strong> result
                        {totalItems !== 1 ? "s " : " "}
                        for "<em>{searchValue}</em>"
                      </>
                    ) : (
                      <>
                        No results found for "<em>{searchValue}</em>"
                      </>
                    )
                  ) : (
                    <>
                      <strong>{totalItems}</strong> route
                      {totalItems !== 1 ? "s" : ""}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 p-4">
        {hasResults ? (
          <div className="space-y-3">
            {gtfsData.routes.map((route) => (
              <RouteItem
                key={route.route_id}
                route={route}
                details={routeDetails[route.route_id] || {}}
                isExpanded={expandedRoutes.has(route.route_id)}
                isLoadingDetails={isLoadingDetails.has(route.route_id)}
                onToggle={() => toggleRoute(route.route_id)}
                onStopClick={handleStopClick}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Route className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No routes found</h3>
            <p className="text-muted-foreground mb-4">
              {searchValue
                ? `No routes match your search "${searchValue}"`
                : "Create your first transit route to connect stops"}
            </p>
            {searchValue ? (
              <Button variant="outline" onClick={handleClearSearch}>
                Clear search
              </Button>
            ) : (
              <Button onClick={handleAddRoute}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Route
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
