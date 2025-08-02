import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
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
import { Loader2 } from "lucide-react";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

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
  const { user, isLoading } = useAuth();
  
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
      <Route path="/" component={user ? () => <Redirect to="/dashboard" /> : LandingPage} />
      <Route path="/auth" component={user ? () => <Redirect to="/dashboard" /> : SupabaseAuthPage} />
      <Route path="/auth/callback" component={AuthCallbackPage} />
      <Route path="/verify-email" component={EmailVerificationPage} />
      <Route path="/auth/verified" component={AuthVerifiedPage} />
      
      {/* Onboarding route */}
      <Route path="/onboarding">
        {user && !user.onboardingCompleted ? <OnboardingPage /> : <Redirect to="/dashboard" />}
      </Route>
      
      {/* Protected routes */}
      <Route path="/dashboard" component={() => <ProtectedRoute component={SimpleDashboard} />} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseAuthProvider>
        <AuthProvider>
          <ThemeProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </ThemeProvider>
        </AuthProvider>
      </SupabaseAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
