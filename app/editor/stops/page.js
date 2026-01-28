"use client"

import React, { useEffect, useState } from "react"
import { DataTable } from "@/components/gtfs-table/data-table"
import { columns } from "@/components/gtfs-table/columns"
import { Button } from "@/components/ui/button"
import { Plus, MapPin, AlertCircle } from "lucide-react"
import { useEditorContext } from "@/contexts/EditorContext"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function StopsPage() {
  const {
    gtfsData,
    handleFetchData,
    handleHoverCoordinate,
    handleSelectData,
    getMeta,
    updateMeta,
    updateMapData,
    clearMap
  } = useEditorContext()

  // Add useEffect for cleanup
  useEffect(() => {
    // Cleanup when leaving the page
    return () => {
      clearMap()
    }
  }, [clearMap])

  const [isLoading, setIsLoading] = useState(true) // Start with true for initial load
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState(null)
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false)

  // Get current meta information for stops
  const stopsMeta = getMeta("stops")
  const { page, totalPages, totalItems, search: searchValue } = stopsMeta

  const fetchStops = async (pageNum = 1, search = "", resetPage = false) => {
    // Prevent multiple simultaneous requests
    if (isLoading && hasAttemptedLoad) {
      console.log("[StopsPage] Already loading, skipping fetch")
      return
    }

    console.log("[StopsPage] Fetching stops:", { pageNum, search, resetPage })

    setIsLoading(true)
    setIsSearching(!!search)
    setError(null)

    try {
      // Update meta with current request parameters
      updateMeta("stops", {
        page: resetPage ? 1 : pageNum,
        search: search,
      })

      const result = await handleFetchData("stops", {
        page: resetPage ? 1 : pageNum,
        search,
      })

      console.log("[StopsPage] Fetch result:", result)

      // Update map data with stops
      if (gtfsData.stops && gtfsData.stops.length > 0) {
        const stopsGeoJSON = {
          type: "FeatureCollection",
          features: gtfsData.stops
            .filter((stop) => stop.stop_lat && stop.stop_lon)
            .map((stop) => ({
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [stop.stop_lon, stop.stop_lat],
              },
              properties: {
                stop_id: stop.stop_id,
                stop_name: stop.stop_name,
                stop_code: stop.stop_code,
                type: "stop",
              },
            })),
        }

        console.log(
          "[StopsPage] Updating map with",
          stopsGeoJSON.features.length,
          "stops"
        )
        updateMapData(stopsGeoJSON)
      }

      if (result?.error) {
        setError(result.error)
      }
    } catch (error) {
      console.error("[StopsPage] Failed to fetch stops:", error)
      setError(error.message || "Failed to load stops")

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

  // Initial load
  useEffect(() => {
    console.log(
      "[StopsPage] Initial effect, hasAttemptedLoad:",
      hasAttemptedLoad
    )
    console.log("[StopsPage] Current stops count:", gtfsData.stops?.length || 0)

    // Always fetch on mount if we haven't attempted yet
    if (!hasAttemptedLoad) {
      console.log("[StopsPage] Triggering initial fetch")
      fetchStops(1, searchValue)
    }
  }, []) // Empty deps - only run on mount

  // Update map when stops data changes
  useEffect(() => {
    if (gtfsData.stops && gtfsData.stops.length > 0) {
      const stopsGeoJSON = {
        type: "FeatureCollection",
        features: gtfsData.stops
          .filter((stop) => stop.stop_lat && stop.stop_lon)
          .map((stop) => ({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [stop.stop_lon, stop.stop_lat],
            },
            properties: {
              stop_id: stop.stop_id,
              stop_name: stop.stop_name,
              stop_code: stop.stop_code,
              type: "stop",
            },
          })),
      }

      updateMapData(stopsGeoJSON)
    }
  }, [gtfsData.stops])

  const handleAddStop = () => {
    // TODO: Implement add stop functionality
    console.log("Add new stop")
  }

  const handleSearchChange = (newSearchValue) => {
    console.log("[StopsPage] Search changed:", newSearchValue)
    // Fetch data with search and reset to page 1
    fetchStops(1, newSearchValue, true)
  }

  const handlePageChange = (newPage) => {
    // Fetch data for the new page
    fetchStops(newPage, searchValue)
  }

  const hasResults = gtfsData.stops && gtfsData.stops.length > 0
  const showPagination = hasResults && (!searchValue || totalPages > 1)

  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            <h2 className="text-2xl font-bold">Stops</h2>
          </div>
          <Button onClick={handleAddStop} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Stop
          </Button>
        </div>
        <p className="text-muted-foreground mt-2">
          Manage transit stops and stations. Click on a stop to view it on the
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

      {/* Empty State */}
      {!isLoading && hasAttemptedLoad && !hasResults && !error && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No stops found.{" "}
            {searchValue
              ? "Try a different search term."
              : "Start by adding your first stop."}
          </AlertDescription>
        </Alert>
      )}

      <DataTable
        columns={columns.stops}
        data={gtfsData.stops || []}
        onHoverCoordinate={handleHoverCoordinate}
        onSelectData={handleSelectData}
        isLoading={isLoading}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        showPagination={showPagination}
        meta={stopsMeta}
      />
    </div>
  )
}
