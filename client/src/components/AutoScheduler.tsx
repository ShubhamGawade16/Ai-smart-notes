import React, { useState } from 'react';
import { Calendar, Clock, Zap, Settings, Play, Pause, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useUpgrade } from '@/hooks/useUpgrade';

interface ScheduledTask {
  id: string;
  title: string;
  estimatedTime: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduledStart: Date;
  scheduledEnd: Date;
  contextSwitchCost: number;
  energyRequirement: 'low' | 'medium' | 'high';
}

interface SchedulingPreferences {
  workingHours: {
    start: string;
    end: string;
  };
  breakDuration: number;
  maxFocusBlock: number;
  bufferTime: number;
  priorityWeighting: number;
}

export const AutoScheduler: React.FC = () => {
  const [isScheduling, setIsScheduling] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<SchedulingPreferences>({
    workingHours: { start: '09:00', end: '17:00' },
    breakDuration: 15,
    maxFocusBlock: 90,
    bufferTime: 10,
    priorityWeighting: 70,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canUseFeature, showUpgradeModal } = useUpgrade();

  const { data: scheduleData, isLoading } = useQuery({
    queryKey: ['/api/schedule'],
    enabled: canUseFeature('auto_scheduler'),
  });

  const scheduledTasks: ScheduledTask[] = scheduleData?.schedule || [];

  const generateScheduleMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/ai/optimize-tasks', {
        preferences,
        includeUnscheduled: true,
      });
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedule'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      setIsScheduling(false);
      
      toast({
        title: "Schedule Generated",
        description: `Optimized ${data.optimizedTasks?.length || 0} tasks for maximum productivity.`,
      });
    },
    onError: () => {
      setIsScheduling(false);
      toast({
        title: "Scheduling Failed",
        description: "Failed to generate optimal schedule. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateSchedule = () => {
    setIsScheduling(true);
    generateScheduleMutation.mutate();
  };

  if (!canUseFeature('auto_scheduler')) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600" />
            Auto-Scheduler
            <Badge variant="outline">Advanced Pro</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-2">Intelligent Task Scheduling</h3>
            <p className="text-gray-600 mb-4">
              Let AI automatically schedule your tasks based on priority, energy levels, and optimal focus windows.
            </p>
            <Button 
              onClick={() => showUpgradeModal('auto_scheduler', 'Auto-scheduling requires Advanced Pro subscription for intelligent task organization.')}
            >
              Upgrade to Advanced Pro
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getEnergyColor = (energy: ScheduledTask['energyRequirement']) => {
    switch (energy) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: ScheduledTask['priority']) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600" />
            Auto-Scheduler
            {scheduledTasks.length > 0 && (
              <Badge variant="outline">{scheduledTasks.length} scheduled</Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-4 h-4" />
            </Button>
            
            <Button
              size="sm"
              onClick={handleGenerateSchedule}
              disabled={isScheduling}
            >
              {isScheduling ? (
                <>
                  <RotateCcw className="w-4 h-4 mr-1 animate-spin" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-1" />
                  Generate Schedule
                </>
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Settings Panel */}
        {showSettings && (
          <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50 space-y-4">
            <h4 className="font-medium text-sm">Scheduling Preferences</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Working Hours Start</Label>
                <input
                  type="time"
                  value={preferences.workingHours.start}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    workingHours: { ...prev.workingHours, start: e.target.value }
                  }))}
                  className="w-full px-2 py-1 text-xs border rounded"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs">Working Hours End</Label>
                <input
                  type="time"
                  value={preferences.workingHours.end}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    workingHours: { ...prev.workingHours, end: e.target.value }
                  }))}
                  className="w-full px-2 py-1 text-xs border rounded"
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs">Max Focus Block (minutes): {preferences.maxFocusBlock}</Label>
                <Slider
                  value={[preferences.maxFocusBlock]}
                  onValueChange={([value]) => setPreferences(prev => ({ ...prev, maxFocusBlock: value }))}
                  min={30}
                  max={180}
                  step={15}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs">Priority Weighting: {preferences.priorityWeighting}%</Label>
                <Slider
                  value={[preferences.priorityWeighting]}
                  onValueChange={([value]) => setPreferences(prev => ({ ...prev, priorityWeighting: value }))}
                  min={0}
                  max={100}
                  step={10}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* Current Schedule */}
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        ) : scheduledTasks.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              No Schedule Generated
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Generate an optimized schedule based on your tasks and preferences.
            </p>
            <Button
              size="sm"
              onClick={handleGenerateSchedule}
              disabled={isScheduling}
            >
              <Zap className="w-4 h-4 mr-1" />
              Create Smart Schedule
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Today's Optimized Schedule</h4>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                Total: {scheduledTasks.reduce((sum, task) => sum + task.estimatedTime, 0)} min
              </div>
            </div>
            
            {scheduledTasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex-shrink-0">
                  <div className="text-xs font-mono text-gray-600">
                    {formatTime(task.scheduledStart)} - {formatTime(task.scheduledEnd)}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {task.title}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getPriorityColor(task.priority)} size="sm">
                      {task.priority}
                    </Badge>
                    <Badge className={getEnergyColor(task.energyRequirement)} size="sm">
                      {task.energyRequirement} energy
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {task.estimatedTime}min
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost">
                    <Play className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Pause className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Schedule Insights */}
        {scheduledTasks.length > 0 && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-green-600" />
              <span className="font-medium text-green-800 dark:text-green-200 text-sm">
                Schedule Optimization Insights
              </span>
            </div>
            
            <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
              <div>• High-priority tasks scheduled during peak focus hours</div>
              <div>• {preferences.breakDuration}-minute breaks optimally placed</div>
              <div>• Context switching minimized by grouping similar tasks</div>
              <div>• Buffer time included for unexpected delays</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};