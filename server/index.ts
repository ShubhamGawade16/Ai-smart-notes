import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { errorHandler } from './middleware/error-handler';
import { generalLimiter } from './middleware/rate-limiter';
import { healthCheck, readinessCheck } from './utils/health-check';
import { setupGracefulShutdown } from './utils/graceful-shutdown';
import { config } from './utils/environment';
import { aiCreditsScheduler } from './services/ai-credits-scheduler';

const app = express();

// Security and production middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Trust proxy for accurate IP addresses (important for rate limiting)
app.set('trust proxy', 1);

// Health check endpoints (before rate limiting)
app.get('/health', healthCheck);
app.get('/ready', readinessCheck);

// Apply rate limiting to all routes except health checks
app.use(generalLimiter.middleware());

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Use production-ready error handler
  app.use(errorHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = config.PORT;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Initialize AI Credits Scheduler after server starts
    console.log('🔄 AI Credits Scheduler initialized and running');
    
    // Setup graceful shutdown handling
    setupGracefulShutdown(server, {
      timeout: 10000, // 10 seconds
      cleanup: async () => {
        // Add any cleanup tasks here (close database connections, etc.)
        console.log('Running cleanup tasks...');
        aiCreditsScheduler.stopService();
      }
    });
  });
})();
