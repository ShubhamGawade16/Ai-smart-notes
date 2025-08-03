import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Target, Clock, CheckCircle2 } from 'lucide-react';

interface ProgressData {
  completed: number;
  total: number;
  categories: {
    work: number;
    personal: number;
    health: number;
    learning: number;
    creative: number;
    other: number;
  };
  todayCompleted: number;
  todayTotal: number;
}

export function CircularProgressChart() {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  
  const { data: tasksResponse } = useQuery({
    queryKey: ['/api/tasks'],
  });

  const { data: todayResponse } = useQuery({
    queryKey: ['/api/tasks/today'],
  });

  const allTasks = (tasksResponse as any)?.tasks || [];
  const todayTasks = Array.isArray(todayResponse) ? todayResponse : [];
  
  const progressData: ProgressData = {
    completed: allTasks.filter((task: any) => task.completed).length,
    total: allTasks.length,
    categories: {
      work: allTasks.filter((task: any) => task.category === 'work').length,
      personal: allTasks.filter((task: any) => task.category === 'personal').length,
      health: allTasks.filter((task: any) => task.category === 'health').length,
      learning: allTasks.filter((task: any) => task.category === 'learning').length,
      creative: allTasks.filter((task: any) => task.category === 'creative').length,
      other: allTasks.filter((task: any) => !task.category || task.category === 'other').length,
    },
    todayCompleted: todayTasks.filter((task: any) => task.completed).length,
    todayTotal: todayTasks.length,
  };

  const completionPercentage = progressData.total > 0 ? (progressData.completed / progressData.total) * 100 : 0;
  const todayPercentage = progressData.todayTotal > 0 ? (progressData.todayCompleted / progressData.todayTotal) * 100 : 0;

  // Animate progress on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(completionPercentage);
    }, 500);
    return () => clearTimeout(timer);
  }, [completionPercentage]);

  const CircularProgress = ({ percentage, size = 120, strokeWidth = 8, color = "#0891b2" }: {
    percentage: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
  }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{
              filter: 'drop-shadow(0 0 6px rgba(8, 145, 178, 0.3))'
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {Math.round(percentage)}%
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Complete
          </span>
        </div>
      </div>
    );
  };

  const categoryColors = {
    work: '#3b82f6',
    personal: '#f59e0b',
    health: '#10b981',
    learning: '#8b5cf6',
    creative: '#f97316',
    other: '#6b7280'
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="w-5 h-5 text-teal-600" />
          Progress Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Progress Circle */}
        <div className="flex flex-col items-center space-y-4">
          <CircularProgress 
            percentage={animatedProgress} 
            size={140} 
            strokeWidth={10}
            color="#0891b2"
          />
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {progressData.completed} of {progressData.total} tasks completed
            </p>
          </div>
        </div>

        {/* Today's Progress */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-teal-600" />
            <span className="text-sm font-medium">Today's Goal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-teal-600 transition-all duration-1000 ease-out"
                style={{ width: `${todayPercentage}%` }}
              />
            </div>
            <span className="text-sm font-semibold">
              {progressData.todayCompleted}/{progressData.todayTotal}
            </span>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Categories
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(progressData.categories).map(([category, count]) => (
              count > 0 && (
                <div key={category} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/30 rounded">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: categoryColors[category as keyof typeof categoryColors] }}
                    />
                    <span className="text-xs capitalize">{category}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {count}
                  </Badge>
                </div>
              )
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="text-lg font-bold text-teal-600">
              {progressData.total - progressData.completed}
            </div>
            <div className="text-xs text-gray-500">Remaining</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {progressData.completed}
            </div>
            <div className="text-xs text-gray-500">Completed</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}