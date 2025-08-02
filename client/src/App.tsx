import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";

import { AuthProvider, useAuth } from "@/hooks/use-auth";
import SimpleDashboard from "@/pages/simple-dashboard";
import LandingPage from "@/pages/landing-page";
import AuthPage from "@/pages/auth-page";
import EmailVerificationPage from "@/pages/email-verification-page";
import OnboardingPage from "@/pages/onboarding-page";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

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
      <Route path="/">
        {user ? (
          user.onboardingCompleted ? <Redirect to="/dashboard" /> : <Redirect to="/onboarding" />
        ) : (
          <LandingPage />
        )}
      </Route>
      <Route path="/auth" component={AuthPage} />
      <Route path="/verify-email" component={EmailVerificationPage} />
      
      {/* Protected routes */}
      <Route path="/onboarding">
        {user ? <OnboardingPage /> : <Redirect to="/auth" />}
      </Route>
      <Route path="/dashboard">
        {user ? <SimpleDashboard /> : <Redirect to="/auth" />}
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
