import OpenAI from 'openai';
import { Task, InsertTask } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const GPT_MODEL = "gpt-4o-mini"; // Most cost-effective OpenAI model

// Helper function to clean AI responses
function cleanJsonResponse(content: string): string {
  return content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
}

/**
 * AI BRAIN - Central AI Controller for the entire app
 * This is the main AI system that controls all productivity features
 */
export class AIBrain {
  
  /**
   * SMART SEGREGATION - AI automatically categorizes and organizes all user data
   */
  async smartSegregation(tasks: Task[], userQuery?: string): Promise<{
    categories: {
      name: string;
      tasks: string[];
      priority: 'urgent' | 'high' | 'medium' | 'low';
      estimatedTime: number;
      suggestions: string[];
    }[];
    recommendations: string[];
    autoSchedule: {
      morning: string[];
      afternoon: string[];
      evening: string[];
    };
  }> {
    const prompt = `
You are the AI Brain controlling a productivity app. Analyze these tasks and user context:

TASKS: ${JSON.stringify(tasks.map(t => ({
  id: t.id,
  title: t.title,
  description: t.description,
  priority: t.priority,
  category: t.category,
  tags: t.tags,
  estimatedTime: t.estimatedTime
})))}

USER QUERY: "${userQuery || 'General analysis'}"

Return ONLY a JSON object with smart segregation analysis:
{
  "categories": [
    {
      "name": "category name",
      "tasks": ["task_id1", "task_id2"],
      "priority": "urgent|high|medium|low",
      "estimatedTime": total_minutes,
      "suggestions": ["actionable suggestions for this category"]
    }
  ],
  "recommendations": ["overall productivity recommendations"],
  "autoSchedule": {
    "morning": ["task_id for peak focus tasks"],
    "afternoon": ["task_id for collaborative tasks"],
    "evening": ["task_id for low-energy tasks"]
  }
}

Rules:
- Group tasks by logical themes, urgency, and context
- Provide actionable suggestions for each category
- Schedule tasks based on energy requirements and optimal timing
- Give specific recommendations for productivity improvement
`;

    try {
      const response = await openai.chat.completions.create({
        model: GPT_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error("No AI response");

      return JSON.parse(cleanJsonResponse(content));
    } catch (error) {
      console.error('Smart segregation error:', error);
      // Fallback basic segregation
      return {
        categories: [
          {
            name: "High Priority",
            tasks: tasks.filter(t => t.priority === 'urgent' || t.priority === 'high').map(t => t.id),
            priority: 'high' as const,
            estimatedTime: 120,
            suggestions: ["Focus on these tasks first during peak hours"]
          }
        ],
        recommendations: ["Complete high-priority tasks during your most productive hours"],
        autoSchedule: {
          morning: tasks.slice(0, 2).map(t => t.id),
          afternoon: tasks.slice(2, 4).map(t => t.id),
          evening: tasks.slice(4, 6).map(t => t.id)
        }
      };
    }
  }

  /**
   * ADVANCED ANALYSIS - Deep AI analysis of user patterns and productivity
   */
  async advancedAnalysis(tasks: Task[], completedTasks: Task[], userPatterns: any = {}): Promise<{
    productivityScore: number;
    insights: Array<{
      type: 'pattern' | 'bottleneck' | 'optimization' | 'prediction';
      title: string;
      content: string;
      actionable: boolean;
      confidence: number;
      impact: 'high' | 'medium' | 'low';
    }>;
    predictions: {
      nextWeekProductivity: number;
      riskAreas: string[];
      opportunities: string[];
    };
    personalizedRecommendations: string[];
  }> {
    const prompt = `
You are the AI Brain. Perform advanced analysis on this user's productivity data:

ACTIVE TASKS: ${JSON.stringify(tasks.slice(0, 10))}
COMPLETED TASKS: ${JSON.stringify(completedTasks.slice(0, 10))}
USER PATTERNS: ${JSON.stringify(userPatterns)}

Return ONLY a JSON object with comprehensive analysis:
{
  "productivityScore": 0-100_score,
  "insights": [
    {
      "type": "pattern|bottleneck|optimization|prediction",
      "title": "insight title",
      "content": "detailed analysis (2-3 sentences)",
      "actionable": true,
      "confidence": 0.0-1.0,
      "impact": "high|medium|low"
    }
  ],
  "predictions": {
    "nextWeekProductivity": 0-100_predicted_score,
    "riskAreas": ["potential problems"],
    "opportunities": ["improvement opportunities"]
  },
  "personalizedRecommendations": ["specific actionable advice"]
}

Rules:
- Analyze completion patterns, time estimates vs actual, category distributions
- Identify bottlenecks and optimization opportunities
- Provide predictive insights about future productivity
- Give personalized, actionable recommendations
`;

    try {
      const response = await openai.chat.completions.create({
        model: GPT_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error("No AI response");

      return JSON.parse(cleanJsonResponse(content));
    } catch (error) {
      console.error('Advanced analysis error:', error);
      // Fallback analysis
      return {
        productivityScore: 75,
        insights: [
          {
            type: 'pattern' as const,
            title: "Consistent Task Completion",
            content: "You show good consistency in completing tasks. Focus on maintaining this momentum.",
            actionable: true,
            confidence: 0.8,
            impact: 'medium' as const
          }
        ],
        predictions: {
          nextWeekProductivity: 78,
          riskAreas: ["Task overload during peak hours"],
          opportunities: ["Better time blocking for deep work"]
        },
        personalizedRecommendations: ["Schedule challenging tasks during your peak energy hours"]
      };
    }
  }

  /**
   * AI BREAKDOWN - Break down complex tasks into manageable subtasks
   */
  async aiBreakdown(taskDescription: string, context?: any): Promise<{
    originalTask: string;
    breakdown: Array<{
      id: string;
      title: string;
      description: string;
      estimatedTime: number;
      priority: 'urgent' | 'high' | 'medium' | 'low';
      dependencies: string[];
      category: string;
      tags: string[];
    }>;
    workflow: {
      phase: string;
      tasks: string[];
      description: string;
    }[];
    tips: string[];
  }> {
    const prompt = `
You are the AI Brain. Break down this complex task into manageable subtasks:

TASK: "${taskDescription}"
CONTEXT: ${JSON.stringify(context || {})}

Return ONLY a JSON object with intelligent task breakdown:
{
  "originalTask": "${taskDescription}",
  "breakdown": [
    {
      "id": "unique_id",
      "title": "subtask title",
      "description": "what needs to be done",
      "estimatedTime": minutes,
      "priority": "urgent|high|medium|low",
      "dependencies": ["id_of_prerequisite_tasks"],
      "category": "work|personal|learning|health|other",
      "tags": ["relevant", "tags"]
    }
  ],
  "workflow": [
    {
      "phase": "phase name",
      "tasks": ["subtask_ids"],
      "description": "what happens in this phase"
    }
  ],
  "tips": ["productivity tips for completing this task"]
}

Rules:
- Break into 3-8 logical subtasks
- Set realistic time estimates
- Identify dependencies between tasks
- Group into logical workflow phases
- Provide specific productivity tips
`;

    try {
      const response = await openai.chat.completions.create({
        model: GPT_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error("No AI response");

      return JSON.parse(cleanJsonResponse(content));
    } catch (error) {
      console.error('AI breakdown error:', error);
      // Fallback breakdown
      return {
        originalTask: taskDescription,
        breakdown: [
          {
            id: "step1",
            title: "Plan and Research",
            description: "Gather information and create a plan",
            estimatedTime: 30,
            priority: 'high' as const,
            dependencies: [],
            category: "work",
            tags: ["planning", "research"]
          },
          {
            id: "step2", 
            title: "Execute Main Task",
            description: "Complete the primary work",
            estimatedTime: 60,
            priority: 'high' as const,
            dependencies: ["step1"],
            category: "work",
            tags: ["execution"]
          }
        ],
        workflow: [
          {
            phase: "Preparation",
            tasks: ["step1"],
            description: "Set up and plan the work"
          },
          {
            phase: "Execution",
            tasks: ["step2"],
            description: "Complete the main task"
          }
        ],
        tips: ["Break the work into focused sessions", "Start with the most challenging parts"]
      };
    }
  }

  /**
   * CONTINUOUS OPTIMIZATION - AI monitors and optimizes user productivity in real-time
   */
  async continuousOptimization(
    recentActivity: any[],
    currentTasks: Task[],
    userPreferences: any = {}
  ): Promise<{
    immediateActions: string[];
    optimizations: Array<{
      area: string;
      current: string;
      suggested: string;
      impact: 'high' | 'medium' | 'low';
      effort: 'easy' | 'moderate' | 'challenging';
    }>;
    adaptiveSchedule: {
      now: string;
      next2Hours: string[];
      today: string[];
      thisWeek: string[];
    };
  }> {
    const prompt = `
You are the AI Brain providing continuous optimization. Analyze current state and optimize:

RECENT ACTIVITY: ${JSON.stringify(recentActivity.slice(0, 5))}
CURRENT TASKS: ${JSON.stringify(currentTasks.slice(0, 8))}
USER PREFERENCES: ${JSON.stringify(userPreferences)}

Return ONLY a JSON object with optimization recommendations:
{
  "immediateActions": ["actions to take right now"],
  "optimizations": [
    {
      "area": "time management|focus|organization|habits",
      "current": "current situation",
      "suggested": "suggested improvement",
      "impact": "high|medium|low",
      "effort": "easy|moderate|challenging"
    }
  ],
  "adaptiveSchedule": {
    "now": "what to focus on immediately",
    "next2Hours": ["tasks for next 2 hours"],
    "today": ["priority tasks for today"],
    "thisWeek": ["weekly objectives"]
  }
}

Rules:
- Provide actionable immediate suggestions
- Identify optimization opportunities with impact/effort analysis
- Create adaptive scheduling based on energy and priority
- Consider user preferences and patterns
`;

    try {
      const response = await openai.chat.completions.create({
        model: GPT_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1200,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error("No AI response");

      return JSON.parse(cleanJsonResponse(content));
    } catch (error) {
      console.error('Continuous optimization error:', error);
      // Fallback optimization
      return {
        immediateActions: ["Focus on your highest priority task for the next 25 minutes"],
        optimizations: [
          {
            area: "focus",
            current: "Working on multiple tasks simultaneously",
            suggested: "Use time blocks to focus on one task at a time",
            impact: 'high' as const,
            effort: 'easy' as const
          }
        ],
        adaptiveSchedule: {
          now: "Complete your most important task",
          next2Hours: ["Finish current high-priority items"],
          today: ["Focus on urgent and important tasks"],
          thisWeek: ["Maintain consistent progress on key objectives"]
        }
      };
    }
  }
}

// Export singleton instance
export const aiBrain = new AIBrain();