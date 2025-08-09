import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { safeRedirect, getRedirectDelay, logEnvironmentInfo } from "@/lib/redirect-helper";

export default function AuthCallbackPage() {
  const [, navigate] = useLocation();
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 10;

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        if (!supabase) {
          navigate("/auth?error=config_error");
          return;
        }

        // Log environment info for debugging
        logEnvironmentInfo();
        console.log(`Auth callback attempt ${attempts + 1}/${maxAttempts}`);

        // Handle the OAuth callback - this processes URL fragments and establishes session
        let sessionData = null;
        let hasError = false;

        // Try exchangeCodeForSession first (for PKCE flow)
        try {
          const { data: authData, error: authError } = await supabase.auth.exchangeCodeForSession(window.location.search);
          if (authError) {
            console.log("exchangeCodeForSession failed:", authError.message);
            // This is expected for email verification, so continue to getSession
          } else if (authData?.session) {
            sessionData = authData;
          }
        } catch (e) {
          console.log("exchangeCodeForSession not available, trying getSession");
        }
        
        // Fallback to getSession (for email verification or if exchange failed)
        if (!sessionData?.session) {
          const { data: fallbackData, error: fallbackError } = await supabase.auth.getSession();
          if (fallbackError) {
            console.error("Auth callback error:", fallbackError);
            hasError = true;
          } else {
            sessionData = fallbackData;
          }
        }
        
        if (hasError) {
          navigate("/auth?error=oauth_failed");
          return;
        }

        if (sessionData?.session) {
          console.log("✅ Session found, redirecting to dashboard");
          // Store the session token immediately
          localStorage.setItem('auth_token', sessionData.session.access_token);
          
          // Use environment-aware redirect with appropriate delay
          safeRedirect("/dashboard", getRedirectDelay());
          return;
        }

        // If no session yet, retry with exponential backoff (common in deployed environments)
        if (attempts < maxAttempts - 1) {
          const delay = Math.min(1000 * Math.pow(1.5, attempts), 5000); // Max 5 second delay
          console.log(`No session found yet, retrying in ${delay}ms...`);
          
          setTimeout(() => {
            setAttempts(prev => prev + 1);
          }, delay);
          return;
        }

        // Max attempts reached, redirect to auth
        console.log("Max attempts reached, redirecting to auth");
        navigate("/auth?error=session_timeout");
        
      } catch (error) {
        console.error("Auth callback processing error:", error);
        navigate("/auth?error=callback_failed");
      }
    };

    handleAuthCallback();
  }, [navigate, attempts]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Completing your sign in...
        </h2>
        <p className="text-gray-600">
          Please wait while we set up your account.
        </p>
      </div>
    </div>
  );
}