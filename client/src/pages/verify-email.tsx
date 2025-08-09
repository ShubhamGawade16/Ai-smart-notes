import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, CheckCircle, AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function VerifyEmailPage() {
  const [, navigate] = useLocation();
  const [verificationStatus, setVerificationStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        // Get the current URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        const type = urlParams.get('type');

        if (type === 'signup' && accessToken) {
          // Email verification successful
          setVerificationStatus("success");
          
          // Set the session with the tokens
          if (supabase) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });
          }

          // Redirect to onboarding after a short delay
          setTimeout(() => {
            navigate("/onboarding");
          }, 2000);
        } else {
          setVerificationStatus("error");
          setErrorMessage("Invalid verification link or expired token.");
        }
      } catch (error: any) {
        console.error('Email verification error:', error);
        setVerificationStatus("error");
        setErrorMessage(error.message || "Failed to verify email. Please try again.");
      }
    };

    handleEmailVerification();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navigation */}
      <div className="p-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </div>
      
      <div className="container mx-auto px-6 pb-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Planify</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
            Email Verification
          </p>
        </div>

        {/* Verification Status */}
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {verificationStatus === "verifying" && <Loader2 className="w-5 h-5 animate-spin text-teal-600" />}
                {verificationStatus === "success" && <CheckCircle className="w-5 h-5 text-green-600" />}
                {verificationStatus === "error" && <AlertCircle className="w-5 h-5 text-red-600" />}
                <span>
                  {verificationStatus === "verifying" && "Verifying Email..."}
                  {verificationStatus === "success" && "Email Verified!"}
                  {verificationStatus === "error" && "Verification Failed"}
                </span>
              </CardTitle>
              <CardDescription>
                {verificationStatus === "verifying" && "Please wait while we verify your email address."}
                {verificationStatus === "success" && "Your email has been successfully verified. You'll be redirected to complete your profile setup."}
                {verificationStatus === "error" && "There was an issue verifying your email address."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {verificationStatus === "success" && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Welcome to Planify! Redirecting you to complete your profile setup...
                  </AlertDescription>
                </Alert>
              )}
              
              {verificationStatus === "error" && (
                <div className="space-y-4">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {errorMessage}
                    </AlertDescription>
                  </Alert>
                  <div className="flex space-x-3">
                    <Button 
                      onClick={() => navigate("/auth")}
                      className="bg-teal-600 hover:bg-teal-700"
                    >
                      Try Again
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => navigate("/")}
                    >
                      Go Home
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}