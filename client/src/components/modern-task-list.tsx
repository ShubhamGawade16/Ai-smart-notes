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
          <div className="flex items-center gap-3">
            {/* Create New Task Button */}
            <Button
              variant="default"
              size="sm"
              className="h-10 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white px-4 min-h-[44px] sm:min-h-0 text-sm font-medium rounded-xl shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
              onClick={() => setIsAdvancedEditorOpen(true)}
              title="Create New Task"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span>Add Task</span>
            </Button>
            
            {/* Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-10 px-4 border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 rounded-xl transition-all duration-200 active:scale-95 ${
                    filterBy !== "all" ? "bg-teal-50 border-teal-300 text-teal-700 dark:bg-teal-900/20 dark:border-teal-600 dark:text-teal-300" : ""
                  }`}
                >
                  <Filter className="w-4 h-4 mr-2" />
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
                  className={`h-10 px-4 border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 rounded-xl transition-all duration-200 active:scale-95 ${
                    sortBy !== "newest" ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/20 dark:border-blue-600 dark:text-blue-300" : ""
                  }`}
                >
                  <SortAsc className="w-4 h-4 mr-2" />
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
      </CardHeader>

      <CardContent className="px-4 sm:px-6 pb-2 space-y-4">
        {/* Tab Navigation - Clean toggle design */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100/80 dark:bg-gray-800/80 p-1.5 rounded-2xl h-12">
            <TabsTrigger 
              value="today" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-md dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white rounded-xl px-3 py-2 transition-all duration-200 text-sm font-medium hover:bg-white/50 dark:hover:bg-gray-700/50"
            >
              {getTabIcon("today")}
              <span>Today</span>
            </TabsTrigger>
            <TabsTrigger 
              value="all"
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-md dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white rounded-xl px-3 py-2 transition-all duration-200 text-sm font-medium hover:bg-white/50 dark:hover:bg-gray-700/50"
            >
              {getTabIcon("all")}
              <span>All</span>
            </TabsTrigger>
            <TabsTrigger 
              value="completed"
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-md dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white rounded-xl px-3 py-2 transition-all duration-200 text-sm font-medium hover:bg-white/50 dark:hover:bg-gray-700/50"
            >
              {getTabIcon("completed")}
              <span>Done</span>
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
                      className="w-full h-9 text-sm border-gray-300 dark:border-gray-600"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setShowSmartInput(true)}
                    className="w-full h-14 border-dashed border-2 hover:border-solid transition-all duration-200 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-teal-50/50 dark:hover:bg-teal-900/20 hover:border-teal-300 dark:hover:border-teal-600 rounded-2xl active:scale-98"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    <span className="font-medium">Add a new task</span>
                  </Button>
                )}
              </div>
            )}

            {/* Task List */}
            {safeTaskList.length > 0 ? (
              <div className="space-y-2 animate-fadeInUp">
                {safeTaskList.map((task: Task, index: number) => (
                  <div 
                    key={task.id}
                    className="stagger-item"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <ModernTaskItem 
                      task={task}
                      onUpdate={handleUpdateTask}
                      onDelete={handleDeleteTask}
                      onAdvancedView={onAdvancedView}
                      onTaskCompleted={onTaskCompleted}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 animate-fadeInUp">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/40 dark:to-teal-900/20 flex items-center justify-center shadow-lg">
                  {getTabIcon(activeTab)}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  {emptyState.title}
                </h3>
                <p className="text-base text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto leading-relaxed">
                  {emptyState.description}
                </p>
                {activeTab !== "completed" && (
                  <Button
                    onClick={() => setShowSmartInput(true)}
                    className="mx-auto bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 btn-feedback"
                    size="lg"
                  >
                    <Plus className="w-5 h-5 mr-3" />
                    <span className="font-semibold">Add your first task</span>
                  </Button>
                )}
              </div>
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