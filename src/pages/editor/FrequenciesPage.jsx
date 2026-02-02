"use client"

import React, { useEffect, useState } from "react"
import { DataTable } from "@/components/gtfs-table/data-table"
import { columns } from "@/components/gtfs-table/columns.jsx"
import { Button } from "@/components/ui/button"
import { Plus, Radio, AlertCircle, Zap } from "lucide-react"
import { useUser } from "@/contexts/UserContext"
import { projectService } from "@/services/projectService"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { FrequencyDetail } from "@/components/details/FrequencyDetail"
import { useEditorContext } from "@/contexts/EditorContext"

export default function FrequenciesPage() {
    const { currentProject, isAuthenticated } = useUser()
    const { setDetailView, selectedData, handleSelectData, fetchAllCounts } = useEditorContext()

    const [frequencies, setFrequencies] = useState([])
    const [trips, setTrips] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false)

    // Open Detail View when data is selected
    useEffect(() => {
        if (selectedData && selectedData.frequency_id) {
            setDetailView(
                <FrequencyDetail
                    frequency={selectedData}
                    trips={trips}
                    onSave={(saved) => {
                        handleSaveFrequency(saved)
                    }}
                    onDelete={(deleted) => {
                        handleDeleteFrequency(deleted)
                    }}
                />
            )
        }
    }, [selectedData, setDetailView, trips])

    const fetchFrequencies = async () => {
        if (isLoading || !currentProject) return

        setIsLoading(true)
        setError(null)

        try {
            const [freqResponse, tripResponse] = await Promise.all([
                projectService.getFrequencies(currentProject.id),
                projectService.getTrips(currentProject.id)
            ])

            if (freqResponse.success && freqResponse.frequencies) {
                setFrequencies(freqResponse.frequencies)
            } else if (Array.isArray(freqResponse)) {
                setFrequencies(freqResponse)
            } else {
                setFrequencies([])
            }

            if (tripResponse.success && tripResponse.trips) {
                setTrips(tripResponse.trips)
            } else if (Array.isArray(tripResponse)) {
                setTrips(tripResponse)
            } else {
                setTrips([])
            }
        } catch (error) {
            console.error("[FrequenciesPage] Failed to fetch data:", error)
            setError(error.message || "Failed to load frequencies")
            toast.error(error.message || "Failed to load frequencies")
            setFrequencies([])
        } finally {
            setIsLoading(false)
            setHasAttemptedLoad(true)
        }
    }

    useEffect(() => {
        if (currentProject && isAuthenticated && !hasAttemptedLoad) {
            fetchFrequencies()
        }
    }, [currentProject, isAuthenticated, hasAttemptedLoad])

    const handleSaveFrequency = async (savedFrequency) => {
        await fetchFrequencies()
        // Update all requirements to unlock next pages
        await fetchAllCounts()
        toast.success(`Frequency for trip "${savedFrequency.trip_id}" saved successfully`)
    }

    const handleDeleteFrequency = async (deletedFrequency) => {
        await fetchFrequencies()
        // Update all requirements to unlock next pages
        await fetchAllCounts()
        toast.success(`Frequency deleted successfully`)
    }

    const handleAddFrequency = () => {
        const newFrequency = {
            isNew: true,
            trip_id: "",
            start_time: "06:00:00",
            end_time: "22:00:00",
            headway_secs: 600,
            exact_times: 0,
        }
        setDetailView(
            <FrequencyDetail
                frequency={newFrequency}
                trips={trips}
                onSave={(saved) => {
                    handleSaveFrequency(saved)
                }}
            />
        )
    }

    const handleGenerateDefaults = async () => {
        if (trips.length === 0) {
            toast.error("No trips available. Please create trips first.")
            return
        }

        const tripId = trips[0].trip_id
        if (!confirm(`Generate default frequencies for trip "${tripId}"?\n\nThis will create 3 frequency periods:\n- Morning peak (06:00-09:00, 10min)\n- Midday (09:00-16:00, 15min)\n- Evening peak (16:00-19:00, 10min)`)) {
            return
        }

        try {
            setIsLoading(true)
            const result = await projectService.generateDefaultFrequencies(currentProject.id, tripId)
            if (result.success) {
                await fetchFrequencies()
                toast.success("Default frequencies generated successfully")
            }
        } catch (error) {
            toast.error(error.message || "Failed to generate default frequencies")
        } finally {
            setIsLoading(false)
        }
    }

    if (!currentProject) {
        return <div className="p-8 text-center text-muted-foreground">Please select a project to view frequencies.</div>
    }

    return (
        <div className="p-4">
            <div className="mb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Radio className="w-5 h-5" />
                        <h2 className="text-2xl font-bold">Frequencies</h2>
                        {isLoading && <span className="text-sm text-muted-foreground animate-pulse ml-2">Loading...</span>}
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleGenerateDefaults} size="sm" variant="outline" disabled={trips.length === 0}>
                            <Zap className="w-4 h-4 mr-2" />
                            <span className="font-medium">Generate Defaults</span>
                        </Button>
                        <Button onClick={handleAddFrequency} size="sm" variant="ghost" className="text-foreground hover:bg-accent hover:text-accent-foreground">
                            <Plus className="w-4 h-4 mr-2" />
                            <span className="font-medium">Add Frequency</span>
                        </Button>
                    </div>
                </div>
                <p className="text-muted-foreground mt-2">
                    Manage headway-based service frequencies for {currentProject.name}. Define service intervals instead of exact times.
                </p>
            </div>

            {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="mt-6">
                <DataTable
                    columns={columns.frequencies}
                    data={frequencies || []}
                    onSelectData={handleSelectData}
                    isLoading={isLoading}
                    showPagination={false}
                    entityName="frequencies"
                />
            </div>
        </div>
    )
}
