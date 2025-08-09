import express from 'express';
import { authenticateToken, optionalAuth, type AuthRequest } from '../auth';
import { storage } from '../storage';

const router = express.Router();

// Helper function to check AI usage limits
function checkAiUsageLimit(user: any): { allowed: boolean; userLimit: number; limitType: 'daily' | 'monthly' | 'unlimited' } {
  if (!user) return { allowed: false, userLimit: 0, limitType: 'daily' };

  // Pro tier - unlimited AI calls (only if subscription is active)
  if (user.tier === 'pro') {
    if (user.subscriptionStatus === 'active') {
      return { allowed: true, userLimit: -1, limitType: 'unlimited' };
    } else {
      // Pro subscription expired, fall back to free tier
      const currentUsage = user.dailyAiCalls || 0;
      const dailyLimit = 3;
      const allowed = currentUsage < dailyLimit;
      return { allowed, userLimit: dailyLimit, limitType: 'daily' };
    }
  }

  // Basic tier - 3 daily + 100 monthly pool (only if subscription is active)
  if (user.tier === 'basic') {
    if (user.subscriptionStatus !== 'active') {
      // Basic subscription expired, fall back to free tier
      const currentUsage = user.dailyAiCalls || 0;
      const dailyLimit = 3;
      const allowed = currentUsage < dailyLimit;
      return { allowed, userLimit: dailyLimit, limitType: 'daily' };
    }
    
    const dailyUsage = user.dailyAiCalls || 0;
    const monthlyUsage = user.monthlyAiCalls || 0;
    const monthlyLimit = 100;
    
    // Check if monthly reset is needed (1st of month)
    const now = new Date();
    const resetDate = new Date(user.monthlyAiCallsResetAt);
    
    if (now.getMonth() !== resetDate.getMonth() || now.getFullYear() !== resetDate.getFullYear()) {
      // Month changed, reset needed but will be handled by incrementMonthlyAiCalls
      const allowed = true; // Allow first call of new month
      return { allowed, userLimit: monthlyLimit, limitType: 'monthly' };
    }
    
    // Basic tier logic: 3 daily + monthly pool
    const allowed = monthlyUsage < monthlyLimit;
    return { allowed, userLimit: monthlyLimit, limitType: 'monthly' };
  }

  // Free tier - 3 AI calls per day (resets daily)
  const currentUsage = user.dailyAiCalls || 0;
  const dailyLimit = 3;
  const allowed = currentUsage < dailyLimit;
  return { allowed, userLimit: dailyLimit, limitType: 'daily' };
}

// AI Chat Assistant endpoint
router.post('/chat', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { message, tasks = [] } = req.body;
    const userId = req.userId!;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check AI usage limits
    const usageCheck = checkAiUsageLimit(user);
    if (!usageCheck.allowed) {
      return res.status(429).json({ 
        error: 'AI usage limit reached',
        userLimit: usageCheck.userLimit,
        limitType: usageCheck.limitType
      });
    }

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Increment AI usage
    await storage.incrementAiUsage(userId);

    // Simple AI response based on task context
    const taskContext = tasks.length > 0 ? 
      `You have ${tasks.length} tasks: ${tasks.map((t: any) => t.title).join(', ')}` : 
      'You currently have no tasks.';

    const aiResponse = `Based on your current tasks, here's my advice: ${taskContext}. I'd suggest focusing on high-priority items first and breaking down complex tasks into smaller steps.`;

    res.json({
      success: true,
      response: aiResponse,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in AI chat:', error);
    res.status(500).json({ error: 'Failed to process AI chat request' });
  }
});

// Task Categorization endpoint
router.post('/categorize-tasks', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { tasks } = req.body;
    const userId = req.userId!;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check AI usage limits
    const usageCheck = checkAiUsageLimit(user);
    if (!usageCheck.allowed) {
      return res.status(429).json({ 
        error: 'AI usage limit reached',
        userLimit: usageCheck.userLimit,
        limitType: usageCheck.limitType
      });
    }

    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ error: 'Tasks array is required' });
    }

    // Increment AI usage
    await storage.incrementAiUsage(userId);

    // Simple categorization logic
    const categorizedTasks = tasks.map((task: any) => {
      const title = task.title?.toLowerCase() || '';
      let category = 'General';
      let priority = 'medium';
      
      if (title.includes('urgent') || title.includes('asap') || title.includes('emergency')) {
        priority = 'high';
        category = 'Urgent';
      } else if (title.includes('meeting') || title.includes('call') || title.includes('discussion')) {
        category = 'Communication';
      } else if (title.includes('code') || title.includes('develop') || title.includes('programming')) {
        category = 'Development';
      } else if (title.includes('design') || title.includes('creative') || title.includes('art')) {
        category = 'Creative';
      } else if (title.includes('research') || title.includes('study') || title.includes('learn')) {
        category = 'Learning';
      } else if (title.includes('admin') || title.includes('paperwork') || title.includes('document')) {
        category = 'Administrative';
      }

      return {
        ...task,
        category,
        priority,
        tags: [category.toLowerCase(), priority],
        aiSuggestions: [`Consider scheduling this ${category.toLowerCase()} task during your most productive hours.`]
      };
    });

    res.json({
      success: true,
      categorizedTasks,
      summary: `Analyzed ${tasks.length} tasks and applied intelligent categorization.`
    });
  } catch (error) {
    console.error('Error categorizing tasks:', error);
    res.status(500).json({ error: 'Failed to categorize tasks' });
  }
});

// Time Analysis endpoint
router.post('/analyze-time', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { tasks } = req.body;
    const userId = req.userId!;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check AI usage limits
    const usageCheck = checkAiUsageLimit(user);
    if (!usageCheck.allowed) {
      return res.status(429).json({ 
        error: 'AI usage limit reached',
        userLimit: usageCheck.userLimit,
        limitType: usageCheck.limitType
      });
    }

    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ error: 'Tasks array is required' });
    }

    // Increment AI usage
    await storage.incrementAiUsage(userId);

    // Simple time analysis
    const currentHour = new Date().getHours();
    let timeRecommendation = 'Good time for general tasks';
    let readinessScore = 75;

    if (currentHour >= 9 && currentHour <= 11) {
      timeRecommendation = 'Peak focus time - ideal for complex tasks';
      readinessScore = 95;
    } else if (currentHour >= 14 && currentHour <= 16) {
      timeRecommendation = 'Good for collaborative and creative work';
      readinessScore = 85;
    } else if (currentHour >= 18 || currentHour <= 8) {
      timeRecommendation = 'Consider lighter tasks or planning';
      readinessScore = 60;
    }

    const analysis = {
      timeRecommendation,
      readinessScore,
      bestTasks: tasks.slice(0, 3).map((task: any) => ({
        ...task,
        recommendedTime: currentHour >= 9 && currentHour <= 11 ? 'Now' : 'Morning (9-11 AM)',
        reason: 'Based on current time and task complexity'
      })),
      focusWindows: [
        {
          start: '09:00',
          end: '11:00',
          type: 'peak',
          activities: ['Complex problem solving', 'Deep work', 'Important decisions']
        },
        {
          start: '14:00',
          end: '16:00',
          type: 'collaborative',
          activities: ['Meetings', 'Creative work', 'Team collaboration']
        }
      ]
    };

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Error analyzing time:', error);
    res.status(500).json({ error: 'Failed to analyze optimal timing' });
  }
});

export default router;