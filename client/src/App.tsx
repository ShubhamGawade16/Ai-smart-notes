import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";

import { AuthProvider, useAuth } from "@/hooks/use-auth-simple";
import MobileDashboard from "@/pages/mobile-dashboard";
import LandingPage from "@/pages/landing-page";
import AuthSimplePage from "@/pages/auth-simple";
import VerifyEmailPage from "@/pages/verify-email";
import AuthCallbackPage from "@/pages/auth-callback";
import AdvancedFeatures from "./pages/advanced-features";
import UpgradePage from "@/pages/upgrade";
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
        {user ? <Redirect to="/dashboard" /> : <LandingPage />}
      </Route>
      <Route path="/auth" component={AuthSimplePage} />
      <Route path="/auth/callback" component={AuthCallbackPage} />
      <Route path="/verify-email" component={VerifyEmailPage} />
      
      {/* Protected routes */}
      <Route path="/dashboard">
        {user ? <MobileDashboard /> : <Redirect to="/auth" />}
      </Route>
      
      <Route path="/advanced-features">
        {user ? <AdvancedFeatures /> : <Redirect to="/auth" />}
      </Route>
      
      <Route path="/upgrade">
        {user ? <UpgradePage /> : <Redirect to="/auth" />}
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
