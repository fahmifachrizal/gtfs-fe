"use client"

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import L from "leaflet"
import { useState } from "react"
import PolylineHandler from "./PolylineHandler"
import { useTheme } from "next-themes"

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

/**
 * Enhanced Map Component with Multi-Route Animation Support
 *
 * @param {Array} center - Map center coordinates [lat, lng]
 * @param {number} zoom - Initial zoom level
 * @param {Array} markers - Array of marker objects {position, popup}
 * @param {string} className - CSS class name
 * @param {Array} routes - Array of route objects with geojsonData and config
 * @param {Function} onInstanceCreate - Callback when instance is created
 * @param {Function} onInstanceComplete - Callback when instance completes
 * @param {Function} onProgress - Callback for progress updates
 */
export default function MapHero({
  center = [-6.175389, 106.827139],
  zoom = 13,
  markers = [],
  className = "h-full w-full",
  routes = [],
  onInstanceCreate = null,
  onInstanceComplete = null,
  onProgress = null,
}) {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const currentTheme = mounted ? resolvedTheme || theme : "light"

  return (
    <div className={className}>
      <MapContainer
        center={center}
        zoom={zoom}
        zoomControl={false}
        className="bg-background"
        style={{
          height: "100%",
          width: "100%",
          minHeight: "400px",
          backgroundColor: "hsl(var(--background))",
        }}
        whenReady={() => {
          console.log("[Map] Container ready")
          setMounted(true)
        }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={
            currentTheme === "dark"
              ? "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
              : "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
          }
        />

        {mounted && routes.length > 0 && (
          <PolylineHandler
            routes={routes}
            onInstanceCreate={onInstanceCreate}
            onInstanceComplete={onInstanceComplete}
            onProgress={onProgress}
          />
        )}

        {markers.map((marker, index) => (
          <Marker key={index} position={marker.position}>
            <Popup>{marker.popup}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
