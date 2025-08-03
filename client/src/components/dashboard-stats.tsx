import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { Task } from "@shared/schema";

interface StatsData {
  completed: number;
  inProgress: number;
  notStarted: number;
  total: number;
}

export default function DashboardStats() {
  const { data: tasksResponse } = useQuery({
    queryKey: ['/api/tasks'],
  });

  const tasks: Task[] = (tasksResponse as any)?.tasks || [];

  const calculateStats = (): StatsData => {
    const completed = tasks.filter(task => task.completed).length;
    const total = tasks.length;
    const inProgress = tasks.filter(task => !task.completed && task.priority && task.priority !== 'low').length;
    const notStarted = total - completed - inProgress;

    return { completed, inProgress, notStarted, total };
  };

  const stats = calculateStats();

  const getPercentage = (value: number) => {
    return stats.total > 0 ? Math.round((value / stats.total) * 100) : 0;
  };

  const chartData = [
    { name: 'Completed', value: stats.completed, color: '#10b981' },
    { name: 'In Progress', value: stats.inProgress, color: '#3b82f6' },
    { name: 'Not Started', value: stats.notStarted, color: '#ef4444' }
  ];

  const CustomPieChart = ({ percentage, color }: { percentage: number, color: string }) => {
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = isNaN(percentage) ? circumference : circumference - (percentage / 100) * circumference;

    return (
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
          {/* Background circle */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="#e5e7eb"
            strokeWidth="6"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke={color}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset.toString()}
            style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {isNaN(percentage) ? '0' : percentage}%
          </span>
        </div>
      </div>
    );
  };

  return (
    <Card className="border-0 shadow-sm bg-white dark:bg-gray-900">
      <CardHeader className="pb-4 pt-6 px-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
            <span className="text-xs">📊</span>
          </div>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Task Status
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Completed */}
          <div className="text-center">
            <CustomPieChart percentage={getPercentage(stats.completed)} color="#10b981" />
            <div className="mt-2 flex items-center justify-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Completed</span>
            </div>
          </div>

          {/* In Progress */}
          <div className="text-center">
            <CustomPieChart percentage={getPercentage(stats.inProgress)} color="#3b82f6" />
            <div className="mt-2 flex items-center justify-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">In Progress</span>
            </div>
          </div>

          {/* Not Started */}
          <div className="text-center">
            <CustomPieChart percentage={getPercentage(stats.notStarted)} color="#ef4444" />
            <div className="mt-2 flex items-center justify-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Not Started</span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Completed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-gray-600 dark:text-gray-400">In Progress</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Not Started</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}