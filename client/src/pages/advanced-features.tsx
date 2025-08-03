import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Brain, 
  Sparkles, 
  Target, 
  TrendingUp, 
  MessageCircle, 
  Wand2,
  ArrowLeft,
  Crown
} from 'lucide-react';
import { Link } from 'wouter';

export default function AdvancedFeatures() {
  const [taskInput, setTaskInput] = useState('');
  const [refineInput, setRefineInput] = useState('');
  const [refineQuery, setRefineQuery] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check subscription status
  const { data: subscriptionStatus } = useQuery({
    queryKey: ['/api/subscription-status'],
  });

  // AI Parse Task Mutation
  const parseTaskMutation = useMutation({
    mutationFn: async (input: string) => {
      const response = await apiRequest('POST', '/api/ai/parse-task', { input });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Task Analyzed",
        description: "AI has analyzed your task and provided suggestions.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to analyze task. You may have reached your daily limit.",
        variant: "destructive",
      });
    },
  });

  // AI Refine Task Mutation
  const refineTaskMutation = useMutation({
    mutationFn: async ({ originalTask, userQuery }: { originalTask: string; userQuery: string }) => {
      const response = await apiRequest('POST', '/api/ai/refine-task', { 
        originalTask, 
        userQuery, 
        context: {} 
      });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Task Refined",
        description: "AI has provided suggestions to improve your task.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to refine task. You may have reached your daily limit.",
        variant: "destructive",
      });
    },
  });

  // AI Insights Query
  const { data: insightsData, refetch: fetchInsights } = useQuery({
    queryKey: ['/api/ai/insights'],
    enabled: false,
  });

  const handleParseTask = () => {
    if (!taskInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter a task to analyze.",
        variant: "destructive",
      });
      return;
    }
    parseTaskMutation.mutate(taskInput);
  };

  const handleRefineTask = () => {
    if (!refineInput.trim() || !refineQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter both the task and your refinement query.",
        variant: "destructive",
      });
      return;
    }
    refineTaskMutation.mutate({ originalTask: refineInput, userQuery: refineQuery });
  };

  const canUseAI = subscriptionStatus?.isPremium || (subscriptionStatus?.dailyAiUsage || 0) < (subscriptionStatus?.dailyAiLimit || 3);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Brain className="w-8 h-8 text-teal-600" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                AI Features
              </h1>
            </div>
            {subscriptionStatus?.isPremium && (
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                <Crown className="w-3 h-3 mr-1" />
                Pro User
              </Badge>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Explore powerful AI tools to enhance your productivity and task management.
          </p>
          
          {!canUseAI && (
            <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <p className="text-orange-800 dark:text-orange-200 text-sm">
                You've reached your daily AI limit ({subscriptionStatus?.dailyAiUsage}/{subscriptionStatus?.dailyAiLimit}). 
                Upgrade to Pro for unlimited access.
              </p>
            </div>
          )}
        </div>

        {/* AI Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Natural Language Task Parser */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-purple-600" />
                Natural Language Task Parser
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Describe your task in plain English and let AI structure it for you.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="e.g., Call John tomorrow at 3pm about the project meeting and make sure to prepare the presentation slides beforehand"
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                className="min-h-[100px]"
                disabled={!canUseAI}
              />
              <Button 
                onClick={handleParseTask}
                disabled={parseTaskMutation.isPending || !canUseAI}
                className="w-full"
              >
                {parseTaskMutation.isPending ? 'Analyzing...' : 'Analyze Task'}
              </Button>
              
              {parseTaskMutation.data && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">AI Analysis Result:</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Title:</strong> {parseTaskMutation.data.analysis?.title}</p>
                    <p><strong>Priority:</strong> {parseTaskMutation.data.analysis?.priority}</p>
                    <p><strong>Category:</strong> {parseTaskMutation.data.analysis?.category}</p>
                    {parseTaskMutation.data.analysis?.description && (
                      <p><strong>Description:</strong> {parseTaskMutation.data.analysis.description}</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Task Refiner */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                AI Task Refiner
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get AI suggestions to improve and break down your tasks.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Enter your task"
                value={refineInput}
                onChange={(e) => setRefineInput(e.target.value)}
                disabled={!canUseAI}
              />
              <Input
                placeholder="What would you like to improve? (e.g., 'break this down into smaller steps')"
                value={refineQuery}
                onChange={(e) => setRefineQuery(e.target.value)}
                disabled={!canUseAI}
              />
              <Button 
                onClick={handleRefineTask}
                disabled={refineTaskMutation.isPending || !canUseAI}
                className="w-full"
              >
                {refineTaskMutation.isPending ? 'Refining...' : 'Refine Task'}
              </Button>
              
              {refineTaskMutation.data && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">AI Suggestions:</h4>
                  <div className="space-y-2 text-sm">
                    {refineTaskMutation.data.suggestions?.map((suggestion: string, index: number) => (
                      <p key={index}>• {suggestion}</p>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Productivity Insights */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Productivity Insights
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get AI-powered insights about your productivity patterns.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => fetchInsights()}
                disabled={!canUseAI}
                className="w-full"
              >
                Generate Insights
              </Button>
              
              {insightsData && (
                <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">Your Insights:</h4>
                  <div className="space-y-3 text-sm">
                    {insightsData.insights?.map((insight: any, index: number) => (
                      <div key={index} className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-purple-100 dark:border-purple-700">
                        <div className="flex items-start gap-2">
                          <Badge variant="outline" className="text-xs">
                            {insight.type?.replace('_', ' ') || 'insight'}
                          </Badge>
                        </div>
                        <h5 className="font-medium text-purple-900 dark:text-purple-100 mt-2">
                          {insight.title}
                        </h5>
                        <p className="text-gray-600 dark:text-gray-300 mt-1">
                          {insight.content}
                        </p>
                        {insight.confidence && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs text-gray-500">Confidence:</span>
                            <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full">
                              <div 
                                className="h-1.5 bg-purple-500 rounded-full"
                                style={{ width: `${insight.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">{Math.round(insight.confidence * 100)}%</span>
                          </div>
                        )}
                        {insight.actionable && (
                          <Badge variant="secondary" className="mt-2 text-xs">
                            Actionable
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Usage Stats */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-600" />
                AI Usage Statistics
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Track your AI feature usage and limits.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Daily AI Requests</span>
                  <span className="font-semibold">
                    {subscriptionStatus?.isPremium ? 'Unlimited' : `${subscriptionStatus?.dailyAiUsage || 0}/${subscriptionStatus?.dailyAiLimit || 3}`}
                  </span>
                </div>
                
                {!subscriptionStatus?.isPremium && (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-teal-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min(100, ((subscriptionStatus?.dailyAiUsage || 0) / (subscriptionStatus?.dailyAiLimit || 3)) * 100)}%` 
                      }}
                    />
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Plan Type</span>
                  <Badge variant={subscriptionStatus?.isPremium ? "default" : "secondary"}>
                    {subscriptionStatus?.isPremium ? 'Pro' : 'Free'}
                  </Badge>
                </div>
              </div>
              
              {!subscriptionStatus?.isPremium && (
                <Button className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Pro
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pro Features Teaser */}
        {!subscriptionStatus?.isPremium && (
          <Card className="border-2 border-gradient-to-r from-yellow-400 to-orange-500 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
            <CardContent className="p-6 text-center">
              <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Unlock More AI Features with Pro
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Get unlimited AI requests, advanced analytics, and personalized productivity insights for just $5/month.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="text-center">
                  <Target className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                  <p className="font-semibold">Unlimited AI</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">No daily limits</p>
                </div>
                <div className="text-center">
                  <Brain className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="font-semibold">Advanced Analysis</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Deeper insights</p>
                </div>
                <div className="text-center">
                  <Sparkles className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <p className="font-semibold">Personalized Quotes</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">AI motivation</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}