import OpenAI from "openai";
import type { Task, Note, User } from "@shared/schema";

// Use OpenRouter API with multiple model support
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://replit.com", // Optional, for including your app in OpenRouter rankings
    "X-Title": "AI Smart Notes", // Optional, shows up in rankings
  }
});

export interface AIInsight {
  type: 'optimization' | 'pattern' | 'productivity' | 'warning';
  title: string;
  description: string;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface CategorySuggestion {
  category: string;
  confidence: number;
  reason: string;
}

export interface TaskAnalysis {
  priority: 'low' | 'medium' | 'high';
  estimatedTime: number; // minutes
  categories: string[];
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

// AI Service Class with tier-based limitations
export class AIService {
  // FREE TIER: Basic AI categorization (5 requests/day)
  async categorizeContent(content: string, userTier: string): Promise<CategorySuggestion[]> {
    if (userTier === 'free') {
      // Simplified categorization for free users
      return this.basicCategorization(content);
    }

    try {
      const response = await openai.chat.completions.create({
        model: "anthropic/claude-3.5-sonnet", // High-quality model for paid users
        messages: [
          {
            role: "system",
            content: "You are an AI that categorizes tasks and notes. Respond with JSON format: {\"categories\": [{\"category\": \"string\", \"confidence\": number, \"reason\": \"string\"}]}"
          },
          {
            role: "user",
            content: `Categorize this content and suggest 2-3 relevant categories: "${content}"`
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      const result = JSON.parse(response.choices[0].message.content || '{"categories": []}');
      return result.categories || [];
    } catch (error) {
      console.error('AI categorization error:', error);
      return this.basicCategorization(content);
    }
  }

  // BASIC/PRO TIER: Smart task analysis
  async analyzeTask(task: Task, userTier: string): Promise<TaskAnalysis> {
    if (userTier === 'free') {
      return {
        priority: 'medium',
        estimatedTime: 30,
        categories: ['General'],
        tags: [],
        difficulty: 'medium'
      };
    }

    try {
      const response = await openai.chat.completions.create({
        model: userTier === 'advanced_pro' || userTier === 'premium_pro' 
          ? "anthropic/claude-3.5-sonnet" 
          : "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Analyze tasks and provide structured insights. Respond with JSON: {\"priority\": \"low|medium|high\", \"estimatedTime\": number, \"categories\": [\"string\"], \"tags\": [\"string\"], \"difficulty\": \"easy|medium|hard\"}"
          },
          {
            role: "user",
            content: `Analyze this task: "${task.title}" - ${task.description || 'No description'}`
          }
        ],
        max_tokens: 400,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        priority: result.priority || 'medium',
        estimatedTime: result.estimatedTime || 30,
        categories: result.categories || ['General'],
        tags: result.tags || [],
        difficulty: result.difficulty || 'medium'
      };
    } catch (error) {
      console.error('Task analysis error:', error);
      return {
        priority: 'medium',
        estimatedTime: 30,
        categories: ['General'],
        tags: [],
        difficulty: 'medium'
      };
    }
  }

  // PRO TIER: Advanced productivity insights
  async generateProductivityInsights(tasks: Task[], notes: Note[], userTier: string): Promise<AIInsight[]> {
    if (userTier === 'free') {
      return [{
        type: 'productivity',
        title: 'Upgrade for AI Insights',
        description: 'Get personalized productivity insights with a Pro subscription.',
        actionable: false,
        priority: 'low'
      }];
    }

    try {
      const taskData = tasks.slice(0, 20).map(t => ({
        title: t.title,
        completed: t.completed,
        priority: t.priority,
        dueDate: t.dueDate
      }));

      const response = await openai.chat.completions.create({
        model: userTier === 'premium_pro' 
          ? "anthropic/claude-3.5-sonnet" 
          : "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Analyze productivity patterns and provide insights. Respond with JSON: {\"insights\": [{\"type\": \"optimization|pattern|productivity|warning\", \"title\": \"string\", \"description\": \"string\", \"actionable\": boolean, \"priority\": \"low|medium|high\"}]}"
          },
          {
            role: "user",
            content: `Analyze these tasks for productivity insights: ${JSON.stringify(taskData)}`
          }
        ],
        max_tokens: 600,
      });

      const result = JSON.parse(response.choices[0].message.content || '{"insights": []}');
      return result.insights || [];
    } catch (error) {
      console.error('Productivity insights error:', error);
      return [];
    }
  }

  // ADVANCED PRO: Smart scheduling optimization
  async optimizeSchedule(tasks: Task[], userTier: string): Promise<{ optimizedTasks: Task[], insights: string[] }> {
    if (!['advanced_pro', 'premium_pro'].includes(userTier)) {
      return {
        optimizedTasks: tasks,
        insights: ['Schedule optimization available in Advanced Pro+']
      };
    }

    try {
      const taskData = tasks.map(t => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        estimatedMinutes: t.estimatedMinutes || 30,
        dueDate: t.dueDate
      }));

      const response = await openai.chat.completions.create({
        model: "anthropic/claude-3.5-sonnet",
        messages: [
          {
            role: "system",
            content: "Optimize task scheduling based on priority, time estimates, and due dates. Return JSON with 'optimizedOrder' (array of task IDs) and 'insights' (array of optimization tips)."
          },
          {
            role: "user",
            content: `Optimize the order of these tasks: ${JSON.stringify(taskData)}`
          }
        ],
        max_tokens: 800,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      // Reorder tasks based on AI suggestion
      const optimizedTasks = result.optimizedOrder 
        ? result.optimizedOrder.map((id: string) => tasks.find(t => t.id === id)).filter(Boolean)
        : tasks;

      return {
        optimizedTasks: optimizedTasks.length ? optimizedTasks : tasks,
        insights: result.insights || ['Tasks analyzed for optimal scheduling']
      };
    } catch (error) {
      console.error('Schedule optimization error:', error);
      return { optimizedTasks: tasks, insights: [] };
    }
  }

  // PREMIUM: Advanced note summarization with context
  async summarizeNote(note: Note, userTier: string): Promise<string> {
    if (!['premium_pro'].includes(userTier)) {
      return note.content.slice(0, 150) + '...';
    }

    try {
      const response = await openai.chat.completions.create({
        model: "anthropic/claude-3.5-sonnet",
        messages: [
          {
            role: "system",
            content: "Summarize notes concisely while preserving key information and insights."
          },
          {
            role: "user",
            content: `Summarize this note: "${note.title}" - ${note.content}`
          }
        ],
        max_tokens: 200,
      });

      return response.choices[0].message.content || note.content.slice(0, 150) + '...';
    } catch (error) {
      console.error('Note summarization error:', error);
      return note.content.slice(0, 150) + '...';
    }
  }

  // Fallback basic categorization for free users
  private basicCategorization(content: string): CategorySuggestion[] {
    const keywords = {
      'Work': ['work', 'job', 'office', 'meeting', 'project', 'deadline', 'business'],
      'Personal': ['personal', 'home', 'family', 'friend', 'hobby', 'exercise'],
      'Study': ['study', 'learn', 'course', 'exam', 'research', 'book', 'education'],
      'Health': ['health', 'doctor', 'medicine', 'exercise', 'fitness', 'diet'],
      'Finance': ['money', 'budget', 'bank', 'investment', 'payment', 'bill']
    };

    const suggestions: CategorySuggestion[] = [];
    const lowerContent = content.toLowerCase();

    for (const [category, words] of Object.entries(keywords)) {
      const matches = words.filter(word => lowerContent.includes(word)).length;
      if (matches > 0) {
        suggestions.push({
          category,
          confidence: Math.min(0.9, matches * 0.3),
          reason: `Found ${matches} relevant keyword(s)`
        });
      }
    }

    return suggestions.slice(0, 2);
  }
}

export const aiService = new AIService();