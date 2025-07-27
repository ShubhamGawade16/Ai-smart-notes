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

  // Check if user can use a feature - MAKE EVERYTHING FREE FOR TESTING
  const canUseFeature = (feature: string): boolean => {
    // Return true for all features to make everything free for testing
    return true;
  };

  // Check if user has reached limits - MAKE EVERYTHING FREE FOR TESTING
  const hasReachedLimit = (limitType: 'daily_ai' | 'monthly_tasks'): boolean => {
    // Return false for all limits to make everything unlimited for testing
    return false;
  };

  const getCurrentTier = (): 'free' | 'basic_pro' | 'advanced_pro' | 'premium_pro' => {
    // Return premium tier for testing
    return 'premium_pro';
  };

  return {
    limits: {
      tier: 'premium_pro' as const,
      unlimited: true,
      dailyAiCalls: {
        limit: -1,
        used: 0,
        remaining: -1,
        resetAt: new Date()
      }
    },
    canUseFeature,
    hasReachedLimit,
    getCurrentTier,
    showUpgradeModal,
    closeUpgradeModal,
    upgradeState,
    refetchLimits,
  };
};
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