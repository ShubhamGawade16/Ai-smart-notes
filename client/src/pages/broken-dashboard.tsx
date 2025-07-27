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
import { Header } from "@/components/header";
import type { Task } from "@shared/schema";

export function SimplifiedDashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userTier, setUserTier] = useState<'free' | 'pro'>('pro'); // Set to pro for testing
  const [dailyAiCalls, setDailyAiCalls] = useState(999); // Unlimited for testing
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

  const allTasks = (tasks as any)?.tasks || [];
  const incompleteTasks = allTasks.filter((task: any) => !task.completed) || [];
  const completedTasks = allTasks.filter((task: any) => task.completed) || [];

  // Progressive Disclosure: Show Goals only after 5 tasks created
  useEffect(() => {
    setTaskCount(allTasks.length || 0);
  }, [allTasks]);

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
    <div className="min-h-screen bg-background">
      {/* Add Header for navigation */}
      <Header />
      
      <div className="flex">
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
                <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm px-3 py-1">
                  All Features Free for Testing
                </Badge>
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

            {/* Main Content Tabs */}
            <Tabs defaultValue="today" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="today" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Today's Focus
                </TabsTrigger>
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  All Tasks
                </TabsTrigger>
                <TabsTrigger value="completed" className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Completed
                </TabsTrigger>
                <TabsTrigger value="ai-features" className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  AI Features
                </TabsTrigger>
              </TabsList>

              {/* Today's Focus Tab */}
              <TabsContent value="today" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-blue-500" />
                      Today's Priority Tasks
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {todaysTasks.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No tasks for today. Add one to get started!</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {todaysTasks.map((task: any) => (
                          <TaskItem key={task.id} task={task} />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* All Tasks Tab */}
              <TabsContent value="all" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>All Tasks</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {incompleteTasks.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No tasks yet. Create your first task to get started!</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {incompleteTasks.map((task: any) => (
                          <TaskItem key={task.id} task={task} />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Completed Tasks Tab */}
              <TabsContent value="completed" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-green-500" />
                      Completed Tasks
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {completedTasks.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No completed tasks yet. Complete some tasks to see them here!</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {completedTasks.map((task: any) => (
                          <TaskItem key={task.id} task={task} />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* AI Features Tab */}
              <TabsContent value="ai-features" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-500" />
                      AI-Powered Features
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    {/* Smart Reminder Recalibration */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="h-auto p-4 text-left justify-start">
                          <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-blue-500" />
                            <div>
                              <div className="font-medium">Smart Reminders</div>
                              <div className="text-sm text-muted-foreground">AI-powered reminder optimization</div>
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

                    {/* Recurring Task Generator */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="h-auto p-4 text-left justify-start">
                          <div className="flex items-center gap-3">
                            <Repeat className="h-5 w-5 text-green-500" />
                            <div>
                              <div className="font-medium">Recurring Tasks</div>
                              <div className="text-sm text-muted-foreground">Automatic task generation</div>
                            </div>
                          </div>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>Recurring Task Generator</DialogTitle>
                        </DialogHeader>
                        <RecurringTaskGeneratorTuner />
                      </DialogContent>
                    </Dialog>

                    {/* Task Decay Cleanup */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="h-auto p-4 text-left justify-start">
                          <div className="flex items-center gap-3">
                            <Trash className="h-5 w-5 text-red-500" />
                            <div>
                              <div className="font-medium">Task Decay Cleanup</div>
                              <div className="text-sm text-muted-foreground">Auto-archive old tasks</div>
                            </div>
                          </div>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>Task Decay Declutter</DialogTitle>
                        </DialogHeader>
                        <TaskDecayDeclutter />
                      </DialogContent>
                    </Dialog>

                    {/* Mood-Aware Suggestions */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="h-auto p-4 text-left justify-start">
                          <div className="flex items-center gap-3">
                            <Heart className="h-5 w-5 text-pink-500" />
                            <div>
                              <div className="font-medium">Mood-Aware Tasks</div>
                              <div className="text-sm text-muted-foreground">Tasks based on your mood</div>
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

                    {/* Goal Tracking */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="h-auto p-4 text-left justify-start">
                          <div className="flex items-center gap-3">
                            <Target className="h-5 w-5 text-orange-500" />
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

                    {/* Advanced Features Link */}
                    <Button 
                      variant="outline" 
                      className="h-auto p-4 text-left justify-start"
                      onClick={() => window.open('/advanced', '_blank')}
                    >
                      <div className="flex items-center gap-3">
                        <BarChart className="h-5 w-5 text-indigo-500" />
                        <div>
                          <div className="font-medium">Advanced Features</div>
                          <div className="text-sm text-muted-foreground">All AI productivity tools</div>
                        </div>
                      </div>
                    </Button>
                  </div>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mt-4">
                      All AI features are temporarily unlocked for testing. Try them out and share your feedback!
                    </p>
                  </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}