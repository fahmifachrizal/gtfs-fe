import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Trash2, Map, Bus, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

export function ProjectList({ projects, onDelete, onSelect }) {
  if (!projects || projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-xl bg-muted/10">
        <div className="bg-muted p-4 rounded-full mb-4">
          <Map className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground">No projects found</h3>
        <p className="text-muted-foreground mt-2 max-w-sm text-center">
          Get started by creating a new project or importing existing GTFS data.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
      {projects.map((project) => (
        <Card key={project.id} className="group flex flex-col transition-all duration-200 hover:shadow-md hover:border-primary/50 relative overflow-hidden">
           {/* Decorative top border */}
           <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-base font-semibold line-clamp-1 leading-tight" title={project.name}>
              {project.name}
            </CardTitle>
            <CardDescription className="line-clamp-2 text-xs mt-1 h-[2.5em]">
              {project.description || "No description provided."}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex-1 pb-3 px-4">
            <div className="flex gap-2 mb-3">
               <div className="bg-muted/30 p-1.5 rounded-md flex-1 flex flex-col items-center justify-center text-center">
                 <span className="text-base font-bold text-foreground">{project._count?.routes || 0}</span>
                 <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1">
                   <Map className="h-2.5 w-2.5" /> Routes
                 </span>
               </div>
               <div className="bg-muted/30 p-1.5 rounded-md flex-1 flex flex-col items-center justify-center text-center">
                 <span className="text-base font-bold text-foreground">{project._count?.stops || 0}</span>
                 <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1">
                   <Bus className="h-2.5 w-2.5" /> Stops
                 </span>
               </div>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Updated {format(new Date(project.updated_at), "MMM d, yyyy")}</span>
            </div>
          </CardContent>

          <CardFooter className="pt-0 pb-3 px-4 flex items-center gap-2">
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0" 
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(project.id);
                }}
                title="Delete Project"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <Button 
                onClick={(e) => {
                    e.preventDefault();
                    if (onSelect) {
                        onSelect(project);
                    }
                }}
                className="flex-1 h-8 text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
            >
                Open Editor <ArrowRight className="h-3 w-3 ml-1.5 opacity-50 group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
