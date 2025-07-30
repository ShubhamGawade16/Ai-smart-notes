import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  Bot,
  Brain,
  Zap,
  Target,
  TrendingUp,
  Eye,
  Sparkles,
  MessageCircle
} from "lucide-react";
import { useLocation } from "wouter";
import { ProductivityInsights } from "@/components/productivity-insights";
import { FocusForecast } from "@/components/focus-forecast-simple";
import { SmartTaskInput } from "@/components/SmartTaskInput";
import { ModernAIRefiner } from "@/components/modern-ai-refiner";
import { TaskMindMap } from "@/components/task-mind-map";

interface FeatureCard {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  badge?: string;
  premium?: boolean;
}

const aiFeatures: FeatureCard[] = [
  {
    id: "smart-input",
    title: "Smart Task Input",
    description: "AI-powered task creation with automatic categorization, priority detection, and smart suggestions.",
    icon: Brain,
    color: "text-purple-600",
    badge: "AI Enhanced"
  },
  {
    id: "task-refiner",
    title: "AI Task Refiner",
    description: "Break down complex tasks into actionable steps with conversational AI guidance.",
    icon: MessageCircle,
    color: "text-blue-600",
    badge: "Smart Analysis"
  },
  {
    id: "focus-forecast",
    title: "Focus Forecast",
    description: "Predict your optimal focus windows and get personalized productivity recommendations.",
    icon: Eye,
    color: "text-green-600",
    badge: "Predictive"
  },
  {
    id: "insights",
    title: "Productivity Insights",
    description: "AI-driven analysis of your productivity patterns with actionable optimization suggestions.",
    icon: TrendingUp,
    color: "text-orange-600",
    badge: "Analytics"
  },
  {
    id: "mind-map",
    title: "Task Mind Map",
    description: "Visualize task connections and get AI strategy advice for optimal execution.",
    icon: Target,
    color: "text-indigo-600",
    badge: "Interactive AI"
  }
];

export default function ModernAdvancedFeatures() {
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  const renderFeature = () => {
    switch (activeFeature) {
      case 'smart-input':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Smart Task Input</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Create enhanced tasks with AI-powered analysis and suggestions
              </p>
            </div>
            <SmartTaskInput onTaskCreated={() => {}} />
          </div>
        );
      case 'task-refiner':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">AI Task Refiner</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Transform any task into actionable steps with AI guidance
              </p>
            </div>
            <ModernAIRefiner 
              onClose={() => setActiveFeature(null)}
              onTasksRefined={(tasks) => {
                console.log('Refined tasks:', tasks);
              }}
            />
          </div>
        );
      case 'focus-forecast':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Focus Forecast</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Discover your optimal productivity windows
              </p>
            </div>
            <div className="max-w-2xl mx-auto">
              <FocusForecast />
            </div>
          </div>
        );
      case 'insights':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Productivity Insights</h2>
              <p className="text-gray-600 dark:text-gray-400">
                AI-powered analysis of your productivity patterns
              </p>
            </div>
            <div className="max-w-2xl mx-auto">
              <ProductivityInsights />
            </div>
          </div>
        );
      case 'mind-map':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Task Mind Map</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Visualize task connections and get AI strategy advice
              </p>
            </div>
            <TaskMindMap />
          </div>
        );
      default:
        return null;
    }
  };

  if (activeFeature) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => setActiveFeature(null)}
              className="flex items-center gap-2 hover:bg-white dark:hover:bg-gray-800"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Features
            </Button>
          </div>
          {renderFeature()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="outline"
            onClick={() => setLocation('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>
        
        <div className="text-center space-y-4 mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              AI-Powered Features
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Transform your productivity with advanced AI capabilities designed to enhance every aspect of your task management.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {aiFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={feature.id}
                className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border-0 bg-white dark:bg-gray-800 overflow-hidden"
                onClick={() => setActiveFeature(feature.id)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl bg-gradient-to-r ${
                        feature.id === 'smart-input' ? 'from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800' :
                        feature.id === 'task-refiner' ? 'from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800' :
                        feature.id === 'focus-forecast' ? 'from-green-100 to-green-200 dark:from-green-900 dark:to-green-800' :
                        'from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800'
                      }`}>
                        <Icon className={`w-6 h-6 ${feature.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-semibold group-hover:text-purple-600 transition-colors">
                          {feature.title}
                        </CardTitle>
                        {feature.badge && (
                          <Badge 
                            variant="secondary" 
                            className="mt-1 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                          >
                            {feature.badge}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {feature.premium && (
                      <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                        Pro
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                  
                  <div className="mt-4 flex items-center text-sm text-purple-600 dark:text-purple-400 font-medium group-hover:gap-2 transition-all">
                    Try it now
                    <Zap className="w-4 h-4 ml-1 group-hover:ml-0 transition-all" />
                  </div>
                </CardContent>
                
                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 max-w-2xl mx-auto">
            <Bot className="w-12 h-12 mx-auto mb-4 text-purple-600" />
            <h3 className="text-2xl font-bold mb-2">Experience AI-Powered Productivity</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Each feature is designed to learn from your habits and provide personalized recommendations to maximize your productivity.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Badge variant="outline" className="px-3 py-1">
                <Target className="w-3 h-3 mr-1" />
                Smart Analysis
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                <Brain className="w-3 h-3 mr-1" />
                AI Learning
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                Continuous Improvement
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}