import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../auth';
import { storage } from '../storage';
import { User } from '@shared/schema';

export type UserTier = 'free' | 'basic' | 'pro';

// Feature tier requirements mapping
export const TIER_FEATURES = {
  // Free tier features (0 cost)
  basic_tasks: ['free', 'basic', 'pro'],
  manual_prioritization: ['free', 'basic', 'pro'],
  basic_streaks: ['free', 'basic', 'pro'],
  
  // Basic tier features (₹299/mo)
  unlimited_tasks: ['basic', 'pro'],
  advanced_task_management: ['basic', 'pro'],
  detailed_analytics: ['basic', 'pro'],
  smart_timing_analysis: ['basic', 'pro'],
  priority_email_support: ['basic', 'pro'],
  
  // Pro tier features (₹499/mo)
  unlimited_ai_calls: ['pro'],
  focus_forecast: ['pro'],
  auto_schedule: ['pro'],
  advanced_integrations: ['pro'],
  priority_support: ['pro'],
  custom_workflows: ['pro'],
} as const;

// Tier limits configuration
export const TIER_LIMITS = {
  free: {
    daily_ai_calls: 3,
    monthly_ai_calls: -1, // No monthly limit for free (daily only)
    monthly_tasks: 20,
  },
  basic: {
    daily_ai_calls: 3, // 3 daily base + monthly pool
    monthly_ai_calls: 100, // 100 AI requests per month
    monthly_tasks: -1, // Unlimited tasks
  },
  pro: {
    daily_ai_calls: -1, // Unlimited
    monthly_ai_calls: -1, // Unlimited
    monthly_tasks: -1, // Unlimited
  },
} as const;

export interface TierCheckOptions {
  feature: keyof typeof TIER_FEATURES;
  dailyLimit?: number;
  monthlyLimit?: number;
}

/**
 * Middleware to check if user's tier allows access to a specific feature
 */
export const checkTier = (options: TierCheckOptions) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ 
          error: 'Unauthorized', 
          message: 'Authentication required' 
        });
      }

      const user = await storage.getUser(req.userId);
      if (!user) {
        return res.status(404).json({ 
          error: 'User not found',
          message: 'User account not found' 
        });
      }

      const userTier = user.tier as UserTier;
      const allowedTiers = TIER_FEATURES[options.feature];

      // Check if user's tier allows this feature
      if (!allowedTiers.includes(userTier)) {
        const requiredTier = allowedTiers[0]; // First tier that has access
        return res.status(403).json({
          error: 'Feature not available',
          message: `This feature requires ${requiredTier.replace('_', ' ')} or higher`,
          feature: options.feature,
          userTier,
          requiredTier,
          upgradeRequired: true,
        });
      }

      // Check daily limits for free tier
      if (userTier === 'free' && options.dailyLimit) {
        const today = new Date();
        const resetTime = user.dailyAiCallsResetAt;
        
        // Reset daily counter if it's a new day
        if (!resetTime || resetTime.toDateString() !== today.toDateString()) {
          await storage.resetDailyLimits(user.id);
          user.dailyAiCalls = 0;
        }

        if (user.dailyAiCalls >= options.dailyLimit) {
          return res.status(429).json({
            error: 'Daily limit exceeded',
            message: `You've reached your daily limit of ${options.dailyLimit} AI calls`,
            dailyLimit: options.dailyLimit,
            used: user.dailyAiCalls,
            upgradeRequired: true,
            resetAt: resetTime,
          });
        }
      }

      // Check monthly limits for free tier
      if (userTier === 'free' && options.monthlyLimit) {
        const now = new Date();
        const resetTime = user.monthlyTaskCountResetAt;
        
        // Reset monthly counter if it's a new month
        if (!resetTime || resetTime.getMonth() !== now.getMonth() || resetTime.getFullYear() !== now.getFullYear()) {
          await storage.resetMonthlyLimits(user.id);
          user.monthlyTaskCount = 0;
        }

        if (user.monthlyTaskCount >= options.monthlyLimit) {
          return res.status(429).json({
            error: 'Monthly limit exceeded',
            message: `You've reached your monthly limit of ${options.monthlyLimit} tasks`,
            monthlyLimit: options.monthlyLimit,
            used: user.monthlyTaskCount,
            upgradeRequired: true,
            resetAt: resetTime,
          });
        }
      }

      // Store user in request for use in route handlers
      req.user = user;
      next();
    } catch (error) {
      console.error('Tier check error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to verify feature access' 
      });
    }
  };
};

/**
 * Middleware to increment usage counters after successful API calls
 */
export const incrementUsage = (type: 'ai_call' | 'task_created') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user && req.user.tier === 'free') {
        if (type === 'ai_call') {
          await storage.incrementDailyAiCalls(req.user.id);
        } else if (type === 'task_created') {
          await storage.incrementMonthlyTaskCount(req.user.id);
        }
      }
      next();
    } catch (error) {
      console.error('Usage increment error:', error);
      // Don't fail the request if usage tracking fails
      next();
    }
  };
};

/**
 * Helper function to get user's feature limits and usage
 */
export const getUserLimits = async (userId: string) => {
  const user = await storage.getUser(userId);
  if (!user) return null;

  const tier = user.tier as UserTier;
  
  if (tier === 'free') {
    return {
      tier,
      dailyAiCalls: {
        limit: FREE_TIER_LIMITS.daily_ai_calls,
        used: user.dailyAiCalls,
        remaining: Math.max(0, FREE_TIER_LIMITS.daily_ai_calls - user.dailyAiCalls),
        resetAt: user.dailyAiCallsResetAt,
      },
      monthlyTasks: {
        limit: FREE_TIER_LIMITS.monthly_tasks,
        used: user.monthlyTaskCount,
        remaining: Math.max(0, FREE_TIER_LIMITS.monthly_tasks - user.monthlyTaskCount),
        resetAt: user.monthlyTaskCountResetAt,
      },
    };
  }

  return {
    tier,
    unlimited: true,
  };
};