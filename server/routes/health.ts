import express from 'express';
import { storage } from '../storage';
import { logger } from '../utils/logger';

const router = express.Router();

// Basic health check endpoint
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
    };

    res.json(health);
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

// Detailed health check with dependencies
router.get('/health/detailed', async (req, res) => {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {
      database: { status: 'unknown' },
      ai_service: { status: 'unknown' },
      payment_service: { status: 'unknown' },
    },
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development',
  };

  try {
    // Database check
    try {
      // Test database connection with a simple query
      await storage.getUserByEmail('health-check@test.com');
      checks.checks.database = { status: 'healthy' };
    } catch (error) {
      checks.checks.database = { 
        status: 'unhealthy', 
        error: 'Database connection failed' 
      };
      checks.status = 'degraded';
    }

    // AI service check
    if (process.env.OPENAI_API_KEY) {
      checks.checks.ai_service = { status: 'healthy' };
    } else {
      checks.checks.ai_service = { 
        status: 'degraded', 
        error: 'OpenAI API key not configured' 
      };
      if (checks.status === 'healthy') {
        checks.status = 'degraded';
      }
    }

    // Payment service check
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      checks.checks.payment_service = { status: 'healthy' };
    } else {
      checks.checks.payment_service = { 
        status: 'degraded', 
        error: 'Razorpay keys not configured' 
      };
      if (checks.status === 'healthy') {
        checks.status = 'degraded';
      }
    }

    const httpStatus = checks.status === 'healthy' ? 200 : 
                      checks.status === 'degraded' ? 200 : 503;

    res.status(httpStatus).json(checks);

  } catch (error) {
    logger.error('Detailed health check failed', { error });
    res.status(503).json({
      ...checks,
      status: 'unhealthy',
      error: 'Health check failed'
    });
  }
});

// Readiness probe for Kubernetes/container deployments
router.get('/ready', async (req, res) => {
  try {
    // Check if all critical services are ready
    const isReady = !!(
      process.env.DATABASE_URL &&
      (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL)
    );

    if (isReady) {
      res.json({ status: 'ready', timestamp: new Date().toISOString() });
    } else {
      res.status(503).json({ 
        status: 'not_ready', 
        timestamp: new Date().toISOString(),
        error: 'Required environment variables not set'
      });
    }
  } catch (error) {
    logger.error('Readiness check failed', { error });
    res.status(503).json({ 
      status: 'not_ready', 
      timestamp: new Date().toISOString(),
      error: 'Readiness check failed'
    });
  }
});

// Liveness probe
router.get('/live', (req, res) => {
  res.json({ 
    status: 'alive', 
    timestamp: new Date().toISOString(),
    pid: process.pid 
  });
});

export default router;