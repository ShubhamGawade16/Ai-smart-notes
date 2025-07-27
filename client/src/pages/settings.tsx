import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Bell, 
  Moon, 
  Sun, 
  User, 
  Shield, 
  Smartphone, 
  Calendar,
  Zap,
  Crown
} from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    notifications: {
      taskReminders: true,
      deadlineAlerts: true,
      focusBreaks: true,
      dailySummary: false,
    },
    preferences: {
      defaultTaskPriority: 'medium',
      autoSchedule: false,
      compactView: false,
      showEstimates: true,
    },
    privacy: {
      dataCollection: true,
      personalizedAI: true,
      analyticsSharing: false,
    }
  });

  const updateSetting = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value
      }
    }));
    
    toast({
      title: "Setting updated",
      description: "Your preferences have been saved.",
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      {/* Profile & Account */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile & Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{user?.firstName} {user?.lastName}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={user?.tier === 'free' ? 'secondary' : 'default'}>
                {user?.tier === 'free' ? 'Free Plan' : `${user?.tier} Plan`}
              </Badge>
              {user?.tier === 'free' && (
                <Button size="sm" variant="outline">
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade
                </Button>
              )}
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">First Name</label>
              <Input value={user?.firstName || ''} placeholder="Enter first name" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Last Name</label>
              <Input value={user?.lastName || ''} placeholder="Enter last name" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Smart Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Task Reminders</p>
              <p className="text-sm text-muted-foreground">Get notified before task deadlines</p>
            </div>
            <Switch
              checked={settings.notifications.taskReminders}
              onCheckedChange={(checked) => updateSetting('notifications', 'taskReminders', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Deadline Alerts</p>
              <p className="text-sm text-muted-foreground">Urgent notifications for approaching deadlines</p>
            </div>
            <Switch
              checked={settings.notifications.deadlineAlerts}
              onCheckedChange={(checked) => updateSetting('notifications', 'deadlineAlerts', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Focus Break Reminders</p>
              <p className="text-sm text-muted-foreground">Periodic reminders to take breaks during focus sessions</p>
            </div>
            <Switch
              checked={settings.notifications.focusBreaks}
              onCheckedChange={(checked) => updateSetting('notifications', 'focusBreaks', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Daily Summary</p>
              <p className="text-sm text-muted-foreground">Evening recap of your productivity</p>
            </div>
            <Switch
              checked={settings.notifications.dailySummary}
              onCheckedChange={(checked) => updateSetting('notifications', 'dailySummary', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* App Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            App Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Theme</p>
              <p className="text-sm text-muted-foreground">Choose your preferred appearance</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              className="flex items-center gap-2"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {theme === 'dark' ? 'Light' : 'Dark'} Mode
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Auto-Schedule to Calendar</p>
              <p className="text-sm text-muted-foreground">Automatically add tasks to your calendar</p>
            </div>
            <Switch
              checked={settings.preferences.autoSchedule}
              onCheckedChange={(checked) => updateSetting('preferences', 'autoSchedule', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Compact View</p>
              <p className="text-sm text-muted-foreground">Show more items in less space</p>
            </div>
            <Switch
              checked={settings.preferences.compactView}
              onCheckedChange={(checked) => updateSetting('preferences', 'compactView', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Show Time Estimates</p>
              <p className="text-sm text-muted-foreground">Display AI-generated time estimates for tasks</p>
            </div>
            <Switch
              checked={settings.preferences.showEstimates}
              onCheckedChange={(checked) => updateSetting('preferences', 'showEstimates', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Mobile & Cross-Platform */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Mobile & Cross-Platform
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl mb-2">🌐</div>
              <p className="font-medium">Web App</p>
              <p className="text-sm text-muted-foreground">Optimized for all browsers</p>
              <Badge variant="outline" className="mt-2">Active</Badge>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl mb-2">📱</div>
              <p className="font-medium">Android App</p>
              <p className="text-sm text-muted-foreground">Native mobile experience</p>
              <Badge variant="secondary" className="mt-2">Available</Badge>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl mb-2">🍎</div>
              <p className="font-medium">iOS App</p>
              <p className="text-sm text-muted-foreground">iPhone & iPad support</p>
              <Badge variant="secondary" className="mt-2">Available</Badge>
            </div>
          </div>
          
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm">
              <strong>Sync Status:</strong> All your data syncs automatically across all devices. 
              Changes made on one device will appear on others within seconds.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy & Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Data Collection</p>
              <p className="text-sm text-muted-foreground">Allow app usage analytics to improve features</p>
            </div>
            <Switch
              checked={settings.privacy.dataCollection}
              onCheckedChange={(checked) => updateSetting('privacy', 'dataCollection', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Personalized AI</p>
              <p className="text-sm text-muted-foreground">Use your data to provide better AI recommendations</p>
            </div>
            <Switch
              checked={settings.privacy.personalizedAI}
              onCheckedChange={(checked) => updateSetting('privacy', 'personalizedAI', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Anonymous Analytics</p>
              <p className="text-sm text-muted-foreground">Share anonymous usage data to help improve the app</p>
            </div>
            <Switch
              checked={settings.privacy.analyticsSharing}
              onCheckedChange={(checked) => updateSetting('privacy', 'analyticsSharing', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline">Export Data</Button>
            <Button variant="outline">Import Data</Button>
            <Button variant="outline">Reset Preferences</Button>
            <Button variant="destructive" size="sm">Delete Account</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}