// components/route-item.jsx
"use client"
import React, { useState } from "react"
import {
  ChevronDown,
  ChevronRight,
  Route,
  MapPin,
  Navigation,
  ArrowRight,
  ArrowLeft,
  Pencil,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const RouteItem = ({
  route,
  details,
  isExpanded,
  isLoadingDetails,
  onToggle,
  onStopClick,
  onEdit,
}) => {
  const [activeTab, setActiveTab] = useState(0)

  const availableDirections =
    details.available_directions || route.directions || []
  const hasMultipleDirections = availableDirections.length > 1

  const getDirectionIcon = (directionId) => {
    if (directionId === 0) {
      return <ArrowRight className="w-3 h-3" />
    } else if (directionId === 1) {
      return <ArrowLeft className="w-3 h-3" />
    }
    return <Navigation className="w-3 h-3" />
  }

  const getDirectionLabel = (directionId, tripHeadsign) => {
    if (tripHeadsign) {
      return tripHeadsign
    }

    switch (directionId) {
      case 0:
        return "Outbound"
      case 1:
        return "Inbound"
      default:
        return `Direction ${directionId}`
    }
  }

  const renderDirectionContent = (directionId) => {
    const directionStops = details.directions?.[directionId] || []
    const firstStop = directionStops[0]
    const tripHeadsign = firstStop?.trip_headsign

    return (
      <div className="space-y-3">
        {directionStops.length > 0 ? (
          <div className="space-y-2">
            {directionStops.map((stop, index) => (
              <div
                key={`${stop.stop_id}-${directionId}-${index}`}
                className="flex items-center p-3 bg-background rounded-md border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => onStopClick(stop)}>
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary shrink-0">
                    {stop.stop_sequence || index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-foreground truncate">
                      {stop.stop_name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      Stop ID: {stop.stop_id}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <MapPin className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No stops found for this direction
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow text-sm">
      {/* Route Header */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onToggle()
          }
        }}
        className="w-full px-4 py-2 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center space-x-4 min-w-0 flex-1">
          <div className="flex items-center space-x-2 shrink-0">
            <div
              className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: `#${route.route_color || "CCCCCC"}`,
                color: `#${route.route_text_color || "000000"}`,
              }}>
              {route.route_short_name || "N/A"}
            </div>
          </div>

          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <h3 className="font-semibold text-foreground truncate">
              {route.route_long_name ||
                route.route_short_name ||
                "Unnamed Route"}
            </h3>
            {availableDirections.length > 0 && (
              <span className="flex items-center h-5 w-5 bg-primary/20 rounded-full text-xs justify-center text-foreground shrink-0">
                {availableDirections.length}
              </span>
            )}
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit()
                }}
                className="h-7 w-7 p-0 ml-2 shrink-0"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {isLoadingDetails && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          )}
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Expandable Details Section */}
      {isExpanded && (
        <div className="border-t border-border bg-muted/30">
          {route.route_desc && (
            <div className="px-4 py-2 border-b border-border">
              <p className="text-sm text-muted-foreground italic">
                {route.route_desc}
              </p>
            </div>
          )}

          <div className="p-4">
            {isLoadingDetails ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-2 text-sm text-muted-foreground">
                  Loading route details...
                </span>
              </div>
            ) : availableDirections.length > 0 ? (
              <div className="space-y-4">
                {hasMultipleDirections ? (
                  <>
                    {/* Direction Tabs - Scrollable */}
                    <div className="border-b border-border">
                      <div className="flex overflow-x-auto scrollbar-hide space-x-1">
                        {availableDirections.map((directionId, index) => {
                          const directionStops =
                            details.directions?.[directionId] || []
                          const firstStop = directionStops[0]
                          const tripHeadsign = firstStop?.trip_headsign
                          const fullLabel = getDirectionLabel(
                            directionId,
                            tripHeadsign
                          )
                          const shortLabel =
                            fullLabel.length > 12
                              ? `${fullLabel.substring(0, 12)}...`
                              : fullLabel

                          return (
                            <button
                              key={directionId}
                              onClick={() => setActiveTab(index)}
                              title={fullLabel}
                              className={`relative group flex items-center space-x-2 px-3 py-2 border-b-2 transition-colors shrink-0 min-w-0 ${availableDirections.length > 2
                                ? "w-1/2"
                                : "flex-1"
                                } ${activeTab === index
                                  ? "border-primary text-primary bg-primary/5"
                                  : "border-transparent text-muted-foreground hover:text-foreground"
                                }`}>
                              {getDirectionIcon(directionId)}
                              <span className="font-medium text-sm truncate">
                                {shortLabel}
                              </span>
                              <span className="text-xs text-muted-foreground flex-shrink-0">
                                ({directionStops.length})
                              </span>

                              {/* Tooltip for full name */}
                              {fullLabel.length > 12 && (
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                                  {fullLabel}
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black/80"></div>
                                </div>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Tab Content */}
                    <div className="mt-4">
                      {renderDirectionContent(availableDirections[activeTab])}
                    </div>
                  </>
                ) : (
                  // Single direction - no tabs
                  <div>
                    <div className="flex items-center space-x-3 pb-2 border-b border-border/50 mb-3">
                      <div className="flex items-center space-x-2">
                        {getDirectionIcon(availableDirections[0])}
                        <h4 className="font-medium text-foreground">
                          {getDirectionLabel(
                            availableDirections[0],
                            details.directions?.[availableDirections[0]]?.[0]
                              ?.trip_headsign
                          )}
                        </h4>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        (
                        {
                          (details.directions?.[availableDirections[0]] || [])
                            .length
                        }{" "}
                        stops)
                      </span>
                    </div>
                    {renderDirectionContent(availableDirections[0])}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Navigation className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No directions found for this route
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default RouteItem
