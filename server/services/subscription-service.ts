import { storage } from '../storage';

interface SubscriptionStatus {
  tier: 'free' | 'basic' | 'pro';
  isActive: boolean;
  subscriptionEndDate?: Date;
  daysRemaining: number;
  dailyAiCalls: number;
  monthlyAiCalls: number;
  frozenProCredits: number;
}

interface AiUsageCheck {
  allowed: boolean;
  tier: 'free' | 'basic' | 'pro';
  used: number;
  limit: number;
  remaining: number;
  resetTime?: Date;
  message?: string;
}

export class SubscriptionService {
  // Upgrade user to Basic plan (30 days)
  async upgradeUserToBasic(userId: string, paymentId: string) {
    const now = new Date();
    const endDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days from now

    return await storage.updateUser(userId, {
      tier: 'basic',
      subscriptionStatus: 'active', // CRITICAL: Enable subscription logic
      subscriptionStartDate: now,
      subscriptionEndDate: endDate,
      razorpayCustomerId: paymentId, // Store payment reference
      // Reset AI usage for immediate benefits
      dailyAiCalls: 0,
      monthlyAiCalls: 0,
      dailyAiCallsResetAt: now,
      monthlyAiCallsResetAt: now,
    });
  }

  // Upgrade user to Pro plan (30 days)
  async upgradeUserToPro(userId: string, paymentId: string) {
    const now = new Date();
    const endDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days from now

    return await storage.updateUser(userId, {
      tier: 'pro',
      subscriptionStatus: 'active', // CRITICAL: Enable subscription logic
      subscriptionStartDate: now,
      subscriptionEndDate: endDate,
      razorpayCustomerId: paymentId, // Store payment reference
      // Reset AI usage for immediate benefits
      dailyAiCalls: 0,
      monthlyAiCalls: 0,
      dailyAiCallsResetAt: now,
      monthlyAiCallsResetAt: now,
    });
  }

  // Downgrade user to free plan (called by automated process)
  async downgradeToFree(userId: string) {
    const user = await storage.getUser(userId);
    if (!user) throw new Error('User not found');

    // If downgrading from Pro, freeze remaining monthly credits
    let frozenCredits = 0;
    if (user.tier === 'pro') {
      const monthlyUsage = user.monthlyAiCalls || 0;
      frozenCredits = Math.max(0, 100 - monthlyUsage); // Freeze unused monthly credits
    }

    return await storage.updateUser(userId, {
      tier: 'free',
      subscriptionStatus: null, // Disable subscription logic for free users
      subscriptionStartDate: null,
      subscriptionEndDate: null,
      frozenProCredits: frozenCredits,
      // Keep daily usage but reset limits
      dailyAiCalls: Math.min(user.dailyAiCalls || 0, 3), // Cap at free limit
    });
  }

  // Restore frozen Pro credits when user upgrades back to Pro
  async restoreFrozenCredits(userId: string) {
    const user = await storage.getUser(userId);
    if (!user || user.frozenProCredits === 0) return;

    return await storage.updateUser(userId, {
      monthlyAiCalls: user.frozenProCredits,
      frozenProCredits: 0,
    });
  }

  // Get comprehensive subscription status
  async getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
    const user = await storage.getUser(userId);
    if (!user) throw new Error('User not found');

    const now = new Date();
    const tier = user.tier || 'free';
    
    let isActive = false;
    let daysRemaining = 0;

    // Check if subscription is active
    if (user.subscriptionEndDate) {
      isActive = now < user.subscriptionEndDate;
      if (isActive) {
        const diffTime = user.subscriptionEndDate.getTime() - now.getTime();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
    }

    // Auto-downgrade if subscription expired
    if (tier !== 'free' && !isActive) {
      await this.downgradeToFree(userId);
      const updatedUser = await storage.getUser(userId);
      return {
        tier: 'free',
        isActive: false,
        daysRemaining: 0,
        dailyAiCalls: updatedUser?.dailyAiCalls || 0,
        monthlyAiCalls: updatedUser?.monthlyAiCalls || 0,
        frozenProCredits: updatedUser?.frozenProCredits || 0,
      };
    }

    return {
      tier,
      isActive,
      subscriptionEndDate: user.subscriptionEndDate,
      daysRemaining,
      dailyAiCalls: user.dailyAiCalls || 0,
      monthlyAiCalls: user.monthlyAiCalls || 0,
      frozenProCredits: user.frozenProCredits || 0,
    };
  }

  // Check if user can use AI features and return detailed usage info
  async canUseAI(userId: string): Promise<AiUsageCheck> {
    const user = await storage.getUser(userId);
    if (!user) throw new Error('User not found');

    const now = new Date();
    const tier = user.tier || 'free';
    
    // Check if subscription is active for paid tiers
    const subscriptionActive = !user.subscriptionEndDate || now < user.subscriptionEndDate;
    if ((tier === 'basic' || tier === 'pro') && !subscriptionActive) {
      // Auto-downgrade expired subscriptions
      await this.downgradeToFree(userId);
      return this.canUseAI(userId); // Recursively check with updated tier
    }

    // Handle resets
    const dailyResetTime = user.dailyAiCallsResetAt ? new Date(user.dailyAiCallsResetAt) : new Date();
    const shouldResetDaily = now.getTime() - dailyResetTime.getTime() > 24 * 60 * 60 * 1000;

    if (shouldResetDaily) {
      await storage.updateUser(userId, {
        dailyAiCalls: 0,
        dailyAiCallsResetAt: now,
      });
      user.dailyAiCalls = 0;
    }

    const dailyUsage = user.dailyAiCalls || 0;

    // Pro users - unlimited (always allowed)
    if (tier === 'pro' && subscriptionActive) {
      return {
        allowed: true,
        tier: 'pro',
        used: dailyUsage,
        limit: -1, // Unlimited
        remaining: -1, // Unlimited
        message: 'Pro plan - unlimited AI usage',
      };
    }

    // Basic users - 3 daily + 100 monthly with rollover
    if (tier === 'basic' && subscriptionActive) {
      const monthlyResetTime = user.monthlyAiCallsResetAt ? new Date(user.monthlyAiCallsResetAt) : new Date();
      const shouldResetMonthly = now.getMonth() !== monthlyResetTime.getMonth() || now.getFullYear() !== monthlyResetTime.getFullYear();
      
      if (shouldResetMonthly) {
        await storage.updateUser(userId, {
          monthlyAiCalls: 0,
          monthlyAiCallsResetAt: new Date(now.getFullYear(), now.getMonth(), 1),
        });
        user.monthlyAiCalls = 0;
      }

      const monthlyUsage = user.monthlyAiCalls || 0;
      
      // Daily credits first, then monthly pool
      if (dailyUsage < 3) {
        return {
          allowed: true,
          tier: 'basic',
          used: dailyUsage,
          limit: 3,
          remaining: 3 - dailyUsage,
          resetTime: new Date(now.getTime() + (24 * 60 * 60 * 1000)),
          message: 'Using daily credits',
        };
      } else if (monthlyUsage < 100) {
        return {
          allowed: true,
          tier: 'basic',
          used: monthlyUsage,
          limit: 100,
          remaining: 100 - monthlyUsage,
          resetTime: new Date(now.getFullYear(), now.getMonth() + 1, 1),
          message: 'Using monthly credits',
        };
      } else {
        return {
          allowed: false,
          tier: 'basic',
          used: monthlyUsage,
          limit: 100,
          remaining: 0,
          message: 'Monthly limit reached - upgrade to Pro for unlimited',
        };
      }
    }

    // Free users - 3 daily
    const freeLimit = 3;
    return {
      allowed: dailyUsage < freeLimit,
      tier: 'free',
      used: dailyUsage,
      limit: freeLimit,
      remaining: Math.max(0, freeLimit - dailyUsage),
      resetTime: new Date(now.getTime() + (24 * 60 * 60 * 1000)),
      message: dailyUsage >= freeLimit ? 'Daily limit reached - upgrade for more' : 'Free plan',
    };
  }

  // Automated subscription management (called by cron job)
  async processExpiredSubscriptions() {
    const users = await storage.getAllUsers();
    const now = new Date();
    let processedCount = 0;

    for (const user of users) {
      if (user.subscriptionEndDate && now > user.subscriptionEndDate && user.tier !== 'free') {
        await this.downgradeToFree(user.id);
        processedCount++;
        console.log(`📉 Auto-downgraded user ${user.id} from ${user.tier} to free`);
      }
    }

    console.log(`🔄 Processed ${processedCount} expired subscriptions`);
    return processedCount;
  }
}

export const subscriptionService = new SubscriptionService();