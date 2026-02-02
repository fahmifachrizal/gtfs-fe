import { projectService } from "@/services/projectService"
import { useUser } from "@/contexts/UserContext"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { Building2, Trash2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { DetailLayout } from "./DetailLayout"
import { Button } from "@/components/ui/button"

const COMMON_TIMEZONES = [
    "Asia/Jakarta",
    "Asia/Singapore",
    "Asia/Kuala_Lumpur",
    "Asia/Bangkok",
    "Asia/Manila",
    "America/New_York",
    "America/Los_Angeles",
    "America/Chicago",
    "Europe/London",
    "Europe/Paris",
    "Asia/Tokyo",
    "Australia/Sydney",
]

export function AgencyDetail({ agency, onSave, onDelete }) {
    const { currentProject } = useUser()
    const [loading, setLoading] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const [formData, setFormData] = useState({
        agency_id: agency.agency_id || "",
        agency_name: agency.agency_name || "",
        agency_url: agency.agency_url || "",
        agency_timezone: agency.agency_timezone || "Asia/Jakarta",
        agency_lang: agency.agency_lang || "en",
        agency_phone: agency.agency_phone || "",
        agency_email: agency.agency_email || "",
        agency_fare_url: agency.agency_fare_url || "",
    })

    // Generate ID for new agencies
    useEffect(() => {
        if (agency.isNew && !formData.agency_id) {
            setFormData(prev => ({
                ...prev,
                agency_id: `AGENCY-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
            }))
        }
    }, [agency.isNew])

    useEffect(() => {
        setFormData({
            agency_id: agency.agency_id || formData.agency_id,
            agency_name: agency.agency_name || "",
            agency_url: agency.agency_url || "",
            agency_timezone: agency.agency_timezone || "Asia/Jakarta",
            agency_lang: agency.agency_lang || "en",
            agency_phone: agency.agency_phone || "",
            agency_email: agency.agency_email || "",
            agency_fare_url: agency.agency_fare_url || "",
        })
    }, [agency])

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e) => {
        e?.preventDefault()
        setLoading(true)

        try {
            // Validate URL format
            if (formData.agency_url && !formData.agency_url.startsWith("http")) {
                toast.error("Agency URL must start with http:// or https://")
                setLoading(false)
                return
            }

            const agencyData = {
                agency_id: formData.agency_id,
                agency_name: formData.agency_name,
                agency_url: formData.agency_url,
                agency_timezone: formData.agency_timezone,
                agency_lang: formData.agency_lang,
                agency_phone: formData.agency_phone || null,
                agency_email: formData.agency_email || null,
                agency_fare_url: formData.agency_fare_url || null,
            }

            let result
            if (agency.isNew) {
                result = await projectService.createAgency(currentProject.id, agencyData)
            } else {
                result = await projectService.updateAgency(currentProject.id, agency.agency_id, agencyData)
            }

            if (result.success) {
                toast.success(`Agency "${result.data.agency_name}" saved`)
                if (onSave) onSave(result.data)
            }
        } catch (error) {
            toast.error(error.message || "Failed to save agency")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete agency "${formData.agency_name}"?`)) {
            return
        }

        setDeleting(true)
        try {
            const result = await projectService.deleteAgency(currentProject.id, agency.agency_id)
            if (result.success) {
                toast.success(`Agency "${formData.agency_name}" deleted`)
                if (onDelete) onDelete(agency)
            }
        } catch (error) {
            toast.error(error.message || "Failed to delete agency")
        } finally {
            setDeleting(false)
        }
    }

    return (
        <DetailLayout
            icon={Building2}
            label={agency.isNew ? "New Agency" : "Agency Details"}
            title={agency.isNew ? "Create Agency" : agency.agency_name}
            onSave={handleSubmit}
            loading={loading}
            actions={
                !agency.isNew && (
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
                    <Label htmlFor="agency_name" className="text-[10px] font-semibold text-muted-foreground uppercase">
                        Agency Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="agency_name"
                        value={formData.agency_name}
                        onChange={(e) => handleChange("agency_name", e.target.value)}
                        required
                        className="h-7 text-xs"
                        placeholder="e.g., Metro Transit Authority"
                    />
                </div>

                <div className="grid gap-1">
                    <Label htmlFor="agency_url" className="text-[10px] font-semibold text-muted-foreground uppercase">
                        Agency URL <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="agency_url"
                        value={formData.agency_url}
                        onChange={(e) => handleChange("agency_url", e.target.value)}
                        required
                        type="url"
                        className="h-7 text-xs"
                        placeholder="https://www.example.com"
                    />
                </div>

                <div className="grid gap-1">
                    <Label htmlFor="agency_timezone" className="text-[10px] font-semibold text-muted-foreground uppercase">
                        Timezone <span className="text-destructive">*</span>
                    </Label>
                    <select
                        id="agency_timezone"
                        value={formData.agency_timezone}
                        onChange={(e) => handleChange("agency_timezone", e.target.value)}
                        required
                        className="h-7 text-xs px-2 border rounded-md bg-background"
                    >
                        {COMMON_TIMEZONES.map(tz => (
                            <option key={tz} value={tz}>{tz}</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                    <div className="grid gap-1">
                        <Label htmlFor="agency_lang" className="text-[10px] font-semibold text-muted-foreground uppercase">
                            Language
                        </Label>
                        <Input
                            id="agency_lang"
                            value={formData.agency_lang}
                            onChange={(e) => handleChange("agency_lang", e.target.value)}
                            className="h-7 text-xs"
                            placeholder="en"
                            maxLength={2}
                        />
                    </div>

                    <div className="grid gap-1">
                        <Label htmlFor="agency_phone" className="text-[10px] font-semibold text-muted-foreground uppercase">
                            Phone
                        </Label>
                        <Input
                            id="agency_phone"
                            value={formData.agency_phone}
                            onChange={(e) => handleChange("agency_phone", e.target.value)}
                            className="h-7 text-xs"
                            placeholder="+1-234-567-8900"
                        />
                    </div>
                </div>

                <div className="grid gap-1">
                    <Label htmlFor="agency_email" className="text-[10px] font-semibold text-muted-foreground uppercase">
                        Email
                    </Label>
                    <Input
                        id="agency_email"
                        value={formData.agency_email}
                        onChange={(e) => handleChange("agency_email", e.target.value)}
                        type="email"
                        className="h-7 text-xs"
                        placeholder="contact@example.com"
                    />
                </div>

                <div className="grid gap-1">
                    <Label htmlFor="agency_fare_url" className="text-[10px] font-semibold text-muted-foreground uppercase">
                        Fare URL
                    </Label>
                    <Input
                        id="agency_fare_url"
                        value={formData.agency_fare_url}
                        onChange={(e) => handleChange("agency_fare_url", e.target.value)}
                        type="url"
                        className="h-7 text-xs"
                        placeholder="https://www.example.com/fares"
                    />
                </div>

                <div className="grid gap-1">
                    <Label htmlFor="agency_id" className="text-[10px] font-semibold text-muted-foreground uppercase">
                        Agency ID
                    </Label>
                    <Input
                        id="agency_id"
                        value={formData.agency_id}
                        onChange={(e) => handleChange("agency_id", e.target.value)}
                        disabled={!agency.isNew}
                        className="h-7 text-xs font-mono"
                        placeholder="Auto-generated"
                    />
                    <p className="text-[10px] text-muted-foreground">Auto-generated if left empty</p>
                </div>
            </form>
        </DetailLayout>
    )
}
