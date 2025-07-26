import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap, AlertTriangle, Lightbulb } from "lucide-react";
import { aiApi } from "@/lib/api";

export function AIInsights() {
  const { data: insights = [], isLoading } = useQuery({
    queryKey: ['/api/ai/insights'],
    queryFn: aiApi.getInsights,
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

  const defaultInsights = [
    {
      type: 'productivity',
      title: 'Morning Focus',
      content: 'Moving high-priority tasks to morning hours could increase focus by 40%',
      confidence: 0.8
    },
    {
      type: 'bottleneck',
      title: 'External Dependencies',
      content: '3 tasks are waiting on external approvals - consider following up',
      confidence: 0.7
    },
    {
      type: 'suggestion',
      title: 'Context Switching',
      content: 'Group similar tasks together to reduce context switching',
      confidence: 0.9
    },
  ];

  const displayInsights = insights.length > 0 ? insights : defaultInsights;

  return (
    <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg card-shadow p-6 border border-primary/10">
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
          <Zap className="w-3 h-3 text-white" />
        </div>
        <h3 className="font-semibold text-sm">AI Insights</h3>
      </div>
      
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {displayInsights.slice(0, 3).map((insight: any, index: number) => (
            <div key={index} className="bg-background/50 dark:bg-card/50 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                {getInsightIcon(insight.type)}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium mb-1 ${getInsightColor(insight.type)}`}>
                    {insight.title || (
                      insight.type === 'productivity' ? 'Productivity Boost' :
                      insight.type === 'bottleneck' ? 'Bottleneck Detected' :
                      'Smart Suggestion'
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {insight.content || insight.message}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}