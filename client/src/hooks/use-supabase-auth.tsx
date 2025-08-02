import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase, signInWithEmail, signUpWithEmail, signOut, getSession, onAuthStateChange } from "@/lib/supabase";
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

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
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
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      setIsLoading(true);
      const data = await signUpWithEmail(email, password, firstName, lastName);
      
      if (!data) throw new Error('Failed to create account');

      toast({
        title: "Registration successful!",
        description: "Please check your email to verify your account.",
      });

      // Redirect to verification page
      setTimeout(() => {
        window.location.href = `/verify-email?email=${encodeURIComponent(email)}`;
      }, 1000);

    } catch (error: any) {
      console.error('Signup error:', error);
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
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      setIsLoading(true);
      const data = await signInWithEmail(email, password);
      
      if (!data) throw new Error('Failed to sign in');

      toast({
        title: "Login successful!",
        description: "Welcome back to Planify!",
      });

    } catch (error: any) {
      console.error('Login error:', error);
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
      
      window.location.href = "/";
    } catch (error: any) {
      console.error('Logout error:', error);
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const value = {
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

export function useSupabaseAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useSupabaseAuth must be used within a SupabaseAuthProvider");
  }
  return context;
}