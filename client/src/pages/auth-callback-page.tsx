import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { AuthCallbackHandler } from "@/lib/auth-callback-handler";
import { handleProductionAuthRedirect, forceProductionAuthCheck } from "@/lib/production-auth-fix";
import "@/lib/immediate-auth-redirect"; // Import for side effects

export default function AuthCallbackPage() {
  const [, navigate] = useLocation();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('🔄 Starting auth callback handling');
      
      // First, try production-specific quick redirect
      if (handleProductionAuthRedirect()) {
        console.log('✅ Production auth redirect handled');
        return;
      }
      
      // Check for existing authentication
      if (await forceProductionAuthCheck()) {
        console.log('✅ Existing auth found, redirected');
        return;
      }
      
      // Fall back to comprehensive handler
      const handler = AuthCallbackHandler.getInstance();
      
      try {
        const result = await handler.handleCallback();
        
        if (result.success && result.shouldRedirect && result.redirectUrl) {
          // Use direct window.location.replace for deployed environments
          handler.performRedirect(result.redirectUrl);
        } else if (result.shouldRedirect && result.redirectUrl) {
          // Fallback to wouter navigate for errors
          navigate(result.redirectUrl);
        }
      } catch (error) {
        console.error("Callback handler error:", error);
        navigate("/auth?error=callback_failed");
      } finally {
        setIsProcessing(false);
      }
    };

    handleAuthCallback();
  }, [navigate]);

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