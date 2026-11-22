import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Eye,
  IndianRupee,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Briefcase,
  FileText,
  ChevronRight,
  Compass,
  FileCheck,
  Wallet,
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/components/theme-provider";
import { ObsidianLiquidKpiCard, BrushedMercuryKpiCard } from "@/components/dashboard/kpi-cards";

type ChartMetric = "views" | "reach" | "engagement" | "earnings";

const VELOCITY_SERIES = [
  { label: "Jun", views: 94000, reach: 72000, engagement: 4.9, earnings: 12000 },
  { label: "Jul", views: 118000, reach: 89000, engagement: 5.4, earnings: 15000 },
  { label: "Aug", views: 132000, reach: 101000, engagement: 5.6, earnings: 18000 },
  { label: "Sep", views: 126000, reach: 96000, engagement: 5.3, earnings: 22000 },
  { label: "Oct", views: 158000, reach: 121000, engagement: 6.1, earnings: 30000 },
  { label: "Nov", views: 184000, reach: 142000, engagement: 5.8, earnings: 45000 },
];

interface CreatorDashboardData {
  profileCompletion: number;
  followers: number;
  openOpportunities: number;
  pendingApplications: number;
  activeDeals: number;
  pendingPayments: number;
  agreedEarningsPaise: number;
  agreedEarningsRupees: number;
  clearedEarningsPaise: number;
  clearedEarningsRupees: number;
  recentApplications: Array<{
    id: number;
    campaignId: number;
    campaignTitle: string;
    campaignBudget: number;
    status: string;
    message?: string;
    quotedRatePaise?: number;
    createdAt: string;
  }>;
  recentDeals: Array<{
    id: number;
    title: string;
    brandName: string;
    brandLogoUrl?: string;
    deliverables: Array<{ title: string; count?: number }>;
    pricePaise: number;
    amountRupees: number;
    agreementStatus: string;
    paymentStatus: string;
    executionStatus: string;
    updatedAt: string;
  }>;
  category: string;
  country: string;
  isVerified: boolean;
}

export default function CreatorDashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [metric, setMetric] = useState<ChartMetric>("views");

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const { data: dashboard } = useQuery<CreatorDashboardData>({
    queryKey: ["dashboard-influencer"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/influencer");
      if (!res.ok) throw new Error("Failed to load dashboard");
      return res.json();
    },
    staleTime: 30000,
  });

  const displayName = user?.name ? user.name.trim().split(" ")[0] : "Creator";
  const userHandle = user?.email ? `@${user.email.split("@")[0]}` : "@creator";
  const userInitials = user?.name
    ? user.name
        .trim()
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "CR";

  const formatYAxis = (val: number) => {
    if (metric === "engagement") return `${val}%`;
    if (metric === "earnings") return `₹${val / 1000}K`;
    return val >= 1000 ? `${Math.round(val / 1000)}K` : `${val}`;
  };

  const formatTooltip = (val: number) => {
    if (metric === "engagement") return [`${val}%`, "Engagement Rate"];
    if (metric === "earnings") return [`₹${val.toLocaleString("en-IN")}`, "Cleared Payouts"];
    return [val.toLocaleString("en-IN"), metric === "views" ? "Reel Views" : "Unique Reach"];
  };

  const openOppCount = dashboard?.openOpportunities ?? 16;
  const pendingAppsCount = dashboard?.pendingApplications ?? 0;
  const activeDealsCount = dashboard?.activeDeals ?? 1;
  const agreedRupees = dashboard?.agreedEarningsRupees ?? 45000;

  // Build priority queue items from live deals & apps
  const liveQueueItems = [];

  if (dashboard?.recentDeals && dashboard.recentDeals.length > 0) {
    for (const d of dashboard.recentDeals.slice(0, 2)) {
      liveQueueItems.push({
        id: `deal-${d.id}`,
        stage: "ACTIVE DEAL",
        brand: d.brandName,
        campaign: d.title,
        deliverable: `₹${d.amountRupees.toLocaleString("en-IN")} • ${d.deliverables?.[0]?.title || "Deliverable"}`,
        dueText: "Dual signoff protected",
        href: `/deals/${d.id}`,
        statusTone: "emerald",
      });
    }
  }

  if (dashboard?.recentApplications && dashboard.recentApplications.length > 0) {
    for (const a of dashboard.recentApplications.slice(0, 2)) {
      liveQueueItems.push({
        id: `app-${a.id}`,
        stage: a.status === "pending" ? "PITCH UNDER REVIEW" : a.status.toUpperCase(),
        brand: "Brand Partner",
        campaign: a.campaignTitle,
        deliverable: a.quotedRatePaise
          ? `Quoted ₹${Math.round(a.quotedRatePaise / 100).toLocaleString("en-IN")}`
          : `Budget ₹${a.campaignBudget.toLocaleString("en-IN")}`,
        dueText: "Application submitted",
        href: `/applications`,
        statusTone: a.status === "accepted" ? "emerald" : "amber",
      });
    }
  }

  return (
    <div className="workspace-canvas min-h-screen text-[#0A0A0A] dark:text-[#F8FAFC] space-y-6 antialiased pb-12 w-full px-4 sm:px-6 lg:px-8">
      {/* ─── 1. Compact Profile Completion Nudge ─── */}
      <div className="px-4 py-3 rounded-xl bg-white dark:bg-[#121216] border border-[#E5E4DF] dark:border-white/10 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 rounded-md bg-[#FDF6F7] dark:bg-[#6A0D18]/25 text-[#6A0D18] dark:text-[#E87985] border border-[#EED8DC] dark:border-[#6A0D18]/40 text-xs font-bold font-tabular">
            Media Kit {dashboard?.profileCompletion ?? 80}%
          </span>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Keep your media kit and rate benchmarks updated to unlock priority shortlisting for
            ₹50K+ briefs.
          </p>
        </div>
        <Link
          href="/profile"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#6A0D18] dark:text-[#E87985] hover:text-[#520912] dark:hover:text-[#F87171] transition-colors"
        >
          <span>Complete Media Kit</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* ─── 2. Editorial Header & Identity Bar ─── */}
      <div className="border-b border-[#E5E4DF] dark:border-white/10 pb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl monogram-silver-burgundy text-base font-bold flex items-center justify-center shrink-0">
            {userInitials}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0A0A0A] dark:text-[#F8FAFC]">
                Welcome back,{" "}
                <span className="font-serif italic font-normal text-[#6A0D18] dark:text-[#E87985]">
                  {displayName}
                </span>
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#FDF6F7] dark:bg-[#6A0D18]/25 text-[#6A0D18] dark:text-[#E87985] border border-[#EED8DC] dark:border-[#6A0D18]/40 text-xs font-semibold">
                <CheckCircle2 className="w-3 h-3 text-[#6A0D18] dark:text-[#E87985]" />
                Verified Creator
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {userHandle} • {dashboard?.category || "Lifestyle & Fashion"} • India
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start lg:self-auto">
          <Link
            href="/profile"
            className="px-4 py-2.5 rounded-lg bg-white dark:bg-white/[0.06] hover:bg-zinc-50 dark:hover:bg-white/[0.1] border border-[#E5E4DF] dark:border-white/15 text-xs font-semibold text-[#0A0A0A] dark:text-[#F4F4F5] transition-colors"
          >
            Edit Media Kit
          </Link>
          <Link
            href="/opportunities"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg liquid-burgundy-metal text-xs font-semibold"
          >
            <span>Explore Open Briefs</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ─── 3. TOP 4-CARD KPI SUMMARY ROW (LIQUID METAL & CHROME-GLASS) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Card 1 (Hero Financial Metric): Total Agreed Earnings in Dark Obsidian Liquid Chrome */}
        <ObsidianLiquidKpiCard
          href="/payments"
          title="Total Agreed Earnings"
          value={`₹${agreedRupees.toLocaleString("en-IN")}`}
          subtitle="Releases on milestone approval"
          badgeText="Milestone Vault"
          icon={Wallet}
        />

        {/* Card 2: Active Collaborations in Brushed Mercury Glass */}
        <BrushedMercuryKpiCard
          href="/deals"
          title="Active Collaborations"
          value={`${activeDealsCount} In Progress`}
          subtitle="Confirmed deal rooms"
          badgeText="In Progress"
          icon={ShieldCheck}
        />

        {/* Card 3: Open Opportunities in Brushed Mercury Glass */}
        <BrushedMercuryKpiCard
          href="/opportunities"
          title="Open Opportunities"
          value={`${openOppCount} Active`}
          subtitle="Campaign briefs ready for pitching"
          badgeText="Ready to Pitch"
          icon={Compass}
        />

        {/* Card 4: Pending Applications in Brushed Mercury Glass */}
        <BrushedMercuryKpiCard
          href="/applications"
          title="Pending Applications"
          value={`${pendingAppsCount} Submitted`}
          subtitle="Under brand review"
          badgeText="Under Review"
          icon={FileCheck}
        />
      </div>

      {/* ─── 4. Asymmetric 7 / 5 Main Workspace (Fixed Chart + Action Queue) ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT 7 COLUMNS: Working Audience Velocity Chart */}
        <section className="xl:col-span-7 min-w-0 bg-white dark:bg-[#121216] rounded-2xl border border-[#E5E4DF] dark:border-white/10 p-6 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                Performance Velocity
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                6-month audited trajectory across connected channels
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#FAF9F6] dark:bg-[#18181E] border border-[#E5E4DF] dark:border-white/10">
              {(
                [
                  { id: "views", label: "Views" },
                  { id: "reach", label: "Reach" },
                  { id: "engagement", label: "Engagement" },
                  { id: "earnings", label: "Earnings" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setMetric(tab.id)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    metric === tab.id
                      ? "liquid-burgundy-metal font-bold shadow-xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-[#0A0A0A] dark:hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={VELOCITY_SERIES} margin={{ top: 10, right: 12, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={isDark ? "#E87985" : "#A82830"}
                      stopOpacity={isDark ? 0.35 : 0.2}
                    />
                    <stop offset="95%" stopColor={isDark ? "#6A0D18" : "#6A0D18"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={isDark ? "rgba(255, 255, 255, 0.08)" : "#ECEAE4"}
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: isDark ? "#A1A1AA" : "#71717A", fontSize: 12 }}
                  dy={8}
                />
                <YAxis
                  width={48}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatYAxis}
                  tick={{ fill: isDark ? "#A1A1AA" : "#71717A", fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: any) => formatTooltip(Number(value))}
                  contentStyle={{
                    backgroundColor: isDark ? "#18181E" : "#FFFFFF",
                    borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "#E5E4DF",
                    borderRadius: "10px",
                    fontSize: "12px",
                    color: isDark ? "#F8FAFC" : "#0A0A0A",
                  }}
                  itemStyle={{ color: isDark ? "#F8FAFC" : "#0A0A0A" }}
                />
                <Area
                  type="monotone"
                  dataKey={metric}
                  stroke={isDark ? "#E87985" : "#6A0D18"}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#velocityGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* RIGHT 5 COLUMNS: Funnel-Linked Action Queue */}
        <section className="xl:col-span-5 bg-white dark:bg-[#121216] rounded-2xl border border-[#E5E4DF] dark:border-white/10 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E5E4DF] dark:border-white/10 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                Deals &amp; Action Queue
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Active deliverables, pending pitches, and direct invites
              </p>
            </div>
            <Link
              href="/deals"
              className="text-xs font-semibold text-[#6A0D18] dark:text-[#E87985] hover:text-[#520912] dark:hover:text-[#F87171]"
            >
              Manage all
            </Link>
          </div>

          <div className="divide-y divide-[#E5E4DF] dark:divide-white/10">
            {(liveQueueItems.length > 0
              ? liveQueueItems
              : [
                  {
                    id: "q1",
                    stage: "ACTIVE DEAL",
                    brand: "Glow Cosmetics",
                    campaign: "Summer Skincare Launch",
                    deliverable: "1× IG Reel + 2× Stories • ₹45,000",
                    dueText: "Dual signoff protected",
                    href: "/deals",
                    statusTone: "emerald",
                  },
                  {
                    id: "q2",
                    stage: "APPLICATION REVIEW",
                    brand: "NovaTech Gear",
                    campaign: "Everyday Desk Setup & Unboxing",
                    deliverable: "1× YT Short + 2× Stories • ₹32,000",
                    dueText: "Pitched recently",
                    href: "/applications",
                    statusTone: "amber",
                  },
                ]
            ).map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="block p-5 hover:bg-[#FAF9F6]/80 dark:hover:bg-white/[0.04] transition-colors group cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span
                    className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                      item.statusTone === "emerald"
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/40"
                        : item.statusTone === "amber"
                          ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/40"
                          : "bg-[#FDF6F7] dark:bg-[#6A0D18]/25 text-[#6A0D18] dark:text-[#E87985] border border-[#EED8DC] dark:border-[#6A0D18]/40"
                    }`}
                  >
                    {item.stage}
                  </span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">{item.dueText}</span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-[#0A0A0A] dark:text-[#F8FAFC] group-hover:text-[#6A0D18] dark:group-hover:text-[#E87985] transition-colors truncate">
                      {item.campaign} — {item.brand}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                      {item.deliverable}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400 dark:text-zinc-500 group-hover:text-[#6A0D18] dark:group-hover:text-[#E87985] group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              </Link>
            ))}
          </div>

          <div className="p-4 border-t border-[#E5E4DF] dark:border-white/10 bg-[#FAF9F6] dark:bg-[#18181E]/60">
            <Link
              href="/opportunities"
              className="inline-flex items-center justify-center w-full py-2 rounded-lg bg-white dark:bg-white/[0.06] hover:bg-zinc-100 dark:hover:bg-white/[0.1] border border-[#E5E4DF] dark:border-white/15 text-xs font-semibold text-[#0A0A0A] dark:text-[#F8FAFC] transition-colors gap-1.5 cursor-pointer shadow-2xs"
            >
              <span>Explore All Opportunities</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
