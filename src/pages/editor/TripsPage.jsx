"use client"

import React, { useEffect, useState } from "react"
import { DataTable } from "@/components/gtfs-table/data-table"
import { columns } from "@/components/gtfs-table/columns.jsx"
import { Button } from "@/components/ui/button"
import { Plus, Clock, AlertCircle } from "lucide-react"
import { useEditorContext } from "@/contexts/EditorContext"
import { useUser } from "@/contexts/UserContext"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { TripDetail } from "@/components/details/TripDetail"

export default function TripsPage() {
    const {
        gtfsData,
        handleFetchData,
        handleHoverCoordinate,
        handleSelectData,
        selectedData,
        setDetailView,
        getMeta,
        updateMeta,
        updateMapData,
        clearMap,
        activeDetail
    } = useEditorContext()

    const { currentProject, isAuthenticated } = useUser()

    const [isLoading, setIsLoading] = useState(false)
    const [isSearching, setIsSearching] = useState(false)
    const [error, setError] = useState(null)
    const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false)

    // Get current meta information for trips
    const tripsMeta = getMeta("trips")
    const { page, totalPages, search: searchValue } = tripsMeta

    // Open Detail View when data is selected
    useEffect(() => {
        if (selectedData && selectedData.trip_id) {
            setDetailView(
                <TripDetail
                    trip={selectedData}
                    onSave={(saved) => {
                        handleSaveTrip(saved)
                    }}
                />
            )
        }
    }, [selectedData, setDetailView])

    const fetchTrips = async (pageNum = 1, search = "", resetPage = false) => {
        if (isLoading) return

        setIsLoading(true)
        setIsSearching(!!search)
        setError(null)

        try {
            updateMeta("trips", {
                page: resetPage ? 1 : pageNum,
                search: search,
            })

            if (!currentProject) {
                throw new Error("No project selected")
            }

            const result = await handleFetchData("trips", {
                page: resetPage ? 1 : pageNum,
                search,
            })

            if (result.error) {
                throw new Error(result.error)
            }

        } catch (error) {
            console.error("[TripsPage] Failed to fetch trips:", error)
            setError(error.message || "Failed to load trips")
            toast.error(error.message || "Failed to load trips")

            updateMeta("trips", {
                totalPages: 1,
                totalItems: 0,
            })
        } finally {
            setIsLoading(false)
            setIsSearching(false)
            setHasAttemptedLoad(true)
        }
    }

    // Clear map when leaving the page
    useEffect(() => {
        return () => {
            clearMap()
        }
    }, [clearMap])

    // Fetch when project changes
    useEffect(() => {
        if (currentProject && isAuthenticated) {
            if (!hasAttemptedLoad) {
                fetchTrips(1, searchValue)
            }
        }
    }, [currentProject, isAuthenticated, hasAttemptedLoad])

    const handleSaveTrip = (savedTrip) => {
        fetchTrips(1, savedTrip.trip_headsign || "", true)
        toast.success(`Trip "${savedTrip.trip_id}" saved successfully`)
    }

    const handleAddTrip = () => {
        const newTrip = {
            isNew: true,
            trip_id: "",
            route_id: "",
            service_id: "",
            trip_headsign: "",
            direction_id: 0,
        }
        setDetailView(
            <TripDetail
                trip={newTrip}
                onSave={(saved) => {
                    handleSaveTrip(saved)
                }}
            />
        )
    }

    const handleSearchChange = (newSearchValue) => {
        fetchTrips(1, newSearchValue, true)
    }

    const handlePageChange = (newPage) => {
        fetchTrips(newPage, searchValue)
    }

    const hasResults = gtfsData.trips && gtfsData.trips.length > 0
    const showPagination = hasResults && (!searchValue || totalPages > 1)

    if (!currentProject) {
        return <div className="p-8 text-center text-muted-foreground">Please select a project to view trips.</div>
    }

    return (
        <div className="p-4">
            <div className="mb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        <h2 className="text-2xl font-bold">Trips</h2>
                        {isLoading && <span className="text-sm text-muted-foreground animate-pulse ml-2">Loading...</span>}
                    </div>
                    <Button onClick={handleAddTrip} size="sm" variant="ghost" className="text-foreground hover:bg-accent hover:text-accent-foreground">
                        <Plus className="w-4 h-4 mr-2" />
                        <span className="font-medium">Add Trip</span>
                    </Button>
                </div>
                <p className="text-muted-foreground mt-2">
                    Manage transit trips for {currentProject.name}. Trips define specific journeys on a route.
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
                    columns={columns.trips}
                    data={gtfsData.trips || []}
                    onHoverCoordinate={handleHoverCoordinate}
                    onSelectData={handleSelectData}
                    isLoading={isLoading || isSearching}
                    searchValue={searchValue}
                    onSearchChange={handleSearchChange}
                    page={page}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    showPagination={showPagination}
                    meta={tripsMeta}
                    entityName="trips"
                />
            </div>
        </div>
    )
}
