import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, CheckSquare, Clock, Target, Zap, Brain, Repeat, Trash, Heart, Award, BarChart, Menu } from "lucide-react";
import { QuickAdd } from "@/components/quick-add";
import { TaskItem } from "@/components/task-item";
import { SimpleTaskEditor } from "@/components/simple-task-editor";
import { SmartReminderRecalibration } from "@/components/smart-reminder-recalibration";
import { RecurringTaskGeneratorTuner } from "@/components/recurring-task-generator-tuner";
import { TaskDecayDeclutter } from "@/components/task-decay-declutter";
import { MoodAwareTaskSuggestions } from "@/components/mood-aware-task-suggestions";
import { GoalTrackingAlignment } from "@/components/goal-tracking-alignment";
import { UnifiedSidebar } from "@/components/unified-sidebar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Task } from "@shared/schema";

export function SimplifiedDashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userTier, setUserTier] = useState<'free' | 'pro'>('free'); // Would come from auth in real app
  const [dailyAiCalls, setDailyAiCalls] = useState(3); // Would come from user data
  const [taskCount, setTaskCount] = useState(0);

  const { data: tasks = [], isLoading } = useQuery<{tasks: Task[]}>({
    queryKey: ['/api/tasks'],
  });

  const { data: todaysTasks = [] } = useQuery<Task[]>({
    queryKey: ['/api/tasks/today'],
  });

  const { data: analytics } = useQuery<{
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
  }>({
    queryKey: ['/api/analytics/stats'],
  });

  const incompleteTasks = tasks?.tasks?.filter((task: any) => !task.completed) || [];
  const completedTasks = tasks?.tasks?.filter((task: any) => task.completed) || [];

  // Progressive Disclosure: Show Goals only after 5 tasks created
  useEffect(() => {
    setTaskCount(tasks?.tasks?.length || 0);
  }, [tasks]);

  const maxDailyAiCalls = userTier === 'free' ? 3 : 999;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Unified Sidebar */}
      <UnifiedSidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        dailyAiCalls={dailyAiCalls}
        maxDailyAiCalls={maxDailyAiCalls}
        userTier={userTier}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden bg-card border-b sticky top-0 z-10">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-foreground">Smart To-Do AI</h1>
                <p className="text-sm text-muted-foreground">AI-Powered Productivity</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          {/* Quick Stats & Add Task */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {incompleteTasks.length} active • {completedTasks.length} completed
              </Badge>
              {userTier === 'free' && (
                <Badge variant="outline" className="text-sm px-3 py-1 border-orange-200 text-orange-700">
                  Free Plan • {dailyAiCalls} AI calls left
                </Badge>
              )}
            </div>
            <SimpleTaskEditor
              task={{} as any}
              isCreating={true}
              trigger={
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              }
            />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Tasks</p>
                  <p className="text-2xl font-bold">{analytics?.totalTasks || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{analytics?.completedTasks || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{analytics?.pendingTasks || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Today</p>
                  <p className="text-2xl font-bold">{todaysTasks.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Task Creation - Left Column */}
          <div className="lg:col-span-1">
            <QuickAdd />
          </div>

          {/* Task Lists - Right Columns */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="active">
                  Active ({incompleteTasks.length})
                </TabsTrigger>
                <TabsTrigger value="today">
                  Today ({todaysTasks.length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed ({completedTasks.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Active Tasks</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {incompleteTasks.length > 0 ? (
                      incompleteTasks.map((task: any) => (
                        <TaskItem key={task.id} task={task} />
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No active tasks</p>
                        <p className="text-sm">Create your first task to get started!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="today" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Today's Tasks</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {todaysTasks.length > 0 ? (
                      todaysTasks.map((task: any) => (
                        <TaskItem key={task.id} task={task} />
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No tasks for today</p>
                        <p className="text-sm">Add due dates to tasks to see them here!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="completed" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Completed Tasks</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {completedTasks.length > 0 ? (
                      completedTasks.map((task: any) => (
                        <TaskItem key={task.id} task={task} />
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No completed tasks yet</p>
                        <p className="text-sm">Complete some tasks to see them here!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* AI Features - Now Available for Testing */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5" />
              AI Features (Testing Mode)
              <Badge variant="secondary" className="text-xs">Free Testing</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-auto p-4 text-left justify-start">
                    <div className="flex items-center gap-3">
                      <Brain className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="font-medium">Smart Reminders</div>
                        <div className="text-sm text-muted-foreground">AI-optimized reminder timing</div>
                      </div>
                    </div>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Smart Reminder Recalibration</DialogTitle>
                  </DialogHeader>
                  <SmartReminderRecalibration />
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-auto p-4 text-left justify-start">
                    <div className="flex items-center gap-3">
                      <Repeat className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="font-medium">Recurring Tasks</div>
                        <div className="text-sm text-muted-foreground">Auto-generate task patterns</div>
                      </div>
                    </div>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Recurring Task Generator & Tuner</DialogTitle>
                  </DialogHeader>
                  <RecurringTaskGeneratorTuner />
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-auto p-4 text-left justify-start">
                    <div className="flex items-center gap-3">
                      <Trash className="h-5 w-5 text-orange-500" />
                      <div>
                        <div className="font-medium">Task Cleanup</div>
                        <div className="text-sm text-muted-foreground">Identify stale tasks</div>
                      </div>
                    </div>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Task Decay & Declutter</DialogTitle>
                  </DialogHeader>
                  <TaskDecayDeclutter />
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-auto p-4 text-left justify-start">
                    <div className="flex items-center gap-3">
                      <Heart className="h-5 w-5 text-pink-500" />
                      <div>
                        <div className="font-medium">Mood Suggestions</div>
                        <div className="text-sm text-muted-foreground">Context-aware recommendations</div>
                      </div>
                    </div>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Mood-Aware Task Suggestions</DialogTitle>
                  </DialogHeader>
                  <MoodAwareTaskSuggestions />
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-auto p-4 text-left justify-start">
                    <div className="flex items-center gap-3">
                      <Award className="h-5 w-5 text-purple-500" />
                      <div>
                        <div className="font-medium">Goal Tracking</div>
                        <div className="text-sm text-muted-foreground">Align tasks with objectives</div>
                      </div>
                    </div>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Goal Tracking & Alignment</DialogTitle>
                  </DialogHeader>
                  <GoalTrackingAlignment />
                </DialogContent>
              </Dialog>

              <Button 
                variant="outline" 
                className="h-auto p-4 text-left justify-start"
                onClick={() => window.open('/advanced', '_blank')}
              >
                <div className="flex items-center gap-3">
                  <BarChart className="h-5 w-5 text-indigo-500" />
                  <div>
                    <div className="font-medium">Insights Dashboard</div>
                    <div className="text-sm text-muted-foreground">Productivity analytics</div>
                  </div>
                </div>
              </Button>
            </div>
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              All AI features are temporarily unlocked for testing. Try them out and share your feedback!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}