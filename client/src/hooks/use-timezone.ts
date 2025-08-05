import { useState, useEffect } from 'react';

export function useTimezone() {
  const [detectedTimezone, setDetectedTimezone] = useState<string>('');
  const [userTimezone, setUserTimezone] = useState<string>('UTC');
  const [isAutoDetected, setIsAutoDetected] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  useEffect(() => {
    // Detect user's timezone
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setDetectedTimezone(detected);
    
    // Check if user has a stored timezone preference
    const stored = localStorage.getItem('user-timezone');
    if (stored) {
      setUserTimezone(stored);
    } else {
      setUserTimezone(detected);
      setIsAutoDetected(true);
    }
  }, []);

  const autoUpdateTimezone = async (timezone: string) => {
    setIsUpdating(true);
    try {
      setUserTimezone(timezone);
      localStorage.setItem('user-timezone', timezone);
      setIsAutoDetected(true);
      
      // Here you would typically make an API call to update the user's timezone
      // await apiRequest("PATCH", "/api/user/timezone", { timezone });
    } catch (error) {
      console.error('Failed to update timezone:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    detectedTimezone,
    userTimezone,
    isAutoDetected,
    autoUpdateTimezone,
    isUpdating
  };
}