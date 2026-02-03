// contexts/EditorContext.js - Enhanced with cleanup utilities
"use client"
import React, { createContext, useContext, useState, useMemo, useCallback } from "react"
import { useUser } from "@/contexts/UserContext"
import { getApiUrl } from "@/config/api"
import { service } from "../services"

const EditorContext = createContext()

export const useEditorContext = () => {
  const context = useContext(EditorContext)
  if (!context) {
    throw new Error("useEditorContext must be used within EditorProvider")
  }
  return context
}

export function EditorProvider({ children }) {
  const { user, currentProject } = useUser()
  const [center, setCenter] = useState([-6.175389, 106.827139])
  const [selectedData, setSelectedData] = useState(null)
  const [mapData, setMapData] = useState({
    type: "FeatureCollection",
    features: [],
  })
  const [mapBounds, setMapBounds] = useState(null) // New state for bounds
  const [onMarkerDragEnd, setOnMarkerDragEnd] = useState(null) // Callback for marker drag events

  // Sidebar / Detail View State
  const [activeDetail, setActiveDetail] = useState(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [detailTitle, setDetailTitle] = useState('Details')

  // Route Details State - centralized storage for route details with stops
  const [routeDetails, setRouteDetails] = useState({})
  const [loadingRouteDetails, setLoadingRouteDetails] = useState(new Set())

  const setDetailView = useCallback((content, title = 'Details') => {
    setActiveDetail(content)
    setIsDetailOpen(!!content)
    setDetailTitle(title)
    setHasUnsavedChanges(false) // Reset unsaved changes when opening new detail
  }, [])

  const closeDetail = useCallback(() => {
    setIsDetailOpen(false)
    setActiveDetail(null)
    setHasUnsavedChanges(false) // Reset unsaved changes when closing
  }, [])

  const [gtfsData, setGtfsData] = useState({
    agency: [],
    stops: [],
    routes: [],
    trips: [],
    stop_times: [],
    calendar: [],
    calendar_dates: [],
    fare_rules: [],
    fare_attributes: [],
    shapes: [],
    frequencies: [],
    transfers: [],
  })

  const [gtfsMeta, setGtfsMeta] = useState({
    agency: { page: 1, pageSize: 10, totalPages: 1, totalItems: 0, search: "" },
    stops: { page: 1, pageSize: 10, totalPages: 1, totalItems: 0, search: "" },
    routes: { page: 1, pageSize: 10, totalPages: 1, totalItems: 0, search: "" },
    trips: { page: 1, pageSize: 10, totalPages: 1, totalItems: 0, search: "" },
    stop_times: { page: 1, pageSize: 10, totalPages: 1, totalItems: 0, search: "" },
    calendar: { page: 1, pageSize: 10, totalPages: 1, totalItems: 0, search: "" },
    calendar_dates: { page: 1, pageSize: 10, totalPages: 1, totalItems: 0, search: "" },
    fare_rules: { page: 1, pageSize: 10, totalPages: 1, totalItems: 0, search: "" },
    fare_attributes: { page: 1, pageSize: 10, totalPages: 1, totalItems: 0, search: "" },
    shapes: { page: 1, pageSize: 10, totalPages: 1, totalItems: 0, search: "" },
    frequencies: { page: 1, pageSize: 10, totalPages: 1, totalItems: 0, search: "" },
    transfers: { page: 1, pageSize: 10, totalPages: 1, totalItems: 0, search: "" },
  })

  // Progress tracking state
  const [completionStatus, setCompletionStatus] = useState({
    welcome: true, // Always considered complete
    agency: false,
    stops: false,
    routes: false,
    shapes: false,
    trips: false,
    calendar: false,
    "stop-times": false,
    frequencies: false,
    transfers: false,
    fares: false,
  })

  // Track last fetched project to prevent infinite loops
  const lastFetchedProjectRef = React.useRef(null)

  const handleFetchData = useCallback(async (type, options = {}) => {
    const { page = 1, overrideData = null, search = "" } = options

    if (overrideData) {
      setGtfsData((prev) => ({ ...prev, [type]: overrideData }))
      setGtfsMeta((prev) => ({
        ...prev,
        [type]: {
          ...prev[type],
          totalItems: overrideData.length,
          totalPages: Math.ceil(overrideData.length / prev[type].pageSize),
        },
      }))
      return { meta: gtfsMeta[type] }
    }

    const token = user?.token || localStorage.getItem('auth_token');

    if (!token) {
      // console.warn("[EditorContext] Cannot fetch data: User not authenticated")
      return { error: "User not authenticated" }
    }

    try {
      const projectId = currentProject?.id || JSON.parse(localStorage.getItem('current_project') || '{}')?.id;

      const query = new URLSearchParams({
        page: page.toString(),
        ...(projectId && { project_id: projectId }),
        ...(search && { search }),
      }).toString()

      const fullUrl = getApiUrl(`/api/gtfs/${type}?${query}`)
      // console.log(`[EditorContext] Fetching ${type}:`, fullUrl);

      const response = await fetch(fullUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      // console.log(`[EditorContext] Response status: ${response.status}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      // console.log(`[EditorContext] Received data for ${type}:`, data);

      if (data.success === false) {
        throw new Error(data.message || `Failed to fetch ${type}`)
      }

      let payload = []

      // Handle spread response (backend services like getStops return { stops: [...], pagination: ... })
      if (data[type]) {
        payload = data[type]
      } else if (data.data) {
        payload = data.data[type] || data.data || []
      } else if (Array.isArray(data)) {
        payload = data
      }

      setGtfsData((prev) => ({ ...prev, [type]: payload }))

      const meta = data.meta || data.pagination
      if (meta) {
        setGtfsMeta((prev) => ({
          ...prev,
          [type]: {
            page: meta.page || page,
            pageSize: meta.pageSize || meta.limit || 10,
            totalPages: meta.totalPages || meta.pages || 1,
            totalItems: meta.totalItems || meta.total || 0,
            search: meta.search || search,
            hasNextPage: meta.hasNextPage || (meta.page < (meta.totalPages || meta.pages)),
            hasPreviousPage: meta.hasPreviousPage || (meta.page > 1),
          },
        }))
      }

      return {
        totalPages: data.meta?.totalPages || 1,
        meta: data.meta || gtfsMeta[type],
      }
    } catch (error) {
      setGtfsMeta((prev) => ({
        ...prev,
        [type]: {
          ...prev[type],
          totalPages: prev[type].totalPages || 1,
          totalItems: prev[type].totalItems || 0,
        },
      }))

      return {
        totalPages: 1,
        meta: gtfsMeta[type],
        error: error.message,
      }
    }
  }, [currentProject, user, gtfsMeta])

  const handleHoverCoordinate = useCallback((coordinate) => {
    if (coordinate) {
      setCenter([coordinate.lat, coordinate.lon])
    }
  }, [])

  const handleSelectData = useCallback((data) => {
    setSelectedData(data)
    if (data.stop_lat && data.stop_lon) {
      setCenter([data.stop_lat, data.stop_lon])
    }
  }, [])

  const updateMapData = useCallback((newMapData) => {
    setMapData(newMapData)
  }, [])

  // Clear map helper
  const clearMap = useCallback(() => {
    setMapData({ type: "FeatureCollection", features: [] })
    setSelectedData(null)
  }, [])

  // Reset all editor state
  const resetEditorState = useCallback(() => {
    setMapData({ type: "FeatureCollection", features: [] })
    setSelectedData(null)
    setGtfsData({
      agency: [],
      stops: [],
      routes: [],
      trips: [],
      stop_times: [],
      calendar: [],
      calendar_dates: [],
      fare_rules: [],
      fare_attributes: [],
      shapes: [],
      frequencies: [],
      transfers: [],
    })
    setRouteDetails({})
  }, [])

  // Fetch route details with all directions and stops
  const fetchRouteDetails = useCallback(async (routeId) => {
    // Skip if already loaded or currently loading
    if (routeDetails[routeId] || loadingRouteDetails.has(routeId)) {
      return routeDetails[routeId]
    }

    const projectId = currentProject?.id || JSON.parse(localStorage.getItem('current_project') || '{}')?.id
    if (!projectId) {
      // console.warn("[EditorContext] Cannot fetch route details: No project selected")
      return null
    }

    setLoadingRouteDetails(prev => new Set([...prev, routeId]))

    try {
      const response = await service.routes.getRouteDetails(projectId, routeId)

      if (response.success && response.data?.route) {
        const route = response.data.route

        // Ensure available_directions is set from directions object
        const routeWithDirections = {
          ...route,
          available_directions: route.available_directions ||
            (route.directions ? Object.keys(route.directions).map(Number) : [])
        }

        setRouteDetails(prev => ({
          ...prev,
          [routeId]: routeWithDirections,
        }))

        // Calculate bounds from stops for map centering
        let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity
        let hasStops = false

        if (route.directions) {
          Object.values(route.directions).forEach(directionStops => {
            directionStops.forEach(stop => {
              if (stop.stop_lat && stop.stop_lon) {
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

        return route
      }
    } catch (error) {
      // console.error("[EditorContext] Failed to fetch route details:", error)
      // Store empty details to prevent repeated failed requests
      setRouteDetails(prev => ({
        ...prev,
        [routeId]: { directions: {}, available_directions: [] },
      }))
    } finally {
      setLoadingRouteDetails(prev => {
        const newSet = new Set(prev)
        newSet.delete(routeId)
        return newSet
      })
    }

    return null
  }, [currentProject, routeDetails, loadingRouteDetails])

  // Update route stops in local state after editing/reordering
  const updateRouteStops = useCallback((routeId, stops, directionId = 0) => {
    setRouteDetails(prev => {
      const existing = prev[routeId] || { directions: {} }
      return {
        ...prev,
        [routeId]: {
          ...existing,
          directions: {
            ...existing.directions,
            [directionId]: stops,
          },
        },
      }
    })
  }, [])

  // Generate animation routes from mapData
  const generateAnimationRoutes = useMemo(() => {
    if (!mapData || !mapData.features || mapData.features.length === 0) {
      return []
    }

    const routeMap = new Map()

    mapData.features.forEach((feature) => {
      if (feature.geometry?.type === "LineString") {
        const { route_id, direction_id, route_color, type } = feature.properties || {}

        // Skip static shape paths and other non-animated lines
        if (type === "shape-path" || !route_id) {
          return
        }

        const key = `${route_id}-${direction_id}`

        if (!routeMap.has(key)) {
          routeMap.set(key, {
            id: key,
            geojsonData: {
              type: "FeatureCollection",
              features: [],
            },
            config: {
              speed: 400,
              color: route_color ? `#${route_color}` : "#ff6b35",
              weight: 4,
              opacity: 0.9,
              maxInstances: 3,
              autoStart: true,
              cleanupDelay: 2000,
              intervalSeconds: 5,
              markerColor: route_color ? `#${route_color}` : "orange",
            },
          })
        }

        routeMap.get(key).geojsonData.features.push(feature)
      }
    })

    return Array.from(routeMap.values())
  }, [mapData])

  const getMeta = useCallback((type) =>
    gtfsMeta[type] || {
      page: 1,
      pageSize: 10,
      totalPages: 1,
      totalItems: 0,
      search: "",
    }, [gtfsMeta])

  const updateMeta = useCallback((type, newMeta) => {
    setGtfsMeta((prev) => ({
      ...prev,
      [type]: { ...prev[type], ...newMeta },
    }))
  }, [])

  // Fetch counts for all GTFS types to properly check requirements
  const fetchAllCounts = useCallback(async () => {
    const projectId = currentProject?.id || JSON.parse(localStorage.getItem('current_project') || '{}')?.id
    const token = user?.token || localStorage.getItem('auth_token')

    if (!token || !projectId) {
      // console.warn("[EditorContext] fetchAllCounts: No token or projectId")
      return
    }

    const typesToCheck = ['agency', 'stops', 'routes', 'trips', 'calendar', 'stop-times']

    try {
      // Fetch all counts in parallel
      const results = await Promise.allSettled(
        typesToCheck.map(async (type) => {
          const query = new URLSearchParams({
            page: '1',
            project_id: projectId,
          }).toString()

          const fullUrl = getApiUrl(`/api/gtfs/${type}?${query}`)
          const response = await fetch(fullUrl, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          })

          if (!response.ok) {
            // console.warn(`[EditorContext] fetchAllCounts: ${type} returned ${response.status}`)
            return { type, count: 0 }
          }

          const data = await response.json()
          // console.log(`[EditorContext] fetchAllCounts: ${type} response:`, data)

          // Extract count from response
          let count = 0

          // Check various response formats
          if (data.meta?.totalItems) {
            // Format: { meta: { totalItems: X } }
            count = data.meta.totalItems
          } else if (data.data?.pagination?.total) {
            // Format: { data: { pagination: { total: X } } } - used by stops, routes, etc.
            count = data.data.pagination.total
          } else if (data.pagination?.total) {
            // Format: { pagination: { total: X } }
            count = data.pagination.total
          } else if (data.data?.[type]) {
            // Format: { data: { stops: [...] } }
            count = data.data[type].length
          } else if (data[type]) {
            // Format: { stops: [...] }
            count = data[type].length
          } else if (Array.isArray(data.data)) {
            // Format: { data: [...] }
            count = data.data.length
          }

          // console.log(`[EditorContext] fetchAllCounts: ${type} extracted count: ${count}`)

          // Map stop-times back to stop_times for consistency
          const mappedType = type === 'stop-times' ? 'stop_times' : type
          return { type: mappedType, count }
        })
      )

      // Update gtfsMeta with counts
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          const { type, count } = result.value
          setGtfsMeta((prev) => ({
            ...prev,
            [type]: {
              ...prev[type],
              totalItems: count,
            },
          }))
        }
      })
    } catch (error) {
      // console.error("[EditorContext] Failed to fetch counts:", error)
    }
  }, [currentProject, user])

  // Check requirements for each GTFS step based on counts in meta
  const checkRequirements = useCallback(() => {
    const newStatus = {
      welcome: true,
      agency: (gtfsData.agency && gtfsData.agency.length > 0) || (gtfsMeta.agency?.totalItems > 0),
      stops: (gtfsData.stops && gtfsData.stops.length >= 2) || (gtfsMeta.stops?.totalItems >= 2), // At least 2 stops needed
      routes: (gtfsData.routes && gtfsData.routes.length > 0) || (gtfsMeta.routes?.totalItems > 0),
      shapes: true, // Optional
      trips: (gtfsData.trips && gtfsData.trips.length > 0) || (gtfsMeta.trips?.totalItems > 0),
      calendar: (gtfsData.calendar && gtfsData.calendar.length > 0) || (gtfsMeta.calendar?.totalItems > 0),
      "stop-times": (gtfsData.stop_times && gtfsData.stop_times.length > 0) || (gtfsMeta.stop_times?.totalItems > 0),
      frequencies: true, // Optional
      transfers: true, // Optional
      fares: true, // Optional
    }

    // console.log("[EditorContext] Checking requirements:", {
    //   agencyData: gtfsData.agency?.length,
    //   agencyMeta: gtfsMeta.agency?.totalItems,
    //   agencyStatus: newStatus.agency,
    //   stopsData: gtfsData.stops?.length,
    //   stopsMeta: gtfsMeta.stops?.totalItems,
    //   stopsStatus: newStatus.stops,
    //   newStatus
    // })

    setCompletionStatus(newStatus)
    return newStatus
  }, [gtfsData, gtfsMeta])

  // Update completion status when data changes
  React.useEffect(() => {
    checkRequirements()
  }, [gtfsData, gtfsMeta, checkRequirements])

  // Fetch all counts when project changes
  React.useEffect(() => {
    if (currentProject?.id && currentProject.id !== lastFetchedProjectRef.current) {
      lastFetchedProjectRef.current = currentProject.id
      fetchAllCounts().then(() => checkRequirements())
    }
  }, [currentProject?.id])

  const contextValue = {
    center,
    setCenter,
    selectedData,
    setSelectedData,
    gtfsData,
    setGtfsData,
    gtfsMeta,
    setGtfsMeta,
    getMeta,
    updateMeta,
    mapData,
    updateMapData,
    mapBounds,
    setMapBounds,
    clearMap, // New helper
    generateAnimationRoutes,
    handleFetchData,
    handleHoverCoordinate,
    handleSelectData,
    resetEditorState,

    // Route Details - centralized state for route stops and details
    routeDetails,
    loadingRouteDetails,
    fetchRouteDetails,
    updateRouteStops,

    // Detail View
    activeDetail,
    isDetailOpen,
    detailTitle,
    setDetailView,
    closeDetail,
    hasUnsavedChanges,
    setHasUnsavedChanges,

    // Progress Tracking
    completionStatus,
    checkRequirements,
    fetchAllCounts,

    // Map Interaction
    onMarkerDragEnd,
    setOnMarkerDragEnd: (callback) => setOnMarkerDragEnd(() => callback),
  }

  return (
    <EditorContext.Provider value={contextValue}>
      {children}
    </EditorContext.Provider>
  )
}