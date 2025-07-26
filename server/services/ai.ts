import OpenAI from 'openai';
import { Task, Note, User, InsertTask } from '@shared/schema';

// Using OpenRouter API instead of OpenAI directly
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const DEFAULT_MODEL = "openai/gpt-4o";

export interface AITaskSuggestion {
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedTime: number; // in minutes
  category: string;
  tags: string[];
  energyLevel: 'low' | 'medium' | 'high';
  dependencies?: string[];
  subtasks?: string[];
  schedulingSuggestion?: string;
}

export interface FocusForecast {
  peakFocusWindows: Array<{
    start: string; // ISO timestamp
    end: string;
    confidenceScore: number;
    energyLevel: 'high' | 'medium' | 'low';
  }>;
  breakRecommendations: Array<{
    time: string;
    duration: number; // minutes
    type: 'short' | 'long' | 'meal';
  }>;
  burnoutRisk: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
    recommendations: string[];
  };
  productivityTips: string[];
}

export interface TaskRefinement {
  refinedTitle: string;
  description: string;
  subtasks: Array<{
    title: string;
    estimatedTime: number;
    priority: 'low' | 'medium' | 'high';
  }>;
  dependencies: string[];
  timeline: string;
  tips: string[];
}

export class AIService {
  // Natural Language Task Entry - Parse user input into structured tasks
  async parseNaturalLanguageTask(input: string, userContext?: User): Promise<InsertTask & { aiSuggestions: AITaskSuggestion }> {
    const prompt = `Parse this natural language task input into a structured task object:

Input: "${input}"

User context: ${userContext ? `Tier: ${userContext.tier}, Current streak: ${userContext.currentStreak}` : 'New user'}

Return a JSON object with:
- title: Clear, actionable title
- description: Expanded description if needed
- priority: low/medium/high/urgent based on urgency indicators
- estimatedTime: Time in minutes (be realistic)
- category: Appropriate category (work, personal, health, etc.)
- tags: Relevant tags array
- energyLevel: low/medium/high energy required
- dueDate: If mentioned, parse to ISO date
- schedulingSuggestion: When this should ideally be done
- dependencies: If this depends on other tasks
- subtasks: If this can be broken down

Focus on being practical and actionable.`;

    try {
      const response = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: "You are an expert task management AI. Always respond with valid JSON." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        title: result.title || input,
        description: result.description || null,
        priority: result.priority || 'medium',
        estimatedTime: result.estimatedTime || 30,
        category: result.category || null,
        tags: result.tags || [],
        energyLevel: result.energyLevel || 'medium',
        dueDate: result.dueDate ? new Date(result.dueDate) : null,
        aiParsedFrom: input,
        aiSuggestions: {
          priority: result.priority || 'medium',
          estimatedTime: result.estimatedTime || 30,
          category: result.category || 'general',
          tags: result.tags || [],
          energyLevel: result.energyLevel || 'medium',
          dependencies: result.dependencies || [],
          subtasks: result.subtasks || [],
          schedulingSuggestion: result.schedulingSuggestion || null,
        }
      };
    } catch (error) {
      console.error('AI task parsing error:', error);
      // Fallback to basic parsing
      return {
        title: input,
        description: null,
        priority: 'medium',
        estimatedTime: 30,
        category: null,
        tags: [],
        energyLevel: 'medium',
        dueDate: null,
        aiParsedFrom: input,
        aiSuggestions: {
          priority: 'medium',
          estimatedTime: 30,
          category: 'general',
          tags: [],
          energyLevel: 'medium',
          dependencies: [],
          subtasks: [],
        }
      };
    }
  }

  // Conversational Task Refiner - Enhanced task breakdown and optimization
  async refineTask(task: Task, userPrompt: string): Promise<TaskRefinement> {
    const prompt = `As an expert productivity coach, help refine this task:

Current Task:
- Title: ${task.title}
- Description: ${task.description || 'None'}
- Priority: ${task.priority}
- Estimated Time: ${task.estimatedTime || 'Not set'} minutes
- Category: ${task.category || 'Uncategorized'}

User Request: "${userPrompt}"

Provide a comprehensive refinement with:
1. A clearer, more actionable title
2. Detailed description with context
3. Breakdown into subtasks with time estimates
4. Dependencies or prerequisites
5. Realistic timeline
6. Practical tips for execution

Return as JSON with these fields: refinedTitle, description, subtasks (array with title, estimatedTime, priority), dependencies (array), timeline (string), tips (array).`;

    try {
      const response = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: "You are a productivity expert who helps break down complex tasks into manageable steps. Always respond with valid JSON." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        refinedTitle: result.refinedTitle || task.title,
        description: result.description || task.description || '',
        subtasks: result.subtasks || [],
        dependencies: result.dependencies || [],
        timeline: result.timeline || 'Complete when convenient',
        tips: result.tips || []
      };
    } catch (error) {
      console.error('Task refinement error:', error);
      return {
        refinedTitle: task.title,
        description: task.description || '',
        subtasks: [],
        dependencies: [],
        timeline: 'Complete when convenient',
        tips: ['Break this task into smaller steps', 'Set a specific time to work on this']
      };
    }
  }

  // Smart Optimization - Reorder tasks based on AI analysis
  async optimizeTasks(tasks: Task[], userContext?: { energyLevel?: number; availableTime?: number; preferences?: any }): Promise<Task[]> {
    if (tasks.length === 0) return tasks;

    const prompt = `Analyze and reorder these tasks for optimal productivity:

Tasks: ${JSON.stringify(tasks.map(t => ({
  id: t.id,
  title: t.title,
  priority: t.priority,
  estimatedTime: t.estimatedTime,
  category: t.category,
  energyLevel: t.energyLevel,
  dueDate: t.dueDate,
  dependencies: t.dependencies
})))}

User Context: ${JSON.stringify(userContext || {})}

Consider:
- Urgency and importance (priority + due dates)
- Energy levels and task requirements
- Time boxing and flow
- Dependencies between tasks
- Context switching costs
- Peak productivity patterns

Return a JSON object with 'optimizedOrder' array containing task IDs in the optimal sequence, and 'reasoning' explaining the reordering logic.`;

    try {
      const response = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: "You are an expert in productivity optimization and task scheduling. Always respond with valid JSON." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.6,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      const optimizedOrder = result.optimizedOrder || tasks.map(t => t.id);
      
      // Reorder tasks based on AI suggestion
      const orderedTasks = optimizedOrder.map((id: string) => 
        tasks.find(t => t.id === id)
      ).filter(Boolean);
      
      // Add any tasks that weren't included in the optimization
      const includedIds = new Set(optimizedOrder);
      const remainingTasks = tasks.filter(t => !includedIds.has(t.id));
      
      return [...orderedTasks, ...remainingTasks];
    } catch (error) {
      console.error('Task optimization error:', error);
      // Fallback to simple priority-based sorting
      return tasks.sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
      });
    }
  }

  // Predictive Insights - Generate personalized productivity tips
  async generateInsights(
    user: User, 
    tasks: Task[], 
    completionHistory: any[] = [],
    focusHistory: any[] = []
  ): Promise<Array<{ type: string; title: string; content: string; confidence: number }>> {
    const prompt = `Generate personalized productivity insights for this user:

User Profile:
- Tier: ${user.tier}
- Current Streak: ${user.currentStreak} days
- Total XP: ${user.totalXp}
- Total Tasks: ${tasks.length}

Active Tasks: ${JSON.stringify(tasks.map(t => ({
  title: t.title,
  priority: t.priority,
  category: t.category,
  estimatedTime: t.estimatedTime,
  completed: t.completed
})))}

Completion Patterns: ${JSON.stringify(completionHistory.slice(-10))}

Generate 3-5 actionable insights including:
1. Productivity tips based on patterns
2. Bottleneck identification
3. Time management suggestions
4. Habit formation recommendations
5. Energy optimization advice

Return JSON array with objects containing: type, title, content, confidence (0-1).`;

    try {
      const response = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: "You are a productivity coach who provides personalized, actionable insights based on user behavior patterns. Always respond with valid JSON." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return result.insights || [
        {
          type: 'productivity_tip',
          title: 'Start with Quick Wins',
          content: 'Try completing 1-2 small tasks first to build momentum for larger ones.',
          confidence: 0.8
        }
      ];
    } catch (error) {
      console.error('Insights generation error:', error);
      return [
        {
          type: 'productivity_tip',
          title: 'Stay Consistent',
          content: 'Keep up your daily task completion streak to build lasting habits.',
          confidence: 0.7
        }
      ];
    }
  }

  // Focus Forecast - ML-based productivity prediction
  async generateFocusForecast(
    user: User,
    historicalData: any = {},
    daysAhead: number = 3
  ): Promise<FocusForecast> {
    const prompt = `Generate a focus forecast for the next ${daysAhead} days based on this user data:

User: Tier ${user.tier}, Streak: ${user.currentStreak} days
Historical Data: ${JSON.stringify(historicalData)}

Predict:
1. Peak focus windows (time ranges when user is most productive)
2. Recommended break times and durations
3. Burnout risk assessment with mitigation strategies
4. Personalized productivity tips

Consider factors like:
- Historical completion patterns
- Energy levels throughout the day
- Weekly cycles and weekend patterns
- Current workload and stress indicators

Return JSON with: peakFocusWindows (array with start, end, confidenceScore, energyLevel), breakRecommendations (array with time, duration, type), burnoutRisk (level, factors, recommendations), productivityTips (array).`;

    try {
      const response = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: "You are an expert in circadian rhythms, productivity science, and behavioral psychology. Generate realistic, science-based predictions. Always respond with valid JSON." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.6,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        peakFocusWindows: result.peakFocusWindows || [
          {
            start: new Date().toISOString(),
            end: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            confidenceScore: 0.7,
            energyLevel: 'high' as const
          }
        ],
        breakRecommendations: result.breakRecommendations || [
          { time: '14:00', duration: 15, type: 'short' as const }
        ],
        burnoutRisk: result.burnoutRisk || {
          level: 'low' as const,
          factors: ['Consistent completion rate'],
          recommendations: ['Maintain current pace']
        },
        productivityTips: result.productivityTips || ['Focus on high-energy tasks during morning hours']
      };
    } catch (error) {
      console.error('Focus forecast error:', error);
      return {
        peakFocusWindows: [
          {
            start: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            end: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
            confidenceScore: 0.6,
            energyLevel: 'medium'
          }
        ],
        breakRecommendations: [
          { time: '15:00', duration: 10, type: 'short' }
        ],
        burnoutRisk: {
          level: 'low',
          factors: [],
          recommendations: ['Keep up the good work!']
        },
        productivityTips: ['Take regular breaks to maintain focus']
      };
    }
  }

  // Auto-Schedule to Calendar - AI-powered scheduling
  async generateSchedule(
    tasks: Task[],
    availableTimeSlots: Array<{ start: Date; end: Date }>,
    userPreferences: any = {}
  ): Promise<Array<{ taskId: string; scheduledAt: Date; duration: number; reasoning: string }>> {
    const prompt = `Create an optimal schedule for these tasks within the available time slots:

Tasks: ${JSON.stringify(tasks.map(t => ({
  id: t.id,
  title: t.title,
  estimatedTime: t.estimatedTime,
  priority: t.priority,
  energyLevel: t.energyLevel,
  dueDate: t.dueDate,
  dependencies: t.dependencies
})))}

Available Time Slots: ${JSON.stringify(availableTimeSlots)}
User Preferences: ${JSON.stringify(userPreferences)}

Consider:
- Task priorities and due dates
- Energy level requirements vs time of day
- Context switching costs
- Buffer time between tasks
- Dependencies and prerequisites

Return JSON with 'schedule' array containing: taskId, scheduledAt (ISO timestamp), duration (minutes), reasoning.`;

    try {
      const response = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: "You are an expert calendar scheduler and time management consultant. Create realistic, achievable schedules. Always respond with valid JSON." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.5,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return result.schedule || [];
    } catch (error) {
      console.error('Auto-schedule error:', error);
      return [];
    }
  }

  // Generate note summary
  async summarizeNote(note: Note): Promise<string> {
    const prompt = `Summarize this note in 1-2 concise sentences:

Title: ${note.title}
Content: ${note.content}

Focus on key points and actionable insights.`;

    try {
      const response = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: "You are an expert at extracting key insights and creating concise summaries." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
      });

      return response.choices[0].message.content || 'Summary not available';
    } catch (error) {
      console.error('Note summarization error:', error);
      return 'Summary not available';
    }
  }

  // Chat-based AI assistant
  async chatResponse(
    message: string,
    userContext: { user: User; tasks: Task[]; notes: Note[] }
  ): Promise<string> {
    const prompt = `You are a personal productivity assistant. Help the user with their tasks and productivity.

User Context:
- Tier: ${userContext.user.tier}
- Current Streak: ${userContext.user.currentStreak} days
- Active Tasks: ${userContext.tasks.length}
- Recent Notes: ${userContext.notes.length}

User Message: "${message}"

Provide helpful, actionable advice. If they're asking about specific tasks or productivity strategies, reference their current data when relevant. Be encouraging and practical.`;

    try {
      const response = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: "You are a knowledgeable, encouraging productivity coach. Keep responses practical and personalized." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
      });

      return response.choices[0].message.content || "I'm here to help you stay productive! What would you like to know?";
    } catch (error) {
      console.error('Chat response error:', error);
      return "I'm here to help you stay productive! What would you like to know?";
    }
  }
}

export const aiService = new AIService();