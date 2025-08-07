import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { Task } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

interface CategoryProgress {
  category: string;
  completed: number;
  total: number;
  percentage: number;
}

export default function TaskProgressRadar() {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [smartCategories, setSmartCategories] = useState<Map<string, string>>(new Map());
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: tasksResponse } = useQuery({
    queryKey: ['/api/tasks'],
  });

  const tasks: Task[] = (tasksResponse as any)?.tasks || [];

  // AI-powered task categorization for tasks without categories
  const analyzeTaskCategories = async (tasksToAnalyze: Task[]) => {
    if (tasksToAnalyze.length === 0) return;
    
    setIsAnalyzing(true);
    try {
      const response = await apiRequest('POST', '/api/ai/categorize-tasks', {
        tasks: tasksToAnalyze.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description,
          currentCategory: t.category
        }))
      });
      const data = await response.json();
      
      if (data.categorizations) {
        const newCategories = new Map();
        data.categorizations.forEach((cat: any) => {
          newCategories.set(cat.taskId, cat.suggestedCategory);
        });
        setSmartCategories(newCategories);
      }
    } catch (error) {
      console.error('Failed to analyze task categories:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Analyze tasks without categories when component mounts or tasks change
  useEffect(() => {
    const uncategorizedTasks = tasks.filter(task => !task.category || task.category === 'other');
    if (uncategorizedTasks.length > 0) {
      analyzeTaskCategories(uncategorizedTasks);
    }
  }, [tasks.length]);

  // Calculate progress by category using smart AI categorization
  const calculateCategoryProgress = (): CategoryProgress[] => {
    const categoryMap = new Map<string, { completed: number; total: number }>();
    
    // Default categories
    const defaultCategories = ['work', 'personal', 'health', 'learning', 'creative', 'communication'];
    defaultCategories.forEach(cat => {
      categoryMap.set(cat, { completed: 0, total: 0 });
    });

    // Count tasks by category (use AI suggestion if available)
    tasks.forEach(task => {
      let category = task.category;
      
      // Use AI-suggested category if task doesn't have one or is 'other'
      if ((!category || category === 'other') && smartCategories.has(task.id)) {
        category = smartCategories.get(task.id);
      }
      
      // Fallback to 'personal' for uncategorized tasks
      if (!category || category === 'other') {
        category = 'personal';
      }
      
      const current = categoryMap.get(category) || { completed: 0, total: 0 };
      
      current.total += 1;
      if (task.completed) {
        current.completed += 1;
      }
      
      categoryMap.set(category, current);
    });

    // Only return categories that have tasks
    return Array.from(categoryMap.entries())
      .filter(([_, data]) => data.total > 0)
      .map(([category, data]) => ({
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
          {isAnalyzing && (
            <span className="text-xs bg-gradient-to-r from-purple-500 to-teal-500 bg-clip-text text-transparent">
              ✨ AI Analyzing...
            </span>
          )}
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
        
        {/* Clean Legend - Matching reference design */}
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