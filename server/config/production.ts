// Production configuration and security settings
export const productionConfig = {
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  },

  // API rate limiting (more restrictive)
  apiRateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: 'API rate limit exceeded, please try again later.'
  },

  // AI features rate limiting
  aiRateLimit: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 AI requests per minute per IP
    message: 'AI rate limit exceeded, please wait before making more requests.'
  },

  // Security headers
  securityHeaders: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'", "https://checkout.razorpay.com"],
        connectSrc: ["'self'", "https://api.openai.com", "https://*.supabase.co"],
        imgSrc: ["'self'", "data:", "https:"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  },

  // Session configuration
  session: {
    cookie: {
      secure: true, // HTTPS only in production
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'strict' as const
    },
    rolling: true,
    resave: false,
    saveUninitialized: false
  },

  // Database connection pool
  database: {
    maxConnections: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  },

  // Logging configuration
  logging: {
    level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
    format: 'combined',
    filename: 'app.log',
    maxSize: '20m',
    maxFiles: 5
  },

  // Health check configuration
  healthCheck: {
    timeout: 10000,
    interval: 30000
  }
};