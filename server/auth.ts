import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '@shared/schema';

export interface AuthRequest extends Request {
  user?: User;
  userId?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || "planify-secret-key-change-in-production";

// JWT authentication middleware
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
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    // Add user ID to request
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
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