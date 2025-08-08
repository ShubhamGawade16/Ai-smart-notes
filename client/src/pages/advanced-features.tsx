import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft,
  Bot,
  Brain,
  Zap,
  Target,
  TrendingUp,
  MessageCircle,
  Sparkles,
  Clock,
  ChevronRight,
  Play
} from "lucide-react";
import { useLocation } from "wouter";
import { ProductivityInsights } from "@/components/productivity-insights";
import { SmartTiming } from "@/components/smart-timing";
import TaskRefiner from "@/components/task-refiner";
import SmartCategorizerModal from "@/components/smart-categorizer-modal";
import AIChatAssistantModal from "@/components/ai-chat-assistant-modal";

interface AIFeature {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: any;
  color: string;
  gradient: string;
  category: 'creation' | 'analysis' | 'interaction';
}

export default function AdvancedFeatures() {
  const [showCategorizer, setShowCategorizer] = useState(false);
  const [showChatAssistant, setShowChatAssistant] = useState(false);
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => setLocation('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>
        
        <div className="text-center space-y-3 mb-8">
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              AI Features Hub
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Access powerful AI tools designed to boost your productivity and streamline your workflow.
          </p>
        </div>

        {/* Main Content with Tabs */}
        <Tabs defaultValue="create" className="w-full max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Create & Plan
            </TabsTrigger>
            <TabsTrigger value="analyze" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Analyze & Optimize
            </TabsTrigger>
            <TabsTrigger value="interact" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Chat & Refine
            </TabsTrigger>
          </TabsList>

          {/* Create & Plan Tab */}
          <TabsContent value="create" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AI Task Categorizer */}
              <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950 dark:to-gray-800">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                      <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <CardTitle className="text-purple-900 dark:text-purple-100">AI Task Categorizer</CardTitle>
                  </div>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    Create smart tasks with automatic categorization and priority detection
                  </p>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => setShowCategorizer(true)}
                    className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Creating Tasks
                  </Button>
                </CardContent>
              </Card>

              {/* AI Timing */}
              <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-gray-800">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                      <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle className="text-blue-900 dark:text-blue-100">Smart Timing Analysis</CardTitle>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Optimize your schedule with circadian rhythm insights
                  </p>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="bg-white dark:bg-gray-900 rounded-lg m-4 p-4 border">
                    <SmartTiming />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analyze & Optimize Tab */}
          <TabsContent value="analyze" className="space-y-6">
            <Card className="border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950 dark:to-gray-800">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900">
                    <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <CardTitle className="text-orange-900 dark:text-orange-100">Productivity Insights</CardTitle>
                </div>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Get AI-powered analysis of your productivity patterns and optimization suggestions
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="bg-white dark:bg-gray-900 rounded-lg m-4 p-4 border">
                  <ProductivityInsights />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chat & Refine Tab */}
          <TabsContent value="interact" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AI Chat Assistant */}
              <Card className="border-teal-200 dark:border-teal-800 bg-gradient-to-br from-teal-50 to-white dark:from-teal-950 dark:to-gray-800">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900">
                      <MessageCircle className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <CardTitle className="text-teal-900 dark:text-teal-100">AI Chat Assistant</CardTitle>
                  </div>
                  <p className="text-sm text-teal-700 dark:text-teal-300">
                    Get personalized productivity advice and task planning help
                  </p>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => setShowChatAssistant(true)}
                    className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Start AI Conversation
                  </Button>
                </CardContent>
              </Card>

              {/* AI Task Refiner */}
              <Card className="border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-gray-800">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                      <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle className="text-green-900 dark:text-green-100">AI Task Refiner</CardTitle>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Break down complex tasks into manageable, actionable steps
                  </p>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="bg-white dark:bg-gray-900 rounded-lg m-4 p-4 border">
                    <TaskRefiner 
                      onTaskRefined={(refinedTask, decomposition) => {
                        console.log('Refined task:', refinedTask, decomposition);
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Access Footer */}
        <div className="mt-12 text-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Bot className="w-6 h-6 text-purple-600" />
              <h3 className="text-lg font-semibold">AI-Powered Productivity</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Each AI feature learns from your behavior to provide increasingly personalized recommendations.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                Intelligent Analysis
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Brain className="w-3 h-3 mr-1" />
                Adaptive Learning
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Target className="w-3 h-3 mr-1" />
                Goal Optimization
              </Badge>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <SmartCategorizerModal 
        isOpen={showCategorizer} 
        onClose={() => setShowCategorizer(false)} 
      />
      <AIChatAssistantModal 
        isOpen={showChatAssistant} 
        onClose={() => setShowChatAssistant(false)} 
      />
    </div>
  );
}