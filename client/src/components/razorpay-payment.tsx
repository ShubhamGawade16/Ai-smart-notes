import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Check, Crown, Sparkles, Zap, TrendingUp } from "lucide-react";

// Declare Razorpay global
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface SubscriptionPlan {
  id: string;
  name: string;
  amount: number;
  currency: string;
  interval: string;
  description: string;
  features: string[];
  popular?: boolean;
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "basic_pro",
    name: "Basic Pro",
    amount: 39900, // ₹399 in paise
    currency: "INR",
    interval: "monthly",
    description: "Perfect for individual productivity",
    features: [
      "Unlimited AI task analysis",
      "Smart timing suggestions", 
      "Priority support",
      "Advanced task categorization",
      "Export capabilities"
    ]
  },
  {
    id: "advanced_pro",
    name: "Advanced Pro", 
    amount: 79900, // ₹799 in paise
    currency: "INR",
    interval: "monthly",
    description: "Advanced features for power users",
    features: [
      "Everything in Basic Pro",
      "Team collaboration",
      "Advanced analytics dashboard",
      "Custom AI workflows",
      "API access",
      "Calendar integrations"
    ],
    popular: true
  },
  {
    id: "premium_pro",
    name: "Premium Pro",
    amount: 129900, // ₹1299 in paise
    currency: "INR",
    interval: "monthly",
    description: "Complete productivity suite",
    features: [
      "Everything in Advanced Pro",
      "AI scheduling automation",
      "Predictive insights",
      "Custom integrations",
      "White-label options",
      "Dedicated account manager"
    ]
  }
];

interface RazorpayPaymentProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  userEmail?: string;
}

export function RazorpayPayment({ onSuccess, onError, userEmail }: RazorpayPaymentProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    try {
      setLoading(plan.id);

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load payment gateway");
      }

      // Create subscription
      const response = await apiRequest("POST", "/api/razorpay/subscription", {
        planId: plan.id,
        customerEmail: userEmail,
      }) as any;

      if (!response.success) {
        throw new Error(response.error || "Failed to create subscription");
      }

      // Configure Razorpay checkout
      const options = {
        key: response.key_id,
        subscription_id: response.subscription.id,
        name: "Planify",
        description: `${plan.name} Subscription`,
        image: "/attached_assets/Planify_imresizer_1754161747016.jpg",
        handler: async (paymentResponse: any) => {
          try {
            // Verify payment
            const verifyResponse = await apiRequest("POST", "/api/razorpay/verify", {
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_subscription_id: paymentResponse.razorpay_subscription_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            }) as any;

            if (verifyResponse.success) {
              toast({
                title: "Subscription Activated! 🎉",
                description: `Welcome to ${plan.name}! Your premium features are now active.`,
              });
              
              // Refresh subscription status
              queryClient.invalidateQueries({ queryKey: ['/api/subscription-status'] });
              
              onSuccess?.();
            } else {
              throw new Error("Payment verification failed");
            }
          } catch (error: any) {
            console.error("Payment verification error:", error);
            toast({
              title: "Payment Verification Failed",
              description: error.message || "Please contact support for assistance.",
              variant: "destructive",
            });
            onError?.(error.message);
          }
        },
        prefill: {
          email: userEmail,
        },
        theme: {
          color: "#0891b2", // Teal theme color
        },
        modal: {
          ondismiss: () => {
            setLoading(null);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error("Subscription error:", error);
      toast({
        title: "Subscription Failed",
        description: error.message || "Failed to start subscription process",
        variant: "destructive",
      });
      onError?.(error.message);
      setLoading(null);
    }
  };

  const formatPrice = (amount: number) => {
    return `₹${(amount / 100).toFixed(2)}`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Choose Your Plan
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Upgrade to unlock unlimited AI features and advanced productivity tools
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {SUBSCRIPTION_PLANS.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative ${
              plan.popular 
                ? "border-2 border-teal-500 shadow-lg scale-105" 
                : "border border-gray-200 dark:border-gray-700"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-teal-500 text-white px-3 py-1">
                  <Crown className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                {plan.id === "basic_pro" && <Zap className="w-8 h-8 text-teal-500" />}
                {plan.id === "advanced_pro" && <Sparkles className="w-8 h-8 text-teal-500" />}
                {plan.id === "premium_pro" && <TrendingUp className="w-8 h-8 text-teal-500" />}
              </div>
              
              <CardTitle className="text-xl font-bold">
                {plan.name}
              </CardTitle>
              
              <div className="mt-4">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(plan.amount)}
                </span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">
                  /{plan.interval}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {plan.description}
              </p>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => handleSubscribe(plan)}
                disabled={loading === plan.id}
                className={`w-full ${
                  plan.popular
                    ? "bg-teal-500 hover:bg-teal-600 text-white"
                    : "bg-gray-900 hover:bg-gray-800 text-white dark:bg-gray-700 dark:hover:bg-gray-600"
                }`}
              >
                {loading === plan.id ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Processing...
                  </div>
                ) : (
                  "Subscribe Now"
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Secure payments powered by Razorpay • Cancel anytime • 30-day money-back guarantee
        </p>
      </div>
    </div>
  );
}

export default RazorpayPayment;