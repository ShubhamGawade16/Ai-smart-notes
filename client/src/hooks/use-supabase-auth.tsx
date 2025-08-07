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
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Sync user data from our backend when Supabase user changes
  const syncUserData = async (supabaseUser: User | null) => {
    if (!supabaseUser) {
      setUser(null);
      return;
    }

    try {
      // Get user data from our backend API
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${(await supabase?.auth.getSession())?.data.session?.access_token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // User exists in Supabase but not in our backend - create them
        const createResponse = await fetch('/api/auth/sync-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase?.auth.getSession())?.data.session?.access_token}`
          },
          body: JSON.stringify({
            id: supabaseUser.id,
            email: supabaseUser.email,
            firstName: supabaseUser.user_metadata?.first_name || '',
            lastName: supabaseUser.user_metadata?.last_name || '',
          })
        });

        if (createResponse.ok) {
          const newUser = await createResponse.json();
          setUser(newUser);
        }
      }
    } catch (error) {
      console.error('Error syncing user data:', error);
    }
  };

  useEffect(() => {
    if (!supabase) {
      return;
    }

    // Get initial session
    const initializeAuth = async () => {
      try {
        const session = await getSession();
        if (session?.user) {
          setSupabaseUser(session.user);
          await syncUserData(session.user);
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
      }
    });

    return () => {
      subscription.unsubscribe();
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

      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);

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
      }, 500);

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
    if (!supabase) return;

    try {
      await signOut();
      setUser(null);
      setSupabaseUser(null);
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      
      // Redirect to landing page
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    } catch (error) {
      console.error('Logout error:', error);
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

