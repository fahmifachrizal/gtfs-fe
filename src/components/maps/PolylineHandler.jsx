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
  console.log("[SnakeAnim] Starting to load plugin...")

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
        console.log("[PolylineHandler] Plugin ready")
        setPluginReady(true)
      })
      .catch((err) => {
        console.error("[PolylineHandler] Plugin failed to load:", err)
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
        console.log(
          `[PolylineHandler] Removing instance ${instanceId} from route ${routeId}`
        )

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

        console.log(
          `[PolylineHandler] Route ${routeId} active count: ${activeCountByRouteRef.current.get(
            routeId
          )}`
        )
      } catch (error) {
        console.error(`[PolylineHandler] Error removing instance:`, error)
      }
    },
    [map]
  )

  // Create a new instance for a specific route
  const createInstance = useCallback(
    (route) => {
      if (!map || !pluginReady) {
        console.log("[PolylineHandler] Cannot create: map or plugin not ready")
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
        console.log(
          `[PolylineHandler] Route ${routeId}: Max instances (${routeConfig.maxInstances}) reached. Active: ${currentActive}`
        )
        return null
      }

      const coords = getCoordinates(geojsonData)

      if (coords.length < 2) {
        console.warn(
          `[PolylineHandler] Route ${routeId}: Insufficient coordinates`
        )
        return null
      }

      const instanceId = `${routeId}-${instanceCounterRef.current++}-${Date.now()}`
      console.log(
        `[PolylineHandler] Creating instance ${instanceId}. Route ${routeId} active: ${currentActive}`
      )

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
            onStart: () => {
              console.log(`[PolylineHandler] Instance ${instanceId} started`)
            },
            onProgress: (polyline, progress, latLng) => {
              if (onProgress) {
                onProgress(instanceId, routeId, progress, latLng)
              }
            },
            onEnd: () => {
              console.log(`[PolylineHandler] Instance ${instanceId} completed`)

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

          console.log(
            `[PolylineHandler] Route ${routeId} active count after creation: ${activeCountByRouteRef.current.get(
              routeId
            )}`
          )

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

  // Setup schedulers for all routes
  useEffect(() => {
    if (!pluginReady || routes.length === 0) return

    console.log(
      `[PolylineHandler] Setting up schedulers for ${routes.length} routes`
    )

    // Clear existing schedulers
    schedulerIntervalsRef.current.forEach((interval) => {
      clearInterval(interval)
    })
    schedulerIntervalsRef.current.clear()

    // Create scheduler for each route
    routes.forEach((route) => {
      const { id: routeId, config = {} } = route
      const routeConfig = {
        intervalSeconds: 1,
        autoStart: true,
        ...config,
      }

      if (!routeConfig.autoStart) {
        console.log(`[PolylineHandler] Route ${routeId}: Auto-start disabled`)
        return
      }

      // Initialize active count for this route
      if (!activeCountByRouteRef.current.has(routeId)) {
        activeCountByRouteRef.current.set(routeId, 0)
      }

      console.log(
        `[PolylineHandler] Starting scheduler for route ${routeId} with ${routeConfig.intervalSeconds}s interval`
      )

      // Create first instance immediately
      setTimeout(() => createInstance(route), 100 * (routes.indexOf(route) + 1))

      // Setup interval
      const intervalMs = routeConfig.intervalSeconds * 1000
      const interval = setInterval(() => {
        console.log(
          `[PolylineHandler] Scheduler tick for route ${routeId}. Active: ${activeCountByRouteRef.current.get(
            routeId
          )}`
        )
        createInstance(route)
      }, intervalMs)

      schedulerIntervalsRef.current.set(routeId, interval)
    })

    // Cleanup
    return () => {
      console.log("[PolylineHandler] Stopping all schedulers")
      schedulerIntervalsRef.current.forEach((interval) => {
        clearInterval(interval)
      })
      schedulerIntervalsRef.current.clear()
    }
  }, [pluginReady, routes, createInstance])

  // Cleanup all instances on unmount
  useEffect(() => {
    return () => {
      console.log("[PolylineHandler] Cleaning up all instances")

      schedulerIntervalsRef.current.forEach((interval) => {
        clearInterval(interval)
      })
      schedulerIntervalsRef.current.clear()

      routeInstancesRef.current.forEach((routeInstances, routeId) => {
        routeInstances.forEach((polyline, instanceId) => {
          try {
            if (polyline.removeSnake) {
              polyline.removeSnake()
            }
            if (map && map.hasLayer(polyline)) {
              map.removeLayer(polyline)
            }
          } catch (error) {
            console.error(
              `[PolylineHandler] Cleanup error for ${instanceId}:`,
              error
            )
          }
        })
      })

      routeInstancesRef.current.clear()
      activeCountByRouteRef.current.clear()
    }
  }, [map])

  return null
}
