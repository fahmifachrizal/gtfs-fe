import { projectService } from "@/services/projectService"
import { useUser } from "@/contexts/UserContext"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { Clock } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DetailLayout } from "./DetailLayout"

export function TripDetail({ trip, onSave }) {
  const { currentProject } = useUser()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    trip_id: trip.trip_id || "",
    route_id: trip.route_id || "",
    service_id: trip.service_id || "",
    trip_headsign: trip.trip_headsign || "",
    direction_id: String(trip.direction_id ?? "0"),
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
    })
  }, [trip])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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
        result = await projectService.createTrip(currentProject.id, tripData)
      } else {
        result = await projectService.updateTrip(currentProject.id, trip.trip_id, tripData)
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
            Service ID <span className="text-destructive">*</span>
          </Label>
          <Input
            id="service_id"
            value={formData.service_id}
            onChange={(e) => handleChange("service_id", e.target.value)}
            required
            className="h-7 text-xs font-mono"
          />
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
          <Select value={formData.direction_id} onValueChange={(v) => handleChange("direction_id", v)}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Outbound (0)</SelectItem>
              <SelectItem value="1">Inbound (1)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </form>
    </DetailLayout>
  )
}