import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Zap, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface ScheduleOptimization {
  optimizedSchedule: Array<{
    taskId: string;
    title: string;
    startTime: string;
    endTime: string;
    priority: string;
    estimatedMinutes: number;
    reasoning: string;
  }>;
  insights: {
    totalProductiveHours: number;
    bufferTimeAdded: number;
    conflictsResolved: number;
    recommendations: string[];
  };
}

interface AutoSchedulerProps {
  userTier?: string;
}

export default function AutoScheduler({ userTier = 'free' }: AutoSchedulerProps) {
  const [lastOptimization, setLastOptimization] = useState<ScheduleOptimization | null>(null);
  const { toast } = useToast();

  const { data: tasks } = useQuery({
    queryKey: ['/api/tasks'],
  });

  const optimizeScheduleMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/ai/optimize-schedule', {
        method: 'POST',
      });
    },
    onSuccess: (data) => {
      setLastOptimization(data);
      toast({
        title: "Schedule optimized",
        description: "Your tasks have been automatically organized for maximum productivity.",
      });
    },
    onError: (error) => {
      toast({
        title: "Optimization failed",
        description: "Unable to optimize schedule. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleOptimizeSchedule = () => {
    optimizeScheduleMutation.mutate();
  };

  const canUseFeature = ['basic_pro', 'advanced_pro', 'premium_pro'].includes(userTier);

  if (!canUseFeature) {
    return (
      <Card className="w-full border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            Auto-Schedule to Calendar
            <Badge variant="outline">Basic Pro Required</Badge>
          </CardTitle>
          <CardDescription>
            Transform scattered tasks into a perfectly time-blocked calendar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              One tap turns your task list into an optimized schedule that considers deadlines, task effort, meetings, and your energy patterns.
            </p>
            <div className="space-y-2 text-sm text-left max-w-md mx-auto mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Automatic conflict resolution</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Buffer time insertion</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Energy-based task matching</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Calendar integration</span>
              </div>
            </div>
            <Button variant="outline">Upgrade to Basic Pro</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-green-500" />
          Auto-Schedule to Calendar
          <Badge variant="secondary">Basic Pro</Badge>
        </CardTitle>
        <CardDescription>
          AI-powered time blocking that optimizes your entire day
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Tasks Summary */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Pending Tasks</span>
            <Badge variant="outline">
              {tasks?.tasks?.filter((t: any) => !t.completed).length || 0} tasks
            </Badge>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Ready to be scheduled with AI optimization
          </p>
        </div>

        {/* Optimize Button */}
        <Button 
          onClick={handleOptimizeSchedule}
          disabled={optimizeScheduleMutation.isPending || !tasks?.tasks?.length}
          className="w-full"
          size="lg"
        >
          {optimizeScheduleMutation.isPending ? (
            <>
              <Zap className="h-4 w-4 mr-2 animate-pulse" />
              Optimizing Schedule...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Auto-Schedule My Day
            </>
          )}
        </Button>

        {/* Optimization Results */}
        {lastOptimization && (
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Optimized Schedule</h4>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-1" />
                Add to Calendar
              </Button>
            </div>

            {/* Schedule Timeline */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {lastOptimization.optimizedSchedule.map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  <div className="flex flex-col items-center">
                    <div className="text-xs font-medium text-gray-500">
                      {item.startTime}
                    </div>
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 my-1"></div>
                    <div className="text-xs font-medium text-gray-500">
                      {item.endTime}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-medium truncate">{item.title}</h5>
                      <Badge 
                        variant={
                          item.priority === 'high' ? 'destructive' :
                          item.priority === 'medium' ? 'default' : 'secondary'
                        }
                        className="text-xs"
                      >
                        {item.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {item.reasoning}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {item.estimatedMinutes}m
                  </div>
                </div>
              ))}
            </div>

            {/* Optimization Insights */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {lastOptimization.insights.totalProductiveHours}h
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Productive Time
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {lastOptimization.insights.bufferTimeAdded}m
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Buffer Added
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                  {lastOptimization.insights.conflictsResolved}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Conflicts Fixed
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  AI
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Optimized
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {lastOptimization.insights.recommendations.length > 0 && (
              <div className="space-y-2">
                <h5 className="font-medium text-sm">AI Recommendations:</h5>
                <div className="space-y-1">
                  {lastOptimization.insights.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <AlertCircle className="h-3 w-3 mt-1 text-blue-500 flex-shrink-0" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {userTier === 'basic_pro' && (
          <div className="text-xs text-center text-gray-500 p-2 bg-gray-50 dark:bg-gray-800/50 rounded">
            Upgrade to Advanced Pro for calendar integration and real-time optimization
          </div>
        )}
      </CardContent>
    </Card>
  );
}