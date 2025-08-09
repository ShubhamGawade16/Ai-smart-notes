/**
 * Robust authentication callback handler for deployed environments
 * Handles the differences between preview and production Supabase auth flows
 */

import { supabase } from './supabase';

export interface CallbackResult {
  success: boolean;
  session?: any;
  error?: string;
  shouldRedirect: boolean;
  redirectUrl?: string;
}

export class AuthCallbackHandler {
  private static instance: AuthCallbackHandler;
  private maxRetries = 8;
  private baseDelay = 300;

  static getInstance(): AuthCallbackHandler {
    if (!AuthCallbackHandler.instance) {
      AuthCallbackHandler.instance = new AuthCallbackHandler();
    }
    return AuthCallbackHandler.instance;
  }

  async handleCallback(): Promise<CallbackResult> {
    console.log('🔄 Starting auth callback handling');
    console.log('URL:', window.location.href);
    console.log('Search params:', window.location.search);
    console.log('Hash:', window.location.hash);

    if (!supabase) {
      return {
        success: false,
        error: 'Supabase not configured',
        shouldRedirect: true,
        redirectUrl: '/auth?error=config_error'
      };
    }

    // Try multiple strategies for session detection
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      console.log(`🔍 Callback attempt ${attempt + 1}/${this.maxRetries}`);
      
      const result = await this.tryGetSession(attempt);
      
      if (result.success && result.session) {
        console.log('✅ Session found successfully');
        return {
          success: true,
          session: result.session,
          shouldRedirect: true,
          redirectUrl: '/dashboard'
        };
      }

      if (result.error && !result.retryable) {
        console.log('❌ Non-retryable error:', result.error);
        return {
          success: false,
          error: result.error,
          shouldRedirect: true,
          redirectUrl: '/auth?error=callback_failed'
        };
      }

      // Wait before next attempt with exponential backoff
      const delay = this.baseDelay * Math.pow(1.5, attempt);
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    console.log('🔴 Max retries reached without success');
    return {
      success: false,
      error: 'Session timeout',
      shouldRedirect: true,
      redirectUrl: '/auth?error=session_timeout'
    };
  }

  private async tryGetSession(attempt: number): Promise<{ success: boolean; session?: any; error?: string; retryable?: boolean }> {
    try {
      // Strategy 1: Direct session check (works most of the time)
      const { data, error } = await supabase!.auth.getSession();
      
      if (error) {
        console.log(`Session error on attempt ${attempt + 1}:`, error.message);
        return { success: false, error: error.message, retryable: true };
      }

      if (data?.session) {
        console.log('✅ Session found via getSession');
        // Store token immediately
        localStorage.setItem('auth_token', data.session.access_token);
        return { success: true, session: data.session };
      }

      // Strategy 2: Check if we have URL parameters that need processing
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      const hasAuthParams = urlParams.has('code') || hashParams.has('access_token') || hashParams.has('refresh_token');
      
      if (hasAuthParams && attempt < 3) {
        console.log('🔄 Auth parameters detected, waiting for processing...');
        return { success: false, retryable: true };
      }

      // Strategy 3: Force refresh session for deployed environments
      if (attempt >= 3) {
        console.log('🔄 Attempting session refresh...');
        const { data: refreshData, error: refreshError } = await supabase!.auth.refreshSession();
        
        if (!refreshError && refreshData?.session) {
          console.log('✅ Session found via refresh');
          localStorage.setItem('auth_token', refreshData.session.access_token);
          return { success: true, session: refreshData.session };
        }
      }

      console.log(`No session found on attempt ${attempt + 1}`);
      return { success: false, retryable: true };

    } catch (error: any) {
      console.error(`Error on attempt ${attempt + 1}:`, error);
      return { success: false, error: error.message, retryable: true };
    }
  }

  /**
   * Perform immediate redirect for deployed environments
   */
  performRedirect(url: string) {
    console.log(`🚀 Redirecting to: ${url}`);
    
    // Use replace to avoid back button issues
    window.location.replace(url);
  }
}