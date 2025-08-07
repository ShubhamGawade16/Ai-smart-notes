import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Settings, Zap, RotateCcw, TestTube } from 'lucide-react';

interface DevPanelProps {
  subscriptionData: any;
}

export function DevPanel({ subscriptionData }: DevPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleToggleTier = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/dev/toggle-tier');
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Tier Changed",
          description: `Successfully switched to ${data.newTier} tier`,
        });
        
        // Invalidate all relevant queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/subscription-status'] });
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to toggle tier",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetAiUsage = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/dev/reset-ai-usage');
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "AI Usage Reset",
          description: "Daily and monthly AI usage counters have been reset",
        });
        
        // Invalidate subscription status to refresh usage data
        queryClient.invalidateQueries({ queryKey: ['/api/subscription-status'] });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset AI usage",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'basic': return 'bg-blue-100 text-blue-800';
      case 'pro': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getNextTier = (currentTier: string) => {
    switch (currentTier) {
      case 'free': return 'basic';
      case 'basic': return 'pro';
      case 'pro': return 'free';
      default: return 'basic';
    }
  };

  const formatLimit = (limit: number) => {
    return limit === -1 ? 'Unlimited' : limit.toString();
  };

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <TestTube className="h-5 w-5" />
          Dev Mode Testing Panel
        </CardTitle>
        <CardDescription className="text-orange-600">
          Testing tools for subscription tiers and AI usage limits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Current Tier:</span>
            <Badge className={getTierColor(subscriptionData.tier || 'free')}>
              {(subscriptionData.tier || 'free').toUpperCase()}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Daily AI Usage:</span>
              <div className="font-mono">
                {subscriptionData.dailyAiUsage} / {formatLimit(subscriptionData.dailyAiLimit)}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Monthly AI Usage:</span>
              <div className="font-mono">
                {subscriptionData.monthlyAiUsage || 0} / {formatLimit(subscriptionData.monthlyAiLimit)}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Can Use AI:</span>
            <Badge variant={subscriptionData.canUseAi ? "default" : "destructive"}>
              {subscriptionData.canUseAi ? "Yes" : "No"}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Tier Information */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-800">Tier Limits:</h4>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center p-2 bg-gray-100 rounded">
              <div className="font-medium">Free</div>
              <div className="text-gray-600">3 AI calls/day</div>
            </div>
            <div className="text-center p-2 bg-blue-100 rounded">
              <div className="font-medium">Basic</div>
              <div className="text-blue-600">30 AI calls/month</div>
            </div>
            <div className="text-center p-2 bg-purple-100 rounded">
              <div className="font-medium">Pro</div>
              <div className="text-purple-600">Unlimited AI</div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Testing Actions */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-800">Testing Actions:</h4>
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleToggleTier}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="justify-start"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Switch to {getNextTier(subscriptionData.tier || 'free').toUpperCase()} Tier
            </Button>
            
            <Button
              onClick={handleResetAiUsage}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="justify-start"
            >
              <Zap className="h-4 w-4 mr-2" />
              Reset AI Usage Counters
            </Button>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
          <strong>Testing Instructions:</strong>
          <br />• Use "Switch Tier" to cycle through Free → Basic → Pro → Free
          <br />• Use "Reset AI Usage" to clear daily/monthly counters
          <br />• Try AI features to test limits for each tier
          <br />• Basic tier resets monthly on the 1st, Free tier resets daily
        </div>
      </CardContent>
    </Card>
  );
}