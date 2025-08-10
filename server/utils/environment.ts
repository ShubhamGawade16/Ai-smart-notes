// Environment configuration validation
interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  OPENAI_API_KEY?: string;
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
}

const requiredEnvVars = [
  'DATABASE_URL',
  'VITE_SUPABASE_URL', 
  'VITE_SUPABASE_ANON_KEY'
] as const;

const optionalEnvVars = [
  'OPENAI_API_KEY',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET'
] as const;

export function validateEnvironment(): EnvironmentConfig {
  const missingVars: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  }

  // Check optional but important variables
  for (const envVar of optionalEnvVars) {
    if (!process.env[envVar]) {
      warnings.push(`Optional environment variable ${envVar} is not set - some features may not work`);
    }
  }

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars.join(', '));
    console.error('Please check your .env file and ensure all required variables are set.');
    process.exit(1);
  }

  if (warnings.length > 0) {
    warnings.forEach(warning => console.warn('⚠️', warning));
  }

  // Validate NODE_ENV
  const nodeEnv = (process.env.NODE_ENV || 'development') as EnvironmentConfig['NODE_ENV'];
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    console.warn('⚠️ NODE_ENV is not set to a valid value. Defaulting to development.');
  }

  // Validate PORT
  const port = parseInt(process.env.PORT || '5000', 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    console.warn('⚠️ Invalid PORT value. Using default port 5000.');
  }

  // Check for production-specific requirements
  if (nodeEnv === 'production') {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'planify-secret-key-change-in-production') {
      console.error('❌ JWT_SECRET must be set to a secure value in production!');
      process.exit(1);
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.warn('⚠️ Razorpay credentials not set - payment functionality will not work');
    }
  }

  console.log('✅ Environment validation passed');
  console.log(`🚀 Running in ${nodeEnv} mode on port ${port}`);

  return {
    NODE_ENV: nodeEnv,
    PORT: port,
    DATABASE_URL: process.env.DATABASE_URL!,
    JWT_SECRET: process.env.JWT_SECRET || 'planify-secret-key-change-in-production',
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL!,
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY!,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET
  };
}

export const config = validateEnvironment();