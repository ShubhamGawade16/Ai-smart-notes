import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { User, Clock, Globe, Settings, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface UserProfile {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  timezone?: string;
  tier?: string;
  dailyAiCalls?: number;
  createdAt?: string;
}

interface TimezoneUpdateResponse {
  success: boolean;
  timezone: string;
  message: string;
}

// Common timezones list
const COMMON_TIMEZONES = [
  { value: "UTC", label: "UTC (Universal Time)" },
  { value: "America/New_York", label: "Eastern Time (US)" },
  { value: "America/Chicago", label: "Central Time (US)" },
  { value: "America/Denver", label: "Mountain Time (US)" },  
  { value: "America/Los_Angeles", label: "Pacific Time (US)" },
  { value: "America/Toronto", label: "Toronto" },
  { value: "America/Vancouver", label: "Vancouver" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Paris", label: "Paris" },
  { value: "Europe/Berlin", label: "Berlin" },
  { value: "Europe/Rome", label: "Rome" },
  { value: "Europe/Madrid", label: "Madrid" },
  { value: "Asia/Tokyo", label: "Tokyo" },
  { value: "Asia/Shanghai", label: "Shanghai" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Asia/Dubai", label: "Dubai" },
  { value: "Asia/Kolkata", label: "Mumbai/Delhi" },
  { value: "Australia/Sydney", label: "Sydney" },
  { value: "Australia/Melbourne", label: "Melbourne" },
  { value: "Pacific/Auckland", label: "Auckland" }
];

interface UserProfileProps {
  onClose?: () => void;
}

export function UserProfile({ onClose }: UserProfileProps) {
  const { toast } = useToast();
  const [detectedTimezone, setDetectedTimezone] = useState<string>("");
  const [selectedTimezone, setSelectedTimezone] = useState<string>("");

  // Get user profile data
  const { data: user, isLoading: isLoadingUser } = useQuery<UserProfile>({
    queryKey: ['/api/user/profile'],
  });

  // Auto-detect timezone on component mount
  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setDetectedTimezone(detected);
    
    // Auto-update user timezone if not set
    if (detected && user && (user.timezone === 'UTC' || !user.timezone)) {
      autoUpdateTimezoneMutation.mutate({ detectedTimezone: detected });
    }
  }, [user]);

  // Set selected timezone when user data loads
  useEffect(() => {
    if (user?.timezone) {
      setSelectedTimezone(user.timezone);
    }
  }, [user]);

  // Auto-update timezone mutation
  const autoUpdateTimezoneMutation = useMutation<TimezoneUpdateResponse, Error, { detectedTimezone: string }>({
    mutationFn: async (data: { detectedTimezone: string }) => {
      const response = await apiRequest("POST", "/api/user/auto-timezone", data);
      return response as unknown as TimezoneUpdateResponse;
    },
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
        toast({
          title: "Timezone Auto-Detected",
          description: `Your timezone has been set to ${response.timezone}`,
        });
      }
    },
    onError: () => {
      toast({
        title: "Auto-Detection Failed",
        description: "Could not auto-detect your timezone. Please set it manually.",
        variant: "destructive",
      });
    }
  });

  // Manual timezone update mutation
  const updateTimezoneMutation = useMutation<TimezoneUpdateResponse, Error, { timezone: string }>({
    mutationFn: async (data: { timezone: string }) => {
      const response = await apiRequest("PATCH", "/api/user/timezone", data);
      return response as unknown as TimezoneUpdateResponse;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
      toast({
        title: "Timezone Updated",
        description: response.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update timezone",
        variant: "destructive",
      });
    }
  });

  const handleTimezoneUpdate = () => {
    if (selectedTimezone && selectedTimezone !== user?.timezone) {
      updateTimezoneMutation.mutate({ timezone: selectedTimezone });
    }
  };

  const handleAutoDetect = () => {
    if (detectedTimezone) {
      setSelectedTimezone(detectedTimezone);
      updateTimezoneMutation.mutate({ timezone: detectedTimezone });
    }
  };

  const getCurrentTime = (timezone: string) => {
    try {
      return new Date().toLocaleString("en-US", { 
        timeZone: timezone,
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });
    } catch {
      return "Invalid timezone";
    }
  };

  if (isLoadingUser) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            User Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            User Profile Settings
          </CardTitle>
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* User Info Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <User className="w-4 h-4" />
            Account Information
          </h3>
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</Label>
              <p className="text-sm font-mono">{user?.email || "Not available"}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Account Tier</Label>
              <p className="text-sm capitalize">{user?.tier || "free"}</p>
            </div>
          </div>
        </div>

        {/* Timezone Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Timezone Settings
          </h3>
          
          {/* Current Timezone Display */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <Label className="font-medium text-blue-800 dark:text-blue-200">Current Timezone</Label>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">
              {user?.timezone || "UTC"} 
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              {getCurrentTime(user?.timezone || "UTC")}
            </p>
          </div>

          {/* Auto-Detection */}
          {detectedTimezone && detectedTimezone !== user?.timezone && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                <Label className="font-medium text-green-800 dark:text-green-200">Auto-Detected Timezone</Label>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 mb-1">
                {detectedTimezone}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mb-3">
                {getCurrentTime(detectedTimezone)}
              </p>
              <Button 
                size="sm" 
                onClick={handleAutoDetect}
                disabled={updateTimezoneMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {updateTimezoneMutation.isPending ? "Updating..." : "Use Auto-Detected"}
              </Button>
            </div>
          )}

          {/* Manual Timezone Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Change Timezone</Label>
            <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
              <SelectTrigger>
                <SelectValue placeholder="Select a timezone" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {COMMON_TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    <div className="flex flex-col">
                      <span>{tz.label}</span>
                      <span className="text-xs text-gray-500">
                        {getCurrentTime(tz.value)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedTimezone && selectedTimezone !== user?.timezone && (
              <Button 
                onClick={handleTimezoneUpdate}
                disabled={updateTimezoneMutation.isPending}
                className="w-full"
              >
                {updateTimezoneMutation.isPending ? "Updating..." : "Update Timezone"}
              </Button>
            )}
          </div>
        </div>

        {/* Smart Timing Info */}
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <Label className="font-medium text-amber-800 dark:text-amber-200">Smart Timing</Label>
          </div>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Your timezone is used for Smart Timing analysis to provide optimal task scheduling based on your local time and circadian rhythms.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}