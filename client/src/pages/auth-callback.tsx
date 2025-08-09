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

        // Handle the auth callback - process URL hash for OAuth
        console.log('🔍 Current URL:', window.location.href);
        console.log('🔍 Hash:', window.location.hash);
        console.log('🔍 Search:', window.location.search);
        
        // For Google OAuth, the tokens are in the URL hash
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          setAuthStatus("error");
          setErrorMessage(error.message || "Authentication failed. Please try again.");
          return;
        }

        if (data.session) {
          console.log('✅ Authentication successful via session');
          setAuthStatus("success");
          
          // Check if this is a new user or returning user
          const user = data.session.user;
          if (user) {
            // Store auth token for API requests
            localStorage.setItem('auth_token', data.session.access_token);
            
            // Show success message instead of auto-redirect
            // User can click the sign in button when ready
          }
        } else {
          // Check if there are OAuth tokens in the URL hash (Google OAuth)
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const tokenType = hashParams.get('token_type');
          
          console.log('🔍 Hash tokens:', { accessToken: !!accessToken, refreshToken: !!refreshToken, tokenType });
          
          if (accessToken) {
            console.log('✅ Found OAuth tokens in hash, setting session...');
            // Set the session from hash tokens
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });
            
            if (sessionError) {
              console.error('❌ Failed to set session:', sessionError);
              setAuthStatus("error");
              setErrorMessage(sessionError.message || "Failed to complete authentication");
            } else if (sessionData.session) {
              console.log('✅ Authentication successful via hash tokens');
              setAuthStatus("success");
              localStorage.setItem('auth_token', accessToken);
            } else {
              setAuthStatus("error");
              setErrorMessage("Failed to establish session");
            }
          } else {
            // No session found, might be an email verification link
            const urlParams = new URLSearchParams(window.location.search);
            const urlAccessToken = urlParams.get('access_token');
            const urlRefreshToken = urlParams.get('refresh_token');
            const type = urlParams.get('type');

            if (type === 'signup' && urlAccessToken && urlRefreshToken) {
              // This is an email verification, set the session
              await supabase.auth.setSession({
                access_token: urlAccessToken,
                refresh_token: urlRefreshToken,
              });
              setAuthStatus("success");
            } else {
              setAuthStatus("error");
              setErrorMessage("No valid authentication session found.");
            }
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
                  {authStatus === "success" && "Authentication Successful!"}
                  {authStatus === "error" && "Authentication Failed"}
                </span>
              </CardTitle>
              <CardDescription>
                {authStatus === "processing" && "Please wait while we complete your authentication."}
                {authStatus === "success" && "Sign in to your account to get started with Planify."}
                {authStatus === "error" && "There was an issue with your authentication."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {authStatus === "success" && (
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Authentication successful! You can now access your account.
                    </AlertDescription>
                  </Alert>
                  <Button
                    onClick={() => navigate("/dashboard")}
                    className="w-full bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700"
                  >
                    Sign In Now
                  </Button>
                </div>
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