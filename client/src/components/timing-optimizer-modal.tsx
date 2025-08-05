import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, X, Loader2, Calendar, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface TimingOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TimingOptimizerModal({ isOpen, onClose }: TimingOptimizerModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [timingData, setTimingData] = useState<any>(null);
  const { toast } = useToast();

  const fetchTimingAnalysis = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("GET", "/api/ai/smart-timing");

      if (response.ok) {
        const data = await response.json();
        setTimingData(data);
      } else {
        throw new Error('Failed to get timing analysis');
      }
    } catch (error) {
      console.error('Timing optimizer error:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze task timing. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTimingAnalysis();
    }
  }, [isOpen]);

  const getReadinessColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300';
    return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Timing Optimizer</DialogTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">AI-powered optimal timing recommendations for your tasks</p>
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
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-green-500" />
                <p className="text-gray-600 dark:text-gray-400">Analyzing optimal timing for your tasks...</p>
              </div>
            </div>
          ) : timingData?.analyses?.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold">Task Readiness Analysis</h3>
              </div>

              {timingData.analyses.map((analysis: any, index: number) => (
                <Card key={index} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-lg">{analysis.taskTitle}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Task Type: {analysis.taskType || 'General'}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getReadinessColor(analysis.readinessScore)}`}>
                        {analysis.readinessScore}% Ready
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Recommendations
                          </h5>
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                            <p className="text-sm font-medium">Best Time: {analysis.recommendations?.bestTimeSlot}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {analysis.recommendations?.reason}
                            </p>
                            <div className="flex gap-2 mt-2">
                              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                                Energy: {analysis.recommendations?.energyLevel}
                              </span>
                              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs">
                                Focus: {analysis.recommendations?.distractionLevel}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <h5 className="font-medium text-sm mb-2">Circadian Factors</h5>
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm">Time of Day:</span>
                              <span className="text-sm font-medium capitalize">{analysis.circadianFactors?.timeOfDay}</span>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm">Energy Peak:</span>
                              <span className={`text-sm font-medium ${analysis.circadianFactors?.energyPeak ? 'text-green-600' : 'text-gray-500'}`}>
                                {analysis.circadianFactors?.energyPeak ? 'Yes' : 'No'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Focus Window:</span>
                              <span className={`text-sm font-medium ${analysis.circadianFactors?.focusWindow ? 'text-green-600' : 'text-gray-500'}`}>
                                {analysis.circadianFactors?.focusWindow ? 'Yes' : 'No'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {analysis.currentOptimal && (
                      <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                        <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                          ✨ This is an optimal time to work on this task!
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              <Button
                onClick={fetchTimingAnalysis}
                variant="outline"
                className="w-full"
              >
                <Clock className="w-4 h-4 mr-2" />
                Refresh Analysis
              </Button>
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Tasks to Analyze</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Add some tasks to your list to get timing optimization recommendations.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}