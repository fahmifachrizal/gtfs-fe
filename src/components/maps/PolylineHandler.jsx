"use client"

import { useMap } from "react-leaflet"
import L from "leaflet"
import { useEffect, useState, useCallback, useRef } from "react"
import "@/utils/leaflet/L.Polyline.SnakeAnim"
import MapMarker from "./map-marker"

// Track plugin loading status globally
let snakeAnimLoaded = false
let snakeAnimLoading = false
let snakeAnimError = null

// Load SnakeAnim plugin
const loadSnakeAnimPlugin = () => {
  if (typeof window === "undefined") {
    return Promise.reject("Not in browser")
  }

  if (snakeAnimLoaded) return Promise.resolve()

  if (snakeAnimLoading) {
    return new Promise((resolve, reject) => {
      const check = setInterval(() => {
        if (snakeAnimLoaded) {
          clearInterval(check)
          resolve()
        }
        if (snakeAnimError) {
          clearInterval(check)
          reject(snakeAnimError)
        }
      }, 100)
    })
  }

  snakeAnimLoading = true

  return new Promise(async (resolve, reject) => {
    try {
      if (!window.L) {
        throw new Error("Leaflet (L) not available")
      }

      await import("@/utils/leaflet/L.Polyline.SnakeAnim.js")

      if (window.L?.SnakeRegistry) {
        snakeAnimLoaded = true
        snakeAnimLoading = false
        resolve()
      } else {
        throw new Error("SnakeRegistry not found after import")
      }
    } catch (e) {
      snakeAnimError = e
      snakeAnimLoading = false
      reject(e)
    }
  })
}

/**
 * Enhanced Multi-Route Polyline Handler Component
 * Manages multiple routes with individual configurations and animations
 */
export default function PolylineHandler({
  routes = [],
  onInstanceCreate = null,
  onInstanceComplete = null,
  onProgress = null,
}) {
  const map = useMap()
  const [pluginReady, setPluginReady] = useState(false)

  // Route management - Map of routeId -> instances
  const routeInstancesRef = useRef(new Map())
  const instanceCounterRef = useRef(0)
  const activeCountByRouteRef = useRef(new Map())
  const schedulerIntervalsRef = useRef(new Map())

  // Load plugin when component mounts
  useEffect(() => {
    if (!map) return

    loadSnakeAnimPlugin()
      .then(() => {
        setPluginReady(true)
      })
      .catch((err) => {
        // console.error("[PolylineHandler] Plugin failed to load:", err)
      })
  }, [map])

  // Extract coordinates from GeoJSON
  const getCoordinates = useCallback((geojsonData) => {
    const coords = []

    try {
      if (!geojsonData?.features) {
        console.warn("[PolylineHandler] Missing geojsonData or features")
        return coords
      }

      geojsonData.features.forEach((feature) => {
        if (!feature?.geometry) return

        let points = []

        if (feature.geometry.type === "LineString") {
          points = feature.geometry.coordinates.map(([lng, lat]) => [lat, lng])
        } else if (feature.geometry.type === "MultiLineString") {
          feature.geometry.coordinates.forEach((line) =>
            points.push(...line.map(([lng, lat]) => [lat, lng]))
          )
        }

        const validPoints = points.filter(
          ([lat, lng]) =>
            typeof lat === "number" &&
            typeof lng === "number" &&
            !isNaN(lat) &&
            !isNaN(lng) &&
            isFinite(lat) &&
            isFinite(lng) &&
            lat >= -90 &&
            lat <= 90 &&
            lng >= -180 &&
            lng <= 180
        )

        // Remove duplicates
        const dedupedPoints = validPoints.filter((point, i, arr) => {
          if (i === 0) return true
          const prev = arr[i - 1]
          return point[0] !== prev[0] || point[1] !== prev[1]
        })

        coords.push(...dedupedPoints)
      })
    } catch (error) {
      console.error("[PolylineHandler] Error extracting coordinates:", error)
    }

    return coords
  }, [])

  // Remove an instance
  const removeInstance = useCallback(
    (instanceId, routeId) => {
      const routeInstances = routeInstancesRef.current.get(routeId)
      if (!routeInstances) return

      const polyline = routeInstances.get(instanceId)
      if (!polyline) return

      try {
        if (polyline.removeSnake) {
          polyline.removeSnake()
        }
        if (map && map.hasLayer(polyline)) {
          map.removeLayer(polyline)
        }

        routeInstances.delete(instanceId)

        // Update active count for this route
        const currentCount = activeCountByRouteRef.current.get(routeId) || 0
        activeCountByRouteRef.current.set(
          routeId,
          Math.max(0, currentCount - 1)
        )
      } catch (error) {
        // console.error(`[PolylineHandler] Error removing instance:`, error)
      }
    },
    [map]
  )

  // Create a new instance for a specific route
  const createInstance = useCallback(
    (route) => {
      if (!map || !pluginReady) {
        return null
      }

      const { id: routeId, geojsonData, config = {} } = route

      // Default configuration
      const routeConfig = {
        speed: 300,
        color: "#ff6b35",
        weight: 3,
        opacity: 1,
        maxInstances: 5,
        autoStart: true,
        cleanupDelay: 2000,
        markerColor: "orange",
        ...config,
      }

      const currentActive = activeCountByRouteRef.current.get(routeId) || 0

      // Check max instances limit for this route
      if (currentActive >= routeConfig.maxInstances) {
        return null
      }

      const coords = getCoordinates(geojsonData)

      if (coords.length < 2) {
        return null
      }

      const instanceId = `${routeId}-${instanceCounterRef.current++}-${Date.now()}`

      try {
        const polyline = L.polyline(coords, {
          color: routeConfig.color,
          weight: routeConfig.weight,
          opacity: routeConfig.opacity,
          lineCap: "round",
          stroke: false,
          lineJoin: "round",
        }).addTo(map)

        // Initialize snake animation
        if (polyline.initSnake) {
          polyline.initSnake({
            id: instanceId,
            speed: routeConfig.speed,
            autoRestart: false,
            onProgress: (polyline, progress, latLng) => {
              if (onProgress) {
                onProgress(instanceId, routeId, progress, latLng)
              }
            },
            onEnd: () => {
              if (onInstanceComplete) {
                onInstanceComplete(instanceId, routeId, {
                  totalInstances:
                    activeCountByRouteRef.current.get(routeId) || 0,
                  timestamp: Date.now(),
                })
              }

              // Cleanup after delay
              setTimeout(() => {
                removeInstance(instanceId, routeId)
              }, routeConfig.cleanupDelay)
            },
          })

          // Store instance
          if (!routeInstancesRef.current.has(routeId)) {
            routeInstancesRef.current.set(routeId, new Map())
          }
          routeInstancesRef.current.get(routeId).set(instanceId, polyline)

          // Update active count
          activeCountByRouteRef.current.set(routeId, currentActive + 1)

          // Call external create callback
          if (onInstanceCreate) {
            onInstanceCreate(instanceId, routeId, {
              totalInstances: activeCountByRouteRef.current.get(routeId) || 0,
              timestamp: Date.now(),
            })
          }

          // Auto-start if enabled
          if (routeConfig.autoStart) {
            setTimeout(() => {
              if (polyline.snakeIn) {
                polyline.snakeIn({
                  icon: L.divIcon({
                    html: MapMarker(routeConfig.markerColor),
                    iconSize: [12, 12],
                    iconAnchor: [6, 6],
                    className: "border-2 border-accent rounded-full",
                  }),
                })
              }
            }, 50)
          }

          return polyline
        }
      } catch (error) {
        console.error(`[PolylineHandler] Error creating instance:`, error)
        return null
      }
    },
    [
      map,
      pluginReady,
      getCoordinates,
      removeInstance,
      onInstanceCreate,
      onInstanceComplete,
      onProgress,
    ]
  )

  // Helper: remove every live polyline from the map and reset counters
  const clearAllInstances = useCallback(() => {
    schedulerIntervalsRef.current.forEach((interval) => {
      clearInterval(interval)
    })
    schedulerIntervalsRef.current.clear()

    routeInstancesRef.current.forEach((routeInstances) => {
      routeInstances.forEach((polyline) => {
        try {
          if (polyline.removeSnake) polyline.removeSnake()
          if (map && map.hasLayer(polyline)) map.removeLayer(polyline)
        } catch (e) { /* ignore */ }
      })
    })
    routeInstancesRef.current.clear()
    activeCountByRouteRef.current.clear()
  }, [map])

  // Setup schedulers for all routes
  useEffect(() => {
    // Always clear previous instances first — this is the key fix:
    // even when routes becomes [], we need to strip old polylines off the map.
    clearAllInstances()

    if (!pluginReady || routes.length === 0) return

    // Create scheduler for each route
    routes.forEach((route) => {
      const { id: routeId, config = {} } = route
      const routeConfig = {
        intervalSeconds: 1,
        autoStart: true,
        ...config,
      }

      if (!routeConfig.autoStart) {
        return
      }

      // Initialize active count for this route
      if (!activeCountByRouteRef.current.has(routeId)) {
        activeCountByRouteRef.current.set(routeId, 0)
      }

      // Create first instance immediately
      setTimeout(() => createInstance(route), 100 * (routes.indexOf(route) + 1))

      // Setup interval
      const intervalMs = routeConfig.intervalSeconds * 1000
      const interval = setInterval(() => {
        createInstance(route)
      }, intervalMs)

      schedulerIntervalsRef.current.set(routeId, interval)
    })

    // Cleanup on next change / unmount
    return () => {
      clearAllInstances()
    }
  }, [pluginReady, routes, createInstance, clearAllInstances])

  // Safety-net: full cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllInstances()
    }
  }, [clearAllInstances])

  return null
}
