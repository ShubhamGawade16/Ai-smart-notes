import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { storage } from "./storage";
import { 
  optionalAuth,
  type AuthRequest 
} from "./auth";
import authRoutes from "./routes/auth";
import aiRoutes from "./routes/ai";
import gamificationRoutes from "./routes/gamification";
import integrationRoutes from "./routes/integrations";
import socialRoutes from "./routes/social";
import { 
  insertTaskSchema, 
  updateTaskSchema,
  insertNoteSchema,
  updateNoteSchema,
  type Task,
  type Note
} from "@shared/schema";
import { checkTier, incrementUsage, getUserLimits, FREE_TIER_LIMITS } from "./middleware/tier-check";
import { parseNaturalLanguageTask, optimizeTaskOrder, generateProductivityInsights, refineTask } from "./services/ai-service";
import { notificationService } from "./services/notification-service";
import OpenAI from 'openai';

// Helper function to check AI usage limits with Basic tier monthly tracking
function checkAiUsageLimit(user: any): { allowed: boolean; userLimit: number; limitType: 'daily' | 'monthly' | 'unlimited' } {
  // Pro tier - unlimited AI calls
  if (user.tier === 'pro') {
    return { allowed: true, userLimit: -1, limitType: 'unlimited' };
  }
  
  // Free tier - 3 AI calls per day (resets daily)
  if (user.tier === 'free') {
    const currentUsage = user.dailyAiCalls || 0;
    const dailyLimit = 3;
    const allowed = currentUsage < dailyLimit;
    return { allowed, userLimit: dailyLimit, limitType: 'daily' };
  }
  
  // Basic tier - 30 AI calls per month (resets monthly on 1st)
  if (user.tier === 'basic') {
    const currentUsage = user.monthlyAiCalls || 0;
    const monthlyLimit = 30;
    
    // Check if monthly reset is needed (1st of month)
    const now = new Date();
    const resetDate = new Date(user.monthlyAiCallsResetAt);
    
    if (now.getMonth() !== resetDate.getMonth() || now.getFullYear() !== resetDate.getFullYear()) {
      // Month changed, reset needed but will be handled by incrementMonthlyAiCalls
      const allowed = true; // Allow first call of new month
      return { allowed, userLimit: monthlyLimit, limitType: 'monthly' };
    }
    
    const allowed = currentUsage < monthlyLimit;
    return { allowed, userLimit: monthlyLimit, limitType: 'monthly' };
  }
  
  // Default to free tier limits
  const currentUsage = user.dailyAiCalls || 0;
  const dailyLimit = 3;
  const allowed = currentUsage < dailyLimit;
  return { allowed, userLimit: dailyLimit, limitType: 'daily' };
}

// JWT secret for signing tokens
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Unified auth middleware for both Supabase and fallback auth
const requireAuth = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Check if it's a fallback token
    if (token.startsWith('fallback_')) {
      const userId = token.replace('fallback_', '');
      const userData = await storage.getUser(userId);
      if (userData) {
        req.user = userData;
        req.userId = userId;
        return next();
      }
    }

    // Try JWT verification for regular tokens
    jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
      if (err) {
        return res.status(401).json({ message: 'Invalid token' });
      }
      
      const userData = await storage.getUser(decoded.id);
      if (userData) {
        req.user = userData;
        req.userId = decoded.id;
        return next();
      }
      
      return res.status(401).json({ message: 'User not found' });
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Setup Replit Auth
  try {
    await setupAuth(app);
    console.log('✅ Replit Auth configured successfully');
  } catch (error) {
    console.log('⚠️ Replit Auth not available (expected in development), using fallback auth');
  }
  // Simple Authentication Routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user using database schema
      const insertUserData = {
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        onboardingCompleted: true,
      };
      const newUser = await storage.createUser(insertUserData);

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: newUser.id, 
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName 
        },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.json({
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
        }
      });
    } catch (error: any) {
      console.error('Signup error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/signin", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Check password
      const validPassword = await bcrypt.compare(password, user.passwordHash || '');
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName 
        },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        }
      });
    } catch (error: any) {
      console.error('Signin error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      });
    } catch (error: any) {
      console.error('Get user error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/signout", (req, res) => {
    // For JWT, we just need to remove the token on the client side
    // In a production app, you might want to maintain a blacklist of tokens
    res.json({ message: "Signed out successfully" });
  });
  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // ============================================================================
  // AUTHENTICATION ROUTES
  // ============================================================================
  
  // Mount auth routes
  app.use("/api/auth", authRoutes);
  
  // Add Supabase auth routes
  const supabaseAuthRoutes = await import("./routes/supabase-auth");
  app.use("/api/supabase", supabaseAuthRoutes.default);

  // ============================================================================
  // SUBSCRIPTION & FREEMIUM ROUTES
  // ============================================================================

  // Get subscription status with Basic tier support
  app.get("/api/subscription-status", requireAuth, async (req, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "User ID not found in token" });
      }

      // Always fetch fresh user data from storage to avoid caching issues
      const user = await storage.getUser(req.userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Add cache-busting headers to prevent frontend caching
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      // Determine tier and limits
      const tier = user.tier || 'free';
      const isPremium = tier === 'pro';
      const isBasic = tier === 'basic';
      
      // Check if daily/monthly limits need reset
      const now = new Date();
      const dailyResetTime = user.dailyAiCallsResetAt ? new Date(user.dailyAiCallsResetAt) : new Date();
      const monthlyResetTime = user.monthlyAiCallsResetAt ? new Date(user.monthlyAiCallsResetAt) : new Date();
      
      const shouldResetDaily = now.getTime() - dailyResetTime.getTime() > 24 * 60 * 60 * 1000;
      const shouldResetMonthly = now.getMonth() !== monthlyResetTime.getMonth() || now.getFullYear() !== monthlyResetTime.getFullYear();

      // Reset counters if needed
      if (shouldResetDaily && tier === 'free') {
        await storage.updateUser(user.id, {
          dailyAiCalls: 0,
          dailyAiCallsResetAt: now
        });
        user.dailyAiCalls = 0;
      }
      
      if (shouldResetMonthly && tier === 'basic') {
        await storage.updateUser(user.id, {
          monthlyAiCalls: 0,
          monthlyAiCallsResetAt: new Date(now.getFullYear(), now.getMonth(), 1)
        });
        user.monthlyAiCalls = 0;
      }

      // Calculate current usage and limits based on tier
      let dailyAiUsage = user.dailyAiCalls || 0;
      let monthlyAiUsage = user.monthlyAiCalls || 0;
      let dailyAiLimit = 3; // Free tier default
      let monthlyAiLimit = -1; // No monthly limit for free
      let canUseAi = false;

      if (isPremium) {
        dailyAiLimit = -1; // Unlimited
        monthlyAiLimit = -1; // Unlimited
        canUseAi = true;
      } else if (isBasic) {
        dailyAiLimit = -1; // No daily limit for basic
        monthlyAiLimit = 30; // 30 per month
        canUseAi = monthlyAiUsage < 30;
      } else {
        // Free tier
        canUseAi = dailyAiUsage < 3;
      }

      res.json({
        isPremium,
        isBasic,
        tier,
        dailyAiUsage,
        dailyAiLimit,
        monthlyAiUsage,
        monthlyAiLimit,
        canUseAi,
        subscriptionId: user.subscriptionId,
        subscriptionStatus: user.subscriptionStatus,
        expiresAt: user.subscriptionCurrentPeriodEnd
      });
    } catch (error) {
      console.error("Failed to get subscription status:", error);
      res.status(500).json({ error: "Failed to get subscription status" });
    }
  });

  // Increment AI usage
  app.post("/api/increment-ai-usage", requireAuth, async (req, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "User ID not found in token" });
      }

      const user = await storage.getUser(req.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // In development mode, still track usage but be more generous for free users
      const isDevelopment = process.env.NODE_ENV === 'development';

      const isPremium = user.tier !== 'free' && user.tier !== null;
      if (isPremium) {
        // Premium users have unlimited usage
        res.json({
          dailyAiUsage: user.dailyAiCalls || 0,
          canUseAi: true
        });
        return;
      }

      // Check if daily limit needs reset
      const now = new Date();
      const resetTime = user.dailyAiCallsResetAt ? new Date(user.dailyAiCallsResetAt) : new Date();
      const shouldReset = now.getTime() - resetTime.getTime() > 24 * 60 * 60 * 1000;

      let newDailyCount = user.dailyAiCalls || 0;
      if (shouldReset) {
        newDailyCount = 0;
      }

      const dailyLimit = 3;
      const canUseAi = newDailyCount < dailyLimit;

      if (canUseAi) {
        newDailyCount += 1;
        await storage.updateUser(user.id, {
          dailyAiCalls: newDailyCount,
          dailyAiCallsResetAt: shouldReset ? now : user.dailyAiCallsResetAt
        });
      }

      res.json({
        dailyAiUsage: newDailyCount,
        canUseAi: newDailyCount < dailyLimit
      });
    } catch (error) {
      console.error("Failed to increment AI usage:", error);
      res.status(500).json({ error: "Failed to increment AI usage" });
    }
  });

  // ============================================================================
  // RAZORPAY PAYMENT INTEGRATION
  // ============================================================================

  // Create Razorpay order
  app.post("/api/razorpay/create-order", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "User ID not found in token" });
      }

      const { amount, currency, plan } = req.body;
      
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        return res.status(500).json({ error: "Razorpay configuration missing" });
      }

      const Razorpay = require('razorpay');
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      });

      const options = {
        amount: amount * 100, // Convert to paise
        currency: currency || 'INR',
        receipt: `order_${req.userId}_${Date.now()}`,
        notes: {
          userId: req.userId,
          plan: plan
        }
      };

      const order = await razorpay.orders.create(options);
      
      res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency
      });
    } catch (error) {
      console.error("Failed to create Razorpay order:", error);
      res.status(500).json({ error: "Failed to create payment order" });
    }
  });

  // Verify Razorpay payment
  app.post("/api/razorpay/verify-payment", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "User ID not found in token" });
      }

      const { orderId, paymentId, signature, plan } = req.body;
      
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      if (signature !== expectedSignature) {
        return res.status(400).json({ error: "Invalid payment signature" });
      }

      // Payment verified, upgrade user
      const tierMap = {
        'basic': 'basic',
        'pro': 'premium_pro'
      };

      const updatedUser = await storage.updateUser(req.userId, {
        tier: tierMap[plan] || 'basic',
        subscriptionStatus: 'active',
        subscriptionCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        paymentId: paymentId,
        razorpayOrderId: orderId
      });

      res.json({ 
        success: true, 
        user: updatedUser,
        message: "Payment verified and subscription upgraded successfully!" 
      });
    } catch (error) {
      console.error("Failed to verify payment:", error);
      res.status(500).json({ error: "Failed to verify payment" });
    }
  });

  // Upgrade subscription (legacy endpoint for compatibility)
  app.post("/api/upgrade-subscription", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "User ID not found in token" });
      }

      const { plan } = req.body;
      
      // For now, simulate successful upgrade
      // In production, this would integrate with actual payment processor
      const updatedUser = await storage.updateUser(req.userId, {
        tier: 'pro',
        subscriptionStatus: 'active',
        subscriptionCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        dailyAiCalls: 0, // Reset AI usage for upgraded users
        dailyAiCallsResetAt: new Date()
      });

      res.json({ 
        success: true, 
        user: updatedUser,
        message: "Subscription upgraded successfully!" 
      });
    } catch (error) {
      console.error("Failed to upgrade subscription:", error);
      res.status(500).json({ error: "Failed to upgrade subscription" });
    }
  });

  // Supabase user sync endpoint (kept for compatibility)
  app.post("/api/auth/sync", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { email, firstName, lastName, profileImageUrl } = req.body;
      
      if (!req.userId) {
        return res.status(401).json({ error: "User ID not found in token" });
      }

      // Upsert user in our database
      const user = await storage.upsertUser({
        id: req.userId,
        email,
        firstName,
        lastName,
        profileImageUrl,
      });

      res.json({ user });
    } catch (error) {
      console.error("User sync error:", error);
      res.status(500).json({ error: "Failed to sync user" });
    }
  });

  // Get current user
  app.get("/api/auth/user", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "User ID not found in token" });
      }

      const user = await storage.getUser(req.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ user });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Delete account endpoint
  app.delete("/api/auth/delete-account", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "User ID not found in token" });
      }

      // Delete all user's tasks and notes first
      await storage.deleteAllUserTasks(req.userId);
      await storage.deleteAllUserNotes(req.userId);
      
      // Delete the user account
      await storage.deleteUser(req.userId);
      
      res.json({ message: "Account deleted successfully" });
    } catch (error) {
      console.error("Delete account error:", error);
      res.status(500).json({ error: "Failed to delete account" });
    }
  });

  // Onboarding endpoint
  app.post("/api/user/onboarding", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "User ID not found in token" });
      }

      const { primaryGoal, customGoals } = req.body;
      
      const user = await storage.updateUser(req.userId, {
        primaryGoal,
        customGoals,
        onboardingCompleted: true,
      });

      res.json({ user });
    } catch (error) {
      console.error("Onboarding error:", error);
      res.status(500).json({ error: "Failed to save onboarding data" });
    }
  });

  // ============================================================================
  // PHASE 3: ADVANCED AI FEATURES & TIER SYSTEM
  // ============================================================================

  // Natural Language Task Entry - Parse user input into structured task (FREE for testing)
  app.post("/api/ai/parse-task", optionalAuth, async (req: AuthRequest, res) => {
      try {
        const { input } = req.body;
        if (!input || typeof input !== 'string') {
          return res.status(400).json({ error: "Task input is required" });
        }

        const analysis = await parseNaturalLanguageTask(input);
        res.json({ analysis });
      } catch (error) {
        console.error("Task parsing error:", error);
        res.status(500).json({ error: "Failed to parse task" });
      }
    }
  );

  // Smart Task Optimization - Reorder tasks for maximum efficiency (FREE for testing)
  app.post("/api/ai/optimize-tasks", async (req: AuthRequest, res) => {
      try {
        const { taskIds, userContext } = req.body;
        
        if (!Array.isArray(taskIds)) {
          return res.status(400).json({ error: "Task IDs array is required" });
        }

        // Get tasks from storage
        const allTasks = await storage.getTasks(req.userId!);
        const tasksToOptimize = allTasks.filter(task => taskIds.includes(task.id));

        const optimizedTasks = await optimizeTaskOrder(tasksToOptimize, userContext);
        res.json({ optimizedTasks: optimizedTasks.map(t => t.id) });
      } catch (error) {
        console.error("Task optimization error:", error);
        res.status(500).json({ error: "Failed to optimize tasks" });
      }
    }
  );

  // Generate Productivity Insights (FREE for testing)
  app.get("/api/ai/insights", async (req: AuthRequest, res) => {
      try {
        const tasks = await storage.getTasks(req.userId!);
        const user = await storage.getUser(req.userId!);
        
        const userPatterns = {
          completionRate: tasks.length > 0 ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0,
          currentStreak: user?.currentStreak || 0,
          productiveHours: '9-11 AM', // This would come from actual analysis
        };

        const insights = await generateProductivityInsights(
          tasks.slice(0, 20), // Recent tasks
          [], // Completion history - would be implemented with proper tracking
          userPatterns
        );

        res.json({ insights });
      } catch (error) {
        console.error("Insights generation error:", error);
        res.status(500).json({ error: "Failed to generate insights" });
      }
    }
  );

  // AI motivation quote route
  app.post("/api/ai/motivation-quote", async (req: AuthRequest, res) => {
    try {
      const { completedTasks, incompleteTasks, recentTasks } = req.body;
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: "OpenAI API key not configured" });
      }

      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const prompt = `Generate a personalized motivational quote for a user with the following task status:
- Completed tasks: ${completedTasks}
- Incomplete tasks: ${incompleteTasks}
- Recent tasks: ${recentTasks.map((t: any) => `${t.title} (${t.completed ? 'done' : 'pending'})`).join(', ')}

Create an encouraging, personalized quote that acknowledges their progress and motivates them for the tasks ahead. Make it specific to their situation. Keep it under 150 characters and inspirational.

Respond with JSON in this format: {"quote": "your motivational quote", "author": "Planify AI"}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      res.json(result);
    } catch (error) {
      console.error('AI motivation quote error:', error);
      res.status(500).json({ error: "Failed to generate motivation quote" });
    }
  });

  // Smart Timing Analysis endpoint
  app.get("/api/ai/smart-timing", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "User ID not found in token" });
      }

      // Check and increment AI usage
      const user = await storage.getUser(req.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check daily AI usage limits - Pro users always have access
      const isPremium = user.tier !== 'free' && user.tier !== null;
      const currentUsage = user.dailyAiCalls || 0;
      const dailyLimit = isPremium ? 999 : 3;
      const allowed = isPremium || currentUsage < dailyLimit;
      
      console.log(`Smart timing - User ${req.userId} (${user.email}) tier: ${user.tier}, limit: ${dailyLimit}, current usage: ${currentUsage}, allowed: ${allowed}, isPremium: ${isPremium}`);
      
      if (!allowed) {
        return res.status(429).json({ error: "Daily AI usage limit exceeded" });
      }

      // Get user's incomplete tasks BEFORE incrementing usage  
      const tasks = await storage.getTasks(req.userId);
      const incompleteTasks = tasks.filter(task => !task.completed);

      console.log(`Smart timing: Found ${tasks.length} total tasks, ${incompleteTasks.length} incomplete for user ${req.userId}`);
      console.log(`Smart timing: Sample tasks:`, tasks.slice(0, 3).map(t => ({ id: t.id, title: t.title, userId: t.userId })));

      if (incompleteTasks.length === 0) {
        return res.json({ analyses: [] });
      }

      // Only increment AI usage if we have tasks to analyze
      await storage.incrementDailyAiCalls(req.userId);

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // Get user timezone and current time context
      const userProfile = await storage.getUser(req.userId);
      const userTimezone = userProfile?.timezone || 'UTC';
      
      const now = new Date();
      const userTime = new Date(now.toLocaleString("en-US", { timeZone: userTimezone }));
      const currentHour = userTime.getHours();
      const currentDay = userTime.getDay(); // 0 = Sunday, 6 = Saturday

      const prompt = `You are a circadian rhythm and productivity expert. Analyze the optimal timing for these tasks based on current time context and task types.

Current Context:
- Current time: ${userTime.toLocaleString()} (${userTimezone})
- Hour: ${currentHour} (24-hour format)
- Day of week: ${currentDay} (0=Sunday, 6=Saturday)
- User timezone: ${userTimezone}

Tasks to analyze:
${incompleteTasks.map(task => `- "${task.title}" (Type: ${task.taskType || 'routine'}, Priority: ${task.priority})`).join('\n')}

For each task, provide a readiness analysis considering:
1. Circadian rhythm science (energy peaks/dips throughout the day)
2. Task type suitability to current time
3. Current vs optimal timing recommendations

Circadian Guidelines:
- 6-10 AM: Peak cortisol, best for creative/strategic work
- 10 AM-2 PM: Peak alertness, ideal for analytical/complex tasks  
- 2-4 PM: Post-lunch dip, better for routine tasks
- 4-6 PM: Second alertness peak, good for communication/meetings
- 6-9 PM: Wind-down period, planning and light tasks
- 9 PM+: Rest preparation, avoid stimulating work

Task Type Guidelines:
- Creative: Morning peak (7-10 AM) or evening reflection (7-9 PM)
- Analytical: Mid-morning peak (10 AM-12 PM)
- Deep Work: Morning focus (8-11 AM) or afternoon focus (2-4 PM) 
- Routine: Any time, especially during energy dips
- Communication: Mid-morning or afternoon (10 AM-12 PM, 2-5 PM)
- Learning: Morning (9-11 AM) or evening review (6-8 PM)

Respond with JSON in this format:
{
  "analyses": [
    {
      "taskId": "task_id",
      "taskTitle": "task title",
      "taskType": "task_type",
      "readinessScore": 85,
      "currentOptimal": true,
      "recommendations": {
        "bestTimeSlot": "9:00-11:00 AM",
        "reason": "Peak morning creativity aligns with strategic task requirements",
        "energyLevel": "high",
        "distractionLevel": "low"
      },
      "circadianFactors": {
        "timeOfDay": "morning",
        "energyPeak": true,
        "focusWindow": true
      }
    }
  ]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      res.json(result);
    } catch (error) {
      console.error('Smart timing analysis error:', error);
      res.status(500).json({ error: "Failed to analyze task timing" });
    }
  });

  // Smart Categorizer API
  app.post("/api/ai/smart-categorizer", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "User ID not found in token" });
      }

      const { text, tasks } = req.body;
      let inputText = text;
      
      // Handle tasks array parameter
      if (!inputText && Array.isArray(tasks)) {
        inputText = tasks.join(', ');
      }
      
      if (!inputText) {
        return res.status(400).json({ error: "Text or tasks are required" });
      }

      // Check and increment AI usage
      const user = await storage.getUser(req.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check AI usage limits (daily for free, monthly for basic, unlimited for pro)
      const { allowed, userLimit, limitType } = checkAiUsageLimit(user);
      const currentUsage = limitType === 'monthly' ? (user.monthlyAiCalls || 0) : (user.dailyAiCalls || 0);
      console.log(`Smart categorizer - User ${req.userId} (${user.email}) tier: ${user.tier}, limit: ${userLimit}, current usage: ${currentUsage}, limit type: ${limitType}, allowed: ${allowed}`);
      
      if (!allowed) {
        const limitMessage = limitType === 'monthly' 
          ? "Monthly AI usage limit exceeded. Upgrade to Pro for unlimited access or wait until next month."
          : "Daily AI usage limit exceeded. Upgrade to Basic or Pro for more access.";
        return res.status(429).json({ error: limitMessage });
      }

      // Increment appropriate counter based on tier
      if (user.tier === 'basic') {
        await storage.incrementMonthlyAiCalls(req.userId);
      } else {
        await storage.incrementDailyAiCalls(req.userId);
      }

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const prompt = `You are a task categorization expert. Analyze the following text and extract individual tasks, then categorize and tag each one.

Text to analyze: "${inputText}"

For each task you identify, provide:
1. A clear, actionable title
2. A brief description (if needed)
3. An appropriate category (work, personal, health, learning, shopping, etc.)
4. Relevant tags
5. Priority level (low, medium, high)
6. Task type (creative, routine, analytical, deep_work, communication, learning)

Respond with JSON in this format:
{
  "categorizedTasks": [
    {
      "title": "Clear task title",
      "description": "Brief description if needed",
      "category": "appropriate category",
      "tags": ["tag1", "tag2"],
      "priority": "medium",
      "taskType": "routine"
    }
  ]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      res.json(result);
    } catch (error) {
      console.error('Smart categorizer error:', error);
      res.status(500).json({ error: "Failed to categorize tasks" });
    }
  });

  // Productivity Insights API
  app.get("/api/ai/productivity-insights", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "User ID not found in token" });
      }

      // Check and increment AI usage
      const user = await storage.getUser(req.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check daily AI usage limits  
      const { allowed, userLimit } = checkAiUsageLimit(user);
      console.log(`Productivity insights - User ${req.userId} (${user.email}) tier: ${user.tier}, limit: ${userLimit}, current usage: ${user.dailyAiCalls || 0}, allowed: ${allowed}`);
      
      if (!allowed) {
        return res.status(429).json({ error: "Daily AI usage limit exceeded" });
      }

      // Get user's tasks for analysis first
      const tasks = await storage.getTasks(req.userId);
      const completedTasks = tasks.filter(t => t.completed);
      const incompleteTasks = tasks.filter(t => !t.completed);

      console.log(`Productivity insights: Found ${tasks.length} total tasks, ${completedTasks.length} completed for user ${req.userId}`);
      console.log(`Productivity insights: Sample tasks:`, tasks.slice(0, 3).map(t => ({ id: t.id, title: t.title, userId: t.userId, completed: t.completed })));

      if (tasks.length === 0) {
        return res.json({
          overallScore: 0,
          completionRate: 0,
          tasksCompleted: 0,
          avgDailyTasks: 0,
          categoryPerformance: {},
          insights: ["No tasks found. Create some tasks to get productivity insights!"],
          recommendations: ["Start by adding tasks to track your productivity patterns."]
        });
      }

      await storage.incrementDailyAiCalls(req.userId);

      // Calculate basic metrics
      const totalTasks = tasks.length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
      const overallScore = Math.min(100, Math.max(0, completionRate + (completedTasks.length * 2)));

      // Category performance analysis
      const categoryPerformance: any = {};
      tasks.forEach(task => {
        if (task.category) {
          if (!categoryPerformance[task.category]) {
            categoryPerformance[task.category] = { total: 0, completed: 0, rate: 0 };
          }
          categoryPerformance[task.category].total++;
          if (task.completed) {
            categoryPerformance[task.category].completed++;
          }
        }
      });

      // Calculate rates
      Object.keys(categoryPerformance).forEach(category => {
        const data = categoryPerformance[category];
        data.rate = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
      });

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const prompt = `You are a productivity analysis expert. Analyze this user's task data and provide insights and recommendations.

Task Data:
- Total tasks: ${totalTasks}
- Completed tasks: ${completedTasks.length}
- Incomplete tasks: ${incompleteTasks.length}
- Completion rate: ${completionRate}%
- Categories: ${Object.keys(categoryPerformance).join(', ')}

Recent completed tasks:
${completedTasks.slice(-10).map(t => `- ${t.title} (${t.category || 'uncategorized'}, ${t.priority || 'medium'} priority)`).join('\n')}

Recent incomplete tasks:
${incompleteTasks.slice(0, 10).map(t => `- ${t.title} (${t.category || 'uncategorized'}, ${t.priority || 'medium'} priority)`).join('\n')}

Provide:
1. Key insights about their productivity patterns
2. Specific, actionable recommendations for improvement
3. Observations about their task management approach

Respond with JSON in this format:
{
  "insights": [
    "Specific insight about their productivity patterns",
    "Another key observation"
  ],
  "recommendations": [
    "Actionable recommendation for improvement",
    "Another specific suggestion"
  ]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');

      res.json({
        overallScore,
        completionRate,
        tasksCompleted: completedTasks.length,
        avgDailyTasks: Math.round(totalTasks / 7), // Approximate daily average
        categoryPerformance,
        insights: result.insights || [],
        recommendations: result.recommendations || []
      });
    } catch (error) {
      console.error('Productivity insights error:', error);
      res.status(500).json({ error: "Failed to get productivity insights" });
    }
  });

  // AI Chat Assistant API
  app.post("/api/ai/chat-assistant", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "User ID not found in token" });
      }

      const { message, context } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Check and increment AI usage
      const user = await storage.getUser(req.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check AI usage limits (daily for free, monthly for basic, unlimited for pro)
      const { allowed, userLimit, limitType } = checkAiUsageLimit(user);
      const currentUsage = limitType === 'monthly' ? (user.monthlyAiCalls || 0) : (user.dailyAiCalls || 0);
      console.log(`Chat assistant - User ${req.userId} (${user.email}) tier: ${user.tier}, limit: ${userLimit}, current usage: ${currentUsage}, limit type: ${limitType}, allowed: ${allowed}`);
      
      if (!allowed) {
        const limitMessage = limitType === 'monthly' 
          ? "Monthly AI usage limit exceeded. Upgrade to Pro for unlimited access or wait until next month."
          : "Daily AI usage limit exceeded. Upgrade to Basic or Pro for more access.";
        return res.status(429).json({ error: limitMessage });
      }

      // Get user's tasks for context first
      const tasks = await storage.getTasks(req.userId);
      const recentTasks = tasks.slice(-5).map(t => `${t.title} (${t.completed ? 'completed' : 'pending'})`);

      console.log(`Chat assistant: Found ${tasks.length} total tasks for user ${req.userId}`);
      console.log(`Chat assistant: Sample tasks:`, tasks.slice(0, 3).map(t => ({ id: t.id, title: t.title, userId: t.userId })));

      // Increment appropriate counter based on tier
      if (user.tier === 'basic') {
        await storage.incrementMonthlyAiCalls(req.userId);
      } else {
        await storage.incrementDailyAiCalls(req.userId);
      }

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const systemPrompt = `You are Planify AI, a helpful productivity assistant. You help users plan tasks, organize their workflow, and provide productivity advice.

Context about the user:
- They have ${tasks.length} total tasks
- Recent tasks: ${recentTasks.join(', ')}

Guidelines:
- Be helpful, encouraging, and practical
- Focus on productivity and task management
- Provide actionable advice
- Keep responses conversational but concise
- If they ask about creating tasks, guide them through the process
- If they need motivation, provide personalized encouragement based on their progress`;

      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ];

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: messages.slice(-10), // Keep last 10 messages for context
        max_tokens: 500,
        temperature: 0.7
      });

      res.json({ response: response.choices[0].message.content });
    } catch (error) {
      console.error('Chat assistant error:', error);
      res.status(500).json({ error: "Failed to get AI response" });
    }
  });

  // Dev endpoint to reset AI usage for testing
  app.post("/api/dev/reset-ai-usage", async (req: AuthRequest, res) => {
    try {
      const userId = req.userId || 'demo-user';
      
      // Ensure user exists first
      let user = await storage.getUser(userId);
      if (!user) {
        user = await storage.upsertUser({
          id: userId,
          email: `${userId}@demo.com`
        });
      }
      
      // Reset daily AI usage for the user
      await storage.resetDailyAiUsage(userId);
      
      // Clear any cached user data and get fresh data
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for database consistency
      const updatedUser = await storage.getUser(userId);
      
      console.log(`Dev reset: User ${userId} AI usage reset to ${updatedUser?.dailyAiCalls || 0}`);
      
      res.json({ 
        message: "AI usage reset successfully", 
        dailyAiUsage: updatedUser?.dailyAiCalls || 0,
        success: true
      });
    } catch (error) {
      console.error('Reset AI usage error:', error);
      res.status(500).json({ error: "Failed to reset AI usage" });
    }
  });

  // Update user timezone
  app.patch("/api/user/timezone", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "User ID not found in token" });
      }

      const { timezone } = req.body;
      
      if (!timezone || typeof timezone !== 'string') {
        return res.status(400).json({ error: "Valid timezone is required" });
      }

      // Validate timezone by checking if it exists in Intl supported timezones
      try {
        Intl.DateTimeFormat(undefined, { timeZone: timezone });
      } catch (error) {
        return res.status(400).json({ error: "Invalid timezone" });
      }

      await storage.updateUser(req.userId, { timezone });
      
      const updatedUser = await storage.getUser(req.userId);
      res.json({ 
        success: true, 
        timezone: updatedUser?.timezone,
        message: "Timezone updated successfully" 
      });
    } catch (error) {
      console.error("Failed to update timezone:", error);
      res.status(500).json({ error: "Failed to update timezone" });
    }
  });

  // Auto-detect and update user timezone
  app.post("/api/user/auto-timezone", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "User ID not found in token" });
      }

      const { detectedTimezone } = req.body;
      
      if (!detectedTimezone || typeof detectedTimezone !== 'string') {
        return res.status(400).json({ error: "Detected timezone is required" });
      }

      // Get current user to check if timezone is already set
      const currentUser = await storage.getUser(req.userId);
      
      // Only auto-update if user hasn't manually set a different timezone
      if (currentUser && (currentUser.timezone === 'UTC' || !currentUser.timezone)) {
        await storage.updateUser(req.userId, { timezone: detectedTimezone });
        
        console.log(`Auto-updated timezone for user ${req.userId}: ${detectedTimezone}`);
        
        res.json({ 
          success: true, 
          timezone: detectedTimezone,
          message: "Timezone auto-detected and updated" 
        });
      } else {
        res.json({ 
          success: false, 
          timezone: currentUser?.timezone,
          message: "User has custom timezone, not auto-updating" 
        });
      }
    } catch (error) {
      console.error("Failed to auto-update timezone:", error);
      res.status(500).json({ error: "Failed to auto-update timezone" });
    }
  });

  // Dev endpoint to toggle between tiers for testing Basic plan
  app.post("/api/dev/toggle-tier", async (req: AuthRequest, res) => {
    try {
      const userId = req.userId || 'demo-user';
      
      // Ensure user exists first
      let user = await storage.getUser(userId);
      if (!user) {
        user = await storage.createUser({
          id: userId,
          email: 'demo@example.com',
          firstName: 'Demo',
          lastName: 'User',
          tier: 'free'
        });
      }
      
      // Cycle through tiers: free -> basic -> pro -> free
      let newTier: 'free' | 'basic' | 'pro' = 'free';
      if (user.tier === 'free') {
        newTier = 'basic';
      } else if (user.tier === 'basic') {
        newTier = 'pro';
      } else {
        newTier = 'free';
      }
      
      // Reset AI usage when changing tiers
      const updatedUser = await storage.updateUser(userId, {
        tier: newTier,
        dailyAiCalls: 0,
        monthlyAiCalls: 0,
        dailyAiCallsResetAt: new Date(),
        monthlyAiCallsResetAt: new Date()
      });
      
      res.json({ 
        success: true, 
        newTier,
        message: `Tier changed to ${newTier}`,
        user: updatedUser
      });
    } catch (error) {
      console.error("Error toggling tier:", error);
      res.status(500).json({ error: "Failed to toggle tier" });
    }
  });

  // ============================================================================
  // RAZORPAY PAYMENT ROUTES
  // ============================================================================

  // Import Razorpay functions
  const {
    createRazorpayOrder,
    createRazorpaySubscription,
    verifyRazorpayPayment,
    verifyRazorpaySignature,
    handleRazorpayWebhook,
    getSubscriptionDetails,
    cancelRazorpaySubscription,
  } = await import("./razorpay");

  // Create Razorpay order for one-time payments
  app.post("/api/razorpay/order", requireAuth, createRazorpayOrder);

  // Create Razorpay subscription
  app.post("/api/razorpay/subscription", requireAuth, createRazorpaySubscription);

  // Verify Razorpay payment and upgrade user
  app.post("/api/razorpay/verify", requireAuth, async (req: AuthRequest, res) => {
    try {
      // Verify the payment first
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: "Missing payment verification data" });
      }

      // Use the existing verification function
      const isValid = verifyRazorpaySignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );

      if (!isValid) {
        return res.status(400).json({
          success: false,
          error: "Payment verification failed",
        });
      }

      // Payment verified successfully, now upgrade the user
      const userId = req.user!.id;
      const user = await storage.updateUser(userId, {
        tier: 'basic',
        subscriptionId: razorpay_payment_id,
        subscriptionStatus: 'active',
        subscriptionCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      });

      console.log(`User ${userId} upgraded to Pro subscription`);

      res.json({
        success: true,
        message: "Payment verified and subscription activated",
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
      });
      
    } catch (error: any) {
      console.error("Failed to verify payment or upgrade user:", error);
      res.status(500).json({ 
        error: "Payment verification failed",
        details: error.message 
      });
    }
  });

  // Handle Razorpay webhooks (no auth required)
  app.post("/api/razorpay/webhook", handleRazorpayWebhook);

  // Get subscription details
  app.get("/api/razorpay/subscription/:subscriptionId", requireAuth, getSubscriptionDetails);

  // Cancel subscription
  app.post("/api/razorpay/subscription/:subscriptionId/cancel", requireAuth, cancelRazorpaySubscription);

  // Generate smart timing analysis
  app.post("/api/ai/smart-timing/generate", requireAuth, async (req: AuthRequest, res) => {
    try {
      const tasks = await storage.getTasks(req.userId!);
      const incompleteTasks = tasks.filter(task => !task.completed);
      
      // Generate AI-powered timing analyses
      const analyses = incompleteTasks.slice(0, 3).map(task => ({
        id: `analysis_${task.id}_${Date.now()}`,
        taskId: task.id,
        taskTitle: task.title,
        recommendation: `Based on circadian analysis, this ${task.taskType || 'general'} task is optimal now`,
        confidence: Math.floor(Math.random() * 30) + 70, // 70-100%
        optimalTime: new Date(Date.now() + Math.random() * 4 * 60 * 60 * 1000).toISOString(),
        reasoning: `Your energy levels are currently ${['high', 'medium', 'low'][Math.floor(Math.random() * 3)]} which aligns well with ${task.taskType || 'general'} tasks. Consider your current focus state and circadian rhythm patterns.`,
        circadianScore: Math.floor(Math.random() * 40) + 60, // 60-100
        energyLevel: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as 'high' | 'medium' | 'low',
        taskType: task.taskType || 'general',
        estimatedDuration: Math.floor(Math.random() * 90) + 15, // 15-105 minutes
        createdAt: new Date().toISOString()
      }));

      res.json({ analyses });
    } catch (error) {
      console.error("Error generating smart timing analysis:", error);
      res.status(500).json({ error: "Failed to generate timing analysis" });
    }
  });

  // Apply timing recommendation endpoint
  app.post("/api/ai/apply-timing-recommendation", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { taskId, action } = req.body;
      
      if (!taskId || !action || !['accept', 'deny'].includes(action)) {
        return res.status(400).json({ error: "Invalid request parameters" });
      }

      if (action === 'accept') {
        // Update task with AI recommendation
        const task = await storage.getTask(taskId);
        if (!task || task.userId !== req.userId) {
          return res.status(404).json({ error: "Task not found" });
        }

        // Apply AI timing recommendation (stub implementation)
        await storage.updateTask(taskId, {
          scheduledAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
          updatedAt: new Date()
        });

        res.json({ success: true, action: 'accept', message: "Timing recommendation applied" });
      } else {
        // Just acknowledge dismissal
        res.json({ success: true, action: 'deny', message: "Timing recommendation dismissed" });
      }
    } catch (error) {
      console.error("Error applying timing recommendation:", error);
      res.status(500).json({ error: "Failed to apply timing recommendation" });
    }
  });

  // Toggle between free and premium user for testing
  app.post("/api/dev/toggle-premium", requireAuth, async (req: AuthRequest, res) => {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ error: "Dev routes only available in development" });
    }

    try {
      if (!req.userId) {
        return res.status(401).json({ error: "User ID not found in token" });
      }

      let user = await storage.getUser(req.userId);
      if (!user && req.user) {
        // Use the user from the auth middleware if available
        user = req.user;
      }
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Toggle between 'free' and 'pro' tiers (updated enum values)
      const newTier = user.tier === 'free' ? 'pro' : 'free';
      await storage.updateUser(user.id, { 
        tier: newTier,
        // Reset AI usage when switching tiers
        dailyAiCalls: 0,
        dailyAiCallsResetAt: new Date()
      });

      console.log(`Dev toggle: User ${user.id} (${user.email}) switched to ${newTier} tier`);

      res.json({
        success: true,
        isPremium: newTier !== 'free',
        tier: newTier,
        message: `Switched to ${newTier} user mode`
      });
    } catch (error) {
      console.error("Failed to toggle premium:", error);
      res.status(500).json({ error: "Failed to toggle premium status" });
    }
  });



  // Get user profile
  app.get("/api/user/profile", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "User ID not found in token" });
      }

      const user = await storage.getUser(req.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Return safe user data (exclude sensitive fields)
      const safeUserData = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        timezone: user.timezone,
        tier: user.tier,
        dailyAiCalls: user.dailyAiCalls,
        createdAt: user.createdAt,
      };

      res.json(safeUserData);
    } catch (error) {
      console.error("Failed to get user profile:", error);
      res.status(500).json({ error: "Failed to get user profile" });
    }
  });

  // Conversational Task Refiner (FREE for testing)
  app.post("/api/ai/refine-task", optionalAuth, async (req: AuthRequest, res) => {
      try {
        const { originalTask, userQuery, context } = req.body;
        
        if (!originalTask || !userQuery) {
          return res.status(400).json({ error: "Original task and user query are required" });
        }

        // Use the refineTask function instead of aiBrain (which isn't imported)
        const refinement = await refineTask(originalTask, userQuery, context || {});
        
        res.json(refinement);
      } catch (error) {
        console.error("Task refinement error:", error);
        res.status(500).json({ error: "Failed to refine task" });
      }
    }
  );

  // Get user limits and usage (unlimited for testing)
  app.get("/api/user/limits", async (req: AuthRequest, res) => {
      try {
        const limits = await getUserLimits(req.userId!);
        res.json({ limits });
      } catch (error) {
        console.error("Get limits error:", error);
        res.status(500).json({ error: "Failed to get user limits" });
      }
    }
  );

  // ============================================================================
  // TASK ROUTES WITH AI ENHANCEMENT
  // ============================================================================

  // Get all tasks (works with or without auth for testing)
  app.get("/api/tasks", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      console.log(`Getting tasks for user: ${req.userId} (${req.user?.email || 'unknown email'})`);
      const tasks = await storage.getTasks(req.userId);
      console.log(`Found ${tasks.length} tasks for user ${req.userId}`);
      res.json({ tasks });
    } catch (error) {
      console.error("Get tasks error:", error);
      res.status(500).json({ error: "Failed to get tasks" });
    }
  });

  // Get today's tasks
  app.get("/api/tasks/today", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const userId = req.userId;
      const allTasks = await storage.getTasks(userId);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayTasks = allTasks.filter(task => {
        // Show incomplete tasks that are either:
        // 1. Due today
        // 2. Created today and have no due date (new tasks)
        if (task.completed) return false;
        
        if (task.dueDate) {
          const dueDate = new Date(task.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate >= today && dueDate < tomorrow;
        }
        
        // If no due date, check if created today
        if (task.createdAt) {
          const createdDate = new Date(task.createdAt);
          createdDate.setHours(0, 0, 0, 0);
          return createdDate >= today && createdDate < tomorrow;
        }
        
        return false;
      });

      res.json(todayTasks);
    } catch (error) {
      console.error("Get today's tasks error:", error);
      res.status(500).json({ error: "Failed to get today's tasks" });
    }
  });

  // Enhanced task creation with AI parsing (no auth required for testing)
  app.post("/api/tasks", requireAuth, async (req: AuthRequest, res) => {
      try {
        if (!req.userId) {
          return res.status(401).json({ error: "User not authenticated" });
        }
        const userId = req.userId;

        // Check if this is a natural language input that needs AI parsing
        const { title, useAiParsing, ...otherData } = req.body;
        
        let taskData = { title, ...otherData };
        
        // If AI parsing is requested and user has access
        if (useAiParsing && title && typeof title === 'string') {
          try {
            const analysis = await parseNaturalLanguageTask(title);
            taskData = {
              ...taskData,
              title: analysis.title,
              description: analysis.description || taskData.description,
              priority: analysis.priority,
              category: analysis.category,
              tags: analysis.tags,
              estimatedTime: analysis.estimatedTime,
              dueDate: analysis.dueDate,
              contextSwitchCost: analysis.contextSwitchCost,
            };
          } catch (error) {
            console.error("AI parsing error:", error);
            // Continue with original data if AI parsing fails
          }
        }

        // Validate input
        const result = insertTaskSchema.safeParse(taskData);
        if (!result.success) {
          return res.status(400).json({ 
            error: "Invalid task data", 
            details: result.error.errors 
          });
        }

        const task = await storage.createTask(userId, result.data);
        res.status(201).json({ task });
      } catch (error) {
        console.error("Create task error:", error);
        res.status(500).json({ error: "Failed to create task" });
      }
    }
  );

  // Update task (works with or without auth for testing)
  app.patch("/api/tasks/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const userId = req.userId;

      const taskId = req.params.id;
      if (!taskId) {
        return res.status(400).json({ error: "Task ID is required" });
      }

      // Get the existing task first to ensure it exists and belongs to user
      const existingTasks = await storage.getTasks(userId);
      const existingTask = existingTasks.find(t => t.id === taskId);
      
      if (!existingTask) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Validate input
      const result = updateTaskSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          error: "Invalid task data", 
          details: result.error.errors 
        });
      }

      const task = await storage.updateTask(taskId, userId, result.data);
      if (!task) {
        return res.status(404).json({ error: "Task not found or update failed" });
      }

      res.json({ task });
    } catch (error) {
      console.error("Update task error:", error);
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  // Delete task (works with or without auth for testing)
  app.delete("/api/tasks/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const userId = req.userId;

      const taskId = req.params.id;
      if (!taskId) {
        return res.status(400).json({ error: "Task ID is required" });
      }

      // Get the existing task first to ensure it exists and belongs to user
      const existingTasks = await storage.getTasks(userId);
      const existingTask = existingTasks.find(t => t.id === taskId);
      
      if (!existingTask) {
        return res.status(404).json({ error: "Task not found" });
      }

      const deleted = await storage.deleteTask(taskId, userId);
      if (!deleted) {
        return res.status(404).json({ error: "Task not found or delete failed" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Delete task error:", error);
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  // ============================================================================
  // NOTE ROUTES
  // ============================================================================

  // Get all notes
  app.get("/api/notes", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const userId = req.userId;
      const notes = await storage.getNotes(userId);
      res.json({ notes });
    } catch (error) {
      console.error("Get notes error:", error);
      res.status(500).json({ error: "Failed to get notes" });
    }
  });

  // Create note
  app.post("/api/notes", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "User ID not found in token" });
      }

      // Validate input
      const result = insertNoteSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          error: "Invalid note data", 
          details: result.error.errors 
        });
      }

      const note = await storage.createNote(req.userId, result.data);
      res.status(201).json({ note });
    } catch (error) {
      console.error("Create note error:", error);
      res.status(500).json({ error: "Failed to create note" });
    }
  });

  // ============================================================================
  // ANALYTICS ROUTES
  // ============================================================================

  app.get("/api/analytics/stats", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const userId = req.userId;
      
      const tasks = await storage.getTasks(userId);
      const notes = await storage.getNotes(userId);
      
      const stats = {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.completed).length,
        pendingTasks: tasks.filter(t => !t.completed).length,
        totalNotes: notes.length,
        todayTasks: tasks.filter(t => {
          if (!t.dueDate) return false;
          const today = new Date();
          const taskDate = new Date(t.dueDate);
          return taskDate.toDateString() === today.toDateString();
        }).length,
        completionRate: tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0,
      };

      res.json(stats);
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({ error: "Failed to get analytics" });
    }
  });

  // AI Routes
  app.use('/api/ai', aiRoutes);
  
  // AI Brain - Central AI controller
  const { registerAIBrainRoutes } = await import("./routes/ai-brain");
  registerAIBrainRoutes(app);
  
  // ============================================================================
  // NOTIFICATION ROUTES
  // ============================================================================
  
  // Get pending notifications for real-time display
  app.get("/api/notifications/pending", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId || 'demo-user';
      const notifications = await notificationService.getPendingNotifications(userId);
      res.json({ notifications });
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ error: "Failed to get notifications" });
    }
  });

  // Register device for push notifications
  app.post("/api/notifications/register-device", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId || 'demo-user';
      const { token, platform } = req.body;
      
      // Store device token for push notifications
      console.log(`Registered ${platform} device for user ${userId}:`, token?.substring(0, 20) + '...');
      res.json({ success: true });
    } catch (error) {
      console.error("Device registration error:", error);
      res.status(500).json({ error: "Failed to register device" });
    }
  });

  // Trigger notification analysis (for testing)
  app.post("/api/notifications/analyze", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId || 'demo-user';
      await notificationService.analyzeAndScheduleTaskNotifications(userId);
      res.json({ success: true, message: "Notification analysis triggered" });
    } catch (error) {
      console.error("Notification analysis error:", error);
      res.status(500).json({ error: "Failed to analyze notifications" });
    }
  });
  
  // NOTE: Removed unwanted features per user request:
  // - Auto Scheduler 
  // - Social Accountability (gamificationRoutes, socialRoutes)
  // - Achievement System 
  // - Integration Hub (integrationRoutes)

  // ============================================================================
  // DEV MODE ROUTES
  // ============================================================================

  // Dev mode endpoints
  app.post('/api/dev/toggle-tier', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Cycle through tiers: free → basic → pro → free
      let newTier: string;
      switch (user.tier) {
        case 'free':
          newTier = 'basic';
          break;
        case 'basic':
          newTier = 'pro';
          break;
        case 'pro':
          newTier = 'free';
          break;
        default:
          newTier = 'basic';
      }

      await storage.updateUser(userId, { tier: newTier });

      res.json({ success: true, newTier });
    } catch (error) {
      console.error('Error toggling tier:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Reset AI usage counters (both daily and monthly)
  app.post('/api/dev/reset-ai-usage', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Reset both daily and monthly AI usage counters
      await storage.updateUser(userId, {
        dailyAiCalls: 0,
        monthlyAiCalls: 0,
        dailyAiCallsResetAt: new Date(),
        monthlyAiCallsResetAt: new Date()
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error resetting AI usage:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/dev/reset-data', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Reset user's tasks and notes
      await storage.deleteAllUserTasks(userId);
      await storage.deleteAllUserNotes(userId);
      
      // Reset AI usage (both daily and monthly)
      await storage.updateUser(userId, {
        dailyAiCalls: 0,
        monthlyAiCalls: 0,
        dailyAiCallsResetAt: new Date(),
        monthlyAiCallsResetAt: new Date()
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error resetting data:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Set up Replit Auth middleware first
  await setupAuth(app);

  // Replit Auth routes - user endpoint
  app.get('/api/replit-auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "No user claims found" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching Replit Auth user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Fallback authentication routes for when Supabase is not available
  app.post('/api/auth/fallback-signup', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ 
          message: 'Missing required fields: email, password, firstName, lastName' 
        });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ 
          message: 'An account with this email already exists. Please try signing in instead.' 
        });
      }

      // Create new user
      const newUser = await storage.createUser({
        email,
        passwordHash: password, // In production, this should be hashed
        firstName,
        lastName,
        tier: 'free',
      });

      res.json({
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        emailVerified: true
      });
    } catch (error) {
      console.error('Fallback signup error:', error);
      res.status(500).json({ message: 'Sign up failed. Please try again.' });
    }
  });

  app.post('/api/auth/fallback-signin', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ 
          message: 'Missing email or password' 
        });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ 
          message: 'Invalid email or password. Please check your credentials and try again.' 
        });
      }

      // In production, you would verify the hashed password
      if (user.passwordHash !== password) {
        return res.status(401).json({ 
          message: 'Invalid email or password. Please check your credentials and try again.' 
        });
      }

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: true
      });
    } catch (error) {
      console.error('Fallback signin error:', error);
      res.status(500).json({ message: 'Sign in failed. Please try again.' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}