import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Lightbulb, X, Loader2, TrendingUp, Target, Calendar, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface ProductivityInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductivityInsightsModal({ isOpen, onClose }: ProductivityInsightsModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  const { toast } = useToast();

  const fetchInsights = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("GET", "/api/ai/productivity-insights");

      if (response.ok) {
        const data = await response.json();
        setInsights(data);
      } else {
        throw new Error('Failed to get productivity insights');
      }
    } catch (error) {
      console.error('Productivity insights error:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze productivity patterns. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchInsights();
    }
  }, [isOpen]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900';
    return 'bg-red-100 dark:bg-red-900';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Productivity Insights</DialogTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">AI analysis of your productivity patterns</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-amber-500" />
                <p className="text-gray-600 dark:text-gray-400">Analyzing your productivity patterns...</p>
              </div>
            </div>
          ) : insights ? (
            <div className="space-y-6">
              {/* Overall Score */}
              <Card className="border-l-4 border-l-amber-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-amber-500" />
                        Overall Productivity Score
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                        Based on your task completion and patterns
                      </p>
                    </div>
                    <div className={`text-3xl font-bold ${getScoreColor(insights.overallScore || 0)}`}>
                      {insights.overallScore || 0}%
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Key Metrics */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Target className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <h4 className="font-medium">Completion Rate</h4>
                    <p className="text-2xl font-bold text-blue-500">{insights.completionRate || 0}%</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <Calendar className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <h4 className="font-medium">Tasks Completed</h4>
                    <p className="text-2xl font-bold text-green-500">{insights.tasksCompleted || 0}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <BarChart3 className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                    <h4 className="font-medium">Average Daily Tasks</h4>
                    <p className="text-2xl font-bold text-purple-500">{insights.avgDailyTasks || 0}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Insights and Recommendations */}
              {insights.insights && insights.insights.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-amber-500" />
                      Key Insights
                    </h3>
                    <div className="space-y-3">
                      {insights.insights.map((insight: string, index: number) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                          <p className="text-sm">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              {insights.recommendations && insights.recommendations.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      Recommendations
                    </h3>
                    <div className="space-y-3">
                      {insights.recommendations.map((rec: string, index: number) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                          <p className="text-sm">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Category Performance */}
              {insights.categoryPerformance && Object.keys(insights.categoryPerformance).length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-purple-500" />
                      Performance by Category
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(insights.categoryPerformance).map(([category, data]: [string, any]) => (
                        <div key={category} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium capitalize">{category}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {data.completed} completed, {data.total} total
                            </p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBg(data.rate)} ${getScoreColor(data.rate)}`}>
                            {data.rate}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button
                onClick={fetchInsights}
                variant="outline"
                className="w-full"
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                Refresh Insights
              </Button>
            </div>
          ) : (
            <div className="text-center py-12">
              <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Data Available</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Complete some tasks to get productivity insights and recommendations.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}