"use client"

import {
  MapContainer,
  TileLayer,
  useMap,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet"
import L from "leaflet"
import "leaflet-polylinedecorator"
import { useEffect, useMemo, useState } from "react"
import PolylineHandler from "./PolylineHandler"
import { PolylineWithArrows } from "./PolylineWithArrows"
import { useTheme } from "next-themes"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin } from "lucide-react"

// Helper function to format route color
const formatRouteColor = (color) => {
  if (!color) return "#FF0000"
  // If color already has #, return as is
  if (color.startsWith("#")) return color
  // Otherwise add # prefix
  return `#${color}`
}

// Fix for default markers in Next.js
const DefaultIcon = L.icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

L.Marker.prototype.options.icon = DefaultIcon

export default function Map({
  center = [-6.175389, 106.827139],
  zoom = 13,
  className = "h-full w-full",
  geojsonData,
  routes = [],
  bounds = null,
  onInstanceCreate = null,
  onInstanceComplete = null,
  onProgress = null,
  rightPadding = 0,
  bottomPadding = 0,
  onMarkerDragEnd = null, // New prop for handling marker drag
}) {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentTheme = mounted ? resolvedTheme || theme : "light"

  return (
    <div className={className + " relative"}>
      <MapContainer
        center={center}
        zoom={zoom}
        zoomControl={false}
        style={{
          height: "100%",
          width: "100%",
          minHeight: "400px",
          backgroundColor: currentTheme === "dark" ? "#090909" : "#fafaf8",
        }}
        whenCreated={(mapInstance) => {
          setTimeout(() => {
            mapInstance.invalidateSize()
          }, 100)
        }}
        whenReady={() => {}}>
        <MapChild
          center={center}
          zoom={zoom}
          geojsonData={geojsonData}
          currentTheme={currentTheme}
          routes={routes}
          bounds={bounds}
          mounted={mounted}
          onInstanceCreate={onInstanceCreate}
          onInstanceComplete={onInstanceComplete}
          onProgress={onProgress}
          rightPadding={rightPadding}
          bottomPadding={bottomPadding}
          onMarkerDragEnd={onMarkerDragEnd}
        />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={
            currentTheme === "dark"
              ? "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
              : "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
          }
        />
      </MapContainer>
    </div>
  )
}

function MapChild({
  center,
  zoom,
  geojsonData,
  currentTheme,
  routes,
  mounted,
  onInstanceCreate,
  onInstanceComplete,
  onProgress,
  bounds,
  rightPadding,
  bottomPadding,
  onMarkerDragEnd,
}) {
  const map = useMap()

  // Effect to handle bounds changes
  useEffect(() => {
    if (bounds && bounds.length === 2) {
      // Check if bounds are valid (not [0,0], [0,0] unless intended)
      // bounds format: [[lat1, lon1], [lat2, lon2]]
      try {
        // Account for right sidebar and bottom timeline by adding asymmetric padding
        const basePadding = 80
        map.fitBounds(bounds, {
          paddingTopLeft: [basePadding, basePadding],
          paddingBottomRight: [basePadding + rightPadding, basePadding + bottomPadding],
          maxZoom: 16,
          animate: true,
          duration: 0.5
        })
      } catch (e) {
        console.warn("Invalid bounds:", bounds)
      }
    }
  }, [bounds, map, rightPadding, bottomPadding])

  useEffect(() => {
    // When bounds are present fitBounds already accounts for padding –
    // do nothing here so the two effects don't race each other.
    if (bounds) return

    if (rightPadding > 0) {
      const offset = rightPadding / 2
      const centerPoint = map.project(center, map.getZoom())
      const targetPoint = centerPoint.add([offset, 0])
      const targetLatLng = map.unproject(targetPoint, map.getZoom())
      map.setView(targetLatLng, zoom)
    } else {
      map.setView(center, zoom)
    }
  }, [center, zoom, map, rightPadding, bottomPadding, bounds])

  useEffect(() => {
    const mapContainer = map.getContainer()
    mapContainer.style.backgroundColor =
      currentTheme === "dark" ? "#090909" : "#fafaf8"
  }, [currentTheme, map])

  // Extract route lines and markers from GeoJSON
  const { markers, staticRouteLines } = useMemo(() => {
    if (!geojsonData || geojsonData.type !== "FeatureCollection")
      return { markers: [], staticRouteLines: [] }

    const markers = []
    const staticRouteLines = []

    geojsonData.features.forEach((feature, index) => {
      if (feature.geometry?.type === "Point") {
        const [lon, lat] = feature.geometry.coordinates
        const {
          stop_name,
          stop_id,
          type,
          route_color,
          route_short_name,
          stop_sequence,
          isSelected,
          isWaypoint,
          isDraggable,
          waypointIndex,
          isPreview,
        } = feature.properties || {}

        const isRouteStop = type === "route" || type === "stop"

        // Determine if marker should be draggable - only if explicitly set to true
        const draggable = isDraggable === true

        let icon
        if (isPreview) {
          // Preview waypoint marker (semi-transparent, uses route color if available)
          const size = 12
          const markerColor = feature.properties?.markerColor || '3388ff'
          const previewColor = markerColor === 'orange' ? 'rgba(249, 115, 22, 0.5)' : `rgba(51, 136, 255, 0.5)`
          const borderColor = markerColor === 'orange' ? 'rgba(249, 115, 22, 0.8)' : `rgba(51, 136, 255, 0.8)`

          icon = L.divIcon({
            className: "preview-waypoint-marker",
            html: `
              <div style="
                width: ${size}px;
                height: ${size}px;
                background-color: ${previewColor};
                border: 2px solid ${borderColor};
                border-radius: 50%;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                z-index: 1900;
              "></div>
            `,
            iconSize: [size + 4, size + 4],
            iconAnchor: [size / 2 + 2, size / 2 + 2],
          })
        } else if (type === 'stop' && feature.properties?.markerColor === 'white') {
          // White stop marker (circular, not draggable) - for Playground
          const size = 12
          const color = "#ffffff"
          const borderColor = currentTheme === "dark" ? "#666" : "#333"

          icon = L.divIcon({
            className: "stop-marker-white",
            html: `
              <div style="
                width: ${size}px;
                height: ${size}px;
                background-color: ${color};
                border: 2px solid ${borderColor};
                border-radius: 50%;
                box-shadow: 0 2px 6px rgba(0,0,0,0.4);
                cursor: pointer;
                z-index: 1600;
              "></div>
            `,
            iconSize: [size + 4, size + 4],
            iconAnchor: [size / 2 + 2, size / 2 + 2],
          })
        } else if (type === 'stop' && feature.properties?.markerColor === 'red') {
          // Red stop marker (circular, not draggable)
          // Z-index: 1600 (between waypoint and selected)
          const size = 12
          const color = "#ef4444"
          const borderColor = currentTheme === "dark" ? "#333" : "white"

          icon = L.divIcon({
            className: "stop-marker-red",
            html: `
              <div style="
                width: ${size}px;
                height: ${size}px;
                background-color: ${color};
                border: 2px solid ${borderColor};
                border-radius: 50%;
                box-shadow: 0 2px 6px rgba(0,0,0,0.4);
                cursor: pointer;
                z-index: 1600;
              "></div>
            `,
            iconSize: [size + 4, size + 4],
            iconAnchor: [size / 2 + 2, size / 2 + 2],
          })
        } else if (isWaypoint || type === 'waypoint') {
          // Custom waypoint marker (blue/route color, draggable only if selected)
          const markerColor = feature.properties?.markerColor || '3388ff'
          const isSelected = feature.properties?.isSelected || false
          const size = isSelected ? 16 : 12
          const borderWidth = isSelected ? 3 : 2
          const color = markerColor === 'orange' ? '#f97316' : `#${markerColor}`
          const borderColor = isSelected ? 'white' : currentTheme === "dark" ? "#333" : "white"

          icon = L.divIcon({
            className: "waypoint-marker",
            html: `
              <div style="
                width: ${size}px;
                height: ${size}px;
                background-color: ${color};
                border: ${borderWidth}px solid ${borderColor};
                border-radius: 50%;
                box-shadow: 0 2px 6px rgba(0,0,0,0.4);
                cursor: ${draggable ? 'grab' : 'pointer'};
                z-index: ${isSelected ? 2000 : 1500};
              "></div>
            `,
            iconSize: [size + borderWidth * 2, size + borderWidth * 2],
            iconAnchor: [size / 2 + borderWidth, size / 2 + borderWidth],
          })
        } else if (isRouteStop) {
          // Route stops should be red like in the legend
          const size = 12
          const color = "#ef4444" // Red color matching legend
          const borderColor = currentTheme === "dark" ? "#333" : "white"

          icon = L.divIcon({
            className: "route-stop-marker",
            html: `
              <div style="
                width: ${size}px;
                height: ${size}px;
                background-color: ${color};
                border: 2px solid ${borderColor};
                border-radius: 50%;
                box-shadow: 0 2px 6px rgba(0,0,0,0.4);
                cursor: pointer;
                z-index: 1600;
              "></div>
            `,
            iconSize: [size + 4, size + 4],
            iconAnchor: [size / 2 + 2, size / 2 + 2],
          })
        } else {
          // Regular stops (StopsPage) - should be red like legend
          const size = 12
          const color = "#ef4444" // Red color matching legend
          const borderColor = currentTheme === "dark" ? "#333" : "white"

          icon = L.divIcon({
            className: "regular-stop-marker",
            html: `
              <div style="
                width: ${size}px;
                height: ${size}px;
                background-color: ${color};
                border: 2px solid ${borderColor};
                border-radius: 50%;
                box-shadow: 0 2px 6px rgba(0,0,0,0.4);
                cursor: pointer;
                z-index: 1600;
              "></div>
            `,
            iconSize: [size + 4, size + 4],
            iconAnchor: [size / 2 + 2, size / 2 + 2],
          })
        }

        const textColor = currentTheme === "dark" ? "#e5e7eb" : "#374151"
        const secondaryTextColor =
          currentTheme === "dark" ? "#9ca3af" : "#6b7280"

        const popupContent = isRouteStop ? (
          <Card className="min-w-40 w-auto border-none shadow-sm p-2 gap-2">
            <CardHeader className="p-2 pb-0">
              <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                <MapPin
                  className="w-3.5 h-3.5"
                  style={{ color: route_color ? `#${route_color}` : "#3b82f6" }}
                />
                {stop_name}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0 space-y-0.5">
              <div className="text-[10px] text-muted-foreground">
                <span className="font-mono">{stop_id}</span>
              </div>
              {route_short_name && (
                <div className="text-[10px] text-muted-foreground">
                  Route:{" "}
                  <span className="font-semibold">{route_short_name}</span>
                </div>
              )}
              {stop_sequence && (
                <div className="text-[10px] text-muted-foreground">
                  Seq: <span className="font-medium">{stop_sequence}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="min-w-32 w-auto border-none shadow-sm">
            <CardHeader className="p-2 pb-1">
              <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                {stop_name} caaa
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0 space-y-0.5">
              <div className="text-[10px] text-muted-foreground">
                <span className="font-mono">{stop_id}</span>
              </div>
            </CardContent>
          </Card>
        )

        markers.push(
          <Marker
            key={`${stop_id || `marker-${index}`}-${index}`}
            position={[lat, lon]}
            icon={icon}
            draggable={draggable}
            eventHandlers={{
              dragend: (e) => {
                if (onMarkerDragEnd) {
                  const marker = e.target
                  const position = marker.getLatLng()
                  onMarkerDragEnd({
                    lat: position.lat,
                    lon: position.lng,
                    waypointIndex,
                    feature,
                  })
                }
              },
            }}
          >
            {!isPreview && <Popup className="transparent-popup">{popupContent}</Popup>}
          </Marker>
        )
      } else if (feature.geometry?.type === "LineString") {
        const coordinates = feature.geometry.coordinates.map((coord) => [
          coord[1],
          coord[0],
        ])
        const { route_id, direction_id, route_color } =
          feature.properties || {}

        const color = formatRouteColor(route_color)

        staticRouteLines.push(
          <PolylineWithArrows
            key={`route-${route_id}-${direction_id}-${index}`}
            positions={coordinates}
            color={color}
            routeId={route_id}
            directionId={direction_id}
          />
        )
      }
    })

    return { markers, staticRouteLines }
  }, [geojsonData, currentTheme, routes])

  return (
    <>
      {/* Render animated routes if provided */}
      {mounted && routes && routes.length > 0 && (
        <PolylineHandler
          routes={routes}
          onInstanceCreate={onInstanceCreate}
          onInstanceComplete={onInstanceComplete}
          onProgress={onProgress}
        />
      )}
      {/* Render static route lines */}
      {staticRouteLines}
      {markers}
    </>
  )
}
