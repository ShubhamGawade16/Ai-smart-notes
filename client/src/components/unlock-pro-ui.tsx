import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Lock, 
  Crown, 
  Sparkles, 
  Zap, 
  ArrowRight, 
  Star,
  Check,
  X
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";

interface UnlockProUIProps {
  feature: string;
  description?: string;
  onUpgrade?: () => void;
  onClose?: () => void;
  variant?: "modal" | "inline" | "banner";
}

export function UnlockProUI({ 
  feature, 
  description, 
  onUpgrade, 
  onClose,
  variant = "modal" 
}: UnlockProUIProps) {
  const { user } = useAuth();
  const { subscriptionStatus } = useSubscription();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleUpgrade = () => {
    setIsAnimating(true);
    setTimeout(() => {
      onUpgrade?.();
    }, 300);
  };

  const proFeatures = [
    "Unlimited AI requests",
    "Smart timing analysis", 
    "Advanced task breakdown",
    "Priority insights",
    "Calendar integration",
    "Export capabilities"
  ];

  if (variant === "banner") {
    return (
      <div className="bg-gradient-to-r from-teal-50 to-blue-50 dark:from-teal-950/30 dark:to-blue-950/30 border border-teal-200 dark:border-teal-800 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900 rounded-full flex items-center justify-center">
              <Crown className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Unlock {feature}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {description || "Upgrade to Pro for unlimited access"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {subscriptionStatus.dailyAiUsage}/{subscriptionStatus.dailyAiLimit} used
            </Badge>
            <Button size="sm" onClick={handleUpgrade}>
              Upgrade Now
            </Button>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <Card className="border-2 border-dashed border-teal-300 dark:border-teal-700 bg-teal-50/50 dark:bg-teal-950/20">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-teal-600" />
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">{feature}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {description || "Available with Pro subscription"}
              </p>
            </div>
          </div>
          <Button size="sm" onClick={handleUpgrade}>
            <Crown className="w-4 h-4 mr-2" />
            Unlock
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Modal variant (default)
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className={`w-full max-w-lg transform transition-all duration-300 ${
        isAnimating ? 'scale-95 opacity-50' : 'scale-100 opacity-100'
      }`}>
        <CardHeader className="text-center relative">
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
          
          <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="w-10 h-10 text-white" />
          </div>
          
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Unlock {feature}
          </CardTitle>
          
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {description || "You've reached your daily AI limit. Upgrade to Pro for unlimited access!"}
          </p>

          <div className="flex items-center justify-center gap-2 mt-4">
            <Badge variant="outline" className="text-xs">
              Current: {subscriptionStatus.dailyAiUsage}/{subscriptionStatus.dailyAiLimit} AI requests
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Current vs Pro Comparison */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Free Plan</h4>
              <div className="text-2xl font-bold text-red-600 mb-2">3</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">AI requests/day</p>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-950/30 dark:to-blue-950/30 rounded-lg border-2 border-teal-200 dark:border-teal-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Pro Plan</h4>
              <div className="text-2xl font-bold text-teal-600 mb-2 flex items-center justify-center">
                <Zap className="w-6 h-6 mr-1" />
                ∞
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Unlimited requests</p>
            </div>
          </div>

          {/* Pro Features */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <Sparkles className="w-4 h-4 mr-2 text-teal-600" />
              What you'll get with Pro:
            </h4>
            <ul className="space-y-2">
              {proFeatures.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pricing */}
          <div className="bg-gradient-to-r from-teal-50 to-blue-50 dark:from-teal-950/30 dark:to-blue-950/30 rounded-lg p-4 text-center">
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">₹499</span>
              <span className="text-gray-600 dark:text-gray-400">/month</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Billed monthly • Cancel anytime
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              className="flex-1 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700"
              onClick={handleUpgrade}
              disabled={isAnimating}
            >
              {isAnimating ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Crown className="w-4 h-4 mr-2" />
              )}
              Upgrade to Pro
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Maybe Later
              </Button>
            )}
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              ✨ Start your productivity transformation today
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}