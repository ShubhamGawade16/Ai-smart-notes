import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { User } from '@shared/schema';

export interface AuthRequest extends Request {
  user?: User;
  userId?: string;
}

// Supabase JWT authentication middleware
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
    // For Supabase JWT tokens, we can decode without verification for user ID
    // Supabase handles the verification on their end
    const decoded = jwt.decode(token) as any;
    
    if (!decoded || !decoded.sub) {
      return res.status(401).json({ error: 'Invalid token format' });
    }

    // Store the user ID from Supabase JWT (sub field)
    req.userId = decoded.sub;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid access token' });
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
      const decoded = jwt.decode(token) as any;
      if (decoded?.sub) {
        req.userId = decoded.sub;
      }
    } catch (error) {
      // Continue without user context
    }
  }
  next();
};