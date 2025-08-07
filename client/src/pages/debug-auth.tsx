import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function DebugAuthPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);

  const runDiagnostics = async () => {
    setIsChecking(true);
    const info: any = {
      timestamp: new Date().toISOString(),
      environment: {},
      supabase: {},
      network: {},
    };

    // Check environment variables
    info.environment = {
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      supabaseKeyExists: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      supabaseKeyLength: import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0,
      currentUrl: window.location.origin,
    };

    // Check Supabase client
    info.supabase = {
      clientExists: !!supabase,
      projectUrl: supabase?.supabaseUrl || 'Not available',
      projectKey: supabase?.supabaseKey ? 'Present' : 'Missing',
    };

    // Test network connectivity
    try {
      const testUrl = import.meta.env.VITE_SUPABASE_URL + '/rest/v1/';
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        }
      });
      info.network = {
        status: response.status,
        statusText: response.statusText,
        reachable: true,
      };
    } catch (error: any) {
      info.network = {
        error: error.message,
        reachable: false,
      };
    }

    // Test Supabase auth endpoint specifically
    try {
      if (supabase) {
        const { data, error } = await supabase.auth.getSession();
        info.supabase.authEndpoint = {
          success: !error,
          error: error?.message,
          sessionExists: !!data.session,
        };
      }
    } catch (error: any) {
      info.supabase.authEndpoint = {
        success: false,
        error: error.message,
      };
    }

    setDebugInfo(info);
    setIsChecking(false);
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="w-5 h-5 text-green-600" />
    ) : (
      <XCircle className="w-5 h-5 text-red-600" />
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Authentication Debug Center
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Diagnose connection and configuration issues
          </p>
        </div>

        <div className="mb-6">
          <Button 
            onClick={runDiagnostics} 
            disabled={isChecking}
            className="w-full bg-teal-600 hover:bg-teal-700"
          >
            {isChecking ? "Running Diagnostics..." : "Run Diagnostics"}
          </Button>
        </div>

        {debugInfo && (
          <div className="space-y-6">
            {/* Environment Check */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(debugInfo.environment.supabaseUrl && debugInfo.environment.supabaseKeyExists)}
                  Environment Variables
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Supabase URL:</span>
                  <Badge variant={debugInfo.environment.supabaseUrl ? "default" : "destructive"}>
                    {debugInfo.environment.supabaseUrl || "Missing"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Supabase Key:</span>
                  <Badge variant={debugInfo.environment.supabaseKeyExists ? "default" : "destructive"}>
                    {debugInfo.environment.supabaseKeyExists ? `Present (${debugInfo.environment.supabaseKeyLength} chars)` : "Missing"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Current URL:</span>
                  <Badge variant="outline">{debugInfo.environment.currentUrl}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Supabase Client Check */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(debugInfo.supabase.clientExists)}
                  Supabase Client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Client Initialized:</span>
                  <Badge variant={debugInfo.supabase.clientExists ? "default" : "destructive"}>
                    {debugInfo.supabase.clientExists ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Project URL:</span>
                  <Badge variant="outline">{debugInfo.supabase.projectUrl}</Badge>
                </div>
                {debugInfo.supabase.authEndpoint && (
                  <div className="flex justify-between items-center">
                    <span>Auth Endpoint:</span>
                    <Badge variant={debugInfo.supabase.authEndpoint.success ? "default" : "destructive"}>
                      {debugInfo.supabase.authEndpoint.success ? "Working" : "Error"}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Network Check */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(debugInfo.network.reachable)}
                  Network Connectivity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Supabase Reachable:</span>
                  <Badge variant={debugInfo.network.reachable ? "default" : "destructive"}>
                    {debugInfo.network.reachable ? "Yes" : "No"}
                  </Badge>
                </div>
                {debugInfo.network.status && (
                  <div className="flex justify-between items-center">
                    <span>HTTP Status:</span>
                    <Badge variant="outline">{debugInfo.network.status} {debugInfo.network.statusText}</Badge>
                  </div>
                )}
                {debugInfo.network.error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <strong>Network Error:</strong> {debugInfo.network.error}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Raw Debug Info */}
            <Card>
              <CardHeader>
                <CardTitle>Raw Debug Data</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}