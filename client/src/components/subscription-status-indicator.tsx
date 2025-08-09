import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Crown, 
  Calendar, 
  Zap, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  Clock,
  Sparkles,
  ArrowUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SubscriptionData {
  tier: 'free' | 'basic' | 'pro';
  isActive: boolean;
  daysRemaining?: number;
  subscriptionEndDate?: string;
  dailyAiCalls: number;
  monthlyAiCalls: number;
  frozenProCredits: number;
}

interface AiLimitsData {
  allowed: boolean;
  tier: 'free' | 'basic' | 'pro';
  dailyLimit: number;
  monthlyLimit: number;
  dailyUsage: number;
  monthlyUsage: number;
  resetsAt?: string;
}

const tierConfig = {
  free: {
    name: 'Free',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: Zap,
    gradient: 'from-gray-400 to-gray-600'
  },
  basic: {
    name: 'Basic',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: TrendingUp,
    gradient: 'from-blue-400 to-blue-600'
  },
  pro: {
    name: 'Premium Pro',
    color: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-transparent',
    icon: Crown,
    gradient: 'from-purple-400 to-pink-600'
  }
};

export default function SubscriptionStatusIndicator({ compact = false }: { compact?: boolean }) {
  const { toast } = useToast();
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  
  // Real-time subscription status
  const { data: subscriptionData, isLoading: subLoading, error: subError } = useQuery({
    queryKey: ['/api/payments/subscription-status'],
    refetchInterval: 5000, // Update every 5 seconds
    refetchIntervalInBackground: true,
    staleTime: 0, // Always consider data stale for real-time updates
  });

  // Real-time AI usage limits
  const { data: aiLimitsData, isLoading: aiLoading, error: aiError } = useQuery({
    queryKey: ['/api/payments/ai-limits'],
    refetchInterval: 3000, // Update every 3 seconds for usage tracking
    refetchIntervalInBackground: true,
    staleTime: 0,
  });

  useEffect(() => {
    if (subscriptionData || aiLimitsData) {
      setLastUpdateTime(new Date());
    }
  }, [subscriptionData, aiLimitsData]);

  if (subLoading || aiLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (subError || aiError) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">Unable to load subscription status</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const subscription = subscriptionData as SubscriptionData;
  const aiLimits = aiLimitsData as AiLimitsData;
  const tierInfo = tierConfig[subscription?.tier || 'free'];
  const TierIcon = tierInfo.icon;

  // Calculate usage percentages
  const dailyUsagePercent = aiLimits?.dailyLimit > 0 
    ? Math.min((aiLimits.dailyUsage / aiLimits.dailyLimit) * 100, 100)
    : 0;
    
  const monthlyUsagePercent = aiLimits?.monthlyLimit > 0 
    ? Math.min((aiLimits.monthlyUsage / aiLimits.monthlyLimit) * 100, 100)
    : 0;

  // Status indicators
  const isExpiringSoon = subscription?.daysRemaining && subscription.daysRemaining <= 7;
  const isExpired = subscription?.tier !== 'free' && !subscription?.isActive;
  const isDailyLimitReached = aiLimits?.dailyUsage >= aiLimits?.dailyLimit;
  const isMonthlyLimitReached = aiLimits?.monthlyUsage >= aiLimits?.monthlyLimit;

  if (compact) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center space-x-2"
      >
        <Badge className={cn(tierInfo.color, "text-xs font-medium")}>
          <TierIcon className="w-3 h-3 mr-1" />
          {tierInfo.name}
        </Badge>
        
        {subscription?.tier === 'pro' && (
          <Badge variant="outline" className="text-xs">
            Unlimited AI
          </Badge>
        )}
        
        {subscription?.tier !== 'pro' && (
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs",
              isDailyLimitReached ? "text-red-600 border-red-200" : "text-green-600 border-green-200"
            )}
          >
            {aiLimits?.dailyLimit - aiLimits?.dailyUsage || 0} AI calls left
          </Badge>
        )}
      </motion.div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <div className={cn(
              "p-2 rounded-lg bg-gradient-to-r",
              tierInfo.gradient
            )}>
              <TierIcon className="w-5 h-5 text-white" />
            </div>
            <span>{tierInfo.name} Plan</span>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            {subscription?.isActive && (
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Active
              </Badge>
            )}
            
            {isExpired && (
              <Badge className="bg-red-100 text-red-800 border-red-200">
                <AlertCircle className="w-3 h-3 mr-1" />
                Expired
              </Badge>
            )}
            
            {isExpiringSoon && (
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                <Clock className="w-3 h-3 mr-1" />
                Expires Soon
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Subscription Details */}
        {subscription?.tier !== 'free' && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Subscription</span>
              <span className="text-xs text-gray-500">
                Updated {lastUpdateTime.toLocaleTimeString()}
              </span>
            </div>
            
            {subscription?.subscriptionEndDate && (
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">
                  {subscription.isActive ? 'Renews' : 'Expired'} on{' '}
                  {new Date(subscription.subscriptionEndDate).toLocaleDateString()}
                </span>
                {subscription?.daysRemaining && subscription.daysRemaining > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {subscription.daysRemaining} days
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}

        {/* AI Usage Stats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">AI Usage</span>
            <span className="text-xs text-gray-500">Live Status</span>
          </div>
          
          {/* Daily Usage */}
          {subscription?.tier !== 'pro' && aiLimits?.dailyLimit > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Daily AI Calls</span>
                <span className={cn(
                  "font-medium",
                  isDailyLimitReached ? "text-red-600" : "text-gray-900"
                )}>
                  {aiLimits.dailyUsage} / {aiLimits.dailyLimit}
                </span>
              </div>
              
              <Progress 
                value={dailyUsagePercent} 
                className={cn(
                  "h-2",
                  isDailyLimitReached && "bg-red-100"
                )}
              />
              
              {isDailyLimitReached && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center space-x-2 text-red-600 text-xs"
                >
                  <AlertCircle className="w-3 h-3" />
                  <span>Daily limit reached</span>
                </motion.div>
              )}
            </div>
          )}
          
          {/* Monthly Usage for Basic */}
          {subscription?.tier === 'basic' && aiLimits?.monthlyLimit > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Monthly AI Pool</span>
                <span className={cn(
                  "font-medium",
                  isMonthlyLimitReached ? "text-red-600" : "text-gray-900"
                )}>
                  {aiLimits.monthlyUsage} / {aiLimits.monthlyLimit}
                </span>
              </div>
              
              <Progress 
                value={monthlyUsagePercent} 
                className={cn(
                  "h-2",
                  isMonthlyLimitReached && "bg-red-100"
                )}
              />
            </div>
          )}
          
          {/* Pro Unlimited */}
          {subscription?.tier === 'pro' && (
            <div className="flex items-center space-x-2 text-sm">
              <div className="p-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <span className="text-gray-600">Unlimited AI calls</span>
              <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                {aiLimits?.dailyUsage || 0} used today
              </Badge>
            </div>
          )}
          
          {/* Frozen Credits */}
          {subscription?.frozenProCredits > 0 && (
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-blue-800 font-medium">
                  {subscription.frozenProCredits} frozen Pro credits
                </span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Will be restored when you upgrade back to Pro
              </p>
            </div>
          )}
        </div>

        {/* Upgrade Button */}
        {subscription?.tier !== 'pro' && (
          <Button 
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
            onClick={() => window.location.href = '/upgrade'}
          >
            <ArrowUp className="w-4 h-4 mr-2" />
            {subscription?.tier === 'free' ? 'Upgrade to Pro' : 'Upgrade to Premium Pro'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}