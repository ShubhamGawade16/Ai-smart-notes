import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Edit, Plus, BarChart3, Zap } from "lucide-react";
import { taskApi, noteApi, aiApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function QuickActions() {
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createTaskMutation = useMutation({
    mutationFn: taskApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      setIsTaskDialogOpen(false);
      setTaskTitle("");
      toast({ title: "Task created successfully!" });
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: noteApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      setIsNoteDialogOpen(false);
      setNoteTitle("");
      setNoteContent("");
      toast({ title: "Note created successfully!" });
    },
  });

  const optimizeDayMutation = useMutation({
    mutationFn: aiApi.optimizeDay,
    onSuccess: () => {
      toast({
        title: "Day optimized!",
        description: "Check your tasks for AI recommendations.",
      });
    },
  });

  const handleCreateTask = () => {
    if (taskTitle.trim()) {
      createTaskMutation.mutate({ title: taskTitle.trim() });
    }
  };

  const handleCreateNote = () => {
    if (noteTitle.trim() && noteContent.trim()) {
      createNoteMutation.mutate({ 
        title: noteTitle.trim(), 
        content: noteContent.trim() 
      });
    }
  };

  return (
    <div className="bg-card rounded-lg card-shadow p-6">
      <h3 className="font-semibold text-sm mb-4">Quick Actions</h3>
      
      <div className="space-y-2">
        <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" className="w-full justify-start text-sm">
              <Edit className="w-4 h-4 mr-3 text-muted-foreground" />
              New Note
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="note-title">Title</Label>
                <Input
                  id="note-title"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Enter note title..."
                />
              </div>
              <div>
                <Label htmlFor="note-content">Content</Label>
                <Textarea
                  id="note-content"
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Enter note content..."
                  rows={6}
                />
              </div>
              <Button 
                onClick={handleCreateNote}
                disabled={!noteTitle.trim() || !noteContent.trim() || createNoteMutation.isPending}
                className="w-full"
              >
                Create Note
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" className="w-full justify-start text-sm">
              <Plus className="w-4 h-4 mr-3 text-muted-foreground" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="task-title">Task Title</Label>
                <Input
                  id="task-title"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Enter task title..."
                />
              </div>
              <Button 
                onClick={handleCreateTask}
                disabled={!taskTitle.trim() || createTaskMutation.isPending}
                className="w-full"
              >
                Create Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
        <Button variant="ghost" className="w-full justify-start text-sm">
          <BarChart3 className="w-4 h-4 mr-3 text-muted-foreground" />
          Weekly Review
        </Button>
        
        <Button 
          variant="ghost" 
          className="w-full justify-start text-sm text-primary hover:text-primary/80"
          onClick={() => optimizeDayMutation.mutate({})}
          disabled={optimizeDayMutation.isPending}
        >
          <Zap className="w-4 h-4 mr-3" />
          AI Optimize
        </Button>
      </div>
    </div>
  );
}
