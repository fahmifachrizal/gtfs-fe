"use client"

import React, { useEffect, useState } from "react"
import { DataTable } from "@/components/gtfs-table/data-table"
import { columns } from "@/components/gtfs-table/columns.jsx"
import { Button } from "@/components/ui/button"
import { Plus, ArrowRightLeft, AlertCircle, Zap } from "lucide-react"
import { useUser } from "@/contexts/UserContext"
import { projectService } from "@/services/projectService"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { TransferDetail } from "@/components/details/TransferDetail"
import { useEditorContext } from "@/contexts/EditorContext"

export default function TransfersPage() {
    const { currentProject, isAuthenticated } = useUser()
    const { setDetailView, selectedData, handleSelectData, fetchAllCounts } = useEditorContext()

    const [transfers, setTransfers] = useState([])
    const [stops, setStops] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false)

    // Open Detail View when data is selected
    useEffect(() => {
        if (selectedData && (selectedData.transfer_id || selectedData.from_stop_id)) {
            setDetailView(
                <TransferDetail
                    transfer={selectedData}
                    stops={stops}
                    onSave={(saved) => {
                        handleSaveTransfer(saved)
                    }}
                    onDelete={(deleted) => {
                        handleDeleteTransfer(deleted)
                    }}
                />
            )
        }
    }, [selectedData, setDetailView, stops])

    const fetchTransfers = async () => {
        if (isLoading || !currentProject) return

        setIsLoading(true)
        setError(null)

        try {
            const [transferResponse, stopResponse] = await Promise.all([
                projectService.getTransfers(currentProject.id),
                projectService.getStops(currentProject.id)
            ])

            if (transferResponse.success && transferResponse.transfers) {
                setTransfers(transferResponse.transfers)
            } else if (Array.isArray(transferResponse)) {
                setTransfers(transferResponse)
            } else {
                setTransfers([])
            }

            if (stopResponse.success && stopResponse.stops) {
                setStops(stopResponse.stops)
            } else if (Array.isArray(stopResponse)) {
                setStops(stopResponse)
            } else {
                setStops([])
            }
        } catch (error) {
            console.error("[TransfersPage] Failed to fetch data:", error)
            setError(error.message || "Failed to load transfers")
            toast.error(error.message || "Failed to load transfers")
            setTransfers([])
        } finally {
            setIsLoading(false)
            setHasAttemptedLoad(true)
        }
    }

    useEffect(() => {
        if (currentProject && isAuthenticated && !hasAttemptedLoad) {
            fetchTransfers()
        }
    }, [currentProject, isAuthenticated, hasAttemptedLoad])

    const handleSaveTransfer = async (savedTransfer) => {
        await fetchTransfers()
        // Update all requirements to unlock next pages
        await fetchAllCounts()
        toast.success(`Transfer rule saved successfully`)
    }

    const handleDeleteTransfer = async (deletedTransfer) => {
        await fetchTransfers()
        // Update all requirements to unlock next pages
        await fetchAllCounts()
        toast.success(`Transfer rule deleted successfully`)
    }

    const handleAddTransfer = () => {
        const newTransfer = {
            isNew: true,
            from_stop_id: "",
            to_stop_id: "",
            transfer_type: 2,
            min_transfer_time: 300,
        }
        setDetailView(
            <TransferDetail
                transfer={newTransfer}
                stops={stops}
                onSave={(saved) => {
                    handleSaveTransfer(saved)
                }}
            />
        )
    }

    const handleGenerateNearby = async () => {
        if (stops.length === 0) {
            toast.error("No stops available. Please create stops first.")
            return
        }

        if (!confirm(`Generate transfer rules for nearby stops?\n\nThis will create transfers for stops within:\n- Distance: 200 meters\n- Type: Minimum time required\n- Min Time: 5 minutes\n\nExisting transfers will not be affected.`)) {
            return
        }

        try {
            setIsLoading(true)
            const result = await projectService.generateTransfersForNearbyStops(currentProject.id, {
                max_distance_meters: 200,
                default_transfer_type: 2,
                default_min_transfer_time: 300
            })
            if (result.success) {
                await fetchTransfers()
                toast.success(`Generated ${result.data.count || 0} transfer rules`)
            }
        } catch (error) {
            toast.error(error.message || "Failed to generate transfers")
        } finally {
            setIsLoading(false)
        }
    }

    if (!currentProject) {
        return <div className="p-8 text-center text-muted-foreground">Please select a project to view transfers.</div>
    }

    return (
        <div className="p-4">
            <div className="mb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ArrowRightLeft className="w-5 h-5" />
                        <h2 className="text-2xl font-bold">Transfers</h2>
                        {isLoading && <span className="text-sm text-muted-foreground animate-pulse ml-2">Loading...</span>}
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleGenerateNearby} size="sm" variant="outline" disabled={stops.length === 0}>
                            <Zap className="w-4 h-4 mr-2" />
                            <span className="font-medium">Generate Nearby</span>
                        </Button>
                        <Button onClick={handleAddTransfer} size="sm" variant="ghost" className="text-foreground hover:bg-accent hover:text-accent-foreground">
                            <Plus className="w-4 h-4 mr-2" />
                            <span className="font-medium">Add Transfer</span>
                        </Button>
                    </div>
                </div>
                <p className="text-muted-foreground mt-2">
                    Manage transfer rules between stops for {currentProject.name}. Define how passengers can transfer between routes.
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
                    columns={columns.transfers}
                    data={transfers || []}
                    onSelectData={handleSelectData}
                    isLoading={isLoading}
                    showPagination={false}
                    entityName="transfers"
                />
            </div>
        </div>
    )
}
