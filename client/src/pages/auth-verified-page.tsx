import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { CheckCircle, Mail, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-supabase-auth";

export default function AuthVerifiedPage() {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard immediately
    if (user) {
      console.log('✅ User already authenticated on verification page, redirecting to dashboard');
      window.location.href = '/dashboard';
      return;
    }

    const checkVerification = async () => {
      if (!supabase) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('Verification check:', { session, error, hasUser: !!user });
        
        if (session?.user) {
          // User has a valid session, redirect to dashboard
          console.log('✅ User has valid session, redirecting to dashboard');
          window.location.href = '/dashboard';
          return;
        }
        
        if (session?.user?.email_confirmed_at) {
          setIsVerified(true);
        }
      } catch (error) {
        console.error('Verification check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkVerification();
  }, [user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center">
        {isVerified ? (
          <>
            <div className="mb-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Email Verified!
              </h1>
              <p className="text-gray-600">
                Your email has been successfully verified. Welcome to Planify!
              </p>
            </div>
            <Button 
              onClick={() => window.location.href = '/dashboard'}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              Continue to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </>
        ) : (
          <>
            <div className="mb-6">
              <Mail className="w-16 h-16 text-teal-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Check Your Email
              </h1>
              <p className="text-gray-600">
                We've sent you a verification link. Please check your email and click the link to verify your account.
              </p>
            </div>
            <div className="space-y-3">
              <Link href="/auth?mode=login">
                <Button variant="outline" className="w-full">
                  Back to Sign In
                </Button>
              </Link>
              <p className="text-sm text-gray-500">
                Didn't receive the email? Check your spam folder or try signing up again.
              </p>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}