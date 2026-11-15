import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Megaphone,
  Users,
  DollarSign,
  TrendingUp,
  Plus,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Lock,
  Film,
  Instagram,
  Youtube,
  FileCheck2,
  ShieldCheck,
  FileCheck,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// ─── PERFORMANCE TELEMETRY DATA ─────────────────────────────────────────────
const PERFORMANCE_DATA = {
  "7D": [
    { day: "Mon", reach: 120, engagement: 4.2 },
    { day: "Tue", reach: 145, engagement: 4.5 },
    { day: "Wed", reach: 190, engagement: 4.9 },
    { day: "Thu", reach: 240, engagement: 5.1 },
    { day: "Fri", reach: 310, engagement: 5.4 },
    { day: "Sat", reach: 380, engagement: 5.6 },
    { day: "Sun", reach: 420, engagement: 5.8 },
  ],
  "30D": [
    { day: "Week 1", reach: 450, engagement: 4.1 },
    { day: "Week 2", reach: 780, engagement: 4.6 },
    { day: "Week 3", reach: 1100, engagement: 5.0 },
    { day: "Week 4", reach: 1420, engagement: 5.4 },
  ],
  "90D": [
    { day: "Month 1", reach: 1800, engagement: 4.2 },
    { day: "Month 2", reach: 2900, engagement: 4.8 },
    { day: "Month 3", reach: 4100, engagement: 5.3 },
  ],
  "1Y": [
    { day: "Q1", reach: 4200, engagement: 4.0 },
    { day: "Q2", reach: 8900, engagement: 4.6 },
    { day: "Q3", reach: 13400, engagement: 5.1 },
    { day: "Q4", reach: 18200, engagement: 5.6 },
  ],
};

const FALLBACK_CAMPAIGNS = [
  {
    id: "1",
    title: "Summer Beauty Campaign",
    deliverables: "2x IG Reels · 1x Story Set",
    creatorsCount: 8,
    budgetFormatted: "₹1,20,000",
    statusBadge: "Terms Confirmed",
    thumbnail:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=300&auto=format&fit=crop",
    platform: "instagram",
  },
  {
    id: "2",
    title: "Tech Launch 2026",
    deliverables: "1x Dedicated YT · 2x Shorts",
    creatorsCount: 12,
    budgetFormatted: "₹2,45,000",
    statusBadge: "Milestone Active",
    thumbnail:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=300&auto=format&fit=crop",
    platform: "youtube",
  },
  {
    id: "3",
    title: "Fall Apparel Drop",
    deliverables: "3x 9:16 Reels · Haul Review",
    creatorsCount: 15,
    budgetFormatted: "₹1,80,000",
    statusBadge: "In Production",
    thumbnail:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=300&auto=format&fit=crop",
    platform: "instagram",
  },
];

const TOP_CREATORS_LIST = [
  {
    id: "1",
    name: "Maya Chen",
    handle: "@maya_creates",
    platform: "Instagram",
    followers: "285K",
    avgViews: "94K",
    engagement: "6.2%",
    startingRate: "₹45,000",
    verified: true,
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
  },
  {
    id: "2",
    name: "Alex Rivera",
    handle: "@alexrivera_tech",
    platform: "YouTube",
    followers: "410K",
    avgViews: "142K",
    engagement: "5.8%",
    startingRate: "₹65,000",
    verified: true,
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
  },
];

interface BrandDashboardData {
  totalCampaigns: number;
  activeCampaigns: number;
  activeDealsCount: number;
  totalApplications: number;
  pendingApplications: number;
  totalBudgetPaise: number;
  totalBudgetRupees: number;
  settledSpendPaise: number;
  settledSpendRupees: number;
  recentCampaigns: Array<{
    id: number;
    title: string;
    description?: string;
    budget?: number;
    platform?: string;
    status: string;
    deliverables?: any;
    applicationsCount: number;
    createdAt: string;
  }>;
  recentDeals: Array<{
    id: number;
    title: string;
    influencerName: string;
    influencerAvatarUrl?: string;
    pricePaise: number;
    amountRupees: number;
    agreementStatus: string;
    paymentStatus: string;
    executionStatus: string;
    updatedAt: string;
  }>;
  recentActivity: Array<{
    id: number;
    event: string;
    detail: string;
    time: string;
    verified: boolean;
  }>;
}

export default function BrandDashboard() {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<"7D" | "30D" | "90D" | "1Y">("30D");

  const { data: dashboard } = useQuery<BrandDashboardData>({
    queryKey: ["dashboard-brand"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/brand");
      if (!res.ok) throw new Error("Failed to load brand dashboard");
      return res.json();
    },
    staleTime: 30000,
  });

  const currentChartData = useMemo(() => PERFORMANCE_DATA[timeframe], [timeframe]);

  const activeCampaignsCount = dashboard?.activeCampaigns ?? 12;
  const pendingAppsCount = dashboard?.pendingApplications ?? 0;
  const activeDealsCount = dashboard?.activeDealsCount ?? 0;
  const totalBudgetRupees = dashboard?.totalBudgetRupees ?? 615000;

  return (
    <div className="workspace-canvas space-y-8 pb-12 antialiased w-full px-6 lg:px-8">
      {/* ─── 1. EDITORIAL HEADER WITH TACTILE CTA ──────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-[#E5E4DF] dark:border-white/10">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#1D4ED8] block mb-1">
            Commercial Overview
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0A0A0A] dark:text-white">
            Brand Workspace &amp;{" "}
            <span className="font-serif italic font-normal text-[#1D4ED8]">
              Campaign Operations
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#52525B] dark:text-slate-400 font-normal mt-1">
            Auditable audience telemetry, milestone-protected deal rooms, and live creator pipeline.
          </p>
        </div>

        <Link href="/campaigns/create">
          <Button className="h-10 px-5 rounded-lg bg-[#0A0A0A] hover:bg-slate-800 text-white text-xs font-semibold shadow-xs cursor-pointer inline-flex items-center gap-2 group transition-all">
            <Plus className="w-4 h-4 text-white" />
            <span>Launch Campaign Brief</span>
          </Button>
        </Link>
      </div>

      {/* ─── 2. SINGLE-CONTAINER KPI METRIC ROW (LINKED DIRECTLY TO ROUTES) ─── */}
      <div className="bg-white dark:bg-[#11172A] border border-[#E5E4DF] dark:border-white/10 rounded-xl overflow-hidden shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E5E4DF] dark:divide-white/10">
        {/* KPI 1: Active Campaigns -> /campaigns */}
        <Link
          href="/campaigns"
          className="p-6 space-y-2 hover:bg-[#FAF9F6] transition-colors group cursor-pointer block"
        >
          <div className="flex items-center justify-between text-xs text-[#52525B] dark:text-slate-400 font-medium">
            <span>Active Campaigns</span>
            <Megaphone className="w-4 h-4 text-[#0A0A0A] dark:text-white group-hover:text-blue-700 transition-colors" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-3xl font-bold tracking-tight text-[#0A0A0A] dark:text-white font-tabular">
              {activeCampaignsCount}
            </span>
            <span className="text-xs font-semibold text-[#059669] bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 px-2 py-0.5 rounded-md">
              Live Briefs
            </span>
          </div>
          <p className="text-xs text-[#52525B] dark:text-slate-400">
            Open for pitches &amp; invites
          </p>
        </Link>

        {/* KPI 2: Pending Applications -> /brand/applications */}
        <Link
          href="/brand/applications"
          className="p-6 space-y-2 hover:bg-[#FAF9F6] transition-colors group cursor-pointer block"
        >
          <div className="flex items-center justify-between text-xs text-[#52525B] dark:text-slate-400 font-medium">
            <span>Pending Applications</span>
            <FileCheck className="w-4 h-4 text-blue-700 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-3xl font-bold tracking-tight text-[#0A0A0A] dark:text-white font-tabular">
              {pendingAppsCount}
            </span>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-md">
              Awaiting Review
            </span>
          </div>
          <p className="text-xs text-[#52525B] dark:text-slate-400">Creator pitches &amp; rates</p>
        </Link>

        {/* KPI 3: Active Deals -> /deals */}
        <Link
          href="/deals"
          className="p-6 space-y-2 hover:bg-[#FAF9F6] transition-colors group cursor-pointer block"
        >
          <div className="flex items-center justify-between text-xs text-[#52525B] dark:text-slate-400 font-medium">
            <span>Active Deals</span>
            <ShieldCheck className="w-4 h-4 text-[#1D4ED8]" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-3xl font-bold tracking-tight text-[#0A0A0A] dark:text-white font-tabular">
              {activeDealsCount}
            </span>
            <span className="text-xs font-semibold text-[#1D4ED8] bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-md">
              In Production
            </span>
          </div>
          <p className="text-xs text-[#52525B] dark:text-slate-400">Milestone agreements locked</p>
        </Link>

        {/* KPI 4: Campaign Budget / Payments -> /payments */}
        <Link
          href="/payments"
          className="p-6 space-y-2 hover:bg-[#FAF9F6] transition-colors group cursor-pointer block"
        >
          <div className="flex items-center justify-between text-xs text-[#52525B] dark:text-slate-400 font-medium">
            <span>Campaign Budget</span>
            <Wallet className="w-4 h-4 text-[#059669]" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-3xl font-bold tracking-tight text-[#0A0A0A] dark:text-white font-tabular">
              ₹{totalBudgetRupees.toLocaleString("en-IN")}
            </span>
            <span className="text-xs font-semibold text-[#059669] bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
              Protected
            </span>
          </div>
          <p className="text-xs text-[#52525B] dark:text-slate-400">
            View payment records &amp; ledger
          </p>
        </Link>
      </div>

      {/* ─── 3. AUDITABLE TELEMETRY CHART CONTAINER ────────────────────────── */}
      <div className="bg-white dark:bg-[#11172A] border border-[#E5E4DF] dark:border-white/10 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E5E4DF] dark:border-white/10 pb-4">
          <div>
            <h2 className="text-base font-bold text-[#0A0A0A] dark:text-white tracking-tight">
              Campaign Reach &amp; Audience Velocity
            </h2>
            <p className="text-xs text-[#52525B] dark:text-slate-400 mt-0.5">
              Aggregated views, verified impressions, and authentic engagement trajectory across
              open briefs.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-[#F2F1EC] dark:bg-slate-800/80 p-1 rounded-lg border border-[#E5E4DF] dark:border-white/10">
            {(["7D", "30D", "90D", "1Y"] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  timeframe === tf
                    ? "bg-[#0A0A0A] text-white shadow-xs"
                    : "text-[#52525B] dark:text-slate-400 hover:text-[#0A0A0A] dark:hover:text-white"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[240px] w-full pt-2 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={currentChartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="cobaltFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1D4ED8" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1D4ED8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#E5E4DF"
                opacity={0.6}
              />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#52525B" }}
                dy={6}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#52525B" }} />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #E5E4DF",
                  background: "#FFFFFF",
                  padding: "8px 12px",
                  boxShadow: "0 4px 12px rgba(10,10,10,0.06)",
                }}
                itemStyle={{ color: "#0A0A0A", fontWeight: 600, fontSize: "12px" }}
              />
              <Area
                type="monotone"
                dataKey="reach"
                stroke="#1D4ED8"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#cobaltFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── 4. ASYMMETRIC GRID: CAMPAIGNS & MEDIA KITS ───── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 w-full items-start">
        {/* LEFT: CAMPAIGN PIPELINE */}
        <section className="xl:col-span-7 2xl:col-span-8 bg-white dark:bg-[#11172A] rounded-xl border border-[#E5E4DF] dark:border-white/10 shadow-xs overflow-hidden min-w-0">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E4DF] dark:border-white/10">
            <div>
              <h2 className="text-base font-bold text-[#0A0A0A] dark:text-white tracking-tight">
                Active Campaigns &amp; Deliverables
              </h2>
              <p className="text-xs text-[#52525B] dark:text-slate-400 mt-0.5">
                Protected milestone briefs under active creator production.
              </p>
            </div>
            <Link href="/campaigns">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-[#1D4ED8] hover:text-blue-800 hover:bg-[#F2F1EC] font-semibold rounded-lg h-8 px-2.5"
              >
                View all briefs
              </Button>
            </Link>
          </div>

          <div className="divide-y divide-[#E5E4DF] dark:divide-white/10">
            {dashboard?.recentCampaigns && dashboard.recentCampaigns.length > 0
              ? dashboard.recentCampaigns.map((c) => (
                  <Link
                    key={c.id}
                    href={`/campaigns/${c.id}`}
                    className="p-5 hover:bg-[#F2F1EC]/60 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-4 group cursor-pointer block"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs sm:text-sm font-bold text-[#0A0A0A] dark:text-white group-hover:text-[#1D4ED8] transition-colors truncate">
                          {c.title}
                        </h3>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#059669] border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                          {c.status === "active" ? "Active" : c.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#52525B] dark:text-slate-400 font-medium truncate">
                        {c.description || "Campaign collaboration brief"}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-[#52525B] dark:text-slate-400">
                        <span className="font-semibold text-[#0A0A0A] dark:text-white font-tabular">
                          {c.applicationsCount} Pitches
                        </span>
                        <span>·</span>
                        <span>
                          Budget:{" "}
                          <strong className="text-[#059669] font-bold font-tabular">
                            ₹{(c.budget ?? 0).toLocaleString("en-IN")}
                          </strong>
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#52525B]/50 group-hover:text-[#0A0A0A] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>
                ))
              : FALLBACK_CAMPAIGNS.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="p-5 hover:bg-[#F2F1EC]/60 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-4 group cursor-pointer"
                  >
                    <div className="relative w-14 aspect-[9/16] rounded-lg overflow-hidden bg-slate-900 border border-[#E5E4DF] shrink-0 shadow-2xs">
                      <img
                        src={campaign.thumbnail}
                        alt={campaign.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-1 left-1 p-0.5 bg-black/60 backdrop-blur-xs rounded">
                        {campaign.platform === "youtube" ? (
                          <Youtube className="w-2.5 h-2.5 text-white" />
                        ) : (
                          <Instagram className="w-2.5 h-2.5 text-white" />
                        )}
                      </div>
                    </div>
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs sm:text-sm font-bold text-[#0A0A0A] dark:text-white group-hover:text-[#1D4ED8] transition-colors truncate">
                          {campaign.title}
                        </h3>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#059669] border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                          {campaign.statusBadge}
                        </span>
                      </div>
                      <p className="text-xs text-[#52525B] dark:text-slate-400 font-medium">
                        {campaign.deliverables}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-[#52525B] dark:text-slate-400">
                        <span className="font-semibold text-[#0A0A0A] dark:text-white">
                          {campaign.creatorsCount} Creators
                        </span>
                        <span>·</span>
                        <span>
                          Budget:{" "}
                          <strong className="text-[#059669] font-bold font-tabular">
                            {campaign.budgetFormatted}
                          </strong>
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#52525B]/50 group-hover:text-[#0A0A0A] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                ))}
          </div>
        </section>

        {/* RIGHT: VERIFIED MEDIA KIT ROSTER */}
        <section className="xl:col-span-5 2xl:col-span-4 bg-white dark:bg-[#11172A] rounded-xl border border-[#E5E4DF] dark:border-white/10 shadow-xs overflow-hidden min-w-0">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E4DF] dark:border-white/10">
            <div>
              <h2 className="text-base font-bold text-[#0A0A0A] dark:text-white tracking-tight">
                Verified Media Kits
              </h2>
              <p className="text-xs text-[#52525B] dark:text-slate-400 mt-0.5">
                Top creators by verified audience retention.
              </p>
            </div>
            <Link href="/find-creators">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-[#1D4ED8] hover:text-blue-800 hover:bg-[#F2F1EC] font-semibold rounded-lg h-8 px-2.5"
              >
                Directory
              </Button>
            </Link>
          </div>

          <div className="divide-y divide-[#E5E4DF] dark:divide-white/10">
            {TOP_CREATORS_LIST.map((creator) => (
              <div
                key={creator.id}
                className="p-4 hover:bg-[#F2F1EC]/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 rounded-full border border-[#E5E4DF]">
                      <AvatarImage src={creator.avatar} />
                      <AvatarFallback className="bg-[#0A0A0A] text-white text-xs font-bold">
                        {creator.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-sm font-bold text-[#0A0A0A] dark:text-white group-hover:text-[#1D4ED8] transition-colors">
                          {creator.name}
                        </span>
                        {creator.verified && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#1D4ED8] shrink-0" />
                        )}
                      </div>
                      <span className="text-xs text-[#52525B] dark:text-slate-400 block">
                        {creator.handle} · {creator.followers}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-[#059669] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {creator.engagement} ER
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#E5E4DF] dark:border-white/10 text-xs">
                  <div>
                    <span className="text-[#52525B] block">Avg. Views</span>
                    <strong className="text-[#0A0A0A] dark:text-white font-tabular font-bold">
                      {creator.avgViews}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#52525B] block">Platform</span>
                    <strong className="text-[#0A0A0A] dark:text-white font-medium">
                      {creator.platform}
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[#52525B] block">Min. Rate</span>
                    <strong className="text-[#0A0A0A] dark:text-white font-tabular font-bold">
                      {creator.startingRate}
                    </strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ─── 5. COMMERCIAL DEAL AUDIT LOG ───────────────────────────────── */}
      <div className="bg-white dark:bg-[#11172A] border border-[#E5E4DF] dark:border-white/10 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5E4DF] dark:border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-[#1D4ED8]" />
            <h2 className="text-sm font-bold text-[#0A0A0A] dark:text-white tracking-tight">
              Commercial Deal Log &amp; Milestone Releases
            </h2>
          </div>
          <span className="text-xs font-mono text-[#52525B] bg-[#F2F1EC] px-2 py-0.5 rounded">
            Live Telemetry
          </span>
        </div>

        <div className="divide-y divide-[#E5E4DF] dark:divide-white/10">
          {(dashboard?.recentActivity && dashboard.recentActivity.length > 0
            ? dashboard.recentActivity
            : [
                {
                  id: 1,
                  event: "Payout Committed",
                  detail: "₹1,20,000 confirmed for Summer Skincare Launch",
                  time: "5 min ago",
                  verified: true,
                },
                {
                  id: 2,
                  event: "Terms Locked",
                  detail: "Maya Chen Reel brief version hash registered",
                  time: "22 min ago",
                  verified: true,
                },
                {
                  id: 3,
                  event: "Milestone Cleared",
                  detail: "Alex Rivera Deliverable 1 signoff complete (Dual sign)",
                  time: "1 hr ago",
                  verified: true,
                },
              ]
          ).map((item) => (
            <div
              key={item.id}
              className="py-3 flex items-center justify-between text-xs first:pt-1 last:pb-1"
            >
              <div className="flex items-center gap-3 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                <div className="min-w-0">
                  <span className="font-bold text-[#0A0A0A] dark:text-white mr-2">
                    {item.event}:
                  </span>
                  <span className="text-[#52525B] dark:text-slate-300 truncate">{item.detail}</span>
                </div>
              </div>
              <span className="text-xs text-[#52525B] font-mono shrink-0 ml-4">
                {item.time.includes("T") ? new Date(item.time).toLocaleTimeString() : item.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
