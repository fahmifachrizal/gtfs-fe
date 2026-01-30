import React, { useState } from 'react';
import { projectService } from '@/services/projectService';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardFooter, 
    CardHeader, 
    CardTitle 
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Trash2, UserPlus, Save } from "lucide-react";

export const ProjectSettings = ({ project, onUpdate, onDelete }) => {
    // General Settings State
    const [name, setName] = useState(project.name);
    const [description, setDescription] = useState(project.description || "");
    const [isSaving, setIsSaving] = useState(false);

    // Sharing State
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("VIEWER");
    const [isInviting, setIsInviting] = useState(false);

    const currentUserEmail = "me"; // In a real app, pass this from auth context to identify self

    const handleSaveSettings = async () => {
        setIsSaving(true);
        try {
            const updated = await projectService.update(project.id, { name, description });
            onUpdate(updated);
            alert("Project settings saved.");
        } catch (error) {
            console.error("Failed to update project:", error);
            alert("Failed to update project.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleShare = async () => {
        if (!inviteEmail) return;
        setIsInviting(true);
        try {
            await projectService.share(project.id, inviteEmail, inviteRole);
            setInviteEmail("");
            // Refresh project data to show new member - usually ideally strictly handled by parent re-fetch
            // But we can call onUpdate if we pass a refresh function, for now prompt parent to refresh
            onUpdate({ ...project }); // Trigger refresh
            alert(`Project shared with ${inviteEmail}`);
        } catch (error) {
            console.error("Failed to share project:", error);
            // alert(error.message || "Failed to share project");
        } finally {
             setIsInviting(false);
        }
    };

    const handleUnshare = async (userId) => {
        if (!window.confirm("Remove this user from the project?")) return;
        try {
            await projectService.unshare(project.id, userId);
            onUpdate({ ...project }); // Trigger refresh
        } catch (error) {
             console.error("Failed to unshare:", error);
             alert("Failed to remove user.");
        }
    };

    return (
        <div className="space-y-8 max-w-4xl">
            {/* General Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                    <CardDescription>Manage your project's basic information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Project Name</label>
                        <Input 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            placeholder="My GTFS Project" 
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <Textarea 
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)} 
                            placeholder="Describe your project..." 
                            rows={3}
                        />
                    </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button onClick={handleSaveSettings} disabled={isSaving}>
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </CardFooter>
            </Card>

            {/* Team & Sharing */}
            <Card>
                <CardHeader>
                    <CardTitle>Team & Access</CardTitle>
                    <CardDescription>Manage who has access to this project.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Invite Form */}
                    <div className="flex gap-2 items-end border-b pb-6">
                        <div className="flex-1 space-y-2">
                            <label className="text-sm font-medium">Invite User</label>
                            <Input 
                                placeholder="user@example.com" 
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                            />
                        </div>
                        <div className="w-32 space-y-2">
                             <Select value={inviteRole} onValueChange={setInviteRole}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="VIEWER">Viewer</SelectItem>
                                    <SelectItem value="EDITOR">Editor</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleShare} disabled={isInviting || !inviteEmail}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Invite
                        </Button>
                    </div>

                    {/* Team List */}
                    <div className="space-y-4">
                         <h4 className="text-sm font-medium text-muted-foreground">Current Team</h4>
                         
                         {/* Owner */}
                         <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    {project.owner?.username?.[0]?.toUpperCase() || "O"}
                                </div>
                                <div>
                                    <p className="font-medium text-sm">{project.owner?.username || "Owner"}</p>
                                    <p className="text-xs text-muted-foreground">{project.owner?.email}</p>
                                </div>
                            </div>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                                OWNER
                            </span>
                         </div>

                         {/* Shared Users */}
                         {project.shares?.map(share => (
                             <div key={share.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground">
                                        {share.user?.username?.[0]?.toUpperCase() || "U"}
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">{share.user?.username}</p>
                                        <p className="text-xs text-muted-foreground">{share.user?.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full font-medium">
                                        {share.role}
                                    </span>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-destructive"
                                        onClick={() => handleUnshare(share.user?.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                             </div>
                         ))}

                         {(!project.shares || project.shares.length === 0) && (
                             <p className="text-sm text-muted-foreground text-center py-2">
                                 No other members yet.
                             </p>
                         )}
                    </div>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200">
                <CardHeader>
                     <CardTitle className="text-destructive">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Delete Project</p>
                            <p className="text-sm text-muted-foreground">
                                Permanently delete this project and all its data.
                            </p>
                        </div>
                        <Button variant="destructive" onClick={() => onDelete(project.id)}>
                            Delete Project
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
