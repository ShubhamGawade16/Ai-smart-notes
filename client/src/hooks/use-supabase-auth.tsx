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
  const syncUserData = async (supabaseUser: User | null) => {
    console.log('🔄 syncUserData called with user:', supabaseUser?.email);
    
    if (!supabaseUser) {
      console.log('❌ No supabase user, clearing data');
      setUser(null);
      localStorage.removeItem('auth_token');
      return;
    }

    try {
      console.log('📡 Creating user from Supabase data directly...');
      const userData = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        firstName: supabaseUser.user_metadata?.first_name || '',
        lastName: supabaseUser.user_metadata?.last_name || '',
        onboardingCompleted: false,
      };
      
      console.log('✅ Setting user data:', userData);
      setUser(userData);
      
      // Store token for API requests
      const session = (await supabase?.auth.getSession())?.data.session;
      if (session?.access_token) {
        localStorage.setItem('auth_token', session.access_token);
        console.log('✅ Stored auth token');
      }
      
      console.log('✅ User sync complete');
      
    } catch (error) {
      console.error('Error in syncUserData:', error);
      // Still set a basic user to unblock the UI
      const fallbackUserData = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        firstName: supabaseUser.user_metadata?.first_name || '',
        lastName: supabaseUser.user_metadata?.last_name || '',
        onboardingCompleted: false,
      };
      console.log('✅ Using fallback user data:', fallbackUserData);
      setUser(fallbackUserData);
    } finally {
      console.log('🔄 syncUserData complete');
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
          await syncUserData(session.user);
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
        
        // Call syncUserData
        try {
          await syncUserData(session.user);
          console.log('✅ syncUserData completed successfully');
        } catch (error) {
          console.error('❌ syncUserData failed:', error);
        }
        
        // Handle redirect after auth state change
        if (event === 'SIGNED_IN') {
          const currentPath = window.location.pathname;
          console.log('🔄 SIGNED_IN event on path:', currentPath);
          
          // For deployed environments, add extra delay and force redirect
          if (currentPath === '/auth' || currentPath === '/auth/callback') {
            console.log('✅ Redirecting to dashboard after sign in');
            
            // Force redirect using production-aware helper
            setTimeout(() => {
              console.log('🚀 Executing auth state redirect to dashboard');
              window.location.replace('/dashboard');
            }, 50);
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

