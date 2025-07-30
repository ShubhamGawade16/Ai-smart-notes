import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle2, 
  Circle, 
  Calendar,
  Filter,
  SortAsc,
  Plus
} from "lucide-react";
import { ModernTaskItem } from "./modern-task-item";
import { SmartTaskInput } from "./SmartTaskInput";
import type { Task } from "@shared/schema";

interface ModernTaskListProps {
  onAdvancedView?: (task: Task) => void;
}

export function ModernTaskList({ onAdvancedView }: ModernTaskListProps) {
  const [activeTab, setActiveTab] = useState("today");
  const [showSmartInput, setShowSmartInput] = useState(false);

  const { data: tasksResponse } = useQuery({
    queryKey: ['/api/tasks'],
  });

  const { data: todayResponse } = useQuery({
    queryKey: ['/api/tasks/today'],
  });

  const allTasks: Task[] = (tasksResponse as any)?.tasks || [];
  const todayTasks: Task[] = Array.isArray(todayResponse) ? todayResponse : [];

  const incompleteTasks = allTasks.filter((task: Task) => !task.completed);
  const completedTasks = allTasks.filter((task: Task) => task.completed);

  // Add task update and delete handlers
  const handleUpdateTask = (updatedTask: Task) => {
    console.log('Task updated:', updatedTask);
  };

  const handleDeleteTask = (taskId: string) => {
    console.log('Task deleted:', taskId);
  };

  const getTasksForTab = () => {
    switch (activeTab) {
      case "today":
        return todayTasks;
      case "all":
        return incompleteTasks;
      case "completed":
        return completedTasks;
      default:
        return [];
    }
  };

  const tasks = getTasksForTab();
  const safeTaskList = Array.isArray(tasks) ? tasks : [];

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case "today":
        return <Calendar className="w-4 h-4" />;
      case "all":
        return <Circle className="w-4 h-4" />;
      case "completed":
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getEmptyStateMessage = () => {
    switch (activeTab) {
      case "today":
        return {
          title: "No tasks for today",
          description: "Add your first task to get started with today's plan."
        };
      case "all":
        return {
          title: "No active tasks",
          description: "All caught up! Add a new task to stay productive."
        };
      case "completed":
        return {
          title: "No completed tasks",
          description: "Complete some tasks to see them here."
        };
      default:
        return {
          title: "No tasks",
          description: "Start by adding your first task."
        };
    }
  };

  const emptyState = getEmptyStateMessage();

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Tasks</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
            >
              <Filter className="w-4 h-4 mr-1" />
              Filter
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
            >
              <SortAsc className="w-4 h-4 mr-1" />
              Sort
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-800">
            <TabsTrigger value="today" className="flex items-center gap-2">
              {getTabIcon("today")}
              <span>Today</span>
              {Array.isArray(todayTasks) && todayTasks.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {todayTasks.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              {getTabIcon("all")}
              <span>All</span>
              {Array.isArray(incompleteTasks) && incompleteTasks.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {incompleteTasks.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              {getTabIcon("completed")}
              <span>Done</span>
              {Array.isArray(completedTasks) && completedTasks.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {completedTasks.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <TabsContent value={activeTab} className="mt-4">
            {/* Quick Add Button */}
            {activeTab !== "completed" && (
              <div className="mb-4">
                {showSmartInput ? (
                  <div className="space-y-3">
                    <SmartTaskInput 
                      onTaskCreated={() => setShowSmartInput(false)} 
                    />
                    <Button
                      variant="outline"
                      onClick={() => setShowSmartInput(false)}
                      className="w-full"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setShowSmartInput(true)}
                    className="w-full h-12 border-dashed border-2 hover:border-solid transition-all"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add a new task
                  </Button>
                )}
              </div>
            )}

            {/* Task List */}
            {safeTaskList.length > 0 ? (
              <div className="space-y-1">
                {safeTaskList.map((task: Task) => (
                  <ModernTaskItem 
                    key={task.id} 
                    task={task}
                    onUpdate={handleUpdateTask}
                    onDelete={handleDeleteTask}
                    onAdvancedView={onAdvancedView}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  {getTabIcon(activeTab)}
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {emptyState.title}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {emptyState.description}
                </p>
                {activeTab !== "completed" && (
                  <Button
                    onClick={() => setShowSmartInput(true)}
                    className="mx-auto"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add your first task
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}