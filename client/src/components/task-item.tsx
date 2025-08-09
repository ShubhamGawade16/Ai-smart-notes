import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Clock, Tag, Flag, Edit, Trash2, Copy } from "lucide-react";
import { taskApi } from "@/lib/api";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Task } from "@shared/schema";
import { cn } from "@/lib/utils";
import { SimpleTaskEditor } from "@/components/simple-task-editor";
import AdvancedTaskEditor from "@/components/advanced-task-editor";

interface TaskItemProps {
  task: Task;
}

export function TaskItem({ task }: TaskItemProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdvancedEditorOpen, setIsAdvancedEditorOpen] = useState(false);

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) =>
      taskApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/today'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update task.",
        variant: "destructive",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await apiRequest("DELETE", `/api/tasks/${taskId}`);
      if (!response.ok) {
        throw new Error('Failed to delete task');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/today'] });
      toast({
        title: "Task Deleted",
        description: "Task has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete task.",
        variant: "destructive",
      });
    },
  });

  const handleToggleComplete = () => {
    updateTaskMutation.mutate({
      id: task.id,
      updates: { completed: !task.completed },
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'medium':
        return 'bg-accent/10 text-accent border-accent/20';
      case 'low':
        return 'bg-muted text-muted-foreground border-muted-foreground/20';
      default:
        return 'bg-muted text-muted-foreground border-muted-foreground/20';
    }
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    return `In ${diffDays} days`;
  };

  const getCategoryColor = (category?: string) => {
    if (!category) return 'bg-muted text-muted-foreground';
    
    const colors = {
      'Work': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      'Personal': 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300',
      'Health': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      'Learning': 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
    };
    
    return colors[category as keyof typeof colors] || 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
  };

  const formatEstimatedTime = (minutes?: number) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  return (
    <div className="group p-4 bg-card rounded-lg border hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <Checkbox
          checked={task.completed || false}
          onCheckedChange={handleToggleComplete}
          disabled={updateTaskMutation.isPending}
          className="mt-1"
        />
        
        <div className="flex-1 min-w-0 cursor-pointer" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-2">
            <SimpleTaskEditor
              task={task as any}
              trigger={
                <h3 className={cn(
                  "font-medium cursor-pointer hover:text-primary transition-colors",
                  task.completed && "line-through opacity-60"
                )}>
                  {task.title}
                </h3>
              }
            />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsAdvancedEditorOpen(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Task
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  navigator.clipboard.writeText(task.title);
                  toast({ title: "Copied", description: "Task title copied to clipboard" });
                }}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Title
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this task?')) {
                      deleteTaskMutation.mutate(task.id);
                    }
                  }}
                  className="text-red-600"
                  disabled={deleteTaskMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deleteTaskMutation.isPending ? 'Deleting...' : 'Delete Task'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {task.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {task.description}
            </p>
          )}
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {task.priority && (
              <Badge variant="outline" className={cn("text-xs", getPriorityColor(task.priority))}>
                <Flag className="w-3 h-3 mr-1" />
                {task.priority}
              </Badge>
            )}
            
            {task.estimatedTime && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatEstimatedTime(task.estimatedTime)}
              </div>
            )}
            
            {task.dueDate && (
              <div className="flex items-center gap-1">
                <span>{formatDueDate(task.dueDate.toString())}</span>
              </div>
            )}
          </div>
          
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {task.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  <Tag className="w-2 h-2 mr-1" />
                  {tag}
                </Badge>
              ))}
              {task.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{task.tags.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Advanced Task Editor */}
      <AdvancedTaskEditor
        task={task}
        isOpen={isAdvancedEditorOpen}
        onClose={() => setIsAdvancedEditorOpen(false)}
        onSave={(updatedTask) => {
          console.log('Task updated:', updatedTask);
          setIsAdvancedEditorOpen(false);
        }}
      />
    </div>
  );
}
