import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Crown, Zap, Clock, CreditCard } from 'lucide-react';
import { useSubscription } from '@/hooks/use-subscription';
import { cn } from '@/lib/utils';

interface SubscriptionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPlan?: 'basic' | 'pro';
}

export function SubscriptionModal({ isOpen, onOpenChange, defaultPlan }: SubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'pro'>(defaultPlan || 'basic');
  const { 
    plans, 
    subscription, 
    handlePayment, 
    isProcessingPayment,
    isPro,
    isBasic,
    usage
  } = useSubscription();

  if (!plans) {
    return null;
  }

  const handleSubscribe = async () => {
    await handlePayment(selectedPlan);
    onOpenChange(false);
  };

  const currentTier = subscription?.tier || 'free';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Choose Your Plan
          </DialogTitle>
          <p className="text-center text-muted-foreground">
            Unlock AI-powered productivity features with a simple monthly subscription
          </p>
        </DialogHeader>

        {/* Current Usage Display */}
        {usage && (
          <div className="mb-6 p-4 bg-teal-50 dark:bg-teal-950/20 rounded-lg border border-teal-200 dark:border-teal-800">
            <h3 className="font-semibold mb-2 text-teal-800 dark:text-teal-200">Current Usage</h3>
            {usage.type === 'daily' ? (
              <p className="text-sm text-teal-700 dark:text-teal-300">
                Daily credits: {usage.used}/{usage.total} ({usage.remaining} remaining)
              </p>
            ) : (
              <div className="text-sm text-teal-700 dark:text-teal-300 space-y-1">
                <p>Daily credits: {usage.dailyUsed}/{usage.dailyTotal} ({usage.dailyRemaining} remaining)</p>
                <p>Monthly credits: {usage.monthlyUsed}/{usage.monthlyTotal} ({usage.monthlyRemaining} remaining)</p>
                {usage.usingMonthlyPool && (
                  <p className="text-amber-600 dark:text-amber-400 font-medium">
                    ⚡ Currently using monthly credit pool
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Plan */}
          <Card 
            className={cn(
              "relative cursor-pointer transition-all",
              selectedPlan === 'basic' 
                ? "ring-2 ring-teal-500 bg-teal-50 dark:bg-teal-950/20" 
                : "hover:ring-1 hover:ring-teal-300"
            )}
            onClick={() => setSelectedPlan('basic')}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Basic Plan</CardTitle>
                {isBasic && <Badge variant="secondary">Current</Badge>}
              </div>
              <CardDescription>Perfect for light AI assistance</CardDescription>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-bold">₹299</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {plans.basic.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-teal-500" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Daily Limit
                  </span>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  3 AI interactions daily
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card 
            className={cn(
              "relative cursor-pointer transition-all",
              selectedPlan === 'pro' 
                ? "ring-2 ring-teal-500 bg-teal-50 dark:bg-teal-950/20" 
                : "hover:ring-1 hover:ring-teal-300"
            )}
            onClick={() => setSelectedPlan('pro')}
          >
            {/* Most Popular Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                Most Popular
              </Badge>
            </div>
            
            <CardHeader className="pt-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500" />
                  Pro Plan
                </CardTitle>
                {isPro && <Badge variant="secondary">Current</Badge>}
              </div>
              <CardDescription>Maximum productivity with unlimited AI</CardDescription>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-bold">₹599</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {plans.pro.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-teal-500" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                    Enhanced Limits
                  </span>
                </div>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  3 daily + 100 monthly credits with rollover
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 mt-6">
          {currentTier === selectedPlan ? (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                You're already on the {selectedPlan} plan
              </p>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          ) : (
            <>
              <Button 
                onClick={handleSubscribe}
                disabled={isProcessingPayment}
                className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700"
              >
                {isProcessingPayment ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Subscribe to {selectedPlan} Plan - ₹{plans[selectedPlan].price}/month
                  </div>
                )}
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                Secure payment powered by Razorpay • Cancel anytime • 30-day billing cycle
              </p>
            </>
          )}
        </div>

        {/* Features Comparison */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h4 className="font-semibold mb-3">What's included in all plans:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-green-500" />
              Task parsing and analysis
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-green-500" />
              Smart timing recommendations
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-green-500" />
              Daily motivation quotes
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-green-500" />
              Basic productivity insights
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}