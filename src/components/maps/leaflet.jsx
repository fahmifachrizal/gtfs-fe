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
import { useEffect, useMemo, useState } from "react"
import PolylineHandler from "./PolylineHandler"
import { useTheme } from "next-themes"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin } from "lucide-react"

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
  onInstanceCreate = null,
  onInstanceComplete = null,
  onProgress = null,
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
          mounted={mounted}
          onInstanceCreate={onInstanceCreate}
          onInstanceComplete={onInstanceComplete}
          onProgress={onProgress}
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
}) {
  const map = useMap()

  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])

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
          const color = route_color ? `${route_color}` : "#FF0000"
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
          const bgColor = isSelected
            ? "#fbbf24"
            : currentTheme === "dark"
            ? "#374151"
            : "#f3f4f6"

          const borderColor = isSelected
            ? "#d97706"
            : currentTheme === "dark"
            ? "#6b7280"
            : "#9ca3af"

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
          <Card className="min-w-[200px] border-none shadow-lg">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MapPin
                  className="w-4 h-4"
                  style={{ color: route_color ? `#${route_color}` : "#3b82f6" }}
                />
                {stop_name}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-1">
              <div className="text-xs text-muted-foreground">
                Stop ID: <span className="font-mono">{stop_id}</span>
              </div>
              {route_short_name && (
                <div className="text-xs text-muted-foreground">
                  Route:{" "}
                  <span className="font-semibold">{route_short_name}</span>
                </div>
              )}
              {stop_sequence && (
                <div className="text-xs text-muted-foreground">
                  Sequence: <span className="font-medium">{stop_sequence}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="min-w-[180px] border-none shadow-lg">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                {stop_name}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-1">
              <div className="text-xs text-muted-foreground">
                ID: <span className="font-mono">{stop_id}</span>
              </div>
            </CardContent>
          </Card>
        )

        markers.push(
          <Marker key={`${stop_id}-${index}`} position={[lat, lon]} icon={icon}>
            <Popup>{popupContent}</Popup>
          </Marker>
        )
      } else if (feature.geometry?.type === "LineString") {
        // Only render static lines if no animated routes are provided
        if (!routes || routes.length === 0) {
          const coordinates = feature.geometry.coordinates.map((coord) => [
            coord[1],
            coord[0],
          ])
          const { route_id, direction_id, route_color } =
            feature.properties || {}

          const color = route_color ? `#${route_color}` : "#FF0000"

          staticRouteLines.push(
            <Polyline
              key={`route-${route_id}-${direction_id}-${index}`}
              positions={coordinates}
              pathOptions={{
                color: color,
                weight: 4,
                opacity: 0.8,
                lineJoin: "round",
                lineCap: "round",
              }}
            />
          )
        }
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
      {/* Render static route lines if no animated routes */}
      {(!routes || routes.length === 0) && staticRouteLines}
      {markers}
    </>
  )
}
