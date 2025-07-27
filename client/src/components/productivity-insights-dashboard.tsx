import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Clock, 
  Target, 
  Zap, 
  Brain, 
  Calendar,
  Award,
  AlertCircle,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Activity,
  Sparkles
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ProductivityMetrics {
  overall: {
    productivityScore: number;
    weeklyChange: number;
    totalTasksCompleted: number;
    averageCompletionTime: number;
    focusTimeToday: number;
    streakDays: number;
  };
  patterns: {
    peakHours: { hour: string; productivity: number }[];
    weeklyTrend: { day: string; completed: number; created: number }[];
    categoryDistribution: { category: string; count: number; percentage: number; color: string }[];
    completionRates: { timeframe: string; rate: number }[];
  };
  insights: {
    id: string;
    type: 'improvement' | 'pattern' | 'achievement' | 'warning';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    actionable: boolean;
    suggestion?: string;
    metric?: { value: number; change: number; unit: string };
  }[];
  goals: {
    id: string;
    title: string;
    progress: number;
    target: number;
    daysRemaining: number;
    trend: 'up' | 'down' | 'stable';
    status: 'on-track' | 'behind' | 'ahead';
  }[];
}

export function ProductivityInsightsDashboard() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'day' | 'week' | 'month'>('week');
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch comprehensive productivity data
  const { data: insights, isLoading } = useQuery({
    queryKey: ['/api/ai/productivity-insights', selectedTimeframe],
    queryFn: async () => {
      // In production, this would analyze real user data
      const mockData: ProductivityMetrics = {
        overall: {
          productivityScore: 78,
          weeklyChange: 12,
          totalTasksCompleted: 47,
          averageCompletionTime: 23,
          focusTimeToday: 4.2,
          streakDays: 7,
        },
        patterns: {
          peakHours: [
            { hour: '9 AM', productivity: 92 },
            { hour: '10 AM', productivity: 89 },
            { hour: '11 AM', productivity: 95 },
            { hour: '2 PM', productivity: 78 },
            { hour: '3 PM', productivity: 82 },
            { hour: '4 PM', productivity: 75 },
          ],
          weeklyTrend: [
            { day: 'Mon', completed: 8, created: 12 },
            { day: 'Tue', completed: 6, created: 9 },
            { day: 'Wed', completed: 12, created: 15 },
            { day: 'Thu', completed: 9, created: 11 },
            { day: 'Fri', completed: 7, created: 8 },
            { day: 'Sat', completed: 3, created: 5 },
            { day: 'Sun', completed: 2, created: 3 },
          ],
          categoryDistribution: [
            { category: 'Work', count: 23, percentage: 49, color: '#3b82f6' },
            { category: 'Personal', count: 15, percentage: 32, color: '#10b981' },
            { category: 'Learning', count: 9, percentage: 19, color: '#f59e0b' },
          ],
          completionRates: [
            { timeframe: 'This Week', rate: 82 },
            { timeframe: 'Last Week', rate: 75 },
            { timeframe: 'This Month', rate: 78 },
            { timeframe: 'Last Month', rate: 73 },
          ],
        },
        insights: [
          {
            id: '1',
            type: 'pattern',
            title: 'Peak Performance Window Identified',
            description: 'Your productivity peaks between 9-11 AM with 92% completion rate.',
            impact: 'high',
            actionable: true,
            suggestion: 'Schedule your most important tasks during this window for maximum efficiency.',
            metric: { value: 92, change: 8, unit: '%' },
          },
          {
            id: '2',
            type: 'improvement',
            title: 'Focus Time Increasing',
            description: 'Your average focus session has increased by 18 minutes this week.',
            impact: 'medium',
            actionable: false,
            metric: { value: 45, change: 18, unit: 'min' },
          },
          {
            id: '3',
            type: 'warning',
            title: 'Afternoon Productivity Dip',
            description: 'Task completion drops 40% after 3 PM compared to morning hours.',
            impact: 'medium',
            actionable: true,
            suggestion: 'Consider taking a 15-minute break or switching to lighter tasks after 3 PM.',
            metric: { value: 40, change: -15, unit: '%' },
          },
          {
            id: '4',
            type: 'achievement',
            title: 'Weekly Streak Milestone',
            description: 'Congratulations! You\'ve maintained a 7-day completion streak.',
            impact: 'low',
            actionable: false,
            metric: { value: 7, change: 7, unit: 'days' },
          },
        ],
        goals: [
          {
            id: '1',
            title: 'Complete 50 tasks this month',
            progress: 47,
            target: 50,
            daysRemaining: 3,
            trend: 'up',
            status: 'on-track',
          },
          {
            id: '2',
            title: 'Maintain 80% completion rate',
            progress: 78,
            target: 80,
            daysRemaining: 3,
            trend: 'up',
            status: 'behind',
          },
        ],
      };
      
      return mockData;
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'improvement': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'pattern': return <Brain className="h-4 w-4 text-blue-500" />;
      case 'achievement': return <Award className="h-4 w-4 text-purple-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'improvement': return 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800';
      case 'pattern': return 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800';
      case 'achievement': return 'bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800';
      default: return 'bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800';
    }
  };

  const getGoalStatusColor = (status: string) => {
    switch (status) {
      case 'on-track': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
      case 'ahead': return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900';
      case 'behind': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 animate-pulse" />
            Loading Productivity Insights...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-muted rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Personalized Productivity Insights
            <Badge variant="secondary" className="ml-2">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Powered
            </Badge>
          </CardTitle>
          
          <div className="flex gap-2">
            {(['day', 'week', 'month'] as const).map((timeframe) => (
              <Button
                key={timeframe}
                variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTimeframe(timeframe)}
                className="capitalize"
              >
                {timeframe}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-2xl font-bold text-primary">
                    {insights?.overall.productivityScore}%
                  </div>
                  <div className="flex items-center text-sm text-green-600">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    +{insights?.overall.weeklyChange}%
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Productivity Score</p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-2xl font-bold text-blue-600">
                    {insights?.overall.totalTasksCompleted}
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-sm text-muted-foreground">Tasks Completed</p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-2xl font-bold text-purple-600">
                    {insights?.overall.focusTimeToday}h
                  </div>
                  <Clock className="h-4 w-4 text-purple-500" />
                </div>
                <p className="text-sm text-muted-foreground">Focus Time Today</p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-2xl font-bold text-orange-600">
                    {insights?.overall.streakDays}
                  </div>
                  <Zap className="h-4 w-4 text-orange-500" />
                </div>
                <p className="text-sm text-muted-foreground">Day Streak</p>
              </Card>
            </div>

            {/* Weekly Trend Chart */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Weekly Task Completion Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={insights?.patterns.weeklyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="completed" 
                    stackId="1" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.6}
                    name="Completed"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="created" 
                    stackId="2" 
                    stroke="#f59e0b" 
                    fill="#f59e0b" 
                    fillOpacity={0.3}
                    name="Created"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          {/* Patterns Tab */}
          <TabsContent value="patterns" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Peak Hours */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Peak Productivity Hours</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={insights?.patterns.peakHours}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="productivity" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* Category Distribution */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Task Category Distribution</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={insights?.patterns.categoryDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {insights?.patterns.categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="mt-4 space-y-2">
                  {insights?.patterns.categoryDistribution.map((category) => (
                    <div key={category.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-sm">{category.category}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {category.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Completion Rates */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Completion Rate Trends</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {insights?.patterns.completionRates.map((rate) => (
                  <div key={rate.timeframe} className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {rate.rate}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {rate.timeframe}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-4">
            {insights?.insights.map((insight) => (
              <Card key={insight.id} className={`p-4 border-l-4 ${getInsightColor(insight.type)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{insight.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {insight.impact} impact
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {insight.description}
                      </p>
                      
                      {insight.suggestion && (
                        <div className="p-3 bg-muted rounded-lg mb-3">
                          <p className="text-sm">
                            <strong>Suggestion:</strong> {insight.suggestion}
                          </p>
                        </div>
                      )}

                      {insight.actionable && (
                        <Button size="sm" variant="outline">
                          Take Action
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {insight.metric && (
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {insight.metric.value}{insight.metric.unit}
                      </div>
                      <div className={`text-sm flex items-center ${
                        insight.metric.change > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {insight.metric.change > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                        {Math.abs(insight.metric.change)}{insight.metric.unit}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-4">
            {insights?.goals.map((goal) => (
              <Card key={goal.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">{goal.title}</h4>
                  <Badge className={getGoalStatusColor(goal.status)}>
                    {goal.status.replace('-', ' ')}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress: {goal.progress} / {goal.target}</span>
                    <span>{goal.daysRemaining} days remaining</span>
                  </div>
                  
                  <Progress 
                    value={(goal.progress / goal.target) * 100} 
                    className="h-2"
                  />
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      {goal.trend === 'up' ? (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      ) : goal.trend === 'down' ? (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      ) : (
                        <div className="h-3 w-3 bg-yellow-500 rounded-full" />
                      )}
                      <span className="capitalize">{goal.trend} trend</span>
                    </div>
                    <span>{Math.round((goal.progress / goal.target) * 100)}% complete</span>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}