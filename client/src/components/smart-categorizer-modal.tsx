import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Target, ArrowRight, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useSubscription } from '@/hooks/use-subscription';

interface SmartCategorizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SmartCategorizerModal({ isOpen, onClose }: SmartCategorizerModalProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();
  const { } = useSubscription(); // Remove the problematic frontend validation

  const handleCategorize = async () => {
    if (!input.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter some tasks to categorize.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Parse tasks from input (one per line)
      const taskLines = input.split('\n')
        .map(line => line.replace(/^[-•*]\s*/, '').trim())
        .filter(line => line.length > 0);
      
      if (taskLines.length === 0) {
        throw new Error('No valid tasks found');
      }

      // Categorize each task using our working API endpoint
      const categorizedTasks = [];
      
      for (const taskTitle of taskLines) {
        const response = await apiRequest("POST", "/api/ai/categorize", {
          title: taskTitle,
          description: ''
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.analysis) {
            categorizedTasks.push({
              title: taskTitle, // Use the original task title from input
              description: '', // AI doesn't return description currently
              category: data.analysis.category,
              priority: data.analysis.priority,
              tags: data.analysis.tags,
              estimatedTime: data.analysis.estimatedTime
            });
          }
        } else {
          const errorData = await response.json();
          if (response.status === 429) {
            // Show the actual limit error from backend
            toast({
              title: "AI Usage Limit Reached",
              description: errorData.error || "You've reached your AI usage limit",
              variant: "destructive",
            });
            return;
          }
          throw new Error(errorData.error || 'Failed to categorize task');
        }
      }

      setResults({ categorizedTasks });
      toast({
        title: "Categorization Complete!",
        description: `${categorizedTasks.length} tasks have been analyzed and categorized.`,
      });
      
    } catch (error: any) {
      console.error('Smart categorizer error:', error);
      toast({
        title: "Categorization Failed",
        description: error.message || "Failed to categorize tasks. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyCategories = async () => {
    if (!results?.categorizedTasks) return;

    try {
      for (const task of results.categorizedTasks) {
        // Ensure title is properly extracted
        const taskTitle = task.title || task.text || '';
        
        if (!taskTitle.trim()) {
          console.error('Task has no title:', task);
          continue; // Skip tasks without titles
        }
        
        const taskData = {
          title: taskTitle.trim(),
          description: task.description && task.description.trim() ? task.description.trim() : null,
          category: task.category || null,
          tags: task.tags && task.tags.length > 0 ? task.tags : null,
          priority: task.priority || 'medium',
          taskType: 'routine',
          estimatedTime: task.estimatedTime || null,
          completed: false,
          dueDate: null,
          scheduledAt: null,
          parentTaskId: null,
          readinessScore: null,
          optimalTimeSlot: null
        };
        
        console.log('Creating task with data:', taskData);
        
        const response = await apiRequest("POST", "/api/tasks", taskData);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Task creation failed:', errorData);
          throw new Error(errorData.error || 'Failed to create task');
        }
      }

      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/today'] });

      toast({
        title: "Tasks Created!",
        description: `${results.categorizedTasks.length} categorized tasks have been added.`,
      });

      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create tasks. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" aria-describedby="categorizer-description">
        <DialogHeader className="space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Smart Categorizer</DialogTitle>
              <p id="categorizer-description" className="text-sm text-gray-600 dark:text-gray-400">Automatically categorize and tag your tasks with AI</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Enter your tasks (one per line):</label>
            <Textarea
              placeholder="Example:&#10;- Plan team meeting&#10;- Buy groceries&#10;- Finish project report&#10;- Call dentist for appointment&#10;- Learn React hooks"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={6}
              className="w-full"
            />
          </div>

          <Button
            onClick={handleCategorize}
            disabled={isLoading || !input.trim()}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Categorizing...
              </>
            ) : (
              <>
                <Target className="w-4 h-4 mr-2" />
                Categorize Tasks
              </>
            )}
          </Button>

          {results && (
            <Card className="mt-6">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  Categorization Results
                </h3>
                
                <div className="space-y-3">
                  {results.categorizedTasks?.map((task: any, index: number) => (
                    <div key={index} className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                      <h4 className="font-medium">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{task.description}</p>
                      )}
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-medium">
                          📂 {task.category}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          task.priority === 'high' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                          task.priority === 'low' ? 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200' :
                          'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                        }`}>
                          {task.priority === 'high' ? '🔥' : task.priority === 'low' ? '📉' : '📊'} {task.priority}
                        </span>
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs font-medium">
                          ⏱️ {task.estimatedTime}min
                        </span>
                        {task.tags?.map((tag: string, tagIndex: number) => (
                          <span key={tagIndex} className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs font-medium">
                            🏷️ {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={applyCategories}
                  className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Create Categorized Tasks
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}