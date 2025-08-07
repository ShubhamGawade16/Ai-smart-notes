import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Zap, Brain, Target, Clock } from "lucide-react";

export default function ReplitAuthLanding() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="flex justify-between items-center p-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">Planify</span>
        </div>
        <Button onClick={handleLogin} className="bg-teal-600 hover:bg-teal-700">
          Sign In
        </Button>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            AI-Powered Productivity
          </Badge>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Your Smart AI
            <span className="text-teal-600"> Task Manager</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Transform chaos into clarity with AI-driven task management. 
            Planify learns your patterns, optimizes your schedule, and helps you achieve peak productivity.
          </p>
          <Button 
            onClick={handleLogin}
            size="lg" 
            className="bg-teal-600 hover:bg-teal-700 text-lg px-8 py-3"
          >
            Get Started Free
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="border-teal-100 dark:border-teal-800">
            <CardHeader className="text-center">
              <Brain className="w-12 h-12 text-teal-600 mx-auto mb-4" />
              <CardTitle className="text-lg">Smart AI Categorization</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 text-center">
                AI automatically organizes tasks by priority, type, and context for optimal workflow.
              </p>
            </CardContent>
          </Card>

          <Card className="border-teal-100 dark:border-teal-800">
            <CardHeader className="text-center">
              <Clock className="w-12 h-12 text-teal-600 mx-auto mb-4" />
              <CardTitle className="text-lg">Smart Timing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 text-center">
                Circadian rhythm analysis suggests optimal times for different task types.
              </p>
            </CardContent>
          </Card>

          <Card className="border-teal-100 dark:border-teal-800">
            <CardHeader className="text-center">
              <Zap className="w-12 h-12 text-teal-600 mx-auto mb-4" />
              <CardTitle className="text-lg">Natural Language</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 text-center">
                Just type what you need to do - AI converts it into structured, actionable tasks.
              </p>
            </CardContent>
          </Card>

          <Card className="border-teal-100 dark:border-teal-800">
            <CardHeader className="text-center">
              <Target className="w-12 h-12 text-teal-600 mx-auto mb-4" />
              <CardTitle className="text-lg">Goal-Driven Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 text-center">
                Personalized productivity insights and recommendations based on your patterns.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Benefits Section */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Why Choose Planify?
            </h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-teal-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">AI-First Approach</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Every feature is enhanced with intelligent automation to reduce mental overhead.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-teal-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Seamless Authentication</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Sign in with your Replit account - no complex setup or email verification needed.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-teal-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Cross-Platform</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Access your tasks anywhere - web, mobile, with real-time sync across devices.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-teal-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Privacy-Focused</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Your data is securely isolated - each user has their own protected workspace.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Ready to Transform Your Productivity?
            </h3>
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">Free Tier</span>
                <Badge variant="outline">3 AI calls/day</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">Basic Plan</span>
                <Badge variant="outline">30 AI calls/day</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">Pro Plan</span>
                <Badge variant="outline">Unlimited AI</Badge>
              </div>
            </div>
            <Button 
              onClick={handleLogin}
              className="w-full bg-teal-600 hover:bg-teal-700 text-lg py-3"
            >
              Start Your Journey
            </Button>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
              Sign in with Replit • No credit card required • Start free
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}