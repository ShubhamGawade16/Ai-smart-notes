import React from 'react';
import { X, Star, Zap, Calendar, Brain, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  userTier: 'free' | 'basic_pro' | 'advanced_pro' | 'premium_pro';
  reason: string;
}

const TIER_FEATURES = {
  basic_pro: {
    name: 'Basic Pro',
    price: '₹199/month',
    color: 'bg-blue-600',
    icon: <Zap className="w-5 h-5" />,
    features: [
      'Unlimited AI-powered task parsing',
      'Smart task optimization',
      'No ads',
      'Gmail & Outlook integration',
      'Advanced productivity insights',
      'Unlimited tasks',
    ],
  },
  advanced_pro: {
    name: 'Advanced Pro',
    price: '₹499/month',
    color: 'bg-purple-600',
    icon: <Brain className="w-5 h-5" />,
    features: [
      'Everything in Basic Pro',
      'Focus Forecast with peak performance windows',
      'AI auto-scheduling to calendar',
      'Zoom & Meet integration',
      'Burnout prediction & prevention',
      'Advanced habit tracking',
    ],
  },
  premium_pro: {
    name: 'Premium Pro',
    price: '₹799/month',
    color: 'bg-gradient-to-r from-purple-600 to-pink-600',
    icon: <Star className="w-5 h-5" />,
    features: [
      'Everything in Advanced Pro',
      '7-day Focus Forecast heat-map',
      'Slack & Teams integration',
      'Custom webhooks & API access',
      'Priority support',
      'Advanced analytics dashboard',
      'Team collaboration features',
    ],
  },
};

const PSYCHOLOGICAL_NUDGES = {
  time_saved: "Pro users save 42 minutes daily on average ✨",
  completion_rate: "82% of Pro users complete 30% more tasks",
  focus_improvement: "Advanced Pro users report 67% better focus",
  productivity_boost: "Premium users see 3x productivity improvement",
};

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  feature,
  userTier,
  reason,
}) => {
  // Determine which tier to recommend based on current tier and feature
  const getRecommendedTier = () => {
    if (userTier === 'free') {
      if (feature.includes('focus_forecast') || feature.includes('auto_schedule')) {
        return 'advanced_pro';
      }
      if (feature.includes('slack') || feature.includes('teams') || feature.includes('webhook')) {
        return 'premium_pro';
      }
      return 'basic_pro';
    }
    if (userTier === 'basic_pro') {
      if (feature.includes('slack') || feature.includes('teams') || feature.includes('webhook')) {
        return 'premium_pro';
      }
      return 'advanced_pro';
    }
    return 'premium_pro';
  };

  const recommendedTier = getRecommendedTier();
  const tierInfo = TIER_FEATURES[recommendedTier];

  const handleUpgrade = () => {
    // This would integrate with Stripe for actual payments
    window.open('https://billing.example.com/upgrade?tier=' + recommendedTier, '_blank');
  };

  const getRandomNudge = () => {
    const nudges = Object.values(PSYCHOLOGICAL_NUDGES);
    return nudges[Math.floor(Math.random() * nudges.length)];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {tierInfo.icon}
            Upgrade to {tierInfo.name}
          </DialogTitle>
          <DialogDescription>
            {reason}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Social Proof */}
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm text-center">
            <TrendingUp className="w-4 h-4 inline mr-1" />
            {getRandomNudge()}
          </div>

          {/* Pricing */}
          <div className={`${tierInfo.color} text-white p-4 rounded-lg text-center`}>
            <div className="text-2xl font-bold">{tierInfo.price}</div>
            <div className="text-sm opacity-90">
              {userTier === 'free' && '7-day free trial included'}
            </div>
          </div>

          {/* Features */}
          <div className="space-y-2">
            <h4 className="font-semibold">What you'll get:</h4>
            <ul className="space-y-1 text-sm">
              {tierInfo.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Loss Aversion */}
          {userTier === 'free' && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded-lg text-sm">
              <div className="font-medium text-yellow-800 dark:text-yellow-200">
                Limited Time: 50% off first month
              </div>
              <div className="text-yellow-600 dark:text-yellow-300">
                Join 5,000+ productivity enthusiasts
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleUpgrade}
              className={`flex-1 ${tierInfo.color} hover:opacity-90`}
            >
              Start {userTier === 'free' ? 'Free Trial' : 'Upgrade'}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Maybe Later
            </Button>
          </div>

          {/* Trust Signals */}
          <div className="text-xs text-gray-500 text-center space-y-1">
            <div className="flex items-center justify-center gap-1">
              <Users className="w-3 h-3" />
              Trusted by 5,000+ users
            </div>
            <div>Cancel anytime • 30-day money-back guarantee</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};