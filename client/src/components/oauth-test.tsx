import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

export function OAuthTest() {
  const [result, setResult] = useState<string>('');

  const testOAuth = async () => {
    if (!supabase) {
      setResult('❌ Supabase not configured');
      return;
    }

    try {
      console.log('Testing OAuth configuration...');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      console.log('OAuth test result:', { data, error });

      if (error) {
        setResult(`❌ OAuth Error: ${error.message}`);
      } else if (data?.url) {
        setResult(`✅ OAuth working! Redirect URL: ${data.url}`);
      } else {
        setResult('❌ OAuth returned null - Google provider not enabled in Supabase');
      }
    } catch (err) {
      setResult(`❌ Exception: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
      <h3 className="font-semibold mb-2">OAuth Diagnostic</h3>
      <Button onClick={testOAuth} className="mb-2">Test Google OAuth</Button>
      {result && <div className="text-sm mt-2">{result}</div>}
    </div>
  );
}