"use client"

import React, { useRef, useState, useEffect } from "react"
import JSZip from "jszip"
import { Upload, X, FileText, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUser } from "@/contexts/UserContext"
import { useApiRequest } from "@/hooks/useApiRequest"
import { toast } from "sonner"

const FileUploader = ({
    onFileUpload,
    projectName: externalProjectName = "",
    projectDescription: externalProjectDescription = "",
    showProjectForm: externalShowProjectForm = true,
    // New props for persistence
    persistentFile = null,
    onFileSelect = null,
    onClearFile = null
}) => {
    const inputRef = useRef(null)
    const [dragOver, setDragOver] = useState(false)

    // Use persistent state if provided, otherwise local
    const [localSelectedFile, setLocalSelectedFile] = useState(null)
    const [zipEntries, setZipEntries] = useState([]) // Always keep entries local or re-parse?
    // Use persistent file if available, otherwise local
    const selectedFile = persistentFile || localSelectedFile

    const [loading, setLoading] = useState(false)

    // State for project form
    const [showProjectForm, setShowProjectForm] = useState(false)
    const [projectName, setProjectName] = useState("")
    const [projectDescription, setProjectDescription] = useState("")
    const [creatingProject, setCreatingProject] = useState(false)

    const { user, refreshProjects } = useUser()
    const { makeRequest } = useApiRequest()
    const [localProject, setLocalProject] = useState(null)

    // Re-parse zip if persistent file changes and we don't have entries
    useEffect(() => {
        if (persistentFile && zipEntries.length === 0) {
            handleFilePreview(persistentFile, true)
        }
    }, [persistentFile])

    const openFilePicker = () => {
        if (inputRef.current) inputRef.current.click()
    }

    const createNewProject = async (name, description = "") => {
        if (!user) throw new Error("You must be logged in.")

        const { data } = await makeRequest("/api/projects", {
            method: "POST",
            body: JSON.stringify({
                name: name.trim(),
                description: description.trim(),
            }),
        })
        return data.project
    }

    const handleCreateProject = async (e) => {
        e.preventDefault()
        if (!projectName.trim()) {
            toast.error("Project name is required")
            return
        }

        setCreatingProject(true)
        try {
            const newProject = await createNewProject(projectName, projectDescription)
            setLocalProject(newProject)
            await refreshProjects()
            toast.success(`Project "${newProject.name}" created successfully!`)
            setShowProjectForm(false)
            setProjectName("")
            setProjectDescription("")

            setTimeout(() => { if (inputRef.current) inputRef.current.click() }, 1000)
        } catch (err) {
            console.error("Project creation error:", err)
            toast.error(err.message || "Failed to create project")
        } finally {
            setCreatingProject(false)
        }
    }

    const handleFilePreview = async (file, isRehydration = false) => {
        if (!user) {
            toast.error("Login required.")
            return
        }

        // Update state
        if (onFileSelect) {
            onFileSelect(file)
        } else {
            setLocalSelectedFile(file)
        }

        setZipEntries([])
        setLoading(true)

        try {
            const zip = await JSZip.loadAsync(file)
            const entries = []
            zip.forEach((relativePath, zipEntry) => {
                if (!zipEntry.name.startsWith("__MACOSX") && !zipEntry.name.endsWith(".DS_Store")) {
                    entries.push({
                        name: zipEntry.name,
                        size: zipEntry._data.uncompressedSize,
                    })
                }
            })
            setZipEntries(entries)
        } catch (err) {
            console.error("Preview error:", err)
            if (!isRehydration) toast.error("Failed to read zip file.")

            // Clear invalid file
            if (onClearFile) onClearFile()
            else setLocalSelectedFile(null)

        } finally {
            setLoading(false)
        }
    }

    const handleUploadExecution = async () => {
        if (!selectedFile || !user) return

        if (externalProjectName && !externalProjectName.trim()) {
            toast.error("Project name is required")
            return
        }

        setLoading(true)
        let projectToUse = localProject

        try {
            if (!projectToUse) {
                const nameToUse = externalProjectName.trim() || `GTFS Project ${new Date().toLocaleDateString()}`
                const descriptionToUse = externalProjectDescription.trim() || `Automatically created project from upload`

                projectToUse = await createNewProject(nameToUse, descriptionToUse)
                setLocalProject(projectToUse)
                await refreshProjects()
            }

            const formData = new FormData()
            formData.append("file", selectedFile)
            formData.append("project_id", projectToUse.id)

            const { data } = await makeRequest("/api/gtfs/upload", {
                method: "POST",
                body: formData
            })

            toast.success("Upload successful!")
            if (data.failedTables?.length) {
                toast.warning(`Failed tables: ${data.failedTables.join(", ")}`)
            }

            if (onFileUpload) {
                onFileUpload(selectedFile)
            }

        } catch (err) {
            console.error("Upload execution error:", err)
            toast.error(err.message || "Upload failed.")
        } finally {
            setLoading(false)
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setDragOver(false)
        const file = Array.from(e.dataTransfer.files).find((f) => f.name.endsWith(".zip"))
        if (file) handleFilePreview(file)
    }

    const handleFileSelect = (e) => {
        const file = e.target.files[0]
        if (file && file.name.endsWith(".zip")) handleFilePreview(file)
    }

    const resetUpload = () => {
        setZipEntries([])
        if (onClearFile) {
            onClearFile()
        } else {
            setLocalSelectedFile(null)
        }
        setLoading(false)
        if (inputRef.current) inputRef.current.value = ""
    }

    const canUpload = !!user
    // Use selectedFile (prop or local)
    const hasFile = !!selectedFile && zipEntries.length > 0

    return (
        <div className="w-full flex-col items-center justify-center space-y-4">
            {/* Internal Project Creation Form */}
            {externalShowProjectForm && showProjectForm && (
                <div className="w-full max-w-md p-6 bg-background border rounded-lg shadow-lg mb-4">
                    <h3 className="text-lg font-semibold mb-4">Create New Project</h3>
                    <form onSubmit={handleCreateProject} className="space-y-4">
                        <div>
                            <Label htmlFor="projectName">Project Name *</Label>
                            <Input
                                id="projectName"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex space-x-2">
                            <Button type="submit" className="flex-1">Create</Button>
                            <Button type="button" variant="outline" onClick={() => setShowProjectForm(false)}>Cancel</Button>
                        </div>
                    </form>
                </div>
            )}

            {/* VIEW SWITCHER */}
            {!hasFile ? (
                /* 1. DROPZONE */
                <div
                    className={`w-full select-none border-2 border-dashed rounded-lg p-6 text-center transition-colors ${!canUpload ? "opacity-50" : dragOver ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20" : "border-gray-700 bg-foreground/10"
                        }`}
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); if (canUpload) setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}>

                    <Upload className="w-10 h-10 mx-auto mb-3" />
                    <p className="text-base font-medium mb-1">Upload GTFS ZIP File</p>
                    <p className="text-xs mb-3 text-muted-foreground">Drag and drop, or click to browse</p>

                    <input ref={inputRef} type="file" accept=".zip" onChange={handleFileSelect} className="hidden" disabled={!canUpload} />

                    <Button size="sm" disabled={loading || !canUpload} onClick={openFilePicker} variant={!canUpload ? "secondary" : "default"}>
                        {loading ? "Reading..." : "Choose File"}
                    </Button>
                </div>
            ) : (
                /* 2. FILE LIST + UPLOAD BUTTON */
                <div className="w-full bg-background border rounded-lg p-0 overflow-hidden flex flex-col max-h-[300px]">
                    {/* Header */}
                    <div className="p-3 border-b bg-muted/30 flex justify-between items-center shrink-0">
                        <div className="flex items-center overflow-hidden">
                            <div className="bg-blue-100 dark:bg-blue-900 p-1.5 rounded mr-3 text-blue-600 dark:text-blue-300">
                                <FileText className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="font-medium text-sm truncate max-w-[200px]">{selectedFile.name}</span>
                                <span className="text-xs text-muted-foreground">{zipEntries.length} files detected</span>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={resetUpload}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Content List */}
                    <div className="overflow-y-auto flex-1 p-0">
                        <ul className="divide-y divide-border/50">
                            {zipEntries.map((entry) => (
                                <li key={entry.name} className="flex justify-between items-center py-2 px-4 text-xs">
                                    <span className="font-medium truncate mr-4 text-muted-foreground">{entry.name}</span>
                                    <span className="text-muted-foreground whitespace-nowrap font-mono">
                                        {(entry.size / 1024).toFixed(1)} KB
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-3 border-t bg-muted/10 flex justify-end gap-2 shrink-0">
                        <Button variant="ghost" size="sm" onClick={resetUpload} disabled={loading}>
                            Cancel
                        </Button>
                        <Button size="sm" onClick={handleUploadExecution} disabled={loading} className="px-6">
                            {loading ? (
                                <>Processing...</>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Start Upload
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default FileUploader
