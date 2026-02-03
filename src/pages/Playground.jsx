"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useEditorContext } from "../contexts/EditorContext"
import { useUser } from "../contexts/UserContext"
import { service } from "@/services"
import { toast } from "sonner"
import LeafletDynamic from "../components/maps/leaflet-dynamic"
import { ProjectSelectionDialog } from "@/components/playground/ProjectSelectionDialog"
import { TripSelector } from "@/components/playground/TripSelector"
import Timeline from "@/components/Timeline"

export default function Playground() {
  // Context hooks
  const { currentProject, setCurrentProject } = useUser()
  const { updateMapData, clearMap, setMapBounds, mapData, mapBounds } = useEditorContext()

  // State management
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false)
  // routeGroups shape:  { [route_id]: { [direction_id]: [trip, ...] } }
  const [routeGroups, setRouteGroups] = useState({})
  const [selectedTrip, setSelectedTrip] = useState(null)
  const [isLoadingGroups, setIsLoadingGroups] = useState(false)
  const [isLoadingRouteData, setIsLoadingRouteData] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [animatedRoutes, setAnimatedRoutes] = useState([])
  const [routeWaypoints, setRouteWaypoints] = useState([])
  const [timelineSpeed, setTimelineSpeed] = useState(1)
  const [routeColor, setRouteColor] = useState("3388ff")

  // Ref to guard against stale closures firing loadTripRouteData after a newer one started
  const loadGenRef = useRef(0)

  // ── fetch grouped routes whenever project changes ──────────────────────
  useEffect(() => {
    if (currentProject) {
      loadRouteGroups()
    }
  }, [currentProject])

  const loadRouteGroups = async () => {
    if (!currentProject) return
    setIsLoadingGroups(true)
    try {
      const { success, data } = await service.routes.getRouteGroups(currentProject.id)
      if (success && data && Object.keys(data).length > 0) {
        setRouteGroups(data)

        // Auto-select the very first route → first direction → first trip
        const firstRouteId = Object.keys(data)[0]
        const firstDirection = Object.keys(data[firstRouteId])[0]
        const firstTrip = data[firstRouteId][firstDirection][0]
        if (firstTrip) {
          setSelectedTrip(firstTrip)
          // Kick off the map draw (pass trip directly – state not committed yet)
          loadTripRouteData(firstTrip)
        }
      } else {
        setRouteGroups({})
        toast.info("No trips found in this project")
      }
    } catch (error) {
      console.error("[Playground] Failed to load route groups:", error)
      toast.error("Failed to load route groups")
      setRouteGroups({})
    } finally {
      setIsLoadingGroups(false)
    }
  }

  // ── draw a single trip on the map ──────────────────────────────────────
  const loadTripRouteData = async (trip) => {
    if (!currentProject || !trip || !trip.route_id) return

    // Bump generation so any in-flight older call becomes a no-op
    const gen = ++loadGenRef.current

    // Stop everything on the map immediately
    setIsPlaying(false)
    setAnimatedRoutes([])
    setRouteWaypoints([])
    clearMap()
    setMapBounds(null)

    setIsLoadingRouteData(true)
    try {
      const directionId = parseInt(trip.direction_id || 0)

      const [routeDetailsResponse, response] = await Promise.all([
        service.routes.getRouteDetails(currentProject.id, trip.route_id),
        service.routes.getRoutePathAndStops(currentProject.id, trip.route_id, directionId),
      ])

      // If a newer call started while we were awaiting, bail out
      if (gen !== loadGenRef.current) return

      // ── route colour ────────────────────────────────────────────────
      const color =
        routeDetailsResponse.success && routeDetailsResponse.data?.route_color
          ? routeDetailsResponse.data.route_color
          : "3388ff"
      setRouteColor(color)

      if (!response.success || !response.data) {
        toast.warning("No route data available for this trip")
        return
      }

      const polyline = response.data.polyline || []
      const stops = response.data.stops || []

      if (stops.length === 0) {
        toast.warning("No stops found for this trip direction")
        return
      }

      // Store polyline for animation
      setRouteWaypoints(polyline)

      // ── build GeoJSON ───────────────────────────────────────────────
      const features = []

      if (polyline.length > 0) {
        features.push({
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: polyline.map(pt => [pt.longitude, pt.latitude]),
          },
          properties: { type: "shape-path", route_color: color },
        })
      }

      stops.forEach((stop, index) => {
        if (stop.stop_lat && stop.stop_lon) {
          features.push({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [stop.stop_lon, stop.stop_lat],
            },
            properties: {
              type: "stop",
              stop_id: stop.stop_id,
              stop_name: stop.stop_name,
              stop_sequence: stop.stop_sequence || index + 1,
              markerColor: "white",
            },
          })
        }
      })

      // ── bounds ──────────────────────────────────────────────────────
      const allPoints = [
        ...stops.filter(s => s.stop_lat && s.stop_lon),
        ...polyline
          .filter(pt => pt.latitude && pt.longitude)
          .map(pt => ({ stop_lat: pt.latitude, stop_lon: pt.longitude })),
      ]
      const bounds = calculateBounds(allPoints)
      if (bounds) setMapBounds(bounds)

      updateMapData({ type: "FeatureCollection", features })
      toast.success(`Loaded route with ${stops.length} stops${polyline.length ? ` and ${polyline.length} waypoints` : ""}`)

      // Auto-start animation
      setIsPlaying(true)
    } catch (error) {
      console.error("[Playground] Failed to load route data:", error)
      toast.error("Failed to load route visualization")
    } finally {
      setIsLoadingRouteData(false)
    }
  }

  // ── bounds helper ───────────────────────────────────────────────────────
  const calculateBounds = (points) => {
    if (!points || points.length === 0) return null

    let minLat = Infinity, maxLat = -Infinity
    let minLon = Infinity, maxLon = -Infinity

    points.forEach(p => {
      if (p.stop_lat && p.stop_lon) {
        minLat = Math.min(minLat, p.stop_lat)
        maxLat = Math.max(maxLat, p.stop_lat)
        minLon = Math.min(minLon, p.stop_lon)
        maxLon = Math.max(maxLon, p.stop_lon)
      }
    })

    if (!isFinite(minLat) || !isFinite(maxLat)) return null

    const latPad = Math.max((maxLat - minLat) * 0.1, 0.005)
    const lonPad = Math.max((maxLon - minLon) * 0.1, 0.005)

    return [
      [minLat - latPad, minLon - lonPad],
      [maxLat + latPad, maxLon + lonPad],
    ]
  }

  // ── project dialog ──────────────────────────────────────────────────────
  const handleProjectSelect = (project) => {
    setCurrentProject(project)
    setIsProjectDialogOpen(false)
  }

  // ── trip selection (called by TripSelector) ────────────────────────────
  const handleTripChange = (tripId) => {
    // Find the trip across all groups
    for (const routeId of Object.keys(routeGroups)) {
      for (const direction of Object.keys(routeGroups[routeId])) {
        const found = routeGroups[routeId][direction].find(
          t => String(t.trip_id) === String(tripId)
        )
        if (found) {
          setSelectedTrip(found)
          loadTripRouteData(found)
          return
        }
      }
    }
  }

  // ── timeline controls ───────────────────────────────────────────────────
  const handlePlayPause = () => {
    const next = !isPlaying
    setIsPlaying(next)
    if (next && routeWaypoints.length > 0 && selectedTrip) {
      createAnimatedRoute()
    } else {
      setAnimatedRoutes([])
    }
  }

  const handleReset = () => {
    setIsPlaying(false)
    setAnimatedRoutes([])
  }

  // ── animated route builder ──────────────────────────────────────────────
  const createAnimatedRoute = useCallback(() => {
    if (routeWaypoints.length === 0 || !selectedTrip) return

    const baseSpeed = 400
    const adjustedSpeed = baseSpeed * timelineSpeed

    const routeGeojson = {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: routeWaypoints.map(pt => [pt.longitude, pt.latitude]),
        },
        properties: { type: "route", route_id: selectedTrip.route_id },
      }],
    }

    // 5-minute headway: 5 / (10 * speed) real seconds between spawns
    const intervalSeconds = 0.5 / timelineSpeed

    setAnimatedRoutes([{
      id: `route-${selectedTrip.route_id}-${selectedTrip.direction_id}`,
      geojsonData: routeGeojson,
      config: {
        speed: adjustedSpeed,
        color: `#${routeColor}`,
        weight: 6,
        opacity: 0.8,
        maxInstances: 36,
        autoStart: true,
        intervalSeconds,
        cleanupDelay: 2000,
        markerColor: "blue",
      },
    }])
  }, [routeWaypoints, selectedTrip, timelineSpeed, routeColor])

  // Kick animation when we start playing or speed changes
  useEffect(() => {
    if (isPlaying && routeWaypoints.length > 0 && selectedTrip) {
      createAnimatedRoute()
    }
  }, [isPlaying, routeWaypoints, selectedTrip, timelineSpeed, createAnimatedRoute])

  // ── render ──────────────────────────────────────────────────────────────
  return (
    <div className="relative h-[calc(100vh-3.5rem)] w-full overflow-hidden">
      <div className="relative h-full w-full">
        {/* Full-Screen Map */}
        <LeafletDynamic
          center={[-6.175389, 106.827139]}
          zoom={13}
          className="h-full w-full"
          geojsonData={mapData}
          bounds={mapBounds}
          routes={animatedRoutes}
          onInstanceCreate={() => {}}
          onInstanceComplete={() => {}}
          onProgress={() => {}}
          onMarkerDragEnd={null}
          rightPadding={352}
          bottomPadding={200}
        />

        {/* Trip Selector panel */}
        {currentProject && (
          <TripSelector
            routeGroups={routeGroups}
            selectedTrip={selectedTrip}
            onTripChange={handleTripChange}
            isLoading={isLoadingRouteData || isLoadingGroups}
          />
        )}

        {/* Timeline bar */}
        {currentProject && selectedTrip && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-1000">
            <Timeline
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              onReset={handleReset}
              onSpeedChange={setTimelineSpeed}
            />
          </div>
        )}
      </div>

      <ProjectSelectionDialog
        open={isProjectDialogOpen}
        onProjectSelect={handleProjectSelect}
      />
    </div>
  )
}
