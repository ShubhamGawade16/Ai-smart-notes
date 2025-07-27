import express from 'express';
import { AIService } from '../ai';
import { authenticateToken, type AuthRequest } from '../auth';
import { storage } from '../storage';

const router = express.Router();
const aiService = new AIService();

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

// Task Refinement - Conversational AI feature
router.post('/refine-task', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { originalTask, userQuery, context } = req.body;
    const userId = req.userId!;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!originalTask || !userQuery) {
      return res.status(400).json({ error: 'Original task and user query are required' });
    }

    const refinement = await aiService.refineTask(originalTask, userQuery, user.tier || 'free');
    
    res.json({
      success: true,
      refinedTasks: [{
        title: refinement.refinedTask,
        description: refinement.refinedTask,
        priority: 'medium',
        category: 'General',
        tags: [],
        estimatedTime: 30,
        subtasks: refinement.decomposition || [],
      }],
      explanation: `Task refined based on your request: "${userQuery}"`,
      suggestions: refinement.suggestions,
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

export default router;