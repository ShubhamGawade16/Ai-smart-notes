import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Crown, CheckCircle, Zap, Clock } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export default function UpgradePage() {
  const { user } = useAuth();
  const { 
    plans, 
    subscription, 
    handlePayment, 
    isProcessingPayment,
    isPro,
    isBasic,
    usage,
    isFree
  } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'pro'>('pro');

  if (isPro) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-green-600">
              Already Pro! 🎉
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              You already have an active Pro subscription. Enjoy unlimited access to all features!
            </p>
            <Link href="/dashboard">
              <Button className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!plans) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const handleSubscribe = async () => {
    await handlePayment(selectedPlan);
    // Redirect to dashboard after successful payment - just like View Plans
    window.location.href = "/dashboard";
  };

  const currentTier = subscription?.tier || 'free';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Choose Your Plan
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Unlock AI-powered productivity features with a simple monthly subscription
            </p>
          </div>
          
          <div className="w-24" /> {/* Spacer for center alignment */}
        </div>

        {/* Current Usage Display */}
        {usage && (
          <div className="mb-6 p-4 bg-teal-50 dark:bg-teal-950/20 rounded-lg border border-teal-200 dark:border-teal-800 max-w-4xl mx-auto">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
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
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-bold">₹499</span>
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
        <div className="flex flex-col gap-4 mt-6 max-w-4xl mx-auto">
          {currentTier === selectedPlan ? (
            <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-green-800 dark:text-green-200 font-medium">
                You're currently on the {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} plan
              </p>
            </div>
          ) : (
            <Button
              onClick={handleSubscribe}
              disabled={isProcessingPayment}
              className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white py-6 text-lg"
            >
              {isProcessingPayment ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  Processing Payment...
                </div>
              ) : (
                <>
                  <Crown className="w-5 h-5 mr-2" />
                  Subscribe to {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} - {selectedPlan === 'basic' ? '₹299' : '₹499'}/month
                </>
              )}
            </Button>
          )}
          
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              🔒 Secure payments powered by Razorpay<br/>
              Cancel anytime • 30-day money-back guarantee
            </p>
          </div>
        </div>

        {/* Features Comparison */}
        <div className="mt-16">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-center text-xl font-bold">
                Why Upgrade to Pro?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-red-600 mb-4">Free Plan Limitations</h4>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li>• Only 3 AI requests per day</li>
                    <li>• Basic task management</li>
                    <li>• Limited features</li>
                    <li>• No priority support</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-teal-600 mb-4">Pro Plan Benefits</h4>
                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <li>• Unlimited AI task analysis</li>
                    <li>• Smart timing & scheduling</li>
                    <li>• Advanced task categorization</li>
                    <li>• Export capabilities</li>
                    <li>• Priority support</li>
                    <li>• No daily usage limits</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security & Trust */}
        <div className="mt-12 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 dark:text-green-400 text-xl">🔒</span>
              </div>
              <h4 className="font-semibold mb-2">Secure Payments</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your payment data is encrypted and secure with Razorpay
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 dark:text-blue-400 text-xl">↩️</span>
              </div>
              <h4 className="font-semibold mb-2">Cancel Anytime</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No long-term commitments. Cancel your subscription anytime
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-yellow-600 dark:text-yellow-400 text-xl">💰</span>
              </div>
              <h4 className="font-semibold mb-2">Money-back Guarantee</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                30-day money-back guarantee if you're not satisfied
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}