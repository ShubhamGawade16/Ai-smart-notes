import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, ExternalLink, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SupabaseSetupGuide() {
  const { toast } = useToast();
  const [copiedItems, setCopiedItems] = useState<string[]>([]);

  const currentUrl = window.location.origin;
  const callbackUrl = `${currentUrl}/auth/callback`;
  
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItems(prev => [...prev, label]);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
    setTimeout(() => {
      setCopiedItems(prev => prev.filter(item => item !== label));
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Supabase Configuration Required
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            To fix email verification, update your Supabase project settings
          </p>
        </div>

        <Alert className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            Email verification links are redirecting to localhost:3000. Update your Supabase redirect URLs to fix this.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6">
          {/* Step 1 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-teal-100 text-teal-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                  1
                </span>
                Open Supabase Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Go to your Supabase project dashboard
              </p>
              <Button
                onClick={() => window.open('https://supabase.com/dashboard/project/humafgsbdqaiidnprkzx/auth/url-configuration', '_blank')}
                className="bg-green-600 hover:bg-green-700"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Supabase Auth Settings
              </Button>
            </CardContent>
          </Card>

          {/* Step 2 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-teal-100 text-teal-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                  2
                </span>
                Add Redirect URLs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                In the "Redirect URLs" section, add these URLs:
              </p>
              
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono break-all">{callbackUrl}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(callbackUrl, "Callback URL")}
                    >
                      {copiedItems.includes("Callback URL") ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <Badge variant="secondary" className="mt-2">Current App URL</Badge>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono">https://*.replit.dev/auth/callback</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard("https://*.replit.dev/auth/callback", "Wildcard URL")}
                    >
                      {copiedItems.includes("Wildcard URL") ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <Badge variant="secondary" className="mt-2">For Future Deployments</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 3 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-teal-100 text-teal-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                  3
                </span>
                Set Site URL
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Set the "Site URL" to your app's domain:
              </p>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono break-all">{currentUrl}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(currentUrl, "Site URL")}
                  >
                    {copiedItems.includes("Site URL") ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 4 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-teal-100 text-teal-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                  4
                </span>
                Test Email Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                After saving the configuration in Supabase:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>Try signing up with a new email address</li>
                <li>Check your email for the verification link</li>
                <li>Click the link - it should now redirect to your app</li>
                <li>You should be automatically logged in</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Alert className="mt-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CheckCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <strong>Important:</strong> Make sure to click "Save" in the Supabase dashboard after adding the URLs. 
            Changes may take a few minutes to take effect.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}