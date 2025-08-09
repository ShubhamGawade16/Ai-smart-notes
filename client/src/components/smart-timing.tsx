import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  Brain, 
  Zap,
  Sun,
  Moon,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Timer,
  Target
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/use-subscription";
import type { Task } from "@shared/schema";

interface ReadinessAnalysis {
  taskId: string;
  taskTitle: string;
  taskType: string;
  readinessScore: number;
  currentOptimal: boolean;
  recommendations: {
    bestTimeSlot: string;
    reason: string;
    energyLevel: string;
    distractionLevel: string;
  };
  circadianFactors: {
    timeOfDay: string;
    energyPeak: boolean;
    focusWindow: boolean;
  };
}

interface TimingAnalysisResponse {
  analyses: ReadinessAnalysis[];
}

export function SmartTiming() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  const { canUseAI, checkAiUsageLimit } = useSubscription();

  // Fetch user's tasks for analysis
  const { data: tasksResponse } = useQuery({
    queryKey: ['/api/tasks'],
  });

  // Smart timing analysis query
  const { data: timingAnalysis, refetch: analyzeReadiness, isLoading: isLoadingAnalysis } = useQuery<TimingAnalysisResponse>({
    queryKey: ['/api/ai/smart-timing'],
    enabled: false,
  });

  const tasks: Task[] = (tasksResponse as any)?.tasks || [];
  const incompleteTasks = tasks.filter(task => !task.completed);

  const handleAnalyzeReadiness = async () => {
    if (!checkAiUsageLimit()) {
      toast({
        title: "AI Usage Limit Reached",
        description: "Upgrade to Pro for unlimited AI analysis",
        variant: "destructive",
      });
      return;
    }

    // AI usage limit checking and increment is handled by the backend endpoint

    setIsAnalyzing(true);
    try {
      await analyzeReadiness();
      toast({
        title: "Smart Timing Analysis Complete",
        description: "Your personalized timing recommendations are ready!",
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Please try again or check your internet connection.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getReadinessColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getTaskTypeIcon = (taskType: string) => {
    switch (taskType) {
      case 'creative':
        return <Brain className="w-4 h-4" />;
      case 'analytical':
        return <Target className="w-4 h-4" />;
      case 'deep_work':
        return <Zap className="w-4 h-4" />;
      case 'routine':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getCurrentTimeSlot = () => {
    const hour = new Date().getHours();
    if (hour < 6) return "Early Morning";
    if (hour < 9) return "Morning";
    if (hour < 12) return "Late Morning";  
    if (hour < 14) return "Early Afternoon";
    if (hour < 17) return "Afternoon";
    if (hour < 19) return "Early Evening";
    if (hour < 22) return "Evening";
    return "Night";
  };

  const getCircadianInsight = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour <= 10) {
      return {
        icon: <Sun className="w-5 h-5 text-yellow-500" />,
        title: "Peak Morning Energy",
        description: "Ideal for creative and strategic work",
        color: "border-yellow-200 bg-yellow-50"
      };
    }
    if (hour >= 14 && hour <= 16) {
      return {
        icon: <TrendingUp className="w-5 h-5 text-blue-500" />,
        title: "Afternoon Focus",
        description: "Good for analytical and routine tasks",
        color: "border-blue-200 bg-blue-50"
      };
    }
    if (hour >= 19 && hour <= 22) {
      return {
        icon: <Moon className="w-5 h-5 text-purple-500" />,
        title: "Evening Wind-down",
        description: "Best for planning and light tasks",
        color: "border-purple-200 bg-purple-50"
      };
    }
    return {
      icon: <AlertCircle className="w-5 h-5 text-gray-500" />,
      title: "Low Energy Period",
      description: "Consider taking a break or doing light tasks",
      color: "border-gray-200 bg-gray-50"
    };
  };

  const circadianInsight = getCircadianInsight();

  return (
    <div className="space-y-6">
      {/* Current Time Analysis */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-600" />
            Current Time Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg border ${circadianInsight.color}`}>
              <div className="flex items-center gap-3 mb-2">
                {circadianInsight.icon}
                <h3 className="font-semibold text-gray-900">{circadianInsight.title}</h3>
              </div>
              <p className="text-sm text-gray-600">{circadianInsight.description}</p>
              <div className="mt-3 text-xs text-gray-500">
                Current time slot: {getCurrentTimeSlot()}
              </div>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Timer className="w-4 h-4" />
                Quick Stats
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Tasks:</span>
                  <span className="font-medium">{incompleteTasks.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time Zone:</span>
                  <span className="font-medium">{Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Local Time:</span>
                  <span className="font-medium">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Smart Analysis Button */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            Smart Timing Analysis
          </CardTitle>
          <p className="text-sm text-gray-600">
            Get AI-powered recommendations for optimal task timing based on your circadian rhythms and task types.
          </p>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleAnalyzeReadiness}
            disabled={isAnalyzing || isLoadingAnalysis || incompleteTasks.length === 0}
            className="w-full mb-4"
          >
            {isAnalyzing || isLoadingAnalysis ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analyzing Your Tasks...
              </div>
            ) : (
              'Analyze Task Readiness'
            )}
          </Button>

          {incompleteTasks.length === 0 && (
            <p className="text-center text-gray-500 text-sm">
              Add some tasks to get personalized timing recommendations
            </p>
          )}

          {/* Loading State */}
          {(isAnalyzing || isLoadingAnalysis) && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Calculating Task Readiness
              </h3>
              <p className="text-sm text-gray-600 text-center max-w-sm">
                Analyzing circadian rhythms, task types, and optimal timing patterns...
              </p>
            </div>
          )}

          {/* Results */}
          {!isAnalyzing && !isLoadingAnalysis && timingAnalysis && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 text-lg">Task Readiness Scores</h4>
              <div className="space-y-3">
                {timingAnalysis.analyses?.map((analysis: ReadinessAnalysis, index: number) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getTaskTypeIcon(analysis.taskType)}
                        <h5 className="font-medium text-gray-900">{analysis.taskTitle}</h5>
                        <Badge variant="outline" className="text-xs capitalize">
                          {analysis.taskType.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getReadinessColor(analysis.readinessScore)}`}>
                        {analysis.readinessScore}%
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Readiness Score</span>
                        <span className="font-medium">{analysis.readinessScore}/100</span>
                      </div>
                      <Progress value={analysis.readinessScore} className="h-2" />
                    </div>

                    {analysis.currentOptimal ? (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 text-green-800">
                          <CheckCircle className="w-4 h-4" />
                          <span className="font-medium">Perfect time to start!</span>
                        </div>
                        <p className="text-sm text-green-700 mt-1">
                          {analysis.recommendations.reason}
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 text-blue-800 mb-1">
                          <Calendar className="w-4 h-4" />
                          <span className="font-medium">Better time: {analysis.recommendations.bestTimeSlot}</span>
                        </div>
                        <p className="text-sm text-blue-700">
                          {analysis.recommendations.reason}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}