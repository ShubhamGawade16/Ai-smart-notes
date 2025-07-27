import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, CheckSquare, Clock, Brain, Target, Settings, BarChart3 } from "lucide-react";
import { SimpleTaskEditor } from "@/components/simple-task-editor";
import { CleanHeader } from "@/components/clean-header";
import { TaskItem } from "@/components/task-item";
import { Link } from "wouter";
import type { Task } from "@shared/schema";

export function SimplifiedDashboard() {
  const [activeView, setActiveView] = useState<'today' | 'all' | 'completed'>('today');

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
  const incompleteTasks = allTasks.filter((task: any) => !task.completed);
  const completedTasks = allTasks.filter((task: any) => task.completed);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <CleanHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-16 bg-muted rounded-xl"></div>
            <div className="h-96 bg-muted rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  const currentTasks = activeView === 'today' ? todaysTasks : 
                     activeView === 'all' ? incompleteTasks : completedTasks;

  return (
    <div className="min-h-screen bg-background">
      <CleanHeader />
      
      {/* Main Container */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Your Tasks</h1>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-xs">
                {incompleteTasks.length} active
              </Badge>
              <Badge variant="outline" className="text-xs">
                {completedTasks.length} completed
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href="/advanced">
              <Button variant="outline" size="sm">
                <Brain className="h-4 w-4 mr-2" />
                AI Tools
              </Button>
            </Link>
            <SimpleTaskEditor
              task={{} as any}
              isCreating={true}
              trigger={
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              }
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="cursor-pointer transition-colors hover:bg-muted/50" onClick={() => setActiveView('today')}>
            <CardContent className="p-4 text-center">
              <Clock className={`h-5 w-5 mx-auto mb-2 ${activeView === 'today' ? 'text-blue-600' : 'text-muted-foreground'}`} />
              <div className="text-lg font-semibold">{todaysTasks.length}</div>
              <div className="text-xs text-muted-foreground">Today</div>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer transition-colors hover:bg-muted/50" onClick={() => setActiveView('all')}>
            <CardContent className="p-4 text-center">
              <Target className={`h-5 w-5 mx-auto mb-2 ${activeView === 'all' ? 'text-orange-600' : 'text-muted-foreground'}`} />
              <div className="text-lg font-semibold">{incompleteTasks.length}</div>
              <div className="text-xs text-muted-foreground">All Tasks</div>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer transition-colors hover:bg-muted/50" onClick={() => setActiveView('completed')}>
            <CardContent className="p-4 text-center">
              <CheckSquare className={`h-5 w-5 mx-auto mb-2 ${activeView === 'completed' ? 'text-green-600' : 'text-muted-foreground'}`} />
              <div className="text-lg font-semibold">{completedTasks.length}</div>
              <div className="text-xs text-muted-foreground">Done</div>
            </CardContent>
          </Card>
        </div>

        {/* Task List */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              {activeView === 'today' && <Clock className="h-5 w-5 text-blue-600" />}
              {activeView === 'all' && <Target className="h-5 w-5 text-orange-600" />}
              {activeView === 'completed' && <CheckSquare className="h-5 w-5 text-green-600" />}
              {activeView === 'today' ? "Today's Focus" : 
               activeView === 'all' ? "All Tasks" : "Completed Tasks"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentTasks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  {activeView === 'today' && <Clock className="h-8 w-8" />}
                  {activeView === 'all' && <Target className="h-8 w-8" />}
                  {activeView === 'completed' && <CheckSquare className="h-8 w-8" />}
                </div>
                <p className="text-sm">
                  {activeView === 'today' ? "No tasks scheduled for today" :
                   activeView === 'all' ? "No active tasks" : "No completed tasks yet"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {currentTasks.map((task: any, index: number) => (
                  <div key={task.id || index} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                    <TaskItem task={task} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <Link href="/advanced">
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="p-4 text-center">
                <Brain className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <div className="font-medium text-sm mb-1">AI Features</div>
                <div className="text-xs text-muted-foreground">Smart reminders, insights & more</div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/settings">
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="p-4 text-center">
                <Settings className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                <div className="font-medium text-sm mb-1">Settings</div>
                <div className="text-xs text-muted-foreground">Preferences & integrations</div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}