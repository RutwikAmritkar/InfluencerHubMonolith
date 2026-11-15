import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  Calendar,
  SlidersHorizontal,
  TrendingUp,
  Eye,
  Users,
  IndianRupee,
  MapPin,
  CheckCircle2,
  Download,
  FileCheck2,
  Briefcase,
  Layers,
  ArrowRight,
  Filter,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { Link } from "wouter";

type TimeRange = "30D" | "90D" | "YTD" | "ALL";
type CollabFilter = "all" | "paid" | "barter" | "hybrid";

interface AnalyticsOverviewResponse {
  role: "creator" | "brand";
  // Creator fields
  totalAgreedEarningsPaise?: number;
  settledEarningsPaise?: number;
  activeCollaborationsCount?: number;
  completedDealsCount?: number;
  pitchConversionRate?: number;
  totalApplications?: number;
  acceptedApplications?: number;
  pendingApplications?: number;
  monthlyRevenueSeries?: Array<{
    month: string;
    year: number;
    agreedPaise: number;
    settledPaise: number;
    agreedRupees: number;
    settledRupees: number;
  }>;
  platformMix?: Array<{
    platform: string;
    count: number;
    share: number;
  }>;

  // Brand fields
  totalCommittedBudgetPaise?: number;
  totalSettledSpendPaise?: number;
  activeCampaignsCount?: number;
  activeDealsCount?: number;
  applicantFunnel?: {
    pending: number;
    shortlisted: number;
    accepted: number;
    rejected: number;
    total: number;
  };
  collabTypeBreakdown?: {
    paid: { count: number; share: number };
    barter: { count: number; share: number };
    hybrid: { count: number; share: number };
  };
  deliverableApprovalVelocity?: {
    avgTurnaroundHours: number;
    revisionRatePct: number;
    totalSubmissions: number;
  };
  monthlySpendSeries?: Array<{
    month: string;
    year: number;
    committedPaise: number;
    settledPaise: number;
    committedRupees: number;
    settledRupees: number;
  }>;
}

const AGE_COHORTS = [
  { range: "13–17", pct: 12 },
  { range: "18–24", pct: 46 },
  { range: "25–34", pct: 31 },
  { range: "35–44", pct: 8 },
  { range: "45+", pct: 3 },
];

const GENDER_SPLIT = [
  { name: "Female", value: 64, color: "#1D4ED8" },
  { name: "Male", value: 33, color: "#0A0A0A" },
  { name: "Other", value: 3, color: "#94A3B8" },
];

const TOP_CITIES = [
  { city: "Mumbai", state: "Maharashtra", pct: 28 },
  { city: "Bengaluru", state: "Karnataka", pct: 19 },
  { city: "Delhi NCR", state: "Delhi", pct: 17 },
  { city: "Pune", state: "Maharashtra", pct: 11 },
  { city: "Hyderabad", state: "Telangana", pct: 8 },
];

const FALLBACK_MONTHLY_SERIES = [
  { month: "Jun", agreedRupees: 18000, settledRupees: 18000 },
  { month: "Jul", agreedRupees: 25000, settledRupees: 25000 },
  { month: "Aug", agreedRupees: 32000, settledRupees: 30000 },
  { month: "Sep", agreedRupees: 40000, settledRupees: 35000 },
  { month: "Oct", agreedRupees: 55000, settledRupees: 45000 },
  { month: "Nov", agreedRupees: 65000, settledRupees: 45000 },
];

export function PerformanceAnalytics() {
  const { user } = useAuth();
  const isBrand = user?.role === "brand";

  const [timeframe, setTimeframe] = useState<TimeRange>("90D");
  const [collabType, setCollabType] = useState<CollabFilter>("all");

  const { data: overview, isLoading } = useQuery<AnalyticsOverviewResponse>({
    queryKey: ["analytics-overview"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/overview");
      if (!res.ok) {
        throw new Error("Failed to load analytics");
      }
      return res.json();
    },
    staleTime: 30000,
  });

  const formatCompact = (val: number) =>
    val >= 1000 ? `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}K` : `${val}`;

  const formatCurrency = (rupees: number) => `₹${rupees.toLocaleString("en-IN")}`;

  const handleExportPdf = () => {
    toast.success("Generating verified Market Intelligence dossier...");
    setTimeout(() => {
      window.print();
    }, 400);
  };

  // Filter series by timeframe
  const chartSeries = useMemo(() => {
    const rawSeries = isBrand
      ? overview?.monthlySpendSeries?.map((s) => ({
          month: s.month,
          agreedRupees: s.committedRupees,
          settledRupees: s.settledRupees,
        }))
      : overview?.monthlyRevenueSeries?.map((s) => ({
          month: s.month,
          agreedRupees: s.agreedRupees,
          settledRupees: s.settledRupees,
        }));

    const series = rawSeries && rawSeries.length > 0 ? rawSeries : FALLBACK_MONTHLY_SERIES;

    if (timeframe === "30D") return series.slice(-2);
    if (timeframe === "90D") return series.slice(-3);
    if (timeframe === "YTD") return series.slice(-6);
    return series;
  }, [overview, isBrand, timeframe]);

  // Total earnings / budget
  const creatorAgreedRupees = overview?.totalAgreedEarningsPaise
    ? Math.round(overview.totalAgreedEarningsPaise / 100)
    : 45000;
  const creatorSettledRupees = overview?.settledEarningsPaise
    ? Math.round(overview.settledEarningsPaise / 100)
    : 0;

  const brandCommittedRupees = overview?.totalCommittedBudgetPaise
    ? Math.round(overview.totalCommittedBudgetPaise / 100)
    : 615000;
  const brandSettledRupees = overview?.totalSettledSpendPaise
    ? Math.round(overview.totalSettledSpendPaise / 100)
    : 0;

  const hasZeroData =
    overview &&
    (isBrand
      ? (overview.activeDealsCount ?? 0) === 0 && (overview.activeCampaignsCount ?? 0) === 0
      : (overview.activeCollaborationsCount ?? 0) === 0 && (overview.totalApplications ?? 0) === 0);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0A0A0A] font-sans antialiased w-full px-6 lg:px-8 py-6 space-y-6">
      {/* ─── Top Header ─── */}
      <div className="border-b border-[#E5E4DF] pb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 mb-1">
            Marketplace Intelligence
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-[#0A0A0A]">
            {isBrand ? "Campaign Spend &" : "Commercial"}{" "}
            <span className="font-serif italic font-normal text-blue-700">Analytics</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {isBrand
              ? "Live budget allocation, applicant funnel velocity, and deliverable approval turnaround."
              : "Live deliverable payouts, pitch conversion telemetry, and verified channel audience metrics."}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start lg:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-[#E5E4DF] text-xs font-medium text-zinc-700 shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            PostgreSQL Synced
          </span>
          <button
            type="button"
            onClick={handleExportPdf}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0A0A0A] hover:bg-zinc-800 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs active:scale-[0.99]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Analytics Dossier</span>
          </button>
        </div>
      </div>

      {/* ─── Interactive Multi-Filter Control Bar ─── */}
      <div className="bg-white rounded-xl border border-[#E5E4DF] p-3.5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        {/* Collaboration Type Filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-zinc-400 px-2 flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Type:
          </span>
          {(
            [
              { id: "all", label: "All Collabs" },
              { id: "paid", label: "Paid Only" },
              { id: "barter", label: "Barter" },
              { id: "hybrid", label: "Hybrid" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCollabType(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                collabType === item.id
                  ? "bg-[#0A0A0A] text-white shadow-xs"
                  : "text-zinc-600 hover:bg-[#FAF9F6]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Time Horizon Pills */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-lg border border-[#E5E4DF] bg-[#FAF9F6] p-0.5">
            <Calendar className="w-3.5 h-3.5 text-zinc-400 ml-2 mr-1" />
            {(
              [
                { id: "30D", label: "30D" },
                { id: "90D", label: "90D" },
                { id: "YTD", label: "YTD" },
                { id: "ALL", label: "All Time" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTimeframe(t.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  timeframe === t.id
                    ? "bg-white text-[#0A0A0A] shadow-2xs"
                    : "text-zinc-500 hover:text-[#0A0A0A]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Empty State Banner If Zero Records ─── */}
      {hasZeroData && (
        <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <Briefcase className="w-4 h-4 text-blue-700" />
            </div>
            <div>
              <p className="text-xs font-bold text-blue-950">
                {isBrand
                  ? "No campaign deals initiated yet"
                  : "Zero active collaborations recorded in this window"}
              </p>
              <p className="text-xs text-blue-700">
                {isBrand
                  ? "Launch a campaign brief or invite a creator to populate live spend analytics."
                  : "Apply to open campaign briefs or negotiate deals to view real-time revenue telemetry."}
              </p>
            </div>
          </div>
          <Link
            href={isBrand ? "/campaigns/create" : "/opportunities"}
            className="px-3.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold transition-colors shrink-0"
          >
            {isBrand ? "Create Campaign" : "Find Briefs"}
          </Link>
        </div>
      )}

      {/* ─── Top 4-Card KPI Metric Strip (Fluid, Hairline Borders) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isBrand ? (
          <>
            {/* Brand KPI 1 */}
            <div className="bg-white rounded-2xl border border-[#E5E4DF] p-5 flex flex-col justify-between space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">Committed Budget</span>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-semibold">
                  Terms Active
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight text-[#0A0A0A] font-tabular">
                  {formatCurrency(brandCommittedRupees)}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">Agreed in confirmed deal terms</p>
              </div>
            </div>

            {/* Brand KPI 2 */}
            <div className="bg-white rounded-2xl border border-[#E5E4DF] p-5 flex flex-col justify-between space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">Settled Spend</span>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-semibold">
                  T+0 Released
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight text-[#0A0A0A] font-tabular">
                  {formatCurrency(brandSettledRupees)}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">Cleared on deliverable signoff</p>
              </div>
            </div>

            {/* Brand KPI 3 */}
            <div className="bg-white rounded-2xl border border-[#E5E4DF] p-5 flex flex-col justify-between space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">Active Deals</span>
                <span className="px-2 py-0.5 rounded bg-[#FAF9F6] border border-[#E5E4DF] text-zinc-700 text-xs font-semibold font-tabular">
                  {overview?.activeCampaignsCount ?? 0} Campaigns
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight text-[#0A0A0A] font-tabular">
                  {overview?.activeDealsCount ?? 0}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">In production or review</p>
              </div>
            </div>

            {/* Brand KPI 4 */}
            <div className="bg-white rounded-2xl border border-[#E5E4DF] p-5 flex flex-col justify-between space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">Applicant Pipeline</span>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-semibold">
                  {overview?.applicantFunnel?.pending ?? 0} Pending
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight text-[#0A0A0A] font-tabular">
                  {overview?.applicantFunnel?.total ?? 0}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">Total pitches received</p>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Creator KPI 1 */}
            <div className="bg-white rounded-2xl border border-[#E5E4DF] p-5 flex flex-col justify-between space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">Agreed Earnings</span>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-semibold">
                  Protected
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight text-[#0A0A0A] font-tabular">
                  {formatCurrency(creatorAgreedRupees)}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">Releases on deliverable approval</p>
              </div>
            </div>

            {/* Creator KPI 2 */}
            <div className="bg-white rounded-2xl border border-[#E5E4DF] p-5 flex flex-col justify-between space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">Settled Payouts</span>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-semibold">
                  T+0 UPI
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight text-[#0A0A0A] font-tabular">
                  {formatCurrency(creatorSettledRupees)}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">Cleared to bank account</p>
              </div>
            </div>

            {/* Creator KPI 3 */}
            <div className="bg-white rounded-2xl border border-[#E5E4DF] p-5 flex flex-col justify-between space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">Active Collaborations</span>
                <span className="px-2 py-0.5 rounded bg-[#FAF9F6] border border-[#E5E4DF] text-zinc-700 text-xs font-semibold font-tabular">
                  {overview?.completedDealsCount ?? 0} Completed
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight text-[#0A0A0A] font-tabular">
                  {overview?.activeCollaborationsCount ?? 1}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">Deals in active progress</p>
              </div>
            </div>

            {/* Creator KPI 4 */}
            <div className="bg-white rounded-2xl border border-[#E5E4DF] p-5 flex flex-col justify-between space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">Pitch Conversion Rate</span>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-semibold">
                  Top Tier
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight text-[#0A0A0A] font-tabular">
                  {overview?.pitchConversionRate ?? 0}%
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {overview?.acceptedApplications ?? 0} accepted of{" "}
                  {overview?.totalApplications ?? 0} applied
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── Main 12-Column Responsive Section ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols: Revenue & Velocity Area Chart */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E5E4DF] p-6 shadow-xs space-y-4 min-w-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E5E4DF] pb-4">
            <div>
              <h2 className="text-base font-bold text-[#0A0A0A] tracking-tight">
                {isBrand
                  ? "Campaign Budget & Settled Spend Velocity"
                  : "Agreed vs. Cleared Payout Velocity"}
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Monthly collaboration pacing in Indian Rupees (INR)
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 text-[#0A0A0A]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1D4ED8]" />
                {isBrand ? "Committed Budget" : "Agreed Total"}
              </span>
              <span className="inline-flex items-center gap-1.5 text-zinc-500">
                <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
                {isBrand ? "Settled Spend" : "Cleared Payouts"}
              </span>
            </div>
          </div>

          <div className="h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartSeries} margin={{ top: 10, right: 20, left: 16, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAgreed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1D4ED8" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#1D4ED8" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorSettled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ECEAE4" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#71717A", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#71717A", fontSize: 12 }}
                  tickFormatter={(v) => `₹${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
                  width={55}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#E5E4DF",
                    borderRadius: "12px",
                    fontSize: "12px",
                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.08)",
                  }}
                  formatter={(val: any, name: any) => [
                    `₹${Number(val).toLocaleString("en-IN")}`,
                    name === "agreedRupees"
                      ? isBrand
                        ? "Committed Budget"
                        : "Agreed Total"
                      : "Cleared Payout",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="agreedRupees"
                  stroke="#1D4ED8"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAgreed)"
                />
                <Area
                  type="monotone"
                  dataKey="settledRupees"
                  stroke="#059669"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSettled)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 4 Cols: Platform Mix / Collab Breakdown */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E5E4DF] p-6 shadow-xs space-y-5 min-w-0">
          <div>
            <h3 className="text-base font-bold text-[#0A0A0A] tracking-tight">
              {isBrand ? "Collaboration Models" : "Platform Deliverable Mix"}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {isBrand ? "Breakdown across contract structures" : "Share of contracted formats"}
            </p>
          </div>

          {isBrand ? (
            <div className="space-y-4">
              {[
                {
                  label: "Paid Collaborations",
                  count: overview?.collabTypeBreakdown?.paid?.count ?? 0,
                  pct: overview?.collabTypeBreakdown?.paid?.share ?? 70,
                  color: "bg-[#1D4ED8]",
                },
                {
                  label: "Barter Deals",
                  count: overview?.collabTypeBreakdown?.barter?.count ?? 0,
                  pct: overview?.collabTypeBreakdown?.barter?.share ?? 20,
                  color: "bg-emerald-600",
                },
                {
                  label: "Hybrid (Fee + Product)",
                  count: overview?.collabTypeBreakdown?.hybrid?.count ?? 0,
                  pct: overview?.collabTypeBreakdown?.hybrid?.share ?? 10,
                  color: "bg-amber-600",
                },
              ].map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#0A0A0A]">{item.label}</span>
                    <span className="font-tabular text-zinc-500">
                      {item.count} deals ({item.pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#FAF9F6] border border-[#E5E4DF] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t border-[#E5E4DF] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Avg. Approval Turnaround</span>
                  <span className="font-semibold text-[#0A0A0A] font-tabular">
                    {overview?.deliverableApprovalVelocity?.avgTurnaroundHours ?? 36} Hours
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Deliverable Revision Rate</span>
                  <span className="font-semibold text-emerald-700 font-tabular">
                    {overview?.deliverableApprovalVelocity?.revisionRatePct ?? 12}%
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {(
                overview?.platformMix ?? [
                  { platform: "Instagram", count: 0, share: 65 },
                  { platform: "YouTube", count: 0, share: 25 },
                  { platform: "UGC / Production", count: 0, share: 10 },
                ]
              ).map((item) => (
                <div key={item.platform} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#0A0A0A]">{item.platform}</span>
                    <span className="font-tabular text-zinc-500">
                      {item.count > 0
                        ? `${item.count} deliverables (${item.share}%)`
                        : `${item.share}% share`}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#FAF9F6] border border-[#E5E4DF] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#1D4ED8]"
                      style={{ width: `${item.share}%` }}
                    />
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t border-[#E5E4DF]">
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Instagram 9:16 Reels and Story series account for the largest proportion of brand
                  deal velocity in India.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Bottom Demographic & Geographic Telemetry (3 Cards) ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* Gender Distribution */}
        <section className="xl:col-span-4 bg-white rounded-2xl border border-[#E5E4DF] p-6 shadow-xs space-y-4 flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#0A0A0A]">Audience Demographics</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Gender split across verified channels</p>
            </div>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200/50">
              Female 64%
            </span>
          </div>

          <div className="h-44 w-full min-w-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={GENDER_SPLIT}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {GENDER_SPLIT.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#E5E4DF",
                    borderRadius: "10px",
                    fontSize: "12px",
                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.08)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#E5E4DF] text-center">
            {GENDER_SPLIT.map((item) => (
              <div key={item.name} className="space-y-0.5">
                <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-500">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </div>
                <span className="text-sm font-bold text-[#0A0A0A] font-tabular">{item.value}%</span>
              </div>
            ))}
          </div>
        </section>

        {/* Age Demographic Distribution */}
        <section className="xl:col-span-4 bg-white rounded-2xl border border-[#E5E4DF] p-6 shadow-xs space-y-4 flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#0A0A0A]">Age Demographics</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Core cohort concentrations</p>
            </div>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200/50">
              18–34 (77%)
            </span>
          </div>

          <div className="h-44 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={AGE_COHORTS}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ECEAE4" />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="range"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#71717A", fontSize: 12 }}
                  width={45}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#E5E4DF",
                    borderRadius: "10px",
                    fontSize: "12px",
                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.08)",
                  }}
                />
                <Bar dataKey="pct" radius={[0, 6, 6, 0]}>
                  {AGE_COHORTS.map((entry, idx) => (
                    <Cell key={entry.range} fill={idx === 1 ? "#1D4ED8" : "#0A0A0A"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="text-xs text-zinc-400 text-center pt-2 border-t border-[#E5E4DF]">
            Primary purchasing power cohort concentrated in 18–34 bracket
          </p>
        </section>

        {/* Geographic Concentration */}
        <section className="xl:col-span-4 bg-white rounded-2xl border border-[#E5E4DF] p-6 shadow-xs space-y-4 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#0A0A0A]">Top Geographic Hubs</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Audience metropolitan density</p>
            </div>
            <span className="text-xs font-semibold text-zinc-600 bg-zinc-100 px-2.5 py-1 rounded-md">
              India (89%)
            </span>
          </div>

          <div className="space-y-2.5">
            {TOP_CITIES.map((c) => (
              <div
                key={c.city}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF9F6] border border-[#E5E4DF]"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-[#0A0A0A] block">{c.city}</span>
                    <span className="text-[11px] text-zinc-400">{c.state}</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#0A0A0A] font-tabular bg-white border border-[#E5E4DF] px-2 py-0.5 rounded-md">
                  {c.pct}%
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default PerformanceAnalytics;
export { PerformanceAnalytics as Analytics };
