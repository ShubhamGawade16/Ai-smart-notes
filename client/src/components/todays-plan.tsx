import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { TaskItem } from "./task-item";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap } from "lucide-react";
import { taskApi, aiApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function TodaysPlan() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['/api/tasks/today'],
    queryFn: taskApi.getToday,
  });

  const optimizeDayMutation = useMutation({
    mutationFn: aiApi.optimizeDay,
    onSuccess: (data) => {
      toast({
        title: "Day optimized!",
        description: `AI found ${data.insights.length} optimization opportunities.`,
      });
      // You could update the UI here with the optimization results
    },
    onError: () => {
      toast({
        title: "Optimization failed",
        description: "Could not optimize your day. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleOptimizeDay = () => {
    optimizeDayMutation.mutate({});
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg card-shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Today's Plan</h2>
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg card-shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Today's Plan</h2>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleOptimizeDay}
          disabled={optimizeDayMutation.isPending || !tasks?.length}
          className="text-primary hover:text-primary/80"
        >
          <Zap className="w-4 h-4 mr-1" />
          Optimize My Day
        </Button>
      </div>
      
      <div className="space-y-3">
        {tasks?.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground mb-4">
              <p className="text-lg font-medium mb-2">No tasks for today!</p>
              <p className="text-sm">Let's get you started with your first task</p>
            </div>
            
            {/* Quick Add Module */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-4 mb-4">
              <h4 className="font-medium mb-3">Quick Add Your First Task</h4>
              <div className="flex flex-col space-y-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const quickAddInput = document.querySelector('input[placeholder*="What would you like to add"]') as HTMLInputElement;
                    if (quickAddInput) {
                      quickAddInput.focus();
                      quickAddInput.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="w-full"
                >
                  Add New Task
                </Button>
              </div>
            </div>

            {/* Sample Tasks */}
            <div className="text-left">
              <h4 className="font-medium mb-3 text-center">Or try these sample tasks:</h4>
              <div className="grid gap-2">
                {[
                  "Morning Review - Check emails and plan the day",
                  "Email Triage - Process and organize inbox",
                  "Project Planning - Outline next sprint goals"
                ].map((sampleTask, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="text-left justify-start h-auto p-3 text-wrap"
                    onClick={() => {
                      // Add sample task functionality
                      const quickAddInput = document.querySelector('input[placeholder*="What would you like to add"]') as HTMLInputElement;
                      if (quickAddInput) {
                        quickAddInput.value = sampleTask;
                        quickAddInput.focus();
                        quickAddInput.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  >
                    + {sampleTask}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          tasks?.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))
        )}
      </div>
    </div>
  );
}
