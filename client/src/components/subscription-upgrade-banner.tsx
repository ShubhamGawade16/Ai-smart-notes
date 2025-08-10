import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Crown, Zap, ArrowRight, X } from 'lucide-react';
import { useSubscription } from '@/hooks/use-subscription';
import { SubscriptionModal } from './subscription-modal';

export function SubscriptionUpgradeBanner() {
  const [showModal, setShowModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { subscription, usage, isFree, isBasic, canUseAI } = useSubscription();
  
  console.log('🔵 SubscriptionUpgradeBanner render:', { showModal, dismissed, isFree, isBasic });
  
  // Handle loading state
  if (!subscription) {
    return null;
  }

  // Don't show banner if dismissed or already Pro
  if (dismissed || subscription.tier === 'pro') {
    return null;
  }

  // Show different messages based on usage
  let bannerContent;
  
  if (!canUseAI && usage) {
    // User has hit their limit
    bannerContent = {
      icon: <Zap className="w-5 h-5 text-amber-500" />,
      title: "Daily limit reached",
      description: isFree 
        ? "Upgrade to Basic (₹299/month) or Pro (₹599/month) for more AI interactions"
        : "Upgrade to Pro (₹599/month) for 100 monthly credits with rollover",
      urgency: "high",
      cta: isFree ? "Upgrade Now" : "Upgrade to Pro"
    };
  } else if (usage && isFree && (usage.remaining ?? 0) <= 1) {
    // Free user almost at limit
    bannerContent = {
      icon: <Zap className="w-5 h-5 text-orange-500" />,
      title: "Almost at daily limit",
      description: `${usage.remaining ?? 0} AI interaction${(usage.remaining ?? 0) === 1 ? '' : 's'} remaining today`,
      urgency: "medium",
      cta: "Upgrade for More"
    };
  } else if (usage && isBasic && usage.type === 'daily' && (usage.remaining ?? 0) <= 1) {
    // Basic user almost at daily limit
    bannerContent = {
      icon: <Crown className="w-5 h-5 text-purple-500" />,
      title: "Upgrade to Pro",
      description: "Get 100 monthly credits with rollover for unlimited productivity",
      urgency: "low",
      cta: "Upgrade to Pro"
    };
  } else if (isFree) {
    // General free user upgrade prompt
    bannerContent = {
      icon: <Crown className="w-5 h-5 text-teal-500" />,
      title: "Unlock AI-powered productivity",
      description: "Upgrade to Basic or Pro for enhanced AI features and more interactions",
      urgency: "low",
      cta: "View Plans"
    };
  } else {
    // Don't show banner for other cases
    return null;
  }

  const getBannerStyles = () => {
    switch (bannerContent.urgency) {
      case 'high':
        return "bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border-red-200 dark:border-red-800";
      case 'medium':
        return "bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border-amber-200 dark:border-amber-800";
      default:
        return "bg-gradient-to-r from-teal-50 to-blue-50 dark:from-teal-950/20 dark:to-blue-950/20 border-teal-200 dark:border-teal-800";
    }
  };

  return (
    <>
      <Card className={`mb-6 ${getBannerStyles()}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              {bannerContent.icon}
              <div className="flex-1">
                <h3 className="font-semibold text-sm">
                  {bannerContent.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {bannerContent.description}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              <Button 
                size="sm" 
                onClick={() => {
                  console.log('🔵 View Plans button clicked, opening modal...');
                  setShowModal(true);
                }}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                {bannerContent.cta}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setDismissed(true)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <SubscriptionModal
        isOpen={showModal}
        onOpenChange={(open) => {
          console.log('🔵 Modal state change:', open);
          setShowModal(open);
        }}
        defaultPlan={isFree ? 'basic' : 'pro'}
      />
    </>
  );
}