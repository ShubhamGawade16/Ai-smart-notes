import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Clock, Target, Zap, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ProductivityInsight {
  type: 'productivity_tip' | 'bottleneck_analysis' | 'time_optimization' | 'focus_forecast';
  title: string;
  content: string;
  confidence: number;
  actionable: boolean;
}

export function ProductivityInsights() {
  const { data: insightsData, isLoading } = useQuery({
    queryKey: ['/api/ai/insights'],
    refetchInterval: 30000,
  });

  const insights = (insightsData as any)?.insights || [];

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            AI Productivity Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'productivity_tip': return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'time_optimization': return <Clock className="h-4 w-4 text-green-500" />;
      case 'bottleneck_analysis': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'focus_forecast': return <Target className="h-4 w-4 text-purple-500" />;
      default: return <Zap className="h-4 w-4 text-gray-500" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          AI Productivity Insights
          <Badge variant="secondary">Live Analysis</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.length === 0 ? (
          <div className="text-center py-8">
            <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              Complete more tasks to get personalized AI insights!
            </p>
          </div>
        ) : (
          insights.slice(0, 3).map((insight: ProductivityInsight, index: number) => (
            <div key={index} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-3">
                {getInsightIcon(insight.type)}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">{insight.title}</h4>
                    <Badge variant="outline" className={`text-xs ${getConfidenceColor(insight.confidence)}`}>
                      {Math.round(insight.confidence * 100)}% confident
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {insight.content}
                  </p>
                  {insight.actionable && (
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle2 className="h-3 w-3" />
                      Actionable insight
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        
        {insights.length > 3 && (
          <div className="text-center pt-2">
            <Badge variant="outline" className="text-xs">
              +{insights.length - 3} more insights available
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}