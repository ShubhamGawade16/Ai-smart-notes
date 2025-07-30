import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Edit, 
  Save, 
  X, 
  Calendar, 
  Clock, 
  Tag,
  MoreHorizontal,
  Eye
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Task } from "@shared/schema";

interface AdvancedTaskItemProps {
  task: Task;
  onUpdate: (task: Task) => void;
  onDelete: (id: string) => void;
  onAdvancedView: (task: Task) => void;
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

export function AdvancedTaskItem({ task, onUpdate, onDelete, onAdvancedView }: AdvancedTaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [editForm, setEditForm] = useState({
    title: task.title,
    description: task.description || "",
    priority: task.priority,
    category: task.category || "",
    estimatedTime: task.estimatedTime || 30
  });

  const handleSave = () => {
    onUpdate({
      ...task,
      ...editForm
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      category: task.category || "",
      estimatedTime: task.estimatedTime || 30
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

  if (isEditing) {
    return (
      <Card className="border-2 border-primary/20">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Edit Task</h3>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} className="h-8">
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel} className="h-8">
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
          
          <div className="space-y-3">
            <Input
              value={editForm.title}
              onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Task title"
              className="font-medium"
            />
            
            <Textarea
              value={editForm.description}
              onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Task description"
              rows={3}
            />
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Priority
                </label>
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
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Category
                </label>
                <Input
                  value={editForm.category}
                  onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="Category"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Estimated Time (minutes)
              </label>
              <Input
                type="number"
                value={editForm.estimatedTime}
                onChange={(e) => setEditForm(prev => ({ ...prev, estimatedTime: parseInt(e.target.value) || 30 }))}
                min="5"
                max="480"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card 
        className={cn(
          "group cursor-pointer transition-all duration-200 hover:shadow-md border",
          task.completed ? "opacity-75" : "",
          isHovered ? "border-primary/30 shadow-sm" : ""
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onAdvancedView(task)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Task Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <h3 className={cn(
                  "font-medium text-gray-900 dark:text-gray-100 truncate",
                  task.completed && "line-through text-gray-500"
                )}>
                  {task.title}
                </h3>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAdvancedView(task);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Advanced View</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing(true);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => e.stopPropagation()}
                        className="h-8 w-8 p-0"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(task.id);
                        }}
                        className="text-red-600 dark:text-red-400"
                      >
                        Delete Task
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              {/* Description Tooltip */}
              {task.description && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-3 cursor-help">
                      {task.description}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p>{task.description}</p>
                  </TooltipContent>
                </Tooltip>
              )}
              
              {/* Priority Meter */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span>Priority</span>
                  <span className="capitalize">{task.priority}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={cn("h-2 rounded-full transition-all duration-300", getPriorityMeterColor())}
                    style={{ width: getPriorityMeterWidth() }}
                  />
                </div>
              </div>
              
              {/* Task Meta */}
              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                {task.category && (
                  <div className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    <span>{task.category}</span>
                  </div>
                )}
                
                {task.estimatedTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{task.estimatedTime}m</span>
                  </div>
                )}
                
                {task.dueDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              
              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {task.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            {/* Priority Badge */}
            <Badge className={cn("text-xs", priorityColors[task.priority])}>
              {task.priority}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}