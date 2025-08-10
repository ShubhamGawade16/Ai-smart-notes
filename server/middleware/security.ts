// Note: These are optional production enhancements
// Install with: npm install express-rate-limit helmet
import { Express } from 'express';
import { productionConfig } from '../config/production';

// Apply security middleware for production
export function applySecurity(app: Express) {
  // Only apply in production
  if (process.env.NODE_ENV !== 'production') {
    console.log('⚠️ Skipping security middleware in development');
    return;
  }

  try {
    // Basic security headers without external dependencies
    app.use((req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
      next();
    });

    // Simple rate limiting without external dependencies
    const requestCounts = new Map();
    app.use((req, res, next) => {
      const ip = req.ip || 'unknown';
      const now = Date.now();
      const windowStart = now - (15 * 60 * 1000); // 15 minutes
      
      if (!requestCounts.has(ip)) {
        requestCounts.set(ip, []);
      }
      
      const requests = requestCounts.get(ip).filter((time: number) => time > windowStart);
      
      if (requests.length >= 100) {
        return res.status(429).json({ error: 'Too many requests' });
      }
      
      requests.push(now);
      requestCounts.set(ip, requests);
      next();
    });

    console.log('✅ Production security middleware applied');
  } catch (error) {
    console.error('❌ Failed to apply security middleware:', error);
  }
}