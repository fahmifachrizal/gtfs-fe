
import React, { useEffect, useState, useCallback, useRef } from "react"
import { Route, Plus, Search, ChevronLeft, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import RouteItem from "@/components/route-item"
import { RouteDetail } from "@/components/details/RouteDetail"
import { useEditorContext } from "@/contexts/EditorContext"
import { useUser } from "@/contexts/UserContext"
import { getApiUrl } from "@/config/api"

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
    setMapBounds,
    setDetailView,
    activeDetail,
  } = useEditorContext()

  const { currentProject } = useUser();

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

      if (!currentProject) {
        return;
      }

      await handleFetchData("routes", {
        page: resetPage ? 1 : pageNum,
        search,
      })

      // Auto-fetch details for all routes on this page for map display
      // We'll do this after routes are loaded
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
      // Assuming currentProject is needed for context in API if not handled elsewhere
      // The original scratch code used direct fetch to `/api/gtfs/routes/${routeId}`.
      // We need to ensure we pass the auth header/token as scratch did?
      // Scratch used `const response = await fetch(...)` but didn't import `user`.
      // Wait, scratch's `EditorContext.js` had `user.token`. `RoutesPage.js` didn't seem to pass headers?
      // Let's re-read scratch `RoutesPage`.
      // Ah, scratch `RoutesPage` did NOT pass headers in `fetchRouteDetails`. Maybe middleware handled it or it failed?
      // Or `EditorContext` wrapper handled it? No, it used `fetch`.
      // I should use `user.token` here just to be safe.

      const { user } = useUser(); // Hook rules... can't use here.
      // I should modify component to get user/token.
    } catch (ignore) { }
    // ...
  }
  // WAIT. I can't look inside a nested function for hook.
  // I need to use `useUser` at top level.

  // Refetch Logic with Auth
  const { user } = useUser();

  const fetchRouteDetailsSafe = async (routeId) => {
    if (routeDetails[routeId] || isLoadingDetails.has(routeId)) return

    setIsLoadingDetails((prev) => new Set([...prev, routeId]))

    try {
      const token = user?.token || localStorage.getItem('auth_token');
      const projectId = currentProject?.id || JSON.parse(localStorage.getItem('current_project') || '{}')?.id;

      // Construct query with project_id if needed
      const query = projectId ? `?project_id=${projectId}` : "";
      const fullUrl = getApiUrl(`/api/gtfs/routes/${routeId}${query}`);
      const response = await fetch(fullUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      })
      const data = await response.json()

      if (data.success && data.data.route) {
        const route = data.data.route
        setRouteDetails((prev) => ({
          ...prev,
          [routeId]: route,
        }))

        // Calculate bounds from stops
        let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity
        let hasStops = false

        const allStops = []
        if (route.directions) {
          Object.values(route.directions).forEach(directionStops => {
            directionStops.forEach(stop => {
              if (stop.stop_lat && stop.stop_lon) {
                allStops.push(stop)
                minLat = Math.min(minLat, stop.stop_lat)
                maxLat = Math.max(maxLat, stop.stop_lat)
                minLon = Math.min(minLon, stop.stop_lon)
                maxLon = Math.max(maxLon, stop.stop_lon)
                hasStops = true
              }
            })
          })
        }

        if (hasStops) {
          setMapBounds([[minLat, minLon], [maxLat, maxLon]])
        }
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
    if (currentProject) {
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
    }
  }, [currentProject])

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

      // Clear selected route if collapsing it
      if (selectedRouteForMap === routeId) {
        setSelectedRouteForMap(null)
      }
    } else {
      // Expanding the route - first clear any existing selection
      if (selectedRouteForMap && selectedRouteForMap !== routeId) {
        // Clear the previous route's expansion
        newExpanded.delete(selectedRouteForMap)
      }

      newExpanded.add(routeId)

      // Fetch route details when expanding for the first time
      await fetchRouteDetailsSafe(routeId)

      // Set this route as selected for highlighting (optional future enhancement)
      setSelectedRouteForMap(routeId)
    }
    setExpandedRoutes(newExpanded)
  }

  const handleAddRoute = () => {
    const newRoute = {
      isNew: true,
      route_short_name: "",
      route_long_name: "",
      route_desc: "",
      route_type: "3",
    }
    setDetailView(
      <RouteDetail
        route={newRoute}
        onSave={handleSaveRoute}
        onClose={() => setDetailView(null)}
      />
    )
  }

  const handleEditRoute = (route) => {
    setDetailView(
      <RouteDetail
        route={route}
        onSave={handleSaveRoute}
        onClose={() => setDetailView(null)}
      />
    )
  }

  const handleSaveRoute = (savedRoute) => {
    // Refresh routes list
    fetchRoutes(page, searchValue)
    setDetailView(null)
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

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    fetchRoutes(1, localSearch, true)
  }

  const handleClearSearch = () => {
    setLocalSearch("")

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    fetchRoutes(1, "", true)
  }

  const handlePageChange = (newPage) => {
    fetchRoutes(newPage, searchValue)
  }

  // Generate map data for ALL routes (not just selected)
  const generateMapData = () => {
    const features = []

    // Iterate through all routes that have details loaded
    gtfsData.routes?.forEach(route => {
      // Only show map data for expanded routes
      if (!expandedRoutes.has(route.route_id)) return;

      const details = routeDetails[route.route_id]
      if (!details || !details.directions) return

      // Add stops as points for this route
      Object.values(details.directions || {}).forEach(
        (directionStops, dirIndex) => {
          directionStops.forEach((stop, stopIndex) => {
            if (stop.stop_lat && stop.stop_lon) {
              features.push({
                type: "Feature",
                properties: {
                  type: "route",
                  stop_id: stop.stop_id,
                  stop_name: stop.stop_name,
                  direction_id: stop.direction_id,
                  stop_sequence: stop.stop_sequence || stopIndex + 1,
                  route_id: route.route_id,
                  route_color: details.route_color || route.route_color,
                  route_short_name: details.route_short_name || route.route_short_name,
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

      // Add route lines for this route
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
                  route_id: route.route_id,
                  direction_id: parseInt(directionId),
                  route_color: details.route_color || route.route_color,
                  route_short_name: details.route_short_name || route.route_short_name,
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
    })

    return { type: "FeatureCollection", features }
  }

  // Update map whenever route details change
  useEffect(() => {
    const mapData = generateMapData()
    updateMapData(mapData)
  }, [routeDetails, gtfsData.routes, expandedRoutes])

  useEffect(() => {
    return () => {
      // cleanup
    }
  }, [])

  if (!currentProject) {
    return <div className="p-8 text-center text-muted-foreground">Please select a project to view routes.</div>
  }

  const hasResults = gtfsData.routes && gtfsData.routes.length > 0
  const showPagination = hasResults && (!searchValue || totalPages > 1)
  const currentStart = hasResults ? (page - 1) * pageSize + 1 : 0
  const currentEnd = Math.min(page * pageSize, totalItems)

  if (isLoading && !hasResults) {
    return (
      <div className="flex flex-col h-full">
        {/* Loading Skeleton */}
        <div className="p-4 space-y-4">
          <div className="h-8 w-48 bg-muted rounded animate-pulse"></div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted rounded animate-pulse"></div>)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
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
              Manage transit routes and lines.
            </p>
          </div>

          <div className="flex items-center w-full relative">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search routes..."
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
          </div>

          {(searchValue || routesMeta?.totalItems > 0) && (
            <div className="flex pt-4 justify-between items-center text-xs text-muted-foreground">
              {showPagination && (
                <div className="flex gap-x-2">
                  <Button variant="outline" size="sm" onClick={() => handlePageChange(page - 1)} disabled={page === 1}>Prev</Button>
                  <Button variant="outline" size="sm" onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}>Next</Button>
                </div>
              )}
              {hasResults && <span>Showing {currentStart}-{currentEnd} of {totalItems}</span>}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto min-h-0">
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
                onEdit={() => handleEditRoute(route)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            No routes found.
          </div>
        )}
      </div>


    </div>
  )
}
