import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import OnboardingPage from "@/pages/onboarding-page";
import DashboardPage from "@/pages/dashboard-page";
import ExplorePage from "@/pages/explore-page";
import InsightsPage from "@/pages/insights-page";
import ProfilePage from "@/pages/profile-page";
import ShowDetailPage from "@/pages/show-detail-page";
import { ProtectedRoute } from "./lib/protected-route";
import Navbar from "./components/layout/navbar";
import { useAuth, AuthProvider } from "./hooks/use-auth";

function Router() {
  const { user } = useAuth();
  
  return (
    <>
      {user && <Navbar />}
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <ProtectedRoute path="/onboarding" component={OnboardingPage} />
        <ProtectedRoute path="/" component={DashboardPage} />
        <ProtectedRoute path="/explore" component={ExplorePage} />
        <ProtectedRoute path="/insights" component={InsightsPage} />
        <ProtectedRoute path="/profile" component={ProfilePage} />
        <ProtectedRoute path="/show/:id" component={ShowDetailPage} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
