import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface AdminStatus {
  isAdmin: boolean;
  userId?: string;
}

export function useAdmin() {
  const { data: adminStatus, isLoading } = useQuery<AdminStatus>({
    queryKey: ['/api/admin/status'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/status');
      if (!response.ok) {
        return { isAdmin: false };
      }
      return await response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    isAdmin: adminStatus?.isAdmin ?? false,
    userId: adminStatus?.userId,
    isLoading
  };
}