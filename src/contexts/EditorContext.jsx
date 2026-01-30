// contexts/EditorContext.js - Enhanced with cleanup utilities
"use client"
import React, { createContext, useContext, useState, useMemo, useCallback } from "react"
import { useUser } from "@/contexts/UserContext"
import { getApiUrl } from "@/config/api"

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
  })

  const handleFetchData = async (type, options = {}) => {
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

    try {
      const query = new URLSearchParams({
        page: page.toString(),
        ...(currentProject && { project_id: currentProject.id }),
        ...(search && { search }),
      }).toString()

      const fullUrl = getApiUrl(`/api/gtfs/${type}?${query}`)
      console.log(`[EditorContext] Fetching ${type}:`, fullUrl);

      const response = await fetch(fullUrl, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
      })

      console.log(`[EditorContext] Response status: ${response.status}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log(`[EditorContext] Received data for ${type}:`, data);

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
  }

  const handleHoverCoordinate = (coordinate) => {
    if (coordinate) {
      setCenter([coordinate.lat, coordinate.lon])
    }
  }

  const handleSelectData = (data) => {
    setSelectedData(data)
    if (data.stop_lat && data.stop_lon) {
      setCenter([data.stop_lat, data.stop_lon])
    }
  }

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
        const { route_id, direction_id, route_color } = feature.properties || {}
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

  const getMeta = (type) =>
    gtfsMeta[type] || {
      page: 1,
      pageSize: 10,
      totalPages: 1,
      totalItems: 0,
      search: "",
    }

  const updateMeta = (type, newMeta) => {
    setGtfsMeta((prev) => ({
      ...prev,
      [type]: { ...prev[type], ...newMeta },
    }))
  }

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
    clearMap, // New helper
    generateAnimationRoutes,
    handleFetchData,
    handleHoverCoordinate,
    handleSelectData,
    resetEditorState
  }

  return (
    <EditorContext.Provider value={contextValue}>
      {children}
    </EditorContext.Provider>
  )
}