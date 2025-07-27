import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Smile, Zap, Coffee, Brain, Clock, TrendingUp, Play, CheckCircle2 } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface MoodState {
  label: 'focused' | 'stressed' | 'calm' | 'energized' | 'tired';
  confidence: number;
  factors: string[];
}

interface MoodTask {
  id: string;
  title: string;
  description?: string;
  estimatedMinutes: number;
  priority: string;
  matchScore: number;
  reasoning: string;
}

export function MoodAwareTaskSuggestions() {
  const [currentMood, setCurrentMood] = useState<MoodState | null>(null);
  const { toast } = useToast();

  // Infer current mood state
  const { data: moodAnalysis, isLoading: moodLoading } = useQuery({
    queryKey: ['/api/ai/mood-inference'],
    queryFn: async () => {
      // Mock implementation - in production would analyze typing patterns, time of day, etc.
      const hour = new Date().getHours();
      const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
      
      // Simple mood inference based on time and patterns
      let moodState: MoodState;
      
      if (timeOfDay === 'morning') {
        moodState = {
          label: 'energized',
          confidence: 0.82,
          factors: ['Morning hours', 'Recent app engagement', 'Fast typing detected'],
        };
      } else if (timeOfDay === 'afternoon') {
        moodState = {
          label: 'focused',
          confidence: 0.75,
          factors: ['Afternoon productivity window', 'Consistent task completion'],
        };
      } else {
        moodState = {
          label: 'calm',
          confidence: 0.68,
          factors: ['Evening hours', 'Slower interaction pace'],
        };
      }
      
      return moodState;
    },
    refetchInterval: 600000, // Refresh every 10 minutes
  });

  // Get mood-matched task suggestions
  const { data: suggestedTasks } = useQuery({
    queryKey: ['/api/ai/mood-matched-tasks', currentMood?.label],
    queryFn: async () => {
      if (!currentMood) return [];
      
      // Mock implementation - in production would filter and rank tasks
      const mockTasks: MoodTask[] = [
        {
          id: '1',
          title: 'Review weekly metrics',
          description: 'Quick data analysis and insights',
          estimatedMinutes: 15,
          priority: 'medium',
          matchScore: 0.89,
          reasoning: 'Perfect for focused state - analytical work requiring attention to detail',
        },
        {
          id: '2',
          title: 'Send follow-up emails',
          description: 'Touch base with 3 clients',
          estimatedMinutes: 10,
          priority: 'high',
          matchScore: 0.85,
          reasoning: 'Quick communication tasks ideal for current energy level',
        },
        {
          id: '3',
          title: 'Organize desktop files',
          description: 'Clean up downloads and documents',
          estimatedMinutes: 20,
          priority: 'low',
          matchScore: 0.72,
          reasoning: 'Light organizational work suitable when feeling focused',
        },
      ];
      
      // Filter based on mood
      switch (currentMood.label) {
        case 'stressed':
          return mockTasks.filter(t => t.estimatedMinutes <= 10);
        case 'tired':
          return mockTasks.filter(t => t.priority === 'low');
        case 'energized':
          return mockTasks.filter(t => t.estimatedMinutes >= 15);
        default:
          return mockTasks;
      }
    },
    enabled: !!currentMood,
  });

  // Start a suggested task
  const startTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return apiRequest(`/api/tasks/${taskId}/start`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      toast({
        title: "Task Started",
        description: "Timer started for your mood-matched task. Stay focused!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    },
  });

  useEffect(() => {
    if (moodAnalysis) {
      setCurrentMood(moodAnalysis);
    }
  }, [moodAnalysis]);

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'focused': return <Brain className="h-5 w-5 text-blue-500" />;
      case 'stressed': return <Zap className="h-5 w-5 text-red-500" />;
      case 'calm': return <Smile className="h-5 w-5 text-green-500" />;
      case 'energized': return <Coffee className="h-5 w-5 text-orange-500" />;
      case 'tired': return <Clock className="h-5 w-5 text-gray-500" />;
      default: return <Brain className="h-5 w-5" />;
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'focused': return 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300';
      case 'stressed': return 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300';
      case 'calm': return 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300';
      case 'energized': return 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300';
      case 'tired': return 'bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-300';
      default: return 'bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-300';
    }
  };

  if (moodLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 animate-pulse" />
            Analyzing Your Current State...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Mood-Aware Task Suggestions
          <Badge variant="secondary" className="ml-2">
            Smart Matching
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Mood State */}
        {currentMood && (
          <div className="p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {getMoodIcon(currentMood.label)}
                <span className="font-medium capitalize">
                  Feeling {currentMood.label}
                </span>
                <Badge className={getMoodColor(currentMood.label)}>
                  {Math.round(currentMood.confidence * 100)}% confidence
                </Badge>
              </div>
            </div>
            
            <Progress value={currentMood.confidence * 100} className="h-2 mb-3" />
            
            <div className="space-y-1">
              <p className="text-sm font-medium">Based on:</p>
              <ul className="text-sm text-muted-foreground">
                {currentMood.factors.map((factor, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-current rounded-full" />
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Task Suggestions */}
        {suggestedTasks && suggestedTasks.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Suggested for Your Current State
            </h4>
            
            <div className="space-y-3">
              {suggestedTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="p-4 border rounded-lg space-y-3 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-medium">{task.title}</h5>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(task.matchScore * 100)}% match
                        </Badge>
                      </div>
                      
                      {task.description && (
                        <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {task.estimatedMinutes} min
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {task.priority} priority
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">
                      <strong>Why this fits:</strong> {task.reasoning}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => startTaskMutation.mutate(task.id)}
                      disabled={startTaskMutation.isPending}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Start Now
                    </Button>
                    <Button size="sm" variant="outline">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Mark as Done
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Mood Override */}
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm mb-3">Not feeling this way? Manually set your current state:</p>
          <div className="flex gap-2 flex-wrap">
            {['focused', 'stressed', 'calm', 'energized', 'tired'].map((mood) => (
              <Button
                key={mood}
                size="sm"
                variant={currentMood?.label === mood ? 'default' : 'outline'}
                onClick={() => setCurrentMood({
                  label: mood as any,
                  confidence: 1.0,
                  factors: ['Manually selected'],
                })}
              >
                {getMoodIcon(mood)}
                <span className="ml-1 capitalize">{mood}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">34%</div>
            <div className="text-xs text-muted-foreground">Suggestion Accuracy</div>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">127</div>
            <div className="text-xs text-muted-foreground">Mood-Matched Tasks</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}