import React from "react"
import { Map } from "react-map-gl/mapbox"
import "mapbox-gl/dist/mapbox-gl.css"

export default function App() {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  const bounds = [
    [106.6250, -6.3750], // Southwest coordinates
    [107.0500, -6.0000], // Northeast coordinates
  ]

  return (
    <Map
      initialViewState={{
        longitude: 106.827139,
        latitude: -6.175389,
        zoom: 12,
      }}
      mapStyle="mapbox://styles/mapbox/dark-v11"
      mapboxAccessToken={mapboxToken} maxBounds={bounds}></Map>
  )
}
