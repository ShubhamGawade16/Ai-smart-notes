import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Sparkles, Loader2 } from "lucide-react";

interface SimpleTaskInputProps {
  onTaskCreated?: () => void;
}

export function SimpleTaskInput({ onTaskCreated }: SimpleTaskInputProps) {
  const [taskInput, setTaskInput] = useState("");
  const [isSmartMode, setIsSmartMode] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      if (isSmartMode) {
        // Use AI to enhance the task
        const aiResponse = await apiRequest("/api/ai/parse-task", "POST", {
          input: taskInput
        });
        
        return apiRequest("/api/tasks", "POST", {
          title: aiResponse.title || taskInput,
          description: aiResponse.description || "",
          priority: aiResponse.priority || "medium",
          category: aiResponse.category || "general",
          tags: aiResponse.tags || [],
          timeEstimate: aiResponse.timeEstimate || null,
          dueDate: aiResponse.dueDate || null,
        });
      } else {
        // Simple task creation
        return apiRequest("/api/tasks", "POST", {
          title: taskInput,
          description: "",
          priority: "medium",
          category: "general",
          tags: [],
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/today'] });
      toast({
        title: "Task created",
        description: isSmartMode ? "AI enhanced your task with smart details" : "Task added successfully",
      });
      setTaskInput("");
      onTaskCreated?.();
    },
    onError: (error) => {
      console.error("Error creating task:", error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskInput.trim()) return;
    createTaskMutation.mutate({});
  };

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Smart Mode Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Add Task</span>
          <Button
            type="button"
            variant={isSmartMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsSmartMode(!isSmartMode)}
            className="flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {isSmartMode ? "Smart Mode" : "Basic Mode"}
          </Button>
        </div>

        {/* Task Input */}
        <div className="flex gap-2">
          <Input
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            placeholder={isSmartMode ? "Describe your task - AI will analyze it..." : "What do you need to do?"}
            className="flex-1"
            disabled={createTaskMutation.isPending}
          />
          <Button
            type="submit"
            disabled={!taskInput.trim() || createTaskMutation.isPending}
            size="icon"
          >
            {createTaskMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Smart Mode Description */}
        {isSmartMode && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Smart Mode: AI will automatically detect priority, category, tags, and time estimates
          </p>
        )}
      </form>
    </Card>
  );
}