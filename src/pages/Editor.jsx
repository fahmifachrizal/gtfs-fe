import React, { useEffect, useState } from "react"
import { service } from "@/services"
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog"
import { ProjectList } from "@/components/projects/ProjectList"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import { useUser } from "@/contexts/UserContext"
import { useNavigate } from "react-router-dom"

export default function Editor() {
  const { setCurrentProject } = useUser()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const response = await service.projects.getAll({ page, limit: 9, search })
      // console.log("Fetch Projects Response:", response); // DEBUG

      // Handle paginated response structure from backend
      if (response.projects && response.pagination) {
        setProjects(response.projects)
        setTotalPages(response.pagination.pages)
        setTotalCount(response.pagination.total)
      } else if (Array.isArray(response)) {
        // Legacy array response
        setProjects(response)
      } else {
        setProjects([])
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProjects()
    }, 300) // Debounce search
    return () => clearTimeout(timer)
  }, [page, search])

  const handleProjectCreated = (newProject) => {
    fetchProjects() // Refresh list
  }

  const handleDeleteProject = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this project? This action cannot be undone.",
      )
    ) {
      return
    }

    try {
      await service.projects.delete(id)
      fetchProjects() // Refresh to update pagination
    } catch (error) {
      console.error("Failed to delete project:", error)
      alert("Failed to delete project")
    }
  }

  const handleSelectProject = (project) => {
    setCurrentProject(project)
    navigate("/editor")
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
          <p className="text-muted-foreground mt-1">
            Manage your GTFS projects or start a new one.
          </p>
        </div>
        <CreateProjectDialog onProjectCreated={handleProjectCreated} />
      </div>

      <div className="mb-6 flex gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <ProjectList
            projects={projects}
            onDelete={handleDeleteProject}
            onSelect={handleSelectProject} // Pass selection handler
          />

          {projects.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              {search
                ? "No projects found matching your search."
                : "No projects found. Create one to get started!"}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2 items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
