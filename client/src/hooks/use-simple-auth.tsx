import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified?: boolean;
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

export function SimpleAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already authenticated
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          // Verify token with backend
          const res = await apiRequest('GET', '/api/auth/me');
          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
          } else {
            // Token is invalid, remove it
            localStorage.removeItem('auth_token');
          }
        }
      } catch (error) {
        console.error('Initial auth check failed:', error);
        localStorage.removeItem('auth_token');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const res = await apiRequest('POST', '/api/auth/signin', {
        email,
        password,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Sign in failed');
      }

      const data = await res.json();
      localStorage.setItem('auth_token', data.token);
      setUser(data.user);

      toast({
        title: "Welcome back!",
        description: "Successfully signed in to your account.",
      });
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      let errorMessage = error.message;
      if (error.message.includes("Invalid email or password")) {
        errorMessage = "Email or password is incorrect. Please check and try again.";
      }
      
      toast({
        title: "Sign In Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      const res = await apiRequest('POST', '/api/auth/signup', {
        email,
        password,
        firstName,
        lastName,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Sign up failed');
      }

      const data = await res.json();
      localStorage.setItem('auth_token', data.token);
      setUser(data.user);

      toast({
        title: "Welcome to Planify!",
        description: "Your account has been created successfully.",
      });

      // For simple JWT auth, no email verification needed
      return { needsVerification: false };
    } catch (error: any) {
      console.error('Sign up error:', error);
      
      let errorMessage = error.message;
      if (error.message.includes("Email already registered")) {
        errorMessage = "This email is already registered. Please try signing in instead.";
      } else if (error.message.includes("weak_password")) {
        errorMessage = "Password is too weak. Please use a stronger password with at least 8 characters, including letters and numbers.";
      }
      
      toast({
        title: "Sign Up Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('auth_token');
      setUser(null);

      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const resendVerification = async (email: string) => {
    // For simple JWT auth, this is not needed, but we'll keep the interface
    toast({
      title: "No verification needed",
      description: "Your account is already active.",
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}