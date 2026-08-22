import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { Route, Switch, useLocation } from 'wouter';
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
import Opportunities from '@/pages/opportunities';
import MyCampaigns from '@/pages/my-campaigns';
import Applications from '@/pages/applications';
import Messages from '@/pages/messages';
import Analytics from '@/pages/analytics';
import AiAssistant from '@/pages/ai-assistant';
import MyProfile from '@/pages/profile';
import Settings from '@/pages/settings';
import CreatorOnboarding from '@/pages/onboarding';
import BrandProfilePage from '@/pages/brand-profile/index';
import FindCreatorsPage from '@/pages/find-creators/index';
import SavedCreatorsPage from '@/pages/saved-creators/index';
import { Loader2 } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: any }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught runtime error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#0D111D] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full rounded-2xl bg-slate-900 border border-slate-800 p-8 shadow-2xl space-y-4">
            <h2 className="text-2xl font-bold text-red-400">Application Error</h2>
            <p className="text-xs text-slate-400">
              An unexpected error occurred. Resetting your session usually resolves this.
            </p>
            {this.state.error?.message && (
              <div className="p-3 bg-red-950/40 border border-red-900/60 rounded-xl text-[11px] text-red-300 text-left font-mono overflow-auto max-h-24">
                {String(this.state.error.message)}
              </div>
            )}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.clear();
                  } catch (_e) {}
                  window.location.href = '/login';
                }}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-full cursor-pointer transition-all shadow-md"
              >
                Reset Session & Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    const mockUser = {
                      id: 1,
                      email: "maya.chen@influencerhub.com",
                      role: "influencer",
                      name: "Maya Chen",
                      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
                      profileId: 1,
                    };
                    localStorage.setItem("influencer_hub_user", JSON.stringify(mockUser));
                  } catch (_e) {}
                  window.location.href = '/dashboard/influencer';
                }}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-full cursor-pointer transition-all border border-slate-700"
              >
                Launch Demo Creator Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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
      <div className="flex h-screen w-full items-center justify-center bg-[#0B0F19]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#0B0F19] text-white p-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-3" />
        <p className="text-xs font-bold text-slate-400">Redirecting to Sign In...</p>
      </div>
    );
  }

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
      <div className="flex h-screen w-full items-center justify-center bg-[#0B0F19]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#0B0F19] text-white p-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-3" />
        <p className="text-xs font-bold text-slate-400">Opening Workspace...</p>
      </div>
    );
  }

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
      <div className="flex h-screen w-full items-center justify-center bg-[#0B0F19]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#0B0F19] text-white p-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-3" />
        <p className="text-xs font-bold text-slate-400">Redirecting to Sign In...</p>
      </div>
    );
  }

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
      <Route path="/dashboard/brand">
        <ProtectedRoute component={BrandDashboard} />
      </Route>
      <Route path="/dashboard/influencer">
        <ProtectedRoute component={InfluencerDashboard} />
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute component={DashboardRouter} />
      </Route>
      
      <Route path="/find-creators">
        <ProtectedRoute component={FindCreatorsPage} />
      </Route>
      <Route path="/brand/creators">
        <ProtectedRoute component={FindCreatorsPage} />
      </Route>
      <Route path="/saved-creators">
        <ProtectedRoute component={SavedCreatorsPage} />
      </Route>
      <Route path="/brand/shortlists">
        <ProtectedRoute component={SavedCreatorsPage} />
      </Route>
      <Route path="/brand-profile">
        <ProtectedRoute component={BrandProfilePage} />
      </Route>
      <Route path="/brand/profile">
        <ProtectedRoute component={BrandProfilePage} />
      </Route>

      <Route path="/influencers/:id">
        {params => <ProtectedRoute component={InfluencerDetail} params={params} />}
      </Route>
      <Route path="/brand/creators/:id">
        {params => <ProtectedRoute component={InfluencerDetail} params={params} />}
      </Route>
      <Route path="/influencers">
        <ProtectedRoute component={FindCreatorsPage} />
      </Route>

      <Route path="/opportunities">
        <ProtectedRoute component={Opportunities} />
      </Route>

      <Route path="/my-campaigns">
        <ProtectedRoute component={MyCampaigns} />
      </Route>

      <Route path="/campaigns/create">
        <ProtectedRoute component={CampaignCreate} />
      </Route>
      <Route path="/campaigns/:id">
        {params => <ProtectedRoute component={CampaignDetail} params={params} />}
      </Route>
      <Route path="/campaigns">
        <ProtectedRoute component={Campaigns} />
      </Route>

      <Route path="/applications">
        <ProtectedRoute component={Applications} />
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

      <Route path="/profile">
        <ProtectedRoute component={MyProfile} />
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
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" storageKey="influencer-hub-theme">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <Router />
              <Toaster position="top-right" richColors />
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
