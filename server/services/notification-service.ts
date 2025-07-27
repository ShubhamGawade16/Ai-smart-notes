import { storage } from '../storage';

interface PushNotificationPayload {
  title: string;
  body: string;
  data?: {
    taskId?: string;
    type: 'urgent_deadline' | 'overdue' | 'focus_reminder' | 'productivity_insight';
    action?: string;
  };
  badge?: number;
  sound?: string;
  priority?: 'high' | 'normal' | 'low';
}

interface NotificationSchedule {
  id: string;
  userId: string;
  taskId?: string;
  type: 'urgent_deadline' | 'overdue' | 'focus_reminder' | 'productivity_insight';
  scheduledFor: Date;
  payload: PushNotificationPayload;
  sent: boolean;
  platform?: 'web' | 'ios' | 'android';
}

class NotificationService {
  private notifications: NotificationSchedule[] = [];

  // Schedule a notification based on task analysis
  async scheduleNotification(
    userId: string, 
    notification: Omit<NotificationSchedule, 'id' | 'sent'>
  ): Promise<string> {
    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const scheduledNotification: NotificationSchedule = {
      id: notificationId,
      userId,
      sent: false,
      ...notification
    };

    this.notifications.push(scheduledNotification);
    console.log(`Scheduled notification: ${notification.type} for user ${userId}`);
    
    return notificationId;
  }

  // Get pending notifications for a user (for real-time display)
  async getPendingNotifications(userId: string): Promise<NotificationSchedule[]> {
    const now = new Date();
    return this.notifications.filter(n => 
      n.userId === userId && 
      !n.sent && 
      n.scheduledFor <= now
    );
  }

  // Process task-based notifications with AI analysis
  async analyzeAndScheduleTaskNotifications(userId: string): Promise<void> {
    try {
      const tasks = await storage.getTasks(userId);
      const now = new Date();

      for (const task of tasks) {
        if (task.completed) continue;

        // Overdue notifications
        if (task.dueDate && new Date(task.dueDate) < now) {
          const daysOverdue = Math.floor((now.getTime() - new Date(task.dueDate).getTime()) / (1000 * 60 * 60 * 24));
          
          await this.scheduleNotification(userId, {
            taskId: task.id,
            type: 'overdue',
            scheduledFor: now,
            payload: {
              title: `${task.title} is overdue`,
              body: `This task was due ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} ago`,
              data: {
                taskId: task.id,
                type: 'overdue',
                action: 'view_task'
              },
              priority: 'high',
              badge: 1
            }
          });
        }

        // Urgent deadline warnings (within 4 hours)
        if (task.dueDate) {
          const dueTime = new Date(task.dueDate).getTime();
          const hoursUntilDue = (dueTime - now.getTime()) / (1000 * 60 * 60);
          
          if (hoursUntilDue > 0 && hoursUntilDue <= 4) {
            const estimatedTime = task.estimatedTime || 45; // Default 45 minutes
            const shouldStartTime = new Date(dueTime - (estimatedTime * 60 * 1000));
            
            if (now >= shouldStartTime) {
              await this.scheduleNotification(userId, {
                taskId: task.id,
                type: 'urgent_deadline',
                scheduledFor: now,
                payload: {
                  title: `Start "${task.title}" now`,
                  body: `Due in ${Math.ceil(hoursUntilDue)}h. Estimated time: ${estimatedTime}min`,
                  data: {
                    taskId: task.id,
                    type: 'urgent_deadline',
                    action: 'start_task'
                  },
                  priority: 'high',
                  badge: 1
                }
              });
            }
          }
        }
      }

      // Focus reminders during productive hours
      const currentHour = now.getHours();
      const productiveHours = [9, 10, 11, 14, 15]; // Most productive hours
      
      if (productiveHours.includes(currentHour)) {
        const highPriorityTasks = tasks.filter(t => 
          !t.completed && (t.priority === 'high' || t.priority === 'urgent')
        );
        
        if (highPriorityTasks.length > 0) {
          await this.scheduleNotification(userId, {
            taskId: highPriorityTasks[0].id,
            type: 'focus_reminder',
            scheduledFor: now,
            payload: {
              title: 'Peak Focus Window Active',
              body: `Focus on "${highPriorityTasks[0].title}" for maximum impact`,
              data: {
                taskId: highPriorityTasks[0].id,
                type: 'focus_reminder',
                action: 'focus_session'
              },
              priority: 'normal'
            }
          });
        }
      }

    } catch (error) {
      console.error('Error analyzing tasks for notifications:', error);
    }
  }

  // Cross-platform notification delivery
  async deliverNotification(
    notificationId: string, 
    platform: 'web' | 'ios' | 'android'
  ): Promise<boolean> {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (!notification || notification.sent) {
      return false;
    }

    try {
      switch (platform) {
        case 'web':
          // Web Push API (Service Worker)
          await this.sendWebPush(notification);
          break;
          
        case 'ios':
          // APNs (Apple Push Notification service)
          await this.sendAPNs(notification);
          break;
          
        case 'android':
          // FCM (Firebase Cloud Messaging)
          await this.sendFCM(notification);
          break;
      }

      notification.sent = true;
      notification.platform = platform;
      
      console.log(`Delivered ${notification.type} notification to ${platform}`);
      return true;
      
    } catch (error) {
      console.error(`Failed to deliver notification to ${platform}:`, error);
      return false;
    }
  }

  // Web Push (Progressive Web App)
  private async sendWebPush(notification: NotificationSchedule): Promise<void> {
    // Implementation would use web-push library
    // For now, this is handled by the React component
    console.log('Web push notification ready:', notification.payload.title);
  }

  // iOS Push Notifications (APNs)
  private async sendAPNs(notification: NotificationSchedule): Promise<void> {
    // Implementation would use node-apn or HTTP/2 APNs API
    const apnsPayload = {
      aps: {
        alert: {
          title: notification.payload.title,
          body: notification.payload.body,
        },
        badge: notification.payload.badge || 1,
        sound: notification.payload.sound || 'default',
        category: notification.payload.data?.type || 'general'
      },
      customData: notification.payload.data
    };
    
    console.log('APNs payload ready:', apnsPayload);
    // await apnsProvider.send(apnsPayload, deviceToken);
  }

  // Android Push Notifications (FCM)
  private async sendFCM(notification: NotificationSchedule): Promise<void> {
    // Implementation would use firebase-admin
    const fcmPayload = {
      notification: {
        title: notification.payload.title,
        body: notification.payload.body,
        sound: notification.payload.sound || 'default',
      },
      data: notification.payload.data ? {
        taskId: notification.payload.data.taskId || '',
        type: notification.payload.data.type,
        action: notification.payload.data.action || ''
      } : {},
      android: {
        priority: notification.payload.priority === 'high' ? 'high' : 'normal',
        notification: {
          channel_id: 'gpt_do_tasks',
          priority: notification.payload.priority === 'high' ? 'high' : 'default'
        }
      }
    };
    
    console.log('FCM payload ready:', fcmPayload);
    // await admin.messaging().send({ token: deviceToken, ...fcmPayload });
  }

  // Mark notification as read/dismissed
  async markNotificationRead(notificationId: string): Promise<boolean> {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index === -1) return false;
    
    this.notifications.splice(index, 1);
    return true;
  }

  // Get notification history for analytics
  async getNotificationHistory(userId: string, limit: number = 50): Promise<NotificationSchedule[]> {
    return this.notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => b.scheduledFor.getTime() - a.scheduledFor.getTime())
      .slice(0, limit);
  }

  // Clean up old notifications
  async cleanupOldNotifications(): Promise<void> {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    this.notifications = this.notifications.filter(n => 
      n.scheduledFor > oneWeekAgo
    );
  }
}

export const notificationService = new NotificationService();

// Background job to process notifications every minute
setInterval(async () => {
  try {
    // Get all users and analyze their tasks
    // This would typically be done with a proper job queue in production
    const users = ['demo-user']; // In production, get from user database
    
    for (const userId of users) {
      await notificationService.analyzeAndScheduleTaskNotifications(userId);
    }
    
    // Clean up old notifications weekly
    if (Math.random() < 0.001) { // ~0.1% chance per minute = ~once per week
      await notificationService.cleanupOldNotifications();
    }
    
  } catch (error) {
    console.error('Background notification processing error:', error);
  }
}, 60000); // Every minute