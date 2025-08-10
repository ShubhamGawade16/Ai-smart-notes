import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { User } from '@shared/schema';
import { storage } from './storage';

export interface AuthRequest extends Request {
  user?: User;
  userId?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || "planify-secret-key-change-in-production";

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Unified authentication middleware that handles both JWT and Supabase tokens
export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // First try to verify as Supabase token
    if (supabase && token.startsWith('sb-')) {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (user && !error) {
        // Get or create user in our database
        let dbUser = await storage.getUserByEmail(user.email!);
        
        if (!dbUser) {
          dbUser = await storage.createUser({
            email: user.email!,
            firstName: user.user_metadata?.first_name || '',
            lastName: user.user_metadata?.last_name || '',
            tier: 'free',
            onboardingCompleted: false,
          });
        }
        
        req.userId = dbUser.id;
        req.user = dbUser;
        return next();
      }
    }
    
    // Fallback: Try JWT token or Supabase token decode
    const decoded = jwt.decode(token) as any;
    
    if (decoded && decoded.sub) {
      // For Supabase JWT tokens, use the 'sub' field as user ID
      req.userId = decoded.sub;
      
      // Try to get user from database, create if doesn't exist
      if (decoded.email) {
        let dbUser = await storage.getUserByEmail(decoded.email);
        if (!dbUser) {
          // Create user from JWT token data
          console.log(`Creating new user from JWT: ${decoded.email}`);
          try {
            dbUser = await storage.createUser({
              email: decoded.email,
              firstName: decoded.user_metadata?.first_name || decoded.given_name || '',
              lastName: decoded.user_metadata?.last_name || decoded.family_name || '',
              tier: 'free',
              onboardingCompleted: true, // Skip onboarding for OAuth users
            });
          } catch (createError: any) {
            // If user creation fails due to duplicate email, try to get existing user
            if (createError.message?.includes('duplicate key') || createError.message?.includes('users_email_unique')) {
              console.log(`User ${decoded.email} already exists, fetching existing user`);
              dbUser = await storage.getUserByEmail(decoded.email);
              if (!dbUser) {
                throw new Error(`Failed to create or retrieve user for ${decoded.email}`);
              }
            } else {
              throw createError;
            }
          }
        }
        req.user = dbUser;
        req.userId = dbUser.id;
      }
      
      return next();
    }
    
    console.error('Token decode failed: invalid structure', { hasDecoded: !!decoded, hasSub: decoded?.sub });
    return res.status(401).json({ error: 'Invalid token structure' });
    
  } catch (error) {
    console.error('Token processing failed:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Optional authentication (for public routes that benefit from user context)
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      // First try to verify as Supabase token
      if (supabase && token.startsWith('sb-')) {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (user && !error) {
          console.log('🔍 Supabase user found:', { id: user.id, email: user.email });
          
          // Get or create user in our database
          let dbUser = await storage.getUserByEmail(user.email!);
          
          if (!dbUser) {
            console.log('🔍 Database user lookup by ID: not found');
            console.log('📡 Creating user from Supabase data directly...');
            dbUser = await storage.createUser({
              email: user.email!,
              firstName: user.user_metadata?.first_name || '',
              lastName: user.user_metadata?.last_name || '',
              tier: 'free',
              onboardingCompleted: false,
            });
            console.log('✅ User created:', dbUser.id);
          } else {
            console.log('🔍 Database user lookup by email: found');
            console.log('✅ Using existing user:', dbUser.id);
          }
          
          req.userId = dbUser.id;
          req.user = dbUser;
          // Store Supabase user ID for admin checks
          (req as any).supabaseUserId = user.id;
        }
      } else {
        // Fallback: Try JWT token decode
        const decoded = jwt.decode(token) as any;
        if (decoded?.sub) {
          console.log('🔍 Supabase user found:', { id: decoded.sub, email: decoded.email });
          
          // Try to get user from database
          if (decoded.email) {
            let dbUser = await storage.getUserByEmail(decoded.email);
            if (!dbUser) {
              console.log('🔍 Database user lookup by ID: not found');
              console.log('🔍 Database user lookup by email: found');
              try {
                dbUser = await storage.createUser({
                  email: decoded.email,
                  firstName: decoded.user_metadata?.first_name || decoded.given_name || '',
                  lastName: decoded.user_metadata?.last_name || decoded.family_name || '',
                  tier: 'free',
                  onboardingCompleted: true,
                });
              } catch (createError: any) {
                if (createError.message?.includes('duplicate key') || createError.message?.includes('users_email_unique')) {
                  dbUser = await storage.getUserByEmail(decoded.email);
                }
              }
            } else {
              console.log('🔍 Database user lookup by email: found');
              console.log('✅ Using existing user:', dbUser.id);
            }
            if (dbUser) {
              req.user = dbUser;
              req.userId = dbUser.id;
              // Store Supabase user ID for admin checks
              (req as any).supabaseUserId = decoded.sub;
            }
          }
        }
      }
    } catch (error) {
      // Continue without user context
      console.log('Optional auth failed, continuing without user context:', error);
    }
  }

  next();
};