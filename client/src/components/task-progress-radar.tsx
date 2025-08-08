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

  // Calculate progress by core categories with smart mapping
  const calculateCategoryProgress = (): CategoryProgress[] => {
    // Core predefined categories that ensure consistent chart display
    const coreCategories = {
      'work': ['work', 'business', 'project', 'meeting', 'career', 'professional'],
      'personal': ['personal', 'family', 'home', 'lifestyle', 'social'],
      'health': ['health', 'fitness', 'exercise', 'wellness', 'medical', 'workout'],
      'learning': ['learning', 'education', 'study', 'course', 'skill', 'reading', 'research'],
      'creative': ['creative', 'art', 'design', 'writing', 'music', 'hobby'],
      'other': ['other', 'misc', 'miscellaneous']
    };
    
    const categoryMap = new Map<string, { completed: number; total: number }>();
    
    // Initialize core categories
    Object.keys(coreCategories).forEach(cat => {
      categoryMap.set(cat, { completed: 0, total: 0 });
    });

    // Smart mapping function to assign tasks to core categories
    const mapToCoreCategory = (taskCategory: string | null): string => {
      if (!taskCategory) return 'other';
      
      const lowerCategory = taskCategory.toLowerCase();
      
      // Find matching core category
      for (const [coreKey, keywords] of Object.entries(coreCategories)) {
        if (keywords.some(keyword => lowerCategory.includes(keyword))) {
          return coreKey;
        }
      }
      
      return 'other';
    };

    // Count tasks by mapped core categories
    tasks.forEach(task => {
      const coreCategory = mapToCoreCategory(task.category);
      const current = categoryMap.get(coreCategory)!;
      
      current.total += 1;
      if (task.completed) {
        current.completed += 1;
      }
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
    <Card className="border-0 shadow-sm bg-white dark:bg-gray-900">
      <CardHeader className="pb-4 pt-6 px-6">
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          📊 Task Progress
        </CardTitle>
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
        
        {/* Clean Legend - Original design */}
        <div className="mt-4 grid grid-cols-2 gap-y-3 gap-x-6">
          {radarData.map((item) => (
            <div 
              key={item.category}
              className="flex items-center gap-2"
            >
              <div className="w-2 h-2 rounded-full bg-teal-600" />
              <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                {item.category}
              </span>
              <span className="text-sm font-medium text-teal-600 dark:text-teal-400">
                {item.percentage}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}