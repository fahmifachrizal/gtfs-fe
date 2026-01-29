// contexts/EditorContext.js - Enhanced with cleanup utilities
"use client"
import React, { createContext, useContext, useState, useMemo, useCallback } from "react"
import { useUser } from "@/contexts/UserContext"

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

      const response = await fetch(`/api/gtfs/${type}?${query}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success === false) {
        throw new Error(data.message || `Failed to fetch ${type}`)
      }

      let payload = []
      if (data.data) {
        payload = data.data[type] || data.data || []
      } else if (Array.isArray(data)) {
        payload = data
      }

      setGtfsData((prev) => ({ ...prev, [type]: payload }))

      if (data.meta) {
        setGtfsMeta((prev) => ({
          ...prev,
          [type]: {
            page: data.meta.page || page,
            pageSize: data.meta.pageSize || 10,
            totalPages: data.meta.totalPages || 1,
            totalItems: data.meta.totalItems || 0,
            search: data.meta.search || search,
            hasNextPage: data.meta.hasNextPage || false,
            hasPreviousPage: data.meta.hasPreviousPage || false,
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
  }

  return (
    <EditorContext.Provider value={contextValue}>
      {children}
    </EditorContext.Provider>
  )
}