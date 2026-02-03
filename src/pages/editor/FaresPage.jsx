"use client"

import React, { useEffect, useState } from "react"
import { DataTable } from "@/components/gtfs-table/data-table"
import { Button } from "@/components/ui/button"
import { Plus, CreditCard, AlertCircle } from "lucide-react"
import { useEditorContext } from "@/contexts/EditorContext"
import { useUser } from "@/contexts/UserContext"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { FareDetail } from "@/components/details/FareDetail"

// Fare columns definition
const fareColumns = [
    {
        accessorKey: "fare_id",
        header: "Fare ID",
        cell: ({ row }) => <div className="w-20 font-semibold">{row.getValue("fare_id")}</div>,
        visible: true,
        required: true,
    },
    {
        accessorKey: "price",
        header: "Price",
        cell: ({ row }) => <div className="w-16">{Number(row.getValue("price")).toFixed(2)}</div>,
        visible: true,
        required: true,
    },
    {
        accessorKey: "currency_type",
        header: "Currency",
        cell: ({ row }) => <div className="w-12">{row.getValue("currency_type")}</div>,
        visible: true,
        required: true,
    },
    {
        accessorKey: "payment_method",
        header: "Payment",
        cell: ({ row }) => {
            const value = row.getValue("payment_method")
            return <div className="w-20">{value === 0 ? "On Board" : "Before"}</div>
        },
        visible: true,
        required: true,
    },
    {
        accessorKey: "transfers",
        header: "Transfers",
        cell: ({ row }) => {
            const value = row.getValue("transfers")
            if (value === null || value === undefined) return <div className="w-16">Unlimited</div>
            return <div className="w-16">{value}</div>
        },
        visible: true,
        required: false,
    },
]

export default function FaresPage() {
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

    const faresMeta = getMeta("fare_attributes")
    const { page, totalPages, search: searchValue } = faresMeta

    // Open Detail View when data is selected
    useEffect(() => {
        if (selectedData && selectedData.fare_id) {
            setDetailView(
                <FareDetail
                    fare={selectedData}
                    onSave={(saved) => {
                        handleSaveFare(saved)
                    }}
                    onClose={closeDetail}
                />
            )
        }
    }, [selectedData, setDetailView, closeDetail])

    const fetchFares = async (pageNum = 1, search = "", resetPage = false) => {
        if (isLoading) return

        setIsLoading(true)
        setIsSearching(!!search)
        setError(null)

        try {
            updateMeta("fare_attributes", {
                page: resetPage ? 1 : pageNum,
                search: search,
            })

            if (!currentProject) {
                throw new Error("No project selected")
            }

            const result = await handleFetchData("fares", {
                page: resetPage ? 1 : pageNum,
                search,
            })

            if (result.error) {
                throw new Error(result.error)
            }

            // Force immediate completion status update
            setTimeout(() => checkRequirements(), 0)

        } catch (error) {
            console.error("[FaresPage] Failed to fetch fares:", error)
            setError(error.message || "Failed to load fares")
            toast.error(error.message || "Failed to load fares")

            updateMeta("fare_attributes", {
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
                fetchFares(1, searchValue)
            }
        }
    }, [currentProject, isAuthenticated, hasAttemptedLoad])

    const handleSaveFare = async (savedFare) => {
        await fetchFares(1, savedFare.fare_id || "", true)
        // Update all requirements to unlock next pages
        await fetchAllCounts()
        toast.success(`Fare "${savedFare.fare_id}" saved successfully`)
    }

    const handleAddFare = () => {
        const newFare = {
            isNew: true,
            fare_id: "",
            price: 0,
            currency_type: "IDR",
            payment_method: 0,
            transfers: null,
            transfer_duration: null,
        }
        setDetailView(
            <FareDetail
                fare={newFare}
                onSave={(saved) => {
                    handleSaveFare(saved)
                }}
                onClose={closeDetail}
            />
        )
    }

    const handleSearchChange = (newSearchValue) => {
        fetchFares(1, newSearchValue, true)
    }

    const handlePageChange = (newPage) => {
        fetchFares(newPage, searchValue)
    }

    // Fares use gtfsData.fares from the backend
    const faresData = gtfsData.fares || gtfsData.fare_attributes || []
    const hasResults = faresData.length > 0
    const showPagination = hasResults && (!searchValue || totalPages > 1)

    if (!currentProject) {
        return <div className="p-8 text-center text-muted-foreground">Please select a project to view fares.</div>
    }

    return (
        <div className="p-4">
            <div className="mb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        <h2 className="text-2xl font-bold">Fares</h2>
                        {isLoading && <span className="text-sm text-muted-foreground animate-pulse ml-2">Loading...</span>}
                    </div>
                    <Button onClick={handleAddFare} size="sm" variant="ghost" className="text-foreground hover:bg-accent hover:text-accent-foreground">
                        <Plus className="w-4 h-4 mr-2" />
                        <span className="font-medium">Add Fare</span>
                    </Button>
                </div>
                <p className="text-muted-foreground mt-2">
                    Manage fare attributes for {currentProject.name}. Define pricing and payment options.
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
                    columns={fareColumns}
                    data={faresData}
                    onSelectData={handleSelectData}
                    isLoading={isLoading || isSearching}
                    searchValue={searchValue}
                    onSearchChange={handleSearchChange}
                    page={page}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    showPagination={showPagination}
                    meta={faresMeta}
                    entityName="fares"
                />
            </div>
        </div>
    )
}
