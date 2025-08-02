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
  Eye
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

interface ModernTaskItemProps {
  task: Task;
  onUpdate?: (task: Task) => void;
  onDelete?: (id: string) => void;
  onAdvancedView?: (task: Task) => void;
}

export function ModernTaskItem({ task, onUpdate, onDelete, onAdvancedView }: ModernTaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [isHovered, setIsHovered] = useState(false);
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
    updateTaskMutation.mutate({
      id: task.id,
      updates: { completed: !task.completed },
    });
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
        "group flex items-center gap-3 p-4 rounded-xl transition-all duration-200",
        "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
        "hover:bg-gray-50 dark:hover:bg-gray-750 hover:border-gray-300 dark:hover:border-gray-600",
        "hover:shadow-sm",
        task.completed && "opacity-70 bg-gray-50 dark:bg-gray-850"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Grip handle for future drag functionality */}
      <div className={cn(
        "opacity-0 group-hover:opacity-50 transition-opacity cursor-grab",
        isHovered && "opacity-50"
      )}>
        <Grip className="w-4 h-4 text-gray-400" />
      </div>

      {/* Checkbox */}
      <Checkbox
        checked={task.completed || false}
        onCheckedChange={handleToggleComplete}
        disabled={updateTaskMutation.isPending}
        className="w-5 h-5 rounded-full data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
      />

      {/* Task Content */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleEditSave();
                if (e.key === 'Escape') handleEditCancel();
              }}
              className="text-sm border-none shadow-none p-0 h-auto focus-visible:ring-0"
              autoFocus
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleEditSave}
              className="w-6 h-6 p-0"
            >
              <Check className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleEditCancel}
              className="w-6 h-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            <div 
              className={cn(
                "text-sm font-medium cursor-pointer",
                task.completed && "line-through text-gray-500"
              )}
              onClick={() => setIsEditing(true)}
            >
              {task.title}
            </div>
            
            {/* Task metadata */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {task.priority && (
                <Badge variant="outline" className={cn("text-xs px-2 py-0.5", getPriorityColor(task.priority))}>
                  <Flag className="w-2.5 h-2.5 mr-1" />
                  {task.priority}
                </Badge>
              )}
              
              {task.estimatedTime && (
                <div className="flex items-center gap-1 text-gray-500">
                  <Clock className="w-3 h-3" />
                  {formatEstimatedTime(task.estimatedTime)}
                </div>
              )}
              
              {dueDateInfo && (
                <div className={cn(
                  "flex items-center gap-1",
                  dueDateInfo.urgent ? "text-red-600" : "text-gray-500"
                )}>
                  <Calendar className="w-3 h-3" />
                  {dueDateInfo.text}
                </div>
              )}
              
              {task.category && (
                <Badge variant="outline" className="text-xs px-2 py-0.5 text-gray-600 bg-gray-50">
                  {task.category}
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className={cn(
        "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
        isHovered && "opacity-100"
      )}>
        {onAdvancedView && (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onAdvancedView(task);
            }}
            className="px-2 h-7 text-xs text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950"
          >
            <Eye className="w-3 h-3 mr-1" />
            Advanced
          </Button>
        )}
        
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setLocation(`/task-refiner?task=${encodeURIComponent(task.title)}`)}
          className="px-2 h-7 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950"
        >
          <Brain className="w-3 h-3 mr-1" />
          AI View
        </Button>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsEditing(true)}
          className="w-8 h-8 p-0 hover:bg-blue-100 hover:text-blue-600"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="w-8 h-8 p-0 hover:bg-gray-100"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem 
              onClick={handleDelete}
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete task
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}