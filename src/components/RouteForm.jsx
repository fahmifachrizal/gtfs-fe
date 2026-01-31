import React, { useState, useEffect } from "react"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { projectService } from "@/services/projectService"
import { useUser } from "@/contexts/UserContext"
import { Loader2 } from "lucide-react"

// GTFS Route Types
const ROUTE_TYPES = [
    { value: "0", label: "Tram, Streetcar, Light rail" },
    { value: "1", label: "Subway, Metro" },
    { value: "2", label: "Rail" },
    { value: "3", label: "Bus" },
    { value: "4", label: "Ferry" },
    { value: "5", label: "Cable tram" },
    { value: "6", label: "Aerial lift, Gondola" },
    { value: "7", label: "Funicular" },
]

export default function RouteForm({ isOpen, onClose, route, onSuccess }) {
    const { currentProject } = useUser()
    const [isLoading, setIsLoading] = useState(false)
    const [agencies, setAgencies] = useState([])
    const [formData, setFormData] = useState({
        route_id: "",
        route_short_name: "",
        route_long_name: "",
        route_desc: "",
        route_type: "3", // Default to Bus
        agency_id: "",
        route_color: "FFFFFF",
        route_text_color: "000000",
        route_url: "",
        route_sort_order: "",
    })
    const [errors, setErrors] = useState({})

    // Load form data when editing
    useEffect(() => {
        if (route) {
            setFormData({
                route_id: route.route_id || "",
                route_short_name: route.route_short_name || "",
                route_long_name: route.route_long_name || "",
                route_desc: route.route_desc || "",
                route_type: route.route_type?.toString() || "3",
                agency_id: route.agency_id || "",
                route_color: route.route_color || "FFFFFF",
                route_text_color: route.route_text_color || "000000",
                route_url: route.route_url || "",
                route_sort_order: route.route_sort_order?.toString() || "",
            })
        } else {
            // Reset form for new route
            setFormData({
                route_id: "",
                route_short_name: "",
                route_long_name: "",
                route_desc: "",
                route_type: "3",
                agency_id: "",
                route_color: "FFFFFF",
                route_text_color: "000000",
                route_url: "",
                route_sort_order: "",
            })
        }
        setErrors({})
    }, [route, isOpen])

    // Fetch agencies when dialog opens
    useEffect(() => {
        if (isOpen && currentProject) {
            fetchAgencies()
        }
    }, [isOpen, currentProject])

    const fetchAgencies = async () => {
        try {
            const response = await projectService.getAgencies(currentProject.id)
            if (response.success && response.data) {
                setAgencies(response.data)
            }
        } catch (error) {
            console.error("Failed to fetch agencies:", error)
            setAgencies([])
        }
    }

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
        // Clear error for this field
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: null }))
        }
    }

    const validateForm = () => {
        const newErrors = {}

        // At least one name is required
        if (!formData.route_short_name && !formData.route_long_name) {
            newErrors.route_short_name = "At least one of short name or long name is required"
            newErrors.route_long_name = "At least one of short name or long name is required"
        }

        // Route type is required
        if (!formData.route_type) {
            newErrors.route_type = "Route type is required"
        }

        // Validate color formats
        if (formData.route_color && !/^[0-9A-Fa-f]{6}$/.test(formData.route_color)) {
            newErrors.route_color = "Must be a 6-character hex color (without #)"
        }

        if (formData.route_text_color && !/^[0-9A-Fa-f]{6}$/.test(formData.route_text_color)) {
            newErrors.route_text_color = "Must be a 6-character hex color (without #)"
        }

        // Validate URL format if provided
        if (formData.route_url) {
            try {
                new URL(formData.route_url)
            } catch {
                newErrors.route_url = "Must be a valid URL"
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        setIsLoading(true)

        try {
            // Prepare data - remove empty strings
            const submitData = {}
            Object.keys(formData).forEach((key) => {
                if (formData[key] !== "") {
                    submitData[key] = formData[key]
                }
            })

            if (route) {
                // Update existing route
                await projectService.updateRoute(currentProject.id, route.route_id, submitData)
                toast.success("Route updated successfully")
            } else {
                // Create new route
                await projectService.createRoute(currentProject.id, submitData)
                toast.success("Route created successfully")
            }

            onSuccess()
        } catch (error) {
            toast.error(error.message || "Failed to save route")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{route ? "Edit Route" : "Add New Route"}</DialogTitle>
                    <DialogDescription>
                        {route
                            ? "Update the route information below."
                            : "Fill in the details to create a new route."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Route ID */}
                        <div className="space-y-2">
                            <Label htmlFor="route_id">
                                Route ID {!route && <span className="text-xs text-muted-foreground">(optional)</span>}
                            </Label>
                            <Input
                                id="route_id"
                                value={formData.route_id}
                                onChange={(e) => handleChange("route_id", e.target.value)}
                                placeholder="Auto-generated if empty"
                                disabled={!!route} // Can't change ID when editing
                            />
                        </div>

                        {/* Route Type */}
                        <div className="space-y-2">
                            <Label htmlFor="route_type">
                                Route Type <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={formData.route_type}
                                onValueChange={(value) => handleChange("route_type", value)}
                            >
                                <SelectTrigger id="route_type" className={errors.route_type ? "border-destructive" : ""}>
                                    <SelectValue placeholder="Select route type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ROUTE_TYPES.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.route_type && (
                                <p className="text-xs text-destructive">{errors.route_type}</p>
                            )}
                        </div>
                    </div>

                    {/* Route Short Name */}
                    <div className="space-y-2">
                        <Label htmlFor="route_short_name">Route Short Name</Label>
                        <Input
                            id="route_short_name"
                            value={formData.route_short_name}
                            onChange={(e) => handleChange("route_short_name", e.target.value)}
                            placeholder="e.g., 101"
                            className={errors.route_short_name ? "border-destructive" : ""}
                        />
                        {errors.route_short_name && (
                            <p className="text-xs text-destructive">{errors.route_short_name}</p>
                        )}
                    </div>

                    {/* Route Long Name */}
                    <div className="space-y-2">
                        <Label htmlFor="route_long_name">Route Long Name</Label>
                        <Input
                            id="route_long_name"
                            value={formData.route_long_name}
                            onChange={(e) => handleChange("route_long_name", e.target.value)}
                            placeholder="e.g., Downtown Express"
                            className={errors.route_long_name ? "border-destructive" : ""}
                        />
                        {errors.route_long_name && (
                            <p className="text-xs text-destructive">{errors.route_long_name}</p>
                        )}
                    </div>

                    {/* Route Description */}
                    <div className="space-y-2">
                        <Label htmlFor="route_desc">Description (optional)</Label>
                        <Textarea
                            id="route_desc"
                            value={formData.route_desc}
                            onChange={(e) => handleChange("route_desc", e.target.value)}
                            placeholder="Describe this route..."
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Route Color */}
                        <div className="space-y-2">
                            <Label htmlFor="route_color">Route Color</Label>
                            <div className="flex gap-2">
                                <div
                                    className="w-10 h-10 rounded border"
                                    style={{ backgroundColor: `#${formData.route_color}` }}
                                />
                                <Input
                                    id="route_color"
                                    value={formData.route_color}
                                    onChange={(e) => handleChange("route_color", e.target.value.toUpperCase())}
                                    placeholder="FFFFFF"
                                    maxLength={6}
                                    className={errors.route_color ? "border-destructive" : ""}
                                />
                            </div>
                            {errors.route_color && (
                                <p className="text-xs text-destructive">{errors.route_color}</p>
                            )}
                        </div>

                        {/* Route Text Color */}
                        <div className="space-y-2">
                            <Label htmlFor="route_text_color">Text Color</Label>
                            <div className="flex gap-2">
                                <div
                                    className="w-10 h-10 rounded border flex items-center justify-center text-xs font-bold"
                                    style={{
                                        backgroundColor: `#${formData.route_color}`,
                                        color: `#${formData.route_text_color}`,
                                    }}
                                >
                                    Aa
                                </div>
                                <Input
                                    id="route_text_color"
                                    value={formData.route_text_color}
                                    onChange={(e) => handleChange("route_text_color", e.target.value.toUpperCase())}
                                    placeholder="000000"
                                    maxLength={6}
                                    className={errors.route_text_color ? "border-destructive" : ""}
                                />
                            </div>
                            {errors.route_text_color && (
                                <p className="text-xs text-destructive">{errors.route_text_color}</p>
                            )}
                        </div>
                    </div>

                    {/* Agency */}
                    {agencies.length > 0 && (
                        <div className="space-y-2">
                            <Label htmlFor="agency_id">Agency (optional)</Label>
                            <Select
                                value={formData.agency_id}
                                onValueChange={(value) => handleChange("agency_id", value)}
                            >
                                <SelectTrigger id="agency_id">
                                    <SelectValue placeholder="Select an agency" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">No agency</SelectItem>
                                    {agencies.map((agency) => (
                                        <SelectItem key={agency.agency_id} value={agency.agency_id}>
                                            {agency.agency_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        {/* Route URL */}
                        <div className="space-y-2">
                            <Label htmlFor="route_url">Route URL (optional)</Label>
                            <Input
                                id="route_url"
                                type="url"
                                value={formData.route_url}
                                onChange={(e) => handleChange("route_url", e.target.value)}
                                placeholder="https://..."
                                className={errors.route_url ? "border-destructive" : ""}
                            />
                            {errors.route_url && (
                                <p className="text-xs text-destructive">{errors.route_url}</p>
                            )}
                        </div>

                        {/* Sort Order */}
                        <div className="space-y-2">
                            <Label htmlFor="route_sort_order">Sort Order (optional)</Label>
                            <Input
                                id="route_sort_order"
                                type="number"
                                value={formData.route_sort_order}
                                onChange={(e) => handleChange("route_sort_order", e.target.value)}
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {route ? "Update Route" : "Create Route"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
