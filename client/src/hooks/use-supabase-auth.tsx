import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase, signInWithEmail, signUpWithEmail, signOut, getSession, onAuthStateChange } from "@/lib/supabase";
import { FallbackAuth, type AuthUser } from "@/lib/fallback-auth";
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
  isLoading: boolean;
  isAuthenticated: boolean;
  signup: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Sync user data from our backend when Supabase user changes
  const syncUserData = async (supabaseUser: User | null) => {
    if (!supabaseUser) {
      setUser(null);
      localStorage.removeItem('auth_token');
      setIsLoading(false);
      return;
    }

    try {
      // Get and store the access token for API requests
      const session = (await supabase?.auth.getSession())?.data.session;
      const accessToken = session?.access_token;
      
      console.log('🔄 Syncing user data with token:', !!accessToken);
      
      if (!accessToken) {
        console.error('No access token available, skipping backend sync');
        // Create a basic user object from Supabase data
        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          firstName: supabaseUser.user_metadata?.first_name || '',
          lastName: supabaseUser.user_metadata?.last_name || '',
          onboardingCompleted: false,
        });
        setIsLoading(false);
        return;
      }
      
      localStorage.setItem('auth_token', accessToken);
      console.log('✅ Updated auth token for API requests');

      // For now, just create a user object from Supabase data to unblock the UI
      console.log('📡 Creating user from Supabase data...');
      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        firstName: supabaseUser.user_metadata?.first_name || '',
        lastName: supabaseUser.user_metadata?.last_name || '',
        onboardingCompleted: false,
      });
      
      console.log('✅ User authenticated and ready');
      
    } catch (error) {
      console.error('Error syncing user data:', error);
      // Still set a basic user to unblock the UI
      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        firstName: supabaseUser.user_metadata?.first_name || '',
        lastName: supabaseUser.user_metadata?.last_name || '',
        onboardingCompleted: false,
      });
    } finally {
      setIsLoading(false);
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
      setIsLoading(false);
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
      setIsLoading(false);
      return;
    }

    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // Get initial session
    const initializeAuth = async () => {
      try {
        const session = await getSession();
        if (session?.user) {
          // Store access token immediately for API requests
          if (session.access_token) {
            localStorage.setItem('auth_token', session.access_token);
            console.log('✅ Stored auth token for API requests');
          }
          setSupabaseUser(session.user);
          await syncUserData(session.user);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setIsLoading(false);
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
        await syncUserData(session.user);
        
        // Handle redirect after auth state change
        if (event === 'SIGNED_IN' && window.location.pathname === '/auth') {
          setTimeout(() => {
            window.location.href = '/onboarding';
          }, 500);
        }
      } else {
        setSupabaseUser(null);
        setUser(null);
        localStorage.removeItem('auth_token');
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
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      fallbackUnsubscribe.unsubscribe();
    };
  }, []);

  const signup = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      setIsLoading(true);
      
      // Try Supabase first
      if (supabase) {
        try {
          const data = await signUpWithEmail(email, password, firstName, lastName);
          
          if (data) {
            toast({
              title: "Registration successful!",
              description: "Please check your email to verify your account.",
            });

            // Redirect to verification page
            setTimeout(() => {
              window.location.href = `/verify-email?email=${encodeURIComponent(email)}`;
            }, 1000);
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
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 100);

    } catch (error: any) {
      console.error('All signup methods failed:', error);
      toast({
        title: "Registration failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
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
            setTimeout(() => {
              window.location.href = "/dashboard";
            }, 500);
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
    } finally {
      setIsLoading(false);
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
    isLoading,
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

