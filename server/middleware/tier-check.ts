import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../auth';
import { storage } from '../storage';
import { User } from '@shared/schema';

export type UserTier = 'free' | 'basic_pro' | 'advanced_pro' | 'premium_pro';

// Feature tier requirements mapping
export const TIER_FEATURES = {
  // Free tier features
  basic_tasks: ['free', 'basic_pro', 'advanced_pro', 'premium_pro'],
  manual_prioritization: ['free', 'basic_pro', 'advanced_pro', 'premium_pro'],
  basic_streaks: ['free', 'basic_pro', 'advanced_pro', 'premium_pro'],
  
  // Basic Pro features (₹199/mo)
  unlimited_tasks: ['basic_pro', 'advanced_pro', 'premium_pro'],
  unlimited_ai_calls: ['basic_pro', 'advanced_pro', 'premium_pro'],
  no_ads: ['basic_pro', 'advanced_pro', 'premium_pro'],
  gmail_integration: ['basic_pro', 'advanced_pro', 'premium_pro'],
  outlook_integration: ['basic_pro', 'advanced_pro', 'premium_pro'],
  advanced_streaks: ['basic_pro', 'advanced_pro', 'premium_pro'],
  
  // Advanced Pro features (₹499/mo)
  focus_forecast: ['advanced_pro', 'premium_pro'],
  auto_schedule: ['advanced_pro', 'premium_pro'],
  zoom_integration: ['advanced_pro', 'premium_pro'],
  meet_integration: ['advanced_pro', 'premium_pro'],
  burnout_prediction: ['advanced_pro', 'premium_pro'],
  
  // Premium Pro features (₹799/mo)
  focus_forecast_7day: ['premium_pro'],
  slack_integration: ['premium_pro'],
  teams_integration: ['premium_pro'],
  custom_webhooks: ['premium_pro'],
  priority_support: ['premium_pro'],
  advanced_analytics: ['premium_pro'],
} as const;

// Daily limits for free tier
export const FREE_TIER_LIMITS = {
  daily_ai_calls: 5,
  monthly_tasks: 50,
  conversational_refiner_calls: 5,
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