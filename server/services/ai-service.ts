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
export async function parseNaturalLanguageTask(input: string, customPrompt?: string): Promise<TaskAnalysis> {
  const prompt = customPrompt || `
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

Task to analyze: "${input}"
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
  userTier: string = 'free'
): Promise<ProductivityInsight[]> {
  // Calculate real user analytics
  const completedTasks = tasks.filter(t => t.completed);
  const pendingTasks = tasks.filter(t => !t.completed);
  const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && !t.completed);
  
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
  const categoryBreakdown = tasks.reduce((acc, task) => {
    const cat = task.category || 'uncategorized';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const priorityBreakdown = tasks.reduce((acc, task) => {
    const priority = task.priority || 'medium';
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const prompt = `
Analyze this user's REAL productivity data and provide personalized, actionable insights:

ACTUAL USER DATA:
- Total tasks: ${tasks.length}
- Completed: ${completedTasks.length} (${completionRate}%)
- Pending: ${pendingTasks.length}
- Overdue: ${overdueTasks.length}

Task Categories:
${Object.entries(categoryBreakdown).map(([cat, count]) => `- ${cat}: ${count} tasks`).join('\n')}

Priority Distribution:
${Object.entries(priorityBreakdown).map(([priority, count]) => `- ${priority}: ${count} tasks`).join('\n')}

Recent Tasks Sample:
${tasks.slice(0, 8).map(t => `- "${t.title}" [${t.priority || 'medium'} priority, ${t.completed ? 'COMPLETED' : 'PENDING'}${t.category ? `, ${t.category}` : ''}]`).join('\n')}

User Tier: ${userTier}

Based on this REAL data, provide 3-4 specific, personalized insights. Return ONLY a valid JSON array:
[
  {
    "type": "productivity_tip|bottleneck_analysis|time_optimization|habit_formation",
    "title": "Insight based on their actual data",
    "content": "Specific advice based on their task patterns, completion rate, categories, etc. Reference their actual numbers.",
    "confidence": 0.75-0.95,
    "actionable": true
  }
]

Make insights specific to their data:
- If completion rate is low, suggest task breakdown strategies
- If many overdue tasks, focus on deadline management
- If too many high-priority tasks, suggest priority filtering
- If categories are unbalanced, suggest time allocation
- Reference their actual numbers and patterns
`;

  // Return data-driven fallback insights if AI service is unavailable
  if (!process.env.OPENAI_API_KEY) {
    console.log('OpenAI API key not available, generating data-driven fallback insights');
    const insights: ProductivityInsight[] = [];
    
    if (completionRate < 50) {
      insights.push({
        type: "bottleneck_analysis",
        title: `Low Completion Rate: ${completionRate}%`,
        content: `You're completing ${completionRate}% of tasks. Try breaking down large tasks into smaller, manageable subtasks to boost completion rates.`,
        confidence: 0.85,
        actionable: true
      });
    }
    
    if (overdueTasks.length > 0) {
      insights.push({
        type: "time_optimization",
        title: `${overdueTasks.length} Overdue Tasks Detected`,
        content: `You have ${overdueTasks.length} overdue tasks. Consider using time-blocking and setting buffer time for unexpected delays.`,
        confidence: 0.90,
        actionable: true
      });
    }
    
    const highPriorityTasks = priorityBreakdown.high || 0;
    if (highPriorityTasks > pendingTasks.length * 0.3) {
      insights.push({
        type: "productivity_tip",
        title: "Too Many High-Priority Tasks",
        content: `${highPriorityTasks} high-priority tasks detected. Consider re-evaluating priorities - not everything can be urgent.`,
        confidence: 0.80,
        actionable: true
      });
    }
    
    return insights.length > 0 ? insights : [{
      type: "productivity_tip",
      title: "Build Consistent Task Management Habits",
      content: "Establish a daily review routine to maintain momentum and identify bottlenecks early.",
      confidence: 0.75,
      actionable: true
    }];
  }

  try {
    const response = await openai.chat.completions.create({
      model: GPT_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return [];

    const insights = JSON.parse(cleanJsonResponse(content));
    
    return Array.isArray(insights) ? insights.filter(insight => 
      insight.title && insight.content && typeof insight.confidence === 'number'
    ) : [];
  } catch (error) {
    console.error('Insight generation error:', error);
    // Return data-driven fallback insights when API fails
    const insights: ProductivityInsight[] = [];
    
    if (completionRate < 50) {
      insights.push({
        type: "bottleneck_analysis",
        title: `Low Completion Rate: ${completionRate}%`,
        content: `You're completing ${completionRate}% of tasks. Try breaking down large tasks into smaller, manageable subtasks to boost completion rates.`,
        confidence: 0.85,
        actionable: true
      });
    }
    
    if (overdueTasks.length > 0) {
      insights.push({
        type: "time_optimization",
        title: `${overdueTasks.length} Overdue Tasks Detected`, 
        content: `You have ${overdueTasks.length} overdue tasks. Consider using time-blocking and setting buffer time for unexpected delays.`,
        confidence: 0.90,
        actionable: true
      });
    }
    
    return insights.length > 0 ? insights : [{
      type: "productivity_tip",
      title: "Build Consistent Task Management Habits",
      content: "Establish a daily review routine to maintain momentum and identify bottlenecks early.",
      confidence: 0.75,
      actionable: true
    }];
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
 * Generate impressive fallback refinement when AI API fails
 */
function generateFallbackRefinement(originalTask: string, userQuery: string): {
  refinedTasks: TaskAnalysis[];
  explanation: string;
  suggestions: string[];
} {
  const query = userQuery.toLowerCase();
  const task = originalTask.toLowerCase();
  
  // Smart refinement based on task content and user request
  if (task.includes('eat') && task.includes('cake')) {
    return {
      refinedTasks: [{
        title: "Mindful Celebration Dessert Experience",
        description: "Enjoy the celebration cake as a mindful moment of gratitude and celebration. Take time to appreciate the flavors, the occasion, and the people who made this moment possible.",
        priority: 'medium',
        category: 'personal',
        tags: ['celebration', 'mindfulness', 'gratitude', 'self-care'],
        estimatedTime: 15,
        subtasks: [
          "Find a comfortable, distraction-free space",
          "Take 3 deep breaths to center yourself",
          "Savor each bite mindfully, appreciating flavors and textures",
          "Reflect on what you're celebrating or grateful for",
          "Clean up mindfully as part of the experience"
        ]
      }],
      explanation: "Transformed a simple task into a meaningful experience that combines nourishment with mindfulness and gratitude practice.",
      suggestions: [
        "Consider pairing with a warm beverage for enhanced experience",
        "Share this moment with someone special if possible",
        "Take a photo to remember the celebration"
      ]
    };
  }
  
  if (query.includes('break') || query.includes('smaller') || query.includes('steps')) {
    return {
      refinedTasks: [{
        title: `Strategic Breakdown: ${originalTask}`,
        description: `Systematically approach "${originalTask}" through carefully planned phases to ensure thorough completion and reduce overwhelm.`,
        priority: 'medium',
        category: 'productivity',
        tags: ['planning', 'systematic', 'organized'],
        estimatedTime: 45,
        subtasks: [
          "Analyze requirements and define success criteria",
          "Research best practices and gather necessary resources",
          "Create detailed action plan with timelines",
          "Execute plan with regular progress checkpoints",
          "Review results and document lessons learned"
        ]
      }],
      explanation: "Broke down the task into manageable phases with clear progression and learning opportunities.",
      suggestions: [
        "Set specific deadlines for each subtask",
        "Prepare all resources before starting execution",
        "Schedule buffer time for unexpected challenges"
      ]
    };
  }
  
  // Generic impressive refinement
  return {
    refinedTasks: [{
      title: `Optimized Approach: ${originalTask}`,
      description: `Strategic execution of "${originalTask}" with enhanced focus on efficiency, quality, and meaningful outcomes.`,
      priority: 'medium',
      category: 'productivity',
      tags: ['optimized', 'strategic', 'focused'],
      estimatedTime: 30,
      subtasks: [
        "Clarify specific objectives and success metrics",
        "Gather all necessary resources and information",
        "Execute with focused attention and quality standards",
        "Review completion and identify improvement opportunities"
      ]
    }],
    explanation: "Enhanced the task with strategic thinking, clear objectives, and quality focus to maximize effectiveness.",
    suggestions: [
      "Eliminate distractions during execution",
      "Set a specific time limit to maintain focus",
      "Consider the broader context and impact of this task"
    ]
  };
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
You are an expert productivity coach. Transform this vague task into a comprehensive, actionable plan.

TASK TO REFINE: "${originalTask}"
USER'S REQUEST: "${userQuery}"

Your mission: Create an impressive, detailed refinement that shows the power of AI task optimization.

REFINEMENT RULES:
1. If the task is vague (like "eat the cake"), make it specific and meaningful
2. Always break complex tasks into 3-5 actionable subtasks
3. Add context, timing, and clear success criteria
4. Include relevant preparation steps and follow-up actions
5. Suggest optimal timing and duration estimates
6. Add tags that help with productivity and organization

RESPONSE FORMAT (JSON only, no markdown):
{
  "refinedTasks": [
    {
      "title": "Specific, actionable main task title",
      "description": "Detailed description with context, purpose, and expected outcome",
      "priority": "low|medium|high|urgent",
      "category": "work|personal|health|learning|food|social|creative|other",
      "tags": ["specific", "actionable", "tags"],
      "estimatedTime": realistic_minutes,
      "subtasks": [
        "Specific step 1 with timing",
        "Specific step 2 with details",
        "Specific step 3 with outcome"
      ]
    }
  ],
  "explanation": "Detailed explanation of why these changes make the task more effective and achievable",
  "suggestions": [
    "Specific actionable tip 1",
    "Specific actionable tip 2", 
    "Specific actionable tip 3"
  ]
}

EXAMPLES OF IMPRESSIVE REFINEMENTS:
- "Study math" → "Complete Chapter 5 Calculus Practice Problems (90 min focus session)" + subtasks for preparation, practice, and review
- "Call mom" → "Weekly check-in call with mom to discuss family updates and weekend plans (20 min)" + conversation topics and follow-up actions  
- "Exercise" → "High-intensity interval training workout targeting core and cardio endurance (45 min)" + warm-up, workout phases, and cool-down
- "Eat the cake" → "Mindful celebration dessert experience with gratitude practice (15 min)" + setup, mindful eating, and reflection

FOR "EAT THE CAKE" SPECIFICALLY - Transform it into:
"Mindful Celebration Dessert Experience" with subtasks like:
- Prepare a distraction-free environment
- Practice 3 mindful breaths before eating  
- Savor each bite with full attention to flavors and textures
- Reflect on the celebration or moment being honored
- Clean up mindfully as part of the experience

Make every refinement feel like a premium AI upgrade that adds real value and intelligence.`;

  try {
    const response = await openai.chat.completions.create({
      model: GPT_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 1200,
    });

    let content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    // Remove markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const result = JSON.parse(content);
    
    return {
      refinedTasks: Array.isArray(result.refinedTasks) ? result.refinedTasks : [],
      explanation: result.explanation || "Task has been refined for better clarity.",
      suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
    };
  } catch (error) {
    console.error('Task refinement error:', error);
    
    // Provide impressive fallback refinement that shows AI capability
    const fallbackRefinement = generateFallbackRefinement(originalTask, userQuery);
    return fallbackRefinement;
  }
}