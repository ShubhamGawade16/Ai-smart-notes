import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Trash2, 
  Edit3, 
  Calendar, 
  Clock, 
  Flag, 
  Grip,
  Check,
  X,
  MoreHorizontal,
  Brain,
  Eye,
  Edit
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Task } from "@shared/schema";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import AdvancedTaskEditor from "./advanced-task-editor";

interface ModernTaskItemProps {
  task: Task;
  onUpdate?: (task: Task) => void;
  onDelete?: (id: string) => void;
  onAdvancedView?: (task: Task) => void;
  onTaskCompleted?: () => void;
}

export function ModernTaskItem({ task, onUpdate, onDelete, onAdvancedView, onTaskCompleted }: ModernTaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [isHovered, setIsHovered] = useState(false);
  const [isAdvancedEditorOpen, setIsAdvancedEditorOpen] = useState(false);
  const [, setLocation] = useLocation();
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Task> }) => {
      const response = await apiRequest('PATCH', `/api/tasks/${id}`, updates);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/today'] });
      setIsEditing(false);
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
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/tasks/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/today'] });
      toast({
        title: "Task deleted",
        description: "Task has been removed successfully.",
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
    const newCompletedState = !task.completed;
    updateTaskMutation.mutate({
      id: task.id,
      updates: { completed: newCompletedState }
    });
    
    // Trigger confetti only when completing a task (not uncompleting)
    if (newCompletedState && onTaskCompleted) {
      onTaskCompleted();
    }
  };

  const handleEditSave = () => {
    if (editTitle.trim() && editTitle !== task.title) {
      updateTaskMutation.mutate({
        id: task.id,
        updates: { title: editTitle.trim() },
      });
    } else {
      setIsEditing(false);
    }
  };

  const handleEditCancel = () => {
    setEditTitle(task.title);
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteTaskMutation.mutate(task.id);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950 dark:text-red-400';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-950 dark:text-orange-400';
      case 'medium':
        return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:text-blue-400';
      case 'low':
        return 'text-gray-500 bg-gray-50 border-gray-200 dark:bg-gray-950 dark:text-gray-400';
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200 dark:bg-gray-950 dark:text-gray-400';
    }
  };

  const formatEstimatedTime = (minutes?: number) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { text: 'Today', urgent: true };
    if (diffDays === 1) return { text: 'Tomorrow', urgent: false };
    if (diffDays === -1) return { text: 'Yesterday', urgent: true };
    if (diffDays < 0) return { text: `${Math.abs(diffDays)}d overdue`, urgent: true };
    if (diffDays <= 7) return { text: `${diffDays}d`, urgent: false };
    return { text: date.toLocaleDateString(), urgent: false };
  };

  const dueDateInfo = task.dueDate ? formatDueDate(task.dueDate.toString()) : null;

  return (
    <div 
      className={cn(
        "group stagger-item card-animate flex items-center gap-4 p-6 rounded-xl transition-all duration-300 border-l-4",
        "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
        "hover:bg-gray-50 dark:hover:bg-gray-750 hover:border-gray-300 dark:hover:border-gray-600",
        "hover:shadow-lg hover:-translate-y-1",
        task.completed && "opacity-70 bg-gray-50 dark:bg-gray-850",
        task.priority === 'high' ? 'border-l-red-400' :
        task.priority === 'medium' ? 'border-l-yellow-400' :
        'border-l-green-400'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Checkbox */}
      <Checkbox
        checked={task.completed || false}
        onCheckedChange={handleToggleComplete}
        disabled={updateTaskMutation.isPending}
        className="w-6 h-6 rounded-full data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 flex-shrink-0"
      />

      {/* Task Content */}
      <div className="flex-1 min-w-0 py-1">
        {isEditing ? (
          <div className="flex items-center gap-3">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleEditSave();
                if (e.key === 'Escape') handleEditCancel();
              }}
              className="text-base border-none shadow-none p-0 h-auto focus-visible:ring-0 font-medium"
              autoFocus
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleEditSave}
              className="w-8 h-8 p-0 hover:bg-green-100 hover:text-green-600"
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleEditCancel}
              className="w-8 h-8 p-0 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div 
              className={cn(
                "text-base font-medium cursor-pointer leading-relaxed",
                task.completed && "line-through text-gray-500",
                !task.completed && "text-gray-900 dark:text-gray-100"
              )}
              onClick={() => setIsEditing(true)}
            >
              {task.title}
            </div>
            
            {/* Task metadata */}
            {(task.priority || task.estimatedTime || dueDateInfo || task.category) && (
              <div className="flex items-center flex-wrap gap-3 text-xs">
                {task.priority && (
                  <Badge variant="outline" className={cn("text-xs px-3 py-1 font-medium", getPriorityColor(task.priority))}>
                    <Flag className="w-3 h-3 mr-1.5" />
                    {task.priority}
                  </Badge>
                )}
                
                {task.estimatedTime && (
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
                    <Clock className="w-3 h-3" />
                    <span className="font-medium">{formatEstimatedTime(task.estimatedTime)}</span>
                  </div>
                )}
                
                {dueDateInfo && (
                  <div className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-md font-medium",
                    dueDateInfo.urgent ? "text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400" : "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800"
                  )}>
                    <Calendar className="w-3 h-3" />
                    <span>{dueDateInfo.text}</span>
                  </div>
                )}
                
                {task.category && (
                  <Badge variant="outline" className="text-xs px-3 py-1 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 font-medium">
                    {task.category}
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className={cn(
        "flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0",
        isHovered && "opacity-100"
      )}>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsEditing(true)}
          className="w-9 h-9 p-0 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-950 dark:hover:text-blue-400 transition-colors"
          title="Edit task"
        >
          <Edit3 className="w-4 h-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="w-9 h-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="More options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setIsAdvancedEditorOpen(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Advanced Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleDelete}
              className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete task
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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