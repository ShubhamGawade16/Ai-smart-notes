import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, Award, TrendingUp, Plus, CheckCircle, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  targetDate: string;
  progress: number;
  status: 'active' | 'completed' | 'paused';
  alignedTasks: number;
  totalTasks: number;
}

interface TaskAlignment {
  taskId: string;
  taskTitle: string;
  goalId: string;
  goalTitle: string;
  alignmentScore: number;
  suggestedGoal?: string;
  reasoning: string;
}

export function GoalTrackingAlignment() {
  const [selectedGoal, setSelectedGoal] = useState<string>('');
  const { toast } = useToast();

  // Get user goals
  const { data: goals, isLoading: goalsLoading } = useQuery({
    queryKey: ['/api/goals'],
    queryFn: async () => {
      // Mock goals data
      return [
        {
          id: '1',
          title: 'Complete Full-Stack Development Course',
          description: 'Master React, Node.js, and database design',
          category: 'Learning',
          targetDate: '2025-03-31',
          progress: 65,
          status: 'active',
          alignedTasks: 8,
          totalTasks: 12
        },
        {
          id: '2',
          title: 'Launch Personal Finance App',
          description: 'Build and deploy a personal finance tracking application',
          category: 'Project',
          targetDate: '2025-06-30',
          progress: 30,
          status: 'active',
          alignedTasks: 5,
          totalTasks: 18
        },
        {
          id: '3',
          title: 'Improve Physical Fitness',
          description: 'Regular exercise routine and healthy eating habits',
          category: 'Health',
          targetDate: '2025-12-31',
          progress: 45,
          status: 'active',
          alignedTasks: 12,
          totalTasks: 20
        }
      ] as Goal[];
    }
  });

  // Get task-goal alignment suggestions
  const { data: alignments } = useQuery({
    queryKey: ['/api/ai/task-goal-alignment'],
    queryFn: async () => {
      // Mock alignment data
      return [
        {
          taskId: '1',
          taskTitle: 'Learn React hooks advanced patterns',
          goalId: '1',
          goalTitle: 'Complete Full-Stack Development Course',
          alignmentScore: 95,
          reasoning: 'This task directly contributes to mastering React, a key component of your course'
        },
        {
          taskId: '2',
          taskTitle: 'Research budgeting algorithms',
          goalId: '2',
          goalTitle: 'Launch Personal Finance App',
          alignmentScore: 85,
          reasoning: 'Budgeting algorithms are essential for your finance app functionality'
        },
        {
          taskId: '3',
          taskTitle: 'Plan weekend workout routine',
          goalId: '3',
          goalTitle: 'Improve Physical Fitness',
          alignmentScore: 80,
          reasoning: 'Consistent workout planning supports your fitness improvement goal'
        },
        {
          taskId: '4',
          taskTitle: 'Clean up email inbox',
          suggestedGoal: 'Create a "Personal Organization" goal',
          alignmentScore: 40,
          reasoning: 'This task doesn\'t align with current goals but could be part of a new organization goal'
        }
      ] as TaskAlignment[];
    }
  });

  // Create new goal mutation
  const createGoalMutation = useMutation({
    mutationFn: async (goalData: Partial<Goal>) => {
      return apiRequest('/api/goals', {
        method: 'POST',
        body: JSON.stringify(goalData)
      });
    },
    onSuccess: () => {
      toast({
        title: "Goal Created",
        description: "New goal added successfully!"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
    }
  });

  // Align task with goal mutation
  const alignTaskMutation = useMutation({
    mutationFn: async ({ taskId, goalId }: { taskId: string, goalId: string }) => {
      return apiRequest('/api/tasks/align-goal', {
        method: 'POST',
        body: JSON.stringify({ taskId, goalId })
      });
    },
    onSuccess: () => {
      toast({
        title: "Task Aligned",
        description: "Task successfully aligned with goal!"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ai/task-goal-alignment'] });
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'active': return 'text-blue-600 bg-blue-50';
      case 'paused': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'active': return <Target className="h-4 w-4" />;
      case 'paused': return <AlertTriangle className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Goals Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Goals</p>
                <p className="text-2xl font-bold">
                  {goals?.filter(g => g.status === 'active').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Progress</p>
                <p className="text-2xl font-bold">
                  {goals ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Aligned Tasks</p>
                <p className="text-2xl font-bold">
                  {goals?.reduce((sum, g) => sum + g.alignedTasks, 0) || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Your Goals
            </div>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Goal
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {goalsLoading ? (
            <div className="text-center py-8">
              <Target className="h-8 w-8 animate-pulse mx-auto mb-4" />
              <p>Loading goals...</p>
            </div>
          ) : goals?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No goals yet</p>
              <p className="text-sm">Create your first goal to start tracking progress!</p>
            </div>
          ) : (
            goals?.map((goal) => (
              <div key={goal.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{goal.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {goal.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{goal.category}</Badge>
                      <Badge variant="outline" className={getStatusColor(goal.status)}>
                        {getStatusIcon(goal.status)}
                        {goal.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      Target: {new Date(goal.targetDate).toLocaleDateString()}
                    </div>
                    <div className="text-sm mt-1">
                      {goal.alignedTasks}/{goal.totalTasks} tasks aligned
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{goal.progress}%</span>
                  </div>
                  <Progress value={goal.progress} className="h-2" />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Task Alignment Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Task-Goal Alignment Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {alignments?.map((alignment) => (
            <div key={alignment.taskId} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium">{alignment.taskTitle}</h4>
                  {alignment.goalTitle ? (
                    <p className="text-sm text-muted-foreground">
                      Suggested for: <span className="font-medium">{alignment.goalTitle}</span>
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {alignment.suggestedGoal}
                    </p>
                  )}
                </div>
                <Badge variant="secondary">
                  {alignment.alignmentScore}% match
                </Badge>
              </div>
              
              <div className="text-sm text-muted-foreground italic">
                💡 {alignment.reasoning}
              </div>
              
              <div className="flex items-center justify-end gap-2">
                {alignment.goalId ? (
                  <Button
                    size="sm"
                    onClick={() => alignTaskMutation.mutate({ 
                      taskId: alignment.taskId, 
                      goalId: alignment.goalId 
                    })}
                    disabled={alignTaskMutation.isPending}
                  >
                    <Target className="h-4 w-4 mr-1" />
                    Align with Goal
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // Would open create goal modal
                      toast({
                        title: "Create Goal",
                        description: "Goal creation modal would open here"
                      });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Create Goal
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}