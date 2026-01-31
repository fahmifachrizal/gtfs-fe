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
  rightPadding = 0, // New prop
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
        whenReady={() => {
          console.log("[Map] Container ready")
        }}>
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
  bounds, // Add bounds prop
  rightPadding,
}) {
  const map = useMap()

  // Effect to handle bounds changes
  useEffect(() => {
    if (bounds && bounds.length === 2) {
      // Check if bounds are valid (not [0,0], [0,0] unless intended)
      // bounds format: [[lat1, lon1], [lat2, lon2]]
      try {
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 16,
          animate: true
        })
      } catch (e) {
        console.warn("Invalid bounds:", bounds)
      }
    }
  }, [bounds, map])

  useEffect(() => {
    if (rightPadding > 0) {
      // Calculate offset to keeping "center" visible in the remaining space
      // Visual center shifts left by rightPadding / 2
      // We need to shift the View Right (map center moves right visually) -> No.
      // We want the 'center' coordinate to appear at (Width - rightPadding) / 2.
      // The container geometric center is Width / 2.
      // So we want 'center' to be at (Width/2) - (rightPadding/2).
      // It is shifted Left by rightPadding/2.
      // So we need to center the map on a point that is Right of 'center' by rightPadding/2.

      const offset = rightPadding / 2
      const centerPoint = map.project(center, zoom)
      const targetPoint = centerPoint.add([offset, 0])
      const targetLatLng = map.unproject(targetPoint, zoom)

      map.setView(targetLatLng, zoom)
    } else if (!bounds) { // Only set view if no bounds are provided to avoid conflict? Or let bounds override?
      // If bounds are present, fitBounds handles the view.
      // If ONLY center/zoom are present, setView.
      // But usually user interaction changes center.
      // We should only force setView if center changed explicitly?
      map.setView(center, zoom)
    }
  }, [center, zoom, map, rightPadding, bounds])

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
        } = feature.properties || {}

        const isRouteStop = type === "route" || type === "stop"

        let icon
        if (isRouteStop) {
          const color = formatRouteColor(route_color)
          const size = isSelected ? 22 : 16
          const borderWidth = isSelected ? 4 : 3
          const borderColor = isSelected
            ? "#FFD700"
            : currentTheme === "dark"
              ? "#333"
              : "white"

          icon = L.divIcon({
            className: "route-stop-marker",
            html: `
              <div style="
                width: ${size}px;
                height: ${size}px;
                background-color: ${color};
                border: ${borderWidth}px solid ${borderColor};
                border-radius: 50%;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                position: relative;
                z-index: ${isSelected ? 2000 : 1000};
              "></div>
            `,
            iconSize: [size + borderWidth * 2, size + borderWidth * 2],
            iconAnchor: [size / 2 + borderWidth, size / 2 + borderWidth],
          })
        } else {
          // Helper to convert hex to rgba
          const hexToRgba = (hex, alpha) => {
            const r = parseInt(hex.slice(1, 3), 16)
            const g = parseInt(hex.slice(3, 5), 16)
            const b = parseInt(hex.slice(5, 7), 16)
            return `rgba(${r}, ${g}, ${b}, ${alpha})`
          }

          const alpha = isPreview ? 0.5 : 1

          const bgHex = isSelected
            ? "#fbbf24"
            : currentTheme === "dark"
              ? "#374151"
              : "#f3f4f6"

          const bgColor = hexToRgba(bgHex, alpha)

          const borderHex = isSelected
            ? "#d97706"
            : currentTheme === "dark"
              ? "#6b7280"
              : "#9ca3af"

          const borderColor = hexToRgba(borderHex, alpha)

          icon = L.divIcon({
            className: "regular-stop-marker",
            html: `
              <div style="
                width: 12px;
                height: 12px;
                background-color: ${bgColor};
                border: 2px solid ${borderColor};
                border-radius: 50%;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              "></div>
            `,
            iconSize: [12, 12],
            iconAnchor: [6, 6],
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
          <Marker key={`${stop_id}-${index}`} position={[lat, lon]} icon={icon}>
            <Popup className="transparent-popup">{popupContent}</Popup>
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
