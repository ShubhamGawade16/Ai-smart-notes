import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Clock, RefreshCw, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth-simple";

export default function VerifyEmailPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { user, resendConfirmation } = useAuth();
  const [countdown, setCountdown] = useState(45);
  const [showResend, setShowResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);

  useEffect(() => {
    // Redirect if user is already verified
    if (user?.email_confirmed_at) {
      window.location.href = '/dashboard';
      return;
    }

    // Auto-check verification status every 3 seconds
    const checkInterval = setInterval(() => {
      if (user?.email_confirmed_at) {
        clearInterval(checkInterval);
        window.location.href = '/dashboard';
        return;
      }
      
      setCheckingVerification(true);
      // Add a small delay to show checking state
      setTimeout(() => setCheckingVerification(false), 500);
    }, 3000);

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setShowResend(true);
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(checkInterval);
      clearInterval(countdownInterval);
    };
  }, [user]);

  const handleResendEmail = async () => {
    if (!user?.email) return;
    
    setIsResending(true);
    try {
      await resendConfirmation(user.email);
      
      // Reset countdown
      setCountdown(45);
      setShowResend(false);
      
      // Restart countdown timer
      const newCountdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setShowResend(true);
            clearInterval(newCountdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (error) {
      toast({
        title: "Failed to Resend",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg">
        <CardHeader className="text-center space-y-4 pb-6">
          {/* Back Button */}
          <div className="flex justify-start mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/auth')}
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Sign In
            </Button>
          </div>
          
          <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-blue-600 rounded-full flex items-center justify-center mx-auto">
            <Mail className="w-10 h-10 text-white" />
          </div>
          
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Verify Your Email
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-400">
              We've sent a verification link to your email address
            </p>
          </div>

          <Badge variant="outline" className="text-sm px-4 py-2">
            {user?.email}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Status Indicator */}
          <div className="flex items-center justify-center space-x-3">
            {checkingVerification ? (
              <>
                <RefreshCw className="w-5 h-5 text-teal-600 animate-spin" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Checking verification status...
                </span>
              </>
            ) : (
              <>
                <Clock className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Waiting for email verification
                </span>
              </>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-blue-900 dark:text-blue-200 flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              What to do next:
            </h4>
            <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-2 ml-6">
              <li>1. Check your email inbox for a verification message</li>
              <li>2. Look in your spam/junk folder if not found</li>
              <li>3. Click the verification link in the email</li>
              <li>4. You'll be automatically redirected to Planify</li>
            </ol>
          </div>

          {/* Resend Section */}
          <div className="text-center space-y-4">
            {!showResend ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Didn't receive the email?
                </p>
                <div className="flex items-center justify-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-mono text-gray-500">
                    Resend available in {formatTime(countdown)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-center space-x-2 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Still haven't received the email?</span>
                </div>
                
                <Button
                  onClick={handleResendEmail}
                  disabled={isResending}
                  className="w-full bg-teal-600 hover:bg-teal-700"
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Resend Verification Email
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Additional Help */}
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Having trouble? Contact support at support@planify.com
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}