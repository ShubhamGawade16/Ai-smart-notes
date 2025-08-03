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
      <CardHeader>
        <CardTitle className="text-lg">Task Progress by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData}>
            <PolarGrid 
              stroke="#e5e7eb" 
              strokeDasharray="3 3"
              radialLines={true}
            />
            <PolarAngleAxis 
              dataKey="category" 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              className="text-gray-600 dark:text-gray-400"
            />
            <PolarRadiusAxis 
              domain={[0, 100]} 
              tick={{ fill: '#6b7280', fontSize: 10 }}
              tickCount={5}
              axisLine={false}
            />
            <Radar
              name="Progress"
              dataKey="percentage"
              stroke="#0d9488"
              fill="#0d9488"
              fillOpacity={0.6}
              strokeWidth={2}
              onMouseEnter={(data) => setHoveredCategory(data.category)}
              onMouseLeave={() => setHoveredCategory(null)}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
        
        {/* Legend */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          {radarData.map((item) => (
            <div 
              key={item.category}
              className={`flex items-center gap-2 p-2 rounded transition-colors ${
                hoveredCategory === item.category ? 'bg-teal-50 dark:bg-teal-900/20' : ''
              }`}
            >
              <div className="w-3 h-3 rounded-full bg-teal-600" />
              <span className="text-gray-700 dark:text-gray-300">{item.category}</span>
              <span className="text-gray-500 dark:text-gray-400 ml-auto">{item.percentage}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}