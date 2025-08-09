import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { User } from '@shared/schema';
import { storage } from './storage';

export interface AuthRequest extends Request {
  user?: User;
  userId?: string;
}

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required for secure token verification');
}

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
    
    // Try to verify JWT token with signature verification
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      if (decoded && decoded.sub) {
        // For verified JWT tokens, use the 'sub' field as user ID
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
    } catch (jwtError) {
      // If JWT verification fails, log the specific error for debugging
      console.error('JWT verification failed:', jwtError instanceof Error ? jwtError.message : 'Unknown JWT error');
      
      // Fall back to decoding without verification for Supabase tokens
      // This is only safe for tokens that have been verified by Supabase
      try {
        const decoded = jwt.decode(token) as any;
        
        if (decoded && decoded.iss && decoded.iss.includes('supabase')) {
          // This appears to be a Supabase token, verify with Supabase
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
      } catch (decodeError) {
        console.error('Token decode failed:', decodeError instanceof Error ? decodeError.message : 'Unknown decode error');
      }
    }
    
    console.error('Token processing failed: no valid token found');
    return res.status(401).json({ error: 'Invalid token structure' });
    
  } catch (error) {
    console.error('Token processing failed:', error instanceof Error ? error.message : 'Unknown error');
    
    // Provide specific error messages for debugging while maintaining security
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        return res.status(401).json({ error: 'Token has expired' });
      } else if (error.message.includes('invalid signature')) {
        return res.status(401).json({ error: 'Invalid token signature' });
      } else if (error.message.includes('malformed')) {
        return res.status(401).json({ error: 'Malformed token' });
      }
    }
    
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
      // Try JWT verification first
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded?.sub) {
        req.userId = decoded.sub;
      }
    } catch (jwtError) {
      // If JWT fails, try Supabase verification
      try {
        if (supabase && token.startsWith('sb-')) {
          const { data: { user }, error } = await supabase.auth.getUser(token);
          if (user && !error) {
            req.userId = user.id;
          }
        }
      } catch (supabaseError) {
        // Continue without user context
      }
    }
  }
  next();
};