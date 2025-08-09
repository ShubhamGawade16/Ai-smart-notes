import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  ChevronDown,
  Sparkles,
  Settings,
  Edit
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
import AdvancedTaskEditor from "./advanced-task-editor";
import type { Task } from "@shared/schema";

interface ModernTaskListProps {
  onAdvancedView?: (task: Task) => void;
  onTaskCompleted?: () => void;
  onAiView?: () => void;
}

export function ModernTaskList({ onAdvancedView, onTaskCompleted, onAiView }: ModernTaskListProps) {
  const [activeTab, setActiveTab] = useState("today");
  const [showSmartInput, setShowSmartInput] = useState(false);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [filterBy, setFilterBy] = useState<string>("all");
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isAdvancedEditorOpen, setIsAdvancedEditorOpen] = useState(false);
  
  const queryClient = useQueryClient();

  const { data: tasksResponse } = useQuery({
    queryKey: ['/api/tasks'],
  });

  const { data: todayResponse } = useQuery({
    queryKey: ['/api/tasks/today'],
    refetchInterval: 60000, // Refresh every minute
    refetchIntervalInBackground: true,
  });

  const allTasks: Task[] = (tasksResponse as any)?.tasks || [];
  const todayTasks: Task[] = Array.isArray(todayResponse) ? todayResponse : [];
  
  // Auto-refresh system for day transitions and regular updates
  useEffect(() => {
    const now = new Date();
    
    // Calculate milliseconds until next midnight
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    // Set up midnight refresh
    const midnightTimeout = setTimeout(() => {
      console.log('Day changed - refreshing today\'s tasks');
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      setLastRefresh(new Date());
      
      // Continue refreshing every 24 hours
      const dailyInterval = setInterval(() => {
        console.log('Daily refresh - updating today\'s tasks');
        queryClient.invalidateQueries({ queryKey: ['/api/tasks/today'] });
        queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
        setLastRefresh(new Date());
      }, 24 * 60 * 60 * 1000); // 24 hours
      
      return () => clearInterval(dailyInterval);
    }, msUntilMidnight);
    
    // Regular refresh every 5 minutes when today tab is active
    const regularInterval = setInterval(() => {
      if (activeTab === 'today') {
        console.log('Regular refresh - updating today\'s tasks');
        queryClient.invalidateQueries({ queryKey: ['/api/tasks/today'] });
        setLastRefresh(new Date());
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => {
      clearTimeout(midnightTimeout);
      clearInterval(regularInterval);
    };
  }, [activeTab, queryClient]);

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
          description: "Great! You're all caught up for today. Add new tasks or check back tomorrow."
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
    <Card className="border-0 shadow-sm bg-white/50 dark:bg-gray-900/50 flex-1 backdrop-blur-sm">
      <CardHeader className="pb-3 pt-4 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Tasks</CardTitle>
            {activeTab === 'today' && (
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" title="Auto-refreshing" />
                <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                  {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Create New Task Button */}
            <Button
              variant="default"
              size="sm"
              className="h-9 sm:h-8 bg-teal-600 hover:bg-teal-700 text-white px-3 sm:px-4 min-h-[44px] sm:min-h-0 text-sm font-medium rounded-lg shadow-sm"
              onClick={() => setIsAdvancedEditorOpen(true)}
              title="Create New Task"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">New</span>
              <span className="sm:hidden">Add</span>
            </Button>
            
            {/* Action Buttons Group */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-9 sm:h-8 sm:w-8 p-0 border-gray-200 dark:border-gray-700 min-h-[44px] sm:min-h-0 hover:border-purple-300 dark:hover:border-purple-600 rounded-lg"
                onClick={onAiView}
                title="AI View"
              >
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-9 sm:h-8 sm:w-8 p-0 border-gray-200 dark:border-gray-700 min-h-[44px] sm:min-h-0 hover:border-gray-300 dark:hover:border-gray-600 rounded-lg"
                onClick={() => {
                  if (safeTaskList.length > 0) {
                    onAdvancedView?.(safeTaskList[0]);
                  }
                }}
                title="Advanced View"
              >
                <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </Button>
            </div>
            {/* Filter & Sort Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`h-9 sm:h-8 px-3 border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 rounded-lg ${
                      filterBy !== "all" ? "bg-teal-50 border-teal-300 text-teal-700 dark:bg-teal-900/20 dark:border-teal-600 dark:text-teal-300" : ""
                    }`}
                  >
                    <Filter className="w-4 h-4 mr-1.5" />
                    <span className="hidden sm:inline">{filterBy !== "all" ? "Filtered" : "Filter"}</span>
                    <span className="sm:hidden">Filter</span>
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
                    className={`h-9 sm:h-8 px-3 border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 rounded-lg ${
                      sortBy !== "newest" ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/20 dark:border-blue-600 dark:text-blue-300" : ""
                    }`}
                  >
                    <SortAsc className="w-4 h-4 mr-1.5" />
                    <span className="hidden sm:inline">{sortBy !== "newest" ? "Sorted" : "Sort"}</span>
                    <span className="sm:hidden">Sort</span>
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
        </div>
      </CardHeader>

      <CardContent className="px-4 sm:px-6 pb-2 space-y-4">
        {/* Tab Navigation - Clean toggle design */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100/60 dark:bg-gray-800/60 p-1 rounded-xl h-10 sm:h-9">
            <TabsTrigger 
              value="today" 
              className="flex items-center gap-1.5 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white rounded-lg px-2 py-1.5 transition-all text-sm font-medium"
            >
              {getTabIcon("today")}
              <span className="hidden sm:inline">Today</span>
              <span className="sm:hidden">Today</span>
            </TabsTrigger>
            <TabsTrigger 
              value="all"
              className="flex items-center gap-1.5 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white rounded-lg px-2 py-1.5 transition-all text-sm font-medium"
            >
              {getTabIcon("all")}
              <span className="hidden sm:inline">All</span>
              <span className="sm:hidden">All</span>
            </TabsTrigger>
            <TabsTrigger 
              value="completed"
              className="flex items-center gap-1.5 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white rounded-lg px-2 py-1.5 transition-all text-sm font-medium"
            >
              {getTabIcon("completed")}
              <span className="hidden sm:inline">Done</span>
              <span className="sm:hidden">Done</span>
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
                      className="w-full h-9 text-sm border-gray-300 dark:border-gray-600"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setShowSmartInput(true)}
                    className="w-full h-12 border-dashed border-2 hover:border-solid transition-all bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-xl"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    <span className="font-medium">Add a new task</span>
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
              <div className="text-center py-8 sm:py-6">
                <div className="w-14 h-14 sm:w-12 sm:h-12 mx-auto mb-4 sm:mb-3 rounded-full bg-gray-100/80 dark:bg-gray-800/80 flex items-center justify-center">
                  {getTabIcon(activeTab)}
                </div>
                <h3 className="text-lg sm:text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {emptyState.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 sm:mb-4 max-w-xs mx-auto">
                  {emptyState.description}
                </p>
                {activeTab !== "completed" && (
                  <Button
                    onClick={() => setShowSmartInput(true)}
                    className="mx-auto bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg shadow-sm"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    <span className="font-medium">Add your first task</span>
                  </Button>
                )}
              </div>
            )}
                </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      {/* Advanced Task Editor */}
      <AdvancedTaskEditor
        task={null}
        isOpen={isAdvancedEditorOpen}
        onClose={() => setIsAdvancedEditorOpen(false)}
        onSave={(newTask) => {
          console.log('New task created:', newTask);
          setIsAdvancedEditorOpen(false);
        }}
      />
    </Card>
  );
}