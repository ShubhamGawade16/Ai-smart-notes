import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap, Crown } from "lucide-react";

interface PricingPlan {
  name: string;
  price: string;
  originalPrice?: string;
  description: string;
  features: string[];
  popular?: boolean;
  buttonText: string;
  buttonVariant: "default" | "outline" | "secondary";
  tier: "free" | "basic" | "pro";
}

const PRICING_PLANS: PricingPlan[] = [
  {
    name: "Free",
    price: "₹0",
    description: "Perfect for getting started with AI productivity",
    features: [
      "3 AI requests per day",
      "Basic task management",
      "Smart categorization",
      "Email reminders",
      "Mobile web access",
      "Community support"
    ],
    buttonText: "Current Plan",
    buttonVariant: "outline",
    tier: "free"
  },
  {
    name: "Basic Pro",
    price: "₹299",
    originalPrice: "₹399",
    description: "Ideal for busy professionals and small teams",
    features: [
      "30 AI requests per day",
      "Advanced task breakdown",
      "Smart timing analysis",
      "Priority insights",
      "Calendar integration",
      "Email support",
      "Dark mode",
      "Export capabilities"
    ],
    popular: true,
    buttonText: "Upgrade to Basic",
    buttonVariant: "default",
    tier: "basic"
  },
  {
    name: "Premium Pro",
    price: "₹499",
    originalPrice: "₹699",
    description: "For power users who want unlimited AI assistance",
    features: [
      "Unlimited AI requests",
      "Predictive focus forecasting",
      "Auto-scheduling",
      "Personalized optimization",
      "Advanced analytics",
      "Priority support",
      "API access",
      "Team collaboration",
      "Custom integrations"
    ],
    buttonText: "Upgrade to Premium",
    buttonVariant: "secondary",
    tier: "pro"
  }
];

interface PricingPlansProps {
  currentTier?: string;
  onUpgrade?: (tier: string) => void;
  compact?: boolean;
}

export function PricingPlans({ currentTier = "free", onUpgrade, compact = false }: PricingPlansProps) {
  return (
    <div className={`grid gap-6 ${compact ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-3'}`}>
      {PRICING_PLANS.map((plan) => (
        <Card 
          key={plan.tier}
          className={`relative transition-all duration-300 ${
            plan.popular 
              ? 'ring-2 ring-teal-500 shadow-lg scale-105' 
              : 'hover:shadow-md hover:scale-102'
          } ${
            currentTier === plan.tier 
              ? 'bg-teal-50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-800' 
              : ''
          }`}
        >
          {plan.popular && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1">
                <Star className="w-3 h-3 mr-1" />
                Most Popular
              </Badge>
            </div>
          )}

          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center mb-2">
              {plan.tier === "free" && <Zap className="w-5 h-5 text-gray-500 mr-2" />}
              {plan.tier === "basic" && <Star className="w-5 h-5 text-teal-600 mr-2" />}
              {plan.tier === "pro" && <Crown className="w-5 h-5 text-yellow-600 mr-2" />}
              <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
            </div>
            
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {plan.price}
              </span>
              {plan.originalPrice && (
                <span className="text-lg text-gray-400 line-through">
                  {plan.originalPrice}
                </span>
              )}
              {plan.price !== "₹0" && (
                <span className="text-gray-600 dark:text-gray-400">/month</span>
              )}
            </div>

            {plan.originalPrice && (
              <div className="flex justify-center mt-2">
                <Badge variant="destructive" className="text-xs">
                  Save {Math.round(((parseInt(plan.originalPrice.slice(1)) - parseInt(plan.price.slice(1))) / parseInt(plan.originalPrice.slice(1))) * 100)}%
                </Badge>
              </div>
            )}

            <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
              {plan.description}
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <ul className="space-y-3">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            <div className="pt-4">
              <Button
                className="w-full"
                variant={currentTier === plan.tier ? "outline" : plan.buttonVariant}
                disabled={currentTier === plan.tier}
                onClick={() => onUpgrade?.(plan.tier)}
              >
                {currentTier === plan.tier ? "Current Plan" : plan.buttonText}
              </Button>
            </div>

            {plan.tier === "basic" && (
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Perfect for most users
                </p>
              </div>
            )}

            {plan.tier === "pro" && (
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Everything you need to stay organized
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}