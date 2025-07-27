import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, CheckSquare, Clock, Target, Zap } from "lucide-react";
import { QuickAdd } from "@/components/quick-add";
import { TaskItem } from "@/components/task-item";
import { SimpleTaskEditor } from "@/components/simple-task-editor";
import type { Task } from "@shared/schema";

export function SimplifiedDashboard() {
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

  const incompleteTasks = tasks.tasks?.filter(task => !task.completed) || [];
  const completedTasks = tasks.tasks?.filter(task => task.completed) || [];

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
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">GPT Do</h1>
              <p className="text-sm text-muted-foreground">Smart Task Management</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-xs">
                {incompleteTasks.length} active tasks
              </Badge>
              <SimpleTaskEditor
                task={{} as any}
                isCreating={true}
                trigger={
                  <Button>
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
                      incompleteTasks.map((task) => (
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
                      todaysTasks.map((task) => (
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
                      completedTasks.map((task) => (
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

        {/* AI Features - Minimized */}
        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4" />
              AI Features Available
              <Badge variant="outline" className="text-xs">Pro</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Upgrade to unlock smart reminders, recurring task generation, productivity insights, and more AI-powered features.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}