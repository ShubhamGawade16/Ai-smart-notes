import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";

import { SupabaseAuthProvider, useSupabaseAuth } from "@/hooks/use-supabase-auth";
import SimpleDashboard from "@/pages/simple-dashboard";
import LandingPage from "@/pages/landing-page";
import AuthPage from "@/pages/auth-page";
import SupabaseAuthPage from "@/pages/supabase-auth-page";
import AuthCallbackPage from "@/pages/auth-callback-page";
import EmailVerificationPage from "@/pages/email-verification-page";
import AuthVerifiedPage from "@/pages/auth-verified-page";
import OnboardingPage from "@/pages/onboarding-page";
import NotFound from "@/pages/not-found";
import TestRedirectPage from "@/pages/test-redirect-page";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useSupabaseAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/" />;
  }

  // Check if user needs onboarding
  if (!user.onboardingCompleted) {
    return <Redirect to="/onboarding" />;
  }

  return <Component />;
}

function Router() {
  const { user, isLoading } = useSupabaseAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }
  
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={user ? TestRedirectPage : LandingPage} />
      <Route path="/auth" component={SupabaseAuthPage} />
      <Route path="/auth/callback" component={AuthCallbackPage} />
      <Route path="/verify-email" component={EmailVerificationPage} />
      <Route path="/auth/verified" component={AuthVerifiedPage} />
      
      {/* Test redirect */}
      <Route path="/redirect" component={TestRedirectPage} />
      
      {/* Onboarding route */}
      <Route path="/onboarding" component={OnboardingPage} />
      
      {/* Protected routes */}
      <Route path="/dashboard" component={SimpleDashboard} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseAuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </SupabaseAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
