import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useSubscription } from "@/hooks/use-subscription";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Clock, 
  Brain, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  Moon, 
  Sun, 
  Zap,
  Target,
  Calendar,
  Activity,
  Loader2
} from "lucide-react";

interface SmartTimingAnalysis {
  id: string;
  taskId: string;
  taskTitle: string;
  recommendation: string;
  confidence: number;
  optimalTime: string;
  reasoning: string;
  circadianScore: number;
  energyLevel: 'high' | 'medium' | 'low';
  taskType: string;
  estimatedDuration: number;
  createdAt: string;
}

interface TimingRecommendation {
  action: 'schedule' | 'defer' | 'break';
  task?: string;
  time?: string;
  reason: string;
  confidence: number;
}

export function EnhancedSmartTiming() {
  const { checkAiUsageLimit, incrementAiUsage } = useSubscription();
  const { toast } = useToast();
  const [selectedAnalysis, setSelectedAnalysis] = useState<SmartTimingAnalysis | null>(null);

  // Fetch existing analyses
  const { data: analyses = [], isLoading } = useQuery<SmartTimingAnalysis[]>({
    queryKey: ['/api/ai/smart-timing'],
    enabled: true,
  });

  // Generate new timing analysis
  const generateAnalysis = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/ai/smart-timing/generate');
      return await response.json();
    },
    onSuccess: async (data) => {
      // AI usage is already handled by the backend endpoint
      queryClient.invalidateQueries({ queryKey: ['/api/ai/smart-timing'] });
      toast({
        title: "Smart Timing Analysis Complete",
        description: `Generated ${data.analyses?.length || 0} timing recommendations.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: "Failed to generate timing analysis. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Apply timing recommendation
  const applyRecommendation = useMutation({
    mutationFn: async ({ taskId, action }: { taskId: string; action: 'accept' | 'deny' }) => {
      const response = await apiRequest('POST', '/api/ai/apply-timing-recommendation', {
        taskId,
        action
      });
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/today'] });
      toast({
        title: data.action === 'accept' ? "Recommendation Applied" : "Recommendation Dismissed",
        description: data.message,
      });
      setSelectedAnalysis(null);
    },
    onError: (error) => {
      toast({
        title: "Action Failed",
        description: "Failed to apply recommendation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateAnalysis = () => {
    if (!checkAiUsageLimit()) {
      toast({
        title: "Daily Limit Reached",
        description: "You've reached your AI usage limit. Upgrade for more requests!",
        variant: "destructive",
      });
      return;
    }
    
    generateAnalysis.mutate();
  };

  const getEnergyIcon = (level: string) => {
    switch (level) {
      case 'high': return <Zap className="w-4 h-4 text-green-600" />;
      case 'medium': return <Activity className="w-4 h-4 text-yellow-600" />;
      case 'low': return <Moon className="w-4 h-4 text-blue-600" />;
      default: return <Sun className="w-4 h-4 text-gray-600" />;
    }
  };

  const getEnergyColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-50 text-green-700 border-green-200';
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const formatTime = (timeString: string) => {
    try {
      return new Date(timeString).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeString;
    }
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg">
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
            <span className="text-gray-600 dark:text-gray-400">Loading timing analysis...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-teal-50 to-blue-50 dark:from-gray-800 dark:to-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-teal-100 dark:bg-teal-900 rounded-lg">
                <Brain className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                  Smart Timing Analysis
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  AI-powered productivity optimization based on circadian rhythms
                </p>
              </div>
            </div>
            
            <Button
              onClick={handleGenerateAnalysis}
              disabled={generateAnalysis.isPending || !checkAiUsageLimit()}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {generateAnalysis.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Generate Analysis
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Analysis Results */}
      {analyses.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Analysis Available
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Generate your first smart timing analysis to optimize your productivity
            </p>
            <Button
              onClick={handleGenerateAnalysis}
              disabled={generateAnalysis.isPending || !checkAiUsageLimit()}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              <Brain className="w-4 h-4 mr-2" />
              Start Analysis
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {analyses.map((analysis: SmartTimingAnalysis) => (
            <Card key={analysis.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {analysis.taskTitle}
                    </h3>
                    
                    <div className="flex items-center space-x-4 mb-3">
                      <Badge variant="outline" className={`${getEnergyColor(analysis.energyLevel)} border`}>
                        {getEnergyIcon(analysis.energyLevel)}
                        <span className="ml-1 capitalize">{analysis.energyLevel} Energy</span>
                      </Badge>
                      
                      <Badge variant="outline" className="text-xs">
                        <Target className="w-3 h-3 mr-1" />
                        {analysis.taskType}
                      </Badge>
                      
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="w-3 h-3 mr-1" />
                        {analysis.estimatedDuration}min
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {analysis.recommendation}
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Confidence</span>
                        <span className="font-medium">{analysis.confidence}%</span>
                      </div>
                      <Progress value={analysis.confidence} className="h-2" />
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Circadian Score</span>
                        <span className="font-medium">{analysis.circadianScore}/100</span>
                      </div>
                      <Progress value={analysis.circadianScore} className="h-2" />
                    </div>
                  </div>
                  
                  <div className="text-right ml-4">
                    <Badge variant="secondary" className="text-xs mb-2">
                      Optimal: {formatTime(analysis.optimalTime)}
                    </Badge>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-3">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>AI Reasoning:</strong> {analysis.reasoning}
                  </p>
                  
                  <div className="flex items-center space-x-3">
                    <Button
                      onClick={() => applyRecommendation.mutate({ taskId: analysis.taskId, action: 'accept' })}
                      disabled={applyRecommendation.isPending}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Apply Recommendation
                    </Button>
                    
                    <Button
                      onClick={() => applyRecommendation.mutate({ taskId: analysis.taskId, action: 'deny' })}
                      disabled={applyRecommendation.isPending}
                      variant="outline"
                      size="sm"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Dismiss
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}