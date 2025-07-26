import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { aiService } from "./services/ai";
import { insertTaskSchema, updateTaskSchema, insertNoteSchema, updateNoteSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Task routes
  app.get("/api/tasks", async (req, res) => {
    try {
      const tasks = await storage.getTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/today", async (req, res) => {
    try {
      const tasks = await storage.getTodaysTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch today's tasks" });
    }
  });

  app.get("/api/tasks/:id", async (req, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const validatedData = insertTaskSchema.parse(req.body);
      
      // Get AI suggestions for categorization and tagging
      const aiSuggestions = await aiService.categorizeAndTagContent(
        validatedData.title + (validatedData.description ? ` ${validatedData.description}` : ''),
        'task'
      );

      // Merge AI suggestions with user data (user data takes precedence)
      const taskData = {
        ...validatedData,
        category: validatedData.category || aiSuggestions.category,
        tags: validatedData.tags?.length ? validatedData.tags : aiSuggestions.tags,
        priority: validatedData.priority || aiSuggestions.priority || 'medium',
        estimatedTime: validatedData.estimatedTime || aiSuggestions.estimatedTime,
      };

      const task = await storage.createTask(taskData);
      
      // Store AI suggestions in the task object (they're already part of the task creation process)

      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const validatedData = updateTaskSchema.parse({ ...req.body, id: req.params.id });
      const task = await storage.updateTask(req.params.id, validatedData);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTask(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Note routes
  app.get("/api/notes", async (req, res) => {
    try {
      const notes = await storage.getNotes();
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  app.get("/api/notes/recent", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const notes = await storage.getRecentNotes(limit);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent notes" });
    }
  });

  app.get("/api/notes/:id", async (req, res) => {
    try {
      const note = await storage.getNote(req.params.id);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      res.json(note);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch note" });
    }
  });

  app.post("/api/notes", async (req, res) => {
    try {
      const validatedData = insertNoteSchema.parse(req.body);
      
      // Get AI suggestions for categorization
      const aiSuggestions = await aiService.categorizeAndTagContent(
        validatedData.title + ' ' + validatedData.content,
        'note'
      );

      // Generate AI summary
      const aiSummary = await aiService.summarizeNote(validatedData.content);

      const noteData = {
        ...validatedData,
        category: validatedData.category || aiSuggestions.category,
        tags: validatedData.tags?.length ? validatedData.tags : aiSuggestions.tags,
      };

      const note = await storage.createNote(noteData);
      
      // Update note with AI summary if available
      if (aiSummary) {
        const updatedNote = await storage.updateNote(note.id, {
          aiSummary: aiSummary
        });
        res.status(201).json(updatedNote || note);
      } else {
        res.status(201).json(note);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid note data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create note" });
    }
  });

  app.patch("/api/notes/:id", async (req, res) => {
    try {
      const validatedData = updateNoteSchema.parse({ ...req.body, id: req.params.id });
      const note = await storage.updateNote(req.params.id, validatedData);
      
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      res.json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid note data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update note" });
    }
  });

  app.delete("/api/notes/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteNote(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Note not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete note" });
    }
  });

  // AI optimization routes
  app.post("/api/ai/optimize-day", async (req, res) => {
    try {
      const tasks = await storage.getTodaysTasks();
      const optimization = await aiService.optimizeDay({
        tasks,
        currentTime: new Date().toISOString(),
        preferences: req.body.preferences || {}
      });
      res.json(optimization);
    } catch (error) {
      res.status(500).json({ message: "Failed to optimize day" });
    }
  });

  app.get("/api/ai/task-suggestions", async (req, res) => {
    try {
      const tasks = await storage.getTasks();
      const suggestions = await aiService.generateTaskSuggestions(tasks);
      res.json({ suggestions });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate task suggestions" });
    }
  });

  app.get("/api/ai/bottlenecks", async (req, res) => {
    try {
      const tasks = await storage.getTasks();
      const bottlenecks = await aiService.detectBottlenecks(tasks);
      res.json({ bottlenecks });
    } catch (error) {
      res.status(500).json({ message: "Failed to detect bottlenecks" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/stats", async (req, res) => {
    try {
      const stats = await storage.getCompletionStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/categories", async (req, res) => {
    try {
      const [tasks, notes] = await Promise.all([
        storage.getTasks(),
        storage.getNotes()
      ]);
      
      const categoryStats: Record<string, number> = {};
      
      tasks.forEach(task => {
        const category = task.category || 'Uncategorized';
        categoryStats[category] = (categoryStats[category] || 0) + 1;
      });
      
      notes.forEach(note => {
        const category = note.category || 'Uncategorized';
        categoryStats[category] = (categoryStats[category] || 0) + 1;
      });

      const categories = Object.entries(categoryStats).map(([name, count]) => ({
        name,
        count
      }));

      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
