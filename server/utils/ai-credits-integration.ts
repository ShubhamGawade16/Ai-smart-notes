/**
 * AI Credits Integration Utility
 * 
 * This utility handles the integration between AI service calls and the credit scheduler
 * to ensure proper 24-hour reset cycles for free tier users.
 */

import { storage } from '../storage';

/**
 * Trigger AI credits reset timer when a free user makes their first AI call
 * This is called from storage.incrementDailyAiCalls to ensure the timer starts
 * exactly when needed.
 * 
 * @param userId - The user ID
 * @param userTier - The user's current tier
 * @param dailyCount - The new daily AI calls count
 */
export async function handleFirstAiCallOfDay(userId: string, userTier: string, dailyCount: number) {
  if (userTier === 'free' && dailyCount === 1) {
    try {
      // Dynamic import to avoid circular dependencies
      const { aiCreditsScheduler } = await import('../services/ai-credits-scheduler');
      
      // Schedule the 24-hour reset
      aiCreditsScheduler.scheduleUserReset(userId, userTier);
      
      console.log(`🕐 AI Credits: Started 24-hour reset timer for free user ${userId} (first call of the day)`);
    } catch (error) {
      console.error(`❌ AI Credits: Failed to start timer for user ${userId}:`, error);
    }
  }
}

/**
 * Check if a user needs AI credits reset based on time elapsed
 * This is used for initialization and recovery scenarios
 * 
 * @param userId - The user ID
 * @returns boolean indicating if reset is needed
 */
export async function shouldResetUserCredits(userId: string): Promise<boolean> {
  try {
    const user = await storage.getUser(userId);
    if (!user || user.tier !== 'free') return false;
    
    const now = new Date().getTime();
    const lastResetTime = user.dailyAiCallsResetAt ? new Date(user.dailyAiCallsResetAt).getTime() : now;
    const timeSinceReset = now - lastResetTime;
    
    // Reset if more than 24 hours have passed
    return timeSinceReset >= (24 * 60 * 60 * 1000);
  } catch (error) {
    console.error(`❌ AI Credits: Error checking reset status for user ${userId}:`, error);
    return false;
  }
}

/**
 * Manually reset credits and restart timer for a user
 * This is used for testing and recovery scenarios
 * 
 * @param userId - The user ID
 * @returns Promise<boolean> - Success status
 */
export async function resetUserCreditsAndRestartTimer(userId: string): Promise<boolean> {
  try {
    const user = await storage.getUser(userId);
    if (!user) return false;
    
    // Reset the credits
    await storage.resetDailyLimits(userId);
    
    // Restart timer if user is on free tier
    if (user.tier === 'free') {
      const { aiCreditsScheduler } = await import('../services/ai-credits-scheduler');
      aiCreditsScheduler.scheduleUserReset(userId, user.tier);
      console.log(`🔄 AI Credits: Reset and restarted timer for user ${userId}`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ AI Credits: Failed to reset and restart timer for user ${userId}:`, error);
    return false;
  }
}