import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import RazorpayPayment from "@/components/razorpay-payment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function UpgradePage() {
  const { user } = useAuth();
  const { subscriptionStatus } = useSubscription();

  const handlePaymentSuccess = () => {
    // Payment successful - redirect to dashboard
    window.location.href = "/dashboard";
  };

  const handlePaymentError = (error: string) => {
    console.error("Payment error:", error);
  };

  if (subscriptionStatus.isPremium) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-green-600">
              Already Premium! 🎉
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              You already have an active premium subscription. Enjoy unlimited access to all features!
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
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
              Upgrade Your Planify Experience
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Current usage: {subscriptionStatus.dailyAiUsage}/{subscriptionStatus.dailyAiLimit} AI requests today
            </p>
          </div>
          
          <div className="w-24" /> {/* Spacer for center alignment */}
        </div>

        {/* Payment Component */}
        <RazorpayPayment
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          userEmail={user?.email}
        />

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
                    <li>• Limited analytics</li>
                    <li>• No team collaboration</li>
                    <li>• No integrations</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-teal-600 mb-4">Pro Plan Benefits</h4>
                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <li>• Unlimited AI task analysis</li>
                    <li>• Smart timing & scheduling</li>
                    <li>• Advanced productivity insights</li>
                    <li>• Team collaboration tools</li>
                    <li>• Calendar & app integrations</li>
                    <li>• Priority support</li>
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