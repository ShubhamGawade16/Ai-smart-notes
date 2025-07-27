import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Tag, Flag, ArrowLeft, Save, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { taskApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  tags?: string[];
  dueDate?: string;
  completed: boolean;
  estimatedMinutes?: number;
}

interface TaskDetailModalProps {
  task: Task;
  trigger: React.ReactNode;
  onClose?: () => void;
}

export function TaskDetailModal({ task, trigger, onClose }: TaskDetailModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editedTask, setEditedTask] = useState(task);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateTaskMutation = useMutation({
    mutationFn: (updatedTask: any) => taskApi.update(task.id, updatedTask),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/today'] });
      setIsEditing(false);
      toast({
        title: "Task updated",
        description: "Your changes have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: () => taskApi.delete(task.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/today'] });
      setIsOpen(false);
      toast({
        title: "Task deleted",
        description: "The task has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateTaskMutation.mutate(editedTask);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTaskMutation.mutate();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsEditing(false);
    setEditedTask(task);
    onClose?.();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default: return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <DialogTitle className="text-xl">Task Details</DialogTitle>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedTask(task);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={updateTaskMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleteTaskMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="text-sm font-medium mb-2 block">Title</label>
            {isEditing ? (
              <Input
                value={editedTask.title}
                onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                placeholder="Task title..."
              />
            ) : (
              <h2 className="text-lg font-medium">{task.title}</h2>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium mb-2 block">Description</label>
            {isEditing ? (
              <Textarea
                value={editedTask.description || ''}
                onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                placeholder="Add a description..."
                rows={4}
              />
            ) : (
              <p className="text-gray-600 dark:text-gray-400">
                {task.description || 'No description provided.'}
              </p>
            )}
          </div>

          {/* Priority and Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Priority</label>
              {isEditing ? (
                <Select
                  value={editedTask.priority}
                  onValueChange={(value: 'low' | 'medium' | 'high') => 
                    setEditedTask({ ...editedTask, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge className={getPriorityColor(task.priority)}>
                  <Flag className="h-3 w-3 mr-1" />
                  {task.priority}
                </Badge>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              {isEditing ? (
                <Input
                  value={editedTask.category || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, category: e.target.value })}
                  placeholder="Category..."
                />
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {task.category || 'No category'}
                </p>
              )}
            </div>
          </div>

          {/* Time Estimate and Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Time Estimate</label>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={editedTask.estimatedMinutes || ''}
                    onChange={(e) => setEditedTask({ 
                      ...editedTask, 
                      estimatedMinutes: parseInt(e.target.value) || undefined 
                    })}
                    placeholder="Minutes..."
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-500">minutes</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="h-4 w-4" />
                  {task.estimatedMinutes ? `${task.estimatedMinutes} minutes` : 'Not estimated'}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Due Date</label>
              {isEditing ? (
                <Input
                  type="date"
                  value={editedTask.dueDate ? new Date(editedTask.dueDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditedTask({ 
                    ...editedTask, 
                    dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined
                  })}
                />
              ) : (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-medium mb-2 block">Tags</label>
            {task.tags && task.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">No tags assigned</p>
            )}
          </div>

          {/* Status */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge variant={task.completed ? 'default' : 'secondary'}>
                {task.completed ? 'Completed' : 'Pending'}
              </Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}