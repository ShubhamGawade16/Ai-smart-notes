import { Request, Response } from 'express';
import { storage } from '../storage';

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: 'healthy' | 'unhealthy';
    memory: 'healthy' | 'unhealthy';
    environment: 'healthy' | 'unhealthy';
  };
  version?: string;
}

export const healthCheck = async (req: Request, res: Response) => {
  const startTime = Date.now();
  const checks = await runHealthChecks();
  const responseTime = Date.now() - startTime;
  
  const status: HealthStatus = {
    status: Object.values(checks).every(check => check === 'healthy') ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
    version: process.env.npm_package_version
  };

  // Add response time header
  res.set('X-Response-Time', `${responseTime}ms`);
  
  // Return appropriate HTTP status
  const httpStatus = status.status === 'healthy' ? 200 : 503;
  res.status(httpStatus).json(status);
};

async function runHealthChecks() {
  const checks = {
    database: 'unhealthy' as 'healthy' | 'unhealthy',
    memory: 'healthy' as 'healthy' | 'unhealthy',
    environment: 'healthy' as 'healthy' | 'unhealthy'
  };

  // Database check
  try {
    // Try a simple query to verify database connectivity
    await storage.getUserById('health-check-test');
    checks.database = 'healthy';
  } catch (error) {
    console.error('Database health check failed:', error);
    checks.database = 'unhealthy';
  }

  // Memory check
  const memUsage = process.memoryUsage();
  const memUsagePercent = (memUsage.rss / (1024 * 1024 * 1024)) * 100; // Convert to GB percentage
  if (memUsagePercent > 90) {
    checks.memory = 'unhealthy';
  }

  // Environment check
  const requiredEnvVars = ['DATABASE_URL', 'VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  if (missingEnvVars.length > 0) {
    console.warn('Missing environment variables:', missingEnvVars);
    checks.environment = 'unhealthy';
  }

  return checks;
}

export const readinessCheck = async (req: Request, res: Response) => {
  // More strict checks for readiness (when app is ready to serve traffic)
  try {
    // Verify database connection with actual query
    await storage.getUserById('readiness-check-test');
    
    // Check if all required services are available
    const requiredEnvVars = ['DATABASE_URL', 'VITE_SUPABASE_URL'];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    }

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};