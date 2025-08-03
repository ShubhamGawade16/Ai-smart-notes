import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  authenticateToken, 
  optionalAuth,
  type AuthRequest 
} from "./auth";
import authRoutes from "./routes/auth";
import aiRoutes from "./routes/ai";
import gamificationRoutes from "./routes/gamification";
import integrationRoutes from "./routes/integrations";
import socialRoutes from "./routes/social";
import { 
  insertTaskSchema, 
  updateTaskSchema,
  insertNoteSchema,
  updateNoteSchema,
  type Task,
  type Note
} from "@shared/schema";
import { checkTier, incrementUsage, getUserLimits, FREE_TIER_LIMITS } from "./middleware/tier-check";
import { parseNaturalLanguageTask, optimizeTaskOrder, generateProductivityInsights, refineTask } from "./services/ai-service";
import { notificationService } from "./services/notification-service";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // ============================================================================
  // AUTHENTICATION ROUTES
  // ============================================================================
  
  // Mount auth routes
  app.use("/api/auth", authRoutes);
  
  // Add Supabase auth routes
  const supabaseAuthRoutes = await import("./routes/supabase-auth");
  app.use("/api/supabase", supabaseAuthRoutes.default);

  // ============================================================================
  // SUBSCRIPTION & FREEMIUM ROUTES
  // ============================================================================

  // Get subscription status
  app.get("/api/subscription-status", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "User ID not found in token" });
      }

      // Always fetch fresh user data from storage to avoid caching issues
      const user = await storage.getUser(req.userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Add cache-busting headers to prevent frontend caching
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      // Check if daily limit needs reset
      const now = new Date();
      const resetTime = user.dailyAiCallsResetAt ? new Date(user.dailyAiCallsResetAt) : new Date();
      const shouldReset = now.getTime() - resetTime.getTime() > 24 * 60 * 60 * 1000;

      if (shouldReset) {
        await storage.updateUser(user.id, {
          dailyAiCalls: 0,
          dailyAiCallsResetAt: now
        });
        user.dailyAiCalls = 0;
      }

      // In development mode, completely disable AI usage restrictions
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      const isPremium = user.tier !== 'free' || isDevelopment;
      const dailyLimit = isPremium ? 999 : 3; // Premium gets unlimited (999), free gets 3
      const currentUsage = isDevelopment ? 0 : (user.dailyAiCalls || 0);
      const canUseAi = isDevelopment || isPremium || currentUsage < dailyLimit;

      res.json({
        isPremium,
        dailyAiUsage: currentUsage,
        dailyAiLimit: dailyLimit,
        canUseAi,
        subscriptionId: user.subscriptionId,
        subscriptionStatus: user.subscriptionStatus,
        expiresAt: user.subscriptionCurrentPeriodEnd
      });
    } catch (error) {
      console.error("Failed to get subscription status:", error);
      res.status(500).json({ error: "Failed to get subscription status" });
    }
  });

  // Increment AI usage
  app.post("/api/increment-ai-usage", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "User ID not found in token" });
      }

      const user = await storage.getUser(req.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // In development mode, completely bypass AI usage tracking
      const isDevelopment = process.env.NODE_ENV === 'development';
      if (isDevelopment) {
        return res.json({
          success: true,
          dailyAiUsage: 0,
          canUseAi: true,
          message: "Development mode - unlimited AI usage"
        });
      }

      const isPremium = user.tier !== 'free';
      if (isPremium) {
        // Premium users have unlimited usage
        res.json({
          dailyAiUsage: user.dailyAiCalls || 0,
          canUseAi: true
        });
        return;
      }

      // Check if daily limit needs reset
      const now = new Date();
      const resetTime = user.dailyAiCallsResetAt ? new Date(user.dailyAiCallsResetAt) : new Date();
      const shouldReset = now.getTime() - resetTime.getTime() > 24 * 60 * 60 * 1000;

      let newDailyCount = user.dailyAiCalls || 0;
      if (shouldReset) {
        newDailyCount = 0;
      }

      const dailyLimit = 3;
      const canUseAi = newDailyCount < dailyLimit;

      if (canUseAi) {
        newDailyCount += 1;
        await storage.updateUser(user.id, {
          dailyAiCalls: newDailyCount,
          dailyAiCallsResetAt: shouldReset ? now : user.dailyAiCallsResetAt
        });
      }

      res.json({
        dailyAiUsage: newDailyCount,
        canUseAi: newDailyCount < dailyLimit
      });
    } catch (error) {
      console.error("Failed to increment AI usage:", error);
      res.status(500).json({ error: "Failed to increment AI usage" });
    }
  });

  // Upgrade subscription (placeholder for payment integration)
  app.post("/api/upgrade-subscription", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "User ID not found in token" });
      }

      const { plan } = req.body;
      
      // For now, simulate successful upgrade
      // In production, this would integrate with actual payment processor
      const updatedUser = await storage.updateUser(req.userId, {
        tier: 'premium_pro',
        subscriptionStatus: 'active',
        subscriptionCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        monthlySubscriptionAmount: '5.00'
      });

      res.json({ 
        success: true, 
        user: updatedUser,
        message: "Subscription upgraded successfully!" 
      });
    } catch (error) {
      console.error("Failed to upgrade subscription:", error);
      res.status(500).json({ error: "Failed to upgrade subscription" });
    }
  });

  // Supabase user sync endpoint (kept for compatibility)
  app.post("/api/auth/sync", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { email, firstName, lastName, profileImageUrl } = req.body;
      
      if (!req.userId) {
        return res.status(401).json({ error: "User ID not found in token" });
      }

      // Upsert user in our database
      const user = await storage.upsertUser({
        id: req.userId,
        email,
        firstName,
        lastName,
        profileImageUrl,
      });

      res.json({ user });
    } catch (error) {
      console.error("User sync error:", error);
      res.status(500).json({ error: "Failed to sync user" });
    }
  });

  // Get current user
  app.get("/api/auth/user", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "User ID not found in token" });
      }

      const user = await storage.getUser(req.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ user });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Delete account endpoint
  app.delete("/api/auth/delete-account", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "User ID not found in token" });
      }

      // Delete all user's tasks and notes first
      await storage.deleteAllUserTasks(req.userId);
      await storage.deleteAllUserNotes(req.userId);
      
      // Delete the user account
      await storage.deleteUser(req.userId);
      
      res.json({ message: "Account deleted successfully" });
    } catch (error) {
      console.error("Delete account error:", error);
      res.status(500).json({ error: "Failed to delete account" });
    }
  });

  // Onboarding endpoint
  app.post("/api/user/onboarding", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "User ID not found in token" });
      }

      const { primaryGoal, customGoals } = req.body;
      
      const user = await storage.updateUser(req.userId, {
        primaryGoal,
        customGoals,
        onboardingCompleted: true,
      });

      res.json({ user });
    } catch (error) {
      console.error("Onboarding error:", error);
      res.status(500).json({ error: "Failed to save onboarding data" });
    }
  });

  // ============================================================================
  // PHASE 3: ADVANCED AI FEATURES & TIER SYSTEM
  // ============================================================================

  // Natural Language Task Entry - Parse user input into structured task (FREE for testing)
  app.post("/api/ai/parse-task", optionalAuth, async (req: AuthRequest, res) => {
      try {
        const { input } = req.body;
        if (!input || typeof input !== 'string') {
          return res.status(400).json({ error: "Task input is required" });
        }

        const analysis = await parseNaturalLanguageTask(input);
        res.json({ analysis });
      } catch (error) {
        console.error("Task parsing error:", error);
        res.status(500).json({ error: "Failed to parse task" });
      }
    }
  );

  // Smart Task Optimization - Reorder tasks for maximum efficiency (FREE for testing)
  app.post("/api/ai/optimize-tasks", async (req: AuthRequest, res) => {
      try {
        const { taskIds, userContext } = req.body;
        
        if (!Array.isArray(taskIds)) {
          return res.status(400).json({ error: "Task IDs array is required" });
        }

        // Get tasks from storage
        const allTasks = await storage.getTasks(req.userId!);
        const tasksToOptimize = allTasks.filter(task => taskIds.includes(task.id));

        const optimizedTasks = await optimizeTaskOrder(tasksToOptimize, userContext);
        res.json({ optimizedTasks: optimizedTasks.map(t => t.id) });
      } catch (error) {
        console.error("Task optimization error:", error);
        res.status(500).json({ error: "Failed to optimize tasks" });
      }
    }
  );

  // Generate Productivity Insights (FREE for testing)
  app.get("/api/ai/insights", async (req: AuthRequest, res) => {
      try {
        const tasks = await storage.getTasks(req.userId!);
        const user = await storage.getUser(req.userId!);
        
        const userPatterns = {
          completionRate: tasks.length > 0 ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0,
          currentStreak: user?.currentStreak || 0,
          productiveHours: '9-11 AM', // This would come from actual analysis
        };

        const insights = await generateProductivityInsights(
          tasks.slice(0, 20), // Recent tasks
          [], // Completion history - would be implemented with proper tracking
          userPatterns
        );

        res.json({ insights });
      } catch (error) {
        console.error("Insights generation error:", error);
        res.status(500).json({ error: "Failed to generate insights" });
      }
    }
  );

  // AI motivation quote route
  app.post("/api/ai/motivation-quote", async (req: AuthRequest, res) => {
    try {
      const { completedTasks, incompleteTasks, recentTasks } = req.body;
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: "OpenAI API key not configured" });
      }

      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const prompt = `Generate a personalized motivational quote for a user with the following task status:
- Completed tasks: ${completedTasks}
- Incomplete tasks: ${incompleteTasks}
- Recent tasks: ${recentTasks.map((t: any) => `${t.title} (${t.completed ? 'done' : 'pending'})`).join(', ')}

Create an encouraging, personalized quote that acknowledges their progress and motivates them for the tasks ahead. Make it specific to their situation. Keep it under 150 characters and inspirational.

Respond with JSON in this format: {"quote": "your motivational quote", "author": "Planify AI"}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      res.json(result);
    } catch (error) {
      console.error('AI motivation quote error:', error);
      res.status(500).json({ error: "Failed to generate motivation quote" });
    }
  });

  // Dev endpoint to reset AI usage for testing
  app.post("/api/dev/reset-ai-usage", async (req: AuthRequest, res) => {
    try {
      const userId = req.userId || 'demo-user';
      
      // Ensure user exists first
      let user = await storage.getUser(userId);
      if (!user) {
        user = await storage.upsertUser({
          id: userId,
          email: `${userId}@demo.com`
        });
      }
      
      // Reset daily AI usage for the user
      await storage.resetDailyAiUsage(userId);
      
      // Clear any cached user data and get fresh data
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for database consistency
      const updatedUser = await storage.getUser(userId);
      
      console.log(`Dev reset: User ${userId} AI usage reset to ${updatedUser?.dailyAiCalls || 0}`);
      
      res.json({ 
        message: "AI usage reset successfully", 
        dailyAiUsage: updatedUser?.dailyAiCalls || 0,
        success: true
      });
    } catch (error) {
      console.error('Reset AI usage error:', error);
      res.status(500).json({ error: "Failed to reset AI usage" });
    }
  });

  // Toggle between free and premium user for testing
  app.post("/api/dev/toggle-premium", authenticateToken, async (req: AuthRequest, res) => {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ error: "Dev routes only available in development" });
    }

    try {
      if (!req.userId) {
        return res.status(401).json({ error: "User ID not found in token" });
      }

      const user = await storage.getUser(req.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Toggle between 'free' and 'basic_pro' tiers (correct enum values)
      const newTier = user.tier === 'free' ? 'basic_pro' : 'free';
      await storage.updateUser(req.userId, { 
        tier: newTier,
        // Reset AI usage when switching tiers
        dailyAiCalls: 0,
        dailyAiCallsResetAt: new Date()
      });

      console.log(`Dev toggle: User ${req.userId} switched to ${newTier} tier`);

      res.json({
        success: true,
        isPremium: newTier !== 'free',
        tier: newTier,
        message: `Switched to ${newTier} user mode`
      });
    } catch (error) {
      console.error("Failed to toggle premium:", error);
      res.status(500).json({ error: "Failed to toggle premium status" });
    }
  });

  // Toggle between free and premium user for testing
  app.post("/api/dev/toggle-premium", authenticateToken, async (req: AuthRequest, res) => {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ error: "Dev routes only available in development" });
    }

    try {
      if (!req.userId) {
        return res.status(401).json({ error: "User ID not found in token" });
      }

      const user = await storage.getUser(req.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Toggle between free and premium tiers
      const newTier = user.tier === 'free' ? 'premium' : 'free';
      await storage.updateUser(req.userId, { 
        tier: newTier,
        // Reset AI usage when switching tiers for clean testing
        dailyAiCalls: 0,
        dailyAiCallsResetAt: new Date()
      });

      console.log(`Dev toggle: User ${req.userId} switched to ${newTier} tier`);

      res.json({
        success: true,
        isPremium: newTier === 'premium',
        tier: newTier,
        message: `Switched to ${newTier} user mode`
      });
    } catch (error) {
      console.error("Failed to toggle premium:", error);
      res.status(500).json({ error: "Failed to toggle premium status" });
    }
  });

  // Conversational Task Refiner (FREE for testing)
  app.post("/api/ai/refine-task", optionalAuth, async (req: AuthRequest, res) => {
      try {
        const { originalTask, userQuery, context } = req.body;
        
        if (!originalTask || !userQuery) {
          return res.status(400).json({ error: "Original task and user query are required" });
        }

        // Use the refineTask function instead of aiBrain (which isn't imported)
        const refinement = await refineTask(originalTask, userQuery, context || {});
        
        res.json(refinement);
      } catch (error) {
        console.error("Task refinement error:", error);
        res.status(500).json({ error: "Failed to refine task" });
      }
    }
  );

  // Get user limits and usage (unlimited for testing)
  app.get("/api/user/limits", async (req: AuthRequest, res) => {
      try {
        const limits = await getUserLimits(req.userId!);
        res.json({ limits });
      } catch (error) {
        console.error("Get limits error:", error);
        res.status(500).json({ error: "Failed to get user limits" });
      }
    }
  );

  // ============================================================================
  // TASK ROUTES WITH AI ENHANCEMENT
  // ============================================================================

  // Get all tasks (works with or without auth for testing)
  app.get("/api/tasks", async (req: AuthRequest, res) => {
    try {
      // Use demo user ID if no auth token provided
      const userId = req.userId || 'demo-user';
      const tasks = await storage.getTasks(userId);
      res.json({ tasks });
    } catch (error) {
      console.error("Get tasks error:", error);
      res.status(500).json({ error: "Failed to get tasks" });
    }
  });

  // Get today's tasks (works with or without auth for testing)
  app.get("/api/tasks/today", async (req: AuthRequest, res) => {
    try {
      // Use demo user ID if no auth token provided
      const userId = req.userId || 'demo-user';
      const allTasks = await storage.getTasks(userId);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayTasks = allTasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        return dueDate >= today && dueDate < tomorrow;
      });

      res.json(todayTasks);
    } catch (error) {
      console.error("Get today's tasks error:", error);
      res.status(500).json({ error: "Failed to get today's tasks" });
    }
  });

  // Enhanced task creation with AI parsing (no auth required for testing)
  app.post("/api/tasks", async (req: AuthRequest, res) => {
      try {
        // Use demo user ID if no auth token provided
        const userId = req.userId || 'demo-user';

        // Check if this is a natural language input that needs AI parsing
        const { title, useAiParsing, ...otherData } = req.body;
        
        let taskData = { title, ...otherData };
        
        // If AI parsing is requested and user has access
        if (useAiParsing && title && typeof title === 'string') {
          try {
            const analysis = await parseNaturalLanguageTask(title);
            taskData = {
              ...taskData,
              title: analysis.title,
              description: analysis.description || taskData.description,
              priority: analysis.priority,
              category: analysis.category,
              tags: analysis.tags,
              estimatedTime: analysis.estimatedTime,
              dueDate: analysis.dueDate,
              contextSwitchCost: analysis.contextSwitchCost,
            };
          } catch (error) {
            console.error("AI parsing error:", error);
            // Continue with original data if AI parsing fails
          }
        }

        // Validate input
        const result = insertTaskSchema.safeParse(taskData);
        if (!result.success) {
          return res.status(400).json({ 
            error: "Invalid task data", 
            details: result.error.errors 
          });
        }

        const task = await storage.createTask(userId, result.data);
        res.status(201).json({ task });
      } catch (error) {
        console.error("Create task error:", error);
        res.status(500).json({ error: "Failed to create task" });
      }
    }
  );

  // Update task (works with or without auth for testing)
  app.patch("/api/tasks/:id", async (req: AuthRequest, res) => {
    try {
      // Use demo user ID if no auth token provided
      const userId = req.userId || 'demo-user';

      const taskId = req.params.id;
      if (!taskId) {
        return res.status(400).json({ error: "Task ID is required" });
      }

      // Get the existing task first to ensure it exists and belongs to user
      const existingTasks = await storage.getTasks(userId);
      const existingTask = existingTasks.find(t => t.id === taskId);
      
      if (!existingTask) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Validate input
      const result = updateTaskSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          error: "Invalid task data", 
          details: result.error.errors 
        });
      }

      const task = await storage.updateTask(taskId, userId, result.data);
      if (!task) {
        return res.status(404).json({ error: "Task not found or update failed" });
      }

      res.json({ task });
    } catch (error) {
      console.error("Update task error:", error);
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  // Delete task (works with or without auth for testing)
  app.delete("/api/tasks/:id", async (req: AuthRequest, res) => {
    try {
      // Use demo user ID if no auth token provided
      const userId = req.userId || 'demo-user';

      const taskId = req.params.id;
      if (!taskId) {
        return res.status(400).json({ error: "Task ID is required" });
      }

      // Get the existing task first to ensure it exists and belongs to user
      const existingTasks = await storage.getTasks(userId);
      const existingTask = existingTasks.find(t => t.id === taskId);
      
      if (!existingTask) {
        return res.status(404).json({ error: "Task not found" });
      }

      const deleted = await storage.deleteTask(taskId, userId);
      if (!deleted) {
        return res.status(404).json({ error: "Task not found or delete failed" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Delete task error:", error);
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  // ============================================================================
  // NOTE ROUTES
  // ============================================================================

  // Get all notes (works with or without auth for testing)
  app.get("/api/notes", async (req: AuthRequest, res) => {
    try {
      // Use demo user ID if no auth token provided
      const userId = req.userId || 'demo-user';
      const notes = await storage.getNotes(userId);
      res.json({ notes });
    } catch (error) {
      console.error("Get notes error:", error);
      res.status(500).json({ error: "Failed to get notes" });
    }
  });

  // Create note
  app.post("/api/notes", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "User ID not found in token" });
      }

      // Validate input
      const result = insertNoteSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          error: "Invalid note data", 
          details: result.error.errors 
        });
      }

      const note = await storage.createNote(req.userId, result.data);
      res.status(201).json({ note });
    } catch (error) {
      console.error("Create note error:", error);
      res.status(500).json({ error: "Failed to create note" });
    }
  });

  // ============================================================================
  // ANALYTICS ROUTES
  // ============================================================================

  app.get("/api/analytics/stats", async (req: AuthRequest, res) => {
    try {
      // Use demo user ID if no auth token provided
      const userId = req.userId || 'demo-user';
      
      const tasks = await storage.getTasks(userId);
      const notes = await storage.getNotes(userId);
      
      const stats = {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.completed).length,
        pendingTasks: tasks.filter(t => !t.completed).length,
        totalNotes: notes.length,
        todayTasks: tasks.filter(t => {
          if (!t.dueDate) return false;
          const today = new Date();
          const taskDate = new Date(t.dueDate);
          return taskDate.toDateString() === today.toDateString();
        }).length,
        completionRate: tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0,
      };

      res.json(stats);
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({ error: "Failed to get analytics" });
    }
  });

  // AI Routes
  app.use('/api/ai', aiRoutes);
  
  // AI Brain - Central AI controller
  const { registerAIBrainRoutes } = await import("./routes/ai-brain");
  registerAIBrainRoutes(app);
  
  // ============================================================================
  // NOTIFICATION ROUTES
  // ============================================================================
  
  // Get pending notifications for real-time display
  app.get("/api/notifications/pending", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId || 'demo-user';
      const notifications = await notificationService.getPendingNotifications(userId);
      res.json({ notifications });
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ error: "Failed to get notifications" });
    }
  });

  // Register device for push notifications
  app.post("/api/notifications/register-device", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId || 'demo-user';
      const { token, platform } = req.body;
      
      // Store device token for push notifications
      console.log(`Registered ${platform} device for user ${userId}:`, token?.substring(0, 20) + '...');
      res.json({ success: true });
    } catch (error) {
      console.error("Device registration error:", error);
      res.status(500).json({ error: "Failed to register device" });
    }
  });

  // Trigger notification analysis (for testing)
  app.post("/api/notifications/analyze", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId || 'demo-user';
      await notificationService.analyzeAndScheduleTaskNotifications(userId);
      res.json({ success: true, message: "Notification analysis triggered" });
    } catch (error) {
      console.error("Notification analysis error:", error);
      res.status(500).json({ error: "Failed to analyze notifications" });
    }
  });
  
  // NOTE: Removed unwanted features per user request:
  // - Auto Scheduler 
  // - Social Accountability (gamificationRoutes, socialRoutes)
  // - Achievement System 
  // - Integration Hub (integrationRoutes)

  const httpServer = createServer(app);
  return httpServer;
}