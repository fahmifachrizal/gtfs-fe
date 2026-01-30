
import React, { useEffect, useState } from "react"
import { DataTable } from "@/components/gtfs-table/data-table"
import { columns } from "@/components/gtfs-table/columns"
import { Button } from "@/components/ui/button"
import { Plus, MapPin } from "lucide-react"
import { useEditorContext } from "@/contexts/EditorContext"
import { useUser } from "@/contexts/UserContext"

export default function StopsPage() {
  const {
    gtfsData,
    handleFetchData,
    handleHoverCoordinate,
    handleSelectData,
    getMeta,
    updateMeta,
  } = useEditorContext()

  const { currentProject } = useUser();

  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  // Get current meta information for stops
  const stopsMeta = getMeta("stops")
  const { page, totalPages, totalItems, search: searchValue } = stopsMeta

  const fetchStops = async (pageNum = 1, search = "", resetPage = false) => {
    // Prevent multiple simultaneous requests
    if (isLoading) return

    setIsLoading(true)
    setIsSearching(!!search)

    try {
      // Update meta with current request parameters
      updateMeta("stops", {
        page: resetPage ? 1 : pageNum,
        search: search,
      })

      // Ensure we have a project
      if (!currentProject) {
        console.warn("No current project selected")
        return; 
      }

      await handleFetchData("stops", {
        page: resetPage ? 1 : pageNum,
        search,
      })

    } catch (error) {
      console.error("Failed to fetch stops:", error)
      updateMeta("stops", {
        totalPages: 1,
        totalItems: 0,
      })
    } finally {
      setIsLoading(false)
      setIsSearching(false)
    }
  }

  // Initial load
  useEffect(() => {
    if (currentProject) {
         // Only fetch if we have a project context
         // Only fetch if we don't have data already or if search value changed
        if (gtfsData.stops.length === 0 || searchValue) {
            fetchStops(1, searchValue)
        }
    }
  }, [currentProject])

  const handleAddStop = () => {
    // TODO: Implement add stop functionality
    console.log("Add new stop")
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
      <div className="">
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
          Manage transit stops and stations for {currentProject.name}. Click on a stop to view it on the
          map.
        </p>
      </div>

      <div className="mt-6">
        <DataTable
            columns={columns.stops}
            data={gtfsData.stops || []}
            onHoverCoordinate={handleHoverCoordinate}
            onSelectData={handleSelectData}
            isLoading={isSearching}
            searchValue={searchValue}
            onSearchChange={handleSearchChange}
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            showPagination={showPagination}
            meta={stopsMeta}
        />
      </div>
    </div>
  )
}
