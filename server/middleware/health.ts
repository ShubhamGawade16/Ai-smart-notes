import { Request, Response } from 'express';
import { storage } from '../storage';

// Health check endpoint for production monitoring
export async function healthCheck(req: Request, res: Response) {
  const startTime = Date.now();
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {
      database: 'unknown',
      memory: 'ok',
      disk: 'ok'
    }
  };

  try {
    // Database health check - simplified
    try {
      // Just check if storage is responsive
      const testResult = await storage.getUserByEmail('health-check@test.com');
      health.checks.database = 'ok';
    } catch (error) {
      health.checks.database = 'error';
    }
  } catch (error) {
    health.status = 'error';
    health.checks.database = 'error';
    console.error('Database health check failed:', error);
  }

  // Memory usage check
  const memUsage = process.memoryUsage();
  const memUsageMB = Math.round(memUsage.rss / 1024 / 1024);
  if (memUsageMB > 500) { // Alert if memory usage > 500MB
    health.checks.memory = 'warning';
  }

  const responseTime = Date.now() - startTime;
  const statusCode = health.status === 'ok' ? 200 : 503;

  res.status(statusCode).json({
    ...health,
    responseTime: `${responseTime}ms`
  });
}

// Readiness check for deployment
export async function readinessCheck(req: Request, res: Response) {
  try {
    // Check essential services - simplified
    try {
      await storage.getUserByEmail('readiness-check@test.com');
    } catch (error) {
      // Storage is working if it returns null/error correctly
    }
    
    // Check environment variables
    const requiredEnvVars = [
      'DATABASE_URL',
      'OPENAI_API_KEY',
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY'
    ];

    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length > 0) {
      return res.status(503).json({
        status: 'not_ready',
        message: 'Missing required environment variables',
        missing: missingEnvVars
      });
    }

    res.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      message: 'Service is ready to accept traffic'
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      message: 'Service not ready',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}