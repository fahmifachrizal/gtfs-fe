import { projectService } from "@/services/projectService"
import { useUser } from "@/contexts/UserContext"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { Calendar } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { DetailLayout } from "./DetailLayout"

export function CalendarDetail({ calendar, onSave }) {
    const { currentProject } = useUser()
    const [loading, setLoading] = useState(false)

    const [formData, setFormData] = useState({
        service_id: calendar.service_id || "",
        monday: calendar.monday === 1,
        tuesday: calendar.tuesday === 1,
        wednesday: calendar.wednesday === 1,
        thursday: calendar.thursday === 1,
        friday: calendar.friday === 1,
        saturday: calendar.saturday === 1,
        sunday: calendar.sunday === 1,
        start_date: calendar.start_date || "",
        end_date: calendar.end_date || "",
    })

    // Generate ID for new calendars
    useEffect(() => {
        if (calendar.isNew && !formData.service_id) {
            setFormData(prev => ({
                ...prev,
                service_id: `SVC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
            }))
        }
    }, [calendar.isNew])

    useEffect(() => {
        setFormData({
            service_id: calendar.service_id || formData.service_id,
            monday: calendar.monday === 1,
            tuesday: calendar.tuesday === 1,
            wednesday: calendar.wednesday === 1,
            thursday: calendar.thursday === 1,
            friday: calendar.friday === 1,
            saturday: calendar.saturday === 1,
            sunday: calendar.sunday === 1,
            start_date: calendar.start_date || "",
            end_date: calendar.end_date || "",
        })
    }, [calendar])

    const toggleDay = (day) => {
        setFormData(prev => ({ ...prev, [day]: !prev[day] }))
    }

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e) => {
        e?.preventDefault()
        setLoading(true)

        try {
            const calendarData = {
                service_id: formData.service_id,
                monday: formData.monday ? 1 : 0,
                tuesday: formData.tuesday ? 1 : 0,
                wednesday: formData.wednesday ? 1 : 0,
                thursday: formData.thursday ? 1 : 0,
                friday: formData.friday ? 1 : 0,
                saturday: formData.saturday ? 1 : 0,
                sunday: formData.sunday ? 1 : 0,
                start_date: formData.start_date,
                end_date: formData.end_date,
            }

            let result
            if (calendar.isNew) {
                result = await projectService.createCalendar(currentProject.id, calendarData)
            } else {
                result = await projectService.updateCalendar(currentProject.id, calendar.service_id, calendarData)
            }

            if (result.success) {
                toast.success(`Service "${result.data.service_id}" saved`)
                if (onSave) onSave(result.data)
            }
        } catch (error) {
            toast.error(error.message || "Failed to save calendar")
        } finally {
            setLoading(false)
        }
    }

    const dayNames = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    return (
        <DetailLayout
            icon={Calendar}
            label={calendar.isNew ? "New Service" : "Service Details"}
            title={calendar.isNew ? "Create Service" : calendar.service_id}
            onSave={handleSubmit}
            loading={loading}
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
                <div className="grid gap-1">
                    <Label htmlFor="service_id" className="text-[10px] font-semibold text-muted-foreground uppercase">
                        Service ID <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="service_id"
                        value={formData.service_id}
                        onChange={(e) => handleChange("service_id", e.target.value.toUpperCase())}
                        required
                        disabled={!calendar.isNew}
                        className="h-7 text-xs font-mono"
                    />
                </div>

                <div className="grid gap-2">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Operating Days</Label>
                    <div className="flex flex-wrap gap-2">
                        {dayNames.map((day, i) => (
                            <div key={day} className="flex items-center gap-1.5">
                                <Checkbox
                                    id={day}
                                    checked={formData[day]}
                                    onCheckedChange={() => toggleDay(day)}
                                />
                                <Label htmlFor={day} className="text-xs cursor-pointer">{dayLabels[i]}</Label>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                    <div className="grid gap-1">
                        <Label htmlFor="start_date" className="text-[10px] font-semibold text-muted-foreground uppercase">
                            Start Date <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="start_date"
                            value={formData.start_date}
                            onChange={(e) => handleChange("start_date", e.target.value)}
                            placeholder="YYYYMMDD"
                            pattern="\d{8}"
                            required
                            className="h-7 text-xs font-mono"
                        />
                    </div>
                    <div className="grid gap-1">
                        <Label htmlFor="end_date" className="text-[10px] font-semibold text-muted-foreground uppercase">
                            End Date <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="end_date"
                            value={formData.end_date}
                            onChange={(e) => handleChange("end_date", e.target.value)}
                            placeholder="YYYYMMDD"
                            pattern="\d{8}"
                            required
                            className="h-7 text-xs font-mono"
                        />
                    </div>
                </div>
            </form>
        </DetailLayout>
    )
}
