import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  authenticateToken, 
  type AuthRequest 
} from "./auth";
import { 
  insertTaskSchema, 
  updateTaskSchema,
  insertNoteSchema,
  updateNoteSchema,
  type Task,
  type Note
} from "@shared/schema";

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
  // AI ROUTES
  // ============================================================================

  // Get AI insights (PRO feature)
  app.get("/api/ai/insights", async (req: AuthRequest, res) => {
    try {
      const userId = req.headers.authorization?.split(' ')[1] ? 'test-user' : null;
      if (!userId) {
        return res.json([{
          type: 'productivity',
          title: 'Sign in for AI Insights',
          description: 'Log in to get personalized AI-powered productivity insights.',
          actionable: false,
          priority: 'low'
        }]);
      }

      const tasks = await storage.getTasks(userId);
      const notes = await storage.getNotes(userId);
      const user = await storage.getUser(userId);
      
      const { aiService } = await import("./ai");
      const insights = await aiService.generateProductivityInsights(
        tasks, 
        notes, 
        user?.tier || 'free'
      );

      res.json(insights);
    } catch (error) {
      console.error("AI insights error:", error);
      res.json([]);
    }
  });

  // Optimize day schedule (ADVANCED PRO feature)
  app.post("/api/ai/optimize-day", async (req: AuthRequest, res) => {
    try {
      const userId = req.headers.authorization?.split(' ')[1] ? 'test-user' : null;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const tasks = await storage.getTasks(userId);
      const user = await storage.getUser(userId);
      
      const { aiService } = await import("./ai");
      const optimization = await aiService.optimizeSchedule(tasks, user?.tier || 'free');

      res.json(optimization);
    } catch (error) {
      console.error("Day optimization error:", error);
      res.status(500).json({ error: "Failed to optimize day" });
    }
  });

  // Smart categorization (BASIC PRO+ feature)
  app.post("/api/ai/categorize", async (req: AuthRequest, res) => {
    try {
      const { content } = req.body;
      const userId = req.headers.authorization?.split(' ')[1] ? 'test-user' : null;
      const user = userId ? await storage.getUser(userId) : null;
      
      const { aiService } = await import("./ai");
      const categories = await aiService.categorizeContent(content, user?.tier || 'free');

      res.json({ categories });
    } catch (error) {
      console.error("AI categorization error:", error);
      res.status(500).json({ error: "Failed to categorize content" });
    }
  });

  // Conversational Task Refiner (FREE with limits, unlimited for PRO)
  app.post("/api/ai/refine-task", async (req, res) => {
    try {
      const { taskContent, refinementRequest } = req.body;
      const userId = req.headers.authorization?.split(' ')[1] ? 'test-user' : null;
      const user = userId ? await storage.getUser(userId) : null;
      
      const { aiService } = await import("./ai");
      const refinement = await aiService.refineTask(
        taskContent, 
        refinementRequest, 
        user?.tier || 'free'
      );

      res.json(refinement);
    } catch (error) {
      console.error("Task refinement error:", error);
      res.status(500).json({ error: "Failed to refine task" });
    }
  });

  // Focus Forecast (ADVANCED PRO+ feature)
  app.get("/api/ai/focus-forecast", async (req, res) => {
    try {
      const userId = req.headers.authorization?.split(' ')[1] ? 'test-user' : null;
      const user = userId ? await storage.getUser(userId) : null;
      
      const { aiService } = await import("./ai");
      const forecast = await aiService.generateFocusForecast(
        userId || 'anonymous',
        user?.tier || 'free'
      );

      res.json(forecast);
    } catch (error) {
      console.error("Focus forecast error:", error);
      res.status(500).json({ error: "Failed to generate focus forecast" });
    }
  });

  // Auto-Scheduler endpoint (BASIC PRO+ feature)
  app.post("/api/ai/optimize-schedule", async (req, res) => {
    try {
      const userId = req.headers.authorization?.split(' ')[1] ? 'test-user' : null;
      const user = userId ? await storage.getUser(userId) : null;
      
      // Only available for Basic Pro and above
      if (!user || !['basic_pro', 'advanced_pro', 'premium_pro'].includes(user.tier)) {
        return res.status(403).json({ error: "Basic Pro subscription required" });
      }

      const tasks = await storage.getTasks(userId);
      
      // Mock optimization - would use ML model in production
      const optimization = {
        optimizedSchedule: [
          {
            taskId: "1",
            title: "Review quarterly reports",
            startTime: "09:00",
            endTime: "10:30",
            priority: "high",
            estimatedMinutes: 90,
            reasoning: "Scheduled during peak focus window for analytical work"
          },
          {
            taskId: "2", 
            title: "Team standup meeting",
            startTime: "11:00",
            endTime: "11:30",
            priority: "medium",
            estimatedMinutes: 30,
            reasoning: "Collaborative work fits well after individual focus time"
          }
        ],
        insights: {
          totalProductiveHours: 6.5,
          bufferTimeAdded: 45,
          conflictsResolved: 2,
          recommendations: [
            "Consider blocking calendar during deep work sessions",
            "Set phone to do-not-disturb during focus blocks"
          ]
        }
      };
      res.json(optimization);
    } catch (error) {
      console.error("Schedule optimization error:", error);
      res.status(500).json({ error: "Failed to optimize schedule" });
    }
  });

  // Habit Gamification endpoint (FREE core + PRO enhanced)
  app.get("/api/ai/habit-gamification", async (req, res) => {
    try {
      const userId = req.headers.authorization?.split(' ')[1] ? 'test-user' : null;
      const user = userId ? await storage.getUser(userId) : null;
      
      const isPro = user && ['basic_pro', 'advanced_pro', 'premium_pro'].includes(user.tier);
      const isPremium = user && user.tier === 'premium_pro';
      
      const gamification = {
        currentXp: 1250,
        level: 8,
        xpToNextLevel: 350,
        currentStreak: 7,
        longestStreak: 14,
        achievements: [
          {
            id: "early-bird",
            name: "Early Bird",
            description: "Complete 5 tasks before 10 AM",
            icon: "🌅",
            earned: true,
            rarity: "common"
          },
          {
            id: "focus-master",
            name: "Focus Master",
            description: "Complete 3 hours of deep work",
            icon: "🎯",
            earned: true,
            rarity: "rare"
          }
        ],
        dailyChallenges: [
          {
            id: "focus-session",
            title: "Complete 2 Focus Sessions",
            description: "Use 25-minute focused work blocks",
            progress: 1,
            target: 2,
            reward: "+50 XP",
            completed: false
          }
        ],
        powerUps: isPro ? [
          {
            id: "focus-boost",
            name: "Focus Boost",
            description: "Double XP for next task completion",
            rarity: "rare",
            quantity: 2,
            effect: "2x XP for 1 hour"
          }
        ] : [],
        personalityInsights: isPremium ? {
          type: "Achievement Hunter",
          preferredRewards: ["badges", "streaks", "leaderboards"],
          motivationStyle: "Goal-oriented with competitive elements",
          recommendations: [
            "Set weekly milestone challenges",
            "Track progress visually with charts"
          ]
        } : undefined
      };
      res.json(gamification);
    } catch (error) {
      console.error("Habit gamification error:", error);
      res.status(500).json({ error: "Failed to load gamification data" });
    }
  });

  // Power-up usage endpoint (PRO feature)
  app.post("/api/ai/use-power-up/:powerUpId", async (req, res) => {
    try {
      const { powerUpId } = req.params;
      const userId = req.headers.authorization?.split(' ')[1] ? 'test-user' : null;
      const user = userId ? await storage.getUser(userId) : null;
      
      if (!user || !['basic_pro', 'advanced_pro', 'premium_pro'].includes(user.tier)) {
        return res.status(403).json({ error: "Pro subscription required" });
      }

      // Mock power-up activation
      res.json({ success: true, message: `Power-up ${powerUpId} activated!` });
    } catch (error) {
      console.error("Power-up usage error:", error);
      res.status(500).json({ error: "Failed to use power-up" });
    }
  });

  // ============================================================================
  // TASK ROUTES
  // ============================================================================

  // Get all tasks for user
  app.get("/api/tasks", async (req, res) => {
    try {
      // Use test user for now since auth is simplified
      const userId = 'test-user';
      const tasks = await storage.getTasks(userId);
      res.json({ tasks });
    } catch (error) {
      console.error("Get tasks error:", error);
      res.status(500).json({ error: "Failed to get tasks" });
    }
  });

  // Create new task
  app.post("/api/tasks", async (req, res) => {
    try {
      const userId = 'test-user';
      const validatedData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(userId, validatedData);
      
      res.status(201).json({ task });
    } catch (error) {
      console.error("Create task error:", error);
      res.status(400).json({ error: "Failed to create task" });
    }
  });

  // Update task
  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const userId = 'test-user';
      const { id } = req.params;
      const validatedData = updateTaskSchema.parse({...req.body, id});
      const task = await storage.updateTask(id, userId, validatedData);
      
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      res.json({ task });
    } catch (error) {
      console.error("Update task error:", error);
      res.status(400).json({ error: "Failed to update task" });
    }
  });

  // Delete task
  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const userId = 'test-user';
      const { id } = req.params;
      const success = await storage.deleteTask(id, userId);
      
      if (!success) {
        return res.status(404).json({ error: "Task not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Delete task error:", error);
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  // Get today's tasks
  app.get("/api/tasks/today", async (req, res) => {
    try {
      const userId = 'test-user';
      const tasks = await storage.getTasks(userId);
      
      // Filter for today's tasks (due today or no due date but created today)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todayTasks = tasks.filter(task => {
        if (task.dueDate) {
          const dueDate = new Date(task.dueDate);
          return dueDate >= today && dueDate < tomorrow;
        }
        // If no due date, include if created today
        if (task.createdAt) {
          const createdDate = new Date(task.createdAt);
          return createdDate >= today && createdDate < tomorrow;
        }
        return false;
      });
      
      res.json(todayTasks);
    } catch (error) {
      console.error("Get today's tasks error:", error);
      res.status(500).json({ error: "Failed to get today's tasks" });
    }
  });

  // Get recent notes
  app.get("/api/notes/recent", async (req, res) => {
    try {
      const userId = 'test-user';
      const notes = await storage.getNotes(userId);
      
      // Sort by updated date and take the 5 most recent
      const recentNotes = notes
        .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
        .slice(0, 5);
      
      res.json(recentNotes);
    } catch (error) {
      console.error("Get recent notes error:", error);
      res.status(500).json({ error: "Failed to get recent notes" });
    }
  });

  // Get analytics stats
  app.get("/api/analytics/stats", async (req, res) => {
    try {
      const userId = 'test-user';
      const tasks = await storage.getTasks(userId);
      const notes = await storage.getNotes(userId);
      
      const completedTasks = tasks.filter(t => t.completed);
      const pendingTasks = tasks.filter(t => !t.completed);
      
      const stats = {
        totalTasks: tasks.length,
        completedTasks: completedTasks.length,
        pendingTasks: pendingTasks.length,
        totalNotes: notes.length,
        completionRate: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
        weeklyProgress: {
          tasksCompleted: completedTasks.length,
          notesCreated: notes.length
        }
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Get analytics stats error:", error);
      res.status(500).json({ error: "Failed to get analytics stats" });
    }
  });

  // ============================================================================
  // NOTE ROUTES
  // ============================================================================

  // Get all notes for user
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

  // Create new note
  app.post("/api/notes", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "User ID not found in token" });
      }

      const validatedData = insertNoteSchema.parse(req.body);
      const note = await storage.createNote(req.userId, validatedData);
      
      res.status(201).json({ note });
    } catch (error) {
      console.error("Create note error:", error);
      res.status(400).json({ error: "Failed to create note" });
    }
  });

  // Update note
  app.patch("/api/notes/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "User ID not found in token" });
      }

      const { id } = req.params;
      const validatedData = updateNoteSchema.parse(req.body);
      const note = await storage.updateNote(id, req.userId, validatedData);
      
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }

      res.json({ note });
    } catch (error) {
      console.error("Update note error:", error);
      res.status(400).json({ error: "Failed to update note" });
    }
  });

  // Delete note
  app.delete("/api/notes/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "User ID not found in token" });
      }

      const { id } = req.params;
      const success = await storage.deleteNote(id, req.userId);
      
      if (!success) {
        return res.status(404).json({ error: "Note not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Delete note error:", error);
      res.status(500).json({ error: "Failed to delete note" });
    }
  });

  // ============================================================================
  // START SERVER
  // ============================================================================

  const httpServer = createServer(app);
  return httpServer;
}