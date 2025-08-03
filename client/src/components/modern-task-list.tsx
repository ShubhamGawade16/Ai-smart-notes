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
  Plus,
  Clock,
  ChevronDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModernTaskItem } from "./modern-task-item";
import { SmartTaskInput } from "./SmartTaskInput";
import { SmartTiming } from "./smart-timing";
import type { Task } from "@shared/schema";

interface ModernTaskListProps {
  onAdvancedView?: (task: Task) => void;
  onTaskCompleted?: () => void;
}

export function ModernTaskList({ onAdvancedView, onTaskCompleted }: ModernTaskListProps) {
  const [activeTab, setActiveTab] = useState("today");
  const [showSmartInput, setShowSmartInput] = useState(false);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [filterBy, setFilterBy] = useState<string>("all");

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
    let tasks: Task[] = [];
    switch (activeTab) {
      case "today":
        tasks = todayTasks;
        break;
      case "all":
        tasks = incompleteTasks;
        break;
      case "completed":
        tasks = completedTasks;
        break;
      default:
        tasks = [];
    }
    
    // Apply filtering
    let filteredTasks = Array.isArray(tasks) ? tasks : [];
    if (filterBy !== "all") {
      filteredTasks = filteredTasks.filter((task: Task) => {
        switch (filterBy) {
          case "high":
            return task.priority === "high";
          case "medium":
            return task.priority === "medium";
          case "low":
            return task.priority === "low";
          case "work":
            return task.category === "work";
          case "personal":
            return task.category === "personal";
          case "health":
            return task.category === "health";
          case "learning":
            return task.category === "learning";
          default:
            return true;
        }
      });
    }
    
    // Apply sorting
    const sortedTasks = [...filteredTasks].sort((a: Task, b: Task) => {
      switch (sortBy) {
        case "priority":
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          return bPriority - aPriority;
        case "alphabetical":
          return a.title.localeCompare(b.title);
        case "dueDate":
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case "oldest":
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case "newest":
        default:
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
    });
    
    return sortedTasks;
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
      case "smart-timing":
        return <Clock className="w-4 h-4" />;
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
    <Card className="border-0 shadow-sm bg-gray-50 dark:bg-gray-900 flex-1">
      <CardHeader className="pb-3 pt-4 px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Tasks</CardTitle>
          <div className="flex items-center gap-2">
            {/* Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-8 border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 ${
                    filterBy !== "all" ? "bg-teal-50 border-teal-300 text-teal-700 dark:bg-teal-900/20 dark:border-teal-600 dark:text-teal-300" : ""
                  }`}
                >
                  <Filter className="w-4 h-4 mr-1" />
                  {filterBy !== "all" ? `Filtered` : "Filter"}
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilterBy("all")}>
                  All Tasks
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterBy("high")}>
                  High Priority
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterBy("medium")}>
                  Medium Priority
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterBy("low")}>
                  Low Priority
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterBy("work")}>
                  Work Category
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterBy("personal")}>
                  Personal Category
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterBy("health")}>
                  Health Category
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterBy("learning")}>
                  Learning Category
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-8 border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 ${
                    sortBy !== "newest" ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/20 dark:border-blue-600 dark:text-blue-300" : ""
                  }`}
                >
                  <SortAsc className="w-4 h-4 mr-1" />
                  {sortBy !== "newest" ? `Sorted` : "Sort"}
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy("newest")}>
                  Newest First
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("oldest")}>
                  Oldest First
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("priority")}>
                  By Priority
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("alphabetical")}>
                  Alphabetical
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("dueDate")}>
                  By Due Date
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-6 pb-2 space-y-3">
        {/* Tab Navigation - Clean toggle design */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-50 dark:bg-gray-800/50 p-1 rounded-lg">
            <TabsTrigger 
              value="today" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white rounded-md px-3 py-2 transition-all"
            >
              {getTabIcon("today")}
              <span className="font-medium">Today</span>
            </TabsTrigger>
            <TabsTrigger 
              value="all"
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white rounded-md px-3 py-2 transition-all"
            >
              {getTabIcon("all")}
              <span className="font-medium">All</span>
            </TabsTrigger>
            <TabsTrigger 
              value="completed"
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white rounded-md px-3 py-2 transition-all"
            >
              {getTabIcon("completed")}
              <span className="font-medium">Done</span>
            </TabsTrigger>
            <TabsTrigger 
              value="smart-timing"
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white rounded-md px-3 py-2 transition-all"
            >
              {getTabIcon("smart-timing")}
              <span className="font-medium">Smart Timing</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <TabsContent value={activeTab} className="mt-4">
            {/* Smart Timing Tab */}
            {activeTab === "smart-timing" ? (
              <SmartTiming />
            ) : (
              <>
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
                    className="w-full h-12 border-dashed border-2 hover:border-solid transition-all bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100/50 dark:hover:bg-gray-700/50"
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
                    onTaskCompleted={onTaskCompleted}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  {getTabIcon(activeTab)}
                </div>
                <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {emptyState.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {emptyState.description}
                </p>
                {activeTab !== "completed" && (
                  <Button
                    onClick={() => setShowSmartInput(true)}
                    className="mx-auto"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add your first task
                  </Button>
                )}
              </div>
            )}
                </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}