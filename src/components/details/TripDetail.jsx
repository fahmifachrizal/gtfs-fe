import { projectService } from "@/services/projectService"
import { useUser } from "@/contexts/UserContext"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { Clock, Save } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Layout } from "@/components/details/Layout"

export function TripDetail({ trip, onSave }) {
    const { currentProject } = useUser()
    const [loading, setLoading] = useState(false)

    const [tripId, setTripId] = useState(trip.trip_id || (trip.isNew ? `TRIP-${Math.random().toString(36).substring(2, 8).toUpperCase()}` : ""))
    const [routeId, setRouteId] = useState(trip.route_id || "")
    const [serviceId, setServiceId] = useState(trip.service_id || "")
    const [tripHeadsign, setTripHeadsign] = useState(trip.trip_headsign || "")
    const [directionId, setDirectionId] = useState(String(trip.direction_id ?? "0"))

    useEffect(() => {
        setTripId(trip.trip_id || (trip.isNew ? `TRIP-${Math.random().toString(36).substring(2, 8).toUpperCase()}` : ""))
        setRouteId(trip.route_id || "")
        setServiceId(trip.service_id || "")
        setTripHeadsign(trip.trip_headsign || "")
        setDirectionId(String(trip.direction_id ?? "0"))
    }, [trip])

    if (!trip) return null

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const tripData = {
                trip_id: tripId,
                route_id: routeId,
                service_id: serviceId,
                trip_headsign: tripHeadsign,
                direction_id: parseInt(directionId),
            }

            let result
            if (trip.isNew) {
                result = await projectService.createTrip(currentProject.id, tripData)
            } else {
                result = await projectService.updateTrip(currentProject.id, trip.trip_id, tripData)
            }

            if (result.success) {
                if (onSave) onSave(result.data)
            } else {
                toast.error(result.message || "Failed to save trip")
            }
        } catch (error) {
            console.error("Failed to save trip:", error)
            toast.error(error.message || "An error occurred while saving")
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3 h-full flex flex-col">
            <div className="space-y-1 flex-none border-b pb-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span className="text-[10px] uppercase tracking-wider font-semibold">
                        {trip.isNew ? "New Trip" : "Trip Details"}
                    </span>
                </div>
                <h2 className="text-lg font-bold truncate leading-tight">
                    {trip.isNew ? "Create Trip" : trip.trip_headsign || trip.trip_id}
                </h2>
            </div>

            <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto px-1">
                <div className="grid gap-1">
                    <Label htmlFor="trip_id" className="text-[10px] font-semibold text-muted-foreground uppercase">Trip ID <span className="text-destructive">*</span></Label>
                    <Input
                        id="trip_id"
                        value={tripId}
                        onChange={(e) => setTripId(e.target.value.toUpperCase())}
                        required
                        className="h-7 text-xs font-mono"
                    />
                </div>

                <div className="grid gap-1">
                    <Label htmlFor="route_id" className="text-[10px] font-semibold text-muted-foreground uppercase">Route ID <span className="text-destructive">*</span></Label>
                    <Input
                        id="route_id"
                        value={routeId}
                        onChange={(e) => setRouteId(e.target.value)}
                        required
                        className="h-7 text-xs font-mono"
                    />
                </div>

                <div className="grid gap-1">
                    <Label htmlFor="service_id" className="text-[10px] font-semibold text-muted-foreground uppercase">Service ID <span className="text-destructive">*</span></Label>
                    <Input
                        id="service_id"
                        value={serviceId}
                        onChange={(e) => setServiceId(e.target.value)}
                        required
                        className="h-7 text-xs font-mono"
                    />
                </div>

                <div className="grid gap-1">
                    <Label htmlFor="trip_headsign" className="text-[10px] font-semibold text-muted-foreground uppercase">Headsign</Label>
                    <Input
                        id="trip_headsign"
                        value={tripHeadsign}
                        onChange={(e) => setTripHeadsign(e.target.value)}
                        placeholder="e.g. Downtown Station"
                        className="h-7 text-xs"
                    />
                </div>

                <div className="grid gap-1">
                    <Label htmlFor="direction_id" className="text-[10px] font-semibold text-muted-foreground uppercase">Direction</Label>
                    <Select value={directionId} onValueChange={setDirectionId}>
                        <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0">Outbound (0)</SelectItem>
                            <SelectItem value="1">Inbound (1)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="pt-2 border-t mt-auto flex-none">
                <Button type="submit" className="w-full h-8 text-xs font-medium" disabled={loading}>
                    <Save className="w-3 h-3 mr-2" />
                    {loading ? "Saving..." : "Save Changes"}
                </Button>
            </div>
        </form>
    )
}
