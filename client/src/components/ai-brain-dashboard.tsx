import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Sparkles, 
  Target, 
  TrendingUp, 
  Zap, 
  Clock,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export function AIBrainDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [breakdownInput, setBreakdownInput] = useState('');
  const [segregationQuery, setSegregationQuery] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // AI Brain Status
  const { data: brainStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/ai-brain/status'],
    refetchInterval: 30000,
  });

  // Advanced Analysis
  const { data: analysis, isLoading: analysisLoading } = useQuery({
    queryKey: ['/api/ai-brain/advanced-analysis'],
    refetchInterval: 60000,
  });

  // Continuous Optimization
  const { data: optimization, isLoading: optimizationLoading } = useQuery({
    queryKey: ['/api/ai-brain/optimize'],
    refetchInterval: 45000,
  });

  // Smart Segregation Mutation
  const segregationMutation = useMutation({
    mutationFn: async (query: string) => {
      return await apiRequest('/api/ai-brain/smart-segregation', 'POST', { userQuery: query });
    },
    onSuccess: () => {
      toast({
        title: "Smart Segregation Complete",
        description: "AI has analyzed and organized your tasks optimally.",
      });
      setSegregationQuery('');
    },
    onError: () => {
      toast({
        title: "Analysis Failed", 
        description: "Unable to perform smart segregation. Please try again.",
        variant: "destructive",
      });
    }
  });

  // AI Breakdown Mutation
  const breakdownMutation = useMutation({
    mutationFn: async (taskDescription: string) => {
      return await apiRequest('/api/ai-brain/breakdown', 'POST', { taskDescription });
    },
    onSuccess: () => {
      toast({
        title: "Task Breakdown Complete",
        description: "AI has broken down your complex task into manageable steps.",
      });
      setBreakdownInput('');
    },
    onError: () => {
      toast({
        title: "Breakdown Failed",
        description: "Unable to break down task. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSegregation = () => {
    if (segregationQuery.trim()) {
      segregationMutation.mutate(segregationQuery);
    }
  };

  const handleBreakdown = () => {
    if (breakdownInput.trim()) {
      breakdownMutation.mutate(breakdownInput);
    }
  };

  if (statusLoading) {
    return (
      <div className="w-full space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-purple-500" />
              AI Brain System
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = (brainStatus as any) || {};
  const analysisData = (analysis as any)?.analysis || {};
  const optimizationData = (optimization as any)?.optimization || {};

  return (
    <div className="w-full space-y-6">
      {/* AI Brain Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Brain className="h-8 w-8 text-purple-600" />
            <div>
              <h2 className="text-2xl font-bold">AI Brain Control Center</h2>
              <p className="text-sm text-muted-foreground">
                GPT-4o Mini controlling your entire productivity experience
              </p>
            </div>
            <Badge variant="secondary" className="ml-auto">
              {(brainStatus as any)?.model || 'gpt-4o-mini'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {(brainStatus as any)?.stats?.totalTasks || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {(brainStatus as any)?.stats?.completionRate || 0}%
              </div>
              <div className="text-sm text-muted-foreground">Completion Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {analysisData?.productivityScore || 0}
              </div>
              <div className="text-sm text-muted-foreground">Productivity Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {analysisData?.insights?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">AI Insights</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Features Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="segregation">Smart Segregation</TabsTrigger>
          <TabsTrigger value="analysis">Advanced Analysis</TabsTrigger>
          <TabsTrigger value="breakdown">AI Breakdown</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Immediate Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Immediate AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {optimizationLoading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {optimizationData?.immediateActions?.map((action: string, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                      <ArrowRight className="h-4 w-4 text-yellow-600" />
                      <span>{action}</span>
                    </div>
                  )) || (
                    <div className="text-center py-4 text-muted-foreground">
                      No immediate actions available
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Adaptive Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                AI Adaptive Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              {optimizationLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-blue-600">Right Now</h4>
                    <p className="text-sm">{optimizationData?.adaptiveSchedule?.now || 'Focus on your current task'}</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-green-600">Next 2 Hours</h4>
                    <div className="text-sm space-y-1">
                      {optimizationData?.adaptiveSchedule?.next2Hours?.map((task: string, index: number) => (
                        <div key={index}>• {task}</div>
                      )) || <div>No upcoming tasks scheduled</div>}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Smart Segregation Tab */}
        <TabsContent value="segregation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                Smart Task Segregation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Ask AI to organize your tasks:</label>
                <Input
                  placeholder="e.g., 'Organize by urgency and energy level' or 'Group by project'"
                  value={segregationQuery}
                  onChange={(e) => setSegregationQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSegregation()}
                />
              </div>
              <Button 
                onClick={handleSegregation}
                disabled={!segregationQuery.trim() || segregationMutation.isPending}
                className="w-full"
              >
                {segregationMutation.isPending ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    AI is organizing tasks...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Run Smart Segregation
                  </>
                )}
              </Button>
              
              {segregationMutation.data && (
                <div className="mt-6 space-y-4">
                  <h4 className="font-semibold">AI Segregation Results:</h4>
                  {segregationMutation.data.segregation?.categories?.map((category: any, index: number) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">{category.name}</h5>
                        <Badge variant={category.priority === 'urgent' ? 'destructive' : 'secondary'}>
                          {category.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {category.tasks.length} tasks • {category.estimatedTime} minutes
                      </p>
                      <div className="text-sm">
                        {category.suggestions?.map((suggestion: string, i: number) => (
                          <div key={i}>• {suggestion}</div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Productivity Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  Productivity Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysisLoading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-8 bg-muted rounded w-2/3"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Current Score</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {analysisData?.productivityScore || 0}
                        </span>
                      </div>
                      <Progress value={analysisData?.productivityScore || 0} className="h-2" />
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Predictions</h4>
                      <div className="text-sm space-y-1">
                        <div>Next Week: {analysisData?.predictions?.nextWeekProductivity || 0}%</div>
                        <div className="text-orange-600">
                          Risks: {analysisData?.predictions?.riskAreas?.join(', ') || 'None identified'}
                        </div>
                        <div className="text-green-600">
                          Opportunities: {analysisData?.predictions?.opportunities?.join(', ') || 'None identified'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysisLoading ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {analysisData?.insights?.slice(0, 3).map((insight: any, index: number) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {insight.type}
                          </Badge>
                          <Badge variant={insight.impact === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                            {insight.impact} impact
                          </Badge>
                        </div>
                        <h5 className="font-medium text-sm">{insight.title}</h5>
                        <p className="text-xs text-muted-foreground">{insight.content}</p>
                      </div>
                    )) || (
                      <div className="text-center py-4 text-muted-foreground">
                        Complete more tasks to get AI insights
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Breakdown Tab */}
        <TabsContent value="breakdown" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                AI Task Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Describe a complex task to break down:</label>
                <Textarea
                  placeholder="e.g., 'Plan and execute a comprehensive marketing campaign for our new product launch'"
                  value={breakdownInput}
                  onChange={(e) => setBreakdownInput(e.target.value)}
                  rows={3}
                />
              </div>
              <Button 
                onClick={handleBreakdown}
                disabled={!breakdownInput.trim() || breakdownMutation.isPending}
                className="w-full"
              >
                {breakdownMutation.isPending ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    AI is breaking down task...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Break Down with AI
                  </>
                )}
              </Button>

              {breakdownMutation.data && (
                <div className="mt-6 space-y-4">
                  <h4 className="font-semibold">AI Breakdown Results:</h4>
                  <div className="space-y-3">
                    {breakdownMutation.data.breakdown?.breakdown?.map((subtask: any, index: number) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium">{subtask.title}</h5>
                          <div className="flex gap-2">
                            <Badge variant="secondary">{subtask.estimatedTime}m</Badge>
                            <Badge variant={subtask.priority === 'high' ? 'destructive' : 'secondary'}>
                              {subtask.priority}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{subtask.description}</p>
                        <div className="text-xs text-muted-foreground">
                          Tags: {subtask.tags?.join(', ') || 'None'}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}