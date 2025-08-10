import { Request, Response, NextFunction } from 'express';

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy (allow more permissive rules for development)
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  let cspDirectives;
  if (isDevelopment) {
    // More permissive CSP for development with Replit
    cspDirectives = [
      "default-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: http: ws: wss:",
      "style-src 'self' 'unsafe-inline' https: http:",
      "font-src 'self' https: http: data:",
      "img-src 'self' data: https: http: blob:",
      "connect-src 'self' https: http: ws: wss:",
      "frame-src 'self' https: http:",
      "object-src 'none'",
      "base-uri 'self'"
    ].join('; ');
  } else {
    // Strict CSP for production
    cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://js.stripe.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.openai.com https://*.supabase.co wss://*.supabase.co https://api.razorpay.com",
      "frame-src https://js.stripe.com https://checkout.razorpay.com",
      "object-src 'none'",
      "base-uri 'self'"
    ].join('; ');
  }
  
  res.setHeader('Content-Security-Policy', cspDirectives);
  
  next();
};

// CORS configuration for production
export const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (mobile apps, server-to-server, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://your-production-domain.com', // Replace with actual domain
      /\.replit\.(app|dev)$/ // Allow Replit domains
    ];
    
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return origin === allowed;
      } else {
        return allowed.test(origin);
      }
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Request size limits
export const requestSizeLimits = {
  // General API requests
  json: { limit: '1mb' },
  
  // File uploads (if you add them later)
  fileUpload: { limit: '10mb' },
  
  // URL encoded data
  urlencoded: { limit: '1mb', extended: false }
};

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Basic XSS prevention - strip HTML tags from string inputs
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remove HTML tags and decode HTML entities
      return obj.replace(/<[^>]*>/g, '').trim();
    } else if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    } else if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  next();
};