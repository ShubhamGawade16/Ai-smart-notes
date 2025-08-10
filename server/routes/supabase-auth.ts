import { Router } from "express";
import { storage } from "../storage";
import { createClient } from '@supabase/supabase-js';

const router = Router();

// Create Supabase client for server-side operations
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Middleware to verify Supabase JWT token
const verifySupabaseToken = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Token verification failed' });
  }
};

// Get current user data
router.get('/me', verifySupabaseToken, async (req: any, res) => {
  try {
    const supabaseUser = req.user;
    
    // Get user from our database
    let user = await storage.getUserByEmail(supabaseUser.email);
    
    if (!user) {
      // Create user if doesn't exist
      user = await storage.createUser({
        email: supabaseUser.email,
        firstName: supabaseUser.user_metadata?.first_name || '',
        lastName: supabaseUser.user_metadata?.last_name || '',
        onboardingCompleted: false,
      });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

// Sync user from Supabase to our database
router.post('/sync-user', verifySupabaseToken, async (req: any, res) => {
  try {
    const supabaseUser = req.user;
    const { firstName, lastName } = req.body;
    
    // Check if user already exists
    let user = await storage.getUserByEmail(supabaseUser.email);
    
    if (!user) {
      // Create new user
      user = await storage.createUser({
        email: supabaseUser.email,
        firstName: firstName || supabaseUser.user_metadata?.first_name || '',
        lastName: lastName || supabaseUser.user_metadata?.last_name || '',
        onboardingCompleted: false,
      });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Sync user error:', error);
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

// Update user onboarding data
router.post('/complete-onboarding', verifySupabaseToken, async (req: any, res) => {
  try {
    const supabaseUser = req.user;
    const { career, goals, experienceLevel, notificationPreferences } = req.body;
    
    const user = await storage.getUserByEmail(supabaseUser.email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const updatedUser = await storage.updateUser(user.id, {
      primaryGoal: career,
      customGoals: goals,
      onboardingCompleted: true,
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Complete onboarding error:', error);
    res.status(500).json({ error: 'Failed to complete onboarding' });
  }
});

export default router;