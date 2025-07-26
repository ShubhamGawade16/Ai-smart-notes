import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical, Clock } from "lucide-react";
import { taskApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { Task } from "@shared/schema";
import { cn } from "@/lib/utils";

interface TaskItemProps {
  task: Task;
}

export function TaskItem({ task }: TaskItemProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer group">
      <Checkbox
        checked={task.completed || false}
        onCheckedChange={handleToggleComplete}
        disabled={updateTaskMutation.isPending}
        className="mt-1"
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <span className={cn(
            "text-sm font-medium",
            task.completed && "line-through opacity-60"
          )}>
            {task.title}
          </span>
          
          <Badge variant="outline" className={cn("text-xs", getPriorityColor(task.priority || 'medium'))}>
            {task.priority || 'medium'}
          </Badge>
          
          {task.category && (
            <Badge variant="secondary" className={cn("text-xs", getCategoryColor(task.category))}>
              {task.category}
            </Badge>
          )}
        </div>
        
        {(task.estimatedTime || task.aiSuggestions) && (
          <div className={cn(
            "text-xs text-muted-foreground mt-1 flex items-center space-x-2",
            task.completed && "opacity-60"
          )}>
            {task.estimatedTime && (
              <span className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {formatEstimatedTime(task.estimatedTime)}
              </span>
            )}
            {task.aiSuggestions && (
              <span>
                AI suggests: {task.priority || 'medium'} priority
              </span>
            )}
          </div>
        )}
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <MoreVertical className="w-4 h-4" />
      </Button>
    </div>
  );
}
