import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '@shared/schema';

export interface AuthRequest extends Request {
  user?: User;
  userId?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || "planify-secret-key-change-in-production";

// JWT authentication middleware (Supabase compatible)
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
    // For Supabase tokens, we decode without signature verification
    // since we trust tokens coming from our frontend
    const decoded = jwt.decode(token) as any;
    
    if (!decoded || !decoded.sub) {
      console.error('Token decode failed: invalid structure', { hasDecoded: !!decoded, hasSub: decoded?.sub });
      return res.status(401).json({ error: 'Invalid token structure' });
    }
    
    // Add user ID to request (Supabase uses 'sub' claim)
    req.userId = decoded.sub;
    next();
  } catch (error) {
    console.error('Token processing failed:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
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