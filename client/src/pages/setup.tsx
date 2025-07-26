import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, Settings, Database, Key, Chrome, ExternalLink } from "lucide-react";

export default function Setup() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
            <Settings className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">Setup Required</h1>
            <p className="text-xl text-muted-foreground mt-2">
              Configure Supabase authentication to continue
            </p>
          </div>
          
          <Alert className="max-w-2xl mx-auto">
            <Database className="h-4 w-4" />
            <AlertDescription>
              Supabase credentials are not configured. Please follow the setup guide below to enable Google authentication.
            </AlertDescription>
          </Alert>
        </div>

        {/* Setup Steps */}
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-lg px-3 py-1">1</Badge>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ExternalLink className="w-5 h-5" />
                    Create Supabase Project
                  </CardTitle>
                  <CardDescription>Set up your authentication backend</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Go to <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">supabase.com/dashboard</a></li>
                <li>Sign up or log in with your Google account</li>
                <li>Click <strong>"New Project"</strong></li>
                <li>Enter project name: <code className="bg-muted px-2 py-1 rounded">ai-smart-notes</code></li>
                <li>Choose a strong database password and select your region</li>
                <li>Wait 2-3 minutes for project creation</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-lg px-3 py-1">2</Badge>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    Get Supabase Credentials
                  </CardTitle>
                  <CardDescription>Copy your project URL and API key</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>In your Supabase dashboard, go to <strong>Settings → API</strong></li>
                <li>Copy the <strong>Project URL</strong> (looks like: https://abc123.supabase.co)</li>
                <li>Copy the <strong>anon public</strong> key under "Project API Keys"</li>
                <li>Add these as environment variables in Replit Secrets:
                  <div className="mt-2 p-3 bg-muted rounded-lg">
                    <div className="font-mono text-xs space-y-1">
                      <div><strong>VITE_SUPABASE_URL</strong> = your-project-url</div>
                      <div><strong>VITE_SUPABASE_ANON_KEY</strong> = your-anon-key</div>
                    </div>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-lg px-3 py-1">3</Badge>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Chrome className="w-5 h-5" />
                    Configure Google OAuth
                  </CardTitle>
                  <CardDescription>Enable Google sign-in provider</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Cloud Console</a></li>
                <li>Create a new project or select existing one</li>
                <li>Enable the Google+ API in <strong>APIs & Services → Library</strong></li>
                <li>Create OAuth credentials in <strong>APIs & Services → Credentials</strong></li>
                <li>Add authorized redirect URI: <code className="bg-muted px-2 py-1 rounded text-xs">https://[your-project-id].supabase.co/auth/v1/callback</code></li>
                <li>In Supabase, go to <strong>Authentication → Providers</strong></li>
                <li>Enable Google provider and enter your Client ID and Secret</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-lg px-3 py-1">4</Badge>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    Test Authentication
                  </CardTitle>
                  <CardDescription>Verify your setup is working</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Restart your Replit after adding environment variables</li>
                <li>Try clicking "Continue with Google" on the login page</li>
                <li>Complete the Google OAuth flow</li>
                <li>You should be redirected to the dashboard after successful login</li>
              </ol>
            </CardContent>
          </Card>
        </div>

        {/* Help */}
        <div className="text-center space-y-4">
          <div className="p-6 bg-muted/50 rounded-lg">
            <h3 className="font-semibold mb-2">Need Help?</h3>
            <p className="text-sm text-muted-foreground">
              Check the comprehensive <strong>SUPABASE_SETUP.md</strong> file in your project root for detailed instructions and troubleshooting tips.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}