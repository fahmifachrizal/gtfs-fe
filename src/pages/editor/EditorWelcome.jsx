
import React, { useState, useEffect } from "react"
import { Plus, Upload, FolderPlus, Calendar, Clock } from "lucide-react"
import { useNavigate } from "react-router-dom"
import FileUploader from "../../components/file-uploader" // Check path
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useEditorContext } from "@/contexts/EditorContext"
import { useUser } from "@/contexts/UserContext"

export default function EditorWelcome() {
  const navigate = useNavigate()
  const { handleFetchData } = useEditorContext()
  const { user, currentProject, setCurrentProject, refreshProjects, projects } =
    useUser()

  // Modal states
  const [showStartModal, setShowStartModal] = useState(false)
  const [modalStep, setModalStep] = useState("choose") // 'choose', 'upload', 'create'

  // Project creation states
  const [projectName, setProjectName] = useState("")
  const [projectDescription, setProjectDescription] = useState("")
  const [creatingProject, setCreatingProject] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Recent projects (limit to 3 most recent)
  const [recentProjects, setRecentProjects] = useState([])

  useEffect(() => {
    if (projects && projects.length > 0) {
      // Get 3 most recent projects (excluding current project if selected)
      const filtered = currentProject
        ? projects.filter((p) => p.id !== currentProject.id)
        : projects

      const recent = filtered
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        .slice(0, 3)

      setRecentProjects(recent)
    }
  }, [projects, currentProject])

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

  const handleFileUpload = async (file) => {
    try {
      await handleFetchData("stops")
      setShowStartModal(false)
      navigate("/editor/stops")
    } catch (error) {
      console.error("Failed to process uploaded data:", error)
    }
  }

  // Handle manual project creation
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

      setSuccess(`Project "${newProject.name}" created successfully!`)

      // Reset form and close modal
      setTimeout(() => {
        setProjectName("")
        setProjectDescription("")
        setShowStartModal(false)
        setModalStep("choose")
        navigate("/editor/stops")
      }, 1500)
    } catch (err) {
      console.error("Project creation error:", err)
      setError(err.message || "Failed to create project")
    } finally {
      setCreatingProject(false)
    }
  }

  const handleProjectSelect = async (project) => {
    setCurrentProject(project)
    navigate("/editor/stops")
  }

  const resetModal = () => {
    setModalStep("choose")
    setError(null)
    setSuccess(null)
    setProjectName("")
    setProjectDescription("")
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-3">
          Welcome to GTFS Editor
          {user?.first_name && (
            <span className="text-2xl font-normal text-muted-foreground">
              , {user.first_name}
            </span>
          )}
        </h2>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Create and manage public transit feeds using the General Transit Feed
          Specification (GTFS). Build routes, stops, schedules, and more with
          our intuitive editor.
        </p>
      </div>

      {/* Current Project Display */}
      {currentProject && (
        <Card className="mb-6 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-green-800 dark:text-green-200">
              📁 Current Project
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <h3 className="font-semibold text-green-900 dark:text-green-100">
              {currentProject.name}
            </h3>
            {currentProject.description && (
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                {currentProject.description}
              </p>
            )}
            <div className="mt-3">
              <Button
                onClick={() => navigate("/editor/stops")}
                className="bg-green-600 hover:bg-green-700">
                Continue Working
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Projects */}
      {recentProjects.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Recent Projects</h3>
          <div className="space-y-3">
            {recentProjects.map((project) => (
              <Card
                key={project.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleProjectSelect(project)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{project.name}</h4>
                      {project.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-sm text-muted-foreground ml-4">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(project.updated_at)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Start New Project Button */}
      <div className="text-center">
        <Dialog
          open={showStartModal}
          onOpenChange={(open) => {
            setShowStartModal(open)
            if (!open) resetModal()
          }}>
          <DialogTrigger asChild>
            <Button size="lg" className="px-8 py-3" disabled={!user}>
              <Plus className="w-5 h-5 mr-2" />
              Start New Project
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {modalStep === "choose" && "Start New Project"}
                {modalStep === "upload" && "Upload GTFS Data"}
                {modalStep === "create" && "Create Empty Project"}
              </DialogTitle>
            </DialogHeader>

            {/* Choose Option Step */}
            {modalStep === "choose" && (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  How would you like to start your new GTFS project?
                </p>

                <div className="grid gap-3">
                  {/* File Upload Option - To be implemented fully */}
                  <Button
                    variant="outline"
                    className="justify-start h-auto p-4"
                    onClick={() => setModalStep("create")}>
                     {/* Simplified to just create for now, as file uploader component might need props */}
                    <FolderPlus className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Create Empty Project</div>
                      <div className="text-sm text-muted-foreground">
                        Start from scratch with a new project
                      </div>
                    </div>
                  </Button>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    variant="ghost"
                    onClick={() => setShowStartModal(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Create Project Step */}
            {modalStep === "create" && (
              <div className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-md">
                    <p className="text-red-800 dark:text-red-200 text-sm">
                      {error}
                    </p>
                  </div>
                )}

                {success && (
                  <div className="p-3 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-md">
                    <p className="text-green-800 dark:text-green-200 text-sm">
                      {success}
                    </p>
                  </div>
                )}

                <form onSubmit={handleCreateProject} className="space-y-4">
                  <div>
                    <Label htmlFor="projectName">Project Name *</Label>
                    <Input
                      id="projectName"
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="My Transit Project"
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
                      placeholder="Optional project description"
                      disabled={creatingProject}
                    />
                  </div>

                  <div className="flex justify-between pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setModalStep("choose")}
                      disabled={creatingProject}>
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={creatingProject || !projectName.trim()}>
                      {creatingProject ? "Creating..." : "Create Project"}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {!user && (
          <p className="text-sm text-muted-foreground mt-3">
            Please log in to create projects
          </p>
        )}
      </div>
    </div>
  )
}
