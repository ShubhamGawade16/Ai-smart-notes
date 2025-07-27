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

function Router() {
  return (
    <Switch>
      <Route path="/" component={SimplifiedDashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/advanced" component={Dashboard} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/landing" component={Landing} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/setup" component={Setup} />
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
