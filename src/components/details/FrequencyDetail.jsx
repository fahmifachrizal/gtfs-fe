import { service } from "@/services"
import { useUser } from "@/contexts/UserContext"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { Radio, Trash2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { DetailLayout } from "./DetailLayout"
import { Button } from "@/components/ui/button"

export function FrequencyDetail({ frequency, trips, onSave, onDelete, onClose }) {
    const { currentProject } = useUser()
    const [loading, setLoading] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const [formData, setFormData] = useState({
        trip_id: frequency.trip_id || "",
        start_time: frequency.start_time || "06:00:00",
        end_time: frequency.end_time || "22:00:00",
        headway_secs: frequency.headway_secs || 600,
        exact_times: frequency.exact_times || 0,
    })

    useEffect(() => {
        setFormData({
            trip_id: frequency.trip_id || "",
            start_time: frequency.start_time || "06:00:00",
            end_time: frequency.end_time || "22:00:00",
            headway_secs: frequency.headway_secs || 600,
            exact_times: frequency.exact_times || 0,
        })
    }, [frequency])

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleHeadwayMinutesChange = (minutes) => {
        const secs = parseInt(minutes) * 60
        setFormData(prev => ({ ...prev, headway_secs: secs }))
    }

    const handleSubmit = async (e) => {
        e?.preventDefault()
        setLoading(true)

        try {
            const frequencyData = {
                trip_id: formData.trip_id,
                start_time: formData.start_time,
                end_time: formData.end_time,
                headway_secs: parseInt(formData.headway_secs),
                exact_times: parseInt(formData.exact_times),
            }

            let result
            if (frequency.isNew) {
                result = await service.frequencies.createFrequency(currentProject.id, frequencyData)
            } else {
                result = await service.frequencies.updateFrequency(currentProject.id, frequency.frequency_id, frequencyData)
            }

            if (result.success) {
                toast.success(`Frequency saved successfully`)
                if (onSave) onSave(result.data)
            }
        } catch (error) {
            toast.error(error.message || "Failed to save frequency")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete this frequency?`)) {
            return
        }

        setDeleting(true)
        try {
            const result = await service.frequencies.deleteFrequency(currentProject.id, frequency.frequency_id)
            if (result.success) {
                toast.success(`Frequency deleted successfully`)
                if (onDelete) onDelete(frequency)
            }
        } catch (error) {
            toast.error(error.message || "Failed to delete frequency")
        } finally {
            setDeleting(false)
        }
    }

    const headwayMinutes = Math.floor(formData.headway_secs / 60)

    return (
        <DetailLayout
            icon={Radio}
            label={frequency.isNew ? "New Frequency" : "Frequency Details"}
            title={frequency.isNew ? "Create Frequency" : `${formData.trip_id}`}
            onSave={handleSubmit}
            onClose={onClose}
            loading={loading}
            actions={
                !frequency.isNew && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {deleting ? "Deleting..." : "Delete"}
                    </Button>
                )
            }
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
                <div className="grid gap-1">
                    <Label htmlFor="trip_id" className="text-[10px] font-semibold text-muted-foreground uppercase">
                        Trip ID <span className="text-destructive">*</span>
                    </Label>
                    {frequency.isNew ? (
                        <select
                            id="trip_id"
                            value={formData.trip_id}
                            onChange={(e) => handleChange("trip_id", e.target.value)}
                            required
                            className="h-7 text-xs px-2 border rounded-md bg-background"
                        >
                            <option value="">Select a trip...</option>
                            {trips.map(trip => (
                                <option key={trip.trip_id} value={trip.trip_id}>
                                    {trip.trip_id} - {trip.trip_headsign || trip.route_id}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <Input
                            id="trip_id"
                            value={formData.trip_id}
                            disabled
                            className="h-7 text-xs font-mono"
                        />
                    )}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                    <div className="grid gap-1">
                        <Label htmlFor="start_time" className="text-[10px] font-semibold text-muted-foreground uppercase">
                            Start Time <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="start_time"
                            value={formData.start_time}
                            onChange={(e) => handleChange("start_time", e.target.value)}
                            required
                            type="time"
                            step="1"
                            className="h-7 text-xs font-mono"
                        />
                    </div>

                    <div className="grid gap-1">
                        <Label htmlFor="end_time" className="text-[10px] font-semibold text-muted-foreground uppercase">
                            End Time <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="end_time"
                            value={formData.end_time}
                            onChange={(e) => handleChange("end_time", e.target.value)}
                            required
                            type="time"
                            step="1"
                            className="h-7 text-xs font-mono"
                        />
                    </div>
                </div>

                <div className="grid gap-1">
                    <Label htmlFor="headway_minutes" className="text-[10px] font-semibold text-muted-foreground uppercase">
                        Headway (minutes) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="headway_minutes"
                        value={headwayMinutes}
                        onChange={(e) => handleHeadwayMinutesChange(e.target.value)}
                        required
                        type="number"
                        min="1"
                        max="1440"
                        className="h-7 text-xs"
                    />
                    <p className="text-[10px] text-muted-foreground">
                        {formData.headway_secs} seconds ({headwayMinutes} minutes between vehicles)
                    </p>
                </div>

                <div className="grid gap-1">
                    <Label htmlFor="exact_times" className="text-[10px] font-semibold text-muted-foreground uppercase">
                        Exact Times
                    </Label>
                    <select
                        id="exact_times"
                        value={formData.exact_times}
                        onChange={(e) => handleChange("exact_times", parseInt(e.target.value))}
                        className="h-7 text-xs px-2 border rounded-md bg-background"
                    >
                        <option value={0}>Frequency-based (0)</option>
                        <option value={1}>Schedule-based (1)</option>
                    </select>
                    <p className="text-[10px] text-muted-foreground">
                        {formData.exact_times === 0 ? "Service runs at variable intervals" : "Service runs at exact scheduled times"}
                    </p>
                </div>
            </form>
        </DetailLayout>
    )
}
