"use client"
import React from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react"

export function DataTable({
  columns,
  data,
  onRowClick,
  isLoading = false,
  searchValue = "",
  onSearchChange,
  page = 1,
  totalPages = 1,
  onPageChange,
  showPagination = false,
  meta = null,
}) {
  const [localSearch, setLocalSearch] = React.useState(searchValue)

  React.useEffect(() => {
    setLocalSearch(searchValue)
  }, [searchValue])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  // Basic debounce implementation
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchValue && onSearchChange) {
        onSearchChange(localSearch)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [localSearch, searchValue, onSearchChange])

  return (
    <div className="w-full space-y-4">
      {/* Search Bar */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
           <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
           <Input
             placeholder="Search..."
             value={localSearch}
             onChange={(e) => setLocalSearch(e.target.value)}
             className="pl-8"
           />
           {localSearch && (
              <Button
                variant="ghost" 
                size="sm" 
                className="absolute right-1 top-1 h-7 w-7 p-0"
                onClick={() => {
                  setLocalSearch("")
                  onSearchChange("")
                }}
              >
                  <X className="h-4 w-4" />
              </Button>
           )}
        </div>
        {isLoading && <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />}
      </div>

      {/* Table */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => onRowClick && onRowClick(row.original)}
                  className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {isLoading ? "Loading..." : "No results."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className="flex items-center justify-between space-x-2 py-4">
           <div className="flex-1 text-sm text-muted-foreground">
             {meta ? (
                 <>Showing <strong>{(page - 1) * meta.pageSize + 1}-{Math.min(page * meta.pageSize, meta.totalItems)}</strong> of <strong>{meta.totalItems}</strong></>
             ) : (
                <>Page {page} of {totalPages}</>
             )}
           </div>
           <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages || isLoading}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
