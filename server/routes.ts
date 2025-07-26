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
  // TASK ROUTES
  // ============================================================================

  // Get all tasks for user
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

  // Create new task
  app.post("/api/tasks", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "User ID not found in token" });
      }

      const validatedData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(req.userId, validatedData);
      
      res.status(201).json({ task });
    } catch (error) {
      console.error("Create task error:", error);
      res.status(400).json({ error: "Failed to create task" });
    }
  });

  // Update task
  app.patch("/api/tasks/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "User ID not found in token" });
      }

      const { id } = req.params;
      const validatedData = updateTaskSchema.parse(req.body);
      const task = await storage.updateTask(id, req.userId, validatedData);
      
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
  app.delete("/api/tasks/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "User ID not found in token" });
      }

      const { id } = req.params;
      const success = await storage.deleteTask(id, req.userId);
      
      if (!success) {
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