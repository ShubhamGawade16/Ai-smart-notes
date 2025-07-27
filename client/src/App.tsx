import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
// import { useAuth } from "@/hooks/useAuth"; // Disabled for public testing
import Dashboard from "@/pages/dashboard";
import { SimplifiedDashboard } from "@/pages/simplified-dashboard";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Setup from "@/pages/setup";
import AuthCallback from "@/pages/auth/callback";
import NotFound from "@/pages/not-found";
import { SettingsPage } from "@/pages/settings";
import OnboardingPage from "@/pages/onboarding";
import TaskRefiner from "@/pages/task-refiner";
import AdvancedFeatures from "@/pages/advanced-features";

function Router() {
  // Check if user has completed onboarding
  const hasCompletedOnboarding = localStorage.getItem('onboardingCompleted') === 'true';
  
  return (
    <Switch>
      <Route path="/onboarding" component={OnboardingPage} />
      <Route path="/landing" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/setup" component={Setup} />
      
      {/* Main app routes - redirect to onboarding if not completed */}
      <Route path="/">
        {!hasCompletedOnboarding ? <OnboardingPage /> : <SimplifiedDashboard />}
      </Route>
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/advanced" component={AdvancedFeatures} />
      <Route path="/task-refiner" component={TaskRefiner} />
      <Route path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
