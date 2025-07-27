import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Bell, 
  Clock, 
  AlertTriangle, 
  Zap, 
  Target, 
  Brain,
  X,
  CheckCircle2,
  Timer,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TaskNotification {
  id: string;
  type: 'urgent_deadline' | 'overdue' | 'focus_reminder' | 'productivity_insight' | 'time_warning';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  taskId?: string;
  timeRemaining?: number;
  actionRequired: boolean;
  behaviorPattern?: string;
  dismissible: boolean;
  createdAt: Date;
}

interface UserBehaviorData {
  averageTaskTime: number;
  productiveHours: number[];
  completionRate: number;
  focusScore: number;
  procrastinationTendency: number;
  lastActiveTime: Date;
}

export function AINotificationSystem() {
  const [notifications, setNotifications] = useState<TaskNotification[]>([]);
  const [behaviorData, setBehaviorData] = useState<UserBehaviorData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { toast } = useToast();

  // Fetch tasks and analytics for behavior analysis
  const { data: tasks } = useQuery({
    queryKey: ['/api/tasks'],
    refetchInterval: 30000, // Check every 30 seconds
  });

  const { data: analytics } = useQuery({
    queryKey: ['/api/analytics/stats'],
    refetchInterval: 60000, // Update analytics every minute
  });

  // Analyze user behavior and generate intelligent notifications
  useEffect(() => {
    if (!tasks || !(tasks as any)?.tasks || !analytics) return;

    const analyzeBehavior = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const taskList = (tasks as any).tasks;

      // Calculate behavior metrics
      const completedTasks = taskList.filter((t: any) => t.completed);
      const pendingTasks = taskList.filter((t: any) => !t.completed);
      const overdueTasks = pendingTasks.filter((t: any) => 
        t.dueDate && new Date(t.dueDate) < now
      );
      const urgentTasks = pendingTasks.filter((t: any) => 
        t.dueDate && new Date(t.dueDate) <= new Date(now.getTime() + 4 * 60 * 60 * 1000) // 4 hours
      );

      const behaviorAnalysis: UserBehaviorData = {
        averageTaskTime: 45, // minutes
        productiveHours: [9, 10, 11, 14, 15], // Most productive hours
        completionRate: completedTasks.length / Math.max(taskList.length, 1) * 100,
        focusScore: Math.max(0, 100 - pendingTasks.length * 5),
        procrastinationTendency: overdueTasks.length > 0 ? 0.7 : 0.3,
        lastActiveTime: now,
      };

      setBehaviorData(behaviorAnalysis);

      // Generate AI-powered notifications
      const newNotifications: TaskNotification[] = [];

      // Overdue task alerts
      overdueTasks.forEach((task: any) => {
        const daysOverdue = Math.floor((now.getTime() - new Date(task.dueDate).getTime()) / (1000 * 60 * 60 * 24));
        newNotifications.push({
          id: `overdue-${task.id}`,
          type: 'overdue',
          title: `${task.title} is overdue`,
          message: `This task was due ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} ago. Consider breaking it into smaller parts or adjusting the deadline.`,
          priority: 'high',
          taskId: task.id,
          actionRequired: true,
          behaviorPattern: 'deadline_management',
          dismissible: false,
          createdAt: now,
        });
      });

      // Urgent deadline warnings
      urgentTasks.forEach((task: any) => {
        const hoursRemaining = Math.floor((new Date(task.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60));
        newNotifications.push({
          id: `urgent-${task.id}`,
          type: 'urgent_deadline',
          title: `${task.title} due in ${hoursRemaining}h`,
          message: `Based on your work patterns, you typically need ${behaviorAnalysis.averageTaskTime}min for similar tasks. Start now to avoid rushing.`,
          priority: 'high',
          taskId: task.id,
          timeRemaining: hoursRemaining,
          actionRequired: true,
          behaviorPattern: 'time_management',
          dismissible: true,
          createdAt: now,
        });
      });

      // Focus optimization alerts (during productive hours)
      if (behaviorAnalysis.productiveHours.includes(currentHour) && pendingTasks.length > 0) {
        const highPriorityTasks = pendingTasks.filter((t: any) => t.priority === 'high' || t.priority === 'urgent');
        if (highPriorityTasks.length > 0) {
          newNotifications.push({
            id: `focus-${currentHour}`,
            type: 'focus_reminder',
            title: 'Peak Focus Window Active',
            message: `It's ${currentHour}:00 - your most productive hour. Focus on "${highPriorityTasks[0].title}" for maximum impact.`,
            priority: 'medium',
            taskId: highPriorityTasks[0].id,
            actionRequired: false,
            behaviorPattern: 'peak_performance',
            dismissible: true,
            createdAt: now,
          });
        }
      }

      // Productivity insights based on behavior
      if (behaviorAnalysis.completionRate < 60) {
        newNotifications.push({
          id: `insight-completion`,
          type: 'productivity_insight',
          title: 'Completion Rate Below Target',
          message: `Your completion rate is ${Math.round(behaviorAnalysis.completionRate)}%. Try breaking large tasks into 25-minute chunks to improve momentum.`,
          priority: 'medium',
          actionRequired: false,
          behaviorPattern: 'task_completion',
          dismissible: true,
          createdAt: now,
        });
      }

      // Procrastination pattern detection
      if (behaviorAnalysis.procrastinationTendency > 0.6 && overdueTasks.length > 2) {
        newNotifications.push({
          id: `pattern-procrastination`,
          type: 'productivity_insight',
          title: 'Procrastination Pattern Detected',
          message: 'You have multiple overdue tasks. Start with the smallest one to build momentum, then tackle larger items.',
          priority: 'medium',
          actionRequired: true,
          behaviorPattern: 'procrastination_recovery',
          dismissible: true,
          createdAt: now,
        });
      }

      // Filter out duplicates and recently dismissed notifications
      const uniqueNotifications = newNotifications.filter((notification, index, self) => 
        index === self.findIndex(n => n.id === notification.id)
      );

      setNotifications(uniqueNotifications);
      
      // Show toast for high priority notifications
      const highPriorityNotifs = uniqueNotifications.filter(n => n.priority === 'high');
      if (highPriorityNotifs.length > 0 && notifications.length === 0) {
        setIsVisible(true);
        toast({
          title: "⚡ AI Alert",
          description: `${highPriorityNotifs.length} important task${highPriorityNotifs.length > 1 ? 's need' : ' needs'} your attention`,
          variant: "destructive",
        });
      }
    };

    analyzeBehavior();
  }, [tasks, analytics, notifications.length, toast]);

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleNotificationAction = (notification: TaskNotification) => {
    if (notification.taskId) {
      // Navigate to task or take specific action
      toast({
        title: "Opening Task",
        description: `Focusing on: ${notification.title}`,
      });
    }
    dismissNotification(notification.id);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low': return <Bell className="h-4 w-4 text-blue-500" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'urgent_deadline': return <Timer className="h-5 w-5 text-red-500" />;
      case 'overdue': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'focus_reminder': return <Target className="h-5 w-5 text-purple-500" />;
      case 'productivity_insight': return <Brain className="h-5 w-5 text-blue-500" />;
      case 'time_warning': return <Clock className="h-5 w-5 text-orange-500" />;
      default: return <Bell className="h-5 w-5" />;
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <Card className="w-full max-w-md mx-auto border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Notifications
            <Badge variant="secondary" className="ml-2">
              {notifications.length}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(!isVisible)}
          >
            {isVisible ? <X className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
          </Button>
        </CardTitle>
      </CardHeader>

      {isVisible && (
        <CardContent className="space-y-3">
          {behaviorData && (
            <div className="p-3 bg-muted rounded-lg text-sm">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="font-medium">Productivity Score: {Math.round(behaviorData.focusScore)}/100</span>
              </div>
              <Progress value={behaviorData.focusScore} className="h-2" />
            </div>
          )}

          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 border rounded-lg transition-all hover:shadow-md ${
                notification.priority === 'high' 
                  ? 'border-red-200 bg-red-50 dark:bg-red-950/20' 
                  : notification.priority === 'medium'
                  ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20'
                  : 'border-blue-200 bg-blue-50 dark:bg-blue-950/20'
              }`}
            >
              <div className="flex items-start gap-3">
                {getTypeIcon(notification.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm truncate">{notification.title}</h4>
                    {getPriorityIcon(notification.priority)}
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                    {notification.message}
                  </p>

                  {notification.timeRemaining && (
                    <div className="flex items-center gap-1 mb-2">
                      <Calendar className="h-3 w-3 text-orange-500" />
                      <span className="text-xs font-medium text-orange-600">
                        {notification.timeRemaining}h remaining
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {notification.actionRequired && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => handleNotificationAction(notification)}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Take Action
                      </Button>
                    )}
                    
                    {notification.dismissible && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => dismissNotification(notification.id)}
                      >
                        Dismiss
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}