import React, { useState } from 'react';
import { toast } from "sonner";
import JSZip from "jszip";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Plus, Upload, FileText, Layers, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { projectService } from '@/services/projectService';

export function CreateProjectDialog({ onProjectCreated }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("blank");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    file: null
  });

  // Upload Feedback State
  const [zipEntries, setZipEntries] = useState([]);
  const [uploadPhase, setUploadPhase] = useState('idle'); // idle, analyzing, uploading, processing, success, error
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFormData(prev => ({ ...prev, file }));
    setZipEntries([]);
    setUploadPhase('analyzing');

    try {
        const zip = await JSZip.loadAsync(file);
        const entries = [];
        zip.forEach((relativePath, zipEntry) => {
           if (!zipEntry.dir && !relativePath.startsWith('__MACOSX')) {
               entries.push({
                   name: zipEntry.name,
                   size: zipEntry._data.uncompressedSize,
               });
           }
        });
        setZipEntries(entries);
        setUploadPhase('idle'); // Back to idle but with file info
    } catch (error) {
        console.error("Failed to analyze zip:", error);
        toast.error("Failed to read ZIP file");
        setUploadPhase('error');
    }
  };

  const handleDebugImport = async () => {
    if (confirm("This will auto-create a project named 'TJ-Debug-{timestamp}' and upload /transjakarta.zip. Continue?")) {
        try {
            setLoading(true);
            setUploadPhase('analyzing');
            
            const timestamp = Math.floor(Date.now() / 1000);
            const projectName = `TJ-Debug-${timestamp}`;
            
            // 1. Fetch the file
            const response = await fetch('/transjakarta.zip');
            if (!response.ok) throw new Error("Failed to fetch /transjakarta.zip from public folder");
            const blob = await response.blob();
            const file = new File([blob], "transjakarta.zip", { type: "application/zip" });

            // Analyze locally for UI consistency
            const zip = await JSZip.loadAsync(file);
            const entries = [];
            zip.forEach((relativePath, zipEntry) => {
                if (!zipEntry.dir && !relativePath.startsWith('__MACOSX')) {
                    entries.push({ name: zipEntry.name, size: zipEntry._data.uncompressedSize });
                }
            });
            setZipEntries(entries);

            // 2. Create Project
            setUploadPhase('uploading');
            const payload = {
                name: projectName,
                description: "Auto-generated debug project",
                type: "import"
            };
            const newProject = await projectService.create(payload);

            // 3. Upload File
            setUploadPhase('processing');
            console.log("Starting Debug GTFS import for project:", newProject.id);
            
            await projectService.importGTFS(newProject.id, file);
            
            setUploadPhase('success');
            toast.success("Debug import successful!");
            
            // Allow success state to be seen briefly
            setTimeout(() => {
                if (onProjectCreated) onProjectCreated(newProject);
                setOpen(false);
                resetState();
            }, 1500);

        } catch (error) {
            console.error("Debug import failed:", error);
            toast.error("Debug import failed: " + error.message);
            setUploadPhase('error');
        } finally {
            setLoading(false);
        }
    }
  };

  const resetState = () => {
      setFormData({ name: "", description: "", file: null });
      setZipEntries([]);
      setUploadPhase('idle');
      setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUploadPhase('idle');

    try {
      const payload = {
        ...formData,
        type: activeTab,
      };
      
      let createdProject = await projectService.create(payload);
      
      // If blank/example, we still want to show meaningful success feedback
      if (activeTab === 'import' && formData.file && createdProject && createdProject.id) {
          // 2. Upload File if import mode
          setUploadPhase('uploading');
          console.log("Starting GTFS import for project:", createdProject.id);
          
          setUploadPhase('processing');
          
          try {
             await projectService.importGTFS(createdProject.id, formData.file);
             setUploadPhase('success');
             toast.success("GTFS data imported successfully");
             // DO NOT CLOSE DIALOG automatically
             // Instead, we will show a success UI
          } catch (uploadError) {
             console.error("Upload failed in Dialog:", uploadError);
             setUploadPhase('error');
             toast.error("Project created but GTFS import failed: " + (uploadError.message || "Unknown error"));
             // Even if import fails, the project exists, so we should probably tell the user
          }
      } else {
        toast.success("Project created successfully");
        setUploadPhase('success'); // Use success phase for non-import too for consistency? Or just close?
        // Let's close for non-import as they are instant
        if (onProjectCreated) onProjectCreated(createdProject);
        setOpen(false);
        resetState();
        return;
      }
      
      // For import flow, we stay open in 'success' phase
      if (onProjectCreated) {
        onProjectCreated(createdProject);
      }
      // Store created project to allow navigation
      setFormData(prev => ({ ...prev, createdProject }));
      
    } catch (error) {
      console.error("Failed to create project:", error);
      if (error.message && error.message.includes("You already have a project with this name")) {
        toast.error("You already have a project with this name. Please choose a different name.");
      } else {
        toast.error(error.message || "Failed to create project");
      }
      setLoading(false);
    } finally {
        // Only turn off loading if we are NOT in success phase (which needs to stay "done")
        // actually we can turn off loading
        setLoading(false);
    }
  };

  const handleOpenProject = () => {
      const proj = formData.createdProject;
      if (proj && proj.id) {
          window.location.href = `/editor/project/${proj.id}`; // Hard nav or navigate
      }
      setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
        if (!loading) {
            setOpen(val);
            if (!val) resetState();
        }
    }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
              {uploadPhase === 'success' ? "Project Ready!" : "Create Project"}
          </DialogTitle>
          <DialogDescription>
             {uploadPhase === 'success' 
                ? "Your project has been created successfully." 
                : "Start a new GTFS project from scratch, using an example, or by importing existing files."
             }
          </DialogDescription>
        </DialogHeader>

        {uploadPhase === 'success' ? (
             <div className="py-6 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold">Success!</h3>
                    <p className="text-muted-foreground">
                        Project <strong>{formData.name}</strong> is ready.
                    </p>
                </div>
                <div className="flex gap-4 mt-4">
                    <Button variant="outline" onClick={() => {
                        setOpen(false);
                        resetState();
                    }}>
                        Close
                    </Button>
                    <Button onClick={handleOpenProject}>
                        Open Project
                    </Button>
                </div>
             </div>
        ) : (
        <Tabs defaultValue="blank" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="blank">Blank</TabsTrigger>
            <TabsTrigger value="example">Example</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
          </TabsList>
          
          <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="My Transit Project"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Optional description of your project..."
                  />
                </div>
              </div>

              <TabsContent value="blank" className="mt-2">
                <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground flex gap-2 items-start">
                  <FileText className="h-5 w-5 mt-0.5 shrink-0" />
                  <div>
                    Creates an empty project container. You'll need to define agencies, routes, and stops manually.
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="example" className="mt-2">
                 <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground flex gap-2 items-start">
                  <Layers className="h-5 w-5 mt-0.5 shrink-0" />
                  <div>
                    Creates a project pre-populated with example data (mock Transjakarta routes) to help you explore features.
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="import" className="mt-2">
                 <div className="space-y-4">
                    <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground flex flex-col gap-3">
                        <div className="flex gap-2 items-start">
                            <Upload className="h-5 w-5 mt-0.5 shrink-0" />
                            <div>
                            Select a GTFS .zip file to import. We will parse agencies, routes, and trips from it.
                            </div>
                        </div>
                        <Input 
                            type="file" 
                            accept=".zip" 
                            onChange={handleFileSelect}
                            disabled={loading}
                        />

                        {/* File Analysis UI */}
                        {zipEntries.length > 0 && (
                            <div className="mt-2 border rounded bg-background p-2 max-h-40 overflow-y-auto text-xs">
                                <p className="font-semibold mb-1 sticky top-0 bg-background pb-1 border-b">
                                    Files found ({zipEntries.length}):
                                </p>
                                <ul className="space-y-1">
                                    {zipEntries.map(f => (
                                        <li key={f.name} className="flex justify-between">
                                            <span>{f.name}</span>
                                            <span className="text-muted-foreground">{(f.size / 1024).toFixed(1)} KB</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Progress Status */}
                        {uploadPhase !== 'idle' && (
                            <div className={`mt-2 p-3 rounded border flex items-center gap-3 ${
                                uploadPhase === 'error' ? 'bg-destructive/10 border-destructive/20' : 
                                uploadPhase === 'success' ? 'bg-green-500/10 border-green-500/20' : 
                                'bg-primary/5 border-primary/10'
                            }`}>
                                {uploadPhase === 'analyzing' && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                                {uploadPhase === 'uploading' && <Upload className="h-5 w-5 animate-bounce text-primary" />}
                                {uploadPhase === 'processing' && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                                {uploadPhase === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                                {uploadPhase === 'error' && <AlertCircle className="h-5 w-5 text-destructive" />}
                                
                                <div className="flex-1">
                                    <p className="font-medium text-sm">
                                        {uploadPhase === 'analyzing' && "Analyzing ZIP file..."}
                                        {uploadPhase === 'uploading' && "Uploading to server..."}
                                        {uploadPhase === 'processing' && "Server processing GTFS data..."}
                                        {uploadPhase === 'success' && "Import Complete!"}
                                        {uploadPhase === 'error' && "Import Failed"}
                                    </p>
                                </div>
                            </div>
                        )}
                        
                        <div className="pt-2 border-t mt-2">
                            <Button 
                            type="button" 
                            variant="destructive" 
                            size="sm" 
                            onClick={handleDebugImport}
                            className="w-full"
                            disabled={loading}
                            >
                            DEBUG: Auto-Import Transjakarta
                            </Button>
                        </div>
                    </div>
                </div>
              </TabsContent>
            
            <DialogFooter className="mt-6">
              <Button type="submit" disabled={loading}>
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {activeTab === 'import' ? "Processing..." : "Creating..."}
                    </>
                ) : "Create Project"}
              </Button>
            </DialogFooter>
          </form>
         </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
