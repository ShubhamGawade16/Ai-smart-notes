import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageCircle, 
  Send, 
  Loader2, 
  Sparkles, 
  Target,
  Clock,
  Flag,
  ChevronRight,
  Lightbulb,
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface TaskRefinement {
  refinedTasks: Array<{
    title: string;
    description: string;
    priority: string;
    category: string;
    tags: string[];
    estimatedTime: number;
    subtasks?: string[];
  }>;
  explanation: string;
  suggestions: string[];
}

interface ModernAIRefinerProps {
  initialTask?: string;
  onTasksRefined?: (tasks: TaskRefinement['refinedTasks']) => void;
  onClose?: () => void;
}

export function ModernAIRefiner({ 
  initialTask = '', 
  onTasksRefined,
  onClose 
}: ModernAIRefinerProps) {
  const [originalTask, setOriginalTask] = useState(initialTask);
  const [userQuery, setUserQuery] = useState('');
  const [conversation, setConversation] = useState<Array<{
    type: 'user' | 'ai';
    content: string;
    refinement?: TaskRefinement;
  }>>([]);
  
  const { toast } = useToast();

  const refineMutation = useMutation({
    mutationFn: async ({ task, query }: { task: string; query: string }) => {
      const response = await apiRequest('/api/ai/refine-task', 'POST', {
        originalTask: task,
        userQuery: query,
        context: {
          conversationHistory: conversation.map(c => c.content).slice(-4),
        },
      });
      return response;
    },
    onSuccess: (data: TaskRefinement) => {
      setConversation(prev => [...prev, 
        { type: 'user', content: userQuery },
        { type: 'ai', content: data.explanation, refinement: data }
      ]);
      setUserQuery('');
      
      toast({
        title: "Task Refined Successfully",
        description: `Generated ${data.refinedTasks.length} refined task(s).`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Refinement Failed",
        description: "Failed to refine task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!userQuery.trim() || !originalTask.trim()) return;
    refineMutation.mutate({ task: originalTask, query: userQuery });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleUseRefinedTasks = (tasks: TaskRefinement['refinedTasks']) => {
    onTasksRefined?.(tasks);
    toast({
      title: "Tasks Applied",
      description: `${tasks.length} refined task(s) ready to be created.`,
    });
  };

  const exampleQueries = [
    "Break this down into smaller steps",
    "Make this more specific and actionable",
    "Add deadlines and priorities",
    "What resources will I need?",
    "How can I make this more efficient?"
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400';
      case 'high':
        return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400';
      case 'medium':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400';
      case 'low':
        return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-400';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-400';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {onClose && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="w-8 h-8 p-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">AI Task Refiner</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Transform your tasks with AI-powered insights
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Original Task Input */}
          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-600" />
              What task would you like to refine?
            </label>
            <Textarea
              placeholder="Enter the task you want to break down and improve..."
              value={originalTask}
              onChange={(e) => setOriginalTask(e.target.value)}
              className="min-h-[80px] resize-none border-2 border-dashed border-gray-200 focus:border-purple-300 focus:border-solid transition-all"
            />
          </div>

          {/* Example Queries */}
          {conversation.length === 0 && originalTask.trim() && (
            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                Quick prompts to get you started:
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {exampleQueries.map((query, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setUserQuery(query)}
                    className="justify-start text-left h-auto py-2 px-3 text-xs hover:bg-purple-50 hover:border-purple-200 transition-colors"
                    disabled={!originalTask.trim()}
                  >
                    <ChevronRight className="w-3 h-3 mr-2 text-purple-600" />
                    {query}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Conversation History */}
          {conversation.length > 0 && (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {conversation.map((message, index) => (
                <div key={index} className="space-y-3">
                  {/* User Message */}
                  {message.type === 'user' && (
                    <div className="flex justify-end">
                      <div className="bg-purple-600 text-white p-3 rounded-2xl rounded-tr-sm max-w-[80%]">
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* AI Response */}
                  {message.type === 'ai' && (
                    <div className="space-y-4">
                      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl rounded-tl-sm">
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                          {message.content}
                        </p>
                        
                        {/* Refined Tasks Display */}
                        {message.refinement && (
                          <div className="space-y-3">
                            <div className="text-sm font-medium flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-purple-600" />
                              Refined Tasks:
                            </div>
                            
                            {message.refinement.refinedTasks.map((task, taskIndex) => (
                              <div key={taskIndex} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-purple-100 dark:border-purple-900">
                                <div className="space-y-3">
                                  <div className="font-medium text-gray-900 dark:text-gray-100">
                                    {task.title}
                                  </div>
                                  
                                  {task.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      {task.description}
                                    </p>
                                  )}
                                  
                                  <div className="flex flex-wrap gap-2">
                                    <Badge 
                                      variant="outline" 
                                      className={getPriorityColor(task.priority)}
                                    >
                                      <Flag className="w-3 h-3 mr-1" />
                                      {task.priority}
                                    </Badge>
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                      <Clock className="w-3 h-3 mr-1" />
                                      {task.estimatedTime}min
                                    </Badge>
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                      {task.category}
                                    </Badge>
                                  </div>
                                  
                                  {task.subtasks && task.subtasks.length > 0 && (
                                    <div className="space-y-2">
                                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                        Subtasks:
                                      </div>
                                      <ul className="space-y-1">
                                        {task.subtasks.map((subtask, subIndex) => (
                                          <li key={subIndex} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                                            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
                                            {subtask}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                            
                            {/* Suggestions */}
                            {message.refinement.suggestions.length > 0 && (
                              <div className="space-y-2">
                                <div className="text-xs font-medium flex items-center gap-1 text-amber-600">
                                  <Sparkles className="w-3 h-3" />
                                  Additional Suggestions:
                                </div>
                                <ul className="space-y-1">
                                  {message.refinement.suggestions.map((suggestion, sugIndex) => (
                                    <li key={sugIndex} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                                      <div className="w-1 h-1 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                                      {suggestion}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            <Button
                              onClick={() => handleUseRefinedTasks(message.refinement!.refinedTasks)}
                              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                            >
                              <Target className="w-4 h-4 mr-2" />
                              Use These Refined Tasks
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Input for refinement query */}
          <div className="space-y-3">
            <div className="flex gap-3">
              <Input
                placeholder="How would you like to refine this task?"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={!originalTask.trim()}
                className="flex-1"
              />
              <Button
                onClick={handleSubmit}
                disabled={!userQuery.trim() || !originalTask.trim() || refineMutation.isPending}
                className="px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {refineMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}