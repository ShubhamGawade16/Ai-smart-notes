import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar } from "lucide-react";
import type { Task } from "@shared/schema";

export default function TodayTasks() {
  const { data: todayResponse } = useQuery({
    queryKey: ['/api/tasks/today'],
  });
  
  const { data: allTasksResponse } = useQuery({
    queryKey: ['/api/tasks'],
  });

  const todayTasks: Task[] = (todayResponse as any) || [];
  const allTasks: Task[] = (allTasksResponse as any)?.tasks || [];
  
  // Get tasks for today's date or recent tasks if none for today
  const getDisplayTasks = () => {
    if (todayTasks.length > 0) return todayTasks;
    // Show recent incomplete tasks
    return allTasks.filter(task => !task.completed).slice(0, 3);
  };

  const displayTasks = getDisplayTasks();
  const today = new Date();
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const getPriorityColor = (priority?: string | null) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (task: Task) => {
    if (task.completed) return 'text-green-600 bg-green-50';
    if (task.priority === 'urgent' || task.priority === 'high') return 'text-blue-600 bg-blue-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getStatusText = (task: Task) => {
    if (task.completed) return 'Completed';
    if (task.priority === 'urgent' || task.priority === 'high') return 'In Progress';
    return 'Not Started';
  };

  return (
    <Card className="border-0 shadow-sm bg-white dark:bg-gray-900">
      <CardHeader className="pb-4 pt-6 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
              <Calendar className="w-3 h-3" />
            </div>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              To-Do
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add task
          </Button>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
          <span>{formatDate(today)}</span>
          <span>•</span>
          <span>Today</span>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6 space-y-3">
        {displayTasks.length > 0 ? (
          displayTasks.map((task) => (
            <div
              key={task.id}
              className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {task.description}
                    </p>
                  )}
                </div>
                <div className="text-xs text-gray-400 ml-4">
                  {task.estimatedTime && `${task.estimatedTime}m`}
                </div>
              </div>
              
              {/* Task image placeholder */}
              {task.category && (
                <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-800 dark:to-teal-700 rounded-lg mb-3 flex items-center justify-center">
                  <span className="text-teal-600 dark:text-teal-400 text-xs font-medium">
                    {task.category.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                    Priority: {task.priority || 'Medium'}
                  </Badge>
                  <Badge variant="outline" className={`text-xs ${getStatusColor(task)}`}>
                    Status: {getStatusText(task)}
                  </Badge>
                </div>
                <div className="text-xs text-gray-400">
                  Created on: {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'Unknown'}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No tasks for today
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add your first task
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}