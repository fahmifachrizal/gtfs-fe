import { projectService } from "@/services/projectService"
import { useUser } from "@/contexts/UserContext"
import { useEditorContext } from "@/contexts/EditorContext"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { Route, Save, Search, Plus, GripVertical, X, AlertCircle } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DetailLayout } from "@/components/details/DetailLayout"

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

export function RouteDetail({ route, initialStops, onSave, onClose }) {
    const { currentProject } = useUser()
    const { updateRouteStops } = useEditorContext()
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState(route?.route_id ? 2 : 1) // Step 1: Route details, Step 2: Stop assignment
    const [agencies, setAgencies] = useState([])
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
    const [showDiscardDialog, setShowDiscardDialog] = useState(false)

    // Route form data
    const [formData, setFormData] = useState({
        route_id: route?.route_id || "",
        route_short_name: route?.route_short_name || "",
        route_long_name: route?.route_long_name || "",
        route_desc: route?.route_desc || "",
        route_type: route?.route_type?.toString() || "3",
        agency_id: route?.agency_id || "",
        agency_name: route?.agency?.agency_name || "",
        route_color: route?.route_color || "FFFFFF",
        route_text_color: route?.route_text_color || "000000",
        route_url: route?.route_url || "",
        route_sort_order: route?.route_sort_order?.toString() || "",
    })

    // Saved route data (after step 1)
    const [savedRoute, setSavedRoute] = useState(route || null)

    // Stop assignment data
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState([])
    const [assignedStops, setAssignedStops] = useState([]) // All stops, with direction_id
    const [selectedDirection, setSelectedDirection] = useState(0) // 0: Outbound, 1: Inbound
    const [draggedIndex, setDraggedIndex] = useState(null)

    // Derived state for display - filter by direction
    const displayedStops = assignedStops
        .filter(s => (s.direction_id ?? 0) === selectedDirection)
        .sort((a, b) => a.stop_sequence - b.stop_sequence)

    // Fetch agencies on mount
    useEffect(() => {
        if (currentProject) {
            fetchAgencies()
        }
    }, [currentProject])

    // Load assigned stops - prefer initialStops from context, fallback to API fetch
    useEffect(() => {
        if (initialStops && initialStops.length > 0) {
            // Use pre-fetched stops from context
            setAssignedStops(initialStops)
            return
        }

        if (currentProject && route?.route_id) {
            const fetchRouteStops = async () => {
                try {
                    const response = await projectService.getRouteStops(currentProject.id, route.route_id)

                    if (response.success && response.data) {
                        // Backend returns RouteStop[] with includes Stop
                        const mappedStops = response.data
                            .filter(rs => rs.stop) // Filter out records with missing stop relation
                            .map(rs => ({
                                ...rs.stop,
                                stop_sequence: rs.stop_sequence,
                                direction_id: rs.direction_id ?? 0
                            }))
                        setAssignedStops(mappedStops)
                    }
                } catch (error) {
                    console.error("Failed to fetch route stops:", error)
                    toast.error("Failed to load assigned stops")
                }
            }
            fetchRouteStops()
        }
    }, [currentProject, route, initialStops])

    const fetchAgencies = async () => {
        try {
            const response = await projectService.getAgencies(currentProject.id)
            if (response.success && response.data) {
                setAgencies(response.data)
            }
        } catch (error) {
            console.error("Failed to fetch agencies:", error)
            toast.error("Failed to load agencies")
        }
    }

    // Search stops
    const handleSearchStops = async (query) => {
        if (!query.trim()) {
            setSearchResults([])
            return
        }

        if (!currentProject) {
            console.error("No current project available")
            return
        }

        try {
            const response = await projectService.getStops(currentProject.id, {
                search: query,
                limit: 5
            })
            if (response.success) {
                const stopsData = response.stops || response.data || []
                // Filter out already assigned stops IN CURRENT DIRECTION
                const currentDirectionStopIds = assignedStops
                    .filter(s => (s.direction_id ?? 0) === selectedDirection)
                    .map(s => s.stop_id)

                setSearchResults(stopsData.filter(s => !currentDirectionStopIds.includes(s.stop_id)))
            }
        } catch (error) {
            console.error("Failed to search stops:", error)
            toast.error(error.message || "Failed to search stops")
        }
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            handleSearchStops(searchQuery)
        }, 300)
        return () => clearTimeout(timer)
    }, [searchQuery, assignedStops])

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        setHasUnsavedChanges(true)
    }

    const validateForm = () => {
        // At least one name is required
        if (!formData.route_short_name && !formData.route_long_name) {
            toast.error("At least one of short name or long name is required")
            return false
        }

        // Route type is required
        if (!formData.route_type) {
            toast.error("Route type is required")
            return false
        }

        // Validate color formats
        if (formData.route_color && !/^[0-9A-Fa-f]{6}$/.test(formData.route_color)) {
            toast.error("Route color must be a 6-character hex color (without #)")
            return false
        }

        if (formData.route_text_color && !/^[0-9A-Fa-f]{6}$/.test(formData.route_text_color)) {
            toast.error("Text color must be a 6-character hex color (without #)")
            return false
        }

        // Validate URL format if provided
        if (formData.route_url) {
            try {
                new URL(formData.route_url)
            } catch {
                toast.error("Route URL must be a valid URL")
                return false
            }
        }

        return true
    }

    const handleSubmitRouteDetails = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        setLoading(true)

        try {
            // Prepare data - remove empty strings
            const submitData = {}
            Object.keys(formData).forEach((key) => {
                if (formData[key] !== "") {
                    submitData[key] = formData[key]
                }
            })

            let result
            if (route?.route_id) {
                // Update existing route
                result = await projectService.updateRoute(currentProject.id, route.route_id, submitData)
                toast.success("Route updated successfully")
            } else {
                // Create new route
                result = await projectService.createRoute(currentProject.id, submitData)
                toast.success("Route created successfully")
            }

            if (result.success) {
                setSavedRoute(result.data)
                setHasUnsavedChanges(false)
                setStep(2) // Move to stop assignment
            }
        } catch (error) {
            toast.error(error.message || "Failed to save route")
        } finally {
            setLoading(false)
        }
    }

    const handleAddStop = (stop) => {
        const newStop = {
            ...stop,
            stop_sequence: displayedStops.length + 1,
            direction_id: selectedDirection
        }

        setAssignedStops(prev => [...prev, newStop])
        setSearchQuery("")
        setSearchResults([])
        setHasUnsavedChanges(true)
    }

    const handleRemoveStop = (stopId) => {
        setAssignedStops(prev => {
            // Keep stops from other directions
            const otherStops = prev.filter(s => (s.direction_id ?? 0) !== selectedDirection)

            // Filter stops in current direction
            const currentDirectionStops = prev.filter(s => (s.direction_id ?? 0) === selectedDirection && s.stop_id !== stopId)

            // Reorder sequences for current direction
            const reorderedCurrent = currentDirectionStops.map((s, idx) => ({ ...s, stop_sequence: idx + 1 }))

            return [...otherStops, ...reorderedCurrent]
        })
        setHasUnsavedChanges(true)
    }

    const handleDragStart = (index) => {
        setDraggedIndex(index)
    }

    const handleDragOver = (e, index) => {
        e.preventDefault()
        if (draggedIndex === null || draggedIndex === index) return

        // We only drag within displayed stops
        const newDisplayed = [...displayedStops]
        const draggedStop = newDisplayed[draggedIndex]
        newDisplayed.splice(draggedIndex, 1)
        newDisplayed.splice(index, 0, draggedStop)

        // Update sequences for displayed stops
        const reorderedDisplayed = newDisplayed.map((s, idx) => ({ ...s, stop_sequence: idx + 1 }))

        // Merge back into main state
        setAssignedStops(prev => {
            const otherStops = prev.filter(s => (s.direction_id ?? 0) !== selectedDirection)
            return [...otherStops, ...reorderedDisplayed]
        })

        setDraggedIndex(index)
        setHasUnsavedChanges(true)
    }

    const handleDragEnd = () => {
        setDraggedIndex(null)
    }

    const handleSaveStops = async () => {
        setLoading(true)
        try {
            await projectService.assignStopsToRoute(
                currentProject.id,
                savedRoute.route_id,
                displayedStops, // Only save current direction's stops
                selectedDirection
            )
            toast.success(`Route stops (${selectedDirection === 0 ? "Outbound" : "Inbound"}) saved successfully`)
            setHasUnsavedChanges(false)
            if (onSave) onSave(savedRoute)

            // Re-fetch to sync with DB and update context state
            const response = await projectService.getRouteStops(currentProject.id, savedRoute.route_id)
            if (response.success && response.data) {
                const mappedStops = response.data.map(rs => ({
                    ...rs.stop,
                    stop_sequence: rs.stop_sequence,
                    direction_id: rs.direction_id ?? 0
                }))
                setAssignedStops(mappedStops)

                // Update context state so RoutesPage map display is synced
                updateRouteStops(savedRoute.route_id, mappedStops, selectedDirection)
            }

        } catch (error) {
            toast.error(error.message || "Failed to save stops")
        } finally {
            setLoading(false)
        }
    }

    const handleCloseAttempt = () => {
        if (hasUnsavedChanges) {
            setShowDiscardDialog(true)
        } else {
            if (onClose) onClose()
        }
    }

    const handleDiscard = () => {
        setShowDiscardDialog(false)
        if (onClose) onClose()
    }

    // Step 1: Route Details Form
    if (step === 1) {
        return (
            <DetailLayout
                icon={Route}
                label={route ? "Edit Route" : "New Route"}
                title={route ? route.route_short_name || route.route_long_name : "Create Route"}
                onClose={handleCloseAttempt}
                showSaveButton={false}
                customFooter={
                    <>
                        <Button type="button" variant="outline" onClick={handleCloseAttempt} disabled={loading} className="flex-1 h-8 text-xs font-medium">Cancel</Button>
                        <Button type="submit" form="route-form" className="flex-1 h-8 text-xs font-medium" disabled={loading}>
                            <Save className="w-3 h-3 mr-2" />
                            {loading ? "Saving..." : "Save & Continue"}
                        </Button>
                    </>
                }
            >
                <form id="route-form" onSubmit={handleSubmitRouteDetails} className="flex flex-col gap-2.5 flex-1 overflow-y-auto px-1">
                    {/* 1. route_id - Required for all routes */}
                    <div className="grid gap-1">
                        <Label htmlFor="route_id" className="text-[10px] font-semibold text-muted-foreground uppercase">
                            Route ID {!route && <span className="text-xs">(optional)</span>}
                        </Label>
                        <Input
                            id="route_id"
                            value={formData.route_id}
                            onChange={(e) => handleChange("route_id", e.target.value)}
                            placeholder="Auto-generated"
                            disabled={!!route}
                            className="h-7 text-xs font-mono"
                        />
                    </div>

                    {/* 2. agency_id - Conditionally required */}
                    <div className="grid gap-1">
                        <Label htmlFor="agency_id" className="text-[10px] font-semibold text-muted-foreground uppercase">
                            Agency
                        </Label>
                        {agencies.length > 0 ? (
                            <Select
                                value={formData.agency_id}
                                onValueChange={(value) => handleChange("agency_id", value)}
                            >
                                <SelectTrigger id="agency_id" className="h-7 text-xs">
                                    <SelectValue placeholder="Select agency" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="" className="text-xs">No agency</SelectItem>
                                    {agencies.map((agency) => (
                                        <SelectItem key={agency.agency_id} value={agency.agency_id} className="text-xs">
                                            {agency.agency_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <Input
                                id="agency_name"
                                value={formData.agency_name}
                                onChange={(e) => handleChange("agency_name", e.target.value)}
                                placeholder="e.g., City Transit Authority"
                                className="h-7 text-xs"
                            />
                        )}
                    </div>

                    {/* 3 & 4. route_short_name & route_long_name - Conditionally required */}
                    <div className="grid grid-cols-2 gap-2.5">
                        <div className="grid gap-1">
                            <Label htmlFor="route_short_name" className="text-[10px] font-semibold text-muted-foreground uppercase">
                                Short Name
                            </Label>
                            <Input
                                id="route_short_name"
                                value={formData.route_short_name}
                                onChange={(e) => handleChange("route_short_name", e.target.value)}
                                placeholder="e.g., 101"
                                className="h-7 text-xs"
                            />
                        </div>

                        <div className="grid gap-1">
                            <Label htmlFor="route_long_name" className="text-[10px] font-semibold text-muted-foreground uppercase">
                                Long Name
                            </Label>
                            <Input
                                id="route_long_name"
                                value={formData.route_long_name}
                                onChange={(e) => handleChange("route_long_name", e.target.value)}
                                placeholder="e.g., Downtown Express"
                                className="h-7 text-xs"
                            />
                        </div>
                    </div>

                    {/* 5. route_desc - Optional */}
                    <div className="grid gap-1">
                        <Label htmlFor="route_desc" className="text-[10px] font-semibold text-muted-foreground uppercase">
                            Description
                        </Label>
                        <Textarea
                            id="route_desc"
                            value={formData.route_desc}
                            onChange={(e) => handleChange("route_desc", e.target.value)}
                            placeholder="Optional description"
                            rows={2}
                            className="text-xs min-h-12.5 resize-none"
                        />
                    </div>

                    {/* 6. route_type - Required */}
                    <div className="grid gap-1">
                        <Label htmlFor="route_type" className="text-[10px] font-semibold text-muted-foreground uppercase">
                            Type <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={formData.route_type}
                            onValueChange={(value) => handleChange("route_type", value)}
                        >
                            <SelectTrigger id="route_type" className="h-7 text-xs">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                {ROUTE_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value} className="text-xs">
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 7. route_url - Optional */}
                    <div className="grid gap-1">
                        <Label htmlFor="route_url" className="text-[10px] font-semibold text-muted-foreground uppercase">
                            Route URL
                        </Label>
                        <Input
                            id="route_url"
                            type="url"
                            value={formData.route_url}
                            onChange={(e) => handleChange("route_url", e.target.value)}
                            placeholder="https://..."
                            className="h-7 text-xs"
                        />
                    </div>

                    {/* 8 & 9. route_color & route_text_color - Optional */}
                    <div className="grid grid-cols-2 gap-2.5">
                        <div className="grid gap-1">
                            <Label htmlFor="route_color" className="text-[10px] font-semibold text-muted-foreground uppercase">
                                Route Color
                            </Label>
                            <div className="flex gap-2">
                                <div
                                    className="w-7 h-7 rounded border shrink-0"
                                    style={{ backgroundColor: `#${formData.route_color}` }}
                                />
                                <Input
                                    id="route_color"
                                    value={formData.route_color}
                                    onChange={(e) => handleChange("route_color", e.target.value.toUpperCase())}
                                    placeholder="FFFFFF"
                                    maxLength={6}
                                    className="h-7 text-xs font-mono"
                                />
                            </div>
                        </div>

                        <div className="grid gap-1">
                            <Label htmlFor="route_text_color" className="text-[10px] font-semibold text-muted-foreground uppercase">
                                Text Color
                            </Label>
                            <div className="flex gap-2">
                                <div
                                    className="w-7 h-7 rounded border flex items-center justify-center text-[10px] font-bold shrink-0"
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
                                    className="h-7 text-xs font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 10. route_sort_order - Optional */}
                    <div className="grid gap-1">
                        <Label htmlFor="route_sort_order" className="text-[10px] font-semibold text-muted-foreground uppercase">
                            Sort Order
                        </Label>
                        <Input
                            id="route_sort_order"
                            type="number"
                            value={formData.route_sort_order}
                            onChange={(e) => handleChange("route_sort_order", e.target.value)}
                            placeholder="0"
                            className="h-7 text-xs"
                        />
                    </div>
                </form>

                <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
                            <AlertDialogDescription>
                                You have unsaved changes. Are you sure you want to discard them?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Continue Editing</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDiscard}>Discard</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </DetailLayout>
        )
    }

    // Step 2: Stop Assignment
    return (
        <DetailLayout
            icon={Route}
            label="Route Stops"
            title={savedRoute?.route_short_name || savedRoute?.route_long_name}
            description={savedRoute?.route_desc}
            onClose={handleCloseAttempt}
            showSaveButton={false}
            customFooter={
                <>
                    <Button type="button" variant="outline" onClick={handleCloseAttempt} disabled={loading} className="flex-1 h-8 text-xs font-medium">Close</Button>
                    <Button type="button" onClick={handleSaveStops} className="flex-1 h-8 text-xs font-medium" disabled={loading || assignedStops.length === 0}>
                        <Save className="w-3 h-3 mr-2" />
                        {loading ? "Saving..." : "Save Stops"}
                    </Button>
                </>
            }
        >
            <div className="flex flex-col gap-2.5 flex-1 overflow-hidden p-1">
                {/* Direction Selector */}
                <div className="flex items-center gap-2 px-1">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase shrink-0">Direction</Label>
                    <div className="flex bg-muted rounded-md p-0.5">
                        <button
                            type="button"
                            onClick={() => setSelectedDirection(0)}
                            className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${selectedDirection === 0
                                ? "bg-background shadow-sm text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            Outbound (0)
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedDirection(1)}
                            className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${selectedDirection === 1
                                ? "bg-background shadow-sm text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            Inbound (1)
                        </button>
                    </div>
                </div>

                {/* Search Box */}
                <div className="flex-none">
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={`Search stops to add to ${selectedDirection === 0 ? 'Outbound' : 'Inbound'}...`}
                            className="h-8 text-xs pl-7"
                        />
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <div className="mt-1 border rounded-md max-h-32 overflow-y-auto">
                            {searchResults.map((stop) => (
                                <div
                                    key={stop.stop_id}
                                    className="flex items-center justify-between p-2 hover:bg-accent cursor-pointer text-xs"
                                    onClick={() => handleAddStop(stop)}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{stop.stop_name}</div>
                                        <div className="text-[10px] text-muted-foreground">{stop.stop_id}</div>
                                    </div>
                                    <Plus className="h-3 w-3 text-muted-foreground shrink-0 ml-2" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Assigned Stops List */}
                <div className="flex-1 overflow-y-auto">
                    {displayedStops.length === 0 ? (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                                No stops assigned to {selectedDirection === 0 ? 'Outbound' : 'Inbound'} direction.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <div className="space-y-1">
                            {displayedStops.map((stop, index) => (
                                <div
                                    key={`${stop.stop_id}-${stop.stop_sequence}`}
                                    draggable
                                    onDragStart={() => handleDragStart(index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragEnd={handleDragEnd}
                                    className={`flex items-center gap-2 p-2 border rounded-md bg-background cursor-move hover:bg-accent ${draggedIndex === index ? "opacity-50" : ""}`}
                                >
                                    <GripVertical className="h-3 w-3 text-muted-foreground shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-mono text-muted-foreground">
                                                #{stop.stop_sequence}
                                            </span>
                                            <span className="text-xs font-medium truncate">{stop.stop_name}</span>
                                        </div>
                                        <div className="text-[10px] text-muted-foreground">{stop.stop_id}</div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveStop(stop.stop_id)}
                                        className="h-6 w-6 p-0 shrink-0"
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Discard changes?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You have unsaved changes to the stop assignments. Are you sure you want to discard them?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Continue Editing</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDiscard}>Discard</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DetailLayout>
    )
}
