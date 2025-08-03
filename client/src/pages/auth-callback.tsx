import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Processing auth callback...');
        
        if (!supabase) {
          throw new Error('Supabase not configured');
        }

        // Get the session from the URL hash
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          toast({
            title: "Authentication failed",
            description: error.message,
            variant: "destructive",
          });
          setLocation('/auth');
          return;
        }

        if (data.session) {
          console.log('Auth successful, session:', data.session);
          
          // Store the access token for API requests
          if (data.session.access_token) {
            localStorage.setItem('auth_token', data.session.access_token);
          }
          
          toast({
            title: "Welcome!",
            description: "You have been successfully signed in.",
          });
          
          // Redirect to dashboard
          setLocation('/dashboard');
        } else {
          console.log('No session found in callback');
          setLocation('/auth');
        }
      } catch (error) {
        console.error('Auth callback processing error:', error);
        toast({
          title: "Authentication Error",
          description: "Something went wrong during sign-in.",
          variant: "destructive",
        });
        setLocation('/auth');
      }
    };

    handleAuthCallback();
  }, [setLocation, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-teal-600" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Completing sign-in...
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Please wait while we process your authentication.
        </p>
      </div>
    </div>
  );
}