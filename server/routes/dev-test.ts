import express from 'express';
import { storage } from '../storage';
import { aiCreditsScheduler } from '../services/ai-credits-scheduler';

const router = express.Router();

// Simple testing endpoint for development (no auth required)
// This is for quick testing without authentication issues

/**
 * Quick test - Set 1 minute timer for current admin user
 */
router.post('/quick-1min-timer', async (req, res) => {
  try {
    console.log('🧪 QUICK TEST: Setting 1-minute timer for current admin user');
    
    // Find admin user (you)
    const users = await storage.getAllUsers();
    const adminUser = users.find(u => u.email === 'shubhamchandangawade63@gmail.com');
    
    if (!adminUser) {
      return res.status(404).json({ error: 'Admin user not found' });
    }
    
    console.log(`📊 Before: ${adminUser.email} has ${adminUser.dailyAiCalls || 0} credits`);
    
    // Set 1-minute timer
    const result = aiCreditsScheduler.setTestingTimer(adminUser.id, 1);
    
    res.json({
      success: true,
      message: '1-minute timer set for admin user',
      userEmail: adminUser.email,
      userId: adminUser.id,
      currentCredits: adminUser.dailyAiCalls || 0,
      timerResult: result
    });
  } catch (error) {
    console.error('Quick test error:', error);
    res.status(500).json({ error: 'Failed to set quick timer' });
  }
});

/**
 * Quick force reset for current admin user
 */
router.post('/quick-force-reset', async (req, res) => {
  try {
    console.log('🧪 QUICK TEST: Force reset for current admin user');
    
    // Find admin user (you)
    const users = await storage.getAllUsers();
    const adminUser = users.find(u => u.email === 'shubhamchandangawade63@gmail.com');
    
    if (!adminUser) {
      return res.status(404).json({ error: 'Admin user not found' });
    }
    
    console.log(`📊 Before: ${adminUser.email} has ${adminUser.dailyAiCalls || 0} credits`);
    
    // Force reset
    const result = await aiCreditsScheduler.forceResetForTesting(adminUser.id);
    
    // Get updated user data
    const updatedUser = await storage.getUser(adminUser.id);
    
    res.json({
      success: true,
      message: 'Credits force reset for admin user',
      userEmail: adminUser.email,
      userId: adminUser.id,
      creditsAfter: updatedUser?.dailyAiCalls || 0,
      resetResult: result
    });
  } catch (error) {
    console.error('Quick reset error:', error);
    res.status(500).json({ error: 'Failed to force reset' });
  }
});

/**
 * Check current status
 */
router.get('/status', async (req, res) => {
  try {
    const users = await storage.getAllUsers();
    const adminUser = users.find(u => u.email === 'shubhamchandangawade63@gmail.com');
    const activeTimers = aiCreditsScheduler.getActiveTimers();
    
    res.json({
      adminUser: adminUser ? {
        email: adminUser.email,
        id: adminUser.id,
        tier: adminUser.tier,
        credits: adminUser.dailyAiCalls || 0,
        lastReset: adminUser.dailyAiCallsResetAt
      } : null,
      activeTimers: activeTimers.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

export default router;