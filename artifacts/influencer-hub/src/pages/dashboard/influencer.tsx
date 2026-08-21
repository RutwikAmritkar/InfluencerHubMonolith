import { useState, useMemo, memo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useGetInfluencerDashboard, getGetInfluencerDashboardQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import {
  Users,
  DollarSign,
  Eye,
  Inbox,
  ArrowUpRight,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Check,
  Circle,
  Instagram,
  Youtube,
  Video,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SocialPresenceSection } from "@/components/social-presence";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// Default Profile Views Data Fallback
const defaultViewsData = [
  { day: "Mon", views: 240 },
  { day: "Tue", views: 320 },
  { day: "Wed", views: 480 },
  { day: "Thu", views: 610 },
  { day: "Fri", views: 890 },
  { day: "Sat", views: 1120 },
  { day: "Sun", views: 1450 },
];

// ─── OPTIMIZED SUB-COMPONENTS (Memoized to prevent unnecessary re-renders) ────

const KPICard = memo(({ label, value, badgeText, badgeColor, borderColor }: {
  label: string;
  value: string;
  badgeText: string;
  badgeColor: string;
  borderColor: string;
}) => (
  <div className={`rounded-2xl bg-white dark:bg-[#11172A] border border-slate-200/80 dark:border-slate-800/80 p-4 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between h-[100px] border-l-4 ${borderColor}`}>
    <div className="flex items-baseline justify-between">
      <span className="text-2xl sm:text-3xl font-black text-[#11182F] dark:text-slate-100">{value}</span>
      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
        {badgeText}
      </span>
    </div>
    <div>
      <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono block">
        {label}
      </span>
    </div>
  </div>
));
KPICard.displayName = "KPICard";

const OpportunityRow = memo(({ title, details, status, badgeStyle }: {
  title: string;
  details: string;
  status: string;
  badgeStyle: string;
}) => (
  <Link href="/campaigns">
    <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60 hover:bg-blue-50/40 dark:hover:bg-blue-950/40 hover:border-blue-200/80 dark:hover:border-blue-800/80 transition-all flex items-center justify-between group cursor-pointer">
      <div className="space-y-0.5">
        <h4 className="font-bold text-xs text-[#11182F] dark:text-slate-100 group-hover:text-[#315BEF] dark:group-hover:text-blue-400 transition-colors">
          {title}
        </h4>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium" dangerouslySetInnerHTML={{ __html: details }} />
      </div>
      <div className="flex items-center gap-2">
        <Badge className={`text-[10px] font-bold shrink-0 ${badgeStyle}`}>
          {status}
        </Badge>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-[#315BEF] dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
      </div>
    </div>
  </Link>
));
OpportunityRow.displayName = "OpportunityRow";

export default function InfluencerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"Views" | "Reach" | "Engagement" | "Earnings">("Views");

  // Fetch Real API Data
  const { data, isLoading } = useGetInfluencerDashboard({
    query: {
      queryKey: getGetInfluencerDashboardQueryKey(),
    }
  });

  // MEMOIZED API DATA DERIVATIONS (prevents recalculation on tab changes)
  const { profileCompletion, followersCount, monthlyEarnings, profileViews, campaignInvites, viewsThisWeek } = useMemo(() => ({
    profileCompletion: data?.profileCompletion ?? 90,
    followersCount: data?.followers ? `${(data.followers / 1000).toFixed(0)}K` : "125K",
    monthlyEarnings: data?.monthlyEarnings ? `$${data.monthlyEarnings.toLocaleString()}` : "$8,500",
    profileViews: data?.profileViews ? data.profileViews.toLocaleString() : "847",
    campaignInvites: data?.campaignInvites ?? 3,
    viewsThisWeek: data?.viewsThisWeek && data.viewsThisWeek.length > 0 ? data.viewsThisWeek : defaultViewsData,
  }), [data]);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-[#315BEF]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full pb-10">
      
      {/* ─── 1. HEADER ROW: Welcome back + Explore → Button ──────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200/60 dark:border-slate-800/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#11182F] dark:text-slate-100 tracking-tight">
            Welcome back, {user?.name?.split(" ")[0] || "Test"} 👋
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Your influence is growing. Here's what's happening across your audience, campaigns and earnings.
          </p>
        </div>

        <Link href="/campaigns">
          <Button className="h-9 px-5 rounded-xl bg-[#315BEF] hover:bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-600/20 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 cursor-pointer">
            Explore <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      {/* ─── 2. ROW 1: SPLIT CREATOR PROFILE & PROFILE COMPLETION ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-5">
        
        {/* Left Card: CREATOR PROFILE IDENTITY TILE */}
        <div className="lg:col-span-4 rounded-2xl bg-white dark:bg-[#0D1220] border border-slate-200/90 dark:border-slate-800/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-5 relative overflow-hidden">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-blue-500/5 dark:bg-blue-500/10 blur-2xl pointer-events-none" />

          {/* Header Row: Avatar + Name + Handles + Verified Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <Avatar className="h-13 w-13 sm:h-14 sm:w-14 border-2 border-white dark:border-slate-800 shadow-md shadow-blue-500/10 ring-2 ring-blue-500/20 shrink-0">
                <AvatarImage src={user?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop"} />
                <AvatarFallback className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-extrabold text-base">
                  {user?.name?.charAt(0) || "C"}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#11182F] dark:text-slate-100 tracking-tight leading-none">
                    {user?.name || "Creator"}
                  </h3>
                  <CheckCircle2 className="w-4.5 h-4.5 text-[#315BEF] dark:text-blue-400 fill-blue-600/20 dark:fill-blue-400/20 shrink-0" aria-label="Verified Creator" />
                </div>
                <span className="text-xs font-mono font-semibold text-[#315BEF] dark:text-blue-400 block">
                  @alexrivera
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-normal">
                  Lifestyle & Fashion Creator · <span className="text-slate-700 dark:text-slate-300 font-semibold">Verified Roster</span>
                </p>
              </div>
            </div>

            <Badge variant="secondary" className="self-start sm:self-center bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full shadow-2xs shrink-0">
              ✓ Profile Verified
            </Badge>
          </div>

          {/* Social Platform & Engagement Summary Cards Grid (Matching Social Presence system) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            
            {/* Instagram Summary Card */}
            <div className="group relative rounded-xl p-3 bg-[#F9FAFD] dark:bg-[#11172A] border border-[#E3E8F2] dark:border-slate-800/90 hover:border-pink-500/40 dark:hover:border-pink-500/50 hover:bg-[#F2F5FF] dark:hover:bg-slate-800/60 hover:-translate-y-0.5 hover:shadow-[0_0_20px_-4px_rgba(219,39,119,0.25)] transition-all duration-300 cursor-pointer shadow-2xs space-y-2 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Instagram className="w-3.5 h-3.5" aria-hidden="true" />
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">INSTAGRAM</span>
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-pink-50 dark:bg-pink-950/80 text-pink-700 dark:text-pink-300 border border-pink-200/80 dark:border-pink-800/80">● Connected</span>
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-[#101828] dark:text-slate-100 block font-mono leading-none">{followersCount}</span>
                <span className="text-[10px] text-[#667085] dark:text-slate-400 font-medium block mt-1">Followers</span>
              </div>
            </div>

            {/* TikTok Summary Card */}
            <div className="group relative rounded-xl p-3 bg-[#F9FAFD] dark:bg-[#11172A] border border-[#E3E8F2] dark:border-slate-800/90 hover:border-cyan-400/40 dark:hover:border-cyan-400/50 hover:bg-[#F2F5FF] dark:hover:bg-slate-800/60 hover:-translate-y-0.5 hover:shadow-[0_0_20px_-4px_rgba(6,182,212,0.25)] transition-all duration-300 cursor-pointer shadow-2xs space-y-2 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-slate-950 dark:bg-slate-900 border border-slate-800 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">TIKTOK</span>
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border border-cyan-200/80 dark:border-cyan-800/80">● Connected</span>
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-[#101828] dark:text-slate-100 block font-mono leading-none">86K</span>
                <span className="text-[10px] text-[#667085] dark:text-slate-400 font-medium block mt-1">Followers</span>
              </div>
            </div>

            {/* Engagement Summary Card */}
            <div className="group relative rounded-xl p-3 bg-[#F9FAFD] dark:bg-[#11172A] border border-[#E3E8F2] dark:border-slate-800/90 hover:border-blue-500/40 dark:hover:border-blue-500/50 hover:bg-[#F2F5FF] dark:hover:bg-slate-800/60 hover:-translate-y-0.5 hover:shadow-[0_0_20px_-4px_rgba(49,91,239,0.25)] transition-all duration-300 cursor-pointer shadow-2xs space-y-2 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/80 text-[#315CF5] dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center shrink-0 shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">AVG. ENG.</span>
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80">● Strong</span>
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 block font-mono leading-none">4.8%</span>
                <span className="text-[10px] text-[#667085] dark:text-slate-400 font-medium block mt-1">Engagement rate</span>
              </div>
            </div>

          </div>
        </div>

        {/* Right Card: PROFILE COMPLETION */}
        <div className="lg:col-span-3 rounded-2xl bg-white dark:bg-[#11172A] border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#11182F] dark:text-slate-100">Profile Completion</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">{profileCompletion}% complete</p>
            </div>
            <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/80 text-[11px] font-mono font-bold">
              {profileCompletion}%
            </Badge>
          </div>

          <Progress value={profileCompletion} className="h-2 bg-slate-100 dark:bg-slate-800" />

          <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 font-medium">
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 font-bold" />
              <span>Bio & Niche</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 font-bold" />
              <span>Social accounts</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 font-bold" />
              <span>Rate card</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
              <Circle className="w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0" />
              <span>Portfolio</span>
            </div>
          </div>

          <Link href="/settings">
            <Button className="w-full h-8 bg-[#315BEF] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs hover:-translate-y-0.5 transition-all cursor-pointer">
              Complete profile →
            </Button>
          </Link>
        </div>

      </div>

      {/* ─── 3. ROW 2: COMPACT MINIMAL KPI METRIC DISPLAY (MEMOIZED SUB-COMPONENTS) ─ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Audience"
          value={followersCount}
          badgeText="↑ 4.8%"
          badgeColor="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60"
          borderColor="border-l-blue-500"
        />
        <KPICard
          label="Earnings"
          value={monthlyEarnings}
          badgeText="↑ 14.2%"
          badgeColor="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60"
          borderColor="border-l-emerald-500"
        />
        <KPICard
          label="Views"
          value={profileViews}
          badgeText="↑ 22%"
          badgeColor="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60"
          borderColor="border-l-indigo-500"
        />
        <KPICard
          label="Opportunities"
          value={String(campaignInvites)}
          badgeText="3 new opportunities"
          badgeColor="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80"
          borderColor="border-l-amber-500"
        />
      </div>

      {/* ─── 4. ROW 3: SPLIT CREATOR PERFORMANCE & OPPORTUNITIES ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-5">
        
        {/* Left Card: Creator Performance */}
        <div className="lg:col-span-4 rounded-2xl bg-white dark:bg-[#11172A] border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#11182F] dark:text-slate-100">Creator Performance</h3>
              <Badge className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                📈 +22%
              </Badge>
            </div>

            <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-full border border-slate-200/60 dark:border-slate-700/60">
              {(["Views", "Reach", "Engagement", "Earnings"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                    activeTab === tab
                      ? "bg-white dark:bg-slate-700 text-[#11182F] dark:text-slate-100 shadow-xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[210px] w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={viewsThisWeek} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorViewsASCII" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#315BEF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#315BEF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B20" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748B" }} dy={5} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748B" }} />
                <Tooltip
                  contentStyle={{ borderRadius: "10px", border: "1px solid #334155", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.3)", background: "#1E293B" }}
                  itemStyle={{ color: "#F8FAFC", fontWeight: 700, fontSize: "11px" }}
                />
                <Area type="monotone" dataKey="views" stroke="#315BEF" strokeWidth={2.5} fillOpacity={1} fill="url(#colorViewsASCII)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Card: Opportunities (MEMOIZED ROWS) */}
        <div className="lg:col-span-3 rounded-2xl bg-white dark:bg-[#11172A] border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#11182F] dark:text-slate-100">Opportunities</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Active invitations and pitches.</p>
              </div>
            </div>

            <div className="space-y-2.5 pt-3">
              <OpportunityRow
                title="Summer Beauty Campaign"
                details="Glow Cosmetics • Instagram Reel • <strong class='text-slate-900 dark:text-slate-200'>$5,000</strong>"
                status="Accepted"
                badgeStyle="bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/80"
              />
              <OpportunityRow
                title="Tech Launch 2026"
                details="NovaTech • YouTube + Instagram • <strong class='text-slate-900 dark:text-slate-200'>$12,500</strong>"
                status="Under Review"
                badgeStyle="bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/80"
              />
            </div>
          </div>

          <div className="pt-1">
            <Link href="/campaigns">
              <button
                type="button"
                className="text-[11px] font-bold text-[#315BEF] dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center gap-1 cursor-pointer transition-colors group"
              >
                <span>Explore all opportunities</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>
        </div>

      </div>

      {/* ─── 5. ROW 4: YOUR SOCIAL PRESENCE & ✨ AI ASSISTANT ─────────── */}
      <div className="w-full">
        <SocialPresenceSection />
      </div>

    </div>
  );
}
