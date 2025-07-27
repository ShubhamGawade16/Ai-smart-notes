import React from 'react';
import { TrendingUp, AlertCircle, CheckCircle, Clock, Target, Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { useUpgrade } from '@/hooks/useUpgrade';
import { apiRequest } from '@/lib/queryClient';

interface AIInsight {
  type: 'optimization' | 'pattern' | 'productivity' | 'warning';
  title: string;
  description: string;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high';
}

const InsightIcon = ({ type }: { type: AIInsight['type'] }) => {
  switch (type) {
    case 'optimization':
      return <TrendingUp className="w-4 h-4 text-blue-500" />;
    case 'pattern':
      return <Target className="w-4 h-4 text-purple-500" />;
    case 'productivity':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'warning':
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    default:
      return <Brain className="w-4 h-4 text-gray-500" />;
  }
};

const PriorityBadge = ({ priority }: { priority: AIInsight['priority'] }) => {
  const variants = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };
  
  return (
    <Badge className={variants[priority]}>
      {priority} priority
    </Badge>
  );
};

export const ProductivityInsights: React.FC = () => {
  const { canUseFeature, showUpgradeModal, limits } = useUpgrade();

  const { data: insightsData, isLoading, error } = useQuery({
    queryKey: ['/api/ai/insights'],
    enabled: canUseFeature('unlimited_ai_calls'),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const insights: AIInsight[] = insightsData?.insights || [];

  if (!canUseFeature('unlimited_ai_calls')) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            AI Productivity Insights
            <Badge variant="outline">Pro</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-2">Unlock AI-Powered Insights</h3>
            <p className="text-gray-600 mb-4">
              Get personalized productivity analysis, pattern detection, and optimization recommendations powered by AI.
            </p>
            <Button 
              onClick={() => showUpgradeModal('unlimited_ai_calls', 'AI Productivity Insights require Pro subscription for unlimited analysis.')}
            >
              Upgrade to Pro
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            AI Productivity Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            AI Productivity Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">
            Unable to generate insights. Please try again later.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (insights.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            AI Productivity Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-3">
            <Clock className="w-12 h-12 text-gray-400 mx-auto" />
            <div className="space-y-2">
              <h3 className="font-medium">Building Your Profile</h3>
              <p className="text-sm text-gray-600">
                Complete more tasks and notes to unlock personalized AI insights about your productivity patterns.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const sortedInsights = insights.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          AI Productivity Insights
          <Badge variant="outline">{insights.length} insights</Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {sortedInsights.map((insight, index) => (
          <div 
            key={index} 
            className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <InsightIcon type={insight.type} />
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-medium text-sm">{insight.title}</h4>
                  <PriorityBadge priority={insight.priority} />
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {insight.description}
                </p>
                
                {insight.actionable && (
                  <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                    <CheckCircle className="w-3 h-3" />
                    Actionable insight
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {/* Refresh Button */}
        <div className="pt-2 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => window.location.reload()}
          >
            <Brain className="w-4 h-4 mr-2" />
            Generate Fresh Insights
          </Button>
        </div>
        
        {/* Upgrade Prompt for Advanced Features */}
        {limits?.tier === 'basic_pro' && (
          <div className="p-4 border border-purple-200 rounded-lg bg-purple-50 dark:bg-purple-900/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span className="font-medium text-purple-800 dark:text-purple-200">
                Get Deeper Insights
              </span>
            </div>
            <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
              Advanced Pro unlocks predictive insights, burnout detection, and focus optimization recommendations.
            </p>
            <Button 
              size="sm" 
              onClick={() => showUpgradeModal('advanced_insights', 'Advanced productivity insights require Advanced Pro subscription.')}
            >
              Upgrade to Advanced Pro
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};