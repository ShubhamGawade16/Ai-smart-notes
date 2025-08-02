import { useState } from 'react';
import { Header } from '@/components/header';
import { ConversationalRefiner } from '@/components/ConversationalRefiner';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageCircle, Plus } from 'lucide-react';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface TaskRefinement {
  id: string;
  originalTask: string;
  refinedTasks: Array<{
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    estimatedTime: number;
    category: string;
    tags?: string[];
    subtasks?: string[];
  }>;
  suggestions: string[];
  createdAt: Date;
}

export default function TaskRefiner() {
  const [refinements, setRefinements] = useState<TaskRefinement[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createTasksMutation = useMutation({
    mutationFn: async (tasks: any[]) => {
      const promises = tasks.map(async task => {
        const response = await apiRequest('POST', '/api/tasks', task);
        return await response.json();
      });
      return Promise.all(promises);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Tasks Created",
        description: `Successfully created ${data.length} refined tasks.`,
      });
    },
    onError: () => {
      toast({
        title: "Creation Failed",
        description: "Failed to create refined tasks. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleTasksRefined = (tasks: TaskRefinement['refinedTasks']) => {
    const newRefinement: TaskRefinement = {
      id: Date.now().toString(),
      originalTask: 'Refined Task',
      refinedTasks: tasks,
      suggestions: [],
      createdAt: new Date(),
    };
    
    setRefinements(prev => [newRefinement, ...prev]);
  };

  const handleCreateTasks = (tasks: TaskRefinement['refinedTasks']) => {
    createTasksMutation.mutate(tasks);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          
          <div className="flex items-center gap-3 mb-4">
            <MessageCircle className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Task Refiner
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Break down complex tasks into actionable steps with AI assistance
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Main Refiner Component */}
          <ConversationalRefiner 
            onTasksRefined={handleTasksRefined}
          />

          {/* Refinement History */}
          {refinements.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Recent Refinements
              </h2>
              
              {refinements.map(refinement => (
                <div key={refinement.id} className="p-6 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        {refinement.originalTask}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {refinement.createdAt.toLocaleDateString()} at {refinement.createdAt.toLocaleTimeString()}
                      </p>
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => handleCreateTasks(refinement.refinedTasks)}
                      disabled={createTasksMutation.isPending}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Create Tasks
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {refinement.refinedTasks.map((task, taskIndex) => (
                      <div key={taskIndex} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">{task.title}</h4>
                          <div className="flex gap-2">
                            <span className={`text-xs px-2 py-1 rounded ${
                              task.priority === 'high' ? 'bg-red-100 text-red-800' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {task.priority}
                            </span>
                            <span className="text-xs text-gray-500">
                              {task.estimatedTime}min
                            </span>
                          </div>
                        </div>
                        
                        {task.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {task.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                            {task.category}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {refinement.suggestions.length > 0 && (
                    <div className="mt-4">
                      <h5 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-2">
                        Additional Suggestions:
                      </h5>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {refinement.suggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-purple-600 mt-1">•</span>
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Getting Started Guide */}
          <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              How to Use the Task Refiner
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <h4 className="font-semibold text-purple-800 dark:text-purple-200">
                  Enter Your Task
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Start with any task, no matter how vague or complex. Our AI will understand the context.
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <h4 className="font-semibold text-blue-800 dark:text-blue-200">
                  Refine & Clarify
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ask questions like "Break this down" or "Make it more specific" to get detailed subtasks.
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <h4 className="font-semibold text-green-800 dark:text-green-200">
                  Create & Execute
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Review the refined tasks and add them to your task list with proper priorities and time estimates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}