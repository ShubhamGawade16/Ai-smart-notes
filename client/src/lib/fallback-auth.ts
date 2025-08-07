// Fallback authentication system for when Supabase is not available
import { apiRequest } from "@/lib/queryClient";

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  emailVerified?: boolean;
}

export class FallbackAuth {
  private static instance: FallbackAuth;
  private user: AuthUser | null = null;
  private listeners: Array<(user: AuthUser | null) => void> = [];

  static getInstance(): FallbackAuth {
    if (!FallbackAuth.instance) {
      FallbackAuth.instance = new FallbackAuth();
    }
    return FallbackAuth.instance;
  }

  constructor() {
    // Try to restore user from localStorage
    this.restoreUser();
  }

  private restoreUser() {
    try {
      const stored = localStorage.getItem('fallback_auth_user');
      if (stored) {
        this.user = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to restore user from localStorage:', error);
    }
  }

  private saveUser() {
    try {
      if (this.user) {
        localStorage.setItem('fallback_auth_user', JSON.stringify(this.user));
        // Also save a simple auth token for API requests
        localStorage.setItem('auth_token', `fallback_${this.user.id}`);
      } else {
        localStorage.removeItem('fallback_auth_user');
        localStorage.removeItem('auth_token');
      }
    } catch (error) {
      console.error('Failed to save user to localStorage:', error);
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.user));
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    this.listeners.push(callback);
    // Immediately call with current state
    callback(this.user);
    
    return {
      unsubscribe: () => {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
          this.listeners.splice(index, 1);
        }
      }
    };
  }

  async signUp(email: string, password: string, firstName: string, lastName: string): Promise<AuthUser> {
    try {
      const response = await apiRequest("POST", "/api/auth/fallback-signup", {
        email,
        password,
        firstName,
        lastName
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Sign up failed');
      }

      // Create user object
      const user: AuthUser = {
        id: result.id || `fallback_${Date.now()}`,
        email,
        firstName,
        lastName,
        emailVerified: true
      };

      this.user = user;
      this.saveUser();
      this.notifyListeners();

      return user;
    } catch (error: any) {
      console.error('Fallback signup error:', error);
      throw new Error(error.message || 'Sign up failed. Please try again.');
    }
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      const response = await apiRequest("POST", "/api/auth/fallback-signin", {
        email,
        password
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Sign in failed');
      }

      // Create user object
      const user: AuthUser = {
        id: result.id || `fallback_${Date.now()}`,
        email,
        firstName: result.firstName,
        lastName: result.lastName,
        emailVerified: result.emailVerified !== false
      };

      this.user = user;
      this.saveUser();
      this.notifyListeners();

      return user;
    } catch (error: any) {
      console.error('Fallback signin error:', error);
      throw new Error(error.message || 'Sign in failed. Please check your credentials.');
    }
  }

  async signOut(): Promise<void> {
    try {
      // Attempt to notify server
      try {
        await apiRequest("POST", "/api/auth/signout");
      } catch (error) {
        console.warn('Server signout failed, continuing with local signout:', error);
      }

      this.user = null;
      this.saveUser();
      this.notifyListeners();
    } catch (error) {
      console.error('Fallback signout error:', error);
      throw new Error('Sign out failed. Please try again.');
    }
  }

  getCurrentUser(): AuthUser | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return this.user !== null;
  }
}