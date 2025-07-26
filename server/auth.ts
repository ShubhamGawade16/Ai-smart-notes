import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Request, Response, NextFunction } from 'express';
import { User } from '@shared/schema';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface AuthRequest extends Request {
  user?: User;
}

// JWT utilities
export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): { userId: string } => {
  return jwt.verify(token, JWT_SECRET) as { userId: string };
};

// Password utilities
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// Authentication middleware
export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = verifyToken(token);
    // Fetch user from database using storage
    const storage = req.app.get('storage');
    const user = await storage.getUser(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Optional authentication (for public routes that benefit from user context)
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = verifyToken(token);
      const storage = req.app.get('storage');
      const user = await storage.getUser(decoded.userId);
      if (user) {
        req.user = user;
      }
    } catch (error) {
      // Continue without user context
    }
  }
  next();
};

// Tier-based access control
export const checkTier = (requiredTier: 'free' | 'basic_pro' | 'advanced_pro' | 'premium_pro') => {
  const tierLevels = {
    free: 0,
    basic_pro: 1,
    advanced_pro: 2,
    premium_pro: 3
  };

  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userTierLevel = tierLevels[req.user.tier];
    const requiredTierLevel = tierLevels[requiredTier];

    if (userTierLevel < requiredTierLevel) {
      return res.status(403).json({ 
        error: 'Upgrade required',
        requiredTier,
        currentTier: req.user.tier,
        upgradeUrl: '/upgrade'
      });
    }

    next();
  };
};

// Rate limiting for AI features
export const checkAiUsage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const storage = req.app.get('storage');
  const user = req.user;

  // Reset daily count if needed
  const now = new Date();
  const resetTime = new Date(user.dailyAiCallsResetAt);
  if (now > resetTime) {
    await storage.updateUser(user.id, {
      dailyAiCalls: 0,
      dailyAiCallsResetAt: new Date(now.getTime() + 24 * 60 * 60 * 1000)
    });
    user.dailyAiCalls = 0;
  }

  // Check tier limits
  const limits = {
    free: 5, // 5 AI calls per day
    basic_pro: 50,
    advanced_pro: 200,
    premium_pro: -1 // unlimited
  };

  const dailyLimit = limits[user.tier];
  if (dailyLimit !== -1 && user.dailyAiCalls >= dailyLimit) {
    return res.status(429).json({
      error: 'Daily AI usage limit reached',
      currentUsage: user.dailyAiCalls,
      limit: dailyLimit,
      upgradeUrl: '/upgrade',
      resetTime: user.dailyAiCallsResetAt
    });
  }

  // Increment usage count
  await storage.updateUser(user.id, {
    dailyAiCalls: user.dailyAiCalls + 1
  });

  next();
};

// Check monthly task limits
export const checkTaskLimit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Only free tier has task limits
  if (req.user.tier !== 'free') {
    return next();
  }

  const storage = req.app.get('storage');
  const user = req.user;

  // Reset monthly count if needed
  const now = new Date();
  const resetTime = new Date(user.monthlyTaskCountResetAt);
  if (now > resetTime) {
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    nextMonth.setHours(0, 0, 0, 0);

    await storage.updateUser(user.id, {
      monthlyTaskCount: 0,
      monthlyTaskCountResetAt: nextMonth
    });
    user.monthlyTaskCount = 0;
  }

  const MONTHLY_TASK_LIMIT = 50;
  if (user.monthlyTaskCount >= MONTHLY_TASK_LIMIT) {
    return res.status(429).json({
      error: 'Monthly task limit reached',
      currentCount: user.monthlyTaskCount,
      limit: MONTHLY_TASK_LIMIT,
      upgradeUrl: '/upgrade',
      resetTime: user.monthlyTaskCountResetAt
    });
  }

  next();
};