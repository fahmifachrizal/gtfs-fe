import { projectService } from "@/services/projectService"
import { useUser } from "@/contexts/UserContext"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { MapPin, Save } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Layout } from "@/components/details/Layout"

export function StopDetail({ stop, onSave, onPreview }) {
    const { currentProject } = useUser()
    const [loading, setLoading] = useState(false)

    // Controlled state for inputs to support preview
    const [lat, setLat] = useState(stop.stop_lat || "")
    const [lon, setLon] = useState(stop.stop_lon || "")
    const [id, setId] = useState(stop.stop_id || (stop.isNew ? Math.random().toString(36).substring(2, 10).toUpperCase() : ""))

    // Sync state when stop prop changes
    useEffect(() => {
        setLat(stop.stop_lat || "")
        setLon(stop.stop_lon || "")

        if (stop.isNew) {
            setId(stop.stop_id || Math.random().toString(36).substring(2, 10).toUpperCase())
        } else {
            setId(stop.stop_id)
        }
    }, [stop])

    // Trigger preview when lat/lon change
    const handleCoordinateChange = (newLat, newLon) => {
        if (onPreview && newLat && newLon && !isNaN(newLat) && !isNaN(newLon)) {
            onPreview({
                ...stop,
                stop_lat: parseFloat(newLat),
                stop_lon: parseFloat(newLon),
                isNew: stop.isNew // Pass down isNew status
            })
        }
    }

    if (!stop) return null

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const formData = new FormData(e.target)
            const stopData = {
                stop_id: id,
                stop_code: formData.get("stop_code"),
                stop_name: formData.get("stop_name"),
                stop_lat: parseFloat(formData.get("lat")),
                stop_lon: parseFloat(formData.get("lon")),
                stop_desc: formData.get("desc"),
            }

            let result
            if (stop.isNew) {
                // Create new stop
                result = await projectService.createStop(currentProject.id, stopData)
            } else {
                // Update existing stop
                result = await projectService.updateStop(currentProject.id, stop.stop_id, stopData)
            }

            if (result.success) {
                if (onSave) onSave(result.data)
            } else {
                toast.error(result.message || "Failed to save stop")
            }
        } catch (error) {
            console.error("Failed to save stop:", error)
            toast.error(error.message || "An error occurred while saving")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Layout
            icon={MapPin}
            label={stop.isNew ? "New Stop" : "Stop Details"}
            title={stop.isNew ? "Create Stop" : stop.stop_name}
            footer={
                <Button type="submit" form="stop-form" className="w-full h-8 text-xs font-medium" disabled={loading}>
                    <Save className="w-3 h-3 mr-2" />
                    {loading ? "Saving..." : "Save Changes"}
                </Button>
            }
        >
            <form id="stop-form" onSubmit={handleSubmit} className="flex flex-col gap-2.5 flex-1 overflow-y-auto px-1">
                <div className="grid grid-cols-2 gap-2.5">
                    <div className="grid gap-1">
                        <Label htmlFor="stop_id" className="text-[10px] font-semibold text-muted-foreground uppercase">ID <span className="text-destructive">*</span></Label>
                        <Input
                            id="stop_id"
                            value={id}
                            onChange={(e) => setId(e.target.value.toUpperCase())}
                            maxLength={8}
                            required
                            className="h-7 text-xs font-mono"
                        />
                    </div>
                    <div className="grid gap-1">
                        <Label htmlFor="stop_code" className="text-[10px] font-semibold text-muted-foreground uppercase">Code</Label>
                        <Input
                            id="stop_code"
                            name="stop_code"
                            defaultValue={stop.stop_code}
                            maxLength={10}
                            className="h-7 text-xs font-mono"
                        />
                    </div>
                </div>

                <div className="grid gap-1">
                    <Label htmlFor="stop_name" className="text-[10px] font-semibold text-muted-foreground uppercase">Name <span className="text-destructive">*</span></Label>
                    <Input id="stop_name" name="stop_name" defaultValue={stop.stop_name} required className="h-7 text-xs" />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                    <div className="grid gap-1">
                        <Label htmlFor="lat" className="text-[10px] font-semibold text-muted-foreground uppercase">Latitude <span className="text-destructive">*</span></Label>
                        <Input
                            id="lat"
                            name="lat"
                            type="number"
                            step="0.000001"
                            min="-90"
                            max="90"
                            value={lat}
                            onChange={(e) => {
                                setLat(e.target.value)
                                handleCoordinateChange(e.target.value, lon)
                            }}
                            required
                            className="h-7 text-xs font-mono"
                        />
                    </div>
                    <div className="grid gap-1">
                        <Label htmlFor="lon" className="text-[10px] font-semibold text-muted-foreground uppercase">Longitude <span className="text-destructive">*</span></Label>
                        <Input
                            id="lon"
                            name="lon"
                            type="number"
                            step="0.000001"
                            min="-180"
                            max="180"
                            value={lon}
                            onChange={(e) => {
                                setLon(e.target.value)
                                handleCoordinateChange(lat, e.target.value)
                            }}
                            required
                            className="h-7 text-xs font-mono"
                        />
                    </div>
                </div>

                <div className="grid gap-1">
                    <Label htmlFor="desc" className="text-[10px] font-semibold text-muted-foreground uppercase">Description</Label>
                    <Textarea
                        id="desc"
                        name="desc"
                        defaultValue={stop.stop_desc}
                        rows={3}
                        placeholder="Optional description"
                        className="text-xs min-h-[60px] resize-none"
                    />
                </div>
            </form>
        </Layout>
    )
}
