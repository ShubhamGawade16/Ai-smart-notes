import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Archive, FileText, Clock, AlertTriangle, Sparkles } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface StaleTask {
  id: string;
  title: string;
  description?: string;
  daysSinceLastInteraction: number;
  freshnessScore: number;
  priority?: string;
  suggestedAction: 'delete' | 'defer' | 'convert';
  reasoning: string;
}

interface BulkAction {
  action: 'delete' | 'defer' | 'convert';
  taskIds: string[];
  deferDays?: number;
}

export function TaskDecayCleanup() {
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [showReview, setShowReview] = useState(false);
  const { toast } = useToast();

  // Get stale tasks
  const { data: staleTasks, isLoading } = useQuery({
    queryKey: ['/api/ai/stale-tasks'],
    queryFn: async () => {
      // Mock implementation - in production would analyze task freshness
      return [
        {
          id: '1',
          title: 'Update LinkedIn profile',
          description: 'Add recent project achievements',
          daysSinceLastInteraction: 23,
          freshnessScore: 0.15,
          priority: 'low',
          suggestedAction: 'defer',
          reasoning: 'Low priority task, not time-sensitive, can be deferred by 30 days',
        },
        {
          id: '2',
          title: 'Research vacation destinations',
          daysSinceLastInteraction: 45,
          freshnessScore: 0.08,
          suggestedAction: 'delete',
          reasoning: 'Very old task with no recent interaction, likely no longer relevant',
        },
        {
          id: '3',
          title: 'Follow up on interview feedback',
          description: 'Get detailed feedback from recent interviews',
          daysSinceLastInteraction: 18,
          freshnessScore: 0.25,
          priority: 'medium',
          suggestedAction: 'convert',
          reasoning: 'Could be valuable as reference material, convert to note for future use',
        },
        {
          id: '4',
          title: 'Clean garage',
          daysSinceLastInteraction: 67,
          freshnessScore: 0.03,
          suggestedAction: 'delete',
          reasoning: 'Very stale task, likely forgotten or no longer relevant',
        },
        {
          id: '5',
          title: 'Learn Spanish basics',
          daysSinceLastInteraction: 31,
          freshnessScore: 0.12,
          priority: 'high',
          suggestedAction: 'defer',
          reasoning: 'Important goal but needs fresh motivation, defer for reconsideration',
        },
      ] as StaleTask[];
    },
    refetchInterval: 86400000, // Refresh daily
  });

  // Execute bulk actions
  const bulkActionMutation = useMutation({
    mutationFn: async (action: BulkAction) => {
      return apiRequest('/api/ai/bulk-task-action', {
        method: 'POST',
        body: JSON.stringify(action),
      });
    },
    onSuccess: (data, variables) => {
      const actionText = variables.action === 'delete' ? 'deleted' : 
                        variables.action === 'defer' ? 'deferred' : 'converted to notes';
      toast({
        title: "Cleanup Complete",
        description: `${variables.taskIds.length} tasks have been ${actionText}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ai/stale-tasks'] });
      setSelectedTasks([]);
      setShowReview(false);
    },
  });

  const handleSelectTask = (taskId: string, checked: boolean) => {
    if (checked) {
      setSelectedTasks([...selectedTasks, taskId]);
    } else {
      setSelectedTasks(selectedTasks.filter(id => id !== taskId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTasks(staleTasks?.map(task => task.id) || []);
    } else {
      setSelectedTasks([]);
    }
  };

  const handleBulkAction = (action: 'delete' | 'defer' | 'convert') => {
    if (selectedTasks.length === 0) return;
    
    const bulkAction: BulkAction = {
      action,
      taskIds: selectedTasks,
      ...(action === 'defer' && { deferDays: 30 }),
    };
    
    bulkActionMutation.mutate(bulkAction);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'delete': return <Trash2 className="h-3 w-3 text-red-500" />;
      case 'defer': return <Clock className="h-3 w-3 text-yellow-500" />;
      case 'convert': return <FileText className="h-3 w-3 text-blue-500" />;
      default: return <AlertTriangle className="h-3 w-3" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'delete': return 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300';
      case 'defer': return 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300';
      case 'convert': return 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300';
      default: return 'bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-300';
    }
  };

  const getFreshnessColor = (score: number) => {
    if (score >= 0.5) return 'text-green-500';
    if (score >= 0.2) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (!staleTasks || staleTasks.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Task Decay & Declutter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-green-600">All Clean!</p>
            <p className="text-muted-foreground">No stale tasks detected. Your task list is fresh and organized.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Archive className="h-5 w-5 text-primary" />
          Task Decay & Declutter
          <Badge variant="destructive" className="ml-2">
            {staleTasks.length} stale tasks
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {!showReview ? (
          // Summary View
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                    {staleTasks.length} tasks haven't been touched recently
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    These tasks might be outdated or no longer relevant. Review them to keep your list clean and focused.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                <Trash2 className="h-6 w-6 mx-auto mb-2 text-red-500" />
                <div className="text-2xl font-bold">
                  {staleTasks.filter(t => t.suggestedAction === 'delete').length}
                </div>
                <div className="text-xs text-muted-foreground">Suggested for deletion</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                <Clock className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                <div className="text-2xl font-bold">
                  {staleTasks.filter(t => t.suggestedAction === 'defer').length}
                </div>
                <div className="text-xs text-muted-foreground">Suggested to defer</div>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <FileText className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">
                  {staleTasks.filter(t => t.suggestedAction === 'convert').length}
                </div>
                <div className="text-xs text-muted-foreground">Convert to notes</div>
              </div>
            </div>

            <Button 
              onClick={() => setShowReview(true)}
              className="w-full"
              size="lg"
            >
              <Archive className="h-4 w-4 mr-2" />
              Review Stale Tasks
            </Button>
          </div>
        ) : (
          // Review Interface
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedTasks.length === staleTasks.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="font-medium">
                  Select All ({selectedTasks.length} of {staleTasks.length})
                </span>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowReview(false)}
              >
                Back to Summary
              </Button>
            </div>

            {/* Bulk Actions */}
            {selectedTasks.length > 0 && (
              <div className="flex gap-2 p-3 bg-muted rounded-lg">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleBulkAction('delete')}
                  disabled={bulkActionMutation.isPending}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete ({selectedTasks.length})
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('defer')}
                  disabled={bulkActionMutation.isPending}
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Defer 30 days
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('convert')}
                  disabled={bulkActionMutation.isPending}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  Convert to Notes
                </Button>
              </div>
            )}

            {/* Task List */}
            <div className="space-y-3">
              {staleTasks.map((task) => (
                <div key={task.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedTasks.includes(task.id)}
                      onCheckedChange={(checked) => handleSelectTask(task.id, checked as boolean)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">{task.title}</h5>
                        <div className="flex items-center gap-2">
                          <Badge className={getActionColor(task.suggestedAction)}>
                            {getActionIcon(task.suggestedAction)}
                            {task.suggestedAction}
                          </Badge>
                        </div>
                      </div>
                      
                      {task.description && (
                        <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Last touched: {task.daysSinceLastInteraction} days ago</span>
                        <span className={getFreshnessColor(task.freshnessScore)}>
                          Freshness: {Math.round(task.freshnessScore * 100)}%
                        </span>
                        {task.priority && (
                          <Badge variant="outline" className="text-xs">
                            {task.priority} priority
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">
                      <strong>AI Recommendation:</strong> {task.reasoning}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}