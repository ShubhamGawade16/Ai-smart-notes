import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Clock, CheckCircle, X, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TaskNotification {
  id: string;
  taskId: string;
  taskTitle: string;
  type: 'reminder' | 'deadline' | 'break' | 'focus';
  message: string;
  scheduledFor: Date;
  isActive: boolean;
}

export function NotificationSystem() {
  const [notifications, setNotifications] = useState<TaskNotification[]>([]);
  const [isEnabled, setIsEnabled] = useState(false);
  const { toast } = useToast();

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          setIsEnabled(permission === 'granted');
        });
      } else {
        setIsEnabled(Notification.permission === 'granted');
      }
    }
  }, []);

  // Mock notifications for demo - in real app these would come from task data
  useEffect(() => {
    const mockNotifications: TaskNotification[] = [
      {
        id: '1',
        taskId: 'task-1',
        taskTitle: 'Review quarterly reports',
        type: 'reminder',
        message: 'Reminder: Review quarterly reports starts in 15 minutes',
        scheduledFor: new Date(Date.now() + 15 * 60 * 1000),
        isActive: true
      },
      {
        id: '2',
        taskId: 'task-2',
        taskTitle: 'Team meeting prep',
        type: 'deadline',
        message: 'Deadline approaching: Team meeting prep due in 1 hour',
        scheduledFor: new Date(Date.now() + 60 * 60 * 1000),
        isActive: true
      },
      {
        id: '3',
        taskId: 'focus-break',
        taskTitle: 'Focus Break',
        type: 'break',
        message: 'Time for a 5-minute break! You\'ve been focused for 25 minutes.',
        scheduledFor: new Date(Date.now() + 5 * 60 * 1000),
        isActive: true
      }
    ];
    setNotifications(mockNotifications);
  }, []);

  const sendNotification = (notification: TaskNotification) => {
    if (!isEnabled) return;

    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(`AI Smart Notes - ${notification.type.toUpperCase()}`, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        requireInteraction: true,
        actions: [
          { action: 'view', title: 'View Task' },
          { action: 'dismiss', title: 'Dismiss' }
        ]
      });

      browserNotification.onclick = () => {
        window.focus();
        // Navigate to task or focus on it
        dismissNotification(notification.id);
      };

      // Auto-dismiss after 10 seconds for non-urgent notifications
      if (notification.type !== 'deadline') {
        setTimeout(() => {
          browserNotification.close();
        }, 10000);
      }
    }

    // In-app toast notification
    toast({
      title: `${notification.type.charAt(0).toUpperCase() + notification.type.slice(1)} Alert`,
      description: notification.message,
      duration: notification.type === 'deadline' ? 0 : 5000, // Persistent for deadlines
    });
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isActive: false } : n)
    );
  };

  const scheduleTaskNotifications = (task: any) => {
    const notifications: TaskNotification[] = [];
    const now = new Date();
    const taskDue = task.dueDate ? new Date(task.dueDate) : null;
    const estimatedMinutes = task.estimatedTime || 30;

    // Due date reminders
    if (taskDue && taskDue > now) {
      const timeUntilDue = taskDue.getTime() - now.getTime();
      
      // 1 hour before
      if (timeUntilDue > 60 * 60 * 1000) {
        notifications.push({
          id: `${task.id}-1hr`,
          taskId: task.id,
          taskTitle: task.title,
          type: 'reminder',
          message: `Reminder: "${task.title}" is due in 1 hour`,
          scheduledFor: new Date(taskDue.getTime() - 60 * 60 * 1000),
          isActive: true
        });
      }

      // 15 minutes before
      if (timeUntilDue > 15 * 60 * 1000) {
        notifications.push({
          id: `${task.id}-15min`,
          taskId: task.id,
          taskTitle: task.title,
          type: 'deadline',
          message: `Urgent: "${task.title}" is due in 15 minutes!`,
          scheduledFor: new Date(taskDue.getTime() - 15 * 60 * 1000),
          isActive: true
        });
      }
    }

    // Focus session reminders based on estimated time
    if (estimatedMinutes >= 25) {
      notifications.push({
        id: `${task.id}-focus`,
        taskId: task.id,
        taskTitle: task.title,
        type: 'focus',
        message: `Time to focus on "${task.title}" - estimated ${estimatedMinutes} minutes`,
        scheduledFor: new Date(now.getTime() + 2 * 60 * 1000), // 2 minutes from now for demo
        isActive: true
      });
    }

    return notifications;
  };

  // Simulate checking for due notifications
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const now = new Date();
      notifications.forEach(notification => {
        if (notification.isActive && notification.scheduledFor <= now) {
          sendNotification(notification);
          dismissNotification(notification.id);
        }
      });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(checkInterval);
  }, [notifications, isEnabled]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reminder': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'deadline': return <Bell className="h-4 w-4 text-red-500" />;
      case 'break': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'focus': return <Settings className="h-4 w-4 text-purple-500" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const activeNotifications = notifications.filter(n => n.isActive);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Smart Notifications
            <Badge variant={isEnabled ? "default" : "secondary"}>
              {isEnabled ? "Active" : "Disabled"}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if ('Notification' in window) {
                Notification.requestPermission().then(permission => {
                  setIsEnabled(permission === 'granted');
                  toast({
                    title: permission === 'granted' ? "Notifications enabled" : "Notifications blocked",
                    description: permission === 'granted' 
                      ? "You'll receive smart reminders for your tasks"
                      : "Enable notifications in your browser settings to get task reminders"
                  });
                });
              }
            }}
          >
            {isEnabled ? "Settings" : "Enable"}
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {!isEnabled ? (
          <div className="text-center py-6 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-2">Smart notifications are disabled</p>
            <p className="text-sm">Enable to get intelligent reminders based on your task timing and priorities</p>
          </div>
        ) : activeNotifications.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <p className="mb-2">All caught up!</p>
            <p className="text-sm">No pending notifications. Smart alerts will appear based on your task schedule.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              Upcoming smart notifications based on your tasks:
            </p>
            {activeNotifications.slice(0, 3).map((notification) => (
              <div key={notification.id} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                {getNotificationIcon(notification.type)}
                <div className="flex-1">
                  <p className="text-sm font-medium">{notification.taskTitle}</p>
                  <p className="text-xs text-muted-foreground">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Scheduled for {notification.scheduledFor.toLocaleTimeString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissNotification(notification.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            
            {activeNotifications.length > 3 && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                +{activeNotifications.length - 3} more notifications scheduled
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}