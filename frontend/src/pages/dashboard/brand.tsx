import { useState, useMemo, memo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useTranslation } from "react-i18next";
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

// Realistic Performance Telemetry Chart Data
const PERFORMANCE_DATA = {
  "7D": [
    { day: "Mon", reach: 120, engagement: 4.2, roi: 3.8 },
    { day: "Tue", reach: 145, engagement: 4.5, roi: 4.1 },
    { day: "Wed", reach: 190, engagement: 4.9, roi: 4.4 },
    { day: "Thu", reach: 240, engagement: 5.1, roi: 4.6 },
    { day: "Fri", reach: 310, engagement: 5.4, roi: 4.7 },
    { day: "Sat", reach: 380, engagement: 5.6, roi: 4.8 },
    { day: "Sun", reach: 420, engagement: 5.8, roi: 4.9 },
  ],
  "30D": [
    { day: "Week 1", reach: 450, engagement: 4.1, roi: 3.6 },
    { day: "Week 2", reach: 780, engagement: 4.6, roi: 4.2 },
    { day: "Week 3", reach: 1100, engagement: 5.0, roi: 4.5 },
    { day: "Week 4", reach: 1420, engagement: 5.4, roi: 4.8 },
  ],
  "90D": [
    { day: "Month 1", reach: 1800, engagement: 4.2, roi: 3.9 },
    { day: "Month 2", reach: 2900, engagement: 4.8, roi: 4.4 },
    { day: "Month 3", reach: 4100, engagement: 5.3, roi: 4.8 },
  ],
  "1Y": [
    { day: "Q1", reach: 4200, engagement: 4.0, roi: 3.5 },
    { day: "Q2", reach: 8900, engagement: 4.6, roi: 4.1 },
    { day: "Q3", reach: 13400, engagement: 5.1, roi: 4.6 },
    { day: "Q4", reach: 18200, engagement: 5.6, roi: 4.8 },
  ],
};

// Realistic Active Campaigns Demo Data
const ACTIVE_CAMPAIGNS_LIST = [
  {
    id: "1",
    title: "Summer Beauty Campaign",
    brand: "Glow Cosmetics",
    creatorsCount: 8,
    budget: "₹50,000",
    status: "Active",
    engagement: "4.8%",
    category: "Beauty & Lifestyle",
  },
  {
    id: "2",
    title: "Tech Launch 2026",
    brand: "NovaTech",
    creatorsCount: 12,
    budget: "₹125,000",
    status: "Active",
    engagement: "6.2%",
    category: "Tech & Gadgets",
  },
  {
    id: "3",
    title: "Fall Apparel Drop",
    brand: "UrbanFit",
    creatorsCount: 15,
    budget: "₹180,000",
    status: "Active",
    engagement: "5.4%",
    category: "Fashion & Fitness",
  },
  {
    id: "4",
    title: "Organic Snack Rollout",
    brand: "FreshBite",
    creatorsCount: 6,
    budget: "₹70,000",
    status: "Active",
    engagement: "7.1%",
    category: "Food & Wellness",
  },
];

// Realistic Top Performing Creators
const TOP_CREATORS_LIST = [
  {
    id: "1",
    name: "Alex Rivera",
    platform: "Instagram",
    followers: "124K",
    engagement: "4.8%",
    verified: true,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
  },
  {
    id: "2",
    name: "Maya Chen",
    platform: "TikTok",
    followers: "285K",
    engagement: "6.2%",
    verified: true,
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150&auto=format&fit=crop",
  },
  {
    id: "3",
    name: "Jordan Lee",
    platform: "YouTube",
    followers: "410K",
    engagement: "5.1%",
    verified: true,
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=150&auto=format&fit=crop",
  },
  {
    id: "4",
    name: "Sofia Martinez",
    platform: "Instagram",
    followers: "95K",
    engagement: "7.4%",
    verified: true,
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=150&auto=format&fit=crop",
  },
];

// Recent Activity Log
const RECENT_ACTIVITY_LOG = [
  { id: 1, text: "Alex Rivera accepted Summer Beauty campaign", time: "2 min ago" },
  { id: 2, text: "Campaign budget updated to $8,000", time: "18 min ago" },
  { id: 3, text: "New creator application received from Maya Chen", time: "45 min ago" },
  { id: 4, text: "Summer Beauty deliverable approved", time: "1 hr ago" },
];

const BrandKPICard = memo(({ label, value, badgeText, icon: Icon, iconStyle }: {
  label: string;
  value: string;
  badgeText: string;
  icon: any;
  iconStyle: string;
}) => (
  <div className="rounded-[16px] bg-white dark:bg-[#11172A] border border-[#E2E8F0] dark:border-slate-800/90 p-4 sm:p-5 shadow-[0_4px_16px_rgba(15,23,42,0.06)] hover:shadow-[0_8px_24px_rgba(15,23,42,0.09)] transition-all duration-200 h-[112px] flex flex-col justify-between">
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-bold text-[#94A3B8] dark:text-slate-500 uppercase tracking-wider font-mono">{label}</span>
      <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${iconStyle}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
    </div>
    <div className="flex items-baseline justify-between">
      <span className="text-2xl sm:text-[1.65rem] font-black text-[#0F172A] dark:text-slate-100">{value}</span>
      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 px-2 py-0.5 rounded-full">{badgeText}</span>
    </div>
  </div>
));
BrandKPICard.displayName = "BrandKPICard";

export default function BrandDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [timeframe, setTimeframe] = useState<"7D" | "30D" | "90D" | "1Y">("30D");

  // Determine if this is a newly registered brand account (no fake metrics) vs demo environment
  const isNewBrandUser = (user as any)?.isNewUser || (!(user as any)?.isDemo && !user?.email?.includes("demo"));

  // MEMOIZED TIMEFRAME DATA LOOKUP
  const currentChartData = useMemo(() => PERFORMANCE_DATA[timeframe], [timeframe]);

  if (isNewBrandUser) {
    return (
      <div className="space-y-6 w-full pb-10 font-sans">
        {/* ─── 1. DASHBOARD HEADER FOR NEW BRAND ───────────────────────── */}
        <div className="rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-mono font-bold text-blue-200 border border-white/20">
              <Sparkles className="w-3.5 h-3.5" /> Workspace Initialized
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome to InfluencerHub, {user?.name?.split(" ")[0] || "Brand"} 👋
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 font-medium max-w-xl">
              Let's get your brand ready to launch your first campaign and connect with top verified creators.
            </p>
          </div>
        </div>

        {/* ─── 2. PROFILE COMPLETION WIDGET ──────────────────────────────── */}
        <div className="rounded-2xl bg-white dark:bg-[#11172A] border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Profile Completion</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Complete your profile to unlock full campaign publishing capabilities.</p>
            </div>
            <span className="text-sm font-mono font-extrabold text-[#315BEF] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800">
              40%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div className="bg-[#315BEF] h-full rounded-full w-[40%] transition-all duration-500" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Account Credentials</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Brand Workspace</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500">
              <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-700 shrink-0" />
              <span>Campaign Brief & Verification</span>
            </div>
          </div>
        </div>

        {/* ─── 3. RECOMMENDED NEXT STEPS ─────────────────────────────────── */}
        <div className="rounded-2xl bg-white dark:bg-[#11172A] border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Recommended Next Steps</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3">
              <div>
                <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950 text-[#315BEF] dark:text-blue-400 font-bold text-xs flex items-center justify-center mb-2 font-mono">1</span>
                <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">Complete Brand Profile</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Add your website, company logo, and industry details.</p>
              </div>
              <Link href="/onboarding">
                <Button className="w-full h-8 bg-[#315BEF] hover:bg-blue-600 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer">
                  Complete Brand Profile →
                </Button>
              </Link>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3">
              <div>
                <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950 text-[#315BEF] dark:text-blue-400 font-bold text-xs flex items-center justify-center mb-2 font-mono">2</span>
                <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">Explore Verified Creators</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Filter creators by niche, reach, engagement, and platform.</p>
              </div>
              <Link href="/find-creators">
                <Button variant="outline" className="w-full h-8 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs rounded-lg cursor-pointer">
                  Explore Creators
                </Button>
              </Link>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3">
              <div>
                <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950 text-[#315BEF] dark:text-blue-400 font-bold text-xs flex items-center justify-center mb-2 font-mono">3</span>
                <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">Create First Campaign</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Set your deliverables, budget, and accept applications.</p>
              </div>
              <Link href="/campaigns/create">
                <Button variant="secondary" className="w-full h-8 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-300 font-bold text-xs rounded-lg cursor-pointer">
                  Create Campaign
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* ─── 4. ZERO METRICS CLEAN CARDS ─────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <BrandKPICard
            label="Active Campaigns"
            value="0"
            badgeText="No active campaigns"
            icon={Megaphone}
            iconStyle="bg-blue-50 dark:bg-blue-950/80 text-[#315BEF] dark:text-blue-400"
          />
          <BrandKPICard
            label="Total Creators"
            value="0"
            badgeText="Roster empty"
            icon={Users}
            iconStyle="bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400"
          />
          <BrandKPICard
            label="Campaign Spend"
            value="$0"
            badgeText="$0 total spent"
            icon={DollarSign}
            iconStyle="bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400"
          />
          <BrandKPICard
            label="Estimated ROI"
            value="0.0x"
            badgeText="Pending launch"
            icon={TrendingUp}
            iconStyle="bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full pb-10">
      
      {/* ─── 1. DASHBOARD HEADER ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200/60 dark:border-slate-800/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#11182F] dark:text-slate-100 tracking-tight">
            {t('dashboard.welcome', { name: user?.name?.split(" ")[0] || "Brand" })} 👋
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {t('dashboard.overview')}
          </p>
        </div>

        <Link href="/campaigns/create" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto h-9 px-5 rounded-full bg-[#315BEF] hover:bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-600/20 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {t('campaigns.createCampaign')}
          </Button>
        </Link>
      </div>

      {/* ─── 2. 4 KPI METRIC CARDS ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <BrandKPICard
          label="Active Campaigns"
          value="12"
          badgeText="+3 this month"
          icon={Megaphone}
          iconStyle="bg-blue-50 dark:bg-blue-950/80 text-[#315BEF] dark:text-blue-400"
        />
        <BrandKPICard
          label="Total Creators"
          value="248"
          badgeText="+18 this month"
          icon={Users}
          iconStyle="bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400"
        />
        <BrandKPICard
          label="Campaign Spend"
          value="$42,580"
          badgeText="+12.4%"
          icon={DollarSign}
          iconStyle="bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400"
        />
        <BrandKPICard
          label="Estimated ROI"
          value="4.8x"
          badgeText="+18.2%"
          icon={TrendingUp}
          iconStyle="bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400"
        />
      </div>

      {/* ─── 3. MAIN CAMPAIGN PERFORMANCE SECTION ───────────────────────── */}
      <div className="rounded-[16px] bg-white dark:bg-[#11172A] border border-[#E2E8F0] dark:border-slate-800/90 p-5 shadow-[0_4px_16px_rgba(15,23,42,0.06)] space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E2E8F0] dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#0F172A] dark:text-slate-100">Campaign Performance</h3>
            <p className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">Real-time aggregate reach, engagement rate, and ROI telemetry.</p>
          </div>

          <div className="flex items-center gap-1 bg-[#F1F4F9] dark:bg-slate-800/80 p-1 rounded-full border border-[#E2E8F0] dark:border-slate-700/60">
            {(["7D", "30D", "90D", "1Y"] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                  timeframe === tf
                    ? "bg-white dark:bg-slate-700 text-[#315BEF] dark:text-blue-400 shadow-2xs border border-[#E2E8F0]"
                    : "text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-slate-200"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[210px] w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={currentChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorReachBrand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#315BEF" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#315BEF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748B" }} dy={5} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748B" }} />
              <Tooltip
                contentStyle={{ borderRadius: "10px", border: "1px solid #E2E8F0", boxShadow: "0 4px 16px rgba(15,23,42,0.08)", background: "#FFFFFF" }}
                itemStyle={{ color: "#0F172A", fontWeight: 700, fontSize: "11px" }}
              />
              <Area type="monotone" dataKey="reach" stroke="#315BEF" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReachBrand)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── 4. GRID: ACTIVE CAMPAIGN TABLE & TOP CREATORS ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-5">
        
        {/* Active Campaigns Table/Cards (4 Cols) */}
        <div className="lg:col-span-4 rounded-[16px] bg-white dark:bg-[#11172A] border border-[#E2E8F0] dark:border-slate-800/90 p-5 shadow-[0_4px_16px_rgba(15,23,42,0.06)] space-y-3">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-slate-800 pb-2.5">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#0F172A] dark:text-slate-100">Active Campaigns</h3>
              <p className="text-[11px] text-[#64748B] dark:text-slate-400 font-medium">4 active brand campaigns in flight.</p>
            </div>
            <Link href="/campaigns">
              <Button variant="ghost" size="sm" className="text-[11px] text-[#315BEF] dark:text-blue-400 hover:text-blue-700 hover:bg-[#EEF3FF] dark:hover:bg-blue-950/50 font-bold rounded-full h-8">
                View all →
              </Button>
            </Link>
          </div>

          <div className="space-y-2.5 pt-1">
            {ACTIVE_CAMPAIGNS_LIST.map((campaign) => (
              <div
                key={campaign.id}
                className="flex items-center justify-between p-3 rounded-xl bg-[#F9FAFD] dark:bg-slate-800/50 border border-[#E2E8F0] dark:border-slate-700/60 hover:bg-[#F8FAFC] dark:hover:bg-slate-800 transition-all group cursor-pointer"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#0F172A] dark:text-slate-100 group-hover:text-[#315BEF] dark:group-hover:text-blue-400 transition-colors">
                      {campaign.title}
                    </span>
                    <Badge variant="secondary" className="bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 text-[9px] py-0 font-bold">
                      ● {campaign.status}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-[#64748B] dark:text-slate-400 font-medium">
                    {campaign.brand} • {campaign.creatorsCount} creators • {campaign.budget}
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="text-right">
                    <span className="text-xs font-black text-[#0F172A] dark:text-slate-100 block">{campaign.engagement}</span>
                    <span className="text-[9px] text-[#94A3B8] dark:text-slate-500 font-medium">Engagement</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] dark:text-slate-500 group-hover:text-[#315BEF] dark:group-hover:text-blue-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Creators (3 Cols) */}
        <div className="lg:col-span-3 rounded-[16px] bg-white dark:bg-[#11172A] border border-[#E2E8F0] dark:border-slate-800/90 p-5 shadow-[0_4px_16px_rgba(15,23,42,0.06)] space-y-3">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-slate-800 pb-2.5">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#0F172A] dark:text-slate-100">Top Performing Creators</h3>
              <p className="text-[11px] text-[#64748B] dark:text-slate-400 font-medium">Highest engagement rate roster.</p>
            </div>
            <Link href="/find-creators">
              <Button variant="ghost" size="sm" className="text-[11px] text-[#315BEF] dark:text-blue-400 hover:text-blue-700 hover:bg-[#EEF3FF] dark:hover:bg-blue-950/50 font-bold rounded-full h-8">
                Explore →
              </Button>
            </Link>
          </div>

          <div className="space-y-2.5 pt-1">
            {TOP_CREATORS_LIST.map((creator) => (
              <div
                key={creator.id}
                className="flex items-center justify-between p-3 rounded-xl bg-[#F9FAFD] dark:bg-slate-800/50 border border-[#E2E8F0] dark:border-slate-700/60 hover:bg-[#F8FAFC] dark:hover:bg-slate-800 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar className="h-8 w-8 border border-[#E2E8F0] dark:border-slate-700">
                    <AvatarImage src={creator.avatar} />
                    <AvatarFallback className="bg-blue-100 dark:bg-blue-950 text-[#315BEF] dark:text-blue-300 font-bold text-xs">{creator.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-xs text-[#0F172A] dark:text-slate-100">{creator.name}</span>
                      {creator.verified && <CheckCircle2 className="w-3.5 h-3.5 text-[#315BEF] dark:text-blue-400 fill-blue-600/20" />}
                    </div>
                    <span className="text-[11px] text-[#64748B] dark:text-slate-400 font-medium">{creator.platform} • {creator.followers}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block">{creator.engagement}</span>
                  <span className="text-[9px] text-[#94A3B8] dark:text-slate-500 font-medium">Rate</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ─── 5. GRID: RECENT ACTIVITY & AI ASSISTANT CARD ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Recent Activity Log */}
        <div className="rounded-[16px] bg-white dark:bg-[#11172A] border border-[#E2E8F0] dark:border-slate-800/90 p-5 shadow-[0_4px_16px_rgba(15,23,42,0.06)] space-y-3">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-slate-800 pb-2.5">
            <h3 className="text-sm sm:text-base font-bold text-[#0F172A] dark:text-slate-100">Recent Activity</h3>
            <span className="text-[10px] text-[#94A3B8] dark:text-slate-500 font-mono">Live Feed</span>
          </div>

          <div className="space-y-2 pt-1">
            {RECENT_ACTIVITY_LOG.map((act) => (
              <div key={act.id} className="flex items-center justify-between text-xs py-2 border-b border-[#E2E8F0] dark:border-slate-800/60 last:border-none">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#315BEF] dark:text-blue-400 shrink-0" />
                  <span className="text-[#0F172A] dark:text-slate-300 font-medium">{act.text}</span>
                </div>
                <span className="text-[10px] text-[#94A3B8] dark:text-slate-500 font-mono shrink-0 ml-2">{act.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Campaign Assistant Card */}
        <div className="rounded-2xl bg-gradient-to-br from-[#315BEF] via-blue-600 to-indigo-800 text-white p-5 shadow-md shadow-blue-600/15 flex flex-col justify-between space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/15 backdrop-blur-md flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-blue-200" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 font-mono">AI Campaign Assistant</span>
          </div>

          <p className="text-sm sm:text-base font-bold leading-snug">
            Need help finding creators for your next campaign?
          </p>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <Link href="/ai-assistant">
              <Button className="h-8 px-4 rounded-full bg-white text-[#11182F] hover:bg-slate-100 font-bold text-[11px] shadow-xs cursor-pointer">
                Find Creators
              </Button>
            </Link>
            <Link href="/campaigns/create">
              <Button variant="outline" className="h-8 px-4 rounded-full border-white/30 text-white hover:bg-white/15 font-bold text-[11px] cursor-pointer">
                Generate Brief
              </Button>
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
