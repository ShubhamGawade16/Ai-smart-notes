import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, CheckCircle, AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const [, navigate] = useLocation();
  const [authStatus, setAuthStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        if (!supabase) {
          setAuthStatus("error");
          setErrorMessage("Authentication service not configured properly.");
          return;
        }

        // Handle the auth callback
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          setAuthStatus("error");
          setErrorMessage(error.message || "Authentication failed. Please try again.");
          return;
        }

        if (data.session) {
          console.log('✅ Authentication successful');
          setAuthStatus("success");
          
          // Check if this is a new user or returning user
          const user = data.session.user;
          if (user) {
            // Store auth token for API requests
            localStorage.setItem('auth_token', data.session.access_token);
            
            // For Google OAuth, redirect directly to dashboard
            // The auth context will handle user sync automatically
            navigate("/dashboard");
          }
        } else {
          // No session found, might be an email verification link
          const urlParams = new URLSearchParams(window.location.search);
          const accessToken = urlParams.get('access_token');
          const refreshToken = urlParams.get('refresh_token');
          const type = urlParams.get('type');

          if (type === 'signup' && accessToken && refreshToken) {
            // This is an email verification, set the session
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            setAuthStatus("success");
            navigate("/dashboard");
          } else {
            setAuthStatus("error");
            setErrorMessage("No valid authentication session found.");
          }
        }
      } catch (error: any) {
        console.error('Auth callback processing error:', error);
        setAuthStatus("error");
        setErrorMessage(error.message || "Failed to process authentication. Please try again.");
      }
    };

    handleAuthCallback();
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
            Completing Authentication
          </p>
        </div>

        {/* Authentication Status */}
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {authStatus === "processing" && <Loader2 className="w-5 h-5 animate-spin text-teal-600" />}
                {authStatus === "success" && <CheckCircle className="w-5 h-5 text-green-600" />}
                {authStatus === "error" && <AlertCircle className="w-5 h-5 text-red-600" />}
                <span>
                  {authStatus === "processing" && "Processing Authentication..."}
                  {authStatus === "success" && "Welcome to Planify!"}
                  {authStatus === "error" && "Authentication Failed"}
                </span>
              </CardTitle>
              <CardDescription>
                {authStatus === "processing" && "Please wait while we complete your authentication."}
                {authStatus === "success" && "You've been successfully authenticated. Setting up your account..."}
                {authStatus === "error" && "There was an issue with your authentication."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {authStatus === "success" && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Authentication successful! Redirecting you to your dashboard...
                  </AlertDescription>
                </Alert>
              )}
              
              {authStatus === "error" && (
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