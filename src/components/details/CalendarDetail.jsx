import { projectService } from "@/services/projectService"
import { useUser } from "@/contexts/UserContext"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { Calendar, Save } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Layout } from "@/components/details/Layout"

export function CalendarDetail({ calendar, onSave }) {
    const { currentProject } = useUser()
    const [loading, setLoading] = useState(false)

    const [serviceId, setServiceId] = useState(calendar.service_id || "")
    const [days, setDays] = useState({
        monday: calendar.monday === 1,
        tuesday: calendar.tuesday === 1,
        wednesday: calendar.wednesday === 1,
        thursday: calendar.thursday === 1,
        friday: calendar.friday === 1,
        saturday: calendar.saturday === 1,
        sunday: calendar.sunday === 1,
    })
    const [startDate, setStartDate] = useState(calendar.start_date || "")
    const [endDate, setEndDate] = useState(calendar.end_date || "")

    useEffect(() => {
        setServiceId(calendar.service_id || "")
        setDays({
            monday: calendar.monday === 1,
            tuesday: calendar.tuesday === 1,
            wednesday: calendar.wednesday === 1,
            thursday: calendar.thursday === 1,
            friday: calendar.friday === 1,
            saturday: calendar.saturday === 1,
            sunday: calendar.sunday === 1,
        })
        setStartDate(calendar.start_date || "")
        setEndDate(calendar.end_date || "")
    }, [calendar])

    if (!calendar) return null

    const toggleDay = (day) => {
        setDays(prev => ({ ...prev, [day]: !prev[day] }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const calendarData = {
                service_id: serviceId,
                monday: days.monday ? 1 : 0,
                tuesday: days.tuesday ? 1 : 0,
                wednesday: days.wednesday ? 1 : 0,
                thursday: days.thursday ? 1 : 0,
                friday: days.friday ? 1 : 0,
                saturday: days.saturday ? 1 : 0,
                sunday: days.sunday ? 1 : 0,
                start_date: startDate,
                end_date: endDate,
            }

            let result
            if (calendar.isNew) {
                result = await projectService.createCalendar(currentProject.id, calendarData)
            } else {
                result = await projectService.updateCalendar(currentProject.id, calendar.service_id, calendarData)
            }

            if (result.success) {
                if (onSave) onSave(result.data)
            } else {
                toast.error(result.message || "Failed to save calendar")
            }
        } catch (error) {
            console.error("Failed to save calendar:", error)
            toast.error(error.message || "An error occurred while saving")
        } finally {
            setLoading(false)
        }
    }

    const dayNames = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    return (
        <form onSubmit={handleSubmit} className="space-y-3 h-full flex flex-col">
            <div className="space-y-1 flex-none border-b pb-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span className="text-[10px] uppercase tracking-wider font-semibold">
                        {calendar.isNew ? "New Service" : "Service Details"}
                    </span>
                </div>
                <h2 className="text-lg font-bold truncate leading-tight">
                    {calendar.isNew ? "Create Service" : calendar.service_id}
                </h2>
            </div>

            <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto px-1">
                <div className="grid gap-1">
                    <Label htmlFor="service_id" className="text-[10px] font-semibold text-muted-foreground uppercase">Service ID <span className="text-destructive">*</span></Label>
                    <Input
                        id="service_id"
                        value={serviceId}
                        onChange={(e) => setServiceId(e.target.value.toUpperCase())}
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
                                    checked={days[day]}
                                    onCheckedChange={() => toggleDay(day)}
                                />
                                <Label htmlFor={day} className="text-xs cursor-pointer">{dayLabels[i]}</Label>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                    <div className="grid gap-1">
                        <Label htmlFor="start_date" className="text-[10px] font-semibold text-muted-foreground uppercase">Start Date <span className="text-destructive">*</span></Label>
                        <Input
                            id="start_date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            placeholder="YYYYMMDD"
                            pattern="\d{8}"
                            required
                            className="h-7 text-xs font-mono"
                        />
                    </div>
                    <div className="grid gap-1">
                        <Label htmlFor="end_date" className="text-[10px] font-semibold text-muted-foreground uppercase">End Date <span className="text-destructive">*</span></Label>
                        <Input
                            id="end_date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            placeholder="YYYYMMDD"
                            pattern="\d{8}"
                            required
                            className="h-7 text-xs font-mono"
                        />
                    </div>
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
