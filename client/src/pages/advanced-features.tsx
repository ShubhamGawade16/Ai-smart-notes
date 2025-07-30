import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Brain, 
  Target, 
  Calendar, 
  BarChart3, 
  Users, 
  Settings,
  Zap,
  Clock,
  Repeat,
  Heart,
  Trash2
} from 'lucide-react';
import { Link } from 'wouter';
import { CleanHeader } from '@/components/clean-header';
import { ConversationalRefiner } from '@/components/ConversationalRefiner';
import { FocusForecast } from '@/components/focus-forecast-simple';
import { ProductivityInsights } from '@/components/productivity-insights';
import { IntegrationHub } from '@/components/IntegrationHub';
import { SmartTaskInput } from '@/components/SmartTaskInput';
import { SmartReminderRecalibration } from '@/components/smart-reminder-recalibration';
import { RecurringTaskGeneratorTuner } from '@/components/recurring-task-generator-tuner';
import { TaskDecayDeclutter } from '@/components/task-decay-declutter';
import { MoodAwareTaskSuggestions } from '@/components/mood-aware-task-suggestions';

const aiFeatures = [
  {
    id: 'smart-input',
    title: 'Smart Task Input',
    description: 'AI analyzes and categorizes your tasks automatically',
    icon: Brain,
    color: 'text-purple-600',
    component: SmartTaskInput
  },
  {
    id: 'task-refiner',
    title: 'AI Task Refiner',
    description: 'Break down complex tasks with AI assistance',
    icon: Target,
    color: 'text-blue-600',
    component: ConversationalRefiner
  },
  {
    id: 'focus-forecast',
    title: 'Focus Forecast',
    description: 'Predict your optimal productivity windows',
    icon: BarChart3,
    color: 'text-green-600',
    component: FocusForecast
  },
  {
    id: 'insights',
    title: 'Productivity Insights',
    description: 'AI-powered analytics and bottleneck detection',
    icon: Zap,
    color: 'text-yellow-600',
    component: ProductivityInsights
  }
];

const productivityTools = [
  {
    id: 'smart-reminders',
    title: 'Smart Reminders',
    description: 'Context-aware reminder optimization',
    icon: Clock,
    color: 'text-teal-600',
    component: SmartReminderRecalibration
  },
  {
    id: 'recurring-tasks',
    title: 'Recurring Tasks',
    description: 'Intelligent recurring task generation',
    icon: Repeat,
    color: 'text-cyan-600',
    component: RecurringTaskGeneratorTuner
  }
];

const lifestyleFeatures = [
  {
    id: 'mood-aware',
    title: 'Mood-Aware Tasks',
    description: 'Task suggestions based on your current mood',
    icon: Heart,
    color: 'text-pink-600',
    component: MoodAwareTaskSuggestions
  },
  {
    id: 'task-decay',
    title: 'Task Cleanup',
    description: 'Automated cleanup of outdated tasks',
    icon: Trash2,
    color: 'text-red-600',
    component: TaskDecayDeclutter
  }
];

export default function CleanAdvancedFeatures() {
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  const renderFeatureComponent = (featureId: string) => {
    const allFeatures = [...aiFeatures, ...productivityTools, ...lifestyleFeatures];
    const feature = allFeatures.find(f => f.id === featureId);
    if (!feature) return null;

    const Component = feature.component;
    return <Component />;
  };

  if (activeFeature) {
    return (
      <div className="min-h-screen bg-background">
        <CleanHeader />
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => setActiveFeature(null)}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Features
            </Button>
          </div>
          
          <div className="bg-card border rounded-xl p-6">
            {renderFeatureComponent(activeFeature)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CleanHeader />
      
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">AI-Powered Features</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Unlock advanced productivity tools powered by artificial intelligence
            </p>
            <Badge className="mt-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
              <Zap className="h-3 w-3 mr-1" />
              All Features Free for Testing
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="ai" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-md mx-auto">
            <TabsTrigger value="ai">AI Tools</TabsTrigger>
            <TabsTrigger value="productivity">Planning</TabsTrigger>
            <TabsTrigger value="lifestyle">Lifestyle</TabsTrigger>
            <TabsTrigger value="integrations">Connect</TabsTrigger>
          </TabsList>

          {/* AI Features */}
          <TabsContent value="ai" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {aiFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card 
                    key={feature.id} 
                    className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
                    onClick={() => setActiveFeature(feature.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <Icon className={`h-5 w-5 ${feature.color}`} />
                        </div>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Productivity Tools */}
          <TabsContent value="productivity" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {productivityTools.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card 
                    key={feature.id} 
                    className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
                    onClick={() => setActiveFeature(feature.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <Icon className={`h-5 w-5 ${feature.color}`} />
                        </div>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Lifestyle Features */}
          <TabsContent value="lifestyle" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {lifestyleFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card 
                    key={feature.id} 
                    className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
                    onClick={() => setActiveFeature(feature.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <Icon className={`h-5 w-5 ${feature.color}`} />
                        </div>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Integrations */}
          <TabsContent value="integrations" className="space-y-4">
            <IntegrationHub />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}