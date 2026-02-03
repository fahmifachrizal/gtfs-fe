"use client"

import React, { useEffect, useState } from "react"
import { DataTable } from "@/components/gtfs-table/data-table"
import { columns } from "@/components/gtfs-table/columns.jsx"
import { Button } from "@/components/ui/button"
import { Plus, MapPin, AlertCircle } from "lucide-react"
import { useEditorContext } from "@/contexts/EditorContext"
import { useUser } from "@/contexts/UserContext"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { StopDetail } from "@/components/details/StopDetail"

export default function StopsPage() {
  const {
    gtfsData,
    handleFetchData,
    handleHoverCoordinate,
    handleSelectData,
    selectedData, // Access selectedData
    setDetailView, // Access setDetailView
    getMeta,
    updateMeta,
    updateMapData,
    clearMap,
    activeDetail, // Get activeDetail to track sidebar state
    checkRequirements, // For immediate completion status update
    fetchAllCounts, // Fetch counts for all data types
  } = useEditorContext()

  const { currentProject, isAuthenticated } = useUser()

  const handlePreview = (stop) => {
    setPreviewStop(stop)
  }

  // Clear preview when detail is closed
  useEffect(() => {
    if (!activeDetail) {
      setPreviewStop(null)
    }
  }, [activeDetail])

  // Open Detail View when data is selected
  useEffect(() => {
    if (selectedData && selectedData.stop_id) {
      setPreviewStop(null) // Clear any previous preview
      const title = selectedData.stop_name || 'Stop Details'
      setDetailView(
        <StopDetail
          stop={selectedData}
          onPreview={handlePreview}
          onSave={(saved) => {
            handleSaveStop(saved)
            setPreviewStop(null)
          }}
        />,
        title
      )
    }
  }, [selectedData, setDetailView])

  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState(null)
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false)
  const [previewStop, setPreviewStop] = useState(null)

  // Get current meta information for stops
  const stopsMeta = getMeta("stops")
  const { page, totalPages, search: searchValue } = stopsMeta

  const fetchStops = async (pageNum = 1, search = "", resetPage = false) => {
    // If we're already loading specific search/page, maybe debounce? 
    // For now, preventing double-fetch is good, but we must allow new searches.
    if (isLoading) return

    setIsLoading(true)
    setIsSearching(!!search)
    setError(null)

    try {
      // Update meta with current request parameters
      updateMeta("stops", {
        page: resetPage ? 1 : pageNum,
        search: search,
      })

      if (!currentProject) {
        throw new Error("No project selected")
      }

      const result = await handleFetchData("stops", {
        page: resetPage ? 1 : pageNum,
        search,
      })

      if (result.error) {
        throw new Error(result.error)
      }

      // Force immediate completion status update
      setTimeout(() => checkRequirements(), 0)

    } catch (error) {
      console.error("[StopsPage] Failed to fetch stops:", error)
      setError(error.message || "Failed to load stops")
      toast.error(error.message || "Failed to load stops")

      // Reset meta on error
      updateMeta("stops", {
        totalPages: 1,
        totalItems: 0,
      })
    } finally {
      setIsLoading(false)
      setIsSearching(false)
      setHasAttemptedLoad(true)
    }
  }

  // Update map when stops data changes
  useEffect(() => {
    let features = []

    if (gtfsData.stops && gtfsData.stops.length > 0) {
      features = gtfsData.stops
        .filter((stop) => stop.stop_lat && stop.stop_lon)
        .map((stop) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [stop.stop_lon, stop.stop_lat],
          },
          properties: {
            stop_id: stop.stop_id,
            stop_name: stop.stop_name || "Unknown Stop",
            stop_code: stop.stop_code,
            type: "stop",
          },
        }))
    }

    // Add preview stop if valid
    if (previewStop && previewStop.stop_lat && previewStop.stop_lon) {
      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [previewStop.stop_lon, previewStop.stop_lat],
        },
        properties: {
          stop_id: "preview-stop",
          stop_name: previewStop.stop_name || "New Stop (Preview)",
          type: "stop",
          isPreview: true, // Flag for styling
        },
      })
    }

    if (features.length > 0) {
      updateMapData({
        type: "FeatureCollection",
        features,
      })
    } else {
      updateMapData({ type: "FeatureCollection", features: [] })
    }
  }, [gtfsData.stops, previewStop, updateMapData])

  // Initial load effect
  useEffect(() => {
    // Cleanup when leaving the page
    return () => {
      clearMap()
    }
  }, [clearMap])

  // Fetch when project changes or on mount
  useEffect(() => {
    if (currentProject && isAuthenticated) {
      // Only fetch if we haven't loaded yet OR if the current data belongs to a different project/context (simplified by just checking if data is failing)
      // But logic: if project changes, gtfsData might be stale. handleFetchData handles project_id in query.
      // We should fetch if not attempted yet.
      if (!hasAttemptedLoad) {
        fetchStops(1, searchValue)
      }
    }
  }, [currentProject, isAuthenticated, hasAttemptedLoad])

  const handleSaveStop = async (savedStop) => {
    // Refresh the list and search for the new stop to show it
    await fetchStops(1, savedStop.stop_name, true)
    // Update all requirements to unlock next pages
    await fetchAllCounts()
    toast.success(`Stop "${savedStop.stop_name}" saved successfully`)
  }

  const handleAddStop = () => {
    setPreviewStop(null) // Clear any existing preview
    const newStop = {
      isNew: true,
      stop_name: "",
      stop_lat: "",
      stop_lon: "",
      stop_desc: "",
      // Add other default fields if necessary
    }
    const title = "New Stop"
    setDetailView(
      <StopDetail
        stop={newStop}
        onSave={(saved) => {
          handleSaveStop(saved)
          setPreviewStop(null)
        }}
        onPreview={handlePreview}
      />,
      title
    )
  }

  const handleSearchChange = (newSearchValue) => {
    // Fetch data with search and reset to page 1
    fetchStops(1, newSearchValue, true)
  }

  const handlePageChange = (newPage) => {
    // Fetch data for the new page
    fetchStops(newPage, searchValue)
  }

  const hasResults = gtfsData.stops && gtfsData.stops.length > 0
  const showPagination = hasResults && (!searchValue || totalPages > 1)

  if (!currentProject) {
    return <div className="p-8 text-center text-muted-foreground">Please select a project to view stops.</div>
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            <h2 className="text-2xl font-bold">Stops</h2>
            {isLoading && <span className="text-sm text-muted-foreground animate-pulse ml-2">Loading...</span>}
          </div>
          <Button onClick={handleAddStop} size="sm" variant="ghost" className="text-foreground hover:bg-accent hover:text-accent-foreground">
            <Plus className="w-4 h-4 mr-2" />
            <span className="font-medium">Add Stop</span>
          </Button>
        </div>
        <p className="text-muted-foreground mt-2">
          Manage transit stops and stations for {currentProject.name}. Click on a stop to view it on the
          map.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State for Table */}
      {/* Note: DataTable has its own empty state, but we can wrap it if needed */}

      <div className="mt-6">
        <DataTable
          columns={columns.stops}
          data={gtfsData.stops || []}
          onHoverCoordinate={handleHoverCoordinate}
          onSelectData={handleSelectData}
          isLoading={isLoading || isSearching}
          searchValue={searchValue}
          onSearchChange={handleSearchChange}
          page={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          showPagination={showPagination}
          meta={stopsMeta}
          entityName="stops"
        />
      </div>
    </div>
  )
}
