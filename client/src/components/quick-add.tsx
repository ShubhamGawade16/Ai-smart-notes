import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Zap, Clock } from "lucide-react";
import { taskApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function QuickAdd() {
  const [input, setInput] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createTaskMutation = useMutation({
    mutationFn: (title: string) => taskApi.create({ title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/today'] });
      setInput("");
      toast({
        title: "Task created",
        description: "Your task has been added with AI suggestions.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      createTaskMutation.mutate(input.trim());
    }
  };

  return (
    <div className="bg-card rounded-lg card-shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Quick Add</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What would you like to add?"
            className="pr-12"
            disabled={createTaskMutation.isPending}
          />
          <Button 
            type="submit"
            size="icon"
            className="absolute right-2 top-2 h-7 w-7"
            disabled={!input.trim() || createTaskMutation.isPending}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        {input.trim() && (
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              <Zap className="w-3 h-3 mr-1" />
              AI will categorize
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              Time estimate included
            </Badge>
          </div>
        )}
      </form>
    </div>
  );
}
