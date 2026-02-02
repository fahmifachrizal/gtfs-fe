
import React, { useState, useEffect } from "react"
import { Plus, Upload, FolderPlus, Calendar, Clock, FileText, Trash2, Check } from "lucide-react"
import { useNavigate } from "react-router-dom"
import FileUploader from "../../components/gtfs/FileUploader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEditorContext } from "@/contexts/EditorContext"
import { useUser } from "@/contexts/UserContext"
import { toast } from "sonner"
import { getApiUrl } from "@/config/api"

export default function EditorWelcome() {
  const navigate = useNavigate()
  const { handleFetchData } = useEditorContext()
  const { user, currentProject, setCurrentProject, refreshProjects, projects } =
    useUser()

  // Modal states
  const [showStartModal, setShowStartModal] = useState(false)
  const [activeTab, setActiveTab] = useState("empty")

  // Project creation states
  const [projectName, setProjectName] = useState("")
  const [projectDescription, setProjectDescription] = useState("")

  // Import creation states
  const [importName, setImportName] = useState("")
  const [importDesc, setImportDesc] = useState("")
  const [uploadedProject, setUploadedProject] = useState(null)

  const [creatingProject, setCreatingProject] = useState(false)

  // Recent projects
  const [recentProjects, setRecentProjects] = useState([])

  // Delete Project State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (projects && projects.length > 0) {
      const filtered = currentProject
        ? projects.filter((p) => p.id !== currentProject.id)
        : projects

      const recent = filtered
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        .slice(0, 3)

      setRecentProjects(recent)
    }
  }, [projects, currentProject])

  const createNewProject = async (name, description = "") => {
    if (!user || !user.token) {
      throw new Error("You must be logged in to create a project.")
    }

    const fullUrl = getApiUrl("/api/projects")
    const response = await fetch(fullUrl, {
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

  const handleCreateProject = async (e, type = "empty") => {
    e.preventDefault()

    const name = type === "import" ? importName : projectName
    const desc = type === "import" ? importDesc : projectDescription

    if (!name.trim()) {
      toast.error("Project name is required")
      return
    }

    setCreatingProject(true)

    try {
      const newProject = await createNewProject(name, desc)

      // Update user context with new project
      setCurrentProject(newProject)
      await refreshProjects()

      toast.success(`Project "${newProject.name}" created successfully!`)

      // Logic for example data could go here if type === 'example'
      if (type === "example") {
        toast.info("Example data generation not yet implemented, creating empty project instead.")
      }

      setProjectName("")
      setProjectDescription("")
      setShowStartModal(false)
      navigate("/editor/agency")

    } catch (err) {
      console.error("Project creation error:", err)
      toast.error(err.message || "Failed to create project")
    } finally {
      setCreatingProject(false)
    }
  }

  const handleProjectSelect = async (project) => {
    setCurrentProject(project)
    navigate("/editor/agency")
  }

  const handleDeleteClick = (e, project) => {
    e.stopPropagation() // Prevent card click
    setProjectToDelete(project)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return

    setDeleting(true)
    try {
      const fullUrl = getApiUrl(`/api/projects/${projectToDelete.id}`)
      const response = await fetch(fullUrl, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete project")
      }

      toast.success(`Project "${projectToDelete.name}" deleted`)

      // If deleted project was current, clear it
      if (currentProject && currentProject.id === projectToDelete.id) {
        setCurrentProject(null)
      }

      await refreshProjects()
      setDeleteDialogOpen(false)
      setProjectToDelete(null)
    } catch (err) {
      console.error("Delete error:", err)
      toast.error(err.message || "Failed to delete project")
    } finally {
      setDeleting(false)
    }
  }

  const resetModal = () => {
    setProjectName("")
    setProjectDescription("")
    setImportName("")
    setImportDesc("")
    setImportFile(null)
    setActiveTab("empty")
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
        <Card className="mb-4 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/10 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base text-green-800 dark:text-green-200 flex items-center gap-2">
              📂 Current Project
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-green-700 hover:text-red-600 hover:bg-green-100 dark:hover:bg-green-900/50"
              onClick={(e) => handleDeleteClick(e, currentProject)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <h3 className="font-semibold text-green-900 dark:text-green-100 text-lg">
              {currentProject.name}
            </h3>
            {currentProject.description && (
              <p className="text-xs text-green-700 dark:text-green-300 mt-0.5 line-clamp-1">
                {currentProject.description}
              </p>
            )}
            <div className="mt-3">
              <Button
                size="sm"
                onClick={() => navigate("/editor/agency")}
                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto h-8 text-xs">
                Continue Working
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Projects */}
      {recentProjects.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 px-1">Recent Projects</h3>
          <div className="space-y-2">
            {recentProjects.map((project) => (
              <Card
                key={project.id}
                className="cursor-pointer hover:shadow-md transition-all group"
                onClick={() => handleProjectSelect(project)}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 pr-2">
                      <h4 className="font-medium text-sm truncate">{project.name}</h4>
                      {project.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(project.updated_at)}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500"
                        onClick={(e) => handleDeleteClick(e, project)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
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

          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Start New Project</DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="empty" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="empty">Create Empty</TabsTrigger>
                <TabsTrigger value="example">With Example</TabsTrigger>
                <TabsTrigger value="import">Import .zip</TabsTrigger>
              </TabsList>

              {/* EMPTY PROJECT TAB */}
              <TabsContent value="empty" className="space-y-4 pt-4">
                <form onSubmit={(e) => handleCreateProject(e, "empty")} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="projectName">Project Name *</Label>
                    <Input
                      id="projectName"
                      placeholder="My New Transit Project"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="projectDescription">Description</Label>
                    {/* Fallback to Input if Textarea is not available, but usually nice to haveTextArea */}
                    <Input
                      id="projectDescription"
                      placeholder="Optional description"
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={creatingProject}>
                    {creatingProject ? "Creating..." : "Create Empty Project"}
                  </Button>
                </form>
              </TabsContent>

              {/* EXAMPLE PROJECT TAB */}
              <TabsContent value="example" className="space-y-4 pt-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-200 dark:border-blue-800 mb-2">
                  <p className="text-sm text-blue-800 dark:text-blue-200 flex items-start gap-2">
                    <FileText className="w-4 h-4 mt-0.5 shrink-0" />
                    Start with a pre-populated dataset to explore the editor features.
                  </p>
                </div>
                <form onSubmit={(e) => handleCreateProject(e, "example")} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="exProjectName">Project Name *</Label>
                    <Input
                      id="exProjectName"
                      placeholder="Example GTFS Project"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exProjectDescription">Description</Label>
                    <Input
                      id="exProjectDescription"
                      placeholder="Optional description"
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={creatingProject}>
                    {creatingProject ? "Creating..." : "Create with Example Data"}
                  </Button>
                </form>
              </TabsContent>

              {/* IMPORT ZIP TAB */}
              <TabsContent value="import" className="space-y-4 pt-4">
                {!uploadedProject ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="importName">Project Name *</Label>
                      <Input
                        id="importName"
                        placeholder="Imported Project Name"
                        value={importName}
                        onChange={(e) => setImportName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="importDesc">Description</Label>
                      <Input
                        id="importDesc"
                        placeholder="Optional description"
                        value={importDesc}
                        onChange={(e) => setImportDesc(e.target.value)}
                      />
                    </div>

                    <div className="pt-2">
                      <Label className="mb-2 block">Upload GTFS Zip File</Label>
                      <FileUploader
                        projectName={importName}
                        projectDescription={importDesc}
                        showProjectForm={false}
                        onFileUpload={(file, project) => {
                          setUploadedProject(project)
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 space-y-4 text-center animate-in fade-in zoom-in duration-300">
                    <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                      <Check className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Upload Complete!</h3>
                      <p className="text-muted-foreground mt-1">
                        Project <span className="font-medium text-foreground">"{uploadedProject.name}"</span> has been created with your GTFS data.
                      </p>
                    </div>
                    <div className="pt-4 w-full">
                      <Button
                        size="lg"
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => handleProjectSelect(uploadedProject)}
                      >
                        Open Project
                      </Button>
                      <Button
                        variant="ghost"
                        className="mt-2 w-full text-muted-foreground"
                        onClick={() => {
                          setUploadedProject(null);
                          resetModal();
                        }}
                      >
                        Create Another
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        {!user && (
          <p className="text-sm text-muted-foreground mt-3">
            Please log in to create projects
          </p>
        )}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold">{projectToDelete?.name}</span>?
              <br />This action cannot be undone and will delete all associated GTFS data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteProject} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
