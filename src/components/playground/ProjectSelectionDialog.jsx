import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useUser } from '@/contexts/UserContext'
import { useState, useEffect } from 'react'
import { service } from '@/services'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function ProjectSelectionDialog({ open, onProjectSelect }) {
  const { projects } = useUser()
  const [localProjects, setLocalProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open) {
      loadProjects()
    }
  }, [open])

  const loadProjects = async () => {
    setLoading(true)
    try {
      const response = await service.projects.getAll({ page: 1, limit: 50 })
      // Handle different response formats
      const projectsList = response.projects || response.data?.projects || response.data || response || []
      setLocalProjects(projectsList)
    } catch (error) {
      console.error('Failed to load projects:', error)
      // Fallback to projects from UserContext if available
      setLocalProjects(projects || [])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}} /* Prevent closing without selection */>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Select a Project for Playground</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : localProjects.length === 0 ? (
          <div className="text-center p-8 space-y-4">
            <p className="text-muted-foreground">
              No projects found. Please create a project first.
            </p>
            <Button asChild>
              <a href="/projects">Go to Projects</a>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {localProjects.map((project) => (
              <Card
                key={project.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => onProjectSelect(project)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  {project.description && (
                    <CardDescription>{project.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Click to open in Playground
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
