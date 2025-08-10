import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Razorpay TypeScript declaration
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface SubscriptionData {
  tier: 'free' | 'basic' | 'pro';
  subscriptionStatus: string | null;
  dailyAiCalls: number;
  monthlyAiCalls: number;
  dailyAiCallsResetAt: string | null;
  monthlyAiCallsResetAt: string | null;
}

interface AiLimitsData {
  allowed: boolean;
  tier: string;
  userLimit: number;
  limitType: 'daily' | 'monthly' | 'unlimited';
  currentUsage: number;
  resetAt: string | null;
}

export function useSubscription() {
  const { toast } = useToast();

  // Fetch subscription status
  const { data: subscriptionData, isLoading: isLoadingSubscription } = useQuery<SubscriptionData>({
    queryKey: ['/api/payments/subscription-status'],
    staleTime: 5000, // 5 seconds for responsive UI updates
  });

  // Fetch AI usage limits
  const { data: aiLimitsData, isLoading: isLoadingLimits } = useQuery<AiLimitsData>({
    queryKey: ['/api/payments/ai-limits'],
    staleTime: 5000, // 5 seconds for responsive UI updates
  });

  // Mutation to increment AI usage (for optimistic updates)
  const incrementAiUsageMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/ai/increment-usage');
      if (!response.ok) {
        throw new Error('Failed to increment AI usage');
      }
      return response.json();
    },
    onSuccess: (data) => {
      console.log('🔄 AI usage increment success, invalidating queries:', data);
      
      // Force fresh data fetch by invalidating all subscription-related queries
      queryClient.invalidateQueries({ queryKey: ['/api/payments/ai-limits'] });
      queryClient.invalidateQueries({ queryKey: ['/api/payments/subscription-status'] });
      
      // Force immediate refetch for real-time updates
      queryClient.refetchQueries({ queryKey: ['/api/payments/ai-limits'] });
      queryClient.refetchQueries({ queryKey: ['/api/payments/subscription-status'] });
    },
    onError: (error) => {
      console.error('Failed to increment AI usage:', error);
    },
  });

  // Helper functions
  const checkAiUsageLimit = (): boolean => {
    if (!aiLimitsData) return true; // Allow if data not loaded yet
    return aiLimitsData.allowed;
  };

  const updateAiUsageOptimistically = () => {
    // Optimistically update the AI usage count for instant UI feedback
    queryClient.setQueryData(['/api/payments/ai-limits'], (oldData: AiLimitsData | undefined) => {
      if (!oldData) return oldData;
      
      return {
        ...oldData,
        currentUsage: oldData.currentUsage + 1,
        allowed: oldData.limitType === 'unlimited' ? true : (oldData.currentUsage + 1) < oldData.userLimit
      };
    });

    queryClient.setQueryData(['/api/payments/subscription-status'], (oldData: SubscriptionData | undefined) => {
      if (!oldData) return oldData;
      
      return {
        ...oldData,
        dailyAiCalls: oldData.dailyAiCalls + 1,
        monthlyAiCalls: oldData.monthlyAiCalls + 1
      };
    });
  };

  const incrementAiUsage = async () => {
    try {
      await incrementAiUsageMutation.mutateAsync();
    } catch (error) {
      console.error('Failed to increment AI usage:', error);
      toast({
        title: "Error",
        description: "Failed to track AI usage. Please try again.",
        variant: "destructive"
      });
    }
  };

  const canUseAI = (): boolean => {
    return checkAiUsageLimit();
  };

  const getTier = (): 'free' | 'basic' | 'pro' => {
    return subscriptionData?.tier || 'free';
  };

  const getCurrentUsage = () => {
    return {
      daily: aiLimitsData?.currentUsage || 0,
      monthly: subscriptionData?.monthlyAiCalls || 0,
      limit: aiLimitsData?.userLimit || 3,
      limitType: aiLimitsData?.limitType || 'daily',
      allowed: aiLimitsData?.allowed ?? true
    };
  };

  const getSubscriptionStatus = () => {
    return {
      tier: subscriptionData?.tier || 'free',
      status: subscriptionData?.subscriptionStatus || null,
      isActive: subscriptionData?.subscriptionStatus === 'active'
    };
  };

  const refetch = async () => {
    queryClient.invalidateQueries({ queryKey: ['/api/payments/subscription-status'] });
    queryClient.invalidateQueries({ queryKey: ['/api/payments/ai-limits'] });
  };

  // Define plans object for subscription modal
  const plans = {
    basic: {
      name: 'Basic',
      price: '₹199',
      features: [
        '100 AI requests per month',
        'Smart task categorization',
        'Priority scheduling',
        'Basic analytics'
      ]
    },
    pro: {
      name: 'Pro',
      price: '₹499',
      features: [
        'Unlimited AI requests',
        'Advanced productivity insights',
        'Smart timing optimization',
        'Priority support',
        'Custom integrations'
      ]
    }
  };

  // Define usage object for UI display
  const usage = aiLimitsData ? {
    type: aiLimitsData.limitType as 'daily' | 'monthly',
    used: aiLimitsData.currentUsage,
    total: aiLimitsData.userLimit,
    remaining: Math.max(0, aiLimitsData.userLimit - aiLimitsData.currentUsage),
    dailyUsed: subscriptionData?.dailyAiCalls || 0,
    dailyTotal: aiLimitsData.limitType === 'daily' ? aiLimitsData.userLimit : 3,
    dailyRemaining: Math.max(0, (aiLimitsData.limitType === 'daily' ? aiLimitsData.userLimit : 3) - (subscriptionData?.dailyAiCalls || 0)),
    monthlyUsed: subscriptionData?.monthlyAiCalls || 0,
    monthlyTotal: aiLimitsData.limitType === 'monthly' ? aiLimitsData.userLimit : 100,
    monthlyRemaining: Math.max(0, (aiLimitsData.limitType === 'monthly' ? aiLimitsData.userLimit : 100) - (subscriptionData?.monthlyAiCalls || 0)),
    usingMonthlyPool: aiLimitsData.limitType === 'monthly' && (subscriptionData?.dailyAiCalls || 0) >= 3
  } : null;

  // Razorpay payment handler
  const handlePayment = async (plan: 'basic' | 'pro') => {
    try {
      console.log('Payment initiated for plan:', plan);
      
      // Create Razorpay order
      const response = await apiRequest('POST', '/api/payments/create-order', {
        plan: plan,
        tier: plan
      });

      if (!response.ok) {
        throw new Error('Failed to create payment order');
      }

      const orderData = await response.json();
      
      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        
        // Wait for script to load
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      }

      // Configure Razorpay options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'Planify',
        description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan Subscription`,
        order_id: orderData.order.id,
        handler: async function (response: any) {
          try {
            // Verify payment on backend
            const verifyResponse = await apiRequest('POST', '/api/payments/verify-payment', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyResponse.ok) {
              toast({
                title: "Payment Successful!",
                description: `Welcome to ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan! Your subscription is now active.`,
              });
              
              // Refresh subscription data
              await refetch();
              queryClient.invalidateQueries({ queryKey: ['/api/payments/subscription-status'] });
              queryClient.invalidateQueries({ queryKey: ['/api/payments/ai-limits'] });
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification failed:', error);
            toast({
              title: "Payment Verification Failed",
              description: "Please contact support if amount was deducted.",
              variant: "destructive"
            });
          }
        },
        prefill: {
          email: '', // Will be filled by Razorpay or user
          contact: ''
        },
        theme: {
          color: '#14b8a6' // Teal theme color
        },
        modal: {
          ondismiss: function() {
            console.log('Payment modal closed by user');
          }
        }
      };

      // Open Razorpay payment modal
      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Payment initiation failed:', error);
      toast({
        title: "Payment Failed",
        description: "Unable to initiate payment. Please try again.",
        variant: "destructive"
      });
    }
  };

  return {
    // Data
    subscriptionData,
    aiLimitsData,
    isLoading: isLoadingSubscription || isLoadingLimits,

    // Functions
    checkAiUsageLimit,
    updateAiUsageOptimistically,
    incrementAiUsage,
    canUseAI,
    getTier,
    getCurrentUsage,
    getSubscriptionStatus,
    refetch,

    // Mutation states
    isIncrementingUsage: incrementAiUsageMutation.isPending,
    isProcessingPayment: false, // Add this for modal compatibility

    // New properties for subscription modal
    plans,
    usage,
    handlePayment,

    // Legacy compatibility properties
    subscription: subscriptionData,
    isPro: subscriptionData?.tier === 'pro',
    isBasic: subscriptionData?.tier === 'basic', 
    isFree: subscriptionData?.tier === 'free' || !subscriptionData?.tier,
  };
}