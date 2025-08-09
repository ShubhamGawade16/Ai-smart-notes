import { Route, Switch, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { apiRequest } from "@/lib/queryClient";

import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";

import { AuthProvider, useAuth } from "@/hooks/use-supabase-auth";
import MobileDashboard from "@/pages/mobile-dashboard";
import LandingPage from "@/pages/landing";
import EmailAuthPage from "@/pages/email-auth";
import VerifyEmailPage from "@/pages/verify-email";
import AuthCallbackPage from "@/pages/auth-callback";
import SupabaseSetupGuide from "@/pages/supabase-setup-guide";
import DebugAuthPage from "@/pages/debug-auth";
import AdvancedFeatures from "./pages/advanced-features";
import UpgradePage from "@/pages/upgrade";
import OnboardingPage from "@/pages/onboarding";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

// Create query client with auth token
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const token = localStorage.getItem('auth_token');
        const response = await apiRequest("GET", queryKey[0] as string, undefined, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
        return response.json();
      },
    },
  },
});

function Router() {
  const { user } = useAuth();
  
  console.log('🔄 Router state:', { user: !!user, userEmail: user?.email });
  console.log('🎯 About to render routes, user authenticated:', !!user);

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/">
        {user ? (
          (() => {
            console.log('🔄 User is authenticated, redirecting to dashboard');
            return <Redirect to="/dashboard" />;
          })()
        ) : (
          <LandingPage />
        )}
      </Route>
      
      <Route path="/auth">
        {user ? (
          (() => {
            console.log('🔄 User is authenticated on auth page, redirecting to dashboard');
            return <Redirect to="/dashboard" />;
          })()
        ) : (
          <EmailAuthPage />
        )}
      </Route>
      
      <Route path="/auth/callback" component={AuthCallbackPage} />
      <Route path="/auth/verified" component={VerifyEmailPage} />
      <Route path="/verify-email" component={VerifyEmailPage} />
      <Route path="/supabase-setup" component={SupabaseSetupGuide} />
      <Route path="/debug-auth" component={DebugAuthPage} />
      
      {/* Protected routes */}
      <Route path="/dashboard">
        {user ? (
          (() => {
            console.log('🎯 Rendering dashboard for authenticated user');
            return <MobileDashboard />;
          })()
        ) : (
          <Redirect to="/" />
        )}
      </Route>
      
      <Route path="/advanced-features">
        {user ? <AdvancedFeatures /> : <Redirect to="/" />}
      </Route>
      
      <Route path="/upgrade">
        {user ? <UpgradePage /> : <Redirect to="/" />}
      </Route>
      
      <Route path="/onboarding">
        {user ? <OnboardingPage /> : <Redirect to="/" />}
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            <Router />
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}