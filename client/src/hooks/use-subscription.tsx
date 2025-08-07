import { useState, useEffect } from "react";
import { useAuth } from "./use-supabase-auth";
import { apiRequest } from "@/lib/queryClient";

export interface SubscriptionStatus {
  isPremium: boolean;
  dailyAiUsage: number;
  dailyAiLimit: number;
  canUseAi: boolean;
  subscriptionId?: string;
  expiresAt?: string;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    isPremium: false,
    dailyAiUsage: 0,
    dailyAiLimit: 3, // Free: 3, Basic: 30, Pro: unlimited
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
        setSubscriptionStatus(prev => ({
          ...prev,
          dailyAiUsage: data.dailyAiUsage,
          canUseAi: data.canUseAi
        }));
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
    
    const userTier = (user && 'tier' in user ? user.tier : 'free') || 'free';
    const limit = getTierLimits(userTier);
    
    // Unlimited for pro users
    if (limit === -1) return true;
    
    return subscriptionStatus.canUseAi && subscriptionStatus.dailyAiUsage < limit;
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
    refreshStatus: fetchSubscriptionStatus,
    resetAiUsage
  };
}