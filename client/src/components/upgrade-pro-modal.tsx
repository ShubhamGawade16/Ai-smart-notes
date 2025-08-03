import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Crown, 
  Check, 
  X, 
  Sparkles, 
  Brain, 
  Zap, 
  Target, 
  Calendar, 
  BarChart3,
  Users,
  Shield,
  Infinity
} from 'lucide-react';

interface UpgradeProModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpgradeProModal({ isOpen, onClose }: UpgradeProModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');

  const features = [
    {
      icon: <Infinity className="w-5 h-5" />,
      title: "Unlimited AI Requests",
      description: "No daily limits on AI-powered task suggestions and analysis",
      free: "3/day",
      pro: "Unlimited"
    },
    {
      icon: <Brain className="w-5 h-5" />,
      title: "Advanced AI Task Analysis",
      description: "Get detailed insights and priority recommendations for your tasks",
      free: false,
      pro: true
    },
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: "Personalized AI Motivation",
      description: "AI-generated quotes based on your progress and tasks",
      free: false,
      pro: true
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: "Enhanced Task Management",
      description: "Better task organization with categories and tags",
      free: "Basic",
      pro: "Advanced"
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Priority Support",
      description: "24/7 premium support with faster response times",
      free: "Community",
      pro: "Priority"
    }
  ];

  const handleUpgrade = () => {
    // This would integrate with actual payment processing like Stripe
    console.log(`Upgrading to ${selectedPlan} plan`);
    
    // Simulate payment gateway redirect
    window.open('https://checkout.stripe.com/demo', '_blank');
    
    // Show success message
    alert('Payment gateway integration would be implemented here. This would redirect to Stripe checkout.');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center space-y-4 pb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <div>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-purple-600 bg-clip-text text-transparent">
              Upgrade to Planify Pro
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400 mt-2">
              Unlock powerful AI features and boost your productivity
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Pricing Toggle */}
        <div className="flex items-center justify-center mb-8">
          <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg flex">
            <button
              onClick={() => setSelectedPlan('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                selectedPlan === 'monthly'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedPlan('yearly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all relative ${
                selectedPlan === 'yearly'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Yearly
              <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1 py-0">
                Save 20%
              </Badge>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Free Plan */}
          <Card className="border-2 border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Free</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">$0</span>
                  <span className="text-gray-600 dark:text-gray-400">/month</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Perfect for getting started
                </p>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  3 AI requests per day
                </li>
                <li className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Basic task management
                </li>
                <li className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Simple analytics
                </li>
                <li className="flex items-center text-sm text-gray-500">
                  <X className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                  Advanced AI features
                </li>
                <li className="flex items-center text-sm text-gray-500">
                  <X className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                  Team collaboration
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="border-2 border-teal-500 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-teal-500 to-purple-500 text-white px-3 py-1">
                Most Popular
              </Badge>
            </div>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center justify-center gap-2">
                  Pro
                  <Crown className="w-5 h-5 text-yellow-500" />
                </h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    ${selectedPlan === 'monthly' ? '5' : '4'}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">/month</span>
                  {selectedPlan === 'yearly' && (
                    <div className="text-sm text-green-600 dark:text-green-400">
                      Billed annually ($48/year)
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  For power users and teams
                </p>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Unlimited AI requests
                </li>
                <li className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Advanced AI insights
                </li>
                <li className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Smart scheduling
                </li>
                <li className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Team collaboration
                </li>
                <li className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Priority support
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Features Comparison */}
        <div className="border-t pt-8">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 text-center">
            Complete Feature Comparison
          </h4>
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className="text-teal-600 dark:text-teal-400">
                    {feature.icon}
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white">
                      {feature.title}
                    </h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-8">
                  <div className="text-center min-w-[80px]">
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Free</div>
                    {typeof feature.free === 'string' ? (
                      <span className="text-sm text-gray-700 dark:text-gray-300">{feature.free}</span>
                    ) : feature.free ? (
                      <Check className="w-4 h-4 text-green-500 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-gray-400 mx-auto" />
                    )}
                  </div>
                  <div className="text-center min-w-[80px]">
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Pro</div>
                    {typeof feature.pro === 'string' ? (
                      <span className="text-sm font-medium text-teal-600 dark:text-teal-400">{feature.pro}</span>
                    ) : feature.pro ? (
                      <Check className="w-4 h-4 text-green-500 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-gray-400 mx-auto" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center space-x-4 pt-8 border-t">
          <Button variant="outline" onClick={onClose} className="px-8">
            Maybe Later
          </Button>
          <Button
            onClick={handleUpgrade}
            className="px-8 bg-gradient-to-r from-teal-500 to-purple-500 hover:from-teal-600 hover:to-purple-600 text-white"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to Pro
          </Button>
        </div>

        {/* Trust Badges */}
        <div className="text-center pt-6 border-t">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            ✓ Cancel anytime ✓ Secure payment ✓ Instant access
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}