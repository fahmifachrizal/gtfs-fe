"use client"

import React from "react"
import { Database, Construction } from "lucide-react"
import { useUser } from "@/contexts/UserContext"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function StopTimesPage() {
    const { currentProject } = useUser()

    if (!currentProject) {
        return <div className="p-8 text-center text-muted-foreground">Please select a project to view stop times.</div>
    }

    return (
        <div className="p-4">
            <div className="mb-4">
                <div className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    <h2 className="text-2xl font-bold">Stop Times</h2>
                </div>
                <p className="text-muted-foreground mt-2">
                    Manage stop times and schedules for {currentProject.name}. Define arrival and departure times for each trip.
                </p>
            </div>

            <Alert className="mt-6">
                <Construction className="h-4 w-4" />
                <AlertTitle>Under Development</AlertTitle>
                <AlertDescription>
                    The Stop Times management interface is currently under development.
                    You can use the Trips page to manage basic trip information for now.
                    <div className="mt-4 text-sm">
                        <p className="font-semibold">Planned Features:</p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>View and edit stop times for each trip</li>
                            <li>Auto-generate stop times with configurable intervals</li>
                            <li>Bulk editing of arrival and departure times</li>
                            <li>Time validation and conflict detection</li>
                        </ul>
                    </div>
                </AlertDescription>
            </Alert>
        </div>
    )
}
