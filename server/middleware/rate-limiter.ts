import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });
  }

  private getKey(req: Request): string {
    return req.ip || req.connection.remoteAddress || 'unknown';
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const key = this.getKey(req);
      const now = Date.now();
      
      if (!this.store[key] || this.store[key].resetTime < now) {
        this.store[key] = {
          count: 1,
          resetTime: now + this.windowMs
        };
        return next();
      }

      this.store[key].count++;

      if (this.store[key].count > this.maxRequests) {
        const resetTimeSeconds = Math.ceil((this.store[key].resetTime - now) / 1000);
        
        res.set({
          'X-RateLimit-Limit': this.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': this.store[key].resetTime.toString(),
          'Retry-After': resetTimeSeconds.toString()
        });

        return res.status(429).json({
          success: false,
          error: 'Too many requests',
          retryAfter: resetTimeSeconds
        });
      }

      res.set({
        'X-RateLimit-Limit': this.maxRequests.toString(),
        'X-RateLimit-Remaining': (this.maxRequests - this.store[key].count).toString(),
        'X-RateLimit-Reset': this.store[key].resetTime.toString()
      });

      next();
    };
  }
}

// Export different rate limiters for different endpoints
// More generous limits for development, stricter for production
const isDevelopment = process.env.NODE_ENV === 'development';

export const generalLimiter = new RateLimiter(
  15 * 60 * 1000, 
  isDevelopment ? 1000 : 100 // 1000 requests per 15 minutes in dev, 100 in prod
);

export const apiLimiter = new RateLimiter(
  15 * 60 * 1000, 
  isDevelopment ? 500 : 50 // 500 API requests per 15 minutes in dev, 50 in prod
);

export const paymentLimiter = new RateLimiter(
  15 * 60 * 1000, 
  isDevelopment ? 50 : 10 // 50 payment requests per 15 minutes in dev, 10 in prod
);

export const aiLimiter = new RateLimiter(
  15 * 60 * 1000, 
  isDevelopment ? 100 : 30 // 100 AI requests per 15 minutes in dev, 30 in prod
);