import { useState, useEffect } from "react";
import { useAuth } from "./use-supabase-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();
  
  // Use React Query for subscription status
  const { data: subscriptionStatus, isLoading, refetch } = useQuery({
    queryKey: ['/api/subscription-status'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/subscription-status");
      if (!response.ok) {
        throw new Error('Failed to fetch subscription status');
      }
      return response.json();
    },
    enabled: !!user,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  // Fallback subscription status if data is not loaded yet
  const currentStatus: SubscriptionStatus = subscriptionStatus || {
    isPremium: false,
    isBasic: false,
    tier: 'free',
    dailyAiUsage: 0,
    dailyAiLimit: 3,
    monthlyAiUsage: 0,
    monthlyAiLimit: -1,
    canUseAi: true,
  };

  // Get tier-based limits
  const getTierLimits = (tier: string) => {
    switch (tier) {
      case 'basic': return 100; // 100 AI requests per month + 3 daily
      case 'pro': return -1; // unlimited
      default: return 3; // free
    }
  };

  // Remove the old fetch function as React Query handles it

  const incrementAiUsage = async () => {
    if (!user) return false;

    try {
      const response = await apiRequest("POST", "/api/increment-ai-usage");
      if (response.ok) {
        const data = await response.json();
        
        // Invalidate subscription query to refresh the data
        queryClient.invalidateQueries({ queryKey: ['/api/subscription-status'] });
        
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
    if (currentStatus.isPremium) {
      return currentStatus.canUseAi;
    }
    
    const userTier = currentStatus.tier || 'free';
    
    // Check tier-specific limits
    if (userTier === 'pro') {
      // Pro tier: Unlimited but only if subscription is active
      return currentStatus.canUseAi;
    } else if (userTier === 'basic') {
      // Basic tier: 100 monthly (3 daily + monthly pool) but only if subscription is active
      return currentStatus.canUseAi && (currentStatus.monthlyAiUsage || 0) < 100;
    } else {
      // Free tier: 3 daily
      return currentStatus.canUseAi && (currentStatus.dailyAiUsage || 0) < 3;
    }
  };

  const resetAiUsage = async () => {
    // Invalidate the query to refresh data
    queryClient.invalidateQueries({ queryKey: ['/api/subscription-status'] });
  };

  return {
    subscriptionStatus: currentStatus,
    isLoading,
    incrementAiUsage,
    checkAiUsageLimit,
    refetch,
    refreshStatus: refetch,
    resetAiUsage
  };
}