import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-supabase-auth";

export default function AuthDebugPage() {
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user, supabaseUser } = useAuth();

  useEffect(() => {
    const checkSession = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.auth.getSession();
        console.log('Debug session check:', { data, error });
        
        setSessionInfo({
          session: data.session,
          user: data.session?.user,
          error: error,
          token: data.session?.access_token,
          email: data.session?.user?.email,
          authUser: user,
          supabaseUser: supabaseUser
        });
      } catch (error) {
        console.error('Debug session error:', error);
        setSessionInfo({ error: error });
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [user, supabaseUser]);

  const forceRedirectToDashboard = () => {
    console.log('🚀 Force redirect to dashboard');
    window.location.href = '/dashboard';
  };

  if (loading) {
    return <div className="p-4">Loading debug info...</div>;
  }

  return (
    <div className="min-h-screen p-4">
      <Card className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Authentication Debug</h1>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Auth Hook State:</h3>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
              {JSON.stringify({ user, supabaseUser }, null, 2)}
            </pre>
          </div>
          
          <div>
            <h3 className="font-semibold">Session Info:</h3>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
              {JSON.stringify(sessionInfo, null, 2)}
            </pre>
          </div>
          
          <div className="space-x-2">
            <Button onClick={forceRedirectToDashboard}>
              Force Redirect to Dashboard
            </Button>
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}