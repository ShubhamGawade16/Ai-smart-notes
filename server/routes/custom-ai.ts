import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { AuthRequest } from '../types/auth';
import { CUSTOM_PROMPTS, getCustomPrompt, updateCustomPrompt, getPersonalizedPrompt } from '../services/custom-prompts';
import { parseNaturalLanguageTask } from '../services/ai-service';
import { storage } from '../storage';

const router = Router();

// Endpoint to get all custom prompts (Admin/Development)
router.get('/prompts', requireAuth, async (req: AuthRequest, res) => {
  try {
    res.json({ prompts: CUSTOM_PROMPTS });
  } catch (error) {
    res.status(500).json({ error: "Failed to get custom prompts" });
  }
});

// Endpoint to update a specific prompt (Admin/Development)
router.put('/prompts/:promptKey', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { promptKey } = req.params;
    const { prompt } = req.body;
    
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: "Prompt content is required" });
    }

    if (!(promptKey in CUSTOM_PROMPTS)) {
      return res.status(400).json({ error: "Invalid prompt key" });
    }

    updateCustomPrompt(promptKey as keyof typeof CUSTOM_PROMPTS, prompt);
    
    res.json({ 
      message: "Prompt updated successfully",
      promptKey,
      newPrompt: prompt
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update prompt" });
  }
});

// Endpoint to test custom prompts with task parsing
router.post('/test-prompt', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { input, customPrompt, userContext } = req.body;
    
    if (!input || typeof input !== 'string') {
      return res.status(400).json({ error: "Task input is required" });
    }

    // Get user data for personalization
    const user = await storage.getUser(req.userId!);
    const personalizedPrompt = userContext && user ? 
      getPersonalizedPrompt(customPrompt || getCustomPrompt('TASK_ANALYSIS'), {
        goals: user.customGoals || [],
        workStyle: user.primaryGoal || undefined,
        preferences: `Tier: ${user.tier}`,
        timezone: user.timezone || undefined
      }) : customPrompt;

    const analysis = await parseNaturalLanguageTask(input, personalizedPrompt);
    
    res.json({ 
      analysis,
      promptUsed: personalizedPrompt || "Default prompt",
      userContext: userContext ? {
        tier: user?.tier,
        timezone: user?.timezone,
        goals: user?.customGoals?.slice(0, 3) // First 3 goals only
      } : undefined
    });
  } catch (error) {
    console.error('Custom prompt test error:', error);
    res.status(500).json({ error: "Failed to test custom prompt" });
  }
});

// Endpoint for personalized AI responses based on user preferences
router.post('/personalized-ai', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { input, promptType, includeUserContext = true } = req.body;
    
    if (!input || !promptType) {
      return res.status(400).json({ error: "Input and prompt type are required" });
    }

    const user = includeUserContext ? await storage.getUser(req.userId!) : null;
    const basePrompt = getCustomPrompt(promptType);
    
    const personalizedPrompt = user ? getPersonalizedPrompt(basePrompt, {
      goals: user.customGoals || [],
      workStyle: user.primaryGoal || undefined,
      preferences: `Communication style: professional, Tier: ${user.tier}`,
      timezone: user.timezone || undefined
    }) : basePrompt;

    // Here you would call your AI service with the personalized prompt
    // For now, returning the prompt configuration
    res.json({
      message: "Personalized AI prompt generated",
      promptType,
      personalizedPrompt,
      userContext: user ? {
        tier: user.tier,
        goals: user.customGoals?.slice(0, 3),
        timezone: user.timezone
      } : null
    });
  } catch (error) {
    console.error('Personalized AI error:', error);
    res.status(500).json({ error: "Failed to generate personalized response" });
  }
});

export default router;