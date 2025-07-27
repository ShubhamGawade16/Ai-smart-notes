import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Save, Clock, Calendar, Flag } from 'lucide-react';
import type { Task } from '@shared/schema';

interface SimpleTaskEditorProps {
  task: Task;
  trigger: React.ReactNode;
  isCreating?: boolean;
}

export function SimpleTaskEditor({ task, trigger, isCreating = false }: SimpleTaskEditorProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    category: task?.category || '',
    estimatedTimeHours: task?.estimatedTime ? Math.floor(task.estimatedTime / 60) : 0,
    estimatedTimeMinutes: task?.estimatedTime ? task.estimatedTime % 60 : 0,
    dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
    dueTime: task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[1]?.slice(0, 5) : '',
  });
  
  const { toast } = useToast();

  const saveTaskMutation = useMutation({
    mutationFn: async () => {
      const totalMinutes = (formData.estimatedTimeHours * 60) + formData.estimatedTimeMinutes;
      
      let dueDateTime = null;
      if (formData.dueDate) {
        const dateTimeString = formData.dueTime 
          ? `${formData.dueDate}T${formData.dueTime}:00`
          : `${formData.dueDate}T23:59:59`;
        dueDateTime = new Date(dateTimeString);
      }

      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        priority: formData.priority,
        category: formData.category.trim() || null,
        estimatedTime: totalMinutes > 0 ? totalMinutes : null,
        dueDate: dueDateTime,
        tags: null, // Simplified for now
      };

      if (isCreating) {
        return apiRequest('/api/tasks', {
          method: 'POST',
          body: JSON.stringify(taskData),
        });
      } else {
        return apiRequest(`/api/tasks/${task.id}`, {
          method: 'PATCH', 
          body: JSON.stringify(taskData),
        });
      }
    },
    onSuccess: () => {
      toast({
        title: isCreating ? "Task Created" : "Task Updated",
        description: "Your task has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/today'] });
      setOpen(false);
      
      if (isCreating) {
        // Reset form for creating new tasks
        setFormData({
          title: '',
          description: '',
          priority: 'medium',
          category: '',
          estimatedTimeHours: 0,
          estimatedTimeMinutes: 0,
          dueDate: '',
          dueTime: '',
        });
      }
    },
    onError: (error) => {
      console.error('Task save error:', error);
      toast({
        title: "Save Failed",
        description: "There was an error saving your task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!formData.title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your task.",
        variant: "destructive",
      });
      return;
    }
    saveTaskMutation.mutate();
  };

  const getEstimatedTimeText = () => {
    const { estimatedTimeHours, estimatedTimeMinutes } = formData;
    if (estimatedTimeHours === 0 && estimatedTimeMinutes === 0) return 'No estimate';
    if (estimatedTimeHours === 0) return `${estimatedTimeMinutes}m`;
    if (estimatedTimeMinutes === 0) return `${estimatedTimeHours}h`;
    return `${estimatedTimeHours}h ${estimatedTimeMinutes}m`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'medium': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'low': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isCreating ? 'Create New Task' : 'Edit Task'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="What needs to be done?"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add more details..."
              rows={3}
            />
          </div>

          {/* Priority and Category Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Flag className="h-4 w-4" />
                Priority
              </Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor('low')}>Low</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor('medium')}>Medium</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor('high')}>High</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="urgent">
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor('urgent')}>Urgent</Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Category</SelectItem>
                  <SelectItem value="Work">Work</SelectItem>
                  <SelectItem value="Personal">Personal</SelectItem>
                  <SelectItem value="Health">Health</SelectItem>
                  <SelectItem value="Learning">Learning</SelectItem>
                  <SelectItem value="Shopping">Shopping</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Time Estimate */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Estimated Time ({getEstimatedTimeText()})
            </Label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min="0"
                  max="23"
                  value={formData.estimatedTimeHours}
                  onChange={(e) => setFormData({ ...formData, estimatedTimeHours: parseInt(e.target.value) || 0 })}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">hours</span>
              </div>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min="0"
                  max="59"
                  step="5"
                  value={formData.estimatedTimeMinutes}
                  onChange={(e) => setFormData({ ...formData, estimatedTimeMinutes: parseInt(e.target.value) || 0 })}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">minutes</span>
              </div>
            </div>
          </div>

          {/* Due Date and Time */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Due Date
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="flex-1"
              />
              {formData.dueDate && (
                <Input
                  type="time"
                  value={formData.dueTime}
                  onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                  className="w-32"
                />
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saveTaskMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {saveTaskMutation.isPending ? 'Saving...' : (isCreating ? 'Create Task' : 'Save Changes')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}