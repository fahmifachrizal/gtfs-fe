// app/projects/page.js - Projects management page
"use client"
import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Plus,
  FolderOpen,
  Calendar,
  Clock,
  MapPin,
  Route,
  MoreVertical,
  Edit,
  Trash2,
  Download,
  Share,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@/contexts/UserContext"
import { AuthGuard } from "@/components/auth/AuthGuard"

function ProjectsPageContent() {
  const router = useRouter()
  const { user, projects, currentProject, setCurrentProject, refreshProjects } =
    useUser()
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredProjects, setFilteredProjects] = useState([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    if (projects) {
      const filtered = projects.filter(
        (project) =>
          project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredProjects(filtered)
    }
  }, [projects, searchTerm])

  const handleProjectSelect = async (project) => {
    setCurrentProject(project)
    router.push("/editor")
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getProjectStats = (project) => {
    // This would typically come from your API
    return {
      stops: Math.floor(Math.random() * 100) + 10,
      routes: Math.floor(Math.random() * 20) + 1,
      lastModified: formatDate(project.updated_at),
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Restricted</h1>
          <p className="text-muted-foreground mb-6">
            Please log in to view your projects
          </p>
          <Button onClick={() => router.push("/login")}>Log In</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Projects</h1>
            <p className="text-muted-foreground mt-1">
              Manage your GTFS projects and transit data
            </p>
          </div>

          <Button
            onClick={() => router.push("/editor")}
            size="lg"
            className="gap-2">
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Current Project */}
        {currentProject && (
          <Card className="mb-8 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-green-600" />
                  <CardTitle className="text-green-800 dark:text-green-200">
                    Current Project
                  </CardTitle>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                {currentProject.name}
              </h3>
              {currentProject.description && (
                <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                  {currentProject.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-green-600 dark:text-green-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Last modified {formatDate(currentProject.updated_at)}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const stats = getProjectStats(project)
              const isCurrentProject = currentProject?.id === project.id

              return (
                <Card
                  key={project.id}
                  className={`hover:shadow-lg transition-all cursor-pointer ${
                    isCurrentProject
                      ? "ring-2 ring-green-500 ring-opacity-50"
                      : ""
                  }`}
                  onClick={() => handleProjectSelect(project)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {project.name}
                        </CardTitle>
                        {project.description && (
                          <CardDescription className="mt-1 line-clamp-2">
                            {project.description}
                          </CardDescription>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handleProjectSelect(project)
                            }}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Project
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => e.stopPropagation()}>
                            <Download className="w-4 h-4 mr-2" />
                            Export GTFS
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => e.stopPropagation()}>
                            <Share className="w-4 h-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => e.stopPropagation()}
                            className="text-red-600 dark:text-red-400">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>{stats.stops} stops</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Route className="w-3 h-3" />
                        <span>{stats.routes} routes</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>Modified {stats.lastModified}</span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {projects?.length === 0 ? "No projects yet" : "No projects found"}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {projects?.length === 0
                ? "Create your first GTFS project to start building transit data"
                : "Try adjusting your search terms or create a new project"}
            </p>
            <Button
              onClick={() => router.push("/editor")}
              size="lg"
              className="gap-2">
              <Plus className="w-4 h-4" />
              Create New Project
            </Button>
          </div>
        )}

        {/* Quick Stats */}
        {projects && projects.length > 0 && (
          <div className="mt-12 pt-8 border-t">
            <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <FolderOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {projects.length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Projects
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {projects.reduce(
                          (acc, project) =>
                            acc + getProjectStats(project).stops,
                          0
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Stops
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Route className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {projects.reduce(
                          (acc, project) =>
                            acc + getProjectStats(project).routes,
                          0
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Routes
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  return (
    <AuthGuard>
      <ProjectsPageContent />
    </AuthGuard>
  )
}
