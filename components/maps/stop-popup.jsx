import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Navigation } from "lucide-react"

// Improved Leaflet Popup Component
export function StopPopup({
  stop,
  isRouteStop = false,
  currentTheme = "light",
}) {
  const {
    stop_name,
    stop_id,
    stop_code,
    route_short_name,
    stop_sequence,
    route_color,
  } = stop

  if (isRouteStop) {
    return (
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
              Route: <span className="font-semibold">{route_short_name}</span>
            </div>
          )}
          {stop_sequence && (
            <div className="text-xs text-muted-foreground">
              Sequence: <span className="font-medium">{stop_sequence}</span>
            </div>
          )}
          {stop_code && (
            <div className="text-xs text-muted-foreground">
              Code: <span className="font-mono">{stop_code}</span>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
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
        {stop_code && (
          <div className="text-xs text-muted-foreground">
            Code: <span className="font-mono">{stop_code}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}