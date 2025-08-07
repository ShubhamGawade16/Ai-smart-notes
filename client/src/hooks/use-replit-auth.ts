import { useQuery } from "@tanstack/react-query";

export function useReplitAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/replit-auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && Object.keys(user || {}).length > 0,
  };
}