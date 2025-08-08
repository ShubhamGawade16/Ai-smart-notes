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

  // Calculate progress by category - dynamically using actual user categories
  const calculateCategoryProgress = (): CategoryProgress[] => {
    const categoryMap = new Map<string, { completed: number; total: number }>();
    
    // Extract actual categories from user tasks
    tasks.forEach(task => {
      const category = task.category || 'Uncategorized';
      const current = categoryMap.get(category) || { completed: 0, total: 0 };
      
      current.total += 1;
      if (task.completed) {
        current.completed += 1;
      }
      
      categoryMap.set(category, current);
    });

    // Convert to array and sort by total tasks (most used categories first)
    const categoryData = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category: category.charAt(0).toUpperCase() + category.slice(1),
        completed: data.completed,
        total: data.total,
        percentage: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0
      }))
      .sort((a, b) => b.total - a.total); // Sort by total tasks descending

    // If no tasks, show a placeholder
    if (categoryData.length === 0) {
      return [{
        category: 'No Tasks Yet',
        completed: 0,
        total: 0,
        percentage: 0
      }];
    }

    // Limit to top 8 categories to avoid cluttering
    return categoryData.slice(0, 8);
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
    <Card className="border-0 shadow-sm bg-white dark:bg-gray-900">
      <CardHeader className="pb-4 pt-6 px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            📊 Category Progress
          </CardTitle>
          {tasks.length > 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {tasks.filter(t => t.completed).length}/{tasks.length} completed
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
            <PolarGrid 
              stroke="#e5e7eb" 
              strokeDasharray="1 1"
              radialLines={true}
            />
            <PolarAngleAxis 
              dataKey="category" 
              tick={{ fill: '#374151', fontSize: 12, fontWeight: 500 }}
              className="text-gray-700 dark:text-gray-300"
            />
            <PolarRadiusAxis 
              domain={[0, 100]} 
              tick={false}
              tickCount={4}
              axisLine={false}
            />
            <Radar
              name="Progress"
              dataKey="percentage"
              stroke="#0d9488"
              fill="#0d9488"
              fillOpacity={0.15}
              strokeWidth={2}
              dot={{ fill: '#0d9488', strokeWidth: 0, r: 3 }}
              onMouseEnter={(data) => setHoveredCategory(data.category)}
              onMouseLeave={() => setHoveredCategory(null)}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
        
        {/* Enhanced Legend with task counts */}
        <div className="mt-4 space-y-3">
          {radarData.length === 1 && radarData[0].category === 'No Tasks Yet' ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Add some tasks to see your progress by category!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-y-3">
              {radarData.map((item) => (
                <div 
                  key={item.category}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    hoveredCategory === item.category 
                      ? 'bg-teal-50 dark:bg-teal-950/20' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full bg-teal-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                        {item.category}
                      </span>
                      <span className="text-sm font-bold text-teal-600 dark:text-teal-400 ml-2">
                        {item.percentage}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div 
                          className="bg-teal-600 h-1.5 rounded-full transition-all duration-300" 
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {item.completed}/{item.total}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}