import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { Layout } from '@/components/layout';

// Pages
import NotFound from '@/pages/not-found';
import Landing from '@/pages/landing';
import Login from '@/pages/login';
import DashboardRouter from '@/pages/dashboard/index';
import BrandDashboard from '@/pages/dashboard/brand';
import InfluencerDashboard from '@/pages/dashboard/influencer';
import Influencers from '@/pages/influencers/index';
import InfluencerDetail from '@/pages/influencers/detail';
import Campaigns from '@/pages/campaigns/index';
import CampaignCreate from '@/pages/campaigns/create';
import CampaignDetail from '@/pages/campaigns/detail';
import Messages from '@/pages/messages';
import Analytics from '@/pages/analytics';
import AiAssistant from '@/pages/ai-assistant';
import Settings from '@/pages/settings';
import CreatorOnboarding from '@/pages/onboarding';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation('/login');
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <Layout>
      <Component {...rest} />
    </Layout>
  );
}

function PublicOnlyRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user) {
      setLocation('/dashboard');
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) return null;

  return <Component {...rest} />;
}

function ProtectedStandaloneRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation('/login');
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      {/* Public Pages */}
      <Route path="/" component={Landing} />
      <Route path="/login">
        <PublicOnlyRoute component={Login} />
      </Route>
      <Route path="/signup">
        <PublicOnlyRoute component={Login} />
      </Route>

      {/* Onboarding Flow */}
      <Route path="/onboarding">
        <ProtectedStandaloneRoute component={CreatorOnboarding} />
      </Route>

      {/* Protected App Pages */}
      <Route path="/dashboard">
        <ProtectedRoute component={DashboardRouter} />
      </Route>
      <Route path="/dashboard/brand">
        <ProtectedRoute component={BrandDashboard} />
      </Route>
      <Route path="/dashboard/influencer">
        <ProtectedRoute component={InfluencerDashboard} />
      </Route>
      
      <Route path="/influencers">
        <ProtectedRoute component={Influencers} />
      </Route>
      <Route path="/influencers/:id">
        {params => <ProtectedRoute component={InfluencerDetail} params={params} />}
      </Route>

      <Route path="/campaigns">
        <ProtectedRoute component={Campaigns} />
      </Route>
      <Route path="/campaigns/create">
        <ProtectedRoute component={CampaignCreate} />
      </Route>
      <Route path="/campaigns/:id">
        {params => <ProtectedRoute component={CampaignDetail} params={params} />}
      </Route>

      <Route path="/messages">
        <ProtectedRoute component={Messages} />
      </Route>

      <Route path="/analytics">
        <ProtectedRoute component={Analytics} />
      </Route>

      <Route path="/ai-assistant">
        <ProtectedRoute component={AiAssistant} />
      </Route>

      <Route path="/settings">
        <ProtectedRoute component={Settings} />
      </Route>

      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="influencer-hub-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <Router />
            </WouterRouter>
            <Toaster position="top-right" richColors />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
