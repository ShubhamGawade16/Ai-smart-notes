import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Save, 
  X, 
  Plus, 
  Clock, 
  Flag, 
  FolderOpen, 
  Tag,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { Task } from '@shared/schema';

interface AdvancedTaskEditorProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (task: Task) => void;
}

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  { value: 'high', label: 'High', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' }
];

const CATEGORY_OPTIONS = [
  'Work', 'Personal', 'Health', 'Learning', 'Finance', 'Social', 'Shopping', 'Travel', 'General'
];

const TIME_ESTIMATES = [15, 30, 45, 60, 90, 120, 180, 240, 300, 360];

export default function AdvancedTaskEditor({ task, isOpen, onClose, onSave }: AdvancedTaskEditorProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    category: 'general',
    tags: [] as string[],
    estimatedTime: 60,
    dueDate: '',
    completed: false
  });
  
  const [newTag, setNewTag] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize form with task data
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        category: task.category || 'general',
        tags: task.tags || [],
        estimatedTime: task.estimatedTime || 60,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        completed: task.completed || false
      });
    } else {
      // Reset form for new task
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        category: 'general',
        tags: [],
        estimatedTime: 60,
        dueDate: '',
        completed: false
      });
    }
  }, [task]);

  const saveTaskMutation = useMutation({
    mutationFn: async (taskData: typeof formData) => {
      const payload = {
        ...taskData,
        dueDate: taskData.dueDate ? new Date(taskData.dueDate).toISOString() : null
      };

      if (task?.id) {
        // Update existing task
        const response = await apiRequest("PATCH", `/api/tasks/${task.id}`, payload);
        if (!response.ok) throw new Error('Failed to update task');
        return response.json();
      } else {
        // Create new task
        const response = await apiRequest("POST", "/api/tasks", payload);
        if (!response.ok) throw new Error('Failed to create task');
        return response.json();
      }
    },
    onSuccess: (savedTask) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/today'] });
      
      toast({
        title: task?.id ? "Task Updated" : "Task Created",
        description: `"${savedTask.title}" has been ${task?.id ? 'updated' : 'created'} successfully.`,
      });
      
      onSave?.(savedTask);
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save task. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSave = () => {
    if (!formData.title.trim()) {
      toast({
        title: "Missing Title",
        description: "Please enter a task title.",
        variant: "destructive"
      });
      return;
    }
    
    saveTaskMutation.mutate(formData);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim().toLowerCase())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim().toLowerCase()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.target === document.querySelector('#new-tag-input')) {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSave();
    }
  };

  const priorityOption = PRIORITY_OPTIONS.find(p => p.value === formData.priority);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {task?.id ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                Edit Task
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 text-green-600" />
                Create New Task
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Task Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Task Title *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter task title..."
              className="text-lg"
              onKeyPress={handleKeyPress}
            />
          </div>

          {/* Task Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Add task details, notes, or requirements..."
              className="min-h-20"
              rows={3}
            />
          </div>

          {/* Priority and Category Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Flag className="w-4 h-4" />
                Priority
              </Label>
              <Select value={formData.priority} onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <Badge className={priorityOption?.color}>{priorityOption?.label}</Badge>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <Badge className={option.color}>{option.label}</Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                Category
              </Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map(category => (
                    <SelectItem key={category} value={category.toLowerCase()}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Time Estimate and Due Date Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Estimated Time (minutes)
              </Label>
              <Select value={formData.estimatedTime.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, estimatedTime: parseInt(value) }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_ESTIMATES.map(time => (
                    <SelectItem key={time} value={time.toString()}>
                      {time <= 60 ? `${time} min` : `${Math.floor(time / 60)}h ${time % 60}m`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate" className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Due Date
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Tags Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Tags
            </Label>
            
            {/* Existing Tags */}
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X 
                      className="w-3 h-3 cursor-pointer hover:text-red-500" 
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
            
            {/* Add New Tag */}
            <div className="flex gap-2">
              <Input
                id="new-tag-input"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag..."
                className="flex-1"
                onKeyPress={handleKeyPress}
              />
              <Button onClick={addTag} size="sm" variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Completion Status */}
          {task?.id && (
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Task Status</h4>
                    <p className="text-sm text-muted-foreground">
                      Mark this task as completed or incomplete
                    </p>
                  </div>
                  <Button
                    variant={formData.completed ? "default" : "outline"}
                    onClick={() => setFormData(prev => ({ ...prev, completed: !prev.completed }))}
                    className={formData.completed ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    {formData.completed ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Completed
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Mark Complete
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={saveTaskMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saveTaskMutation.isPending}>
            {saveTaskMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {task?.id ? 'Update Task' : 'Create Task'}
              </>
            )}
          </Button>
        </div>

        {/* Keyboard Shortcuts Info */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Press <kbd className="px-1 py-0.5 bg-muted rounded">Ctrl + Enter</kbd> to save quickly
        </div>
      </DialogContent>
    </Dialog>
  );
}