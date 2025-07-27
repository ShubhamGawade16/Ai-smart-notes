import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Clock, Zap, TrendingUp, AlertTriangle, Settings, CheckCircle2, Target } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ForgetRiskTask {
  id: string;
  title: string;
  riskScore: number;
  suggestedReminderTime: string;
  reasoning: string;
  currentReminder?: string;
}

interface ReminderSettings {
  sensitivity: 'gentle' | 'standard' | 'aggressive';
  adaptiveEnabled: boolean;
  contextualEnabled: boolean;
}

export function SmartReminderRecalibration() {
  const [settings, setSettings] = useState<ReminderSettings>({
    sensitivity: 'standard',
    adaptiveEnabled: true,
    contextualEnabled: true,
  });
  const { toast } = useToast();

  // Get tasks at risk of being forgotten
  const { data: riskTasks, isLoading } = useQuery({
    queryKey: ['/api/ai/forget-risk-analysis'],
    queryFn: async () => {
      const response = await apiRequest('/api/ai/forget-risk-analysis');
      return response as ForgetRiskTask[];
    },
    refetchInterval: 300000, // Update every 5 minutes
  });

  // Schedule smart reminder
  const scheduleReminderMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return apiRequest(`/api/ai/schedule-smart-reminder/${taskId}`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      toast({
        title: "Smart Reminder Scheduled",
        description: "AI has optimized the reminder timing based on your patterns.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ai/forget-risk-analysis'] });
    },
  });

  // Update reminder settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: ReminderSettings) => {
      return apiRequest('/api/ai/reminder-settings', {
        method: 'POST',
        body: JSON.stringify(newSettings),
      });
    },
    onSuccess: () => {
      toast({
        title: "Reminder Settings Updated",
        description: "Your reminder preferences have been saved and will take effect immediately.",
      });
    },
  });

  const getRiskColor = (score: number) => {
    if (score >= 0.8) return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900';
    return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
  };

  const getSensitivityLabel = (level: string) => {
    switch (level) {
      case 'gentle': return 'Gentle - Minimal interruptions';
      case 'aggressive': return 'Aggressive - Maximum prevention';
      default: return 'Standard - Balanced approach';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 animate-pulse" />
            Analyzing Forget Risk...
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
          <Bell className="h-5 w-5 text-primary" />
          Smart Reminder Recalibration
          <Badge variant="secondary" className="ml-2">
            <Zap className="h-3 w-3 mr-1" />
            AI-Powered
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          AI analyzes your patterns to prevent forgotten tasks with optimally-timed reminders
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Risk Analysis Results */}
        {riskTasks && riskTasks.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Tasks at Risk of Being Forgotten
            </h4>
            
            <div className="space-y-3">
              {riskTasks.map((task) => (
                <div key={task.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium mb-1">{task.title}</h5>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getRiskColor(task.riskScore)}>
                          {Math.round(task.riskScore * 100)}% forget risk
                        </Badge>
                        {task.currentReminder && (
                          <span className="text-sm text-muted-foreground">
                            Current: {task.currentReminder}
                          </span>
                        )}
                      </div>
                      <Progress value={task.riskScore * 100} className="h-2 mb-2" />
                    </div>
                  </div>
                  
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-sm">
                      <strong>AI Recommendation:</strong> {task.reasoning}
                    </p>
                    <p className="text-sm mt-1">
                      <strong>Optimal reminder time:</strong> {task.suggestedReminderTime}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm" 
                      onClick={() => scheduleReminderMutation.mutate(task.id)}
                      disabled={scheduleReminderMutation.isPending}
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      Apply Smart Timing
                    </Button>
                    <Button size="sm" variant="outline">
                      <Settings className="h-3 w-3 mr-1" />
                      Custom Time
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reminder Settings */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Reminder Settings
          </h4>
          
          <div className="space-y-4 p-4 border rounded-lg">
            {/* Sensitivity Level */}
            <div className="space-y-3">
              <Label>Reminder Sensitivity</Label>
              <div className="space-y-2">
                {(['gentle', 'standard', 'aggressive'] as const).map((level) => (
                  <div key={level} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={level}
                      name="sensitivity"
                      checked={settings.sensitivity === level}
                      onChange={() => setSettings({ ...settings, sensitivity: level })}
                      className="text-primary"
                    />
                    <label htmlFor={level} className="text-sm">
                      <span className="font-medium capitalize">{level}</span>
                      <span className="text-muted-foreground ml-2">
                        - {getSensitivityLabel(level)}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Toggles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="adaptive">Adaptive Scheduling</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically adjust reminder times based on your behavior
                  </p>
                </div>
                <Switch
                  id="adaptive"
                  checked={settings.adaptiveEnabled}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, adaptiveEnabled: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="contextual">Contextual Reminders</Label>
                  <p className="text-xs text-muted-foreground">
                    Consider calendar, location, and device usage patterns
                  </p>
                </div>
                <Switch
                  id="contextual"
                  checked={settings.contextualEnabled}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, contextualEnabled: checked })
                  }
                />
              </div>
            </div>

            <Button 
              onClick={() => updateSettingsMutation.mutate(settings)}
              disabled={updateSettingsMutation.isPending}
              className="w-full"
            >
              Save Reminder Settings
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <Target className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">94%</div>
            <div className="text-xs text-muted-foreground">Prevention Rate</div>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">12</div>
            <div className="text-xs text-muted-foreground">Tasks Saved</div>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">87%</div>
            <div className="text-xs text-muted-foreground">Timing Accuracy</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}