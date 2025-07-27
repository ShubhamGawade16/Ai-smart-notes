import OpenAI from "openai";
import type { Task, Note, User } from "@shared/schema";

// Use OpenAI API for AI features
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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
  // Conversational Task Refiner - Core feature for all tiers
  async refineTask(taskContent: string, refinementRequest: string, userTier: string): Promise<{
    refinedTask: string;
    suggestions: string[];
    decomposition?: string[];
  }> {
    const dailyLimit = userTier === 'free' ? 3 : 999;
    
    try {
      const model = userTier === 'free' ? "gpt-4o-mini" : "gpt-4o";
      
      const response = await openai.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: `You are a productivity assistant that helps refine tasks. Based on the user's request, improve the task clarity, break it into steps if needed, and provide actionable suggestions. 
            
            For free users: Focus on basic clarity improvements.
            For paid users: Provide detailed decomposition and advanced optimization suggestions.
            
            Respond with JSON: {
              "refinedTask": "improved task description",
              "suggestions": ["suggestion1", "suggestion2"],
              "decomposition": ["step1", "step2", "step3"] // only for paid users or if specifically requested
            }`
          },
          {
            role: "user",
            content: `Task: "${taskContent}"\nUser request: "${refinementRequest}"\nUser tier: ${userTier}`
          }
        ],
        max_tokens: userTier === 'free' ? 300 : 600,
        temperature: 0.7,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        refinedTask: result.refinedTask || taskContent,
        suggestions: result.suggestions || [],
        decomposition: userTier !== 'free' ? result.decomposition : undefined
      };
    } catch (error) {
      console.error('Task refinement error:', error);
      return {
        refinedTask: taskContent,
        suggestions: ['Unable to process refinement request at this time'],
        decomposition: undefined
      };
    }
  }

  // Natural Language Task Parsing - Core Phase 3 feature
  async parseNaturalLanguageTask(input: string, userTier: string): Promise<{
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    categories: string[];
    tags: string[];
    estimatedTime: number;
    dueDate?: Date;
  }> {
    try {
      const model = userTier === 'free' ? "gpt-4o-mini" : "gpt-4o";
      
      const response = await openai.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: `Parse natural language task input into structured data. Return JSON with:
            {
              "title": "clear, actionable task title",
              "description": "optional detailed description",
              "priority": "low|medium|high|urgent",
              "categories": ["category1", "category2"],
              "tags": ["tag1", "tag2"],
              "estimatedTime": number_in_minutes,
              "dueDate": "ISO_date_string_if_mentioned"
            }
            
            Extract due dates from phrases like "by Friday", "tomorrow", "next week", etc.
            Infer priority from urgency words like "urgent", "ASAP", "when you can", etc.`
          },
          {
            role: "user",
            content: `Parse this task: "${input}"`
          }
        ],
        max_tokens: 400,
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        title: result.title || input,
        description: result.description,
        priority: result.priority || 'medium',
        categories: result.categories || ['General'],
        tags: result.tags || [],
        estimatedTime: result.estimatedTime || 30,
        dueDate: result.dueDate ? new Date(result.dueDate) : undefined
      };
    } catch (error) {
      console.error('Natural language parsing error:', error);
      return {
        title: input,
        priority: 'medium' as const,
        categories: ['General'],
        tags: [],
        estimatedTime: 30
      };
    }
  }

  // Focus Forecast - Advanced Pro feature (enabled for testing)
  async generateFocusForecast(userId: string, userTier: string, historicalData?: any): Promise<{
    peakFocusWindows: Array<{start: string, end: string, confidence: number}>;
    suggestedBreaks: Array<{time: string, duration: number, reason: string}>;
    burnoutRisk: {level: 'low' | 'medium' | 'high', factors: string[], recommendations: string[]};
  }> {
    // Enable for all users during testing
    // if (!['advanced_pro', 'premium_pro'].includes(userTier)) {
    //   return {
    //     peakFocusWindows: [],
    //     suggestedBreaks: [],
    //     burnoutRisk: {
    //       level: 'low',
    //       factors: ['Upgrade to Advanced Pro for focus forecasting'],
    //       recommendations: ['Unlock predictive focus insights with Advanced Pro subscription']
    //     }
    //   };
    // }

    try {
      // Mock focus forecast based on typical productivity patterns
      // In production, this would use actual ML models trained on user data
      const now = new Date();
      const peakFocusWindows = [
        {
          start: '09:00',
          end: '11:00', 
          confidence: 0.85
        },
        {
          start: '14:00',
          end: '16:00',
          confidence: 0.78
        }
      ];

      const suggestedBreaks = [
        {
          time: '11:00',
          duration: 15,
          reason: 'Post-peak focus recovery'
        },
        {
          time: '16:00', 
          duration: 10,
          reason: 'Afternoon energy dip mitigation'
        }
      ];

      const burnoutRisk = {
        level: 'medium' as const,
        factors: ['High task completion variance', 'Irregular break patterns'],
        recommendations: [
          'Schedule regular breaks during peak focus windows',
          'Consider time-blocking for consistent energy management',
          'Implement the 90-minute focus/break cycle'
        ]
      };

      return { peakFocusWindows, suggestedBreaks, burnoutRisk };
    } catch (error) {
      console.error('Focus forecast error:', error);
      return {
        peakFocusWindows: [],
        suggestedBreaks: [],
        burnoutRisk: { level: 'low', factors: [], recommendations: [] }
      };
    }
  }

  // FREE TIER: Basic AI categorization (5 requests/day)
  async categorizeContent(content: string, userTier: string): Promise<CategorySuggestion[]> {
    if (userTier === 'free') {
      // Simplified categorization for free users
      return this.basicCategorization(content);
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // High-quality model for paid users
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
          ? "gpt-4o" 
          : "gpt-4o-mini",
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
        estimatedMinutes: t.estimatedTime || 30,
        dueDate: t.dueDate
      }));

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
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
        model: "gpt-4o",
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