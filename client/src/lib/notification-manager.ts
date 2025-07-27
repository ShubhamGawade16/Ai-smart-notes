// Cross-platform notification manager for Web, iOS, and Android

interface NotificationPermission {
  granted: boolean;
  platform: 'web' | 'ios' | 'android';
  deviceToken?: string;
}

interface TaskNotification {
  id: string;
  title: string;
  body: string;
  taskId?: string;
  type: 'urgent_deadline' | 'overdue' | 'focus_reminder' | 'productivity_insight';
  scheduledFor: Date;
  priority: 'high' | 'normal' | 'low';
}

class CrossPlatformNotificationManager {
  private permission: NotificationPermission | null = null;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  // Initialize notifications based on platform
  async initialize(): Promise<NotificationPermission> {
    // Detect platform
    const platform = this.detectPlatform();
    
    switch (platform) {
      case 'web':
        return await this.initializeWebNotifications();
      case 'ios':
        return await this.initializeIOSNotifications();
      case 'android':
        return await this.initializeAndroidNotifications();
      default:
        throw new Error('Unsupported platform');
    }
  }

  private detectPlatform(): 'web' | 'ios' | 'android' {
    // Check if running in Capacitor (mobile app)
    if (window.Capacitor) {
      return window.Capacitor.getPlatform() as 'ios' | 'android';
    }
    
    // Default to web for browser/PWA
    return 'web';
  }

  // Web Notifications (Browser/PWA)
  private async initializeWebNotifications(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      // Register service worker for background notifications
      if ('serviceWorker' in navigator) {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered for notifications');
      }

      // Subscribe to push notifications (would need VAPID keys in production)
      const subscription = await this.subscribeToPush();
      
      this.permission = {
        granted: true,
        platform: 'web',
        deviceToken: subscription ? JSON.stringify(subscription) : undefined
      };
    } else {
      this.permission = { granted: false, platform: 'web' };
    }

    return this.permission;
  }

  // iOS Notifications (Capacitor + APNs)
  private async initializeIOSNotifications(): Promise<NotificationPermission> {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const { PushNotifications } = await import('@capacitor/push-notifications');

    try {
      // Request local notification permission
      const localPermission = await LocalNotifications.requestPermissions();
      
      if (localPermission.display === 'granted') {
        // Request push notification permission
        const pushPermission = await PushNotifications.requestPermissions();
        
        if (pushPermission.receive === 'granted') {
          // Register for push notifications
          await PushNotifications.register();
          
          // Get device token
          const token = await new Promise<string>((resolve) => {
            PushNotifications.addListener('registration', (token) => {
              resolve(token.value);
            });
          });

          this.permission = {
            granted: true,
            platform: 'ios',
            deviceToken: token
          };

          // Set up push notification handlers
          this.setupIOSHandlers();
        }
      }
    } catch (error) {
      console.error('iOS notification setup failed:', error);
      this.permission = { granted: false, platform: 'ios' };
    }

    return this.permission!;
  }

  // Android Notifications (Capacitor + FCM)
  private async initializeAndroidNotifications(): Promise<NotificationPermission> {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const { PushNotifications } = await import('@capacitor/push-notifications');

    try {
      // Request permissions
      const localPermission = await LocalNotifications.requestPermissions();
      
      if (localPermission.display === 'granted') {
        const pushPermission = await PushNotifications.requestPermissions();
        
        if (pushPermission.receive === 'granted') {
          // Register for FCM
          await PushNotifications.register();
          
          // Get FCM token
          const token = await new Promise<string>((resolve) => {
            PushNotifications.addListener('registration', (token) => {
              resolve(token.value);
            });
          });

          this.permission = {
            granted: true,
            platform: 'android',
            deviceToken: token
          };

          // Set up Android notification handlers
          this.setupAndroidHandlers();
        }
      }
    } catch (error) {
      console.error('Android notification setup failed:', error);
      this.permission = { granted: false, platform: 'android' };
    }

    return this.permission!;
  }

  // Schedule local notification (works on all platforms)
  async scheduleNotification(notification: TaskNotification): Promise<boolean> {
    if (!this.permission?.granted) {
      console.warn('Notifications not permitted');
      return false;
    }

    try {
      switch (this.permission.platform) {
        case 'web':
          return await this.scheduleWebNotification(notification);
        case 'ios':
        case 'android':
          return await this.scheduleCapacitorNotification(notification);
      }
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      return false;
    }
  }

  // Web notification scheduling
  private async scheduleWebNotification(notification: TaskNotification): Promise<boolean> {
    const delay = notification.scheduledFor.getTime() - Date.now();
    
    if (delay <= 0) {
      // Show immediately
      new Notification(notification.title, {
        body: notification.body,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: notification.id,
        data: {
          taskId: notification.taskId,
          type: notification.type
        },
        requireInteraction: notification.priority === 'high'
      });
      return true;
    } else {
      // Schedule for later
      setTimeout(() => {
        new Notification(notification.title, {
          body: notification.body,
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          tag: notification.id,
          data: {
            taskId: notification.taskId,
            type: notification.type
          },
          requireInteraction: notification.priority === 'high'
        });
      }, delay);
      return true;
    }
  }

  // Capacitor notification scheduling (iOS/Android)
  private async scheduleCapacitorNotification(notification: TaskNotification): Promise<boolean> {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    
    await LocalNotifications.schedule({
      notifications: [{
        title: notification.title,
        body: notification.body,
        id: parseInt(notification.id.replace(/\D/g, '').slice(-8)), // Convert to number
        schedule: { at: notification.scheduledFor },
        extra: {
          taskId: notification.taskId,
          type: notification.type
        },
        sound: 'default',
        smallIcon: 'ic_stat_icon_config_sample',
        iconColor: '#3B82F6'
      }]
    });
    
    return true;
  }

  // Set up iOS notification handlers
  private setupIOSHandlers(): void {
    import('@capacitor/push-notifications').then(({ PushNotifications }) => {
      // Handle notification received while app is in foreground
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('iOS push received:', notification);
        // Show in-app notification or update UI
      });

      // Handle notification action
      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('iOS push action:', notification);
        this.handleNotificationAction(notification.notification.data);
      });
    });
  }

  // Set up Android notification handlers
  private setupAndroidHandlers(): void {
    import('@capacitor/push-notifications').then(({ PushNotifications }) => {
      // Handle notification received
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Android push received:', notification);
        // Show in-app notification or update UI
      });

      // Handle notification action
      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Android push action:', notification);
        this.handleNotificationAction(notification.notification.data);
      });
    });
  }

  // Handle notification tap/action
  private handleNotificationAction(data: any): void {
    if (data.taskId) {
      // Navigate to specific task
      window.location.hash = `/task/${data.taskId}`;
    }
    
    switch (data.type) {
      case 'urgent_deadline':
        // Start focus session
        this.startFocusSession(data.taskId);
        break;
      case 'overdue':
        // Open task for editing/completion
        this.openTask(data.taskId);
        break;
      case 'focus_reminder':
        // Show focus mode
        this.showFocusMode();
        break;
    }
  }

  private startFocusSession(taskId: string): void {
    // Implementation to start focus session
    console.log('Starting focus session for task:', taskId);
  }

  private openTask(taskId: string): void {
    // Implementation to open task
    console.log('Opening task:', taskId);
  }

  private showFocusMode(): void {
    // Implementation to show focus mode
    console.log('Showing focus mode');
  }

  // Web Push subscription (for production use)
  private async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.serviceWorkerRegistration) return null;

    try {
      // In production, you would use your VAPID public key
      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: 'your-vapid-public-key' // Replace with actual VAPID key
      });

      // Send subscription to server
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });

      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return null;
    }
  }

  // Get notification permission status
  getPermissionStatus(): NotificationPermission | null {
    return this.permission;
  }

  // Send device token to server for push notifications
  async registerDeviceToken(): Promise<void> {
    if (!this.permission?.deviceToken) return;

    try {
      await fetch('/api/notifications/register-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: this.permission.deviceToken,
          platform: this.permission.platform,
          userId: 'demo-user' // Replace with actual user ID
        })
      });
    } catch (error) {
      console.error('Failed to register device token:', error);
    }
  }
}

export const notificationManager = new CrossPlatformNotificationManager();

// Auto-initialize when module loads
notificationManager.initialize().catch(console.error);