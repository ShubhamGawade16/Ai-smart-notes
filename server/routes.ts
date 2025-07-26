import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  authenticateToken, 
  optionalAuth, 
  checkTier, 
  checkAiUsage, 
  checkTaskLimit,
  generateToken,
  comparePassword,
  type AuthRequest 
} from "./auth";
import { aiService } from "./services/ai";
import { gamificationService } from "./services/gamification";
import { 
  createCheckoutSession, 
  handleWebhook, 
  PRICING_TIERS, 
  generateUpgradeNudge,
  shouldShowTrial 
} from "./services/subscription";
import { 
  insertTaskSchema, 
  updateTaskSchema,
  insertNoteSchema,
  updateNoteSchema,
  insertHabitSchema,
  loginSchema,
  registerSchema
} from "@shared/schema";
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2024-06-20',
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Make storage available to middleware
  app.set('storage', storage);

  // ============================================================================
  // AUTHENTICATION ROUTES
  // ============================================================================

  // Supabase auth sync endpoint
  app.post('/api/auth/sync', async (req: AuthRequest, res) => {
    try {
      const { id, email, firstName, lastName, profileImageUrl } = req.body;
      
      if (!id || !email) {
        return res.status(400).json({ error: 'Missing required user data' });
      }

      // Create or update user in our database
      const user = await storage.upsertUser({
        id,
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        profileImageUrl: profileImageUrl || null,
      });

      res.json({ user });
    } catch (error) {
      console.error('Auth sync error:', error);
      res.status(500).json({ error: 'Failed to sync user' });
    }
  });

  // Register new user
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      const user = await storage.createUser(userData);
      const token = generateToken(user.id);

      // Log registration event
      await storage.logUsageEvent(user.id, 'user_registered', { tier: user.tier });

      res.status(201).json({
        user: { ...user, passwordHash: undefined }, // Don't send password hash
        token,
        message: 'Registration successful'
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(400).json({ error: error.message || 'Registration failed' });
    }
  });

  // Login user
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = await comparePassword(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = generateToken(user.id);

      // Log login event
      await storage.logUsageEvent(user.id, 'user_login', { tier: user.tier });

      res.json({
        user: { ...user, passwordHash: undefined },
        token,
        message: 'Login successful'
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(400).json({ error: error.message || 'Login failed' });
    }
  });

  // Get current user profile
  app.get('/api/auth/user', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      
      // Check for trial eligibility
      const showTrial = shouldShowTrial(user);
      
      res.json({
        ...user,
        passwordHash: undefined,
        showTrialOffer: showTrial,
        tier: user.tier,
        limits: PRICING_TIERS[user.tier].limits
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to fetch user profile' });
    }
  });

  // Update user profile
  app.patch('/api/auth/user', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const updates = req.body;
      delete updates.id; // Prevent ID changes
      delete updates.passwordHash; // Prevent direct password changes
      delete updates.tier; // Prevent tier changes outside subscription flow
      
      const user = await storage.updateUser(req.user!.id, updates);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ ...user, passwordHash: undefined });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  // ============================================================================
  // TASK ROUTES WITH AI FEATURES
  // ============================================================================

  // Get user's tasks
  app.get('/api/tasks', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const tasks = await storage.getTasks(req.user!.id);
      res.json(tasks);
    } catch (error) {
      console.error('Get tasks error:', error);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  });

  // Get today's tasks with AI optimization
  app.get('/api/tasks/today', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const tasks = await storage.getTodaysTasks(req.user!.id);
      
      // Apply AI optimization for Pro users
      if (req.user!.tier !== 'free') {
        const optimizedTasks = await aiService.optimizeTasks(tasks, {
          energyLevel: 8, // Default high energy in morning
          availableTime: 8 * 60, // 8 hours in minutes
        });
        return res.json(optimizedTasks);
      }
      
      res.json(tasks);
    } catch (error) {
      console.error('Get today tasks error:', error);
      res.status(500).json({ error: 'Failed to fetch today\'s tasks' });
    }
  });

  // Create task with natural language parsing
  app.post('/api/tasks', authenticateToken, checkTaskLimit, async (req: AuthRequest, res) => {
    try {
      const { naturalLanguageInput, ...manualData } = req.body;
      
      let taskData;
      if (naturalLanguageInput && req.user!.tier !== 'free') {
        // Use AI parsing for Pro users
        taskData = await aiService.parseNaturalLanguageTask(naturalLanguageInput, req.user);
      } else {
        // Manual input for free users or when no natural language provided
        taskData = insertTaskSchema.parse(manualData);
      }

      const task = await storage.createTask(req.user!.id, taskData);
      
      // Log task creation
      await storage.logUsageEvent(req.user!.id, 'task_created', {
        category: task.category,
        priority: task.priority,
        usedAI: !!naturalLanguageInput && req.user!.tier !== 'free'
      });

      res.status(201).json(task);
    } catch (error: any) {
      console.error('Create task error:', error);
      res.status(400).json({ error: error.message || 'Failed to create task' });
    }
  });

  // Update task
  app.patch('/api/tasks/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const updates = updateTaskSchema.parse({ id: req.params.id, ...req.body });
      const task = await storage.updateTask(req.params.id, req.user!.id, updates);
      
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json(task);
    } catch (error: any) {
      console.error('Update task error:', error);
      res.status(400).json({ error: error.message || 'Failed to update task' });
    }
  });

  // Complete task with gamification
  app.post('/api/tasks/:id/complete', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const task = await storage.completeTask(req.params.id, req.user!.id);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Generate gamification rewards
      const personalityCluster = gamificationService.analyzePersonalityCluster(req.user!);
      const xpReward = gamificationService.calculateTaskXP(task);
      const microRewards = gamificationService.generateMicroRewards(req.user!, 'task_completion');
      const motivationalMessage = gamificationService.generateMotivationalMessage(req.user!, 'task_completion');

      // Check for upgrade nudges
      let upgradeNudge = null;
      if (req.user!.tier === 'free' && Math.random() < 0.3) { // 30% chance
        upgradeNudge = generateUpgradeNudge(req.user!, 'after_completion');
      }

      res.json({
        task,
        rewards: {
          xp: xpReward,
          microRewards,
          motivationalMessage,
          upgradeNudge
        }
      });
    } catch (error) {
      console.error('Complete task error:', error);
      res.status(500).json({ error: 'Failed to complete task' });
    }
  });

  // Delete task
  app.delete('/api/tasks/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const success = await storage.deleteTask(req.params.id, req.user!.id);
      if (!success) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Delete task error:', error);
      res.status(500).json({ error: 'Failed to delete task' });
    }
  });

  // ============================================================================
  // AI-POWERED FEATURES (TIER-GATED)
  // ============================================================================

  // Task Refiner - Conversational AI enhancement
  app.post('/api/ai/refine-task', authenticateToken, checkAiUsage, async (req: AuthRequest, res) => {
    try {
      const { taskId, prompt } = req.body;
      const task = await storage.getTask(taskId, req.user!.id);
      
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      const refinement = await aiService.refineTask(task, prompt);
      
      // Log AI usage
      await storage.logUsageEvent(req.user!.id, 'ai_task_refinement', {
        taskId,
        prompt: prompt.substring(0, 100) // First 100 chars for analysis
      });

      res.json(refinement);
    } catch (error) {
      console.error('Task refinement error:', error);
      res.status(500).json({ error: 'Failed to refine task' });
    }
  });

  // Focus Forecast (Advanced Pro+)
  app.get('/api/ai/focus-forecast', authenticateToken, checkTier('advanced_pro'), async (req: AuthRequest, res) => {
    try {
      const daysAhead = req.user!.tier === 'premium_pro' ? 7 : 3;
      const historicalData = await storage.getFocusSessions(req.user!.id, 30);
      
      const forecast = await aiService.generateFocusForecast(req.user!, { historicalData }, daysAhead);
      
      res.json(forecast);
    } catch (error) {
      console.error('Focus forecast error:', error);
      res.status(500).json({ error: 'Failed to generate focus forecast' });
    }
  });

  // Auto-Schedule to Calendar (Advanced Pro+)
  app.post('/api/ai/auto-schedule', authenticateToken, checkTier('advanced_pro'), async (req: AuthRequest, res) => {
    try {
      const { availableSlots, preferences } = req.body;
      const tasks = await storage.getTasks(req.user!.id);
      const incompleteTasks = tasks.filter(t => !t.completed);
      
      const schedule = await aiService.generateSchedule(incompleteTasks, availableSlots, preferences);
      
      // Update tasks with scheduled times
      for (const item of schedule) {
        await storage.updateTask(item.taskId, req.user!.id, {
          scheduledAt: item.scheduledAt
        });
      }

      res.json({ schedule, message: 'Tasks scheduled successfully' });
    } catch (error) {
      console.error('Auto-schedule error:', error);
      res.status(500).json({ error: 'Failed to auto-schedule tasks' });
    }
  });

  // AI Chat Assistant
  app.post('/api/ai/chat', authenticateToken, checkAiUsage, async (req: AuthRequest, res) => {
    try {
      const { message } = req.body;
      const [tasks, notes] = await Promise.all([
        storage.getTasks(req.user!.id),
        storage.getRecentNotes(req.user!.id, 10)
      ]);

      const response = await aiService.chatResponse(message, {
        user: req.user!,
        tasks,
        notes
      });

      await storage.logUsageEvent(req.user!.id, 'ai_chat', {
        messageLength: message.length
      });

      res.json({ response });
    } catch (error) {
      console.error('AI chat error:', error);
      res.status(500).json({ error: 'Failed to get AI response' });
    }
  });

  // Generate AI insights
  app.get('/api/ai/insights', authenticateToken, checkAiUsage, async (req: AuthRequest, res) => {
    try {
      const tasks = await storage.getTasks(req.user!.id);
      
      // Generate insights without focus sessions for now
      const insights = await aiService.generateInsights(req.user!, tasks, []);
      
      res.json(insights);
    } catch (error) {
      console.error('AI insights error:', error);
      res.status(500).json({ error: 'Failed to generate insights' });
    }
  });

  // ============================================================================
  // NOTES ROUTES
  // ============================================================================

  app.get('/api/notes', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const notes = await storage.getNotes(req.user!.id);
      res.json(notes);
    } catch (error) {
      console.error('Get notes error:', error);
      res.status(500).json({ error: 'Failed to fetch notes' });
    }
  });

  app.get('/api/notes/recent', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const notes = await storage.getRecentNotes(req.user!.id, limit);
      res.json(notes);
    } catch (error) {
      console.error('Get recent notes error:', error);
      res.status(500).json({ error: 'Failed to fetch recent notes' });
    }
  });

  app.post('/api/notes', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const noteData = insertNoteSchema.parse(req.body);
      const note = await storage.createNote(req.user!.id, noteData);
      
      // Generate AI summary for Pro users
      if (req.user!.tier !== 'free') {
        const summary = await aiService.summarizeNote(note);
        await storage.updateNote(note.id, req.user!.id, { aiSummary: summary });
        note.aiSummary = summary;
      }

      res.status(201).json(note);
    } catch (error: any) {
      console.error('Create note error:', error);
      res.status(400).json({ error: error.message || 'Failed to create note' });
    }
  });

  app.patch('/api/notes/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const updates = updateNoteSchema.parse({ id: req.params.id, ...req.body });
      const note = await storage.updateNote(req.params.id, req.user!.id, updates);
      
      if (!note) {
        return res.status(404).json({ error: 'Note not found' });
      }

      res.json(note);
    } catch (error: any) {
      console.error('Update note error:', error);
      res.status(400).json({ error: error.message || 'Failed to update note' });
    }
  });

  app.delete('/api/notes/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const success = await storage.deleteNote(req.params.id, req.user!.id);
      if (!success) {
        return res.status(404).json({ error: 'Note not found' });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Delete note error:', error);
      res.status(500).json({ error: 'Failed to delete note' });
    }
  });

  // ============================================================================
  // HABITS & GAMIFICATION ROUTES
  // ============================================================================

  app.get('/api/habits', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const habits = await storage.getHabits(req.user!.id);
      res.json(habits);
    } catch (error) {
      console.error('Get habits error:', error);
      res.status(500).json({ error: 'Failed to fetch habits' });
    }
  });

  app.post('/api/habits', authenticateToken, checkTier('basic_pro'), async (req: AuthRequest, res) => {
    try {
      const habitData = insertHabitSchema.parse(req.body);
      const habit = await storage.createHabit(req.user!.id, habitData);
      res.status(201).json(habit);
    } catch (error: any) {
      console.error('Create habit error:', error);
      res.status(400).json({ error: error.message || 'Failed to create habit' });
    }
  });

  app.post('/api/habits/:id/complete', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const completion = await storage.completeHabit(req.params.id, req.user!.id);
      const habit = await storage.getHabit(req.params.id, req.user!.id);
      
      if (!habit) {
        return res.status(404).json({ error: 'Habit not found' });
      }

      // Update habit streaks
      const { newStreak, milestoneReached } = gamificationService.updateHabitStreak(habit, completion);
      await storage.updateHabit(req.params.id, req.user!.id, { currentStreak: newStreak });

      // Award XP to user
      const xpReward = habit.xpPerCompletion || 5;
      await storage.updateUser(req.user!.id, {
        totalXp: req.user!.totalXp + xpReward
      });

      res.json({
        completion,
        rewards: {
          xp: xpReward,
          newStreak,
          milestoneReached
        }
      });
    } catch (error) {
      console.error('Complete habit error:', error);
      res.status(500).json({ error: 'Failed to complete habit' });
    }
  });

  // Get user's gamification profile
  app.get('/api/gamification/profile', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const personalityCluster = gamificationService.analyzePersonalityCluster(req.user!);
      const badges = gamificationService.calculateStatusBadges(req.user!);
      const unlocks = gamificationService.getProgressiveUnlocks(req.user!);
      const challenges = gamificationService.generatePersonalizedChallenges(req.user!, personalityCluster);

      res.json({
        personalityType: personalityCluster.type,
        badges,
        unlocks,
        challenges,
        stats: {
          totalXp: req.user!.totalXp,
          currentStreak: req.user!.currentStreak,
          longestStreak: req.user!.longestStreak,
          tier: req.user!.tier
        }
      });
    } catch (error) {
      console.error('Get gamification profile error:', error);
      res.status(500).json({ error: 'Failed to fetch gamification profile' });
    }
  });

  // ============================================================================
  // SUBSCRIPTION & BILLING ROUTES
  // ============================================================================

  // Get pricing tiers
  app.get('/api/subscription/tiers', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const tiers = Object.values(PRICING_TIERS);
      res.json(tiers);
    } catch (error) {
      console.error('Get tiers error:', error);
      res.status(500).json({ error: 'Failed to fetch pricing tiers' });
    }
  });

  // Create checkout session
  app.post('/api/subscription/checkout', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { tierId } = req.body;
      const tier = PRICING_TIERS[tierId];
      
      if (!tier || !tier.stripePriceId) {
        return res.status(400).json({ error: 'Invalid pricing tier' });
      }

      const session = await createCheckoutSession(
        req.user!,
        tier.stripePriceId,
        `${req.protocol}://${req.hostname}/subscription/success`,
        `${req.protocol}://${req.hostname}/subscription/cancel`
      );

      res.json({ url: session.url });
    } catch (error) {
      console.error('Create checkout error:', error);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  });

  // Stripe webhook handler
  app.post('/api/subscription/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err: any) {
      console.log(`Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      await handleWebhook(event, storage);
      res.json({ received: true });
    } catch (error) {
      console.error('Webhook handling error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // Get upgrade nudges
  app.get('/api/subscription/nudge', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const context = req.query.context as string || 'general';
      const nudge = generateUpgradeNudge(req.user!, context);
      const showTrial = shouldShowTrial(req.user!);
      
      res.json({ nudge, showTrial });
    } catch (error) {
      console.error('Get nudge error:', error);
      res.status(500).json({ error: 'Failed to generate upgrade nudge' });
    }
  });

  // ============================================================================
  // ANALYTICS & REPORTING ROUTES  
  // ============================================================================

  app.get('/api/analytics/stats', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const analytics = await storage.getAnalytics(req.user!.id);
      res.json(analytics);
    } catch (error) {
      console.error('Get analytics error:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  app.get('/api/categories', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const categories = await storage.getCategories(req.user!.id);
      res.json(categories);
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });

  // Legacy AI bottlenecks route (for compatibility)
  app.get('/api/ai/bottlenecks', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const tasks = await storage.getTasks(req.user!.id);
      const insights = await aiService.generateInsights(req.user!, tasks);
      
      const bottlenecks = insights
        .filter(i => i.type === 'bottleneck_analysis')
        .map(i => ({
          type: 'bottleneck',
          description: i.content,
          suggestion: i.title
        }));

      res.json({ bottlenecks });
    } catch (error) {
      console.error('Get bottlenecks error:', error);
      res.status(500).json({ error: 'Failed to detect bottlenecks' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}