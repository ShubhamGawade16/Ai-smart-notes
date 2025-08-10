import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase, signInWithEmail, signUpWithEmail, signOut, getSession, onAuthStateChange } from "@/lib/supabase";
import { FallbackAuth, type AuthUser } from "@/lib/fallback-auth";
import { safeRedirect, getRedirectDelay } from "@/lib/redirect-helper";
import type { User } from "@supabase/supabase-js";

type AppUser = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  onboardingCompleted?: boolean;
  career?: string;
  goals?: string[];
  experienceLevel?: string;
  notificationPreferences?: any;
};

type AuthContextType = {
  user: AppUser | null;
  supabaseUser: User | null;
  isAuthenticated: boolean;
  signup: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  // Remove loading state - authentication is now instant
  const { toast } = useToast();

  // Sync user data from our backend when Supabase user changes
  const syncUserData = async (supabaseUser: User | null, isNewSignIn: boolean = false) => {
    console.log('🔄 syncUserData called with user:', supabaseUser?.email, 'isNewSignIn:', isNewSignIn);
    
    if (!supabaseUser) {
      console.log('❌ No supabase user, clearing data');
      setUser(null);
      localStorage.removeItem('auth_token');
      return { redirectTo: null };
    }

    try {
      // Store token for API requests first
      const session = (await supabase?.auth.getSession())?.data.session;
      if (session?.access_token) {
        localStorage.setItem('auth_token', session.access_token);
        console.log('✅ Stored auth token');
      }

      // Check if user exists in our database
      console.log('📡 Checking if user exists in our database...');
      const response = await fetch('/api/supabase-auth/me', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (response.ok) {
        const dbUser = await response.json();
        console.log('✅ Found existing user in database:', dbUser);
        
        const userData = {
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.firstName || '',
          lastName: dbUser.lastName || '',
          onboardingCompleted: dbUser.onboardingCompleted || false,
        };
        
        setUser(userData);
        
        // If user hasn't completed onboarding, redirect to onboarding
        if (!dbUser.onboardingCompleted) {
          console.log('🔄 User needs onboarding, will redirect to onboarding page');
          return { redirectTo: '/onboarding' };
        }
        
        return { redirectTo: '/dashboard' };
      } else if (response.status === 404) {
        // User doesn't exist in our database - this is a new Google user
        console.log('🆕 New Google user detected, creating basic profile...');
        
        const userData = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          firstName: supabaseUser.user_metadata?.first_name || supabaseUser.user_metadata?.name?.split(' ')[0] || '',
          lastName: supabaseUser.user_metadata?.last_name || supabaseUser.user_metadata?.name?.split(' ').slice(1).join(' ') || '',
          onboardingCompleted: false,
        };
        
        console.log('✅ Setting new user data:', userData);
        setUser(userData);
        
        // Show a welcome toast for new users
        toast({
          title: "Welcome to Planify!",
          description: "Let's complete your profile setup to unlock AI-powered task management.",
        });
        
        // Always redirect new Google users to onboarding
        return { redirectTo: '/onboarding' };
      } else {
        // API error - treat as existing user but redirect to dashboard
        console.log('⚠️ API error checking user, assuming existing user');
        
        const fallbackUserData = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          firstName: supabaseUser.user_metadata?.first_name || '',
          lastName: supabaseUser.user_metadata?.last_name || '',
          onboardingCompleted: true,
        };
        
        setUser(fallbackUserData);
        return { redirectTo: '/dashboard' };
      }
      
    } catch (error) {
      console.error('Error in syncUserData:', error);
      
      // Fallback: set basic user data from Supabase
      const fallbackUserData = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        firstName: supabaseUser.user_metadata?.first_name || '',
        lastName: supabaseUser.user_metadata?.last_name || '',
        onboardingCompleted: false,
      };
      console.log('✅ Using fallback user data:', fallbackUserData);
      setUser(fallbackUserData);
      
      // If there's an error, still redirect to onboarding to be safe
      return { redirectTo: '/onboarding' };
    }
  };

  useEffect(() => {
    // Initialize fallback auth first
    const fallbackAuth = FallbackAuth.getInstance();
    
    // Check for existing fallback user
    const existingFallbackUser = fallbackAuth.getCurrentUser();
    if (existingFallbackUser) {
      const userData = {
        id: existingFallbackUser.id,
        email: existingFallbackUser.email,
        firstName: existingFallbackUser.firstName,
        lastName: existingFallbackUser.lastName,
        onboardingCompleted: true,
      };
      // Ensure auth token is set for fallback user
      localStorage.setItem('auth_token', `fallback_${existingFallbackUser.id}`);
      setUser(userData);
      return;
    }

    // Only create demo user if user hasn't explicitly logged out
    const hasLoggedOut = localStorage.getItem('user_logged_out');
    if (!localStorage.getItem('auth_token') && !supabase && !hasLoggedOut) {
      console.log('🔧 Creating temporary demo user for testing');
      const demoUser = {
        id: 'demo-user',
        email: 'demo@example.com',
        firstName: 'Demo',
        lastName: 'User',
        onboardingCompleted: true,
      };
      localStorage.setItem('auth_token', 'fallback_demo-user');
      setUser(demoUser);
      return;
    }

    if (!supabase) {
      return;
    }

    // Get initial session
    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing auth...');
        const session = await getSession();
        console.log('📡 Got session:', { hasUser: !!session?.user, email: session?.user?.email });
        
        if (session?.user) {
          // Store access token immediately for API requests
          if (session.access_token) {
            localStorage.setItem('auth_token', session.access_token);
            console.log('✅ Stored auth token for API requests');
          }
          setSupabaseUser(session.user);
          console.log('🔄 About to sync user data...');
          await syncUserData(session.user, false);
        } else {
          console.log('❌ No initial session found');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (session?.user) {
        // Store access token for API requests
        if (session.access_token) {
          localStorage.setItem('auth_token', session.access_token);
          console.log('✅ Updated auth token for API requests');
        }
        setSupabaseUser(session.user);
        console.log('🔄 Auth state change - about to sync user data...');
        
        // Call syncUserData with proper redirect handling
        try {
          const syncResult = await syncUserData(session.user, event === 'SIGNED_IN');
          console.log('✅ syncUserData completed successfully, redirect to:', syncResult?.redirectTo);
          
          // Handle redirect after auth state change
          if (event === 'SIGNED_IN' && syncResult?.redirectTo) {
            const currentPath = window.location.pathname;
            console.log('🔄 SIGNED_IN event on path:', currentPath, 'redirecting to:', syncResult.redirectTo);
            
            // Redirect from auth pages and also from verification pages
            if (currentPath === '/auth' || currentPath === '/auth/callback' || currentPath === '/auth/verified' || currentPath === '/verify-email') {
              // For deployed environments (.replit.app/.replit.co), use longer delay and location.href
              const isDeployedEnv = window.location.hostname.includes('.replit.app') || window.location.hostname.includes('.replit.co');
              const delay = isDeployedEnv ? 2000 : 100; // Longer delay for production
              
              setTimeout(() => {
                console.log('🚀 Executing auth state redirect to:', syncResult.redirectTo);
                if (isDeployedEnv) {
                  // For production, use location.href to ensure proper navigation
                  window.location.href = syncResult.redirectTo;
                } else {
                  window.location.replace(syncResult.redirectTo);
                }
              }, delay);
            }
          }
        } catch (error) {
          console.error('❌ syncUserData failed:', error);
          
          // On error, show message and redirect to onboarding to be safe
          if (event === 'SIGNED_IN') {
            const currentPath = window.location.pathname;
            if (currentPath === '/auth' || currentPath === '/auth/callback' || currentPath === '/auth/verified' || currentPath === '/verify-email') {
              toast({
                title: "Setting up your account...",
                description: "We'll help you complete your profile setup.",
              });
              
              setTimeout(() => {
                window.location.href = '/onboarding';
              }, 1500);
            }
          }
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('🚪 User signed out, clearing data');
        setSupabaseUser(null);
        setUser(null);
        localStorage.removeItem('auth_token');
      } else {
        console.log('⚠️ Auth state change without user, event:', event);
        // Don't clear user data on other events like TOKEN_REFRESHED
      }
    });

    // Set up fallback auth listener
    const fallbackUnsubscribe = fallbackAuth.onAuthStateChange((fallbackUser) => {
      if (fallbackUser) {
        const userData = {
          id: fallbackUser.id,
          email: fallbackUser.email,
          firstName: fallbackUser.firstName,
          lastName: fallbackUser.lastName,
          onboardingCompleted: true,
        };
        setUser(userData);
      }
    });

    return () => {
      subscription.unsubscribe();
      fallbackUnsubscribe.unsubscribe();
    };
  }, []);

  const signup = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      
      // Try Supabase first
      if (supabase) {
        try {
          const data = await signUpWithEmail(email, password, firstName, lastName);
          
          if (data) {
            toast({
              title: "Registration successful!",
              description: "You can now sign in with your credentials.",
            });

            // Stay on auth page so user can sign in immediately
            return;
          }
        } catch (supabaseError: any) {
          console.error('Supabase signup failed, trying fallback:', supabaseError);
          
          // If it's not a network error, throw it
          if (!supabaseError.message.includes('Network connection') && 
              !supabaseError.message.includes('fetch') &&
              supabaseError.name !== 'AuthRetryableFetchError') {
            throw supabaseError;
          }
        }
      }
      
      // Fallback to custom auth
      console.log('Using fallback authentication for signup');
      const fallbackAuth = FallbackAuth.getInstance();
      const fallbackUser = await fallbackAuth.signUp(email, password, firstName, lastName);
      
      // Convert to our user format
      const userData = {
        id: fallbackUser.id,
        email: fallbackUser.email,
        firstName: fallbackUser.firstName,
        lastName: fallbackUser.lastName,
        onboardingCompleted: false,
      };
      
      setUser(userData);
      
      toast({
        title: "Registration successful!",
        description: "Welcome to Planify! You can start using the app right away.",
      });

      // Redirect to dashboard immediately
      safeRedirect('/dashboard', getRedirectDelay());

    } catch (error: any) {
      console.error('All signup methods failed:', error);
      toast({
        title: "Registration failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      
      // Try Supabase first
      if (supabase) {
        try {
          const data = await signInWithEmail(email, password);
          
          if (data) {
            toast({
              title: "Login successful!",
              description: "Welcome back to Planify!",
            });

            // Force navigation after successful login
            safeRedirect('/dashboard', getRedirectDelay());
            return;
          }
        } catch (supabaseError: any) {
          console.error('Supabase login failed, trying fallback:', supabaseError);
          
          // If it's not a network error, throw it
          if (!supabaseError.message.includes('Network connection') && 
              !supabaseError.message.includes('fetch') &&
              supabaseError.name !== 'AuthRetryableFetchError') {
            throw supabaseError;
          }
        }
      }
      
      // Fallback to custom auth
      console.log('Using fallback authentication for login');
      const fallbackAuth = FallbackAuth.getInstance();
      const fallbackUser = await fallbackAuth.signIn(email, password);
      
      // Convert to our user format
      const userData = {
        id: fallbackUser.id,
        email: fallbackUser.email,
        firstName: fallbackUser.firstName,
        lastName: fallbackUser.lastName,
        onboardingCompleted: true,
      };
      
      setUser(userData);
      
      toast({
        title: "Login successful!",
        description: "Welcome back to Planify!",
      });

      // Force navigation after successful login
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 100);

    } catch (error: any) {
      console.error('All login methods failed:', error);
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clear all user state first
      setUser(null);
      setSupabaseUser(null);
      
      // Clear ALL auth-related localStorage items
      localStorage.removeItem('auth_token');
      localStorage.removeItem('onboardingCompleted');
      localStorage.removeItem('userTier');
      localStorage.removeItem('fallback_auth_user');
      localStorage.removeItem('demo_user_created');
      
      // Mark that user has explicitly logged out
      localStorage.setItem('user_logged_out', 'true');
      
      // Try to logout from Supabase if available
      if (supabase) {
        try {
          await signOut();
        } catch (error) {
          console.error('Supabase logout error (non-critical):', error);
        }
      }
      
      // Clear fallback auth
      const fallbackAuth = FallbackAuth.getInstance();
      fallbackAuth.signOut();
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      
      // Force a complete page reload to ensure clean state
      setTimeout(() => {
        window.location.href = "/";
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Logout error:', error);
      // Still try to redirect even if logout partially fails
      setTimeout(() => {
        window.location.href = "/";
        window.location.reload();
      }, 500);
    }
  };

  const value: AuthContextType = {
    user,
    supabaseUser,
    isAuthenticated: !!user && !!supabaseUser,
    signup,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

