import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectService } from '@/services/projectService'; // Make sure this path is correct
import StopsTable from '@/components/gtfs/StopsTable';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { ChevronLeft, MapPin } from "lucide-react";

const ProjectEditor = () => {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const response = await projectService.getById(id);
                if (response.success) {
                    setProject(response.project);
                } else {
                    toast.error(response.message || "Failed to load project details");
                }
            } catch (error) {
                console.error("Error loading project:", error);
                toast.error("Failed to load project details");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProject();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex h-screen items-center justify-center flex-col gap-4">
                <h2 className="text-xl font-semibold">Project not found</h2>
                <p className="text-muted-foreground">The project you are looking for does not exist or you do not have permission to view it.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-background">
            <header className="border-b px-6 py-4 flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10">
                <div>
                    <h1 className="text-xl font-bold">{project.name}</h1>
                    <p className="text-sm text-muted-foreground">{project.description || "No description"}</p>
                </div>
                <div className="flex items-center gap-2">
                    <nav className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link to="/projects">
                                <ChevronLeft className="h-4 w-4 mr-1" /> Projects
                            </Link>
                        </Button>
                        <Button size="sm" asChild>
                            <Link to={`/editor/map/${project.id}`}>
                                <MapPin className="h-4 w-4 mr-1" /> Open Map
                            </Link>
                        </Button>
                    </nav>
                </div>
            </header>

            <main className="flex-1 overflow-auto p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                      <div className="flex flex-col space-y-1.5 mb-6">
                        <h3 className="font-semibold leading-none tracking-tight">Stops</h3>
                        <p className="text-sm text-muted-foreground">Manage the stops for this project.</p>
                      </div>
                      
                      <StopsTable projectId={project.id} />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProjectEditor;
