import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AuthVerifiedPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");

  useEffect(() => {
    const handleVerification = () => {
      try {
        // Check URL parameters for verification tokens
        const urlParams = new URLSearchParams(window.location.search);
        const type = urlParams.get('type');
        const token = urlParams.get('token');
        
        if (type === 'signup' || token) {
          // Email verification successful
          setStatus("success");
          
          toast({
            title: "Email Verified!",
            description: "Your account is now verified. You can sign in.",
          });

          // Redirect to auth page after a short delay
          setTimeout(() => {
            navigate("/auth");
          }, 2000);
        } else {
          setStatus("error");
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus("error");
      }
    };

    handleVerification();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-6">
      <Card className="max-w-md w-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-xl">
        <CardContent className="p-8 text-center space-y-4">
          {status === "verifying" && (
            <>
              <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="w-8 h-8 text-teal-600 dark:text-teal-400 animate-spin" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Verifying Email...
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Please wait while we verify your email address.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Email Verified!
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Your account has been verified successfully. You can now sign in.
              </p>
              <div className="pt-4">
                <Button
                  onClick={() => navigate("/auth")}
                  className="w-full bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700"
                >
                  Sign In Now
                </Button>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Verification Failed
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                There was an issue verifying your email. The link may be invalid or expired.
              </p>
              <div className="space-y-3 pt-4">
                <Button
                  onClick={() => navigate("/auth")}
                  className="w-full bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700"
                >
                  Try Signing In
                </Button>
                <Button
                  onClick={() => navigate("/")}
                  variant="outline"
                  className="w-full border-gray-300 dark:border-gray-600"
                >
                  Back to Home
                </Button>
              </div>
            </>
          )}

          <div className="flex items-center justify-center space-x-2 pt-4">
            <div className="w-6 h-6 bg-gradient-to-br from-teal-600 to-blue-600 rounded-md flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">Planify</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}