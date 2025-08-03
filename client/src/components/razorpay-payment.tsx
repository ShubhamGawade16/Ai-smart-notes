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

const SUBSCRIPTION_PLAN: SubscriptionPlan = {
  id: "pro",
  name: "Planify Pro",
  amount: 50000, // $5 ≈ ₹500 in paise
  currency: "INR", 
  interval: "monthly",
  description: "Unlock unlimited AI-powered productivity",
  features: [
    "Unlimited AI task analysis",
    "Smart timing suggestions",
    "Advanced task categorization", 
    "Priority support",
    "Export capabilities",
    "No daily usage limits"
  ]
};

interface RazorpayPaymentProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  userEmail?: string;
}

export function RazorpayPayment({ onSuccess, onError, userEmail }: RazorpayPaymentProps) {
  const [loading, setLoading] = useState(false);
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

  const handleSubscribe = async () => {
    try {
      setLoading(true);

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load payment gateway");
      }

      // Create subscription order
      console.log("Creating subscription order...");
      const response = await apiRequest("POST", "/api/razorpay/subscription", {
        planId: SUBSCRIPTION_PLAN.id,
        customerEmail: userEmail,
      });
      
      const responseData = await response.json();
      console.log("Subscription order response:", responseData);

      if (!responseData.success) {
        throw new Error(responseData.error || "Failed to create subscription");
      }

      // Configure Razorpay checkout
      const options = {
        key: responseData.key_id,
        amount: responseData.order.amount,
        currency: responseData.order.currency,
        order_id: responseData.order.id,
        name: "Planify",
        description: `${SUBSCRIPTION_PLAN.name} Subscription`,
        image: "/attached_assets/Planify_imresizer_1754161747016.jpg",
        handler: async (paymentResponse: any) => {
          try {
            setLoading(true);
            console.log("Payment response received:", paymentResponse);
            
            // Verify payment
            const verifyResponse = await apiRequest("POST", "/api/razorpay/verify", {
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            });

            const verifyData = await verifyResponse.json();
            console.log("Verification response:", verifyData);

            if (verifyData.success) {
              toast({
                title: "Payment Successful!",
                description: `Welcome to ${SUBSCRIPTION_PLAN.name}! Your premium features are now active.`,
              });
              
              // Refresh subscription status
              queryClient.invalidateQueries({ queryKey: ['/api/subscription-status'] });
              
              setLoading(false);
              onSuccess?.();
            } else {
              throw new Error(verifyData.error || "Payment verification failed");
            }
          } catch (error: any) {
            console.error("Payment verification error:", error);
            setLoading(false);
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
            setLoading(false);
          },
        },
        notes: {
          subscription_type: "pro",
          user_email: userEmail,
        },
      };

      console.log("Opening Razorpay with options:", options);
      const razorpay = new window.Razorpay(options);
      
      razorpay.on('payment.failed', function (response: any) {
        console.error("Payment failed:", response.error);
        setLoading(false);
        toast({
          title: "Payment Failed",
          description: response.error.description || "Payment could not be processed",
          variant: "destructive",
        });
        onError?.(response.error.description);
      });
      
      razorpay.open();
    } catch (error: any) {
      console.error("Subscription error:", error);
      
      let errorMessage = "Failed to start subscription process";
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: "Subscription Failed",
        description: errorMessage,
        variant: "destructive",
      });
      onError?.(errorMessage);
      setLoading(false);
    }
  };

  const formatPrice = (amount: number) => {
    // Show $5 for demo purposes (₹500 = ~$5 USD)
    return `$5.00`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Upgrade to Planify Pro
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Unlock unlimited AI features and advanced productivity tools
        </p>
      </div>

      <Card className="border-2 border-teal-500 shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center">
              <Crown className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <CardTitle className="text-2xl font-bold">
            {SUBSCRIPTION_PLAN.name}
          </CardTitle>
          
          <div className="mt-4">
            <span className="text-4xl font-bold text-gray-900 dark:text-white">
              {formatPrice(SUBSCRIPTION_PLAN.amount)}
            </span>
            <span className="text-gray-600 dark:text-gray-400 ml-1">
              /{SUBSCRIPTION_PLAN.interval}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {SUBSCRIPTION_PLAN.description}
          </p>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-3 mb-8">
            {SUBSCRIPTION_PLAN.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <Check className="w-5 h-5 text-teal-500 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">
                  {feature}
                </span>
              </div>
            ))}
          </div>

          <Button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white text-lg py-6"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                Processing Payment...
              </div>
            ) : (
              <>
                <Crown className="w-5 h-5 mr-2" />
                Subscribe Now
              </>
            )}
          </Button>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              🔒 Secure payments powered by Razorpay<br/>
              Cancel anytime • 30-day money-back guarantee
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default RazorpayPayment;