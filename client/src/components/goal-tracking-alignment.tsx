import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingDown, TrendingUp, AlertTriangle, Plus, CheckCircle2, BarChart3 } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Goal {
  id: string;
  title: string;
  description?: string;
  targetDate?: string;
  alignmentThreshold: number; // 0-100, percentage of tasks that should align
}

interface GoalAlignment {
  goalId: string;
  goalTitle: string;
  alignedTasks: number;
  totalTasks: number;
  alignmentPercentage: number;
  trend: 'up' | 'down' | 'stable';
  weeklyHistory: number[];
  driftDetected: boolean;
  suggestions: string[];
}

interface TaskAlignment {
  taskId: string;
  taskTitle: string;
  alignmentScore: number;
  goalId?: string;
  goalTitle?: string;
  reasoning: string;
}

export function GoalTrackingAlignment() {
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [showAddGoal, setShowAddGoal] = useState(false);
  const { toast } = useToast();

  // Get user goals
  const { data: goals } = useQuery({
    queryKey: ['/api/goals'],
    queryFn: async () => {
      // Mock implementation - in production would fetch user goals
      return [
        {
          id: '1',
          title: 'Learn Spanish',
          description: 'Become conversational in Spanish',
          targetDate: '2025-06-01',
          alignmentThreshold: 70,
        },
        {
          id: '2',
          title: 'Fitness Journey',
          description: 'Improve health and fitness',
          alignmentThreshold: 60,
        },
        {
          id: '3',
          title: 'Career Growth',
          description: 'Advance professional skills',
          alignmentThreshold: 80,
        },
      ] as Goal[];
    },
  });

  // Get goal alignment analysis
  const { data: alignmentData } = useQuery({
    queryKey: ['/api/ai/goal-alignment'],
    queryFn: async () => {
      // Mock implementation - in production would analyze task-goal alignment
      return [
        {
          goalId: '1',
          goalTitle: 'Learn Spanish',
          alignedTasks: 4,
          totalTasks: 15,
          alignmentPercentage: 27,
          trend: 'down',
          weeklyHistory: [45, 38, 32, 27],
          driftDetected: true,
          suggestions: [
            'Schedule daily 15-minute Spanish practice sessions',
            'Set reminders for language learning apps',
            'Convert some general reading tasks to Spanish materials',
          ],
        },
        {
          goalId: '2',
          goalTitle: 'Fitness Journey',
          alignmentPercentage: 73,
          alignedTasks: 8,
          totalTasks: 11,
          trend: 'up',
          weeklyHistory: [60, 65, 70, 73],
          driftDetected: false,
          suggestions: [],
        },
        {
          goalId: '3',
          goalTitle: 'Career Growth',
          alignedTasks: 12,
          totalTasks: 15,
          alignmentPercentage: 80,
          trend: 'stable',
          weeklyHistory: [78, 81, 79, 80],
          driftDetected: false,
          suggestions: [],
        },
      ] as GoalAlignment[];
    },
  });

  // Get misaligned tasks
  const { data: misalignedTasks } = useQuery({
    queryKey: ['/api/ai/task-alignment'],
    queryFn: async () => {
      return [
        {
          taskId: '1',
          taskTitle: 'Organize digital photos',
          alignmentScore: 0.15,
          reasoning: 'Low relevance to current goals, consider deferring or quick completion',
        },
        {
          taskId: '2',
          taskTitle: 'Read productivity articles',
          alignmentScore: 0.78,
          goalId: '3',
          goalTitle: 'Career Growth',
          reasoning: 'Strongly aligned with career development goal',
        },
        {
          taskId: '3',
          taskTitle: 'Plan weekend workout routine',
          alignmentScore: 0.92,
          goalId: '2',
          goalTitle: 'Fitness Journey',
          reasoning: 'Perfect alignment with fitness goals',
        },
      ] as TaskAlignment[];
    },
  });

  // Add new goal
  const addGoalMutation = useMutation({
    mutationFn: async (goalData: Partial<Goal>) => {
      return apiRequest('/api/goals', {
        method: 'POST',
        body: JSON.stringify(goalData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Goal Added",
        description: "Your new goal has been created and task alignment analysis will begin.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ai/goal-alignment'] });
      setNewGoalTitle('');
      setShowAddGoal(false);
    },
  });

  // Realign task to goal
  const realignTaskMutation = useMutation({
    mutationFn: async ({ taskId, goalId }: { taskId: string; goalId: string }) => {
      return apiRequest(`/api/tasks/${taskId}/align-to-goal`, {
        method: 'POST',
        body: JSON.stringify({ goalId }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Task Realigned",
        description: "Task has been aligned to your selected goal.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ai/task-alignment'] });
    },
  });

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <div className="h-4 w-4 bg-yellow-500 rounded-full" />;
    }
  };

  const getAlignmentColor = (percentage: number, threshold: number) => {
    if (percentage >= threshold) return 'text-green-500';
    if (percentage >= threshold * 0.7) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Goal Tracking & Alignment
          </div>
          <Button
            size="sm"
            onClick={() => setShowAddGoal(!showAddGoal)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Goal
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Add New Goal */}
        {showAddGoal && (
          <div className="p-4 border rounded-lg space-y-3">
            <Input
              placeholder="Enter your goal (e.g., Learn French, Get Fit, Build Side Project)"
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => addGoalMutation.mutate({ title: newGoalTitle, alignmentThreshold: 70 })}
                disabled={!newGoalTitle.trim() || addGoalMutation.isPending}
              >
                Create Goal
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowAddGoal(false);
                  setNewGoalTitle('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Goal Alignment Overview */}
        {alignmentData && alignmentData.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Goal Alignment Status
            </h4>
            
            <div className="space-y-3">
              {alignmentData.map((alignment) => (
                <div key={alignment.goalId} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium">{alignment.goalTitle}</h5>
                      {getTrendIcon(alignment.trend)}
                      {alignment.driftDetected && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Drift Detected
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getAlignmentColor(alignment.alignmentPercentage, 70)}`}>
                        {alignment.alignmentPercentage}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {alignment.alignedTasks}/{alignment.totalTasks} tasks
                      </div>
                    </div>
                  </div>
                  
                  <Progress value={alignment.alignmentPercentage} className="h-2" />
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Weekly trend: {alignment.weeklyHistory.join('% → ')}%</span>
                    {alignment.driftDetected && (
                      <Button size="sm" variant="outline">
                        View Aligned Tasks
                      </Button>
                    )}
                  </div>
                  
                  {alignment.suggestions.length > 0 && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                      <p className="text-sm font-medium mb-2">Suggestions to get back on track:</p>
                      <ul className="text-sm space-y-1">
                        {alignment.suggestions.map((suggestion, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Task Alignment Insights */}
        {misalignedTasks && misalignedTasks.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium">Task Alignment Insights</h4>
            
            <div className="space-y-3">
              {misalignedTasks.map((task) => (
                <div key={task.taskId} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium">{task.taskTitle}</h5>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={task.alignmentScore >= 0.7 ? 'text-green-600' : task.alignmentScore >= 0.4 ? 'text-yellow-600' : 'text-red-600'}>
                          {Math.round(task.alignmentScore * 100)}% alignment
                        </Badge>
                        {task.goalTitle && (
                          <Badge variant="secondary" className="text-xs">
                            → {task.goalTitle}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">
                      <strong>AI Analysis:</strong> {task.reasoning}
                    </p>
                  </div>
                  
                  {task.alignmentScore < 0.5 && goals && (
                    <div className="flex gap-2 flex-wrap">
                      <span className="text-sm text-muted-foreground">Realign to:</span>
                      {goals.map((goal) => (
                        <Button
                          key={goal.id}
                          size="sm"
                          variant="outline"
                          onClick={() => realignTaskMutation.mutate({ taskId: task.taskId, goalId: goal.id })}
                          disabled={realignTaskMutation.isPending}
                        >
                          {goal.title}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <Target className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{goals?.length || 0}</div>
            <div className="text-xs text-muted-foreground">Active Goals</div>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">67%</div>
            <div className="text-xs text-muted-foreground">Avg Alignment</div>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-500" />
            <div className="text-2xl font-bold">1</div>
            <div className="text-xs text-muted-foreground">Goals at Risk</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}