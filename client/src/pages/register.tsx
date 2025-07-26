import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Chrome, Brain, Zap, Target, Star, CheckCircle, Users, Crown } from "lucide-react";

export default function Register() {
  const { login, isLoginPending, loginError } = useAuth();
  const { toast } = useToast();

  const handleGoogleSignUp = async () => {
    try {
      await login();
      toast({
        title: "Redirecting...",
        description: "Taking you to Google to create your account.",
      });
    } catch (error) {
      toast({
        title: "Sign Up Failed",
        description: loginError || "Unable to sign up with Google.",
        variant: "destructive",
      });
    }
  };

  const tiers = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started",
      features: [
        "50 tasks per month",
        "25 notes per month", 
        "Basic AI insights",
        "Mobile app access"
      ],
      icon: Users,
      popular: false
    },
    {
      name: "Basic",
      price: "$9",
      period: "per month",
      description: "Great for personal productivity",
      features: [
        "500 tasks per month",
        "250 notes per month",
        "Advanced AI insights",
        "Smart categorization",
        "Priority support"
      ],
      icon: Star,
      popular: true
    },
    {
      name: "Pro",
      price: "$19",
      period: "per month", 
      description: "For power users and teams",
      features: [
        "Unlimited tasks & notes",
        "AI coaching & optimization",
        "Advanced analytics",
        "Team collaboration",
        "Custom integrations",
        "Priority support"
      ],
      icon: Crown,
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Join AI Smart Notes
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform your productivity with AI-powered task management and intelligent insights
          </p>
        </div>

        {/* Pricing tiers */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {tiers.map((tier, index) => (
            <Card 
              key={tier.name} 
              className={`relative border-2 transition-all hover:shadow-xl ${
                tier.popular 
                  ? 'border-primary shadow-lg scale-105' 
                  : 'border-primary/10 hover:border-primary/30'
              }`}
            >
              {tier.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center space-y-3">
                <div className="mx-auto w-12 h-12 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-full flex items-center justify-center">
                  <tier.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  <CardDescription className="mt-1">{tier.description}</CardDescription>
                </div>
                <div className="space-y-1">
                  <div className="text-4xl font-bold">{tier.price}</div>
                  <div className="text-sm text-muted-foreground">{tier.period}</div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sign up section */}
        <div className="max-w-md mx-auto">
          <Card className="border-2 border-primary/10 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle>Start your free account</CardTitle>
              <CardDescription>
                Begin with our free tier, upgrade anytime
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleGoogleSignUp}
                disabled={isLoginPending}
                className="w-full h-12 text-base font-medium bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                variant="outline"
              >
                {isLoginPending ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mr-3" />
                ) : (
                  <Chrome className="w-5 h-5 mr-3 text-blue-500" />
                )}
                Sign up with Google
              </Button>

              {loginError && (
                <div className="text-sm text-destructive text-center p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                  {loginError}
                </div>
              )}

              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features showcase */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">AI-Powered Insights</h3>
            <p className="text-muted-foreground text-sm">
              Get intelligent recommendations and productivity optimization based on your work patterns
            </p>
          </div>
          
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
              <Target className="w-8 h-8 text-secondary" />
            </div>
            <h3 className="font-semibold text-lg">Smart Organization</h3>
            <p className="text-muted-foreground text-sm">
              Automatically categorize and prioritize your tasks with machine learning algorithms
            </p>
          </div>
          
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
              <Brain className="w-8 h-8 text-accent" />
            </div>
            <h3 className="font-semibold text-lg">Adaptive Learning</h3>
            <p className="text-muted-foreground text-sm">
              The AI learns your preferences and adapts to provide increasingly personalized suggestions
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>✨ Join thousands of users who've transformed their productivity</p>
          <p>🔒 Secure authentication • 📱 Mobile apps coming soon</p>
        </div>
      </div>
    </div>
  );
}