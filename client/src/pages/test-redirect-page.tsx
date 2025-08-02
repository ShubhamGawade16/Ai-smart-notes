import { useEffect } from "react";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";

export default function TestRedirectPage() {
  const { user, isLoading } = useSupabaseAuth();

  useEffect(() => {
    // Simple forced redirect for testing
    if (!isLoading) {
      console.log('Current user:', user);
      if (user) {
        window.location.href = "/onboarding";
      } else {
        window.location.href = "/auth";
      }
    }
  }, [user, isLoading]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-4">Redirecting...</h2>
        <p className="text-gray-600">Setting up your Planify experience</p>
      </div>
    </div>
  );
}