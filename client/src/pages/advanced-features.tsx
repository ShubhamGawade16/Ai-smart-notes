import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { 
  Brain, 
  Clock,
  TrendingUp, 
  ArrowLeft,
  Crown,
  Timer,
  Target,
  Zap
} from 'lucide-react';
import { Link } from 'wouter';
import { SmartTiming } from '@/components/smart-timing';
import FocusForecast from '@/components/focus-forecast';
import { CircularProgressChart } from '@/components/circular-progress-chart';

interface SubscriptionStatus {
  isPremium?: boolean;
  isBasic?: boolean;
  tier?: string;
  dailyAiUsage?: number;
  dailyAiLimit?: number;
  monthlyAiUsage?: number;
  monthlyAiLimit?: number;
  canUseAi?: boolean;
  subscriptionId?: string | null;
  subscriptionStatus?: string | null;
  expiresAt?: string | null;
}

export default function AdvancedFeatures() {
  // Check subscription status
  const { data: subscriptionStatus } = useQuery<SubscriptionStatus>({
    queryKey: ['/api/subscription-status'],
  });


  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Brain className="w-8 h-8 text-teal-600" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                AI Features
              </h1>
            </div>
            {subscriptionStatus?.isPremium && (
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                <Crown className="w-3 h-3 mr-1" />
                Pro User
              </Badge>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Advanced AI-powered productivity tools: Smart Timing analysis, Focus Forecasting, and Progress Analytics.
          </p>
        </div>

        {/* AI Features Grid - Original UX Plan Features */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          {/* Smart Timing - Timer Calculator */}
          <div className="xl:col-span-2">
            <Card className="border-0 shadow-lg h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="w-5 h-5 text-teal-600" />
                  Smart Timing Analysis
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  AI-powered task timing optimization based on circadian rhythms and task types.
                </p>
              </CardHeader>
              <CardContent>
                <SmartTiming />
              </CardContent>
            </Card>
          </div>

          {/* Progress Analytics - Circular Chart */}
          <div>
            <CircularProgressChart />
          </div>
        </div>

        {/* Focus Forecast - Calculator Feature */}
        <div className="mb-8">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                Focus Forecast Calculator
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Predictive analysis for peak focus windows, break recommendations, and burnout risk assessment.
              </p>
            </CardHeader>
            <CardContent>
              <FocusForecast />
            </CardContent>
          </Card>
        </div>

        {/* Feature Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20">
            <CardContent className="p-6 text-center">
              <Timer className="w-12 h-12 text-teal-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Smart Timing
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Optimize when to work on tasks based on AI analysis of your circadian rhythms and energy levels.
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
            <CardContent className="p-6 text-center">
              <Zap className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Focus Forecast
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Predict your peak productivity windows and get personalized break recommendations.
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
            <CardContent className="p-6 text-center">
              <TrendingUp className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Progress Analytics
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Visual insights into your task completion patterns and productivity trends.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}