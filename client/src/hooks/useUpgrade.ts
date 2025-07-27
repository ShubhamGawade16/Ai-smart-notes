import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface UserLimits {
  tier: 'free' | 'basic_pro' | 'advanced_pro' | 'premium_pro';
  dailyAiCalls?: {
    limit: number;
    used: number;
    remaining: number;
    resetAt: Date;
  };
  monthlyTasks?: {
    limit: number;
    used: number;
    remaining: number;
    resetAt: Date;
  };
  unlimited?: boolean;
}

interface UpgradeState {
  isModalOpen: boolean;
  feature: string;
  reason: string;
}

export const useUpgrade = () => {
  const [upgradeState, setUpgradeState] = useState<UpgradeState>({
    isModalOpen: false,
    feature: '',
    reason: '',
  });

  // Fetch user limits
  const { data: limitsData, refetch: refetchLimits } = useQuery({
    queryKey: ['/api/user/limits'],
    retry: false,
  });

  const limits: UserLimits | null = (limitsData as any)?.limits || null;

  const showUpgradeModal = (feature: string, reason: string) => {
    setUpgradeState({
      isModalOpen: true,
      feature,
      reason,
    });
  };

  const closeUpgradeModal = () => {
    setUpgradeState({
      isModalOpen: false,
      feature: '',
      reason: '',
    });
  };

  // Check if user can use a feature
  const canUseFeature = (feature: string): boolean => {
    if (!limits) return false;
    
    const { tier } = limits;
    
    // Feature access mapping based on tier
    const featureAccess = {
      // Free tier
      basic_tasks: true,
      manual_prioritization: true,
      
      // Basic Pro features
      unlimited_ai_calls: ['basic_pro', 'advanced_pro', 'premium_pro'].includes(tier),
      unlimited_tasks: ['basic_pro', 'advanced_pro', 'premium_pro'].includes(tier),
      no_ads: ['basic_pro', 'advanced_pro', 'premium_pro'].includes(tier),
      gmail_integration: ['basic_pro', 'advanced_pro', 'premium_pro'].includes(tier),
      outlook_integration: ['basic_pro', 'advanced_pro', 'premium_pro'].includes(tier),
      
      // Advanced Pro features
      focus_forecast: ['advanced_pro', 'premium_pro'].includes(tier),
      auto_schedule: ['advanced_pro', 'premium_pro'].includes(tier),
      zoom_integration: ['advanced_pro', 'premium_pro'].includes(tier),
      meet_integration: ['advanced_pro', 'premium_pro'].includes(tier),
      
      // Premium Pro features
      focus_forecast_7day: tier === 'premium_pro',
      slack_integration: tier === 'premium_pro',
      teams_integration: tier === 'premium_pro',
      custom_webhooks: tier === 'premium_pro',
    };
    
    return (featureAccess as any)[feature] || false;
  };

  // Check if user has reached limits
  const hasReachedLimit = (limitType: 'daily_ai' | 'monthly_tasks'): boolean => {
    if (!limits || limits.unlimited) return false;
    
    if (limitType === 'daily_ai' && limits.dailyAiCalls) {
      return limits.dailyAiCalls.remaining <= 0;
    }
    
    if (limitType === 'monthly_tasks' && limits.monthlyTasks) {
      return limits.monthlyTasks.remaining <= 0;
    }
    
    return false;
  };

  // Get usage stats for display
  const getUsageStats = () => {
    if (!limits) return null;
    
    if (limits.unlimited) {
      return {
        tier: limits.tier,
        status: 'unlimited',
      };
    }
    
    return {
      tier: limits.tier,
      dailyAi: limits.dailyAiCalls,
      monthlyTasks: limits.monthlyTasks,
    };
  };

  // Handle API errors and show upgrade prompts
  const handleApiError = (error: Error) => {
    const errorMessage = error.message;
    
    // Parse upgrade-required errors
    if (errorMessage.includes('Feature not available')) {
      const match = errorMessage.match(/requires (\w+)/);
      const requiredTier = match ? match[1] : 'Pro';
      showUpgradeModal('feature_access', `This feature requires ${requiredTier} subscription.`);
      return true;
    }
    
    if (errorMessage.includes('Daily limit exceeded')) {
      showUpgradeModal('daily_limit', 'You\'ve reached your daily AI limit. Upgrade for unlimited access.');
      return true;
    }
    
    if (errorMessage.includes('Monthly limit exceeded')) {
      showUpgradeModal('monthly_limit', 'You\'ve reached your monthly task limit. Upgrade for unlimited tasks.');
      return true;
    }
    
    return false;
  };

  return {
    limits,
    upgradeState,
    showUpgradeModal,
    closeUpgradeModal,
    canUseFeature,
    hasReachedLimit,
    getUsageStats,
    handleApiError,
    refetchLimits,
  };
};