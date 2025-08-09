import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionStatus {
  tier: 'free' | 'basic' | 'pro';
  isActive: boolean;
  subscriptionEndDate?: Date;
  daysRemaining: number;
  dailyAiCalls: number;
  monthlyAiCalls: number;
  frozenProCredits: number;
  limits: {
    daily: number;
    monthly: number;
    unlimited: boolean;
  };
}

interface PlanPricing {
  basic: {
    name: string;
    price: number;
    currency: string;
    features: string[];
    dailyLimit: number;
    monthlyLimit: number;
  };
  pro: {
    name: string;
    price: number;
    currency: string;
    features: string[];
    dailyLimit: number;
    monthlyLimit: number;
  };
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function useSubscription() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get subscription status
  const {
    data: subscriptionStatus,
    isLoading: statusLoading,
    error: statusError
  } = useQuery<SubscriptionStatus>({
    queryKey: ['/api/payments/subscription-status'],
    staleTime: 5000, // Fast updates for subscription changes
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Get pricing plans
  const {
    data: plans,
    isLoading: plansLoading
  } = useQuery<{ plans: PlanPricing }>({
    queryKey: ['/api/payments/plans'],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Get AI usage limits
  const {
    data: aiLimits,
    isLoading: limitsLoading
  } = useQuery({
    queryKey: ['/api/payments/ai-limits'],
    staleTime: 1000, // Fast updates for AI usage
    refetchInterval: 10000, // Check every 10 seconds
  });

  // Create payment order
  const createOrder = useMutation({
    mutationFn: async (planType: 'basic' | 'pro') => {
      const response = await apiRequest('POST', '/api/payments/create-order', { planType });
      return response;
    },
    onError: (error) => {
      console.error('Failed to create payment order:', error);
      toast({
        title: "Payment Error",
        description: "Failed to create payment order. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Verify payment
  const verifyPayment = useMutation({
    mutationFn: async (paymentData: {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    }) => {
      const response = await apiRequest('POST', '/api/payments/verify-payment', paymentData);
      return response;
    },
    onSuccess: (data: any) => {
      toast({
        title: "Payment Successful!",
        description: `Successfully upgraded to ${data.payment?.planType || 'premium'} plan!`,
      });
      // Invalidate and refetch subscription status
      queryClient.invalidateQueries({ queryKey: ['/api/payments/subscription-status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/payments/ai-limits'] });
    },
    onError: (error) => {
      console.error('Payment verification failed:', error);
      toast({
        title: "Payment Verification Failed",
        description: "Payment could not be verified. Please contact support.",
        variant: "destructive",
      });
    },
  });

  // Handle Razorpay payment
  const handlePayment = async (planType: 'basic' | 'pro') => {
    try {
      // Create order
      const orderData: any = await createOrder.mutateAsync(planType);
      
      if (!orderData?.success) {
        throw new Error('Failed to create order');
      }

      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      }

      const plan = plans?.plans[planType];
      if (!plan) {
        throw new Error('Plan not found');
      }

      // Configure Razorpay options
      const options = {
        key: orderData.razorpayKeyId,
        amount: orderData.order?.amount,
        currency: orderData.order?.currency,
        name: 'Smart To-Do AI',
        description: `${plan.name} - ₹${plan.price}/month`,
        order_id: orderData.order?.id,
        handler: async (response: any) => {
          // Verify payment with backend
          await verifyPayment.mutateAsync({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          });
        },
        prefill: {
          name: 'Smart To-Do User',
          email: '', // Will be filled by Razorpay if available
        },
        theme: {
          color: '#2dd4bf', // Teal theme color
        },
        modal: {
          ondismiss: () => {
            console.log('Payment modal closed');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Payment process failed:', error);
      toast({
        title: "Payment Failed",
        description: "Unable to process payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Helper function to check if user can use AI features
  const canUseAI = (): boolean => {
    return (aiLimits as any)?.allowed || false;
  };

  // Helper function to get usage display
  const getUsageDisplay = () => {
    if (!subscriptionStatus || !aiLimits) return null;

    const { tier } = subscriptionStatus;
    const limits = (aiLimits as any)?.limits;

    if (tier === 'free' || tier === 'basic') {
      return {
        type: 'daily',
        used: limits?.used || 0,
        total: 3,
        remaining: Math.max(0, 3 - (limits?.used || 0)),
      };
    }

    if (tier === 'pro') {
      return {
        type: 'pro',
        dailyUsed: limits?.dailyUsed || 0,
        dailyTotal: 3,
        dailyRemaining: Math.max(0, 3 - (limits?.dailyUsed || 0)),
        monthlyUsed: limits?.monthlyUsed || 0,
        monthlyTotal: 100,
        monthlyRemaining: Math.max(0, 100 - (limits?.monthlyUsed || 0)),
        usingMonthlyPool: limits?.usingMonthlyPool || false,
      };
    }

    return null;
  };

  return {
    // Subscription status
    subscription: subscriptionStatus,
    isLoading: statusLoading,
    error: statusError,

    // Plans and pricing
    plans: plans?.plans,
    plansLoading,

    // AI usage limits
    aiLimits,
    limitsLoading,
    canUseAI: canUseAI(),
    usage: getUsageDisplay(),

    // Payment actions
    handlePayment,
    isProcessingPayment: createOrder.isPending || verifyPayment.isPending,

    // Helper functions
    isPro: subscriptionStatus?.tier === 'pro',
    isBasic: subscriptionStatus?.tier === 'basic',
    isFree: subscriptionStatus?.tier === 'free',
    isActive: subscriptionStatus?.isActive || false,
    daysRemaining: subscriptionStatus?.daysRemaining || 0,
  };
}