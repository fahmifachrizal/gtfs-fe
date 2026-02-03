import { service } from "@/services"
import { useUser } from "@/contexts/UserContext"
import { useEditorContext } from "@/contexts/EditorContext"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { Clock, Shapes, Plus, MapPin } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { DetailLayout } from "./DetailLayout"

export function TripDetail({ trip, onSave, onClose }) {
  const { currentProject } = useUser()
  const { updateMapData, clearMap, setMapBounds } = useEditorContext()
  const [loading, setLoading] = useState(false)
  const [availableShapes, setAvailableShapes] = useState([])
  const [loadingShapes, setLoadingShapes] = useState(false)
  const [selectedShape, setSelectedShape] = useState(null)
  const [availableServices, setAvailableServices] = useState([])
  const [loadingServices, setLoadingServices] = useState(false)

  const [formData, setFormData] = useState({
    trip_id: trip.trip_id || "",
    route_id: trip.route_id || "",
    service_id: trip.service_id || "",
    trip_headsign: trip.trip_headsign || "",
    direction_id: String(trip.direction_id ?? "0"),
    shape_id: trip.shape_id || "",
  })

  // Generate ID for new trips
  useEffect(() => {
    if (trip.isNew && !formData.trip_id) {
      setFormData(prev => ({
        ...prev,
        trip_id: `TRIP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      }))
    }
  }, [trip.isNew])

  useEffect(() => {
    setFormData({
      trip_id: trip.trip_id || formData.trip_id,
      route_id: trip.route_id || "",
      service_id: trip.service_id || "",
      trip_headsign: trip.trip_headsign || "",
      direction_id: String(trip.direction_id ?? "0"),
      shape_id: trip.shape_id || "",
    })
  }, [trip])

  // Fetch available shapes when route_id changes
  useEffect(() => {
    const fetchShapes = async () => {
      if (!formData.route_id || !currentProject) {
        setAvailableShapes([])
        return
      }

      setLoadingShapes(true)
      try {
        // Try to get route path and stops for the specified direction
        const response = await service.routes.getRoutePathAndStops(
          currentProject.id,
          formData.route_id,
          parseInt(formData.direction_id)
        )

        if (response.success && response.data) {
          setAvailableShapes([{
            shape_id: response.data.shape_id,
            points: response.data.polyline,
            stops: response.data.stops,
          }])
        } else {
          setAvailableShapes([])
        }
      } catch (error) {
        console.error("[TripDetail] Failed to fetch shapes:", error)
        setAvailableShapes([])
      } finally {
        setLoadingShapes(false)
      }
    }

    fetchShapes()
  }, [formData.route_id, formData.direction_id, currentProject])

  // Fetch available calendar services
  useEffect(() => {
    const fetchServices = async () => {
      if (!currentProject) {
        setAvailableServices([])
        return
      }

      setLoadingServices(true)
      try {
        const response = await service.calendar.getCalendar(currentProject.id)
        if (response.success && response.data) {
          setAvailableServices(response.data)
        } else {
          setAvailableServices([])
        }
      } catch (error) {
        console.error("[TripDetail] Failed to fetch services:", error)
        setAvailableServices([])
      } finally {
        setLoadingServices(false)
      }
    }

    fetchServices()
  }, [currentProject])

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      clearMap()
    }
  }, [clearMap])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleShapeClick = (shape) => {
    if (selectedShape?.shape_id === shape.shape_id) {
      // Deselect and clear map
      setSelectedShape(null)
      clearMap()
      setMapBounds(null)
      return
    }

    setSelectedShape(shape)

    // Build GeoJSON for map
    const features = []

    // Add polyline
    if (shape.points && shape.points.length >= 2) {
      features.push({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: shape.points.map(pt => [pt.longitude, pt.latitude]),
        },
        properties: {
          type: "shape-path",
          route_color: "3388ff",
        },
      })
    }

    // Add stops
    if (shape.stops) {
      shape.stops.forEach(stop => {
        features.push({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [stop.stop_lon, stop.stop_lat],
          },
          properties: {
            type: "stop",
            stop_name: stop.stop_name,
            stop_id: stop.stop_id,
            markerColor: "red",
          },
        })
      })
    }

    const geojson = {
      type: "FeatureCollection",
      features,
    }

    updateMapData(geojson)

    // Calculate and set bounds with a small delay to ensure smooth rendering
    if (shape.points && shape.points.length > 0) {
      setTimeout(() => {
        let minLat = Infinity, maxLat = -Infinity
        let minLon = Infinity, maxLon = -Infinity

        shape.points.forEach(pt => {
          minLat = Math.min(minLat, pt.latitude)
          maxLat = Math.max(maxLat, pt.latitude)
          minLon = Math.min(minLon, pt.longitude)
          maxLon = Math.max(maxLon, pt.longitude)
        })

        if (minLat !== Infinity) {
          setMapBounds([[minLat, minLon], [maxLat, maxLon]])
        }
      }, 100)
    }
  }

  const handleAssignShape = (shape) => {
    handleChange("shape_id", shape.shape_id)
    toast.success(`Shape "${shape.shape_id}" assigned to trip`)
  }

  const handleSubmit = async (e) => {
    e?.preventDefault()
    setLoading(true)

    try {
      const tripData = {
        ...formData,
        direction_id: parseInt(formData.direction_id),
      }

      let result
      if (trip.isNew) {
        result = await service.trips.createTrip(currentProject.id, tripData)
      } else {
        result = await service.trips.updateTrip(currentProject.id, trip.trip_id, tripData)
      }

      if (result.success) {
        toast.success(`Trip "${result.data.trip_id}" saved`)
        if (onSave) onSave(result.data)
      }
    } catch (error) {
      toast.error(error.message || "Failed to save trip")
    } finally {
      setLoading(false)
    }
  }

  return (
    <DetailLayout
      icon={Clock}
      label={trip.isNew ? "New Trip" : "Trip Details"}
      title={trip.isNew ? "Create Trip" : trip.trip_headsign || trip.trip_id}
      onSave={handleSubmit}
      onClose={onClose}
      loading={loading}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
        <div className="grid gap-1">
          <Label htmlFor="trip_id" className="text-[10px] font-semibold text-muted-foreground uppercase">
            Trip ID <span className="text-destructive">*</span>
          </Label>
          <Input
            id="trip_id"
            value={formData.trip_id}
            onChange={(e) => handleChange("trip_id", e.target.value.toUpperCase())}
            required
            disabled={!trip.isNew}
            className="h-7 text-xs font-mono"
          />
        </div>

        <div className="grid gap-1">
          <Label htmlFor="route_id" className="text-[10px] font-semibold text-muted-foreground uppercase">
            Route ID <span className="text-destructive">*</span>
          </Label>
          <Input
            id="route_id"
            value={formData.route_id}
            onChange={(e) => handleChange("route_id", e.target.value)}
            required
            className="h-7 text-xs font-mono"
          />
        </div>

        <div className="grid gap-1">
          <Label htmlFor="service_id" className="text-[10px] font-semibold text-muted-foreground uppercase">
            Service Day <span className="text-destructive">*</span>
          </Label>
          <Select value={formData.service_id} onValueChange={(v) => handleChange("service_id", v)} required>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder={loadingServices ? "Loading..." : "Select service"} />
            </SelectTrigger>
            <SelectContent>
              {availableServices.length > 0 ? (
                availableServices.map((service) => {
                  const days = [];
                  if (service.monday) days.push('M');
                  if (service.tuesday) days.push('T');
                  if (service.wednesday) days.push('W');
                  if (service.thursday) days.push('Th');
                  if (service.friday) days.push('F');
                  if (service.saturday) days.push('Sa');
                  if (service.sunday) days.push('Su');
                  const dayString = days.length > 0 ? days.join(', ') : 'No days';

                  return (
                    <SelectItem key={service.service_id} value={service.service_id}>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono text-xs font-medium">{service.service_id}</span>
                        <span className="text-muted-foreground text-[10px]">{dayString}</span>
                      </div>
                    </SelectItem>
                  );
                })
              ) : (
                <SelectItem value="_none" disabled>
                  No services available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1">
          <Label htmlFor="trip_headsign" className="text-[10px] font-semibold text-muted-foreground uppercase">
            Headsign
          </Label>
          <Input
            id="trip_headsign"
            value={formData.trip_headsign}
            onChange={(e) => handleChange("trip_headsign", e.target.value)}
            placeholder="e.g. Downtown Station"
            className="h-7 text-xs"
          />
        </div>

        <div className="grid gap-1">
          <Label htmlFor="direction_id" className="text-[10px] font-semibold text-muted-foreground uppercase">
            Direction
          </Label>
          <Tabs value={formData.direction_id} onValueChange={(v) => handleChange("direction_id", v)}>
            <TabsList className="w-full">
              <TabsTrigger value="0" className="flex-1">Outbound</TabsTrigger>
              <TabsTrigger value="1" className="flex-1">Inbound</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Separator className="my-2" />

        {/* Routes Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
              <Shapes className="w-3 h-3" />
              Routes
            </Label>
            {loadingShapes && (
              <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full"></div>
            )}
          </div>

          {formData.route_id ? (
            availableShapes.length > 0 ? (
              <div className="space-y-1.5">
                {availableShapes.map((shape) => {
                  const isSelected = selectedShape?.shape_id === shape.shape_id
                  const isAssigned = formData.shape_id === shape.shape_id
                  return (
                    <Card
                      key={shape.shape_id}
                      className={`cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-accent border-accent-foreground/20 border-2 shadow-sm'
                          : 'hover:bg-accent/50 hover:border-accent-foreground/10'
                      }`}
                      onClick={() => handleShapeClick(shape)}
                    >
                      <CardContent className="p-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`} />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium truncate flex items-center gap-1.5">
                                {shape.shape_id}
                                {isAssigned && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary rounded">
                                    Assigned
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                {shape.points?.length || 0} points • {shape.stops?.length || 0} stops
                              </div>
                            </div>
                          </div>
                          {!isAssigned && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-[10px]"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAssignShape(shape)
                              }}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Assign
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-[10px] text-muted-foreground">
                No shapes found for this route and direction.
                <br />
                Create a shape in the Shapes page first.
              </div>
            )
          ) : (
            <div className="text-center py-4 text-[10px] text-muted-foreground">
              Select a route to view available shapes.
            </div>
          )}
        </div>
      </form>
    </DetailLayout>
  )
}