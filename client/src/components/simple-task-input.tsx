import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/use-subscription";
import { Plus, Sparkles, Loader2 } from "lucide-react";

interface SimpleTaskInputProps {
  onTaskCreated?: () => void;
  onUpgradeRequired?: () => void;
  onAiUsageIncrement?: () => Promise<boolean>;
}

export function SimpleTaskInput({ onTaskCreated, onUpgradeRequired, onAiUsageIncrement }: SimpleTaskInputProps) {
  const [taskInput, setTaskInput] = useState("");
  const [isSmartMode, setIsSmartMode] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { incrementAiUsage, checkAiUsageLimit } = useSubscription();

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      if (isSmartMode) {
        // Use AI to enhance the task
        const aiResponse = await apiRequest("POST", "/api/ai/parse-task", {
          input: taskInput
        });
        const aiData = await aiResponse.json();
        
        const taskResponse = await apiRequest("POST", "/api/tasks", {
          title: aiData.title || taskInput,
          description: aiData.description || "",
          priority: aiData.priority || "medium",
          category: aiData.category || "general",
          tags: aiData.tags || [],
          timeEstimate: aiData.timeEstimate || null,
          dueDate: aiData.dueDate || null,
        });
        return await taskResponse.json();
      } else {
        // Simple task creation
        const taskResponse = await apiRequest("POST", "/api/tasks", {
          title: taskInput,
          description: "",
          priority: "medium",
          category: "general",
          tags: [],
        });
        return await taskResponse.json();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskInput.trim()) return;
    
    // AI usage limit checking and increment is handled by the backend endpoint
    // Smart mode AI parsing calls the /api/ai/parse-task endpoint which handles usage increment
    
    createTaskMutation.mutate({});
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Task</h2>
        <Button
          type="button"
          variant={isSmartMode ? "default" : "outline"}
          size="sm"
          onClick={() => setIsSmartMode(!isSmartMode)}
          className={`btn-hover transition-all duration-300 ${isSmartMode 
            ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-0 shadow-lg" 
            : "border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300"
          }`}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {isSmartMode ? "Smart Mode" : "Basic Mode"}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-3">
          <Input
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            placeholder={isSmartMode ? "Describe your task - AI will analyze it..." : "What do you need to do?"}
            className="flex-1 h-12 text-base border-gray-200 dark:border-gray-600 rounded-xl"
            disabled={createTaskMutation.isPending}
          />
          <Button
            type="submit"
            disabled={!taskInput.trim() || createTaskMutation.isPending}
            className="btn-hover bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white border-0 px-6 h-12 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {createTaskMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
          </Button>
        </div>

        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
          isSmartMode ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-700 card-animate">
            <p className="text-sm text-purple-700 dark:text-purple-300 flex items-center">
              <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
              Smart Mode: AI will automatically detect priority, category, tags, and time estimates
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}