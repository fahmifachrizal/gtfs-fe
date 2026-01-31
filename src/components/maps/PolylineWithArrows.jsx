import { useEffect } from "react"
import { useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet-polylinedecorator"

// Component to add directional arrows to a polyline
export function PolylineWithArrows({ positions, color, routeId, directionId }) {
    const map = useMap()

    useEffect(() => {
        if (!positions || positions.length < 2) return

        // Create the base polyline
        const polyline = L.polyline(positions, {
            color: color,
            weight: 4,
            opacity: 0.8,
            lineJoin: "round",
            lineCap: "round",
        }).addTo(map)

        // Add arrow decorators
        const decorator = L.polylineDecorator(polyline, {
            patterns: [
                {
                    offset: "10%",
                    repeat: "15%",
                    symbol: L.Symbol.arrowHead({
                        pixelSize: 8,
                        polygon: false,
                        pathOptions: {
                            stroke: true,
                            color: color,
                            weight: 2,
                            opacity: 0.9,
                        },
                    }),
                },
            ],
        }).addTo(map)

        // Cleanup function
        return () => {
            map.removeLayer(polyline)
            map.removeLayer(decorator)
        }
    }, [map, positions, color, routeId, directionId])

    return null
}
