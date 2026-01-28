// hooks/useRouteManager.js
import { useState, useCallback, useRef, useEffect } from "react"
import L from "leaflet"

/**
 * Custom hook for managing route instances and their animations
 * Handles instance lifecycle, state tracking, and polyline management
 *
 * @param {Object} map - Leaflet map instance
 * @param {Array} routesData - Array of route configurations
 * @param {Function} onRouteProgress - Callback for progress updates
 * @param {Function} onInstanceComplete - Callback when instance completes
 * @returns {Object} Instance manager state and methods
 */
export const useRouteManager = (
  map,
  routesData = [],
  onRouteProgress = null,
  onInstanceComplete = null
) => {
  // Instance registry: Map<routeId, Map<instanceId, polyline>>
  const instanceRefsRef = useRef(new Map())

  // Instance states: Map<instanceId, {routeId, status, progress, ...}>
  const [instanceStates, setInstanceStates] = useState(new Map())

  // Track processed controls to avoid duplicates
  const processedControlsRef = useRef(new Set())

  /**
   * Update instance state and notify callback
   */
  const updateInstanceState = useCallback(
    (instanceId, routeId, status, progress = 0, currentLatLng = null) => {
      setInstanceStates((prev) => {
        const next = new Map(prev)
        next.set(instanceId, {
          routeId,
          status,
          progress,
          currentLatLng,
          timestamp: Date.now(),
        })
        return next
      })

      if (onRouteProgress) {
        onRouteProgress(instanceId, routeId, status, progress, currentLatLng)
      }
    },
    [onRouteProgress]
  )

  /**
   * Extract coordinates from GeoJSON route data
   */
  const getCoordinates = useCallback((routeData) => {
    const coords = []

    try {
      if (!routeData?.geojsonData?.features) {
        console.warn("[RouteManager] Missing geojsonData or features")
        return coords
      }

      routeData.geojsonData.features.forEach((feature) => {
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

        const dedupedPoints = validPoints.filter((point, i, arr) => {
          if (i === 0) return true
          const prev = arr[i - 1]
          return point[0] !== prev[0] || point[1] !== prev[1]
        })

        coords.push(...dedupedPoints)
      })
    } catch (error) {
      console.error("[RouteManager] Error extracting coordinates:", error)
    }

    return coords
  }, [])

  /**
   * Create a new route instance
   */
  const createInstance = useCallback(
    (instanceId, routeId, options = {}) => {
      if (!map) {
        console.warn("[RouteManager] Map not available")
        return null
      }

      const route = routesData.find((r) => r.id === routeId)
      if (!route) {
        console.warn(`[RouteManager] Route ${routeId} not found`)
        return null
      }

      // Check if instance already exists
      const routeInstances = instanceRefsRef.current.get(routeId)
      if (routeInstances?.has(instanceId)) {
        console.warn(`[RouteManager] Instance ${instanceId} already exists`)
        return routeInstances.get(instanceId)
      }

      const coords = getCoordinates(route)

      if (coords.length < 2) {
        console.warn(
          `[RouteManager] Insufficient coordinates for ${instanceId}`
        )
        updateInstanceState(instanceId, routeId, "error")
        return null
      }

      console.log(
        `[RouteManager] Creating instance ${instanceId} with ${coords.length} points`
      )

      try {
        // Calculate opacity
        const baseOpacity = route.opacity || 0.8
        const instanceOpacity = options.opacity || baseOpacity

        const polyline = L.polyline(coords, {
          color: route.color || "#ff6b35",
          weight: route.weight || 3,
          opacity: instanceOpacity,
          lineCap: "round",
          stroke: false,
          lineJoin: "round",
        }).addTo(map)

        // Initialize snake animation
        if (polyline.initSnake) {
          polyline.initSnake({
            id: instanceId,
            routeId: routeId,
            speed: options.speed || route.speed || 200,
            autoRestart: false,
            scheduleInfo: options.scheduleInfo || null,
            onStart: () => {
              console.log(`[RouteManager] Instance ${instanceId} started`)
              updateInstanceState(instanceId, routeId, "running", 0)
            },
            onProgress: (polyline, progress, latLng) => {
              updateInstanceState(
                instanceId,
                routeId,
                "running",
                progress,
                latLng
              )
            },
            onEnd: () => {
              console.log(`[RouteManager] Instance ${instanceId} completed`)
              updateInstanceState(instanceId, routeId, "completed", 1)

              if (onInstanceComplete) {
                onInstanceComplete(instanceId, routeId)
              }

              setTimeout(() => {
                removeInstance(instanceId, routeId)
              }, options.cleanupDelay || 2000)
            },
          })

          // Store in registry
          if (!instanceRefsRef.current.has(routeId)) {
            instanceRefsRef.current.set(routeId, new Map())
          }
          instanceRefsRef.current.get(routeId).set(instanceId, polyline)

          updateInstanceState(instanceId, routeId, "ready")

          return polyline
        } else {
          console.warn(
            `[RouteManager] initSnake not available for ${instanceId}`
          )
          updateInstanceState(instanceId, routeId, "error")
          return null
        }
      } catch (error) {
        console.error(`[RouteManager] Error creating ${instanceId}:`, error)
        updateInstanceState(instanceId, routeId, "error")
        return null
      }
    },
    [map, routesData, getCoordinates, updateInstanceState, onInstanceComplete]
  )

  /**
   * Remove a specific instance
   */
  const removeInstance = useCallback(
    (instanceId, routeId) => {
      const routeInstances = instanceRefsRef.current.get(routeId)
      if (!routeInstances) return

      const polyline = routeInstances.get(instanceId)
      if (!polyline) return

      try {
        console.log(`[RouteManager] Removing instance ${instanceId}`)

        if (polyline.removeSnake) {
          polyline.removeSnake()
        }
        if (map && map.hasLayer(polyline)) {
          map.removeLayer(polyline)
        }

        routeInstances.delete(instanceId)

        if (routeInstances.size === 0) {
          instanceRefsRef.current.delete(routeId)
        }

        setInstanceStates((prev) => {
          const next = new Map(prev)
          next.delete(instanceId)
          return next
        })
      } catch (error) {
        console.error(`[RouteManager] Error removing ${instanceId}:`, error)
      }
    },
    [map]
  )

  /**
   * Control an existing instance (start, stop, pause, resume, reset)
   */
  const controlInstance = useCallback(
    (instanceId, routeId, action, options = {}) => {
      const routeInstances = instanceRefsRef.current.get(routeId)
      const polyline = routeInstances?.get(instanceId)

      if (!polyline) {
        console.warn(
          `[RouteManager] Instance ${instanceId} not found for control`
        )
        return false
      }

      try {
        switch (action) {
          case "start":
            if (polyline.snakeIn) {
              setTimeout(() => {
                if (map && map.getContainer()) {
                  polyline.snakeIn(options)
                }
              }, 50)
            }
            break

          case "stop":
            if (polyline.snakeStop) {
              polyline.snakeStop()
              updateInstanceState(instanceId, routeId, "stopped")
            }
            break

          case "pause":
            if (polyline.snakePause) {
              polyline.snakePause()
              updateInstanceState(instanceId, routeId, "paused")
            }
            break

          case "resume":
            if (polyline.snakeResume) {
              polyline.snakeResume()
            }
            break

          case "reset":
            if (polyline.snakeReset) {
              polyline.snakeReset()
              updateInstanceState(instanceId, routeId, "ready")
            }
            break

          case "remove":
            removeInstance(instanceId, routeId)
            break

          default:
            console.warn(`[RouteManager] Unknown action: ${action}`)
            return false
        }

        return true
      } catch (error) {
        console.error(
          `[RouteManager] Error executing ${action} for ${instanceId}:`,
          error
        )
        updateInstanceState(instanceId, routeId, "error")
        return false
      }
    },
    [map, removeInstance, updateInstanceState]
  )

  /**
   * Get all instances for a specific route
   */
  const getRouteInstances = useCallback(
    (routeId) => {
      const instances = []
      const routeInstances = instanceRefsRef.current.get(routeId)

      if (routeInstances) {
        routeInstances.forEach((polyline, instanceId) => {
          const state = instanceStates.get(instanceId)
          instances.push({
            instanceId,
            polyline,
            ...state,
          })
        })
      }

      return instances
    },
    [instanceStates]
  )

  /**
   * Get instance count for a route
   */
  const getInstanceCount = useCallback((routeId) => {
    const routeInstances = instanceRefsRef.current.get(routeId)
    return routeInstances ? routeInstances.size : 0
  }, [])

  /**
   * Get total instance count across all routes
   */
  const getTotalInstanceCount = useCallback(() => {
    let total = 0
    instanceRefsRef.current.forEach((routeInstances) => {
      total += routeInstances.size
    })
    return total
  }, [])

  /**
   * Check if control has been processed
   */
  const hasProcessedControl = useCallback((controlKey) => {
    return processedControlsRef.current.has(controlKey)
  }, [])

  /**
   * Mark control as processed
   */
  const markControlProcessed = useCallback((controlKey) => {
    processedControlsRef.current.add(controlKey)

    // Clean up old processed controls
    if (processedControlsRef.current.size > 100) {
      const entries = Array.from(processedControlsRef.current)
      processedControlsRef.current = new Set(entries.slice(-100))
    }
  }, [])

  /**
   * Cleanup all instances on unmount
   */
  useEffect(() => {
    return () => {
      console.log("[RouteManager] Cleaning up all instances")
      instanceRefsRef.current.forEach((routeInstances, routeId) => {
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
              `[RouteManager] Cleanup error for ${instanceId}:`,
              error
            )
          }
        })
      })
      instanceRefsRef.current.clear()
      processedControlsRef.current.clear()
    }
  }, [map])

  return {
    // State
    instanceStates,

    // Instance operations
    createInstance,
    removeInstance,
    controlInstance,

    // Query methods
    getRouteInstances,
    getInstanceCount,
    getTotalInstanceCount,

    // Control tracking
    hasProcessedControl,
    markControlProcessed,
  }
}

export default useRouteManager
