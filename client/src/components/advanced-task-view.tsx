import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Calendar,
  Clock,
  Tag,
  Edit,
  Save,
  X,
  Target,
  Brain
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Task } from "@shared/schema";

interface AdvancedTaskViewProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (task: Task) => void;
  onAIRefine?: (task: Task) => void;
}

const priorityColors = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", 
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
};

const priorityLevels = [
  { value: "low", label: "Low", color: "bg-green-500" },
  { value: "medium", label: "Medium", color: "bg-yellow-500" },
  { value: "high", label: "High", color: "bg-red-500" }
];

export function AdvancedTaskView({ task, isOpen, onClose, onUpdate, onAIRefine }: AdvancedTaskViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: task?.title || "",
    description: task?.description || "",
    priority: task?.priority || "medium",
    category: task?.category || "",
    estimatedTime: task?.estimatedTime || 30,
    tags: task?.tags || []
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) =>
      apiRequest(`/api/tasks/${id}`, 'PATCH', updates),
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/today'] });
      onUpdate(updatedTask);
      setIsEditing(false);
      toast({
        title: "Task updated",
        description: "Your task has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update form when task changes
  useEffect(() => {
    if (task) {
      setEditForm({
        title: task.title,
        description: task.description || "",
        priority: task.priority,
        category: task.category || "",
        estimatedTime: task.estimatedTime || 30,
        tags: task.tags || []
      });
    }
  }, [task]);

  if (!task) return null;

  const handleSave = () => {
    if (!task) return;
    
    updateTaskMutation.mutate({
      id: task.id,
      updates: editForm
    });
  };

  const handleCancel = () => {
    setEditForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      category: task.category || "",
      estimatedTime: task.estimatedTime || 30,
      tags: task.tags || []
    });
    setIsEditing(false);
  };

  const getPriorityMeterWidth = () => {
    switch (task.priority) {
      case 'high': return '100%';
      case 'medium': return '66%';
      case 'low': return '33%';
      default: return '0%';
    }
  };

  const getPriorityMeterColor = () => {
    switch (task.priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Task Details</span>
            <div className="flex gap-2">
              {onAIRefine && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAIRefine(task)}
                  className="h-8"
                >
                  <Brain className="w-4 h-4 mr-1" />
                  AI Refine
                </Button>
              )}
              {!isEditing ? (
                <Button
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="h-8"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-1">
                  <Button 
                    size="sm" 
                    onClick={handleSave} 
                    className="h-8"
                    disabled={updateTaskMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancel} className="h-8">
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Title */}
          {isEditing ? (
            <Input
              value={editForm.title}
              onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Task title"
              className="text-lg font-semibold"
            />
          ) : (
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {task.title}
            </h2>
          )}

          {/* Priority Meter */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Priority Level
              </label>
              <Badge className={cn("text-xs", priorityColors[task.priority])}>
                {task.priority}
              </Badge>
            </div>
            
            {isEditing ? (
              <Select 
                value={editForm.priority} 
                onValueChange={(value: 'low' | 'medium' | 'high') => 
                  setEditForm(prev => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-3 h-3 rounded-full", level.color)} />
                        {level.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="space-y-2">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className={cn("h-3 rounded-full transition-all duration-300", getPriorityMeterColor())}
                    style={{ width: getPriorityMeterWidth() }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            {isEditing ? (
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Add a detailed description..."
                rows={4}
                className="min-h-[100px]"
              />
            ) : (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg min-h-[100px]">
                {task.description ? (
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {task.description}
                  </p>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">
                    No description provided
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Task Meta */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Category
              </label>
              {isEditing ? (
                <Input
                  value={editForm.category}
                  onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="Task category"
                />
              ) : (
                <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <Tag className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">
                    {task.category || "No category"}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Estimated Time
              </label>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={editForm.estimatedTime}
                    onChange={(e) => setEditForm(prev => ({ ...prev, estimatedTime: parseInt(e.target.value) || 30 }))}
                    min="5"
                    max="480"
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-500">min</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">
                    {task.estimatedTime || 30} minutes
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Due Date */}
          {task.dueDate && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Due Date
              </label>
              <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm">
                  {new Date(task.dueDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Tags
            </label>
            {task.tags && task.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                No tags assigned
              </p>
            )}
          </div>

          {/* Task Stats */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Task Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 dark:text-gray-400">
              <div>
                <span className="font-medium">Created:</span>
                <br />
                {task.createdAt ? new Date(task.createdAt).toLocaleString() : "Unknown"}
              </div>
              <div>
                <span className="font-medium">Status:</span>
                <br />
                {task.completed ? "Completed" : "In Progress"}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}