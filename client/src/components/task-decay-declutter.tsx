import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Clock, FileText, AlertTriangle, CheckCircle2, Zap, RotateCcw } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface StaleTask {
  id: string;
  title: string;
  description?: string;
  daysSinceLastInteraction: number;
  freshnessScore: number;
  priority: string;
  suggestedAction: 'delete' | 'defer' | 'convert';
  reasoning: string;
}

export function TaskDecayDeclutter() {
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const { toast } = useToast();

  // Get stale tasks
  const { data: staleTasks, isLoading } = useQuery({
    queryKey: ['/api/ai/stale-tasks'],
    queryFn: async () => {
      const response = await apiRequest('/api/ai/stale-tasks');
      return response as StaleTask[];
    },
    refetchInterval: 600000, // Check every 10 minutes
  });

  // Bulk action mutation
  const bulkActionMutation = useMutation({
    mutationFn: async ({ action, taskIds }: { action: string; taskIds: string[] }) => {
      return apiRequest('/api/ai/bulk-task-action', {
        method: 'POST',
        body: JSON.stringify({ action, taskIds }),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Tasks Updated",
        description: `Successfully processed ${data.processed} tasks. Your task list is now cleaner!`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ai/stale-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      setSelectedTasks([]);
    },
  });

  const getFreshnessColor = (score: number) => {
    if (score <= 0.3) return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900';
    if (score <= 0.6) return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900';
    return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'delete': return <Trash2 className="h-4 w-4 text-red-500" />;
      case 'defer': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'convert': return <FileText className="h-4 w-4 text-blue-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'delete': return 'Delete';
      case 'defer': return 'Defer';
      case 'convert': return 'Convert to Note';
      default: return 'Unknown';
    }
  };

  const handleTaskSelection = (taskId: string, checked: boolean) => {
    if (checked) {
      setSelectedTasks([...selectedTasks, taskId]);
    } else {
      setSelectedTasks(selectedTasks.filter(id => id !== taskId));
    }
  };

  const handleSelectAll = () => {
    if (selectedTasks.length === staleTasks?.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(staleTasks?.map(task => task.id) || []);
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedTasks.length === 0) return;
    bulkActionMutation.mutate({ action, taskIds: selectedTasks });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 animate-spin" />
            Analyzing Task Freshness...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-muted rounded"></div>
            <div className="h-16 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RotateCcw className="h-5 w-5 text-primary" />
          Task Decay & Declutter
          <Badge variant="secondary" className="ml-2">
            <Zap className="h-3 w-3 mr-1" />
            Smart Cleanup
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          AI identifies stale tasks that are cluttering your workflow and suggests cleanup actions
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Stale Tasks */}
        {staleTasks && staleTasks.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Stale Tasks Found ({staleTasks.length})
              </h4>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleSelectAll}
                >
                  {selectedTasks.length === staleTasks.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              {staleTasks.map((task) => (
                <div key={task.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedTasks.includes(task.id)}
                      onCheckedChange={(checked) => 
                        handleTaskSelection(task.id, checked as boolean)
                      }
                      className="mt-1"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">{task.title}</h5>
                        <div className="flex items-center gap-2">
                          <Badge className={getFreshnessColor(task.freshnessScore)}>
                            {Math.round(task.freshnessScore * 100)}% fresh
                          </Badge>
                          <Badge variant="outline">
                            {task.daysSinceLastInteraction} days old
                          </Badge>
                        </div>
                      </div>
                      
                      {task.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {task.description}
                        </p>
                      )}
                      
                      <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          {getActionIcon(task.suggestedAction)}
                          <span className="text-sm font-medium">
                            Suggested: {getActionLabel(task.suggestedAction)}
                          </span>
                        </div>
                        <p className="text-sm">
                          {task.reasoning}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bulk Actions */}
            {selectedTasks.length > 0 && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {selectedTasks.length} task{selectedTasks.length === 1 ? '' : 's'} selected
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleBulkAction('delete')}
                      disabled={bulkActionMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete Selected
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBulkAction('defer')}
                      disabled={bulkActionMutation.isPending}
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      Defer Selected
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
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <div>
              <p className="font-medium text-green-600">Your tasks are fresh!</p>
              <p className="text-sm text-muted-foreground mt-1">
                No stale tasks detected. Great job staying on top of your workflow!
              </p>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <Trash2 className="h-6 w-6 mx-auto mb-2 text-red-500" />
            <div className="text-2xl font-bold">{staleTasks?.filter(t => t.suggestedAction === 'delete').length || 0}</div>
            <div className="text-xs text-muted-foreground">For Deletion</div>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <Clock className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold">{staleTasks?.filter(t => t.suggestedAction === 'defer').length || 0}</div>
            <div className="text-xs text-muted-foreground">To Defer</div>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <FileText className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{staleTasks?.filter(t => t.suggestedAction === 'convert').length || 0}</div>
            <div className="text-xs text-muted-foreground">To Convert</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}