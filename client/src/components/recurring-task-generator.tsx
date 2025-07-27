import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Sparkles, Calendar, TrendingUp, CheckCircle2, Edit3 } from 'lucide-react';
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
  nextScheduled?: string;
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

export function RecurringTaskGenerator() {
  const { toast } = useToast();

  // Get detected patterns
  const { data: patterns, isLoading } = useQuery({
    queryKey: ['/api/ai/recurring-patterns'],
    queryFn: async () => {
      // Mock implementation - in production would analyze task history
      return [
        {
          id: '1',
          taskName: 'Pay rent',
          detectedPattern: 'Monthly on 1st',
          confidence: 0.92,
          suggestedRule: 'FREQ=MONTHLY;BYMONTHDAY=1',
          lastOccurrences: ['2024-12-01', '2024-11-01', '2024-10-01'],
          nextScheduled: '2025-01-01',
          status: 'suggested',
        },
        {
          id: '2',
          taskName: 'Team meeting notes',
          detectedPattern: 'Weekly on Tuesdays',
          confidence: 0.87,
          suggestedRule: 'FREQ=WEEKLY;BYDAY=TU',
          lastOccurrences: ['2024-12-24', '2024-12-17', '2024-12-10'],
          nextScheduled: '2024-12-31',
          status: 'active',
        },
        {
          id: '3',
          taskName: 'Water plants',
          detectedPattern: 'Every 3 days',
          confidence: 0.73,
          suggestedRule: 'FREQ=DAILY;INTERVAL=3',
          lastOccurrences: ['2024-12-25', '2024-12-22', '2024-12-19'],
          nextScheduled: '2024-12-28',
          status: 'suggested',
        },
      ] as RecurringPattern[];
    },
    refetchInterval: 600000, // Refresh every 10 minutes
  });

  // Get suggested adjustments
  const { data: adjustments } = useQuery({
    queryKey: ['/api/ai/recurrence-adjustments'],
    queryFn: async () => {
      return [
        {
          id: '1',
          taskName: 'Pay rent',
          currentRule: 'Monthly on 1st',
          suggestedAdjustment: 'Monthly on 2nd',
          reason: 'Moved to 2nd day 3 times in last 6 months',
          skipCount: 3,
        },
        {
          id: '2',
          taskName: 'Grocery shopping',
          currentRule: 'Weekly on Saturdays',
          suggestedAdjustment: 'Weekly on Sundays',
          reason: 'Consistently rescheduled from Saturday to Sunday',
          skipCount: 4,
        },
      ] as RecurrenceAdjustment[];
    },
  });

  // Accept a recurring pattern
  const acceptPatternMutation = useMutation({
    mutationFn: async (patternId: string) => {
      return apiRequest(`/api/ai/accept-recurring-pattern/${patternId}`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      toast({
        title: "Recurring Task Created",
        description: "The task will now be automatically scheduled based on the detected pattern.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ai/recurring-patterns'] });
    },
  });

  // Apply adjustment
  const applyAdjustmentMutation = useMutation({
    mutationFn: async (adjustmentId: string) => {
      return apiRequest(`/api/ai/apply-recurrence-adjustment/${adjustmentId}`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      toast({
        title: "Recurrence Updated",
        description: "The recurring task schedule has been adjusted based on your behavior.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ai/recurrence-adjustments'] });
    },
  });

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-500 bg-green-50 dark:bg-green-950';
    if (confidence >= 0.6) return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950';
    return 'text-red-500 bg-red-50 dark:bg-red-950';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'tuning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-primary" />
          Recurring Task Generator & Tuner
          <Badge variant="secondary" className="ml-2">
            <Sparkles className="h-3 w-3 mr-1" />
            Pattern Analysis
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Detected Patterns */}
        {patterns && patterns.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Detected Recurring Patterns
            </h4>
            
            <div className="space-y-3">
              {patterns.map((pattern) => (
                <div key={pattern.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="font-medium">{pattern.taskName}</h5>
                        <Badge className={getStatusColor(pattern.status)}>
                          {pattern.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-3 w-3" />
                          <span>Pattern: {pattern.detectedPattern}</span>
                          <Badge className={getConfidenceColor(pattern.confidence)}>
                            {Math.round(pattern.confidence * 100)}% confidence
                          </Badge>
                        </div>
                        
                        {pattern.nextScheduled && (
                          <div className="text-sm text-muted-foreground">
                            Next scheduled: {new Date(pattern.nextScheduled).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">
                      <strong>Last occurrences:</strong> {pattern.lastOccurrences.map(date => 
                        new Date(date).toLocaleDateString()).join(', ')}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    {pattern.status === 'suggested' && (
                      <Button
                        size="sm"
                        onClick={() => acceptPatternMutation.mutate(pattern.id)}
                        disabled={acceptPatternMutation.isPending}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Accept & Create Recurring Task
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      <Edit3 className="h-3 w-3 mr-1" />
                      Customize Pattern
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
              <Edit3 className="h-4 w-4" />
              Suggested Schedule Adjustments
            </h4>
            
            <div className="space-y-3">
              {adjustments.map((adjustment) => (
                <div key={adjustment.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium">{adjustment.taskName}</h5>
                      <div className="mt-2 space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Current:</span>
                          <span>{adjustment.currentRule}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Suggested:</span>
                          <span className="font-medium text-primary">{adjustment.suggestedAdjustment}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {adjustment.skipCount} reschedules
                    </Badge>
                  </div>
                  
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                    <p className="text-sm">
                      <strong>Reason:</strong> {adjustment.reason}
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
                      Keep Current Schedule
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <RefreshCw className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{patterns?.filter(p => p.status === 'active').length || 0}</div>
            <div className="text-xs text-muted-foreground">Active Patterns</div>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">87%</div>
            <div className="text-xs text-muted-foreground">Pattern Accuracy</div>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <Calendar className="h-6 w-6 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">42</div>
            <div className="text-xs text-muted-foreground">Auto-Generated Tasks</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}