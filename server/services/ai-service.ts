import OpenAI from 'openai';

// Configure for OpenAI GPT models
if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY environment variable is required');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Available GPT models - you can change this to use different models
const GPT_MODEL = "gpt-4o-mini"; // Options: gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo

// Helper function to clean AI responses
function cleanJsonResponse(content: string): string {
  return content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
}
import { Task, InsertTask } from "@shared/schema";

export interface TaskAnalysis {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  tags: string[];
  estimatedTime: number; // in minutes
  dueDate?: Date;
  subtasks?: string[];
  contextSwitchCost?: number;
}

export interface ProductivityInsight {
  type: 'productivity_tip' | 'bottleneck_analysis' | 'time_optimization' | 'focus_forecast';
  title: string;
  content: string;
  confidence: number;
  actionable: boolean;
  metadata?: any;
}

/**
 * Natural Language Task Entry - Parse user input into structured task
 */
export async function parseNaturalLanguageTask(input: string): Promise<TaskAnalysis> {
  const prompt = `
Analyze this task description and extract structured information:
"${input}"

Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks, no additional text):
{
  "title": "Clear, actionable task title",
  "description": "Additional context if needed",
  "priority": "low|medium|high|urgent",
  "category": "work|personal|health|learning|other",
  "tags": ["relevant", "tags"],
  "estimatedTime": minutes_as_number,
  "dueDate": "YYYY-MM-DD or null",
  "subtasks": ["if task can be broken down"],
  "contextSwitchCost": 1-10_difficulty_switching_to_this_task
}

Rules:
- Priority: urgent if mentions deadline/ASAP, high if important, medium default
- EstimatedTime: realistic minutes based on task complexity
- Category: infer from context
- Tags: 3-5 relevant keywords
- ContextSwitchCost: 1 (easy switch) to 10 (requires deep focus)
- If due date mentioned (today, tomorrow, Friday, etc.), calculate actual date
- Return ONLY the JSON object, no other text or formatting
`;

  try {
    const response = await openai.chat.completions.create({
      model: GPT_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse JSON response (clean markdown if present)
    const analysis = JSON.parse(cleanJsonResponse(content));
    
    // Validate and sanitize response
    return {
      title: analysis.title || input,
      description: analysis.description || undefined,
      priority: ['low', 'medium', 'high', 'urgent'].includes(analysis.priority) 
        ? analysis.priority : 'medium',
      category: analysis.category || 'other',
      tags: Array.isArray(analysis.tags) ? analysis.tags.slice(0, 5) : [],
      estimatedTime: typeof analysis.estimatedTime === 'number' 
        ? Math.max(5, Math.min(480, analysis.estimatedTime)) : 30,
      dueDate: analysis.dueDate ? new Date(analysis.dueDate) : undefined,
      subtasks: Array.isArray(analysis.subtasks) ? analysis.subtasks : undefined,
      contextSwitchCost: typeof analysis.contextSwitchCost === 'number' 
        ? Math.max(1, Math.min(10, analysis.contextSwitchCost)) : 5,
    };
  } catch (error) {
    console.error('AI task parsing error:', error);
    
    // Fallback to basic parsing
    return {
      title: input,
      priority: input.toLowerCase().includes('urgent') || input.includes('ASAP') ? 'urgent' : 'medium',
      category: 'other',
      tags: [],
      estimatedTime: 30,
      contextSwitchCost: 5,
    };
  }
}

/**
 * Smart Task Optimization - Reorder tasks based on AI analysis
 */
export async function optimizeTaskOrder(tasks: Task[], userContext: any = {}): Promise<Task[]> {
  if (tasks.length <= 1) return tasks;

  const prompt = `
You are a productivity optimization AI. Reorder these tasks for maximum efficiency:

Tasks:
${tasks.map((task, i) => `${i + 1}. "${task.title}" (Priority: ${task.priority}, Est: ${task.estimatedTime}min, Due: ${task.dueDate || 'none'})`).join('\n')}

User Context:
- Current time: ${new Date().toISOString()}
- Energy level: ${userContext.energyLevel || 'medium'}
- Available time: ${userContext.availableTime || '4 hours'}

Reorder considering:
1. Deadlines and urgency
2. Energy requirements vs user's current energy
3. Context switching costs
4. Task dependencies
5. Time availability

Respond with JSON array of task indices in optimal order:
[3, 1, 4, 2] (1-based indices)
`;

  try {
    const response = await openai.chat.completions.create({
      model: GPT_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) throw new Error("No response from AI");
    const order = JSON.parse(content);
    
    if (Array.isArray(order) && order.length === tasks.length) {
      return order.map((index: number) => tasks[index - 1]).filter(task => task !== undefined);
    }
  } catch (error) {
    console.error('Task optimization error:', error);
  }

  // Fallback: simple priority and due date sorting
  return [...tasks].sort((a, b) => {
    const priorityWeight: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
    const aPriority = priorityWeight[a.priority as string] || 2;
    const bPriority = priorityWeight[b.priority as string] || 2;
    
    if (aPriority !== bPriority) return bPriority - aPriority;
    
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    
    return 0;
  });
}

/**
 * Generate Productivity Insights
 */
export async function generateProductivityInsights(
  tasks: Task[], 
  completionHistory: any[], 
  userPatterns: any = {}
): Promise<ProductivityInsight[]> {
  const prompt = `
Analyze this user's productivity data and provide actionable insights:

Recent Tasks (${tasks.length}):
${tasks.slice(0, 10).map(t => `- "${t.title}" (${t.priority}, ${t.completed ? 'Done' : 'Pending'})`).join('\n')}

Completion Patterns:
- Average completion rate: ${userPatterns.completionRate || 'N/A'}%
- Most productive time: ${userPatterns.productiveHours || 'Unknown'}
- Common bottlenecks: ${userPatterns.bottlenecks || 'None identified'}
- Streak: ${userPatterns.currentStreak || 0} days

Return ONLY a valid JSON array of insights (no markdown, no code blocks, no additional text):
[
  {
    "type": "productivity_tip|bottleneck_analysis|time_optimization",
    "title": "Actionable insight title",
    "content": "Specific, actionable advice (2-3 sentences)",
    "confidence": 0.85,
    "actionable": true
  }
]

Focus on:
1. Identifying patterns and bottlenecks
2. Suggesting specific improvements
3. Time management optimization
4. Habit formation tips
`;

  // Return fallback insights if AI service is unavailable
  if (!process.env.OPENAI_API_KEY) {
    console.log('OpenAI API key not available, using fallback insights');
    return [
      {
        type: "productivity_tip",
        title: "Establish Consistent Work Blocks",
        content: "Try scheduling 25-minute focused work sessions followed by 5-minute breaks. This technique can improve concentration and reduce mental fatigue.",
        confidence: 0.85,
        actionable: true
      },
      {
        type: "time_optimization", 
        title: "Batch Similar Tasks Together",
        content: "Group similar activities like email responses, data entry, or creative work into dedicated time blocks to minimize context switching costs.",
        confidence: 0.75,
        actionable: true
      }
    ];
  }

  try {
    const response = await openai.chat.completions.create({
      model: GPT_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 800,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return [];

    const insights = JSON.parse(cleanJsonResponse(content));
    
    return Array.isArray(insights) ? insights.filter(insight => 
      insight.title && insight.content && typeof insight.confidence === 'number'
    ) : [];
  } catch (error) {
    console.error('Insight generation error:', error);
    // Return fallback insights when API is unavailable
    return [
      {
        type: "productivity_tip",
        title: "Establish Consistent Work Blocks", 
        content: "Try scheduling 25-minute focused work sessions followed by 5-minute breaks. This technique can improve concentration and reduce mental fatigue.",
        confidence: 0.85,
        actionable: true
      },
      {
        type: "time_optimization",
        title: "Batch Similar Tasks Together", 
        content: "Group similar activities like email responses, data entry, or creative work into dedicated time blocks to minimize context switching costs.",
        confidence: 0.75,
        actionable: true
      }
    ];
  }
}

/**
 * Conversational Task Refiner - Improve and decompose tasks
 */
export async function refineTask(
  originalTask: string, 
  userQuery: string,
  context: any = {}
): Promise<{
  refinedTasks: TaskAnalysis[];
  explanation: string;
  suggestions: string[];
}> {
  const prompt = `
You are a productivity assistant helping refine a task. 

Original Task: "${originalTask}"
User Request: "${userQuery}"
Context: ${JSON.stringify(context)}

Help the user by:
1. Understanding what they want to improve/clarify
2. Breaking down complex tasks into actionable subtasks
3. Adding missing details (deadlines, priorities, resources needed)
4. Suggesting better approaches or alternatives

Respond with JSON:
{
  "refinedTasks": [
    {
      "title": "Clear, specific task",
      "description": "Additional details",
      "priority": "low|medium|high|urgent",
      "category": "work|personal|health|learning|other",
      "tags": ["relevant", "tags"],
      "estimatedTime": minutes_as_number,
      "subtasks": ["if applicable"]
    }
  ],
  "explanation": "Why you made these changes",
  "suggestions": ["Additional tips or alternatives"]
}

Examples of refinement:
- "Call client" → "Call [Client Name] to discuss project timeline and next steps (15 min)"
- "Exercise" → "30-minute cardio workout at gym" + "Plan tomorrow's workout routine"
- "Study" → Break into specific topics with time blocks
`;

  try {
    const response = await openai.chat.completions.create({
      model: GPT_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    const result = JSON.parse(content);
    
    return {
      refinedTasks: Array.isArray(result.refinedTasks) ? result.refinedTasks : [],
      explanation: result.explanation || "Task has been refined for better clarity.",
      suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
    };
  } catch (error) {
    console.error('Task refinement error:', error);
    
    return {
      refinedTasks: [{
        title: originalTask,
        priority: 'medium',
        category: 'other',
        tags: [],
        estimatedTime: 30,
      }],
      explanation: "Unable to process refinement request. Please try again.",
      suggestions: ["Try being more specific about what you'd like to improve"],
    };
  }
}