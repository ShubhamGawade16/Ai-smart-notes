import express from 'express';
import { authenticateToken, type AuthRequest } from '../auth';
import { aiCreditsScheduler } from '../services/ai-credits-scheduler';
import { storage } from '../storage';

// Admin UIDs for server-side verification
const ADMIN_UIDS = new Set([
  '0ab26ef3-4581-477a-8e21-283bb366cc5e', // shubhamgawadegd@gmail.com
  '3ad86f62-9487-4a68-923d-6270bc2f9823', // shubhamchandangawade63@gmail.com  
  '47a468f4-13b6-4757-aed8-cf967086020d', // contact.hypervox@gmail.com
  'edf14b32-f0ff-476e-8b8d-df0a25a748c5'  // yanoloj740@elobits.com
]);

// Admin verification middleware for this module
const requireAdmin = (req: AuthRequest, res: any, next: any) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Check admin status using Supabase user ID if available
  const supabaseUserId = (req as any).supabaseUserId;
  const userIdToCheck = supabaseUserId || req.userId;
  
  if (!ADMIN_UIDS.has(userIdToCheck)) {
    console.log(`🚫 Admin access denied for AI credits test: ${userIdToCheck}`);
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  console.log(`✅ Admin access granted for AI credits test: ${userIdToCheck}`);
  next();
};

const router = express.Router();

// TESTING ENDPOINTS - Only for admin users
// These endpoints allow testing the AI credits reset functionality

/**
 * Force reset AI credits for testing (Admin only)
 */
router.post('/force-reset/:userId', authenticateToken, requireAdmin, async (req: AuthRequest, res: any) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const result = await aiCreditsScheduler.forceResetForTesting(userId);
    
    res.json({
      success: true,
      message: 'Credits force reset for testing',
      userId,
      userEmail: user.email,
      resetTime: new Date().toISOString(),
      result
    });
  } catch (error) {
    console.error('Force reset error:', error);
    res.status(500).json({ error: 'Failed to force reset credits' });
  }
});

/**
 * Set custom timer for testing (Admin only)
 */
router.post('/set-test-timer/:userId', authenticateToken, requireAdmin, async (req: AuthRequest, res: any) => {
  try {
    const { userId } = req.params;
    const { minutes = 1 } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.tier !== 'free') {
      return res.status(400).json({ 
        error: 'Test timer only applicable for free tier users',
        currentTier: user.tier 
      });
    }
    
    const result = aiCreditsScheduler.setTestingTimer(userId, Number(minutes));
    
    res.json({
      success: true,
      message: `Test timer set for ${minutes} minutes`,
      userId,
      userEmail: user.email,
      currentCredits: user.dailyAiCalls || 0,
      timerMinutes: minutes,
      resetTime: result.resetTime,
      result
    });
  } catch (error) {
    console.error('Set test timer error:', error);
    res.status(500).json({ error: 'Failed to set test timer' });
  }
});

/**
 * Get timer status for a user (Admin only)
 */
router.get('/timer-status/:userId', authenticateToken, requireAdmin, async (req: AuthRequest, res: any) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const activeTimers = aiCreditsScheduler.getActiveTimers();
    const hasTimer = activeTimers.some(timer => timer.userId === userId);
    
    res.json({
      success: true,
      userId,
      userEmail: user.email,
      tier: user.tier,
      currentCredits: user.dailyAiCalls || 0,
      maxDailyCredits: user.tier === 'free' ? 3 : (user.tier === 'basic' ? 100 : -1),
      hasActiveTimer: hasTimer,
      lastResetAt: user.dailyAiCallsResetAt,
      allActiveTimers: activeTimers.length,
      resetApplicable: user.tier === 'free'
    });
  } catch (error) {
    console.error('Timer status error:', error);
    res.status(500).json({ error: 'Failed to get timer status' });
  }
});

/**
 * Get all active timers (Admin only)
 */
router.get('/all-timers', authenticateToken, requireAdmin, async (req: AuthRequest, res: any) => {
  try {
    const activeTimers = aiCreditsScheduler.getActiveTimers();
    const allUsers = await storage.getAllUsers();
    
    const freeUsers = allUsers.filter(user => user.tier === 'free');
    const freeUsersWithCredits = freeUsers.filter(user => (user.dailyAiCalls || 0) > 0);
    
    res.json({
      success: true,
      summary: {
        totalActiveTimers: activeTimers.length,
        totalFreeUsers: freeUsers.length,
        freeUsersWithCredits: freeUsersWithCredits.length,
        freeUsersWithoutTimer: freeUsersWithCredits.filter(user => 
          !activeTimers.some(timer => timer.userId === user.id)
        ).length
      },
      activeTimers,
      freeUsersData: freeUsersWithCredits.map(user => ({
        id: user.id,
        email: user.email,
        credits: user.dailyAiCalls || 0,
        lastReset: user.dailyAiCallsResetAt,
        hasTimer: activeTimers.some(timer => timer.userId === user.id)
      }))
    });
  } catch (error) {
    console.error('All timers error:', error);
    res.status(500).json({ error: 'Failed to get timer information' });
  }
});

/**
 * Manually trigger timer initialization for all users (Admin only)
 */
router.post('/initialize-all-timers', authenticateToken, requireAdmin, async (req: AuthRequest, res: any) => {
  try {
    // This will re-initialize timers for all users
    const allUsers = await storage.getAllUsers();
    const freeUsers = allUsers.filter(user => user.tier === 'free' && (user.dailyAiCalls || 0) > 0);
    
    let initialized = 0;
    for (const user of freeUsers) {
      try {
        aiCreditsScheduler.scheduleUserReset(user.id, user.tier);
        initialized++;
      } catch (error) {
        console.error(`Failed to initialize timer for user ${user.id}:`, error);
      }
    }
    
    res.json({
      success: true,
      message: `Initialized timers for ${initialized} free users`,
      totalFreeUsers: freeUsers.length,
      initialized,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Initialize all timers error:', error);
    res.status(500).json({ error: 'Failed to initialize timers' });
  }
});

export { router as aiCreditsTest };