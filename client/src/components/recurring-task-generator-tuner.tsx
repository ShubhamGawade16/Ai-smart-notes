import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, Calendar, TrendingUp, Settings, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface RecurringPattern {
  id: string;
  taskName: string;
  detectedPattern: string;
  confidence: number;
  suggestedRule: string;
  lastOccurrences: string[];
  status: 'suggested' | 'active' | 'tuning';
}

interface RecurrenceAdjustment {
  id: string;
  taskName: string;
  currentRule: string;
  suggestedAdjustment: string;
  reason: string;
  skipCount: number;
}

export function RecurringTaskGeneratorTuner() {
  const { toast } = useToast();

  // Get detected recurring patterns
  const { data: patterns, isLoading: patternsLoading } = useQuery({
    queryKey: ['/api/ai/recurring-patterns'],
    queryFn: async () => {
      const response = await apiRequest('/api/ai/recurring-patterns');
      return response as RecurringPattern[];
    },
    refetchInterval: 600000, // Check every 10 minutes
  });

  // Get suggested adjustments
  const { data: adjustments } = useQuery({
    queryKey: ['/api/ai/recurrence-adjustments'],
    queryFn: async () => {
      const response = await apiRequest('/api/ai/recurrence-adjustments');
      return response as RecurrenceAdjustment[];
    },
  });

  // Create recurring task
  const createRecurringMutation = useMutation({
    mutationFn: async ({ patternId, rule }: { patternId: string; rule: string }) => {
      return apiRequest('/api/tasks/recurring', {
        method: 'POST',
        body: JSON.stringify({ patternId, rule }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Recurring Task Created",
        description: "AI has set up automatic task generation based on your pattern.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ai/recurring-patterns'] });
    },
  });

  // Apply adjustment
  const applyAdjustmentMutation = useMutation({
    mutationFn: async (adjustmentId: string) => {
      return apiRequest(`/api/ai/recurrence-adjustments/${adjustmentId}/apply`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      toast({
        title: "Recurrence Adjusted",
        description: "Your recurring task schedule has been updated based on your behavior.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ai/recurrence-adjustments'] });
    },
  });

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900';
    return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900';
  };

  const formatPattern = (pattern: string) => {
    return pattern.replace(/FREQ=(\w+);?/g, (match, freq) => {
      return freq.toLowerCase();
    }).replace(/BYDAY=(\w+)/g, (match, day) => {
      const days = { MO: 'Monday', TU: 'Tuesday', WE: 'Wednesday', TH: 'Thursday', FR: 'Friday', SA: 'Saturday', SU: 'Sunday' };
      return `on ${days[day as keyof typeof days] || day}`;
    });
  };

  if (patternsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Analyzing Task Patterns...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-muted rounded"></div>
            <div className="h-16 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-primary" />
          Recurring Task Generator & Tuner
          <Badge variant="secondary" className="ml-2">
            <Zap className="h-3 w-3 mr-1" />
            Pattern Detection
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          AI discovers recurring patterns in your tasks and automatically suggests recurring schedules
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Detected Patterns */}
        {patterns && patterns.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Detected Recurring Patterns
            </h4>
            
            <div className="space-y-3">
              {patterns.map((pattern) => (
                <div key={pattern.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium mb-1">"{pattern.taskName}"</h5>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getConfidenceColor(pattern.confidence)}>
                          {Math.round(pattern.confidence * 100)}% confidence
                        </Badge>
                        <Badge variant="outline">
                          {pattern.detectedPattern}
                        </Badge>
                      </div>
                      <Progress value={pattern.confidence * 100} className="h-2 mb-2" />
                    </div>
                  </div>
                  
                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <p className="text-sm mb-2">
                      <strong>Pattern Analysis:</strong> Found {pattern.lastOccurrences.length} occurrences
                    </p>
                    <div className="text-xs text-muted-foreground">
                      Recent completions: {pattern.lastOccurrences.join(', ')}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm" 
                      onClick={() => createRecurringMutation.mutate({ 
                        patternId: pattern.id, 
                        rule: pattern.suggestedRule 
                      })}
                      disabled={createRecurringMutation.isPending}
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      Set Up Recurring
                    </Button>
                    <Button size="sm" variant="outline">
                      <Settings className="h-3 w-3 mr-1" />
                      Customize Schedule
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggested Adjustments */}
        {adjustments && adjustments.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              Suggested Schedule Adjustments
            </h4>
            
            <div className="space-y-3">
              {adjustments.map((adjustment) => (
                <div key={adjustment.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium mb-1">"{adjustment.taskName}"</h5>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">
                          Current: {adjustment.currentRule}
                        </Badge>
                        <span className="text-sm text-muted-foreground">→</span>
                        <Badge variant="secondary">
                          Suggested: {adjustment.suggestedAdjustment}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                    <p className="text-sm">
                      <strong>Why adjust?</strong> {adjustment.reason}
                    </p>
                    <p className="text-sm mt-1">
                      <strong>Evidence:</strong> Skipped/moved {adjustment.skipCount} times in recent weeks
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm" 
                      onClick={() => applyAdjustmentMutation.mutate(adjustment.id)}
                      disabled={applyAdjustmentMutation.isPending}
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Apply Adjustment
                    </Button>
                    <Button size="sm" variant="outline">
                      Keep Current
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Patterns Found */}
        {(!patterns || patterns.length === 0) && (!adjustments || adjustments.length === 0) && (
          <div className="text-center py-8 space-y-4">
            <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <p className="text-muted-foreground">No recurring patterns detected yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Complete similar tasks a few times and AI will automatically detect patterns
              </p>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <RefreshCw className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{patterns?.length || 0}</div>
            <div className="text-xs text-muted-foreground">Patterns Found</div>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <Calendar className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">3</div>
            <div className="text-xs text-muted-foreground">Active Recurring</div>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">85%</div>
            <div className="text-xs text-muted-foreground">Schedule Accuracy</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}