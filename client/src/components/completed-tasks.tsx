import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import type { Task } from "@shared/schema";

export default function CompletedTasks() {
  const { data: tasksResponse } = useQuery({
    queryKey: ['/api/tasks'],
  });

  const tasks: Task[] = (tasksResponse as any)?.tasks || [];
  const completedTasks = tasks.filter(task => task.completed).slice(0, 4);

  const getTimeAgo = (date: string | Date | null) => {
    if (!date) return 'Unknown';
    const now = new Date();
    const taskDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInHours === 0) return 'Today';
    if (diffInHours === 1) return '1 day ago';
    if (diffInHours < 7) return `${diffInHours} days ago`;
    return taskDate.toLocaleDateString();
  };

  return (
    <Card className="border-0 shadow-sm bg-white dark:bg-gray-900">
      <CardHeader className="pb-4 pt-6 px-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Completed Task
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6 space-y-3">
        {completedTasks.length > 0 ? (
          completedTasks.map((task) => (
            <div
              key={task.id}
              className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {task.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs text-green-600 bg-green-50 border-green-200">
                      Status: Completed
                    </Badge>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Completed {getTimeAgo(task.updatedAt)}
                    </span>
                  </div>
                </div>

                {/* Task image placeholder */}
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-800 dark:to-green-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 dark:text-green-400 text-xs font-medium">
                    {task.category ? task.category.charAt(0).toUpperCase() : '✓'}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No completed tasks yet
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Complete some tasks to see them here
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}