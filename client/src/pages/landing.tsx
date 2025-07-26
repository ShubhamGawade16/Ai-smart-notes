import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  Zap, 
  Target, 
  Calendar, 
  BarChart3, 
  MessageSquare, 
  Crown, 
  Star,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Clock,
  TrendingUp
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              AI Smart Notes
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge className="mb-4 bg-indigo-100 text-indigo-800 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-200">
            🚀 AI-Powered Productivity
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Transform Your 
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {" "}Productivity
            </span>
            <br />
            with AI Intelligence
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Smart task management that learns from your habits, predicts your needs, 
            and optimizes your workflow with cutting-edge AI technology.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-lg px-8 py-6">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              <BarChart3 className="mr-2 h-5 w-5" />
              View Demo
            </Button>
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            ✨ No credit card required • 7-day Pro trial • Cancel anytime
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Powered by Advanced AI
          </h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Experience next-generation productivity with features that adapt to your workflow
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Natural Language Tasks */}
          <Card className="border-2 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Natural Language Entry</CardTitle>
              <CardDescription>
                "Finish the report by Friday" → Automatically parsed with priority, time estimates, and categorization
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Smart Optimization */}
          <Card className="border-2 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Smart Optimization</CardTitle>
              <CardDescription>
                AI reorders your tasks based on urgency, energy levels, and productivity patterns
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Focus Forecast */}
          <Card className="border-2 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Focus Forecast</CardTitle>
              <CardDescription>
                Predict your peak productivity windows and get personalized break recommendations
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Auto-Schedule */}
          <Card className="border-2 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Auto-Schedule</CardTitle>
              <CardDescription>
                Intelligently schedule tasks to your calendar based on deadlines and energy patterns
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Habit Gamification */}
          <Card className="border-2 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4">
                <Star className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Habit Gamification</CardTitle>
              <CardDescription>
                Personalized challenges, XP rewards, and streak tracking that adapts to your personality
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Predictive Insights */}
          <Card className="border-2 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 bg-gradient-to-r from-teal-500 to-green-500 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Predictive Insights</CardTitle>
              <CardDescription>
                Get bottleneck analysis, productivity forecasts, and personalized optimization tips
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Productivity Level
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Start free and unlock advanced AI features as you grow
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {/* Free Tier */}
          <Card className="relative">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Free
                <Badge variant="secondary">₹0</Badge>
              </CardTitle>
              <CardDescription>Perfect for getting started</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm">50 tasks/month</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm">5 AI insights/day</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm">Basic habits</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm">Mobile app</span>
                </div>
              </div>
              <Link href="/register">
                <Button className="w-full mt-6" variant="outline">
                  Get Started
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Basic Pro */}
          <Card className="relative border-indigo-200 dark:border-indigo-800">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Basic Pro
                <Badge className="bg-indigo-100 text-indigo-800">₹199/mo</Badge>
              </CardTitle>
              <CardDescription>For serious productivity enthusiasts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm">Unlimited tasks</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm">50 AI insights/day</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm">No ads</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm">Calendar integration</span>
                </div>
              </div>
              <Link href="/register">
                <Button className="w-full mt-6">
                  Start 7-Day Trial
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Advanced Pro */}
          <Card className="relative border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                Most Popular
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Advanced Pro
                <Badge className="bg-purple-100 text-purple-800">₹499/mo</Badge>
              </CardTitle>
              <CardDescription>Advanced AI and automation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm">200 AI insights/day</span>
                </div>
                <div className="flex items-center">
                  <Sparkles className="h-4 w-4 text-purple-500 mr-2" />
                  <span className="text-sm">Focus Forecast</span>
                </div>
                <div className="flex items-center">
                  <Sparkles className="h-4 w-4 text-purple-500 mr-2" />
                  <span className="text-sm">Auto-Schedule</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm">Meeting imports</span>
                </div>
              </div>
              <Link href="/register">
                <Button className="w-full mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                  Start 7-Day Trial
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Premium Pro */}
          <Card className="relative border-yellow-200 dark:border-yellow-800">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Premium Pro
                <Badge className="bg-yellow-100 text-yellow-800">₹799/mo</Badge>
              </CardTitle>
              <CardDescription>Ultimate productivity powerhouse</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Crown className="h-4 w-4 text-yellow-500 mr-2" />
                  <span className="text-sm">Unlimited AI</span>
                </div>
                <div className="flex items-center">
                  <Crown className="h-4 w-4 text-yellow-500 mr-2" />
                  <span className="text-sm">7-day heat-map</span>
                </div>
                <div className="flex items-center">
                  <Crown className="h-4 w-4 text-yellow-500 mr-2" />
                  <span className="text-sm">Custom integrations</span>
                </div>
                <div className="flex items-center">
                  <Crown className="h-4 w-4 text-yellow-500 mr-2" />
                  <span className="text-sm">Priority support</span>
                </div>
              </div>
              <Link href="/register">
                <Button className="w-full mt-6 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700">
                  Start 7-Day Trial
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            All paid plans include a 7-day free trial. Cancel anytime. No hidden fees.
          </p>
        </div>
      </section>

      {/* Social Proof */}
      <section className="container mx-auto px-4 py-16 bg-gray-50 dark:bg-gray-800 rounded-2xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Trusted by Productivity Enthusiasts
          </h2>
          <div className="grid md:grid-cols-3 gap-8 mt-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600 mb-2">82%</div>
              <div className="text-gray-600 dark:text-gray-300">Pro users complete 30% more tasks</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">17min</div>
              <div className="text-gray-600 dark:text-gray-300">Average daily time saved</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">4.9/5</div>
              <div className="text-gray-600 dark:text-gray-300">User satisfaction rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to Transform Your Productivity?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Join thousands of users who've already supercharged their workflow with AI
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-lg px-8 py-6">
                Start Free Today
                <Sparkles className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                <Clock className="mr-2 h-5 w-5" />
                Already have an account?
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded flex items-center justify-center">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">AI Smart Notes</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © 2025 AI Smart Notes. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}