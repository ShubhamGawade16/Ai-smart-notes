import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export default function AuthCallbackPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        if (!supabase) {
          console.error('Supabase not configured');
          navigate("/auth?error=config_error");
          return;
        }

        // Handle the auth callback - this processes the email verification
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth callback error:", error);
          toast({
            title: "Verification Failed",
            description: "There was an issue verifying your email. Please try again.",
            variant: "destructive",
          });
          navigate("/auth");
          return;
        }

        if (data.session?.user) {
          // Store auth token
          if (data.session.access_token) {
            localStorage.setItem('auth_token', data.session.access_token);
          }
          
          console.log('Email verified successfully, redirecting to dashboard...');
          toast({
            title: "Email Verified!",
            description: "Welcome to Planify! Redirecting to your dashboard...",
          });
          
          // Clear verification email from storage
          localStorage.removeItem('verification_email');
          
          // Redirect to dashboard after successful verification
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1000);
        } else {
          // No session found, redirect to auth page
          console.log('No session found, redirecting to auth');
          navigate("/auth");
        }
      } catch (error) {
        console.error("Auth callback processing error:", error);
        toast({
          title: "Verification Error",
          description: "An unexpected error occurred during email verification.",
          variant: "destructive",
        });
        navigate("/auth");
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Verifying your email...
        </h2>
        <p className="text-gray-600">
          Please wait while we complete your email verification.
        </p>
      </div>
    </div>
  );
}