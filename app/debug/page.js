"use client"
import React, { useEffect, useState, useRef, useCallback } from "react"
import dynamic from "next/dynamic"
import "@/node_modules/leaflet/dist/leaflet.css"
import { Play, Pause, RotateCcw, Trash2, Plus, Settings } from "lucide-react"

// Dynamic import to avoid SSR issues
const HeroDynamic = dynamic(
  () => import("@/components/maps/hero-section-dynamic"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full"></div>
    ),
  }
)

export default function EnhancedDebugPage() {
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Instance tracking by route
  const [instances, setInstances] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    byRoute: {},
  })

  // Route configurations
  const routeDefinitions = [
    {
      id: "route-1-outbound",
      name: "Route 1 Outbound",
      apiParams: { number: 1, dir: "outbound" },
      config: {
        speed: 300,
        color: "#ff6b35",
        weight: 4,
        opacity: 1,
        intervalSeconds: 2,
        maxInstances: 3,
        autoStart: true,
        cleanupDelay: 2000,
        markerColor: "orange",
      },
    },
    {
      id: "route-1-inbound",
      name: "Route 1 Inbound",
      apiParams: { number: 1, dir: "inbound" },
      config: {
        speed: 400,
        color: "#4ecdc4",
        weight: 4,
        opacity: 1,
        intervalSeconds: 2.5,
        maxInstances: 3,
        autoStart: true,
        cleanupDelay: 2000,
        markerColor: "cyan",
      },
    },
    {
      id: "route-2-outbound",
      name: "Route 2 Outbound",
      apiParams: { number: 2, dir: "outbound" },
      config: {
        speed: 350,
        color: "#95e1d3",
        weight: 4,
        opacity: 1,
        intervalSeconds: 3,
        maxInstances: 2,
        autoStart: true,
        cleanupDelay: 2000,
        markerColor: "emerald",
      },
    },
  ]

  const [routeConfigs, setRouteConfigs] = useState(
    routeDefinitions.reduce((acc, route) => {
      acc[route.id] = route.config
      return acc
    }, {})
  )

  const [selectedRoute, setSelectedRoute] = useState(null)

  // Fetch all routes
  useEffect(() => {
    const fetchAllRoutes = async () => {
      try {
        setLoading(true)
        const fetchedRoutes = []

        for (const routeDef of routeDefinitions) {
          try {
            const { number, dir } = routeDef.apiParams
            const res = await fetch(`/api/route?number=${number}&dir=${dir}`)

            if (!res.ok) {
              console.error(`Failed to fetch ${routeDef.name}`)
              continue
            }

            const geojsonData = await res.json()
            fetchedRoutes.push({
              id: routeDef.id,
              name: routeDef.name,
              geojsonData,
              config: routeDef.config,
            })

            console.log(`Fetched ${routeDef.name}`)
          } catch (err) {
            console.error(`Error fetching ${routeDef.name}:`, err)
          }
        }

        setRoutes(fetchedRoutes)

        // Initialize stats for each route
        setStats((prev) => ({
          ...prev,
          byRoute: fetchedRoutes.reduce((acc, route) => {
            acc[route.id] = { active: 0, completed: 0, total: 0 }
            return acc
          }, {}),
        }))
      } catch (error) {
        console.error("Error loading routes:", error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAllRoutes()
  }, [])

  // Handle instance creation
  const handleInstanceCreate = useCallback(
    (instanceId, routeId, info) => {
      const timestamp = new Date().toLocaleTimeString()
      const route = routes.find((r) => r.id === routeId)

      setInstances((prev) => [
        ...prev,
        {
          id: instanceId,
          routeId,
          routeName: route?.name || routeId,
          status: "active",
          createdAt: timestamp,
          progress: 0,
          position: null,
        },
      ])

      setStats((prev) => ({
        total: prev.total + 1,
        active: prev.active + 1,
        completed: prev.completed,
        byRoute: {
          ...prev.byRoute,
          [routeId]: {
            ...prev.byRoute[routeId],
            active: (prev.byRoute[routeId]?.active || 0) + 1,
            total: (prev.byRoute[routeId]?.total || 0) + 1,
          },
        },
      }))

      console.log(`[Debug] Instance created: ${instanceId} on ${routeId}`, info)
    },
    [routes]
  )

  // Handle instance completion
  const handleInstanceComplete = useCallback((instanceId, routeId, info) => {
    setInstances((prev) =>
      prev.map((inst) =>
        inst.id === instanceId
          ? { ...inst, status: "completed", progress: 100 }
          : inst
      )
    )

    setStats((prev) => ({
      ...prev,
      active: Math.max(0, prev.active - 1),
      completed: prev.completed + 1,
      byRoute: {
        ...prev.byRoute,
        [routeId]: {
          ...prev.byRoute[routeId],
          active: Math.max(0, (prev.byRoute[routeId]?.active || 0) - 1),
          completed: (prev.byRoute[routeId]?.completed || 0) + 1,
        },
      },
    }))

    console.log(`[Debug] Instance completed: ${instanceId} on ${routeId}`, info)
  }, [])

  // Handle progress updates
  const handleProgress = useCallback(
    (instanceId, routeId, progress, latLng) => {
      setInstances((prev) =>
        prev.map((inst) =>
          inst.id === instanceId
            ? {
                ...inst,
                progress: Math.round(progress * 100),
                position: latLng
                  ? `${latLng.lat.toFixed(4)}, ${latLng.lng.toFixed(4)}`
                  : null,
              }
            : inst
        )
      )
    },
    []
  )

  // Update route configuration
  const updateRouteConfig = (routeId, key, value) => {
    setRouteConfigs((prev) => ({
      ...prev,
      [routeId]: {
        ...prev[routeId],
        [key]: value,
      },
    }))

    // Update the actual routes array
    setRoutes((prev) =>
      prev.map((route) =>
        route.id === routeId
          ? { ...route, config: { ...route.config, [key]: value } }
          : route
      )
    )
  }

  // Toggle route auto-start
  const toggleRouteAutoStart = (routeId) => {
    const currentConfig = routeConfigs[routeId]
    updateRouteConfig(routeId, "autoStart", !currentConfig.autoStart)
  }

  // Clear completed instances
  const clearCompleted = () => {
    setInstances((prev) => prev.filter((inst) => inst.status !== "completed"))
  }

  // Reset all
  const resetAll = () => {
    setInstances([])
    setStats({
      total: 0,
      active: 0,
      completed: 0,
      byRoute: routes.reduce((acc, route) => {
        acc[route.id] = { active: 0, completed: 0, total: 0 }
        return acc
      }, {}),
    })
  }

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading routes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error loading routes: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen bg-gray-900 flex">
      {/* Map Section */}
      <div className="flex-1 relative">
        <HeroDynamic
          center={[-6.175389, 106.827139]}
          zoom={13}
          routes={routes}
          className="h-full w-full"
          onInstanceCreate={handleInstanceCreate}
          onInstanceComplete={handleInstanceComplete}
          onProgress={handleProgress}
        />

        {/* Stats Overlay */}
        <div className="absolute top-4 left-4 bg-gray-800 bg-opacity-90 rounded-lg p-4 text-white shadow-lg max-w-xs">
          <h3 className="text-sm font-bold mb-3 text-gray-300">
            Overall Statistics
          </h3>
          <div className="space-y-1 text-sm mb-4">
            <div className="flex justify-between gap-4">
              <span className="text-gray-400">Total:</span>
              <span className="font-mono font-bold">{stats.total}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-green-400">Active:</span>
              <span className="font-mono font-bold text-green-400">
                {stats.active}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-blue-400">Completed:</span>
              <span className="font-mono font-bold text-blue-400">
                {stats.completed}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-3">
            <h4 className="text-xs font-bold mb-2 text-gray-400">By Route</h4>
            <div className="space-y-2">
              {routes.map((route) => {
                const routeStats = stats.byRoute[route.id] || {
                  active: 0,
                  completed: 0,
                  total: 0,
                }
                return (
                  <div key={route.id} className="text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: route.config.color }}
                      />
                      <span className="text-gray-300 font-medium truncate flex-1">
                        {route.name}
                      </span>
                    </div>
                    <div className="flex gap-3 ml-4 text-gray-400">
                      <span>
                        Active:{" "}
                        <span className="text-green-400">
                          {routeStats.active}
                        </span>
                      </span>
                      <span>
                        Done:{" "}
                        <span className="text-blue-400">
                          {routeStats.completed}
                        </span>
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Debug Panel */}
      <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white mb-4">Debug Panel</h2>

          {/* Route Selector */}
          <div className="mb-4">
            <label className="block text-xs text-gray-400 mb-2">
              Configure Route
            </label>
            <select
              value={selectedRoute || ""}
              onChange={(e) => setSelectedRoute(e.target.value || null)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm">
              <option value="">Select a route...</option>
              {routes.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.name}
                </option>
              ))}
            </select>
          </div>

          {/* Route Configuration */}
          {selectedRoute && routeConfigs[selectedRoute] && (
            <div className="space-y-3 mb-4 p-3 bg-gray-750 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-gray-300">
                  {routes.find((r) => r.id === selectedRoute)?.name}
                </h3>
                <button
                  onClick={() => toggleRouteAutoStart(selectedRoute)}
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    routeConfigs[selectedRoute].autoStart
                      ? "bg-green-600 text-white"
                      : "bg-gray-700 text-gray-400"
                  }`}>
                  {routeConfigs[selectedRoute].autoStart ? "ON" : "OFF"}
                </button>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Interval (seconds)
                </label>
                <input
                  type="number"
                  value={routeConfigs[selectedRoute].intervalSeconds}
                  onChange={(e) =>
                    updateRouteConfig(
                      selectedRoute,
                      "intervalSeconds",
                      parseFloat(e.target.value)
                    )
                  }
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm"
                  min="0.1"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Max Instances
                </label>
                <input
                  type="number"
                  value={routeConfigs[selectedRoute].maxInstances}
                  onChange={(e) =>
                    updateRouteConfig(
                      selectedRoute,
                      "maxInstances",
                      parseInt(e.target.value)
                    )
                  }
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Speed (m/s)
                </label>
                <input
                  type="number"
                  value={routeConfigs[selectedRoute].speed}
                  onChange={(e) =>
                    updateRouteConfig(
                      selectedRoute,
                      "speed",
                      parseInt(e.target.value)
                    )
                  }
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm"
                  min="50"
                  step="50"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Line Color
                </label>
                <input
                  type="color"
                  value={routeConfigs[selectedRoute].color}
                  onChange={(e) =>
                    updateRouteConfig(selectedRoute, "color", e.target.value)
                  }
                  className="w-full h-10 bg-gray-700 rounded cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Line Weight
                </label>
                <input
                  type="range"
                  value={routeConfigs[selectedRoute].weight}
                  onChange={(e) =>
                    updateRouteConfig(
                      selectedRoute,
                      "weight",
                      parseInt(e.target.value)
                    )
                  }
                  className="w-full"
                  min="1"
                  max="10"
                />
                <div className="text-xs text-gray-500 text-center">
                  {routeConfigs[selectedRoute].weight}px
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Marker Color
                </label>
                <select
                  value={routeConfigs[selectedRoute].markerColor}
                  onChange={(e) =>
                    updateRouteConfig(
                      selectedRoute,
                      "markerColor",
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm">
                  <option value="orange">Orange</option>
                  <option value="red">Red</option>
                  <option value="blue">Blue</option>
                  <option value="green">Green</option>
                  <option value="purple">Purple</option>
                  <option value="yellow">Yellow</option>
                  <option value="pink">Pink</option>
                  <option value="indigo">Indigo</option>
                  <option value="cyan">Cyan</option>
                  <option value="emerald">Emerald</option>
                </select>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={clearCompleted}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm">
              <Trash2 size={16} />
              Clear
            </button>
            <button
              onClick={resetAll}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm">
              <RotateCcw size={16} />
              Reset
            </button>
          </div>
        </div>

        {/* Instance List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-300">
              Instances ({instances.length})
            </h3>
          </div>

          <div className="space-y-2">
            {instances.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No instances yet
              </div>
            ) : (
              instances.map((instance) => {
                const route = routes.find((r) => r.id === instance.routeId)
                return (
                  <div
                    key={instance.id}
                    className={`p-3 rounded-lg border ${
                      instance.status === "active"
                        ? "bg-gray-700 border-green-600"
                        : "bg-gray-750 border-gray-600"
                    }`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {route && (
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: route.config.color }}
                            />
                          )}
                          <div className="text-xs font-medium text-gray-300">
                            {instance.routeName}
                          </div>
                        </div>
                        <div className="text-xs font-mono text-gray-400 truncate">
                          {instance.id}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {instance.createdAt}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          instance.status === "active"
                            ? "bg-green-600 text-white"
                            : "bg-blue-600 text-white"
                        }`}>
                        {instance.status}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-2">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>{instance.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-600 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            instance.status === "active"
                              ? "bg-green-500"
                              : "bg-blue-500"
                          }`}
                          style={{ width: `${instance.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Position */}
                    {instance.position && (
                      <div className="text-xs text-gray-400 font-mono">
                        {instance.position}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
