import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Zap, Clock, ChevronDown, ChevronUp, Calendar, Flag, Tag, X } from "lucide-react";
import { taskApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { SimpleTaskEditor } from "@/components/simple-task-editor";

export function QuickAdd() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [taskData, setTaskData] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    category: "",
    estimatedTime: "",
    dueDate: "",
    tags: [] as string[],
    newTag: ""
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createTaskMutation = useMutation({
    mutationFn: (data: any) => {
      const taskPayload = {
        title: data.title,
        description: data.description || null,
        priority: data.priority,
        category: data.category || null,
        estimatedTime: data.estimatedTime ? parseInt(data.estimatedTime) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        tags: data.tags.length > 0 ? data.tags : null,
      };
      return taskApi.create(taskPayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/today'] });
      resetForm();
      toast({
        title: "Task created successfully!",
        description: "Your task has been added with all customizations.",
      });
    },
    onError: (error) => {
      console.error('Task creation error:', error);
      toast({
        title: "Failed to create task",
        description: "Please check your input and try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setTaskData({
      title: "",
      description: "",
      priority: "medium",
      category: "",
      estimatedTime: "",
      dueDate: "",
      tags: [],
      newTag: ""
    });
    setIsExpanded(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskData.title.trim()) {
      createTaskMutation.mutate(taskData);
    }
  };

  const addTag = () => {
    if (taskData.newTag.trim() && !taskData.tags.includes(taskData.newTag.trim())) {
      setTaskData(prev => ({
        ...prev,
        tags: [...prev.tags, prev.newTag.trim()],
        newTag: ""
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTaskData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Task
          </div>
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title - Always visible */}
          <div className="relative">
            <Input
              value={taskData.title}
              onChange={(e) => setTaskData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="What would you like to do?"
              className="pr-12"
              disabled={createTaskMutation.isPending}
            />
            <Button 
              type="submit"
              size="icon"
              className="absolute right-2 top-2 h-7 w-7"
              disabled={!taskData.title.trim() || createTaskMutation.isPending}
            >
              {createTaskMutation.isPending ? <Zap className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </Button>
          </div>

          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleContent className="space-y-4">
              {/* Description */}
              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  value={taskData.description}
                  onChange={(e) => setTaskData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Add more details about this task..."
                  rows={3}
                />
              </div>

              {/* Priority & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Priority</label>
                  <Select value={taskData.priority} onValueChange={(value: any) => setTaskData(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">
                        <div className="flex items-center gap-2">
                          <Flag className="h-3 w-3 text-green-500" />
                          Low Priority
                        </div>
                      </SelectItem>
                      <SelectItem value="medium">
                        <div className="flex items-center gap-2">
                          <Flag className="h-3 w-3 text-yellow-500" />
                          Medium Priority
                        </div>
                      </SelectItem>
                      <SelectItem value="high">
                        <div className="flex items-center gap-2">
                          <Flag className="h-3 w-3 text-orange-500" />
                          High Priority
                        </div>
                      </SelectItem>
                      <SelectItem value="urgent">
                        <div className="flex items-center gap-2">
                          <Flag className="h-3 w-3 text-red-500" />
                          Urgent
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Input
                    value={taskData.category}
                    onChange={(e) => setTaskData(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="Work, Personal, etc."
                  />
                </div>
              </div>

              {/* Time Estimate & Due Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    <Clock className="h-3 w-3 inline mr-1" />
                    Estimated Time (minutes)
                  </label>
                  <Input
                    type="number"
                    value={taskData.estimatedTime}
                    onChange={(e) => setTaskData(prev => ({ ...prev, estimatedTime: e.target.value }))}
                    placeholder="30"
                    min="5"
                    step="5"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    <Calendar className="h-3 w-3 inline mr-1" />
                    Due Date
                  </label>
                  <Input
                    type="datetime-local"
                    value={taskData.dueDate}
                    onChange={(e) => setTaskData(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  <Tag className="h-3 w-3 inline mr-1" />
                  Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={taskData.newTag}
                    onChange={(e) => setTaskData(prev => ({ ...prev, newTag: e.target.value }))}
                    placeholder="Add a tag..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag} variant="outline" size="sm">
                    Add
                  </Button>
                </div>
                {taskData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {taskData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                        <X 
                          className="h-2 w-2 ml-1 cursor-pointer" 
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={!taskData.title.trim() || createTaskMutation.isPending} className="flex-1">
                  {createTaskMutation.isPending ? (
                    <>
                      <Zap className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Task
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Clear
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Quick preview when collapsed */}
          {!isExpanded && taskData.title.trim() && (
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="secondary" className="text-xs">
                <Zap className="w-3 h-3 mr-1" />
                AI Enhanced
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                Smart Scheduling
              </Badge>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
