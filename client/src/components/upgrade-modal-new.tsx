import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Crown, Check, Sparkles, Infinity, Zap } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'pro'>('basic');

  const handleUpgrade = (plan: 'basic' | 'pro') => {
    console.log(`Upgrading to ${plan} plan`);
    // Would integrate with Razorpay payment processing
    alert(`Payment integration for ${plan} plan would be implemented here with Razorpay.`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900" aria-describedby="upgrade-description">
        <DialogHeader className="text-center space-y-4 pb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <div>
            <DialogTitle className="text-3xl font-bold text-gray-900 dark:text-white">
              Choose Your Plan
            </DialogTitle>
            <DialogDescription id="upgrade-description" className="text-gray-600 dark:text-gray-300 mt-2 text-lg">
              Unlock powerful AI features and boost your productivity
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* 3-Tier Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Free Plan */}
          <Card className="border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Free</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">₹0</span>
                  <span className="text-gray-600 dark:text-gray-300">/month</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Perfect for getting started
                </p>
              </div>
              <ul className="space-y-4 mb-6">
                <li className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  3 AI requests per day
                </li>
                <li className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  Basic task management
                </li>
                <li className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  Simple analytics
                </li>
                <li className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  Community support
                </li>
              </ul>
              <Button 
                variant="outline" 
                className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                disabled
              >
                Current Plan
              </Button>
            </CardContent>
          </Card>

          {/* Basic Plan - ₹299 */}
          <Card className="border-2 border-blue-400 dark:border-blue-500 bg-white dark:bg-gray-800 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-blue-500 text-white px-3 py-1 text-sm font-medium">
                Popular Choice
              </Badge>
            </div>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
                  Basic
                  <Zap className="w-5 h-5 text-blue-500" />
                </h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">₹299</span>
                  <span className="text-gray-600 dark:text-gray-300">/month</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Great for regular users
                </p>
              </div>
              <ul className="space-y-4 mb-6">
                <li className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  30 AI requests per month
                </li>
                <li className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  Advanced task management
                </li>
                <li className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  Detailed analytics
                </li>
                <li className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  Smart timing analysis
                </li>
                <li className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  Priority email support
                </li>
              </ul>
              <Button 
                onClick={() => handleUpgrade('basic')}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white border-0 font-semibold py-3"
              >
                Choose Basic Plan
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan - ₹499 */}
          <Card className="border-2 border-gradient-to-r from-amber-400 to-orange-500 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1 text-sm font-medium">
                Best Value
              </Badge>
            </div>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
                  Pro
                  <Crown className="w-5 h-5 text-amber-500" />
                </h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">₹499</span>
                  <span className="text-gray-600 dark:text-gray-300">/month</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  For power users and teams
                </p>
              </div>
              <ul className="space-y-4 mb-6">
                <li className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="flex items-center gap-2">
                    <Infinity className="w-4 h-4 text-purple-500" />
                    Unlimited AI requests
                  </span>
                </li>
                <li className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  Advanced AI insights
                </li>
                <li className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  Smart scheduling & automation
                </li>
                <li className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  Team collaboration features
                </li>
                <li className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  24/7 priority support
                </li>
                <li className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  Custom integrations
                </li>
              </ul>
              <Button 
                onClick={() => handleUpgrade('pro')}
                className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white border-0 font-semibold py-3"
              >
                <Crown className="w-4 h-4 mr-2" />
                Choose Pro Plan
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Additional Benefits Section */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Why upgrade?
          </h4>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Join thousands of productive users who have transformed their workflow with AI-powered task management.
            Cancel anytime. No hidden fees.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}