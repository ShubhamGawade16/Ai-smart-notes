import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Brain, Clock, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ReminderSettings {
  sensitivity: 'gentle' | 'standard' | 'aggressive';
  enabled: boolean;
  smartTiming: boolean;
}

interface ForgetRiskTask {
  id: string;
  title: string;
  riskScore: number;
  suggestedReminderTime: string;
  reasoning: string;
}

export function SmartReminderSystem() {
  const [settings, setSettings] = useState<ReminderSettings>({
    sensitivity: 'standard',
    enabled: true,
    smartTiming: true,
  });
  const { toast } = useToast();

  // Get high-risk tasks that need smart reminders
  const { data: riskTasks, isLoading } = useQuery({
    queryKey: ['/api/ai/forget-risk-analysis'],
    queryFn: async () => {
      // Mock implementation - in production would analyze user behavior patterns
      return [
        {
          id: '1',
          title: 'Review quarterly budget',
          riskScore: 0.85,
          suggestedReminderTime: '2:30 PM today',
          reasoning: 'Similar tasks missed 3/5 times when reminded after 3 PM',
        },
        {
          id: '2', 
          title: 'Call dentist for appointment',
          riskScore: 0.72,
          suggestedReminderTime: '10:15 AM tomorrow',
          reasoning: 'Phone tasks have 40% higher completion when done in morning',
        },
        {
          id: '3',
          title: 'Submit expense report',
          riskScore: 0.91,
          suggestedReminderTime: '9:00 AM Friday',
          reasoning: 'Deadline-driven tasks need 2-day advance notice based on your patterns',
        },
      ] as ForgetRiskTask[];
    },
    refetchInterval: 300000, // Refresh every 5 minutes
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
        description: "Your smart reminder preferences have been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ai/forget-risk-analysis'] });
    },
  });

  // Schedule smart reminder for a task
  const scheduleReminderMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return apiRequest(`/api/ai/schedule-smart-reminder/${taskId}`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      toast({
        title: "Smart Reminder Scheduled",
        description: "You'll be reminded at the optimal time based on your patterns.",
      });
    },
  });

  const getRiskColor = (score: number) => {
    if (score >= 0.8) return 'text-red-500 bg-red-50 dark:bg-red-950';
    if (score >= 0.6) return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950';
    return 'text-green-500 bg-green-50 dark:bg-green-950';
  };

  const getSensitivityDescription = (level: string) => {
    switch (level) {
      case 'gentle': return 'Fewer, well-timed reminders';
      case 'aggressive': return 'More frequent, persistent reminders';
      default: return 'Balanced reminder frequency';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Smart Reminder Recalibration
          <Badge variant="secondary" className="ml-2">
            AI-Powered
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Enable Smart Reminders</h4>
              <p className="text-sm text-muted-foreground">
                AI adjusts reminder timing based on your behavior patterns
              </p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(enabled) => {
                const newSettings = { ...settings, enabled };
                setSettings(newSettings);
                updateSettingsMutation.mutate(newSettings);
              }}
            />
          </div>

          {settings.enabled && (
            <>
              <div className="space-y-2">
                <h4 className="font-medium">Sensitivity Level</h4>
                <Select
                  value={settings.sensitivity}
                  onValueChange={(sensitivity: any) => {
                    const newSettings = { ...settings, sensitivity };
                    setSettings(newSettings);
                    updateSettingsMutation.mutate(newSettings);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gentle">Gentle</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="aggressive">Aggressive</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {getSensitivityDescription(settings.sensitivity)}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Smart Timing</h4>
                  <p className="text-sm text-muted-foreground">
                    Automatically optimize reminder times for better completion rates
                  </p>
                </div>
                <Switch
                  checked={settings.smartTiming}
                  onCheckedChange={(smartTiming) => {
                    const newSettings = { ...settings, smartTiming };
                    setSettings(newSettings);
                    updateSettingsMutation.mutate(newSettings);
                  }}
                />
              </div>
            </>
          )}
        </div>

        {/* High-Risk Tasks */}
        {settings.enabled && riskTasks && riskTasks.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <h4 className="font-medium">Tasks at Risk of Being Forgotten</h4>
            </div>
            
            <div className="space-y-3">
              {riskTasks.map((task) => (
                <div key={task.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium">{task.title}</h5>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getRiskColor(task.riskScore)}>
                          {Math.round(task.riskScore * 100)}% forget risk
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Suggest: {task.suggestedReminderTime}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">
                      <strong>AI Insight:</strong> {task.reasoning}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => scheduleReminderMutation.mutate(task.id)}
                      disabled={scheduleReminderMutation.isPending}
                    >
                      <Bell className="h-3 w-3 mr-1" />
                      Schedule Smart Reminder
                    </Button>
                    <Button size="sm" variant="outline">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Mark as Handled
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Statistics */}
        {settings.enabled && (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">23%</div>
              <div className="text-xs text-muted-foreground">Completion Rate Improvement</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <Clock className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">156</div>
              <div className="text-xs text-muted-foreground">Smart Reminders Sent</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}