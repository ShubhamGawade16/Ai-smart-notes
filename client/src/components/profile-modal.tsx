import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEmailAuth } from '@/hooks/use-email-auth';
import { useReplitAuth } from '@/hooks/use-replit-auth';
import { useToast } from '@/hooks/use-toast';
import { User, Clock, Globe, X, Save } from 'lucide-react';
import { useTimezone } from '@/hooks/use-timezone';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user: emailUser } = useEmailAuth();
  const { user: replitUser } = useReplitAuth();
  const user = replitUser || emailUser;
  const { toast } = useToast();
  const { detectedTimezone, userTimezone, isAutoDetected, autoUpdateTimezone, isUpdating } = useTimezone();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    timezone: 'UTC'
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        timezone: userTimezone || 'UTC'
      });
    }
  }, [user, userTimezone]);

  const timezones = [
    'UTC',
    'America/New_York',
    'America/Chicago', 
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Kolkata',
    'Australia/Sydney'
  ];

  const handleSave = () => {
    // Here you would typically make an API call to update user profile
    console.log('Saving profile:', formData);
    toast({
      title: "Profile Updated",
      description: "Your profile has been updated successfully.",
    });
    onClose();
  };

  const handleTimezoneAutoUpdate = () => {
    if (detectedTimezone) {
      autoUpdateTimezone(detectedTimezone);
      setFormData(prev => ({ ...prev, timezone: detectedTimezone }));
      toast({
        title: "Timezone Updated",
        description: `Timezone set to ${detectedTimezone}`,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white dark:bg-gray-900">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">Profile Settings</DialogTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">Manage your account settings</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4" />
              Personal Information
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-gray-700 dark:text-gray-300">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-gray-700 dark:text-gray-300">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-700 dark:text-gray-300">Email</Label>
              <Input
                value={user?.email || ''}
                disabled
                className="mt-1 bg-gray-50 dark:bg-gray-800"
              />
            </div>
          </div>

          {/* Timezone Settings */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Timezone Settings
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Detected Timezone</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{detectedTimezone}</p>
                </div>
                <Button
                  size="sm"
                  onClick={handleTimezoneAutoUpdate}
                  disabled={isUpdating || formData.timezone === detectedTimezone}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Clock className="w-4 h-4 mr-1" />
                  {isUpdating ? 'Updating...' : 'Use This'}
                </Button>
              </div>

              <div>
                <Label htmlFor="timezone" className="text-gray-700 dark:text-gray-300">Current Timezone</Label>
                <Select 
                  value={formData.timezone} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map(tz => (
                      <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white border-0"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}