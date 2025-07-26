import Stripe from 'stripe';
import { User } from '@shared/schema';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2024-06-20',
});

export interface PricingTier {
  id: string;
  name: string;
  displayName: string;
  price: number; // in paise
  stripePriceId: string;
  features: string[];
  limits: {
    monthlyTasks: number;
    dailyAiCalls: number;
    integrations: string[];
    hasAds: boolean;
  };
}

export const PRICING_TIERS: Record<string, PricingTier> = {
  free: {
    id: 'free',
    name: 'free',
    displayName: 'Free',
    price: 0,
    stripePriceId: '',
    features: [
      'Basic todo lists',
      'Manual prioritization',
      'Unlimited tasks (with ads)',
      '5 AI insights per day',
      'Basic habit tracking'
    ],
    limits: {
      monthlyTasks: 50,
      dailyAiCalls: 5,
      integrations: [],
      hasAds: true
    }
  },
  basic_pro: {
    id: 'basic_pro',
    name: 'basic_pro',
    displayName: 'Basic Pro',
    price: 19900, // ₹199
    stripePriceId: process.env.STRIPE_BASIC_PRO_PRICE_ID || 'price_basic_pro',
    features: [
      'Everything in Free',
      'No ads',
      'Unlimited tasks',
      '50 AI insights per day',
      'Google Calendar integration',
      'Gmail/Outlook integration',
      'Advanced habit tracking'
    ],
    limits: {
      monthlyTasks: -1,
      dailyAiCalls: 50,
      integrations: ['google_calendar', 'gmail', 'outlook'],
      hasAds: false
    }
  },
  advanced_pro: {
    id: 'advanced_pro',
    name: 'advanced_pro',
    displayName: 'Advanced Pro',
    price: 49900, // ₹499
    stripePriceId: process.env.STRIPE_ADVANCED_PRO_PRICE_ID || 'price_advanced_pro',
    features: [
      'Everything in Basic Pro',
      '200 AI insights per day',
      'Focus Forecast (3-day ahead)',
      'Auto-Schedule to Calendar',
      'Meeting summary import (Zoom/Meet)',
      'Advanced analytics',
      'Habit gamification with rewards'
    ],
    limits: {
      monthlyTasks: -1,
      dailyAiCalls: 200,
      integrations: ['google_calendar', 'gmail', 'outlook', 'zoom', 'meet'],
      hasAds: false
    }
  },
  premium_pro: {
    id: 'premium_pro',
    name: 'premium_pro',
    displayName: 'Premium Pro',
    price: 79900, // ₹799
    stripePriceId: process.env.STRIPE_PREMIUM_PRO_PRICE_ID || 'price_premium_pro',
    features: [
      'Everything in Advanced Pro',
      'Unlimited AI insights',
      'Focus Forecast (7-day heat-map)',
      'Slack/MS Teams integration',
      'Custom webhooks',
      'Priority support',
      'Advanced ML personalizations'
    ],
    limits: {
      monthlyTasks: -1,
      dailyAiCalls: -1,
      integrations: ['google_calendar', 'gmail', 'outlook', 'zoom', 'meet', 'slack', 'teams', 'webhook'],
      hasAds: false
    }
  }
};

export const createCheckoutSession = async (
  user: User,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> => {
  return await stripe.checkout.sessions.create({
    customer_email: user.email,
    metadata: {
      userId: user.id,
    },
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    subscription_data: {
      trial_period_days: user.isTrialUsed ? 0 : 7, // 7-day trial for new users
    },
  });
};

export const handleWebhook = async (
  event: Stripe.Event,
  storage: any
): Promise<void> => {
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.userId && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        
        const tier = getTierFromPriceId(subscription.items.data[0].price.id);
        
        await storage.updateUser(session.metadata.userId, {
          tier,
          subscriptionId: subscription.id,
          subscriptionStatus: 'active',
          subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
          isTrialUsed: true,
        });
      }
      break;

    case 'invoice.payment_succeeded':
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(
          invoice.subscription as string
        );
        
        // Find user by subscription ID
        const user = await storage.getUserBySubscriptionId(subscription.id);
        if (user) {
          await storage.updateUser(user.id, {
            subscriptionStatus: 'active',
            subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
          });
        }
      }
      break;

    case 'invoice.payment_failed':
      const failedInvoice = event.data.object as Stripe.Invoice;
      if (failedInvoice.subscription) {
        const user = await storage.getUserBySubscriptionId(failedInvoice.subscription as string);
        if (user) {
          await storage.updateUser(user.id, {
            subscriptionStatus: 'past_due',
          });
        }
      }
      break;

    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object as Stripe.Subscription;
      const user = await storage.getUserBySubscriptionId(deletedSubscription.id);
      if (user) {
        await storage.updateUser(user.id, {
          tier: 'free',
          subscriptionId: null,
          subscriptionStatus: null,
          subscriptionCurrentPeriodEnd: null,
        });
      }
      break;
  }
};

const getTierFromPriceId = (priceId: string): string => {
  for (const tier of Object.values(PRICING_TIERS)) {
    if (tier.stripePriceId === priceId) {
      return tier.name;
    }
  }
  return 'free';
};

export const generateUpgradeNudge = (user: User, context: string): string => {
  const nudges = {
    ai_limit_reached: `You've used all ${PRICING_TIERS[user.tier].limits.dailyAiCalls} AI insights today! Upgrade to Basic Pro for 50 daily insights - just ₹6.60/day ✨`,
    task_limit_reached: `You've reached your 50 monthly tasks! Upgrade to unlock unlimited tasks and remove ads for ₹6.60/day 🚀`,
    after_completion: `Great job completing that task! 82% of Pro users complete 30% more tasks with our AI insights. Ready to supercharge your productivity?`,
    focus_time: `You've been focused for 42 minutes today ✨ Pro users get personalized Focus Forecasts to maximize their peak hours!`,
    streak_milestone: `Amazing 7-day streak! 🔥 Pro users unlock advanced habit rewards and get 2x XP boosts. Keep the momentum going!`
  };

  return nudges[context as keyof typeof nudges] || nudges.after_completion;
};

export const shouldShowTrial = (user: User): boolean => {
  if (user.isTrialUsed || user.tier !== 'free') {
    return false;
  }

  // Trigger trial after 3 days of consistent usage
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  
  return user.createdAt <= threeDaysAgo && user.currentStreak >= 3;
};