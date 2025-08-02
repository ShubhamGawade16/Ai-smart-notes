import React, { useState } from 'react';
import { MessageCircle, Send, Loader2, Lightbulb, Target, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
// import { useUpgrade } from '@/hooks/useUpgrade';

interface TaskRefinement {
  refinedTasks: Array<{
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    category: string;
    tags: string[];
    estimatedTime: number;
    subtasks?: string[];
  }>;
  explanation: string;
  suggestions: string[];
}

interface ConversationalRefinerProps {
  initialTask?: string;
  onTasksRefined?: (tasks: TaskRefinement['refinedTasks']) => void;
  onClose?: () => void;
}

export const ConversationalRefiner: React.FC<ConversationalRefinerProps> = ({
  initialTask = '',
  onTasksRefined,
  onClose,
}) => {
  const [originalTask, setOriginalTask] = useState(initialTask);
  const [userQuery, setUserQuery] = useState('');
  const [conversation, setConversation] = useState<Array<{
    type: 'user' | 'ai';
    content: string;
    refinement?: TaskRefinement;
  }>>([]);
  
  const { toast } = useToast();
  // Mock upgrade hooks for testing (no limitations)
  const canUseFeature = (_feature: string) => true;
  const hasReachedLimit = (_limitType: string) => false;
  const handleApiError = (_error: Error) => false;
  const limits = {
    tier: 'premium_pro' as const,
    dailyAiCalls: { remaining: -1 }
  };

  const refineMutation = useMutation({
    mutationFn: async ({ task, query }: { task: string; query: string }) => {
      const response = await apiRequest('POST', '/api/ai/refine-task', {
        originalTask: task,
        userQuery: query,
        context: {
          conversationHistory: conversation.map(c => c.content).slice(-4), // Last 4 messages
        },
      });
      return await response.json();
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
      if (!handleApiError(error)) {
        toast({
          title: "Refinement Failed",
          description: "Failed to refine task. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const handleSubmit = () => {
    if (!userQuery.trim() || !originalTask.trim()) return;
    
    if (!canUseFeature('basic_tasks') || hasReachedLimit('daily_ai')) {
      handleApiError(new Error('Daily limit exceeded'));
      return;
    }
    
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

  const canRefine = canUseFeature('basic_tasks');
  const remainingCalls = limits?.dailyAiCalls ? limits.dailyAiCalls.remaining : 0;
  const isFreeTier = false; // Always premium for testing

  const exampleQueries = [
    "Break this down into smaller steps",
    "Make this more specific and actionable",
    "Add a deadline and priority",
    "What resources will I need?",
    "How can I make this more efficient?",
  ];

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-purple-600" />
          Conversational Task Refiner
          {canRefine && isFreeTier && (
            <Badge variant="outline" className="ml-2">
              {remainingCalls} calls left today
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Original Task Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Original Task:</label>
          <Input
            placeholder="Enter the task you want to refine..."
            value={originalTask}
            onChange={(e) => setOriginalTask(e.target.value)}
          />
        </div>

        {/* Example Queries */}
        {conversation.length === 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1">
              <Lightbulb className="w-4 h-4" />
              Try asking:
            </label>
            <div className="flex flex-wrap gap-2">
              {exampleQueries.map((query, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setUserQuery(query)}
                  className="text-xs"
                  disabled={!originalTask.trim()}
                >
                  {query}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Conversation History */}
        {conversation.length > 0 && (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {conversation.map((message, index) => (
              <div key={index} className={`space-y-2 ${
                message.type === 'user' ? 'text-right' : 'text-left'
              }`}>
                <div className={`inline-block p-3 rounded-lg max-w-[80%] ${
                  message.type === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}>
                  <p className="text-sm">{message.content}</p>
                </div>
                
                {/* Refined Tasks Display */}
                {message.refinement && (
                  <div className="space-y-3 text-left">
                    {message.refinement.refinedTasks.map((task, taskIndex) => (
                      <div key={taskIndex} className="p-3 border rounded-lg bg-purple-50 dark:bg-purple-900/10">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 space-y-2">
                            <div className="font-medium">{task.title}</div>
                            {task.description && (
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {task.description}
                              </div>
                            )}
                            <div className="flex gap-2 text-xs">
                              <Badge variant="outline">{task.priority}</Badge>
                              <Badge variant="outline">{task.estimatedTime}min</Badge>
                              <Badge variant="outline">{task.category}</Badge>
                            </div>
                            {task.subtasks && task.subtasks.length > 0 && (
                              <div className="space-y-1">
                                <div className="text-xs font-medium">Subtasks:</div>
                                <ul className="text-xs space-y-1">
                                  {task.subtasks.map((subtask, subIndex) => (
                                    <li key={subIndex} className="flex items-center gap-1">
                                      <Target className="w-3 h-3" />
                                      {subtask}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Suggestions */}
                    {message.refinement.suggestions.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-medium flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Additional Suggestions:
                        </div>
                        <ul className="text-xs space-y-1">
                          {message.refinement.suggestions.map((suggestion, sugIndex) => (
                            <li key={sugIndex} className="flex items-start gap-1">
                              <span className="text-purple-600">•</span>
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <Button
                      size="sm"
                      onClick={() => handleUseRefinedTasks(message.refinement!.refinedTasks)}
                      className="w-full"
                    >
                      Use These Refined Tasks
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Input for refinement query */}
        <div className="flex gap-2">
          <Input
            placeholder="How would you like to refine this task?"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!originalTask.trim() || !canRefine}
          />
          <Button
            onClick={handleSubmit}
            disabled={!userQuery.trim() || !originalTask.trim() || refineMutation.isPending || !canRefine}
          >
            {refineMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Close button */}
        {onClose && (
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};