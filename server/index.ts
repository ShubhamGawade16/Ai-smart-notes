import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { securityHeaders, rateLimit } from "./middleware/security";
import { logger } from "./utils/logger";

const app = express();

// Security middleware
app.use(securityHeaders);

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Rate limiting for API routes
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many API requests. Please try again later.'
}));

// Extra strict rate limiting for auth endpoints
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 auth requests per window
  message: 'Too many authentication attempts. Please try again later.'
}));

// Payment endpoints rate limiting
app.use('/api/payments', rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // 20 payment requests per window
  message: 'Too many payment requests. Please try again later.'
}));

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

  // Global error handler
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production' 
      ? (status < 500 ? err.message : "Internal Server Error")
      : err.message || "Internal Server Error";

    // Log the error
    if (status >= 500) {
      logger.error('Server error', { 
        error: err.message, 
        stack: err.stack, 
        url: req.url, 
        method: req.method 
      });
    } else {
      logger.warn('Client error', { 
        error: err.message, 
        url: req.url, 
        method: req.method,
        ip: req.ip 
      });
    }

    res.status(status).json({ message });
    
    // Don't throw in production
    if (process.env.NODE_ENV !== 'production') {
      throw err;
    }
  });

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
  const server_instance = server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    logger.info(`🚀 Server running on port ${port} in ${process.env.NODE_ENV || 'development'} mode`);
  });

  // Graceful shutdown handling
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server_instance.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    server_instance.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });
})();
