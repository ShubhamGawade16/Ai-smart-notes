import OpenAI from "openai";
import type { Task, Note, AIOptimizationRequest, AIOptimizationResponse } from "@shared/schema";

// Using OpenRouter API for access to multiple AI models
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://github.com/user/ai-smart-notes",
    "X-Title": "AI Smart Notes",
  },
});

export class AIService {
  async categorizeAndTagContent(content: string, type: 'task' | 'note'): Promise<{
    category: string;
    tags: string[];
    priority?: 'low' | 'medium' | 'high';
    estimatedTime?: number;
  }> {
    try {
      const prompt = type === 'task' 
        ? `Analyze this task and provide categorization, tags, priority level, and time estimate. Task: "${content}"

        Respond with JSON in this format:
        {
          "category": "string (e.g., Work, Personal, Health, Learning, Shopping, etc.)",
          "tags": ["array", "of", "relevant", "tags"],
          "priority": "low|medium|high",
          "estimatedTime": number_in_minutes
        }`
        : `Analyze this note and provide categorization and tags. Note: "${content}"

        Respond with JSON in this format:
        {
          "category": "string (e.g., Work, Personal, Ideas, Meeting Notes, etc.)",
          "tags": ["array", "of", "relevant", "tags"]
        }`;

      const response = await openai.chat.completions.create({
        model: "openai/gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an AI assistant that helps categorize and organize tasks and notes. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 200
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        category: result.category || 'General',
        tags: Array.isArray(result.tags) ? result.tags : [],
        priority: result.priority || undefined,
        estimatedTime: result.estimatedTime || undefined,
      };
    } catch (error) {
      console.error('AI categorization failed:', error);
      return {
        category: 'General',
        tags: [],
        priority: type === 'task' ? 'medium' : undefined,
        estimatedTime: type === 'task' ? 30 : undefined,
      };
    }
  }

  async optimizeDay(request: AIOptimizationRequest): Promise<AIOptimizationResponse> {
    try {
      const prompt = `Analyze these tasks and optimize the daily schedule for maximum productivity.

      Tasks: ${JSON.stringify(request.tasks.map(t => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        category: t.category,
        estimatedTime: t.estimatedTime,
        completed: t.completed
      })))}

      Current time: ${request.currentTime || new Date().toISOString()}
      
      Preferences: ${JSON.stringify(request.preferences || {})}

      Provide optimization recommendations with the following JSON format:
      {
        "optimizedTasks": [
          {
            "id": "task_id",
            "suggestedTime": "HH:MM AM/PM",
            "reasoning": "why this time works best"
          }
        ],
        "insights": [
          {
            "type": "productivity|bottleneck|suggestion",
            "message": "insight description",
            "priority": "high|medium|low"
          }
        ],
        "estimatedCompletionTime": "HH:MM AM/PM"
      }

      Focus on:
      1. Grouping similar tasks to reduce context switching
      2. Scheduling high-priority tasks during peak productivity hours
      3. Identifying bottlenecks and dependencies
      4. Balancing workload throughout the day
      5. Considering break times and task complexity`;

      const response = await openai.chat.completions.create({
        model: "openai/gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an AI productivity consultant that optimizes daily schedules and provides actionable insights."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      // Merge AI suggestions with original tasks
      const optimizedTasks = request.tasks.map(task => {
        const aiSuggestion = result.optimizedTasks?.find((t: any) => t.id === task.id);
        return {
          ...task,
          suggestedTime: aiSuggestion?.suggestedTime,
          reasoning: aiSuggestion?.reasoning,
        };
      });

      return {
        optimizedTasks,
        insights: result.insights || [],
        estimatedCompletionTime: result.estimatedCompletionTime,
      };
    } catch (error) {
      console.error('AI optimization failed:', error);
      return {
        optimizedTasks: request.tasks,
        insights: [
          {
            type: "suggestion",
            message: "AI optimization is temporarily unavailable. Try again later.",
            priority: "low"
          }
        ],
      };
    }
  }

  async generateTaskSuggestions(existingTasks: Task[]): Promise<string[]> {
    try {
      const taskSummary = existingTasks
        .filter(t => !t.completed)
        .slice(0, 10)
        .map(t => `${t.title} (${t.category})`)
        .join(', ');

      const prompt = `Based on these existing tasks: ${taskSummary}

      Suggest 3-5 related or complementary tasks that would be helpful. Consider:
      1. Follow-up actions
      2. Preparation tasks
      3. Related maintenance tasks
      4. Skills development
      5. Process improvements

      Respond with JSON in this format:
      {
        "suggestions": ["task1", "task2", "task3"]
      }`;

      const response = await openai.chat.completions.create({
        model: "openai/gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that suggests relevant tasks based on existing work patterns."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 300
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return result.suggestions || [];
    } catch (error) {
      console.error('Task suggestion failed:', error);
      return [];
    }
  }

  async summarizeNote(content: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: "openai/gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an AI assistant that creates concise, helpful summaries of notes. Keep summaries under 100 words and focus on key points."
          },
          {
            role: "user",
            content: `Please summarize this note: ${content}`
          }
        ],
        max_tokens: 150
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Note summarization failed:', error);
      return '';
    }
  }

  async detectBottlenecks(tasks: Task[]): Promise<Array<{
    type: string;
    message: string;
    taskIds: string[];
  }>> {
    try {
      const incompleteTasks = tasks.filter(t => !t.completed);
      
      if (incompleteTasks.length === 0) {
        return [];
      }

      const taskAnalysis = incompleteTasks.map(t => ({
        id: t.id,
        title: t.title,
        category: t.category,
        priority: t.priority,
        estimatedTime: t.estimatedTime,
        tags: t.tags
      }));

      const prompt = `Analyze these tasks for potential bottlenecks and productivity issues:

      ${JSON.stringify(taskAnalysis)}

      Look for:
      1. Tasks that block others (dependencies)
      2. Overloaded categories
      3. High-priority tasks without time estimates
      4. Similar tasks that could be batched
      5. Tasks that might be waiting on external factors

      Respond with JSON in this format:
      {
        "bottlenecks": [
          {
            "type": "dependency|overload|estimation|batching|external",
            "message": "description of the issue",
            "taskIds": ["id1", "id2"]
          }
        ]
      }`;

      const response = await openai.chat.completions.create({
        model: "openai/gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an AI productivity analyst that identifies workflow bottlenecks and inefficiencies."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 500
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return result.bottlenecks || [];
    } catch (error) {
      console.error('Bottleneck detection failed:', error);
      return [];
    }
  }
}

export const aiService = new AIService();
