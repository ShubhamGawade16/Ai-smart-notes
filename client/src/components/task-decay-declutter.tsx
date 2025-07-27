import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trash2, AlertTriangle, Archive, RefreshCw, Clock, TrendingDown } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface StaleTask {
  id: string;
  title: string;
  createdDate: string;
  lastModified: string;
  daysSinceCreated: number;
  daysSinceModified: number;
  decayScore: number;
  category: string;
  reason: string;
  suggestedAction: 'delete' | 'archive' | 'refresh';
}

interface DecaySettings {
  aggressiveness: 'conservative' | 'balanced' | 'aggressive';
  autoArchiveAfter: number;
  autoDeleteAfter: number;
}

export function TaskDecayDeclutter() {
  const [settings, setSettings] = useState<DecaySettings>({
    aggressiveness: 'balanced',
    autoArchiveAfter: 30,
    autoDeleteAfter: 90
  });
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const { toast } = useToast();

  // Get stale tasks analysis
  const { data: staleTasks, isLoading } = useQuery({
    queryKey: ['/api/ai/stale-tasks'],
    queryFn: async () => {
      // Mock stale tasks data
      return [
        {
          id: '1',
          title: 'Review Q3 marketing metrics',
          createdDate: '2024-09-15',
          lastModified: '2024-09-20',
          daysSinceCreated: 45,
          daysSinceModified: 40,
          decayScore: 85,
          category: 'Work',
          reason: 'Task created 45 days ago with no recent updates. Likely no longer relevant.',
          suggestedAction: 'delete'
        },
        {
          id: '2',
          title: 'Plan weekend hiking trip',
          createdDate: '2024-10-01',
          lastModified: '2024-10-01',
          daysSinceCreated: 30,
          daysSinceModified: 30,
          decayScore: 65,
          category: 'Personal',
          reason: 'Old personal task that might still be relevant but needs review.',
          suggestedAction: 'refresh'
        },
        {
          id: '3',
          title: 'Research new productivity apps',
          createdDate: '2024-09-10',
          lastModified: '2024-09-15',
          daysSinceCreated: 50,
          daysSinceModified: 45,
          decayScore: 75,
          category: 'Learning',
          reason: 'Learning task that may still be valuable but shows low activity.',
          suggestedAction: 'archive'
        },
        {
          id: '4',
          title: 'Follow up on client proposal',
          createdDate: '2024-08-20',
          lastModified: '2024-08-25',
          daysSinceCreated: 70,
          daysSinceModified: 65,
          decayScore: 95,
          category: 'Work',
          reason: 'Very old work task with no updates. Proposal likely decided already.',
          suggestedAction: 'delete'
        }
      ] as StaleTask[];
    },
    refetchInterval: 3600000, // Check every hour
  });

  // Bulk action mutation
  const bulkActionMutation = useMutation({
    mutationFn: async ({ taskIds, action }: { taskIds: string[], action: string }) => {
      return apiRequest('/api/tasks/bulk-action', {
        method: 'POST',
        body: JSON.stringify({ taskIds, action })
      });
    },
    onSuccess: (_, { action }) => {
      toast({
        title: "Tasks Updated",
        description: `Successfully ${action}d ${selectedTasks.length} tasks`
      });
      setSelectedTasks([]);
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ai/stale-tasks'] });
    }
  });

  // Individual action mutation
  const taskActionMutation = useMutation({
    mutationFn: async ({ taskId, action }: { taskId: string, action: string }) => {
      if (action === 'delete') {
        return apiRequest(`/api/tasks/${taskId}`, { method: 'DELETE' });
      } else if (action === 'archive') {
        return apiRequest(`/api/tasks/${taskId}`, {
          method: 'PATCH',
          body: JSON.stringify({ archived: true })
        });
      } else if (action === 'refresh') {
        return apiRequest(`/api/tasks/${taskId}/refresh`, { method: 'POST' });
      }
    },
    onSuccess: (_, { action }) => {
      toast({
        title: "Task Updated",
        description: `Task ${action}d successfully`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ai/stale-tasks'] });
    }
  });

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'delete': return <Trash2 className="h-4 w-4 text-red-500" />;
      case 'archive': return <Archive className="h-4 w-4 text-yellow-500" />;
      case 'refresh': return <RefreshCw className="h-4 w-4 text-blue-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'delete': return 'text-red-600 bg-red-50';
      case 'archive': return 'text-yellow-600 bg-yellow-50';
      case 'refresh': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Stale Tasks</p>
                <p className="text-2xl font-bold">{staleTasks?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">High Decay Score</p>
                <p className="text-2xl font-bold">
                  {staleTasks?.filter(t => t.decayScore > 80).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Age (days)</p>
                <p className="text-2xl font-bold">
                  {staleTasks ? Math.round(staleTasks.reduce((sum, t) => sum + t.daysSinceCreated, 0) / staleTasks.length) : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      {selectedTasks.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedTasks.length} tasks selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => bulkActionMutation.mutate({ taskIds: selectedTasks, action: 'archive' })}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archive All
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => bulkActionMutation.mutate({ taskIds: selectedTasks, action: 'delete' })}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stale Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Task Decay Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Analyzing task decay patterns...</p>
            </div>
          ) : staleTasks?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Trash2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No stale tasks detected!</p>
              <p className="text-sm">Your task list is clean and up-to-date.</p>
            </div>
          ) : (
            staleTasks?.map((task) => (
              <div key={task.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedTasks.includes(task.id)}
                      onChange={() => toggleTaskSelection(task.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{task.title}</h4>
                      <p className="text-sm text-muted-foreground">{task.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getActionColor(task.suggestedAction)}>
                      {getActionIcon(task.suggestedAction)}
                      {task.suggestedAction}
                    </Badge>
                    <Badge variant="secondary">
                      {task.decayScore}% decay
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Decay Score</span>
                    <span>{task.decayScore}%</span>
                  </div>
                  <Progress value={task.decayScore} className="h-2" />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <span className="ml-2">{task.daysSinceCreated} days ago</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Modified:</span>
                    <span className="ml-2">{task.daysSinceModified} days ago</span>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground italic">
                  💡 {task.reason}
                </div>
                
                <div className="flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => taskActionMutation.mutate({ taskId: task.id, action: 'refresh' })}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Refresh
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => taskActionMutation.mutate({ taskId: task.id, action: 'archive' })}
                  >
                    <Archive className="h-4 w-4 mr-1" />
                    Archive
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => taskActionMutation.mutate({ taskId: task.id, action: 'delete' })}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}