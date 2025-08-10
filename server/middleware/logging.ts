import { Request, Response, NextFunction } from 'express';
// Morgan is installed but imported conditionally for production
let morgan: any;

// Custom logging middleware for production
export function setupLogging() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    try {
      morgan = require('morgan');
      // Production logging - minimal and structured
      return morgan('combined', {
        skip: (req: Request, res: Response) => {
          // Skip health check logs to reduce noise
          return req.url === '/health' || req.url === '/ready';
        }
      });
    } catch (error) {
      console.log('⚠️ Morgan not available, using basic logging');
      return basicLogging;
    }
  } else {
    // Development logging - simplified
    return basicLogging;
  }
}

// Basic logging fallback
function basicLogging(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const method = req.method;
    const url = req.url;
    const status = res.statusCode;
    
    // Skip health check logs
    if (url === '/health' || url === '/ready') return;
    
    console.log(`${method} ${url} ${status} - ${duration}ms`);
  });
  
  next();
}

// Request ID middleware for tracing
export function requestId(req: Request, res: Response, next: NextFunction) {
  const requestId = Math.random().toString(36).substring(2, 15);
  (req as any).requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
}

// Response time logging
export function responseTime(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) { // Log slow requests
      console.warn(`Slow request: ${req.method} ${req.url} - ${duration}ms`);
    }
  });
  
  next();
}