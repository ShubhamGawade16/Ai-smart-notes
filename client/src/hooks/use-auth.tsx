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
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signOut: () => Promise<void>;
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

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      throw new Error('Authentication not configured');
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
        throw error;
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
      const { error } = await supabase.auth.signUp({
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
        toast({
          title: "Registration failed",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      toast({
        title: "Registration successful!",
        description: "Please check your email to verify your account.",
      });

      // Redirect to verification page
      setTimeout(() => {
        window.location.href = `/verify-email?email=${encodeURIComponent(email)}`;
      }, 1000);
      
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

  const value = {
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
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