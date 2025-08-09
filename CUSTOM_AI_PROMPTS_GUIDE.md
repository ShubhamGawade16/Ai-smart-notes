# Custom AI Prompts Guide

## Overview
Yes, you can absolutely customize AI prompts in the backend! I've set up a comprehensive system for you to modify AI behavior throughout the app.

## Key Files Created

### 1. `server/services/custom-prompts.ts`
- Contains all customizable AI prompts
- Easy to modify and update
- Supports personalized prompts based on user context

### 2. `server/routes/custom-ai.ts`
- API endpoints for managing custom prompts
- Test custom prompts before deploying
- Personalized AI responses

## How to Customize Prompts

### Method 1: Direct File Editing
Edit `server/services/custom-prompts.ts` and modify any prompt:

```typescript
export const CUSTOM_PROMPTS = {
  TASK_ANALYSIS: `Your custom prompt here...`,
  CHAT_ASSISTANT: `Your custom chat prompt...`,
  // ... other prompts
};
```

### Method 2: API Endpoints (Dynamic)
Use these endpoints to update prompts without restarting:

- `GET /api/custom-ai/prompts` - Get all prompts
- `PUT /api/custom-ai/prompts/:promptKey` - Update specific prompt
- `POST /api/custom-ai/test-prompt` - Test custom prompts
- `POST /api/custom-ai/personalized-ai` - Get personalized responses

## Current AI Features with Customizable Prompts

### 1. Task Analysis (`TASK_ANALYSIS`)
**Location**: `server/services/ai-service.ts` - `parseNaturalLanguageTask()`
**Purpose**: Analyze user input and extract structured task data
**Customization**: You are an AI productivity expert. Analyze the following natural language input and extract structured task data with:
Task name (concise)
If user mentions date or a day add it to the task analysing it
Priority level (high, medium, low)
Category (work, personal, health, learning, etc.)
Dependencies (if any)
Be precise, avoid assumptions unless clearly implied, and output in structured JSON format.

### 2. Task Refiner (`TASK_REFINER`) 
**Location**: `server/services/openai-service.ts` - `refineTask()`
**Purpose**: Break down complex tasks into actionable steps
**Customization**: You are an AI task optimization coach. Break the given complex task into clear, actionable, and ordered steps.
Keep steps small enough to complete in one sitting (max 30–60 mins each)
Preserve logical sequence
Highlight tools, resources, or prerequisites needed
Mark any step as optional if it doesn’t block progress
Output as a numbered list with sub-points if necessary

### 3. Smart Categorizer (`SMART_CATEGORIZER`)
**Location**: Multiple AI endpoints
**Purpose**: Categorize and organize tasks intelligently
**Customization**: You are an AI task categorization system. Categorize each task into exactly one primary category (e.g., work, personal, health, finance, learning, errands) and up to two secondary tags for context (e.g., creative, urgent, admin).
If priority or urgency is obvious, include it.

### 4. Chat Assistant (`CHAT_ASSISTANT`)
**Location**: Chat assistant endpoints
**Purpose**: Conversational AI for productivity guidance
**Customization**: You are a friendly yet highly effective productivity mentor.
Provide advice in short, direct sentences with actionable suggestions.
Balance encouragement with accountability.
If the Human drifts off-topic, gently redirect them to their goals.
Always end with one clear next step they can take immediately.


### 5. AI Insights (`AI_INSIGHTS`)
**Location**: `server/services/ai-brain.ts` - `advancedAnalysis()`
**Purpose**: Generate productivity insights and patterns
**Customization**: You are an AI behavioral analyst for productivity. Based on the given task history, identify:
Recurring patterns in completed vs. incomplete tasks
Time-of-day performance peaks and dips
Task types most often delayed or avoided
 Recommended changes to scheduling, priority setting, or focus techniquesProvide output in a short executive summary with three specific action recommendations.

### 6. Mind Map Analysis (`MIND_MAP_ANALYSIS`)
**Location**: `server/services/ai-brain.ts` - `analyzeMindMap()`
**Purpose**: Analyze task relationships and optimization
**Customization**: You are a strategic AI planner. Analyze the given mind map of tasks and goals to identify: Key dependencies and bottlenecks
Opportunities for parallel work
Critical path to the main objective
Tasks that can be eliminated, delegated, or automated

## Examples of Custom Prompts

### Example 1: Make Task Analysis More Creative
```typescript
TASK_ANALYSIS: `You are a creative productivity coach. When analyzing tasks:
- Encourage creative approaches to mundane tasks
- Suggest innovative time-saving methods
- Add motivational elements to task descriptions
- Focus on making work enjoyable and engaging

[... rest of prompt structure ...]`
```

### Example 2: Business-Focused Chat Assistant
```typescript
CHAT_ASSISTANT: `You are a business productivity consultant specializing in:
- Enterprise workflow optimization
- Team collaboration strategies  
- ROI-focused task prioritization
- Professional development guidance

Be professional, data-driven, and focus on business impact in all responses.`
```

### Example 3: Student-Focused Prompts
```typescript
TASK_ANALYSIS: `You are a study coach for students. When analyzing tasks:
- Identify learning vs review vs practice tasks
- Suggest study techniques (Pomodoro, spaced repetition)
- Consider academic deadlines and exam schedules
- Recommend study groups or solo work based on task type`
```

## User-Personalized Prompts

The system supports personalized prompts based on:
- **User Goals**: Custom objectives from onboarding
- **Work Style**: Preferred working methods
- **Tier Level**: Free/Basic/Pro feature access
- **Timezone**: Local time considerations

Example personalized prompt:
```typescript
const personalizedPrompt = getPersonalizedPrompt(basePrompt, {
  goals: ['Improve focus', 'Better work-life balance'],
  workStyle: 'Deep work sessions',
  preferences: 'Prefers morning productivity',
  timezone: 'Asia/Kolkata'
});
```

## Testing Custom Prompts

### Using the Test Endpoint
```javascript
// Test a custom prompt
fetch('/api/custom-ai/test-prompt', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    input: 'Write a report on quarterly sales',
    customPrompt: 'You are a business analyst...',
    userContext: true
  })
});
```

### Response Example
```json
{
  "analysis": {
    "title": "Quarterly Sales Report Analysis",
    "priority": "high",
    "category": "work", 
    "estimatedTime": 120
  },
  "promptUsed": "Your custom prompt with user context...",
  "userContext": {
    "tier": "basic",
    "goals": ["Improve business analytics"]
  }
}
```

## Integration into Existing Features

The custom prompt system integrates with all major AI features:

✅ **Smart Task Categorizer** - Use `SMART_CATEGORIZER` prompt
✅ **Conversational Task Refiner** - Use `TASK_REFINER` prompt  
✅ **AI Chat Assistant** - Use `CHAT_ASSISTANT` prompt
✅ **AI Productivity Insights** - Use `AI_INSIGHTS` prompt
✅ **Task Mind Map** - Use `MIND_MAP_ANALYSIS` prompt

## Next Steps

1. **Modify prompts** in `server/services/custom-prompts.ts`
2. **Test changes** using `/api/custom-ai/test-prompt`
3. **Deploy to features** by updating service functions
4. **Monitor performance** and adjust based on user feedback

The system is designed to be flexible and powerful - you can completely change how the AI behaves across your entire app by modifying these prompts!