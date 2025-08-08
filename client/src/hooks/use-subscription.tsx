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
      case 'basic': return 100; // 100 AI requests per month + 3 daily
      case 'pro': return -1; // unlimited
      default: return 3; // free
    }
  };

  const fetchSubscriptionStatus = async () => {
    if (!user || isLoading) {
      if (!user) setIsLoading(false);
      return;
    }

    try {
      // Simple API call without cache-busting to prevent excessive requests
      const response = await apiRequest("GET", "/api/subscription-status");
      if (response.ok) {
        const data = await response.json();
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
        
        // Update subscription status with the response data
        setSubscriptionStatus(prev => ({
          ...prev,
          dailyAiUsage: data.dailyAiUsage || data.monthlyAiUsage || prev.dailyAiUsage,
          monthlyAiUsage: data.monthlyAiUsage || prev.monthlyAiUsage,
          canUseAi: data.canUseAi
        }));
        
        // Remove forced refresh to prevent excessive API calls
        
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
    // For premium_pro users, always allow AI usage (only if subscription is active)
    if (subscriptionStatus.isPremium) {
      return subscriptionStatus.canUseAi;
    }
    
    const userTier = subscriptionStatus.tier || 'free';
    
    // Check tier-specific limits
    if (userTier === 'pro') {
      // Pro tier: Unlimited but only if subscription is active
      return subscriptionStatus.canUseAi;
    } else if (userTier === 'basic') {
      // Basic tier: 100 monthly (3 daily + monthly pool) but only if subscription is active
      return subscriptionStatus.canUseAi && (subscriptionStatus.monthlyAiUsage || 0) < 100;
    } else {
      // Free tier: 3 daily
      return subscriptionStatus.canUseAi && (subscriptionStatus.dailyAiUsage || 0) < 3;
    }
  };

  useEffect(() => {
    let mounted = true;
    if (user && mounted && !isLoading) {
      fetchSubscriptionStatus();
    }
    return () => { mounted = false; };
  }, [user?.id]); // Only depend on user ID to avoid excessive re-renders

  const resetAiUsage = async () => {
    setSubscriptionStatus(prev => ({
      ...prev,
      dailyAiUsage: 0,
      monthlyAiUsage: 0,
      canUseAi: true
    }));
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