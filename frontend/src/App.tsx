import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { Route, Switch, useLocation } from "wouter";
import { Layout } from "@/components/layout";

// Pages
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import SignupPage from "@/pages/signup";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import DashboardRouter from "@/pages/dashboard/index";
import BrandDashboard from "@/pages/dashboard/brand";
import InfluencerDashboard from "@/pages/dashboard/influencer";
import InfluencerDetail from "@/pages/influencers/detail";
import Campaigns from "@/pages/campaigns/index";
import CampaignCreate from "@/pages/campaigns/create";
import CampaignDetail from "@/pages/campaigns/detail";
import Opportunities from "@/pages/opportunities";
import MyCampaigns from "@/pages/my-campaigns";
import Applications from "@/pages/applications";
import Messages from "@/pages/messages";
import Analytics from "@/pages/analytics";
import AiAssistant from "@/pages/ai-assistant";
import MyProfile from "@/pages/profile";
import Settings from "@/pages/settings";
import SupportAndDisputes from "@/pages/support";
import CreatorOnboarding from "@/pages/onboarding";
import BrandProfilePage from "@/pages/brand-profile/index";
import FindCreatorsPage from "@/pages/find-creators/index";
import SavedCreatorsPage from "@/pages/saved-creators/index";
import PrivacyPolicy from "@/pages/privacy";
import TermsAndConditions from "@/pages/terms";
import DealsDirectory from "@/pages/deals/index";
import DealRoomDetail from "@/pages/deals/detail";
import BrandApplicationsPage from "@/pages/brand/applications";
import PaymentsPage from "@/pages/payments";
import PublicMediaKitPage from "@/pages/public-media-kit";
import AdminOverviewPage from "@/pages/admin/overview";
import AdminUsersPage from "@/pages/admin/users";
import AdminCreatorsPage from "@/pages/admin/creators";
import AdminBrandsPage from "@/pages/admin/brands";
import AdminRolesPage from "@/pages/admin/roles";
import AdminCampaignsPage from "@/pages/admin/campaigns";
import AdminApplicationsPage from "@/pages/admin/applications";
import AdminDealsPage from "@/pages/admin/deals";
import AdminPaymentsPage from "@/pages/admin/payments";
import AdminAnalyticsPage from "@/pages/admin/analytics";
import AdminReportsPage from "@/pages/admin/reports";
import AdminAuditLogsPage from "@/pages/admin/audit-logs";
import AdminActivityLogsPage from "@/pages/admin/activity-logs";
import AdminSystemHealthPage from "@/pages/admin/system-health";
import AdminSettingsPage from "@/pages/admin/settings";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { Loader2 } from "lucide-react";

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
        <div className="min-h-screen w-full bg-[#FAF9F6] dark:bg-[#09090B] text-[#0A0A0A] dark:text-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full rounded-xl bg-white dark:bg-[#121216] border border-[#E5E4DF] dark:border-white/10 p-8 shadow-xs space-y-4">
            <h2 className="text-xl font-extrabold tracking-tight text-[#0A0A0A] dark:text-[#F8FAFC]">
              Application Notice
            </h2>
            <p className="text-xs text-[#52525B] dark:text-[#A1A1AA]">
              A session state refresh is required to proceed. Resetting your session usually
              resolves this.
            </p>
            {this.state.error?.message && (
              <div className="p-3 bg-[#FAF9F6] dark:bg-white/5 border border-[#E5E4DF] dark:border-white/10 rounded-lg text-xs text-[#52525B] dark:text-[#A1A1AA] text-left font-mono overflow-auto max-h-24">
                {String(this.state.error.message)}
              </div>
            )}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/login";
                }}
                className="w-full py-2.5 bg-[#0A0A0A] dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-[#0A0A0A] font-semibold text-xs rounded-lg cursor-pointer transition-colors shadow-xs"
              >
                Return to Login
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function isUserOnboardingComplete(user: any): boolean {
  if (!user) return false;
  if (user.isAdmin) return true;
  const status = String(user.onboardingStatus || user.onboarding_status || "").toLowerCase();
  const step = String(user.onboardingStep || user.onboarding_step || "").toUpperCase();
  return status === "completed" || step === "COMPLETED" || step === "C5" || step === "B6";
}

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        setLocation("/login");
      } else if (!isUserOnboardingComplete(user)) {
        setLocation("/onboarding");
      }
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#FAF9F6] dark:bg-[#09090B]">
        <Loader2 className="h-7 w-7 animate-spin text-[#0A0A0A] dark:text-[#F8FAFC]" />
      </div>
    );
  }

  if (!user || !isUserOnboardingComplete(user)) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#FAF9F6] dark:bg-[#09090B] text-[#0A0A0A] dark:text-[#F8FAFC] p-4">
        <Loader2 className="h-7 w-7 animate-spin text-[#0A0A0A] dark:text-[#F8FAFC] mb-3" />
        <p className="text-xs font-semibold text-[#52525B] dark:text-[#A1A1AA]">
          Opening CreatorsBrand Workspace...
        </p>
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
      if (user.isAdmin) {
        setLocation("/admin");
        return;
      }

      // If user is currently in the middle of step 4 email verification during signup, allow remaining on sign up page
      if ((user as any).emailVerified === false && (user as any).onboardingStep === "C4") {
        return;
      }

      // If onboarding is incomplete, redirect to /onboarding
      if (!isUserOnboardingComplete(user)) {
        setLocation("/onboarding");
      } else {
        // If onboarding is completed, redirect to role dashboard
        if (user.role === "brand") {
          setLocation("/dashboard/brand");
        } else {
          setLocation("/dashboard/influencer");
        }
      }
    }
  }, [
    user?.id,
    user?.isAdmin,
    (user as any)?.emailVerified,
    (user as any)?.onboardingStatus,
    user?.role,
    isLoading,
    setLocation,
  ]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#FAF9F6] dark:bg-[#09090B]">
        <Loader2 className="h-7 w-7 animate-spin text-[#0A0A0A] dark:text-[#F8FAFC]" />
      </div>
    );
  }

  if (user && !((user as any).emailVerified === false && (user as any).onboardingStep === "C4")) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#FAF9F6] dark:bg-[#09090B] text-[#0A0A0A] dark:text-[#F8FAFC] p-4">
        <Loader2 className="h-7 w-7 animate-spin text-[#0A0A0A] dark:text-[#F8FAFC] mb-3" />
        <p className="text-xs font-semibold text-[#52525B] dark:text-[#A1A1AA]">
          Opening CreatorsBrand Workspace...
        </p>
      </div>
    );
  }

  return <Component {...rest} />;
}

function ProtectedStandaloneRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        setLocation("/login");
      } else if (user.isAdmin) {
        setLocation("/admin");
      } else if (isUserOnboardingComplete(user)) {
        if (user.role === "brand") {
          setLocation("/dashboard/brand");
        } else {
          setLocation("/dashboard/influencer");
        }
      }
    }
  }, [
    user?.id,
    user?.isAdmin,
    (user as any)?.onboardingStatus,
    user?.role,
    isLoading,
    setLocation,
  ]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#FAF9F6] dark:bg-[#09090B]">
        <Loader2 className="h-7 w-7 animate-spin text-[#0A0A0A] dark:text-[#F8FAFC]" />
      </div>
    );
  }

  if (!user || user.isAdmin || isUserOnboardingComplete(user)) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#FAF9F6] dark:bg-[#09090B] text-[#0A0A0A] dark:text-[#F8FAFC] p-4">
        <Loader2 className="h-7 w-7 animate-spin text-[#0A0A0A] dark:text-[#F8FAFC] mb-3" />
        <p className="text-xs font-semibold text-[#52525B] dark:text-[#A1A1AA]">
          Opening CreatorsBrand Workspace...
        </p>
      </div>
    );
  }

  return <Component {...rest} />;
}

function RoleProtectedRoute({ component: Component, allowedRole, ...rest }: any) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        setLocation("/login");
      } else if (user.isAdmin) {
        setLocation("/admin");
      } else if (allowedRole && user.role !== allowedRole) {
        if (user.role === "brand") {
          setLocation("/dashboard/brand");
        } else {
          setLocation("/dashboard/influencer");
        }
      }
    }
  }, [user?.id, user?.isAdmin, user?.role, isLoading, allowedRole, setLocation]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#FAF9F6] dark:bg-[#09090B]">
        <Loader2 className="h-7 w-7 animate-spin text-[#0A0A0A] dark:text-[#F8FAFC]" />
      </div>
    );
  }

  if (!user || user.isAdmin || (allowedRole && user.role !== allowedRole)) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#FAF9F6] dark:bg-[#09090B] text-[#0A0A0A] dark:text-[#F8FAFC] p-4">
        <Loader2 className="h-7 w-7 animate-spin text-[#0A0A0A] dark:text-[#F8FAFC] mb-3" />
        <p className="text-xs font-semibold text-[#52525B] dark:text-[#A1A1AA]">
          Opening CreatorsBrand Workspace...
        </p>
      </div>
    );
  }

  return (
    <Layout>
      <Component {...rest} />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms" component={TermsAndConditions} />
      <Route path="/terms-and-conditions" component={TermsAndConditions} />
      <Route path="/login">
        <PublicOnlyRoute component={Login} />
      </Route>
      <Route path="/signup">
        <PublicOnlyRoute component={SignupPage} />
      </Route>
      <Route path="/forgot-password">
        <PublicOnlyRoute component={ForgotPassword} />
      </Route>
      <Route path="/reset-password">
        <PublicOnlyRoute component={ResetPassword} />
      </Route>

      <Route path="/c/:handle" component={PublicMediaKitPage} />

      <Route path="/onboarding">
        <ProtectedStandaloneRoute component={CreatorOnboarding} />
      </Route>

      <Route path="/dashboard/brand">
        <RoleProtectedRoute component={BrandDashboard} allowedRole="brand" />
      </Route>
      <Route path="/dashboard/influencer">
        <RoleProtectedRoute component={InfluencerDashboard} allowedRole="influencer" />
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
        {(params) => <ProtectedRoute component={InfluencerDetail} params={params} />}
      </Route>
      <Route path="/brand/creators/:id">
        {(params) => <ProtectedRoute component={InfluencerDetail} params={params} />}
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
        {(params) => <ProtectedRoute component={CampaignDetail} params={params} />}
      </Route>
      <Route path="/campaigns">
        <ProtectedRoute component={Campaigns} />
      </Route>

      <Route path="/deals/:id">
        {(params) => <ProtectedRoute component={DealRoomDetail} params={params} />}
      </Route>
      <Route path="/deals">
        <ProtectedRoute component={DealsDirectory} />
      </Route>
      <Route path="/requests">
        <ProtectedRoute component={DealsDirectory} />
      </Route>

      <Route path="/brand/applications">
        <ProtectedRoute component={BrandApplicationsPage} />
      </Route>

      <Route path="/payments">
        <ProtectedRoute component={PaymentsPage} />
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

      <Route path="/support">
        <ProtectedRoute component={SupportAndDisputes} />
      </Route>
      <Route path="/disputes">
        <ProtectedRoute component={SupportAndDisputes} />
      </Route>

      <Route path="/admin">
        <AdminProtectedRoute component={AdminOverviewPage} />
      </Route>
      <Route path="/admin/activity-logs">
        <AdminProtectedRoute component={AdminActivityLogsPage} />
      </Route>
      <Route path="/admin/users">
        <AdminProtectedRoute component={AdminUsersPage} />
      </Route>
      <Route path="/admin/creators">
        <AdminProtectedRoute component={AdminCreatorsPage} />
      </Route>
      <Route path="/admin/brands">
        <AdminProtectedRoute component={AdminBrandsPage} />
      </Route>
      <Route path="/admin/roles">
        <AdminProtectedRoute component={AdminRolesPage} />
      </Route>
      <Route path="/admin/campaigns">
        <AdminProtectedRoute component={AdminCampaignsPage} />
      </Route>
      <Route path="/admin/applications">
        <AdminProtectedRoute component={AdminApplicationsPage} />
      </Route>
      <Route path="/admin/deals">
        <AdminProtectedRoute component={AdminDealsPage} />
      </Route>
      <Route path="/admin/payments">
        <AdminProtectedRoute component={AdminPaymentsPage} />
      </Route>
      <Route path="/admin/analytics">
        <AdminProtectedRoute component={AdminAnalyticsPage} />
      </Route>
      <Route path="/admin/reports">
        <AdminProtectedRoute component={AdminReportsPage} />
      </Route>
      <Route path="/admin/audit-logs">
        <AdminProtectedRoute component={AdminAuditLogsPage} />
      </Route>
      <Route path="/admin/system-health">
        <AdminProtectedRoute component={AdminSystemHealthPage} />
      </Route>
      <Route path="/admin/settings">
        <AdminProtectedRoute component={AdminSettingsPage} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function RouteTitleUpdater() {
  const [location] = useLocation();

  useEffect(() => {
    let title = "CreatorsBrand";

    if (location === "/admin") {
      title = "CreatorsBrand — Admin Control Center";
    } else if (location === "/admin/activity-logs") {
      title = "CreatorsBrand — Admin Active User Activity";
    } else if (location === "/admin/users") {
      title = "CreatorsBrand — Admin Users & Accounts";
    } else if (location === "/admin/creators") {
      title = "CreatorsBrand — Admin Creator Roster";
    } else if (location === "/admin/brands") {
      title = "CreatorsBrand — Admin Brand Workspaces";
    } else if (location === "/admin/roles") {
      title = "CreatorsBrand — Admin Roles & RBAC";
    } else if (location === "/admin/campaigns") {
      title = "CreatorsBrand — Admin Campaign Briefs";
    } else if (location === "/admin/applications") {
      title = "CreatorsBrand — Admin Applications Queue";
    } else if (location === "/admin/deals") {
      title = "CreatorsBrand — Admin Commercial Deals";
    } else if (location === "/admin/payments") {
      title = "CreatorsBrand — Admin Payments & Escrow";
    } else if (location === "/admin/analytics") {
      title = "CreatorsBrand — Admin Platform Analytics";
    } else if (location === "/admin/reports") {
      title = "CreatorsBrand — Admin Moderation Queue";
    } else if (location === "/admin/audit-logs") {
      title = "CreatorsBrand — Admin Audit Logs";
    } else if (location === "/admin/system-health") {
      title = "CreatorsBrand — Admin System Health";
    } else if (location === "/admin/settings") {
      title = "CreatorsBrand — Admin Platform Settings";
    } else if (location.startsWith("/admin")) {
      title = "CreatorsBrand — Admin Control Center";
    } else if (location === "/") {
      title = "CreatorsBrand — Direct Creator & Brand Collaborations";
    } else if (location === "/login") {
      title = "CreatorsBrand — Login";
    } else if (location === "/signup") {
      title = "CreatorsBrand — Sign Up";
    } else if (location.startsWith("/onboarding")) {
      title = "CreatorsBrand — Onboarding";
    } else if (
      location === "/dashboard" ||
      location === "/dashboard/influencer" ||
      location === "/dashboard/brand"
    ) {
      title = "CreatorsBrand — Dashboard";
    } else if (location === "/opportunities") {
      title = "CreatorsBrand — Opportunities";
    } else if (location.startsWith("/campaigns")) {
      title = "CreatorsBrand — Campaigns";
    } else if (location === "/applications" || location.startsWith("/brand/applications")) {
      title = "CreatorsBrand — Applications";
    } else if (location.startsWith("/deals") || location === "/requests") {
      title = "CreatorsBrand — Deal Room";
    } else if (location === "/payments") {
      title = "CreatorsBrand — Payments";
    } else if (location === "/analytics") {
      title = "CreatorsBrand — Analytics";
    } else if (
      location === "/profile" ||
      location.startsWith("/brand-profile") ||
      location.startsWith("/brand/profile")
    ) {
      title = "CreatorsBrand — Profile & Media Kit";
    } else if (location === "/settings") {
      title = "CreatorsBrand — Settings";
    } else if (location.startsWith("/c/")) {
      title = "CreatorsBrand — Creator Media Kit";
    } else if (
      location.startsWith("/find-creators") ||
      location.startsWith("/brand/creators") ||
      location === "/influencers"
    ) {
      title = "CreatorsBrand — Creator Discovery";
    } else if (location.startsWith("/saved-creators") || location.startsWith("/brand/shortlists")) {
      title = "CreatorsBrand — Shortlisted Creators";
    } else if (location === "/messages") {
      title = "CreatorsBrand — Messages";
    } else if (location === "/ai-assistant") {
      title = "CreatorsBrand — AI Assistant";
    } else if (location === "/support" || location === "/disputes") {
      title = "CreatorsBrand — Support & Disputes";
    } else if (location === "/privacy" || location === "/privacy-policy") {
      title = "CreatorsBrand — Privacy Policy";
    } else if (location === "/terms" || location === "/terms-and-conditions") {
      title = "CreatorsBrand — Terms & Conditions";
    } else if (location === "/forgot-password") {
      title = "CreatorsBrand — Forgot Password";
    } else if (location === "/reset-password") {
      title = "CreatorsBrand — Reset Password";
    }

    document.title = title;
  }, [location]);

  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" storageKey="influencer-hub-theme">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <RouteTitleUpdater />
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
