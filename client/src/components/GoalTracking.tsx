import React, { useState } from 'react';
import { Target, TrendingUp, Calendar, CheckCircle, AlertTriangle, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useUpgrade } from '@/hooks/useUpgrade';

interface Goal {
  id: string;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  deadline: Date;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'paused';
  alignedTasks: string[];
}

export const GoalTracking: React.FC = () => {
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    targetValue: 100,
    deadline: '',
    category: 'Personal',
    priority: 'medium' as const,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canUseFeature, showUpgradeModal } = useUpgrade();

  const { data: goalsData, isLoading } = useQuery({
    queryKey: ['/api/goals'],
    enabled: canUseFeature('basic_tasks'),
  });

  const goals: Goal[] = goalsData?.goals || [];

  const createGoalMutation = useMutation({
    mutationFn: async (goalData: any) => {
      const response = await apiRequest('POST', '/api/goals', goalData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      setShowAddGoal(false);
      setNewGoal({
        title: '',
        description: '',
        targetValue: 100,
        deadline: '',
        category: 'Personal',
        priority: 'medium',
      });
      toast({
        title: "Goal Created",
        description: "Your new goal has been added successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Creation Failed",
        description: "Failed to create goal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateGoal = () => {
    if (!newGoal.title.trim()) return;
    
    createGoalMutation.mutate({
      ...newGoal,
      deadline: new Date(newGoal.deadline),
    });
  };

  if (!canUseFeature('basic_tasks')) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Goal Tracking
            <Badge variant="outline">Pro</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-2">Track Your Goals</h3>
            <p className="text-gray-600 mb-4">
              Set meaningful goals, track progress, and align your daily tasks with long-term objectives.
            </p>
            <Button 
              onClick={() => showUpgradeModal('basic_tasks', 'Goal tracking requires Pro subscription for progress monitoring.')}
            >
              Upgrade to Pro
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Goal Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: Goal['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'active': return 'text-blue-600 bg-blue-50';
      case 'paused': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: Goal['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getDaysUntilDeadline = (deadline: Date) => {
    const now = new Date();
    const diffTime = new Date(deadline).getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Goal Tracking
            <Badge variant="outline">{goals.length} active</Badge>
          </div>
          
          <Button
            size="sm"
            onClick={() => setShowAddGoal(!showAddGoal)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Goal
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Add Goal Form */}
        {showAddGoal && (
          <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50 space-y-3">
            <Input
              placeholder="Goal title (e.g., 'Complete 50 workout sessions')"
              value={newGoal.title}
              onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
            />
            
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                placeholder="Target value"
                value={newGoal.targetValue}
                onChange={(e) => setNewGoal(prev => ({ ...prev, targetValue: Number(e.target.value) }))}
              />
              <Input
                type="date"
                value={newGoal.deadline}
                onChange={(e) => setNewGoal(prev => ({ ...prev, deadline: e.target.value }))}
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleCreateGoal}
                disabled={!newGoal.title.trim() || createGoalMutation.isPending}
              >
                Create Goal
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddGoal(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Goals List */}
        {goals.length === 0 ? (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              No Goals Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Set your first goal to start tracking your progress and align your tasks.
            </p>
            <Button
              size="sm"
              onClick={() => setShowAddGoal(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Create Your First Goal
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map(goal => {
              const progress = calculateProgress(goal.currentValue, goal.targetValue);
              const daysLeft = getDaysUntilDeadline(goal.deadline);
              
              return (
                <div key={goal.id} className="p-4 border rounded-lg space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {goal.title}
                      </h4>
                      {goal.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {goal.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(goal.status)}>
                        {goal.status}
                      </Badge>
                      <Badge className={getPriorityColor(goal.priority)}>
                        {goal.priority}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Progress: {goal.currentValue} / {goal.targetValue}
                      </span>
                      <span className="font-medium">
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  
                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {daysLeft > 0 ? `${daysLeft} days left` : daysLeft === 0 ? 'Due today' : `${Math.abs(daysLeft)} days overdue`}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>{goal.alignedTasks.length} aligned tasks</span>
                    </div>
                    
                    {daysLeft < 0 && (
                      <div className="flex items-center gap-1 text-red-600">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Overdue</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary Stats */}
        {goals.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-800 dark:text-blue-200">
                Goal Progress Summary
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {goals.filter(g => g.status === 'active').length}
                </div>
                <div className="text-xs text-gray-600">Active Goals</div>
              </div>
              
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {goals.filter(g => g.status === 'completed').length}
                </div>
                <div className="text-xs text-gray-600">Completed</div>
              </div>
              
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {Math.round(goals.reduce((acc, goal) => acc + calculateProgress(goal.currentValue, goal.targetValue), 0) / goals.length)}%
                </div>
                <div className="text-xs text-gray-600">Avg Progress</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};