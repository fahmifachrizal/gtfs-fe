"use client"

import React, { useRef, useState } from "react"
import JSZip from "jszip"
import { Upload, Plus } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { useUser } from "@/contexts/UserContext"

const FileUploader = ({
  onFileUpload,
  projectName: externalProjectName = "",
  projectDescription: externalProjectDescription = "",
  showProjectForm: externalShowProjectForm = true,
}) => {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [zipEntries, setZipEntries] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [failedTables, setFailedTables] = useState([])

  // Project creation states (only used when showProjectForm is true)
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [projectName, setProjectName] = useState("")
  const [projectDescription, setProjectDescription] = useState("")
  const [creatingProject, setCreatingProject] = useState(false)

  const { user, currentProject, setCurrentProject, refreshProjects } = useUser()

  const openFilePicker = () => {
    if (inputRef.current) inputRef.current.click()
  }

  // Function to create a new project
  const createNewProject = async (name, description = "") => {
    if (!user || !user.token) {
      throw new Error("You must be logged in to create a project.")
    }

    const response = await fetch("/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify({
        name: name.trim(),
        description: description.trim(),
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to create project")
    }

    const result = await response.json()
    return result.project
  }

  // Handle project creation from internal form (legacy support)
  const handleCreateProject = async (e) => {
    e.preventDefault()

    if (!projectName.trim()) {
      setError("Project name is required")
      return
    }

    setCreatingProject(true)
    setError(null)

    try {
      const newProject = await createNewProject(projectName, projectDescription)

      // Update user context with new project
      setCurrentProject(newProject)
      await refreshProjects()

      setSuccess(`✅ Project "${newProject.name}" created successfully!`)
      setShowProjectForm(false)
      setProjectName("")
      setProjectDescription("")

      // Auto-trigger file picker after project creation
      setTimeout(() => {
        if (inputRef.current) inputRef.current.click()
      }, 1000)
    } catch (err) {
      console.error("Project creation error:", err)
      setError(err.message || "Failed to create project")
    } finally {
      setCreatingProject(false)
    }
  }

  const handleZipPreviewAndUpload = async (
    file,
    shouldCreateProject = false
  ) => {
    // Check if user is authenticated
    if (!user || !user.token) {
      setError("You must be logged in to upload GTFS data.")
      return
    }

    // If external project name is provided, validate it
    if (externalProjectName && !externalProjectName.trim()) {
      setError("Project name is required")
      return
    }

    let projectToUse = currentProject

    // Create project if needed
    if (!projectToUse || shouldCreateProject) {
      try {
        setLoading(true)

        // Use external project name/description if provided, otherwise use defaults
        const nameToUse =
          externalProjectName.trim() ||
          `GTFS Project ${new Date().toLocaleDateString()}`
        const descriptionToUse =
          externalProjectDescription.trim() ||
          `Automatically created project for GTFS upload on ${new Date().toLocaleString()}`

        projectToUse = await createNewProject(nameToUse, descriptionToUse)

        // Update user context
        setCurrentProject(projectToUse)
        await refreshProjects()
      } catch (err) {
        setError(`Failed to create project: ${err.message}`)
        setLoading(false)
        return
      }
    }

    setZipEntries([])
    setError(null)
    setSuccess(null)
    setFailedTables([])

    try {
      setLoading(true)

      // Preview ZIP contents
      const zip = await JSZip.loadAsync(file)
      const entries = []
      zip.forEach((relativePath, zipEntry) => {
        entries.push({
          name: zipEntry.name,
          size: zipEntry._data.uncompressedSize,
        })
      })
      setZipEntries(entries)

      // Prepare form data with project context
      const formData = new FormData()
      formData.append("file", file)
      formData.append("project_id", projectToUse.id)

      // Upload with authentication
      const res = await fetch("/api/gtfs/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        body: formData,
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(
          result.error || `Upload failed with status ${res.status}`
        )
      }

      setSuccess(
        `✅ Successfully processed tables in project "${projectToUse.name}": ${
          result.tables?.join(", ") || "none"
        }`
      )

      if (result.failedTables?.length) {
        setFailedTables(result.failedTables)
      }

      // Trigger the parent callback to refresh data
      if (onFileUpload) {
        onFileUpload(file)
      }
    } catch (err) {
      console.error("Upload error:", err)
      setError(err.message || "Upload failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = Array.from(e.dataTransfer.files).find((f) =>
      f.name.endsWith(".zip")
    )
    if (file) {
      // If external project name is provided, we're in controlled mode
      if (externalProjectName || !currentProject) {
        handleZipPreviewAndUpload(file, true) // Create project with specified name
      } else {
        handleZipPreviewAndUpload(file)
      }
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file && file.name.endsWith(".zip")) {
      // If external project name is provided, we're in controlled mode
      if (externalProjectName || !currentProject) {
        handleZipPreviewAndUpload(file, true) // Create project with specified name
      } else {
        handleZipPreviewAndUpload(file)
      }
    }
  }

  const canUpload = user && user.token
  const needsProject = !currentProject && !externalProjectName
  const isControlledMode = !!externalProjectName || !externalShowProjectForm

  return (
    <div className="flex w-full flex-col items-center justify-center space-y-4">
      {/* Project Creation Form - Only show in standalone mode */}
      {externalShowProjectForm && showProjectForm && (
        <div className="w-full max-w-md p-6 bg-background border rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Create New Project</h3>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div>
              <Label htmlFor="projectName">Project Name *</Label>
              <Input
                id="projectName"
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="My GTFS Project"
                disabled={creatingProject}
                required
              />
            </div>
            <div>
              <Label htmlFor="projectDescription">Description</Label>
              <Input
                id="projectDescription"
                type="text"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Optional description"
                disabled={creatingProject}
              />
            </div>
            <div className="flex space-x-2">
              <Button
                type="submit"
                disabled={creatingProject || !projectName.trim()}
                className="flex-1">
                {creatingProject ? "Creating..." : "Create Project"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowProjectForm(false)
                  setProjectName("")
                  setProjectDescription("")
                  setError(null)
                }}
                disabled={creatingProject}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* No Project Warning - Only show in standalone mode */}
      {externalShowProjectForm && needsProject && !showProjectForm && (
        <div className="w-full p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg">
          <div className="text-center">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              No Project Selected
            </h3>
            <p className="text-blue-800 dark:text-blue-200 text-sm mb-4">
              You need a project to upload GTFS data. Create one now or upload
              will auto-create one for you.
            </p>
            <Button
              onClick={() => setShowProjectForm(true)}
              variant="default"
              size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Create New Project
            </Button>
          </div>
        </div>
      )}

      {/* Project Name Validation Error - Show in controlled mode */}
      {isControlledMode &&
        externalProjectName &&
        !externalProjectName.trim() && (
          <div className="w-full p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-md">
            <p className="text-red-800 dark:text-red-200 text-sm">
              ❌ Please enter a project name above before uploading
            </p>
          </div>
        )}

      {/* File Upload Area */}
      <div
        className={`w-full select-none border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          !canUpload || (isControlledMode && !externalProjectName.trim())
            ? "border-gray-400 bg-gray-100/50 dark:border-gray-600 dark:bg-gray-800/50 opacity-50"
            : dragOver
            ? "border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20"
            : "border-gray-700 bg-foreground/10"
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault()
          if (canUpload && (!isControlledMode || externalProjectName.trim())) {
            setDragOver(true)
          }
        }}
        onDragLeave={() => setDragOver(false)}>
        <Upload
          className={`w-12 h-12 mx-auto mb-4 ${
            !canUpload || (isControlledMode && !externalProjectName.trim())
              ? "text-gray-400"
              : ""
          }`}
        />
        <p
          className={`text-lg font-medium mb-2 ${
            !canUpload || (isControlledMode && !externalProjectName.trim())
              ? "text-gray-400"
              : ""
          }`}>
          Upload GTFS ZIP File
        </p>
        <p
          className={`text-sm mb-4 ${
            !canUpload || (isControlledMode && !externalProjectName.trim())
              ? "text-gray-400"
              : "text-muted-foreground"
          }`}>
          Drag and drop your GTFS zip file here, or click below to browse
        </p>

        <input
          ref={inputRef}
          type="file"
          accept=".zip"
          onChange={handleFileSelect}
          className="hidden"
          disabled={
            !canUpload || (isControlledMode && !externalProjectName.trim())
          }
        />

        <Button
          disabled={
            loading ||
            !canUpload ||
            (isControlledMode && !externalProjectName.trim())
          }
          onClick={openFilePicker}
          variant={
            !canUpload || (isControlledMode && !externalProjectName.trim())
              ? "secondary"
              : "default"
          }>
          <Upload className="w-4 h-4 mr-2" />
          {loading ? "Processing..." : "Choose File"}
        </Button>

        {/* Current Project Display - Only show in standalone mode */}
        {!isControlledMode && currentProject && (
          <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-md">
            <p className="text-green-800 dark:text-green-200 text-sm">
              📁 Current Project: <strong>{currentProject.name}</strong>
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-md">
            <p className="text-red-800 dark:text-red-200 text-sm">❌ {error}</p>
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-md">
            <p className="text-green-800 dark:text-green-200 text-sm">
              {success}
            </p>
          </div>
        )}

        {failedTables.length > 0 && (
          <div className="mt-2 p-3 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-md">
            <p className="text-yellow-800 dark:text-yellow-200 text-sm">
              ⚠️ Failed to process: {failedTables.join(", ")}
            </p>
          </div>
        )}
      </div>

      {zipEntries.length > 0 && (
        <div className="w-full max-w-md mt-6">
          <h2 className="text-xl font-semibold mb-4 text-center">
            📂 GTFS Files Inside ZIP
          </h2>
          <div className="bg-background/40 border rounded-md p-4 max-h-80 overflow-y-auto">
            <ul className="space-y-2 text-sm">
              {zipEntries.map((entry) => (
                <li
                  key={entry.name}
                  className="flex justify-between items-center py-1">
                  <span className="font-medium">{entry.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {(entry.size / 1024).toFixed(1)} KB
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

export default FileUploader
