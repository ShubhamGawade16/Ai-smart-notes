import type { Express } from "express";
import { aiBrain } from "../services/ai-brain";
import { storage } from "../storage";

export function registerAIBrainRoutes(app: Express) {
  
  // Smart Segregation - AI automatically organizes tasks
  app.post("/api/ai-brain/smart-segregation", async (req, res) => {
    try {
      const { userQuery } = req.body;
      const tasks = await storage.getTasks("demo-user");
      
      const segregation = await aiBrain.smartSegregation(tasks, userQuery);
      
      res.json({ segregation });
    } catch (error: any) {
      console.error("Smart segregation error:", error);
      res.status(500).json({ error: "Failed to perform smart segregation" });
    }
  });

  // Advanced Analysis - Deep productivity insights
  app.get("/api/ai-brain/advanced-analysis", async (req, res) => {
    try {
      const tasks = await storage.getTasks("demo-user");
      const completedTasks = tasks.filter(t => t.completed);
      const activeTasks = tasks.filter(t => !t.completed);
      
      // Get user patterns (this could be enhanced with actual user data)
      const userPatterns = {
        totalTasks: tasks.length,
        completedTasks: completedTasks.length,
        averageCompletionTime: completedTasks.reduce((acc, t) => acc + (t.actualTime || t.estimatedTime || 0), 0) / Math.max(completedTasks.length, 1),
        mostActiveCategory: 'work', // Could be calculated from actual data
        productiveHours: '9-11 AM'
      };
      
      const analysis = await aiBrain.advancedAnalysis(activeTasks, completedTasks, userPatterns);
      
      res.json({ analysis });
    } catch (error: any) {
      console.error("Advanced analysis error:", error);
      res.status(500).json({ error: "Failed to perform advanced analysis" });
    }
  });

  // AI Breakdown - Break complex tasks into subtasks  
  app.post("/api/ai-brain/breakdown", async (req, res) => {
    try {
      const { taskDescription, context } = req.body;
      
      if (!taskDescription) {
        return res.status(400).json({ error: "Task description is required" });
      }
      
      const breakdown = await aiBrain.aiBreakdown(taskDescription, context);
      
      res.json({ breakdown });
    } catch (error: any) {
      console.error("AI breakdown error:", error);
      res.status(500).json({ error: "Failed to break down task" });
    }
  });

  // Continuous Optimization - Real-time productivity optimization
  app.get("/api/ai-brain/optimize", async (req, res) => {
    try {
      const tasks = await storage.getTasks("demo-user");
      const activeTasks = tasks.filter(t => !t.completed);
      
      // Mock recent activity - in a real app this would come from user interaction logs
      const recentActivity = [
        { action: "completed_task", timestamp: new Date(), task: "example" },
        { action: "created_task", timestamp: new Date(), task: "example" }
      ];
      
      const userPreferences = {
        workingHours: "9-17",
        preferredBreaks: 15,
        focusStyle: "deep_work"
      };
      
      const optimization = await aiBrain.continuousOptimization(recentActivity, activeTasks, userPreferences);
      
      res.json({ optimization });
    } catch (error: any) {
      console.error("Continuous optimization error:", error);
      res.status(500).json({ error: "Failed to optimize productivity" });
    }
  });

  // AI Brain Status - Overall system status and capabilities
  app.get("/api/ai-brain/status", async (req, res) => {
    try {
      const tasks = await storage.getTasks("demo-user");
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.completed).length;
      
      res.json({
        status: "active",
        model: "gpt-4o-mini",
        capabilities: [
          "smart_segregation",
          "advanced_analysis", 
          "ai_breakdown",
          "continuous_optimization"
        ],
        stats: {
          totalTasks,
          completedTasks,
          completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
          lastOptimization: new Date().toISOString()
        },
        recommendations: [
          "AI Brain is actively monitoring your productivity",
          "Smart segregation available for better task organization",
          "Advanced analysis ready to provide deeper insights"
        ]
      });
    } catch (error: any) {
      console.error("AI Brain status error:", error);
      res.status(500).json({ error: "Failed to get AI Brain status" });
    }
  });
}