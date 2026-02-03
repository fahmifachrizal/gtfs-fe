"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Building2, AlertCircle, Plus } from "lucide-react"
import { useUser } from "@/contexts/UserContext"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useEditorContext } from "@/contexts/EditorContext"
import { AgencyDetail } from "@/components/details/AgencyDetail"
import { Card, CardContent } from "@/components/ui/card"

export default function AgencyPage() {
    const { currentProject, isAuthenticated } = useUser()
    const {
        gtfsData,
        handleFetchData,
        setDetailView,
        checkRequirements,
        fetchAllCounts,
    } = useEditorContext()

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false)

    const fetchAgencies = async () => {
        if (!currentProject) return

        setIsLoading(true)
        setError(null)

        try {
            const result = await handleFetchData("agency")

            if (result.error) {
                throw new Error(result.error)
            }

            // Force immediate completion status update
            setTimeout(() => checkRequirements(), 0)
        } catch (error) {
            console.error("[AgencyPage] Failed to fetch agencies:", error)
            setError(error.message || "Failed to load agencies")
        } finally {
            setIsLoading(false)
            setHasAttemptedLoad(true)
        }
    }

    // Initial load
    useEffect(() => {
        if (currentProject && isAuthenticated && !hasAttemptedLoad) {
            fetchAgencies()
        }
    }, [currentProject, isAuthenticated, hasAttemptedLoad])

    const handleAddAgency = () => {
        const newAgency = {
            isNew: true,
            agency_name: "",
            agency_url: "",
            agency_timezone: "Asia/Jakarta",
            agency_lang: "en",
        }
        const title = "New Agency"
        setDetailView(
            <AgencyDetail
                agency={newAgency}
                onSave={handleSaveAgency}
                onDelete={handleDeleteAgency}
            />,
            title
        )
    }

    const handleEditAgency = (agency) => {
        const title = agency.agency_name || 'Agency Details'
        setDetailView(
            <AgencyDetail
                agency={agency}
                onSave={handleSaveAgency}
                onDelete={handleDeleteAgency}
            />,
            title
        )
    }

    const handleSaveAgency = async () => {
        // Refresh the list
        await fetchAgencies()
        // Update all requirements to unlock next pages
        await fetchAllCounts()
        setDetailView(null)
    }

    const handleDeleteAgency = async () => {
        // Refresh the list
        await fetchAgencies()
        // Update all requirements to unlock next pages
        await fetchAllCounts()
        setDetailView(null)
    }

    if (!currentProject) {
        return <div className="p-8 text-center text-muted-foreground">Please select a project to continue.</div>
    }

    const agencies = gtfsData.agency || []
    const hasAgencies = agencies.length > 0

    return (
        <div className="p-4">
            <div className="mb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        <h2 className="text-2xl font-bold">Transit Agency</h2>
                        {isLoading && <span className="text-sm text-muted-foreground animate-pulse ml-2">Loading...</span>}
                    </div>
                    <Button onClick={handleAddAgency} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Agency
                    </Button>
                </div>
                <p className="text-muted-foreground mt-2">
                    Provide information about your transit agency. At least one agency is required.
                </p>
            </div>

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Loading State */}
            {isLoading && !hasAgencies ? (
                <div className="text-center py-8 text-muted-foreground">Loading agencies...</div>
            ) : hasAgencies ? (
                <div className="space-y-3">
                    {agencies.map((agency) => (
                        <Card
                            key={agency.agency_id}
                            className="cursor-pointer hover:bg-accent/50 transition-colors"
                            onClick={() => handleEditAgency(agency)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-sm truncate">
                                            {agency.agency_name}
                                        </h3>
                                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                                            {agency.agency_url}
                                        </p>
                                    </div>
                                    <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                                </div>
                                <div className="mt-3 pt-3 border-t">
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <span className="text-muted-foreground">Timezone:</span>
                                            <p className="font-medium truncate">{agency.agency_timezone}</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Language:</span>
                                            <p className="font-medium">{agency.agency_lang || "—"}</p>
                                        </div>
                                    </div>
                                    {agency.agency_phone && (
                                        <div className="mt-2 text-xs">
                                            <span className="text-muted-foreground">Phone:</span>
                                            <p className="font-medium truncate">{agency.agency_phone}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <Building2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground mb-4">No agencies found.</p>
                    <Button onClick={handleAddAgency} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Agency
                    </Button>
                </div>
            )}
        </div>
    )
}
