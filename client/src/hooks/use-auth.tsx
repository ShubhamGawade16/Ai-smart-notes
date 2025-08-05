import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

type User = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  onboardingCompleted?: boolean;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<any>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check initial session
    const checkInitialSession = async () => {
      try {
        if (!supabase) {
          setIsLoading(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Store the access token for API requests
          if (session.access_token) {
            localStorage.setItem('auth_token', session.access_token);
          }
          
          // Create user object from session
          const userData: User = {
            id: session.user.id,
            email: session.user.email || '',
            firstName: session.user.user_metadata?.first_name,
            lastName: session.user.user_metadata?.last_name,
            onboardingCompleted: true, // Skip onboarding for now
          };
          
          setUser(userData);
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkInitialSession();

    // Listen for auth changes
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event, session?.user?.email);
          
          if (session?.user) {
            // Store the access token for API requests
            if (session.access_token) {
              localStorage.setItem('auth_token', session.access_token);
              console.log('Stored auth token for API requests');
            }
            
            const userData: User = {
              id: session.user.id,
              email: session.user.email || '',
              firstName: session.user.user_metadata?.first_name,
              lastName: session.user.user_metadata?.last_name,
              onboardingCompleted: true, // Skip onboarding for now
            };
            
            setUser(userData);
            
            if (event === 'SIGNED_IN' && userData.email) {
              console.log('User signed in, redirecting to dashboard...');
            }
          } else {
            // Clear token and logout flag on logout
            localStorage.removeItem('auth_token');
            localStorage.removeItem('logout_in_progress');
            setUser(null);
          }
          setIsLoading(false);
        }
      );

      return () => subscription.unsubscribe();
    }
  }, []);

  const resendVerification = async (email: string) => {
    if (!supabase) {
      throw new Error('Authentication not configured');
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth-callback`
        }
      });

      if (error) {
        toast({
          title: "Failed to resend verification",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      toast({
        title: "Verification email sent!",
        description: "Please check your email for the verification link.",
      });
    } catch (error) {
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      throw new Error('Authentication not configured');
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Check if it's a user not found error
        if (error.message.includes('Invalid login credentials') || error.message.includes('User not found')) {
          toast({
            title: "Account not found",
            description: "Please create an account first.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Login failed",
            description: error.message,
            variant: "destructive",
          });
        }
        throw error;
      }

      // Check if email is confirmed
      if (data.user && !data.user.email_confirmed_at) {
        toast({
          title: "Email not verified",
          description: "Please check your email and verify your account first.",
          variant: "destructive",
        });
        throw new Error("Email not verified");
      }

      toast({
        title: "Welcome back!",
        description: "Successfully signed in to Planify.",
      });
      
      // The redirect will be handled by the auth state change listener
      
    } catch (error) {
      throw error;
    } finally {
      // Don't set isLoading to false here - let the auth state change handle it
    }
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    if (!supabase) {
      throw new Error('Authentication not configured');
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
          emailRedirectTo: `${window.location.origin}/auth-callback`
        },
      });

      if (error) {
        toast({
          title: "Registration failed",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      // Return verification status and email for the UI to handle
      return {
        needsVerification: !data.session,
        email: email,
        user: data.user
      };
      
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    if (!supabase) {
      throw new Error('Authentication not configured');
    }

    try {
      // Set logout flag to prevent API calls during logout
      localStorage.setItem('logout_in_progress', 'true');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          title: "Logout failed",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });

      // Force redirect to home
      window.location.href = '/';
    } catch (error) {
      // Clean up logout flag if there's an error
      localStorage.removeItem('logout_in_progress');
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    if (!supabase) {
      throw new Error('Authentication not configured');
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'openid email profile',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        toast({
          title: "Google Sign-In failed",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      // The redirect will be handled by OAuth flow
      
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const value = {
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    resendVerification,
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