import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Chrome, Brain, Zap, Target } from "lucide-react";

export default function Login() {
  const { login, isLoginPending, loginError } = useAuth();
  const { toast } = useToast();

  const handleGoogleLogin = async () => {
    try {
      await login();
      toast({
        title: "Redirecting...",
        description: "Taking you to Google to sign in.",
      });
    } catch (error: any) {
      console.error('Login error:', error)
      toast({
        title: "Authentication Error",
        description: error.message || "Please configure Google OAuth in Supabase first.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and branding */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            AI Smart Notes
          </h1>
          <p className="text-muted-foreground">
            Intelligent task management with AI insights
          </p>
        </div>

        {/* Login card */}
        <Card className="border-2 border-primary/10 shadow-xl">
          <CardHeader className="text-center space-y-2">
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>
              Sign in to access your AI-powered productivity dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleGoogleLogin}
              disabled={isLoginPending}
              className="w-full h-12 text-base font-medium bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              variant="outline"
            >
              {isLoginPending ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mr-3" />
              ) : (
                <Chrome className="w-5 h-5 mr-3 text-blue-500" />
              )}
              Continue with Google
            </Button>

            {loginError && (
              <div className="text-sm text-destructive text-center p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                {loginError}
              </div>
            )}

            <div className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/register" className="text-primary hover:underline font-medium">
                Sign up for free
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-2">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">AI Insights</p>
          </div>
          <div className="space-y-2">
            <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
              <Target className="w-5 h-5 text-secondary" />
            </div>
            <p className="text-xs text-muted-foreground">Smart Goals</p>
          </div>
          <div className="space-y-2">
            <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
              <Brain className="w-5 h-5 text-accent" />
            </div>
            <p className="text-xs text-muted-foreground">Auto Organize</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>Secure authentication powered by Google</p>
        </div>
      </div>
    </div>
  );
}