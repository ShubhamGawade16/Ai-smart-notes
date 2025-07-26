import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Chrome, Brain, Zap, Target, Mail, Lock } from "lucide-react";

export default function Login() {
  const { login, loginWithEmail, isLoginPending, loginError } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    try {
      await loginWithEmail(email, password);
      toast({
        title: "Success!",
        description: "You have been signed in successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Sign In Failed",
        description: error.message || "Invalid email or password.",
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
          <CardContent className="space-y-6">
            {/* Email/Password Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12"
                />
              </div>
              
              <Button
                type="submit"
                disabled={isLoginPending}
                className="w-full h-12 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
              >
                {isLoginPending ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            {/* Google OAuth Button */}
            <Button
              onClick={handleGoogleLogin}
              disabled={isLoginPending}
              variant="outline"
              className="w-full h-12 font-medium"
            >
              {isLoginPending ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900" />
              ) : (
                <>
                  <Chrome className="w-5 h-5 mr-2" />
                  Continue with Google
                </>
              )}
            </Button>
            
            {loginError && (
              <p className="text-sm text-red-600 text-center">{loginError}</p>
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