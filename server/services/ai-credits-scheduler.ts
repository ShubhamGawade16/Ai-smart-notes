import { storage } from '../storage';
import cron from 'node-cron';

// AI Credits Scheduler Service
// Handles 24-hour reset cycles for free tier users

class AiCreditsScheduler {
  private resetTimers: Map<string, NodeJS.Timeout> = new Map();
  private isRunning: boolean = false;

  constructor() {
    this.startService();
  }

  /**
   * Start the AI credits scheduler service
   */
  startService() {
    if (this.isRunning) return;
    
    console.log('🔄 Starting AI Credits Scheduler Service...');
    this.isRunning = true;

    // Initialize existing users' timers on startup
    this.initializeExistingUsers();

    // Run cleanup every hour to remove expired timers
    setInterval(() => {
      this.cleanupExpiredTimers();
    }, 60 * 60 * 1000); // 1 hour
  }

  /**
   * Schedule 24-hour reset for a specific user
   */
  scheduleUserReset(userId: string, tier: string = 'free') {
    // Only schedule reset for free tier users
    if (tier !== 'free') {
      this.clearUserReset(userId);
      return;
    }

    // Clear existing timer if any
    this.clearUserReset(userId);

    // Schedule reset in 24 hours
    const resetTimer = setTimeout(async () => {
      try {
        console.log(`🔄 Resetting AI credits for free user: ${userId}`);
        await this.resetUserCredits(userId);
        
        // Schedule next reset (continuous cycle)
        this.scheduleUserReset(userId, 'free');
      } catch (error) {
        console.error(`❌ Failed to reset credits for user ${userId}:`, error);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours

    this.resetTimers.set(userId, resetTimer);
    console.log(`✅ Scheduled 24h AI credit reset for user: ${userId}`);
  }

  /**
   * Reset AI credits for a user
   */
  private async resetUserCredits(userId: string) {
    try {
      const user = await storage.getUser(userId);
      if (!user) return;

      // Only reset if user is still on free tier
      if (user.tier === 'free') {
        await storage.updateUser(userId, {
          dailyAiCalls: 0,
          dailyAiCallsResetAt: new Date(),
        });
        console.log(`✅ AI credits reset to 0 for free user: ${userId}`);
      } else {
        // User upgraded, clear their timer
        this.clearUserReset(userId);
        console.log(`ℹ️ User ${userId} upgraded from free tier, removing reset timer`);
      }
    } catch (error) {
      console.error(`❌ Error resetting credits for user ${userId}:`, error);
    }
  }

  /**
   * Clear scheduled reset for a user
   */
  clearUserReset(userId: string) {
    const existingTimer = this.resetTimers.get(userId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.resetTimers.delete(userId);
      console.log(`🗑️ Cleared reset timer for user: ${userId}`);
    }
  }

  /**
   * Initialize timers for existing users
   */
  private async initializeExistingUsers() {
    try {
      const users = await storage.getAllUsers();
      
      for (const user of users) {
        if (user.tier === 'free' && user.dailyAiCalls && user.dailyAiCalls > 0) {
          // Calculate remaining time until next reset
          const resetTime = new Date(user.dailyAiCallsResetAt || new Date()).getTime();
          const now = new Date().getTime();
          const timeUntilReset = (resetTime + (24 * 60 * 60 * 1000)) - now;
          
          if (timeUntilReset > 0) {
            // Schedule reset for remaining time
            const resetTimer = setTimeout(async () => {
              await this.resetUserCredits(user.id);
              this.scheduleUserReset(user.id, user.tier);
            }, Math.min(timeUntilReset, 24 * 60 * 60 * 1000));
            
            this.resetTimers.set(user.id, resetTimer);
            console.log(`📅 Restored timer for user ${user.id}, reset in ${Math.round(timeUntilReset / (60 * 1000))} minutes`);
          } else {
            // Reset time already passed, reset immediately and schedule new cycle
            await this.resetUserCredits(user.id);
            this.scheduleUserReset(user.id, user.tier);
          }
        }
      }
      
      console.log(`✅ Initialized timers for ${this.resetTimers.size} free tier users`);
    } catch (error) {
      console.error('❌ Error initializing user timers:', error);
    }
  }

  /**
   * Clean up expired or invalid timers
   */
  private cleanupExpiredTimers() {
    console.log(`🧹 Running timer cleanup... (${this.resetTimers.size} active timers)`);
  }

  /**
   * Get status of all active timers (for debugging)
   */
  getActiveTimers(): Array<{userId: string, hasTimer: boolean}> {
    const timers: Array<{userId: string, hasTimer: boolean}> = [];
    for (const [userId] of this.resetTimers) {
      timers.push({ userId, hasTimer: true });
    }
    return timers;
  }

  /**
   * Force reset credits for testing (TESTING ONLY)
   */
  async forceResetForTesting(userId: string) {
    console.log(`🧪 TESTING: Force resetting credits for user: ${userId}`);
    await this.resetUserCredits(userId);
    
    // Reschedule the timer
    const user = await storage.getUser(userId);
    if (user) {
      this.scheduleUserReset(userId, user.tier);
    }
    
    return { success: true, message: 'Credits reset for testing' };
  }

  /**
   * Set custom reset timer for testing (in minutes instead of 24 hours)
   */
  setTestingTimer(userId: string, minutes: number = 1) {
    console.log(`🧪 TESTING: Setting ${minutes}-minute timer for user: ${userId}`);
    
    // Clear existing timer
    this.clearUserReset(userId);

    // Set short timer for testing
    const resetTimer = setTimeout(async () => {
      try {
        console.log(`🧪 TESTING: Resetting AI credits for user: ${userId} after ${minutes} minutes`);
        await this.resetUserCredits(userId);
        
        // Don't reschedule after test reset
        console.log(`🧪 TESTING: Test reset complete for user: ${userId}`);
      } catch (error) {
        console.error(`❌ Test reset failed for user ${userId}:`, error);
      }
    }, minutes * 60 * 1000);

    this.resetTimers.set(userId, resetTimer);
    console.log(`✅ Test timer set: ${minutes} minutes for user: ${userId}`);
    
    return { 
      success: true, 
      message: `Test timer set for ${minutes} minutes`,
      resetTime: new Date(Date.now() + (minutes * 60 * 1000)).toISOString()
    };
  }

  /**
   * Stop the service (for graceful shutdown)
   */
  stopService() {
    console.log('🛑 Stopping AI Credits Scheduler Service...');
    
    // Clear all timers
    for (const [userId, timer] of this.resetTimers) {
      clearTimeout(timer);
    }
    this.resetTimers.clear();
    this.isRunning = false;
    
    console.log('✅ AI Credits Scheduler Service stopped');
  }
}

// Export singleton instance
export const aiCreditsScheduler = new AiCreditsScheduler();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📡 Received SIGTERM, stopping AI credits scheduler...');
  aiCreditsScheduler.stopService();
});

process.on('SIGINT', () => {
  console.log('📡 Received SIGINT, stopping AI credits scheduler...');
  aiCreditsScheduler.stopService();
});