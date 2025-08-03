import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TimezoneData {
  detectedTimezone: string;
  userTimezone?: string;
  isAutoDetected: boolean;
}

export function useTimezone() {
  const [detectedTimezone, setDetectedTimezone] = useState<string>("");
  const { toast } = useToast();

  // Get user profile data to check current timezone
  const { data: user } = useQuery<{ timezone?: string }>({
    queryKey: ['/api/user/profile'],
  });

  // Auto-detect timezone on mount
  useEffect(() => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setDetectedTimezone(detected);
    } catch (error) {
      console.error("Failed to detect timezone:", error);
      setDetectedTimezone("UTC");
    }
  }, []);

  // Auto-update timezone mutation
  const autoUpdateTimezoneMutation = useMutation({
    mutationFn: async (timezone: string) => {
      return apiRequest("POST", "/api/user/auto-timezone", { detectedTimezone: timezone });
    },
    onSuccess: (response: any) => {
      if (response?.success) {
        queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
        console.log("Timezone auto-updated:", response.timezone);
      }
    },
    onError: (error) => {
      console.error("Failed to auto-update timezone:", error);
    }
  });

  // Auto-update timezone when detected and user has default timezone
  useEffect(() => {
    if (detectedTimezone && user && (user.timezone === 'UTC' || !user.timezone)) {
      autoUpdateTimezoneMutation.mutate(detectedTimezone);
    }
  }, [detectedTimezone, user]);

  return {
    detectedTimezone,
    userTimezone: user?.timezone || "UTC",
    isAutoDetected: user?.timezone === detectedTimezone,
    autoUpdateTimezone: (tz: string) => autoUpdateTimezoneMutation.mutate(tz),
    isUpdating: autoUpdateTimezoneMutation.isPending
  };
}