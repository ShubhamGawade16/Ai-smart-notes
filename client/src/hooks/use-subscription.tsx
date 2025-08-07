import { useState, useEffect } from "react";
import { useAuth } from "./use-supabase-auth";
import { apiRequest } from "@/lib/queryClient";

export interface SubscriptionStatus {
  isPremium: boolean;
  isBasic: boolean;
  tier: 'free' | 'basic' | 'pro';
  dailyAiUsage: number;
  dailyAiLimit: number;
  monthlyAiUsage: number;
  monthlyAiLimit: number;
  canUseAi: boolean;
  subscriptionId?: string;
  subscriptionStatus?: string;
  expiresAt?: string;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    isPremium: false,
    isBasic: false,
    tier: 'free',
    dailyAiUsage: 0,
    dailyAiLimit: 3,
    monthlyAiUsage: 0,
    monthlyAiLimit: -1,
    canUseAi: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Get tier-based limits
  const getTierLimits = (tier: string) => {
    switch (tier) {
      case 'basic': return 30;
      case 'pro': return -1; // unlimited
      default: return 3; // free
    }
  };

  const fetchSubscriptionStatus = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      // Use apiRequest with cache-busting timestamp
      const timestamp = Date.now();
      const response = await apiRequest("GET", `/api/subscription-status?t=${timestamp}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Fresh subscription data:', data);
        setSubscriptionStatus(data);
      } else {
        console.error("Failed to fetch subscription status:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Failed to fetch subscription status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const incrementAiUsage = async () => {
    if (!user) return false;

    try {
      const response = await apiRequest("POST", "/api/increment-ai-usage");
      if (response.ok) {
        const data = await response.json();
        console.log('AI usage incremented:', data);
        
        // Update subscription status with the response data
        setSubscriptionStatus(prev => ({
          ...prev,
          dailyAiUsage: data.dailyAiUsage || data.monthlyAiUsage || prev.dailyAiUsage,
          monthlyAiUsage: data.monthlyAiUsage || prev.monthlyAiUsage,
          canUseAi: data.canUseAi
        }));
        
        // Force refresh subscription status to get latest data
        setTimeout(() => fetchSubscriptionStatus(), 100);
        
        return data.canUseAi;
      } else {
        console.error("Failed to increment AI usage:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Failed to increment AI usage:", error);
    }
    return false;
  };

  const checkAiUsageLimit = () => {
    // For premium_pro users, always allow AI usage
    if (subscriptionStatus.isPremium) {
      return true;
    }
    
    const userTier = subscriptionStatus.tier || 'free';
    
    // Check tier-specific limits
    if (userTier === 'pro') {
      return true; // Unlimited
    } else if (userTier === 'basic') {
      // Basic tier: 30 monthly
      return subscriptionStatus.canUseAi && (subscriptionStatus.monthlyAiUsage || 0) < 30;
    } else {
      // Free tier: 3 daily
      return subscriptionStatus.canUseAi && (subscriptionStatus.dailyAiUsage || 0) < 3;
    }
  };

  useEffect(() => {
    fetchSubscriptionStatus();
  }, [user]);

  const resetAiUsage = async () => {
    setSubscriptionStatus(prev => ({
      ...prev,
      dailyAiUsage: 0,
      canUseAi: true
    }));
    await fetchSubscriptionStatus();
  };

  return {
    subscriptionStatus,
    isLoading,
    incrementAiUsage,
    checkAiUsageLimit,
    refetch: fetchSubscriptionStatus,
    refreshStatus: fetchSubscriptionStatus,
    resetAiUsage
  };
}