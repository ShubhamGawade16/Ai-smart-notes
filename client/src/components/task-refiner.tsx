import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Wand2, Lightbulb, ArrowRight, CheckCircle, Maximize2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { AIFeatureModal } from '@/components/expanded-views/ai-feature-modal';

interface TaskRefinement {
  refinedTask: string;
  suggestions: string[];
  decomposition?: string[];
}

interface TaskRefinerProps {
  onTaskRefined?: (refinedTask: string, decomposition?: string[]) => void;
  initialTask?: string;
  userTier?: string;
}

export default function TaskRefiner({ 
  onTaskRefined, 
  initialTask = '', 
  userTier = 'free' 
}: TaskRefinerProps) {
  const [taskContent, setTaskContent] = useState(initialTask);
  const [refinementRequest, setRefinementRequest] = useState('');
  const [refinement, setRefinement] = useState<TaskRefinement | null>(null);
  const { toast } = useToast();

  const refineTaskMutation = useMutation({
    mutationFn: async (data: { taskContent: string; refinementRequest: string }) => {
      return apiRequest('/api/ai/refine-task', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      setRefinement(data);
      toast({
        title: "Task refined successfully",
        description: "Your task has been improved with AI assistance.",
      });
    },
    onError: (error) => {
      toast({
        title: "Refinement failed",
        description: "Unable to refine task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRefine = () => {
    if (!taskContent.trim()) {
      toast({
        title: "Missing task",
        description: "Please enter a task to refine.",
        variant: "destructive",
      });
      return;
    }

    if (!refinementRequest.trim()) {
      toast({
        title: "Missing request",
        description: "Please describe how you'd like to improve the task.",
        variant: "destructive",
      });
      return;
    }

    refineTaskMutation.mutate({
      taskContent: taskContent.trim(),
      refinementRequest: refinementRequest.trim(),
    });
  };

  const handleAcceptRefinement = () => {
    if (refinement && onTaskRefined) {
      onTaskRefined(refinement.refinedTask, refinement.decomposition);
      setTaskContent(refinement.refinedTask);
      setRefinement(null);
      setRefinementRequest('');
    }
  };

  const quickPrompts = [
    "Make this clearer and more specific",
    "Break this into smaller steps",
    "Add time estimates",
    "Identify potential blockers",
    "Suggest the best approach",
  ];

  const dailyLimit = userTier === 'free' ? 3 : 999;
  const usedToday = 0; // This would come from user's usage tracking

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-purple-500" />
            <CardTitle>Conversational Task Refiner</CardTitle>
            <Badge variant={userTier === 'free' ? 'outline' : 'secondary'}>
              {userTier === 'free' ? `${usedToday}/${dailyLimit} today` : 'Unlimited'}
            </Badge>
          </div>
          <AIFeatureModal
            title="Conversational Task Refiner"
            tier={userTier === 'free' ? 'Free with Limits' : 'Unlimited Pro'}
            description="Chat with AI to make your tasks clearer and break them into actionable steps with advanced refinement options."
            icon={<MessageSquare className="h-5 w-5 text-purple-500" />}
            trigger={
              <Button variant="ghost" size="sm">
                <Maximize2 className="h-4 w-4" />
              </Button>
            }
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Current Task</label>
                  <Textarea
                    value={taskContent}
                    onChange={(e) => setTaskContent(e.target.value)}
                    placeholder="Enter the task you'd like to improve..."
                    className="min-h-24"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">How should I improve it?</label>
                  <Input
                    value={refinementRequest}
                    onChange={(e) => setRefinementRequest(e.target.value)}
                    placeholder="e.g., 'Make this clearer' or 'Break into steps'"
                  />
                </div>
              </div>

              {/* Extended Quick Prompts */}
              <div>
                <p className="text-sm font-medium mb-3">Quick refinement prompts:</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    "Make this clearer and more specific",
                    "Break this into smaller steps", 
                    "Add time estimates and deadlines",
                    "Identify potential blockers",
                    "Suggest the best approach",
                    "Add success criteria",
                    "Include required resources",
                    "Set priority levels"
                  ].map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setRefinementRequest(prompt)}
                      className="text-xs text-left justify-start"
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleRefine}
                disabled={refineTaskMutation.isPending || (userTier === 'free' && usedToday >= dailyLimit)}
                className="w-full"
                size="lg"
              >
                {refineTaskMutation.isPending ? (
                  <>
                    <Wand2 className="h-4 w-4 mr-2 animate-spin" />
                    Refining...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Refine Task with AI
                  </>
                )}
              </Button>

              {/* Detailed Refinement Results */}
              {refinement && (
                <div className="space-y-4 border-t pt-6">
                  <h4 className="font-semibold flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Refined Task
                  </h4>
                  
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="font-medium mb-2">Improved Version:</p>
                    <p className="text-sm">{refinement.refinedTask}</p>
                  </div>

                  {refinement.suggestions && refinement.suggestions.length > 0 && (
                    <div>
                      <p className="font-medium mb-2">AI Suggestions:</p>
                      <ul className="space-y-1">
                        {refinement.suggestions.map((suggestion, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <Lightbulb className="h-3 w-3 mt-1 flex-shrink-0" />
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {refinement.decomposition && refinement.decomposition.length > 0 && (
                    <div>
                      <p className="font-medium mb-2">Subtasks:</p>
                      <div className="space-y-2">
                        {refinement.decomposition.map((step, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
                            <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                              {index + 1}
                            </span>
                            {step}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={handleAcceptRefinement} className="flex-1">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accept Refinement
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setRefinement(null)} 
                      className="flex-1"
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </AIFeatureModal>
        </div>
        <CardDescription>
          Chat with AI to make your tasks clearer and break them into actionable steps
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Task Input */}
        <div>
          <label className="text-sm font-medium mb-2 block">Current Task</label>
          <Textarea
            value={taskContent}
            onChange={(e) => setTaskContent(e.target.value)}
            placeholder="Enter the task you'd like to improve..."
            className="min-h-20"
          />
        </div>

        {/* Refinement Request */}
        <div>
          <label className="text-sm font-medium mb-2 block">How should I improve it?</label>
          <Input
            value={refinementRequest}
            onChange={(e) => setRefinementRequest(e.target.value)}
            placeholder="e.g., 'Make this clearer' or 'Break into steps'"
          />
        </div>

        {/* Quick Prompts */}
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Quick prompts:</p>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setRefinementRequest(prompt)}
                className="text-xs"
              >
                {prompt}
              </Button>
            ))}
          </div>
        </div>

        {/* Refine Button */}
        <Button 
          onClick={handleRefine}
          disabled={refineTaskMutation.isPending || (userTier === 'free' && usedToday >= dailyLimit)}
          className="w-full"
        >
          {refineTaskMutation.isPending ? (
            <>
              <Wand2 className="h-4 w-4 mr-2 animate-spin" />
              Refining...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              Refine Task
            </>
          )}
        </Button>

        {userTier === 'free' && usedToday >= dailyLimit && (
          <div className="text-center p-4 border border-dashed rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Daily limit reached. Upgrade for unlimited refinements.
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                window.open('https://billing.stripe.com/p/login/test_basic_pro', '_blank');
              }}
            >
              Upgrade to Basic Pro
            </Button>
          </div>
        )}

        {/* Refinement Results */}
        {refinement && (
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              <span className="font-medium">AI Refinement</span>
            </div>

            {/* Refined Task */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Improved Task:</h4>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm">{refinement.refinedTask}</p>
              </div>
            </div>

            {/* Suggestions */}
            {refinement.suggestions.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Suggestions:</h4>
                <div className="space-y-2">
                  {refinement.suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <ArrowRight className="h-3 w-3 mt-1 text-blue-500 flex-shrink-0" />
                      <span>{suggestion}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Decomposition (Pro feature) */}
            {refinement.decomposition && refinement.decomposition.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  Step-by-Step Breakdown
                  <Badge variant="secondary">Pro</Badge>
                </h4>
                <div className="space-y-2">
                  {refinement.decomposition.map((step, index) => (
                    <div key={index} className="flex items-start gap-3 p-2 border rounded">
                      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-400 flex-shrink-0">
                        {index + 1}
                      </div>
                      <span className="text-sm">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Accept Refinement */}
            <div className="flex gap-2">
              <Button onClick={handleAcceptRefinement} className="flex-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                Accept Refinement
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setRefinement(null)}
              >
                Try Again
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}