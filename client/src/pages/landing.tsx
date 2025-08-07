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
  TrendingUp,
  Play,
  Users,
  Award,
  Quote
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
              Planify
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/auth">
              <Button className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700">
                Get Started Free
              </Button>
            </Link>
            <Link href="/auth">
              <Button variant="outline">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section - Single Clear Value Proposition */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge className="mb-6 bg-indigo-100 text-indigo-800 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-200">
            🚀 AI-Powered Task Management That Learns Your Workflow
          </Badge>
          
          <h1 className="text-6xl md:text-7xl font-bold text-gray-900 dark:text-white mb-8">
            AI-Powered Task Management 
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {" "}That Learns Your Workflow
            </span>
          </h1>
          
          <p className="text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto">
            Stop managing tasks. Start achieving goals. Our AI learns your patterns, 
            predicts your needs, and optimizes your productivity automatically.
          </p>

          {/* Single Prominent CTA */}
          <div className="mb-16">
            <Link href="/">
              <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-xl px-12 py-8 rounded-xl shadow-2xl transform hover:scale-105 transition-all">
                Start Your Free Trial
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              ✨ No credit card required • 7-day free trial • 10,000+ users trust us
            </p>
          </div>

          {/* Social Proof & Metrics - Single Prominent Banner */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-8 mb-16">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-5xl font-bold text-indigo-600 mb-2 animate-pulse">10K+</div>
                <p className="text-gray-600 dark:text-gray-300 font-medium">Tasks Organized</p>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold text-indigo-600 mb-2 animate-pulse" style={{animationDelay: '0.5s'}}>95%</div>
                <p className="text-gray-600 dark:text-gray-300 font-medium">User Satisfaction</p>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold text-indigo-600 mb-2 animate-pulse" style={{animationDelay: '1s'}}>40%</div>
                <p className="text-gray-600 dark:text-gray-300 font-medium">Productivity Boost</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Teasers - 3 Core Benefits with Video Links */}
      <section className="container mx-auto px-4 py-20 bg-white dark:bg-gray-800 rounded-3xl mx-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
            3 Core AI Features That Transform Your Workflow
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Experience the power of AI that adapts to your unique productivity patterns
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12">
          {/* Task AI */}
          <Card className="border-2 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all transform hover:scale-105 cursor-pointer group">
            <CardHeader className="text-center">
              <div className="h-20 w-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-6 mx-auto group-hover:shadow-2xl transition-all">
                <Brain className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-2xl">Task AI</CardTitle>
              <CardDescription className="text-lg">
                "Finish report by Friday" → Automatically categorized, prioritized, and time-estimated with smart suggestions
              </CardDescription>
              <Button variant="ghost" className="mt-4 text-indigo-600 hover:text-indigo-700">
                <Play className="h-4 w-4 mr-2" />
                Watch Demo
              </Button>
            </CardHeader>
          </Card>

          {/* Smart Scheduling */}
          <Card className="border-2 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all transform hover:scale-105 cursor-pointer group">
            <CardHeader className="text-center">
              <div className="h-20 w-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-6 mx-auto group-hover:shadow-2xl transition-all">
                <Calendar className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-2xl">Smart Scheduling</CardTitle>
              <CardDescription className="text-lg">
                AI learns your energy patterns and automatically schedules tasks when you're most productive
              </CardDescription>
              <Button variant="ghost" className="mt-4 text-indigo-600 hover:text-indigo-700">
                <Play className="h-4 w-4 mr-2" />
                Watch Demo
              </Button>
            </CardHeader>
          </Card>

          {/* Productivity Insights */}
          <Card className="border-2 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all transform hover:scale-105 cursor-pointer group">
            <CardHeader className="text-center">
              <div className="h-20 w-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-6 mx-auto group-hover:shadow-2xl transition-all">
                <TrendingUp className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-2xl">Productivity Insights</CardTitle>
              <CardDescription className="text-lg">
                Get personalized bottleneck analysis, focus forecasts, and optimization recommendations
              </CardDescription>
              <Button variant="ghost" className="mt-4 text-indigo-600 hover:text-indigo-700">
                <Play className="h-4 w-4 mr-2" />
                Watch Demo
              </Button>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Simplified Two-Tier Pricing */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Start free, upgrade when you're ready to unlock the full potential
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Free Forever */}
          <Card className="relative border-2 border-gray-200 dark:border-gray-700">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl mb-2">Free Forever</CardTitle>
              <div className="text-6xl font-bold text-gray-900 dark:text-white mb-4">₹0</div>
              <CardDescription className="text-lg">Perfect for getting started with AI-powered productivity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-8">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span>Unlimited tasks</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span>25 notes/month</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span>3 AI calls/day</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span>Basic streaks & analytics</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span>Up to 3 habits</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span>Mobile app</span>
                </div>
              </div>
              <Link href="/">
                <Button className="w-full text-lg py-6" variant="outline">
                  Get Started Free
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Pro All-Inclusive */}
          <Card className="relative border-2 border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 shadow-2xl">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 text-lg">
                Most Popular
              </Badge>
            </div>
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl mb-2">Pro All-Inclusive</CardTitle>
              <div className="flex items-baseline justify-center space-x-2 mb-4">
                <div className="text-6xl font-bold text-indigo-600">₹12</div>
                <div className="text-lg text-gray-600 dark:text-gray-300">/mo</div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                or ₹79/yr (2 months free)
              </div>
              <CardDescription className="text-lg">Everything you need for peak productivity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-8">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span><strong>Unlimited</strong> tasks, notes & AI calls</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span><strong>Unlimited</strong> habits with smart reminders</span>
                </div>
                <div className="flex items-center">
                  <Sparkles className="h-5 w-5 text-indigo-500 mr-3" />
                  <span><strong>Focus Forecast</strong> & burnout alerts</span>
                </div>
                <div className="flex items-center">
                  <Sparkles className="h-5 w-5 text-indigo-500 mr-3" />
                  <span><strong>Auto-Schedule</strong> to calendar</span>
                </div>
                <div className="flex items-center">
                  <Sparkles className="h-5 w-5 text-indigo-500 mr-3" />
                  <span><strong>Advanced insights</strong> & optimization</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span>Priority support</span>
                </div>
              </div>
              <Link href="/">
                <Button className="w-full text-lg py-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                  Start 7-Day Free Trial
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            ✨ 7-day free trial for Pro • Annual billing: 2 months free • Cancel anytime
          </p>
          <div className="flex justify-center items-center space-x-8 text-sm text-gray-500">
            <span className="flex items-center"><CheckCircle className="h-4 w-4 mr-2" /> No credit card required</span>
            <span className="flex items-center"><CheckCircle className="h-4 w-4 mr-2" /> Cancel anytime</span>
            <span className="flex items-center"><CheckCircle className="h-4 w-4 mr-2" /> 30-day money back</span>
          </div>
        </div>
      </section>

      {/* App Insights - How It Works */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Extract Key Information from Any Task
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Transform unstructured task descriptions into organized, actionable datasets ready for intelligent workflow optimization
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          {/* Feature Description */}
          <div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
             Supercharge Your Task Management
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Use the power of AI to analyze any task description without manual categorization or coding skills. 
              Get structured insights from your workflow, priorities, and patterns, then organize them into ready-to-use productivity formats.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <div className="bg-yellow-100 dark:bg-yellow-900/20 p-2 rounded-full">
                  <Zap className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Analyze Any Task</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Smart To-Do AI's built-in task analyzer extracts meaning and context from any description.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-indigo-100 dark:bg-indigo-900/20 p-2 rounded-full">
                  <Brain className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Use AI to Automate Workflows</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Ask AI to manipulate task data in whatever way you prompt it.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Demo */}
          <div className="relative">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Browser Header */}
              <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 flex items-center space-x-2">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="flex-1 bg-white dark:bg-gray-600 rounded mx-4 px-3 py-1 text-sm text-gray-500">
                  Smart Task Analysis
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Input Task:</div>
                  <div className="font-medium">"Finish the quarterly sales report by Friday and schedule team meeting"</div>
                </div>

                <div className="flex items-center justify-center py-2">
                  <div className="flex items-center space-x-2 text-indigo-600">
                    <Brain className="h-5 w-5 animate-pulse" />
                    <span className="text-sm font-medium">AI Analysis</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-700">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Target className="h-4 w-4 text-indigo-600" />
                        <span className="font-medium text-indigo-900 dark:text-indigo-100">High Priority</span>
                      </div>
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">Urgent</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Category:</span>
                        <span className="ml-2 font-medium">Work</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Est. Time:</span>
                        <span className="ml-2 font-medium">3-4 hours</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500">Tags:</span>
                        <span className="ml-2 font-medium">deadline, report, meeting, quarterly</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-700">
                    <div className="flex items-center space-x-2 text-green-700 dark:text-green-300">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">AI Suggestion: Break into 2 subtasks, schedule report work for Wednesday morning (your peak focus time)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Feature */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 rounded-2xl p-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Task Management Made Easy
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Our AI understands context and learns your patterns to provide intelligent suggestions exactly when you need them
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold mb-3">Smart Categorization</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Automatically organize tasks by project, priority, and context without manual tagging
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold mb-3">Time Intelligence</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Get accurate time estimates and optimal scheduling based on your historical patterns
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold mb-3">Productivity Insights</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Discover bottlenecks, peak performance times, and personalized optimization strategies
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* User Testimonials - Real Social Proof */}
      <section className="container mx-auto px-4 py-20 bg-gradient-to-r from-gray-50 to-indigo-50 dark:from-gray-800 dark:to-indigo-900 rounded-3xl mx-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Trusted by 10,000+ Productivity Enthusiasts
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            See how our AI-powered platform transforms daily workflows
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Testimonial 1 */}
          <Card className="bg-white dark:bg-gray-800 shadow-xl">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold">Sarah Chen</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Product Manager</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 dark:text-gray-300 italic">
                "The AI categorization is incredible. It learns my patterns and suggests exactly what I need to focus on. My productivity increased by 40% in the first month."
              </p>
            </CardContent>
          </Card>

          {/* Testimonial 2 */}
          <Card className="bg-white dark:bg-gray-800 shadow-xl">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold">Marcus Rodriguez</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Startup Founder</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 dark:text-gray-300 italic">
                "Focus Forecast changed everything. I now know exactly when I'll be most productive and plan my deep work accordingly. Game-changer for entrepreneurs."
              </p>
            </CardContent>
          </Card>

          {/* Testimonial 3 */}
          <Card className="bg-white dark:bg-gray-800 shadow-xl">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Quote className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold">Emily Watson</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Software Developer</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 dark:text-gray-300 italic">
                "The auto-scheduling feature syncs perfectly with my calendar. No more manual planning - the AI knows my workflow better than I do!"
              </p>
            </CardContent>
          </Card>
        </div>


      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Ready to Transform Your Productivity?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12">
            Join thousands of users who've already supercharged their workflow with AI
          </p>
          <Link href="/">
            <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-xl px-12 py-8 rounded-xl shadow-2xl transform hover:scale-105 transition-all">
              Start Your Free Trial Now
              <ArrowRight className="ml-3 h-6 w-6" />
            </Button>
          </Link>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
            ✨ No credit card required • 7-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">Smart To-Do AI</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © 2025 Smart To-Do AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}