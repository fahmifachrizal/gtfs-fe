// components/gtfs-table/data-table.jsx
"use client"
import {
  getCoreRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useState, useEffect, useCallback } from "react"

export function DataTable({
  columns,
  data,
  onHoverCoordinate,
  onSelectData,
  isLoading = false,
  searchValue = "",
  onSearchChange,
  // Pagination props
  page = 1,
  totalPages = 1,
  onPageChange,
  showPagination = false,
  // Meta information
  meta = null,
}) {
  const [selectedDataId, setSelectedDataId] = useState(null)
  const [localSearch, setLocalSearch] = useState(searchValue)

  // Debounce search to avoid excessive API calls
  const debounceSearch = useCallback(
    debounce((value) => {
      if (onSearchChange) {
        onSearchChange(value)
      }
    }, 500), // Increased debounce time to reduce API calls
    [onSearchChange]
  )

  useEffect(() => {
    setLocalSearch(searchValue)
  }, [searchValue])

  useEffect(() => {
    if (localSearch !== searchValue) {
      debounceSearch(localSearch)
    }
  }, [localSearch, debounceSearch, searchValue])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  // Handle row selection and hover events
  const handleRowClick = (row) => {
    setSelectedDataId(row.id)
    console.log("Selected row data:", row.id)
    onSelectData && onSelectData(row)
  }

  const handleSearchChange = (event) => {
    const value = event.target.value
    setLocalSearch(value)
  }

  const clearSearch = () => {
    setLocalSearch("")
    if (onSearchChange) {
      onSearchChange("")
    }
  }

  // Pagination handlers
  const goToPrev = () => {
    if (page > 1 && !isLoading && onPageChange) {
      onPageChange(page - 1)
    }
  }

  const goToNext = () => {
    if (page < totalPages && !isLoading && onPageChange) {
      onPageChange(page + 1)
    }
  }

  const hasResults = data.length > 0
  const shouldShowPagination = showPagination

  // Calculate enhanced pagination display info
  const getDisplayInfo = () => {
    if (!meta) {
      return {
        showing: data.length,
        total: data.length,
        start: hasResults ? 1 : 0,
        end: data.length,
      }
    }

    const { totalItems, pageSize } = meta
    const start = hasResults ? (page - 1) * pageSize + 1 : 0
    const end = Math.min(page * pageSize, totalItems)

    return {
      showing: data.length,
      total: totalItems,
      start,
      end,
    }
  }

  const displayInfo = getDisplayInfo()

  // Generate table cells dynamically based on columns
  const renderTableCells = (row, isHeader = false) => {
    if (isHeader) {
      return row.headers.map((cell) => {
        return (
          cell.column.columnDef.visible && (
            <TableHead key={cell.column.id}>
              {flexRender(cell.column.columnDef.header)}
            </TableHead>
          )
        )
      })
    } else {
      return row
        .getVisibleCells()
        .map(
          (cell) =>
            cell.column.columnDef.visible && (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            )
        )
    }
  }

  return (
    <div className="w-full">
      {/* Search functionality */}
      <div className="flex items-center w-full py-4 relative">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search stops by name or ID..."
            value={localSearch}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-10"
          />
          {localSearch && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted">
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        {isLoading && (
          <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          </div>
        )}
      </div>

      {/* Enhanced results summary */}
      {(searchValue || meta?.totalItems > 0) && (
        <div className="mb-4 flex justify-between items-center text-xs text-muted-foreground">
          {/* Pagination controls - positioned under search */}
          {shouldShowPagination && (
            <div className="flex gap-x-2 items-center">
              <div className="flex gap-x-2 items-center select-none">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrev}
                  disabled={page === 1 || isLoading || !hasResults}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNext}
                  disabled={page === totalPages || isLoading || !hasResults}>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                Page <strong>{page}</strong> of <strong>{totalPages}</strong>
              </div>
            </div>
          )}
          {hasResults && displayInfo.total > displayInfo.showing && (
            <div>
              Showing{" "}
              <strong>
                {displayInfo.start}-{displayInfo.end}
              </strong>{" "}
              {`of `}
              {searchValue ? (
                hasResults ? (
                  <>
                    <strong>{displayInfo.total}</strong> result
                    {displayInfo.total !== 1 ? "s " : " "}
                    for "<em>{searchValue}</em>"
                  </>
                ) : (
                  <>
                    No results found for "<em>{searchValue}</em>"
                  </>
                )
              ) : (
                <>
                  <strong>{displayInfo.total}</strong> stop
                  {displayInfo.total !== 1 ? "s" : ""}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Horizontal scroll container */}
      <div className="w-full overflow-x-auto border rounded-lg">
        <Table className="">
          <TableHeader className="w-full">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {renderTableCells(headerGroup, "header")}
                <TableHead />
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="w-full">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row, idx) => {
                return (
                  <TableRow
                    className={
                      "hover:bg-muted cursor-pointer w-full " +
                      (row.id === selectedDataId
                        ? "bg-accent"
                        : "bg-background")
                    }
                    key={idx}
                    onClick={() => handleRowClick(row)}
                    onMouseEnter={() =>
                      onHoverCoordinate &&
                      row.original.stop_lat &&
                      row.original.stop_lon &&
                      onHoverCoordinate({
                        lat: row.original.stop_lat,
                        lon: row.original.stop_lon,
                      })
                    }
                    onMouseLeave={() =>
                      onHoverCoordinate && onHoverCoordinate(null)
                    }>
                    {renderTableCells(row)}
                    <TableCell className="w-[5%]">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.filter((col) => col.visible).length + 1}
                  className="h-24 text-center text-muted-foreground">
                  {searchValue
                    ? "No stops found matching your search."
                    : "No stops available."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// Debounce utility function
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}
