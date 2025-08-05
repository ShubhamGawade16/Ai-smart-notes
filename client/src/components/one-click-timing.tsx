import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  Check, 
  X, 
  Calendar,
  Zap,
  AlertCircle,
  TrendingUp,
  Target
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { announceToScreenReader } from "@/components/accessibility-improvements";

interface TimingRecommendation {
  taskId: string;
  taskTitle: string;
  currentTime: string;
  recommendedTime: string;
  reason: string;
  energyLevel: "high" | "medium" | "low";
  readinessScore: number;
  estimatedDuration: number;
}

interface OneClickTimingProps {
  recommendations: TimingRecommendation[];
  onRecommendationApplied?: (taskId: string, accepted: boolean) => void;
}

export function OneClickTiming({ recommendations, onRecommendationApplied }: OneClickTimingProps) {
  const [processingActions, setProcessingActions] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const applyTimingMutation = useMutation({
    mutationFn: async ({ taskId, action }: { taskId: string; action: 'accept' | 'deny' }) => {
      const response = await apiRequest('POST', '/api/ai/apply-timing-recommendation', {
        taskId,
        action
      });
      return await response.json();
    },
    onSuccess: (data, variables) => {
      const recommendation = recommendations.find(r => r.taskId === variables.taskId);
      
      if (variables.action === 'accept') {
        toast({
          title: "Timing Applied",
          description: `${recommendation?.taskTitle} scheduled for optimal time`,
        });
        announceToScreenReader(`Task scheduled for ${recommendation?.recommendedTime}`);
      } else {
        toast({
          title: "Recommendation Dismissed",
          description: "Task timing left unchanged",
        });
      }
      
      // Refresh tasks data
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ai/smart-timing'] });
      
      onRecommendationApplied?.(variables.taskId, variables.action === 'accept');
    },
    onError: (error: Error) => {
      toast({
        title: "Action Failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: (data, error, variables) => {
      setProcessingActions(prev => {
        const next = new Set(prev);
        next.delete(variables.taskId);
        return next;
      });
    }
  });

  const handleAction = async (taskId: string, action: 'accept' | 'deny') => {
    setProcessingActions(prev => new Set(prev).add(taskId));
    applyTimingMutation.mutate({ taskId, action });
  };

  const getEnergyColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getReadinessColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Clock className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Timing Recommendations
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            Complete some tasks or add new ones to get AI-powered timing recommendations.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-teal-600" />
          Smart Timing Recommendations
        </h3>
        <Badge variant="secondary" className="text-xs">
          {recommendations.length} suggestions
        </Badge>
      </div>

      <div className="grid gap-4">
        {recommendations.map((rec) => {
          const isProcessing = processingActions.has(rec.taskId);
          
          return (
            <Card key={rec.taskId} className="border-l-4 border-l-teal-500">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base font-medium text-gray-900 dark:text-white">
                      {rec.taskTitle}
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {rec.reason}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getEnergyColor(rec.energyLevel)}>
                      {rec.energyLevel} energy
                    </Badge>
                    <div className={`text-sm font-medium ${getReadinessColor(rec.readinessScore)}`}>
                      {rec.readinessScore}% ready
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Current vs Recommended Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Current</div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {rec.currentTime}
                    </div>
                  </div>
                  
                  <div className="text-center p-3 bg-teal-50 dark:bg-teal-950/30 rounded-lg border border-teal-200 dark:border-teal-800">
                    <div className="text-xs text-teal-600 dark:text-teal-400 mb-1">Recommended</div>
                    <div className="font-medium text-teal-900 dark:text-teal-100">
                      {rec.recommendedTime}
                    </div>
                  </div>
                </div>

                {/* Estimated Duration */}
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>Estimated: {rec.estimatedDuration} minutes</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => handleAction(rec.taskId, 'accept')}
                    disabled={isProcessing}
                    className="flex-1 bg-teal-600 hover:bg-teal-700"
                  >
                    {isProcessing ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    Accept & Schedule
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAction(rec.taskId, 'deny')}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Dismiss
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-teal-50 to-blue-50 dark:from-teal-950/30 dark:to-blue-950/30 border-teal-200 dark:border-teal-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-teal-600" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Bulk Actions
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Apply all recommendations at once
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  recommendations.forEach(rec => handleAction(rec.taskId, 'accept'));
                }}
                disabled={processingActions.size > 0}
              >
                Accept All
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  recommendations.forEach(rec => handleAction(rec.taskId, 'deny'));
                }}
                disabled={processingActions.size > 0}
              >
                Dismiss All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}