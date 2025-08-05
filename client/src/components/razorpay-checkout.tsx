import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Crown, Zap, Check } from 'lucide-react';

interface RazorpayCheckoutProps {
  plan: 'basic' | 'pro';
  onSuccess: () => void;
  onClose: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function RazorpayCheckout({ plan, onSuccess, onClose }: RazorpayCheckoutProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const planDetails = {
    basic: {
      name: 'Basic Plan',
      price: 299,
      currency: 'INR',
      features: ['30 AI requests per month', 'Task management', 'Basic analytics', 'Email support']
    },
    pro: {
      name: 'Premium Pro Plan',
      price: 499,
      currency: 'INR',
      features: ['Unlimited AI requests', 'Advanced task management', 'Smart timing analysis', 'Priority support', 'Advanced analytics']
    }
  };

  const selectedPlan = planDetails[plan];

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      // Create order on backend
      const response = await apiRequest("POST", "/api/razorpay/create-order", {
        amount: selectedPlan.price,
        currency: selectedPlan.currency,
        plan: plan
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const { orderId, amount, currency } = await response.json();

      // Initialize Razorpay
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Your Razorpay key ID
        amount: amount,
        currency: currency,
        name: 'Planify',
        description: `${selectedPlan.name} Subscription`,
        order_id: orderId,
        prefill: {
          name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
          email: user?.email || '',
          contact: user?.phone || ''
        },
        theme: {
          color: '#14b8a6' // Teal theme color
        },
        handler: async function (response: any) {
          try {
            // Verify payment on backend
            const verifyResponse = await apiRequest("POST", "/api/razorpay/verify-payment", {
              orderId: orderId,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              plan: plan
            });

            if (verifyResponse.ok) {
              toast({
                title: "Payment Successful!",
                description: `Welcome to ${selectedPlan.name}! Your subscription is now active.`,
              });
              onSuccess();
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast({
              title: "Payment Verification Failed",
              description: "Please contact support if your account wasn't upgraded.",
              variant: "destructive"
            });
          }
        },
        modal: {
          ondismiss: function() {
            setIsLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment initiation error:', error);
      toast({
        title: "Payment Failed",
        description: "Unable to initiate payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
          {plan === 'pro' ? <Crown className="w-6 h-6 text-white" /> : <Zap className="w-6 h-6 text-white" />}
        </div>
        <CardTitle className="text-xl text-gray-900 dark:text-white">
          {selectedPlan.name}
        </CardTitle>
        <div className="text-3xl font-bold text-gray-900 dark:text-white">
          ₹{selectedPlan.price}
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">/month</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">What's included:</h4>
          <ul className="space-y-2">
            {selectedPlan.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handlePayment}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white border-0"
          >
            {isLoading ? 'Processing...' : `Pay ₹${selectedPlan.price}`}
          </Button>
          
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full"
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Secure payment powered by Razorpay
        </div>
      </CardContent>
    </Card>
  );
}