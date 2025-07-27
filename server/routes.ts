import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  authenticateToken, 
  type AuthRequest 
} from "./auth";
import aiRoutes from "./routes/ai";
import gamificationRoutes from "./routes/gamification";
import integrationRoutes from "./routes/integrations";
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // ============================================================================
  // AUTHENTICATION ROUTES
  // ============================================================================

  // Supabase user sync endpoint
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

  // ============================================================================
  // PHASE 3: ADVANCED AI FEATURES & TIER SYSTEM
  // ============================================================================

  // Natural Language Task Entry - Parse user input into structured task
  app.post("/api/ai/parse-task", 
    authenticateToken, 
    checkTier({ feature: 'basic_tasks', dailyLimit: FREE_TIER_LIMITS.daily_ai_calls }),
    incrementUsage('ai_call'),
    async (req: AuthRequest, res) => {
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

  // Smart Task Optimization - Reorder tasks for maximum efficiency
  app.post("/api/ai/optimize-tasks",
    authenticateToken,
    checkTier({ feature: 'unlimited_ai_calls' }),
    incrementUsage('ai_call'),
    async (req: AuthRequest, res) => {
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

  // Generate Productivity Insights
  app.get("/api/ai/insights",
    authenticateToken,
    checkTier({ feature: 'unlimited_ai_calls' }),
    incrementUsage('ai_call'),
    async (req: AuthRequest, res) => {
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

  // Conversational Task Refiner (FREE: 5 calls/day, PRO: unlimited)
  app.post("/api/ai/refine-task",
    authenticateToken,
    checkTier({ feature: 'basic_tasks', dailyLimit: FREE_TIER_LIMITS.conversational_refiner_calls }),
    incrementUsage('ai_call'),
    async (req: AuthRequest, res) => {
      try {
        const { originalTask, userQuery, context } = req.body;
        
        if (!originalTask || !userQuery) {
          return res.status(400).json({ error: "Original task and user query are required" });
        }

        const refinement = await refineTask(originalTask, userQuery, context || {});
        res.json(refinement);
      } catch (error) {
        console.error("Task refinement error:", error);
        res.status(500).json({ error: "Failed to refine task" });
      }
    }
  );

  // Get user limits and usage (for displaying upgrade prompts)
  app.get("/api/user/limits",
    authenticateToken,
    async (req: AuthRequest, res) => {
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

  // Get all tasks
  app.get("/api/tasks", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "User ID not found in token" });
      }

      const tasks = await storage.getTasks(req.userId);
      res.json({ tasks });
    } catch (error) {
      console.error("Get tasks error:", error);
      res.status(500).json({ error: "Failed to get tasks" });
    }
  });

  // Get today's tasks
  app.get("/api/tasks/today", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "User ID not found in token" });
      }

      const allTasks = await storage.getTasks(req.userId);
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

  // Enhanced task creation with AI parsing
  app.post("/api/tasks", 
    authenticateToken,
    checkTier({ feature: 'basic_tasks', monthlyLimit: FREE_TIER_LIMITS.monthly_tasks }),
    incrementUsage('task_created'),
    async (req: AuthRequest, res) => {
      try {
        if (!req.userId) {
          return res.status(401).json({ error: "User ID not found in token" });
        }

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

        const task = await storage.createTask(req.userId, result.data);
        res.status(201).json({ task });
      } catch (error) {
        console.error("Create task error:", error);
        res.status(500).json({ error: "Failed to create task" });
      }
    }
  );

  // Update task
  app.patch("/api/tasks/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "User ID not found in token" });
      }

      const taskId = req.params.id;
      if (!taskId) {
        return res.status(400).json({ error: "Task ID is required" });
      }

      // Validate input
      const result = updateTaskSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          error: "Invalid task data", 
          details: result.error.errors 
        });
      }

      const task = await storage.updateTask(taskId, req.userId, result.data);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      res.json({ task });
    } catch (error) {
      console.error("Update task error:", error);
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  // Delete task
  app.delete("/api/tasks/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "User ID not found in token" });
      }

      const taskId = req.params.id;
      if (!taskId) {
        return res.status(400).json({ error: "Task ID is required" });
      }

      const deleted = await storage.deleteTask(taskId, req.userId);
      if (!deleted) {
        return res.status(404).json({ error: "Task not found" });
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

  // Get all notes
  app.get("/api/notes", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "User ID not found in token" });
      }

      const notes = await storage.getNotes(req.userId);
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

  app.get("/api/analytics/stats", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "User ID not found in token" });
      }

      const tasks = await storage.getTasks(req.userId);
      const notes = await storage.getNotes(req.userId);
      
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
  
  // Gamification Routes
  app.use('/api/gamification', gamificationRoutes);
  
  // Integration Routes
  app.use('/api/integrations', integrationRoutes);

  const httpServer = createServer(app);
  return httpServer;
}