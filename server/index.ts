import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { applySecurity } from "./middleware/security";
import { setupLogging, requestId, responseTime } from "./middleware/logging";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { healthCheck, readinessCheck } from "./middleware/health";
import compression from "compression";

const app = express();

// Production middleware - must be first
if (process.env.NODE_ENV === 'production') {
  app.use(compression()); // Response compression
  app.use(setupLogging()); // Request logging
  app.use(requestId); // Request ID tracking
  app.use(responseTime); // Response time monitoring
  applySecurity(app); // Security headers and rate limiting
  
  // Health check endpoints for production monitoring
  app.get('/health', healthCheck);
  app.get('/ready', readinessCheck);
  
  console.log('✅ Production middleware enabled');
} else {
  app.use(setupLogging()); // Basic logging in development
  console.log('⚠️ Development mode - limited middleware');
}

app.use(express.json({ limit: '10mb' })); // Increased limit for production
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

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

  // Production-ready error handling
  app.use(notFoundHandler); // 404 handler
  app.use(errorHandler); // Global error handler

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
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
