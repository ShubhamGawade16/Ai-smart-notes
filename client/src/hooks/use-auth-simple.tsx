import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // Get initial session
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Store auth token
          if (session.access_token) {
            localStorage.setItem('auth_token', session.access_token);
          }
        }
      } catch (error) {
        console.error('Initial auth error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        setUser(session?.user ?? null);
        setIsLoading(false);
        
        if (session?.user) {
          // Store auth token
          if (session.access_token) {
            localStorage.setItem('auth_token', session.access_token);
            console.log('Stored auth token for API requests');
          }
          
          // Handle successful authentication events
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            console.log('User signed in, redirecting to dashboard...');
            
            // Add a small delay to ensure state is updated
            setTimeout(() => {
              window.location.href = '/dashboard';
            }, 500);
          }
        } else {
          // Clear token on logout
          localStorage.removeItem('auth_token');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase not configured');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      let errorMessage = error.message;
      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Email or password is incorrect. Please check and try again.";
      }
      
      toast({
        title: "Sign In Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }

    toast({
      title: "Welcome back!",
      description: "Redirecting to your dashboard...",
    });
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (error) {
      let errorMessage = error.message;
      if (error.message.includes("weak_password")) {
        errorMessage = "Password is too weak. Please use a stronger password with at least 8 characters, including letters and numbers.";
      } else if (error.message.includes("already_registered")) {
        errorMessage = "This email is already registered. Please try signing in instead.";
      }
      
      toast({
        title: "Sign Up Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }

    if (data.user && !data.user.email_confirmed_at) {
      toast({
        title: "Account Created!",
        description: "Please check your email to verify your account.",
      });
    }
  };

  const signOut = async () => {
    if (!supabase) return;

    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }

    toast({
      title: "Signed out successfully",
      description: "You have been logged out of your account.",
    });
  };

  const resendConfirmation = async (email: string) => {
    if (!supabase) throw new Error('Supabase not configured');

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });

    if (error) {
      toast({
        title: "Failed to resend",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }

    toast({
      title: "Verification email sent",
      description: "Please check your inbox and spam folder.",
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      signIn,
      signUp,
      signOut,
      resendConfirmation,
    }}>
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