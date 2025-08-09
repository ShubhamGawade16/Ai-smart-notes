import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft,
  Brain,
  Target,
  TrendingUp,
  MessageCircle,
  Clock
} from "lucide-react";
import { useLocation } from "wouter";
import { ProductivityInsights } from "@/components/productivity-insights";
import { SmartTiming } from "@/components/smart-timing";
import TaskRefiner from "@/components/task-refiner";
import SmartCategorizerModal from "@/components/smart-categorizer-modal";
import AIChatAssistantModal from "@/components/ai-chat-assistant-modal";

export default function AdvancedFeatures() {
  const [showCategorizer, setShowCategorizer] = useState(false);
  const [showChatAssistant, setShowChatAssistant] = useState(false);
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  const features = [
    {
      id: "categorizer",
      title: "AI Task Categorizer",
      description: "Create smart tasks with AI categorization",
      icon: Brain,
      action: () => setShowCategorizer(true)
    },
    {
      id: "timing",
      title: "Smart Timing",
      description: "AI-powered timing analysis", 
      icon: Clock,
      action: () => setActiveFeature("timing")
    },
    {
      id: "chat",
      title: "AI Chat Assistant",
      description: "Chat with AI for productivity advice",
      icon: MessageCircle,
      action: () => setShowChatAssistant(true)
    },
    {
      id: "insights",
      title: "Productivity Insights",
      description: "Analyze your productivity patterns",
      icon: TrendingUp,
      action: () => setActiveFeature("insights")
    },
    {
      id: "refiner",
      title: "Task Refiner",
      description: "Break down complex tasks",
      icon: Target,
      action: () => setActiveFeature("refiner")
    }
  ];

  if (activeFeature) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => setActiveFeature(null)}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to AI Features
          </Button>

          {activeFeature === "timing" && (
            <div className="max-w-4xl mx-auto">
              <h1 className="text-2xl font-bold mb-6">Smart Timing Analysis</h1>
              <SmartTiming />
            </div>
          )}

          {activeFeature === "insights" && (
            <div className="max-w-4xl mx-auto">
              <h1 className="text-2xl font-bold mb-6">Productivity Insights</h1>
              <ProductivityInsights />
            </div>
          )}

          {activeFeature === "refiner" && (
            <div className="max-w-2xl mx-auto">
              <h1 className="text-2xl font-bold mb-6">AI Task Refiner</h1>
              <TaskRefiner 
                onTaskRefined={(refinedTask, decomposition) => {
                  console.log('Refined task:', refinedTask, decomposition);
                }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="outline"
          onClick={() => setLocation('/')}
          className="mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">AI Features</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Choose an AI tool to boost your productivity
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={feature.id}
                className="cursor-pointer hover:shadow-lg transition-shadow min-h-[120px] touch-manipulation"
                onClick={feature.action}
              >
                <CardHeader className="text-center pb-3 sm:pb-4">
                  <Icon className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-blue-600" />
                  <CardTitle className="text-base sm:text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
      
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