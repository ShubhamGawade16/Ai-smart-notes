import express from 'express';
import { AIService } from '../ai';
import { authenticateToken, optionalAuth, type AuthRequest } from '../auth';
import { storage } from '../storage';
import * as aiService from '../services/ai-service';

const router = express.Router();
const legacyAiService = new AIService();

// Helper function to check AI usage limits
async function checkAiUsageLimits(user: any) {
  if (!user) return { allowed: false, userLimit: 0, limitType: 'daily' };

  // Pro tier: unlimited
  if (user.tier === 'pro') {
    return { allowed: true, userLimit: -1, limitType: 'unlimited' };
  }

  // Basic tier: 3 daily + 100 monthly
  if (user.tier === 'basic') {
    const currentUsage = user.dailyAiCalls || 0;
    const dailyLimit = 3;
    
    if (currentUsage < dailyLimit) {
      const allowed = currentUsage < dailyLimit;
      return { allowed, userLimit: dailyLimit, limitType: 'daily' };
    }
    
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
  
  // Default to free tier limits
  const currentUsage = user.dailyAiCalls || 0;
  const dailyLimit = 3;
  const allowed = currentUsage < dailyLimit;
  return { allowed, userLimit: dailyLimit, limitType: 'daily' };
}

// Natural Language Task Parsing - Core Phase 3 feature
router.post('/parse-task', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { input } = req.body;
    const userId = req.userId!;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!input || typeof input !== 'string') {
      return res.status(400).json({ error: 'Task input is required' });
    }

    // Use AI service to parse natural language into structured task
    const taskData = await aiService.parseNaturalLanguageTask(input, user.tier || 'free');

    res.json({
      success: true,
      analysis: {
        title: taskData.title,
        description: taskData.description || '',
        priority: taskData.priority || 'medium',
        category: taskData.categories?.[0] || 'General',
        tags: taskData.tags || [],
        estimatedTime: taskData.estimatedTime || 30,
        dueDate: taskData.dueDate || null,
      },
    });
  } catch (error) {
    console.error('Task parsing error:', error);
    res.status(500).json({ error: 'Failed to parse task' });
  }
});

// Task Refinement - Conversational AI feature (PREMIUM - consumes 1 credit)
router.post('/refine-task', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { originalTask, userQuery, context } = req.body;
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get the actual database user (the auth middleware does this lookup)
    const user = req.user;
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!originalTask || !userQuery) {
      return res.status(400).json({ error: 'Original task and user query are required' });
    }

    console.log(`🧠 Task refiner request for user: ${userId}`);

    // Check and increment AI usage based on tier
    const dailyUsage = user.dailyAiCalls || 0;
    const monthlyUsage = user.monthlyAiCalls || 0;
    const tier = user.tier || 'free';
    const isActiveSubscription = user.subscriptionStatus === 'active';
    
    // Tier-based limits
    let shouldBlock = false;
    let errorMessage = '';
    
    if (tier === 'pro' && isActiveSubscription) {
      // Pro tier: Unlimited AI
      console.log(`✅ Task refiner: Pro tier unlimited usage for user ${userId}`);
    } else if (tier === 'basic' && isActiveSubscription) {
      // Basic tier: 100 monthly calls
      if (monthlyUsage >= 100) {
        shouldBlock = true;
        errorMessage = `AI usage limit reached. You've used ${monthlyUsage}/100 monthly AI calls. Upgrade to Pro (₹599/month) for unlimited usage.`;
      } else {
        console.log(`✅ Task refiner: Basic tier usage OK - ${monthlyUsage}/100 monthly`);
      }
    } else {
      // Free tier: 3 daily calls
      if (dailyUsage >= 3) {
        shouldBlock = true;
        errorMessage = `AI usage limit reached. You've used ${dailyUsage}/3 daily AI calls. Upgrade to Basic (₹299/month) or Pro (₹599/month) for more usage.`;
      } else {
        console.log(`✅ Task refiner: Free tier usage OK - ${dailyUsage}/3 daily`);
      }
    }
    
    if (shouldBlock) {
      console.log(`❌ Task refiner: Usage limit reached for user ${userId} (${tier} tier)`);
      return res.status(429).json({ error: errorMessage });
    }
    
    // Increment usage directly
    await storage.updateUser(userId, {
      dailyAiCalls: dailyUsage + 1,
      monthlyAiCalls: monthlyUsage + 1,
      dailyAiCallsResetAt: user.dailyAiCallsResetAt || new Date(),
      monthlyAiCallsResetAt: user.monthlyAiCallsResetAt || new Date()
    });
    
    console.log(`✅ Task refiner: Usage incremented for ${tier} tier user ${userId}`);
    
    // Schedule 24-hour reset for free tier users when they make their first AI call
    if (tier === 'free' && dailyUsage === 0) {
      // Import scheduler dynamically to avoid circular dependencies
      import('../services/ai-credits-scheduler').then(({ aiCreditsScheduler }) => {
        aiCreditsScheduler.scheduleUserReset(userId, tier);
        console.log(`🕐 Started 24-hour reset timer for free user: ${userId}`);
      });
    }

    // Use AI service for real task refinement
    const refinementResult = await aiService.refineTask(originalTask, userQuery, context);
    
    console.log(`✅ Task refiner: Returning refinement for "${originalTask}"`);
    
    return res.json({
      success: true,
      refinedTasks: refinementResult.refinedTasks,
      explanation: refinementResult.explanation,
      suggestions: refinementResult.suggestions,
    });
  } catch (error) {
    console.error('Task refinement error:', error);
    res.status(500).json({ error: 'Failed to refine task' });
  }
});

// Smart Task Optimization
router.post('/optimize-tasks', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { taskIds } = req.body;
    const userId = req.userId!;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!taskIds || !Array.isArray(taskIds)) {
      return res.status(400).json({ error: 'Task IDs array is required' });
    }

    // Fetch tasks from storage
    const tasks = [];
    for (const id of taskIds) {
      const task = await storage.getTask(userId, id);
      if (task) {
        tasks.push(task);
      }
    }

    const optimization = await aiService.optimizeSchedule(tasks, user.tier || 'free');

    res.json({
      success: true,
      optimizedTasks: optimization.optimizedTasks,
      insights: optimization.insights,
    });
  } catch (error) {
    console.error('Task optimization error:', error);
    res.status(500).json({ error: 'Failed to optimize tasks' });
  }
});

// Productivity Insights Generation
router.get('/insights', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get user's recent tasks and notes
    const userTasks = await storage.getTasks(userId);
    const userNotes = await storage.getNotes(userId);

    const insights = await aiService.generateProductivityInsights(userTasks, userNotes, user.tier || 'free');

    res.json({
      success: true,
      insights,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Insights generation error:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

// Focus Forecast - Advanced feature
router.get('/focus-forecast', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const { days = 3 } = req.query;
    const forecastDays = Math.min(Number(days), user.tier === 'premium_pro' ? 7 : 3);
    
    // Generate mock focus sessions for demo (in real app, this would come from tracking)
    const mockFocusSessions = Array.from({ length: 30 }, (_, i) => ({
      id: `session-${i}`,
      userId,
      taskId: `task-${i}`,
      startTime: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() - i * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      actualDuration: 120,
      distractionCount: Math.floor(Math.random() * 5),
      productivityScore: 0.7 + Math.random() * 0.3,
    }));

    const forecast = await aiService.generateFocusForecast(userId, user.tier || 'free', mockFocusSessions);

    res.json({
      success: true,
      forecast,
      forecastDays,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Focus forecast error:', error);
    res.status(500).json({ error: 'Failed to generate focus forecast' });
  }
});

// Productivity Insights - Core AI feature
router.get('/insights', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || 'demo-user';
    const tasks = await storage.getTasks(userId);
    const notes = await storage.getNotes(userId);
    
    // Use the AI service for real insights
    const insights = await aiService.generateProductivityInsights(tasks, notes, 'basic_pro');
    
    res.json({ success: true, insights, generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

// Focus forecast endpoint
router.get('/focus-forecast3', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const mockData = {
      peakFocusWindows: [
        {
          start: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          end: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
          confidence: 0.85
        }
      ],
      suggestedBreaks: [
        { time: '15:00', duration: 10, reason: 'Afternoon energy refresh' }
      ],
      burnoutRisk: {
        level: 'low' as const,
        factors: ['Consistent work patterns'],
        recommendations: ['Maintain current pace']
      }
    };
    
    res.json(mockData);
  } catch (error) {
    console.error('Error generating focus forecast:', error);
    res.status(500).json({ error: 'Failed to generate focus forecast' });
  }
});

// Mind Map AI Chat endpoint
router.post('/mind-map-chat', optionalAuth, async (req, res) => {
  try {
    const { tasks, query } = req.body;
    
    if (!tasks || !query) {
      return res.status(400).json({ 
        error: "tasks and query are required" 
      });
    }

    // Import the analyzeMindMap function
    const { analyzeMindMap } = await import("../services/openai-service");
    const advice = await analyzeMindMap(tasks, query);
    
    res.json({ advice });
  } catch (error) {
    console.error("Error analyzing mind map:", error);
    res.status(500).json({ 
      error: "Failed to analyze mind map",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;