import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Rate limiting store (in production, use Redis or similar)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Force HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.openai.com https://*.supabase.co wss://*.supabase.co; frame-src https://api.razorpay.com;"
  );
  
  next();
};

// Simple rate limiting middleware
export const rateLimit = (options: { windowMs: number; max: number; message?: string }) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const windowStart = now - options.windowMs;
    
    // Clean old entries
    for (const [ip, data] of requestCounts.entries()) {
      if (data.resetTime < now) {
        requestCounts.delete(ip);
      }
    }
    
    const current = requestCounts.get(key);
    
    if (!current || current.resetTime < now) {
      requestCounts.set(key, { count: 1, resetTime: now + options.windowMs });
      return next();
    }
    
    if (current.count >= options.max) {
      logger.security('Rate limit exceeded', { ip: req.ip, endpoint: req.path });
      return res.status(429).json({ 
        error: options.message || 'Too many requests. Please try again later.' 
      });
    }
    
    current.count++;
    next();
  };
};

// Input validation helpers
export const validateRequired = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const missing = fields.filter(field => !req.body[field]);
    
    if (missing.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        missing
      });
    }
    
    next();
  };
};

// Sanitize input to prevent XSS
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitize(value);
      }
      return sanitized;
    }
    
    return obj;
  };
  
  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  next();
};

// CORS configuration for production
export const corsConfig = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'https://yourdomain.com'
    : true,
  credentials: true,
  optionsSuccessStatus: 200
};