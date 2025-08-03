import { useState, useEffect } from "react";
import { useAuth } from "./use-auth";
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
    dailyAiLimit: 3, // Free users get 3 AI requests per day
    canUseAi: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubscriptionStatus = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
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
    if (subscriptionStatus.isPremium) return true;
    return subscriptionStatus.dailyAiUsage < subscriptionStatus.dailyAiLimit;
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