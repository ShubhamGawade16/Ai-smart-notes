import { useState } from 'react';

export const useUpgrade = () => {
  const [upgradeState, setUpgradeState] = useState({
    isModalOpen: false,
    feature: '',
    reason: '',
  });

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

  // Make all features free for testing
  const canUseFeature = (feature: string): boolean => {
    return true;
  };

  const hasReachedLimit = (limitType: string): boolean => {
    return false;
  };

  const getCurrentTier = () => {
    return 'premium_pro' as const;
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
  };
};