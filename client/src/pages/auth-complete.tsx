import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AuthCompletePage() {
  const [isRedirecting, setIsRedirecting] = useState(true);
  const [authSuccess, setAuthSuccess] = useState(false);

  useEffect(() => {
    const handleAuthComplete = async () => {
      console.log('🔄 Auth complete page - checking authentication status');

      try {
        if (!supabase) {
          console.log('❌ Supabase not available');
          redirectToAuth();
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('🔍 Session check:', { session: !!session, error, user: session?.user?.email });

        if (error) {
          console.error('❌ Session error:', error);
          redirectToAuth();
          return;
        }

        if (session?.user) {
          console.log('✅ User authenticated, setting up redirect to dashboard');
          setAuthSuccess(true);
          
          // Give a moment for the UI to show success
          setTimeout(() => {
            console.log('🚀 Redirecting to dashboard');
            window.location.href = '/dashboard';
          }, 1500);
        } else {
          console.log('❌ No active session, redirecting to auth');
          redirectToAuth();
        }
      } catch (error) {
        console.error('❌ Auth complete error:', error);
        redirectToAuth();
      }
    };

    const redirectToAuth = () => {
      setTimeout(() => {
        window.location.href = '/auth?error=authentication_failed';
      }, 2000);
    };

    handleAuthComplete();
  }, []);

  const handleManualRedirect = () => {
    window.location.href = '/dashboard';
  };

  if (authSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="mb-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to Planify!
            </h1>
            <p className="text-gray-600">
              Authentication successful. Taking you to your dashboard...
            </p>
          </div>
          <Button 
            onClick={handleManualRedirect}
            className="w-full bg-teal-600 hover:bg-teal-700"
          >
            Continue to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mb-6">
          <Loader2 className="w-16 h-16 text-teal-600 mx-auto mb-4 animate-spin" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Completing Sign In...
          </h1>
          <p className="text-gray-600">
            {isRedirecting ? 'Verifying your authentication...' : 'Setting up your account...'}
          </p>
        </div>
      </Card>
    </div>
  );
}