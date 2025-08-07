import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ needsVerification: boolean }>;
  signOut: () => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function EmailAuthProvider({ children }: { children: ReactNode }) {
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
        if (session?.user) {
          // Check if email is verified
          if (session.user.email_confirmed_at) {
            // Store auth token for API requests
            if (session.access_token) {
              localStorage.setItem('auth_token', session.access_token);
            }
            
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              firstName: session.user.user_metadata?.first_name || '',
              lastName: session.user.user_metadata?.last_name || '',
              emailVerified: true,
            });
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
        
        if (session?.user) {
          // Only set user if email is verified
          if (session.user.email_confirmed_at) {
            // Store auth token
            if (session.access_token) {
              localStorage.setItem('auth_token', session.access_token);
            }
            
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              firstName: session.user.user_metadata?.first_name || '',
              lastName: session.user.user_metadata?.last_name || '',
              emailVerified: true,
            });

            // Show success message for email verification
            if (event === 'SIGNED_IN') {
              toast({
                title: "Email Verified!",
                description: "Welcome to Planify! Redirecting to your dashboard...",
              });
            }
          } else if (event === 'SIGNED_UP') {
            // User signed up but email not verified yet
            console.log('User signed up, waiting for email verification');
          }
        } else {
          // Clear token on logout
          localStorage.removeItem('auth_token');
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [toast]);

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
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage = "Please verify your email address before signing in.";
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

    // Get current host for proper redirect URL - always use the actual app URL
    const currentHost = window.location.origin;
    const redirectUrl = `${currentHost}/auth/callback`;
    console.log('Signup redirect URL:', redirectUrl);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
        emailRedirectTo: redirectUrl,
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
      return { needsVerification: true };
    }

    return { needsVerification: false };
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

  const resendVerification = async (email: string) => {
    if (!supabase) throw new Error('Supabase not configured');

    const currentHost = window.location.origin;
    const redirectUrl = `${currentHost}/auth/callback`;
    console.log('Resend redirect URL:', redirectUrl);

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: redirectUrl,
      },
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
      resendVerification,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useEmailAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useEmailAuth must be used within an EmailAuthProvider');
  }
  return context;
}