import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { Task } from '@shared/schema';

interface CategoryProgress {
  category: string;
  completed: number;
  total: number;
  percentage: number;
}

export default function TaskProgressRadar() {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const { data: tasksResponse } = useQuery({
    queryKey: ['/api/tasks'],
  });

  const tasks: Task[] = (tasksResponse as any)?.tasks || [];

  // Calculate progress by category
  const calculateCategoryProgress = (): CategoryProgress[] => {
    const categoryMap = new Map<string, { completed: number; total: number }>();
    
    // Default categories
    const defaultCategories = ['work', 'personal', 'health', 'learning', 'creative', 'other'];
    defaultCategories.forEach(cat => {
      categoryMap.set(cat, { completed: 0, total: 0 });
    });

    // Count tasks by category
    tasks.forEach(task => {
      const category = task.category || 'other';
      const current = categoryMap.get(category) || { completed: 0, total: 0 };
      
      current.total += 1;
      if (task.completed) {
        current.completed += 1;
      }
      
      categoryMap.set(category, current);
    });

    // Convert to array format for radar chart
    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      completed: data.completed,
      total: data.total,
      percentage: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0
    }));
  };

  const radarData = calculateCategoryProgress();

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-gray-100">{data.category}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Progress: {data.percentage}%
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {data.completed} of {data.total} tasks
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          📊 Task Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <ResponsiveContainer width="100%" height={240}>
          <RadarChart data={radarData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <PolarGrid 
              stroke="#0d9488" 
              strokeOpacity={0.3}
              strokeDasharray="2 2"
              radialLines={true}
            />
            <PolarAngleAxis 
              dataKey="category" 
              tick={{ fill: '#374151', fontSize: 13, fontWeight: 600 }}
              className="text-gray-700 dark:text-gray-300"
            />
            <PolarRadiusAxis 
              domain={[0, 100]} 
              tick={{ fill: '#6b7280', fontSize: 11 }}
              tickCount={4}
              axisLine={false}
            />
            <Radar
              name="Progress"
              dataKey="percentage"
              stroke="#0d9488"
              fill="#0d9488"
              fillOpacity={0.4}
              strokeWidth={3}
              dot={{ fill: '#0d9488', strokeWidth: 2, r: 4 }}
              onMouseEnter={(data) => setHoveredCategory(data.category)}
              onMouseLeave={() => setHoveredCategory(null)}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
        
        {/* Compact Legend */}
        <div className="mt-3 grid grid-cols-2 gap-1">
          {radarData.map((item) => (
            <div 
              key={item.category}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all duration-200 ${
                hoveredCategory === item.category 
                  ? 'bg-teal-100 dark:bg-teal-900/30 scale-105' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-teal-600 shadow-sm" />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200 flex-1">
                {item.category}
              </span>
              <span className={`text-sm font-bold ${
                item.percentage > 0 ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400'
              }`}>
                {item.percentage}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}