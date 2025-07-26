import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap, AlertTriangle, Lightbulb } from "lucide-react";
import { aiApi } from "@/lib/api";

export function AIInsights() {
  const { data: bottlenecks, isLoading } = useQuery({
    queryKey: ['/api/ai/bottlenecks'],
    queryFn: aiApi.getBottlenecks,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'productivity':
        return <Zap className="w-3 h-3 text-primary" />;
      case 'bottleneck':
        return <AlertTriangle className="w-3 h-3 text-warning" />;
      default:
        return <Lightbulb className="w-3 h-3 text-accent" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'productivity':
        return 'text-primary';
      case 'bottleneck':
        return 'text-warning';
      default:
        return 'text-accent';
    }
  };

  const mockInsights = [
    {
      type: 'productivity',
      message: 'Moving high-priority tasks to morning hours could increase focus by 40%',
      priority: 'high'
    },
    {
      type: 'bottleneck',
      message: '3 tasks are waiting on external approvals - consider following up',
      priority: 'medium'
    },
    {
      type: 'suggestion',
      message: 'Group similar tasks together to reduce context switching',
      priority: 'medium'
    },
  ];

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg card-shadow p-6 border border-primary/10">
        <div className="flex items-center space-x-2 mb-4">
          <Skeleton className="w-6 h-6 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const insights = (bottlenecks?.bottlenecks && bottlenecks.bottlenecks.length > 0)
    ? bottlenecks.bottlenecks.map(b => ({
        type: b.type,
        message: b.message,
        priority: 'medium' as const
      }))
    : mockInsights;

  return (
    <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg card-shadow p-6 border border-primary/10">
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
          <Zap className="w-3 h-3 text-white" />
        </div>
        <h3 className="font-semibold text-sm">AI Insights</h3>
      </div>
      
      <div className="space-y-3">
        {insights.slice(0, 3).map((insight, index) => (
          <div key={index} className="bg-background/50 dark:bg-card/50 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              {getInsightIcon(insight.type)}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium mb-1 ${getInsightColor(insight.type)}`}>
                  {insight.type === 'productivity' && 'Productivity Boost'}
                  {insight.type === 'bottleneck' && 'Bottleneck Detected'}
                  {insight.type === 'suggestion' && 'Smart Suggestion'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {insight.message}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
