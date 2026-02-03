"use client"

import React, { useEffect, useState } from "react"
import { DataTable } from "@/components/gtfs-table/data-table"
import { columns } from "@/components/gtfs-table/columns.jsx"
import { Button } from "@/components/ui/button"
import { Plus, Calendar as CalendarIcon, AlertCircle } from "lucide-react"
import { useEditorContext } from "@/contexts/EditorContext"
import { useUser } from "@/contexts/UserContext"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { CalendarDetail } from "@/components/details/CalendarDetail"

export default function CalendarPage() {
    const {
        gtfsData,
        handleFetchData,
        handleSelectData,
        selectedData,
        setDetailView,
        closeDetail,
        getMeta,
        updateMeta,
        clearMap,
        checkRequirements, // For immediate completion status update
        fetchAllCounts, // Fetch counts for all data types
    } = useEditorContext()

    const { currentProject, isAuthenticated } = useUser()

    const [isLoading, setIsLoading] = useState(false)
    const [isSearching, setIsSearching] = useState(false)
    const [error, setError] = useState(null)
    const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false)

    const calendarMeta = getMeta("calendar")
    const { page, totalPages, search: searchValue } = calendarMeta

    // Open Detail View when data is selected
    useEffect(() => {
        if (selectedData && selectedData.service_id) {
            setDetailView(
                <CalendarDetail
                    calendar={selectedData}
                    onSave={(saved) => {
                        handleSaveCalendar(saved)
                    }}
                    onClose={closeDetail}
                />
            )
        }
    }, [selectedData, setDetailView, closeDetail])

    const fetchCalendar = async (pageNum = 1, search = "", resetPage = false) => {
        if (isLoading) return

        setIsLoading(true)
        setIsSearching(!!search)
        setError(null)

        try {
            updateMeta("calendar", {
                page: resetPage ? 1 : pageNum,
                search: search,
            })

            if (!currentProject) {
                throw new Error("No project selected")
            }

            const result = await handleFetchData("calendar", {
                page: resetPage ? 1 : pageNum,
                search,
            })

            if (result.error) {
                throw new Error(result.error)
            }

            // Force immediate completion status update
            setTimeout(() => checkRequirements(), 0)

        } catch (error) {
            console.error("[CalendarPage] Failed to fetch calendar:", error)
            setError(error.message || "Failed to load calendar")
            toast.error(error.message || "Failed to load calendar")

            updateMeta("calendar", {
                totalPages: 1,
                totalItems: 0,
            })
        } finally {
            setIsLoading(false)
            setIsSearching(false)
            setHasAttemptedLoad(true)
        }
    }

    useEffect(() => {
        return () => {
            clearMap()
        }
    }, [clearMap])

    useEffect(() => {
        if (currentProject && isAuthenticated) {
            if (!hasAttemptedLoad) {
                fetchCalendar(1, searchValue)
            }
        }
    }, [currentProject, isAuthenticated, hasAttemptedLoad])

    const handleSaveCalendar = async (savedCalendar) => {
        await fetchCalendar(1, savedCalendar.service_id || "", true)
        // Update all requirements to unlock next pages
        await fetchAllCounts()
        toast.success(`Calendar "${savedCalendar.service_id}" saved successfully`)
    }

    const handleAddCalendar = () => {
        const newCalendar = {
            isNew: true,
            service_id: "",
            monday: 1,
            tuesday: 1,
            wednesday: 1,
            thursday: 1,
            friday: 1,
            saturday: 0,
            sunday: 0,
            start_date: "",
            end_date: "",
        }
        setDetailView(
            <CalendarDetail
                calendar={newCalendar}
                onSave={(saved) => {
                    handleSaveCalendar(saved)
                }}
                onClose={closeDetail}
            />
        )
    }

    const handleSearchChange = (newSearchValue) => {
        fetchCalendar(1, newSearchValue, true)
    }

    const handlePageChange = (newPage) => {
        fetchCalendar(newPage, searchValue)
    }

    const hasResults = gtfsData.calendar && gtfsData.calendar.length > 0
    const showPagination = hasResults && (!searchValue || totalPages > 1)

    if (!currentProject) {
        return <div className="p-8 text-center text-muted-foreground">Please select a project to view calendar.</div>
    }

    return (
        <div className="p-4">
            <div className="mb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5" />
                        <h2 className="text-2xl font-bold">Calendar</h2>
                        {isLoading && <span className="text-sm text-muted-foreground animate-pulse ml-2">Loading...</span>}
                    </div>
                    <Button onClick={handleAddCalendar} size="sm" variant="ghost" className="text-foreground hover:bg-accent hover:text-accent-foreground">
                        <Plus className="w-4 h-4 mr-2" />
                        <span className="font-medium">Add Service</span>
                    </Button>
                </div>
                <p className="text-muted-foreground mt-2">
                    Manage service schedules for {currentProject.name}. Define which days services operate.
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
                    columns={columns.calendar}
                    data={gtfsData.calendar || []}
                    onSelectData={handleSelectData}
                    isLoading={isLoading || isSearching}
                    searchValue={searchValue}
                    onSearchChange={handleSearchChange}
                    page={page}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    showPagination={showPagination}
                    meta={calendarMeta}
                    entityName="services"
                />
            </div>
        </div>
    )
}
