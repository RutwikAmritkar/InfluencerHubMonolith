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
        
        {/* Left Card: CREATOR PROFILE */}
        <div className="lg:col-span-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-white dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-[#11172A] border border-blue-100/80 dark:border-blue-900/60 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <Avatar className="h-13 w-13 border-2 border-white dark:border-slate-800 shadow-md ring-2 ring-blue-500/20">
                <AvatarImage src={user?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop"} />
                <AvatarFallback className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-extrabold text-sm">
                  {user?.name?.charAt(0) || "T"}
                </AvatarFallback>
              </Avatar>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-bold text-[#11182F] dark:text-slate-100">{user?.name || "Test"}</h3>
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 fill-blue-600/20 dark:fill-blue-400/20" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Lifestyle & Fashion Creator • Verified Roster</p>
              </div>
            </div>

            <Badge variant="secondary" className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/90 dark:border-emerald-800/80 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs">
              ✓ Profile Verified
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2.5 border-t border-blue-100/60 dark:border-slate-800">
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/60 border border-blue-100/60 dark:border-slate-700/60 text-center shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">Instagram</span>
              <span className="text-sm font-black text-[#11182F] dark:text-slate-100 block mt-0.5">{followersCount}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/60 border border-blue-100/60 dark:border-slate-700/60 text-center shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">TikTok</span>
              <span className="text-sm font-black text-[#11182F] dark:text-slate-100 block mt-0.5">86K</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/60 border border-blue-100/60 dark:border-slate-700/60 text-center shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">Avg Eng.</span>
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 block mt-0.5">4.8%</span>
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

      {/* ─── 5. ROW 4: SPLIT YOUR SOCIAL PRESENCE & ✨ AI ASSISTANT ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-5">
        
        {/* Left Card: Your Social Presence */}
        <div className="lg:col-span-4 rounded-2xl bg-white dark:bg-[#11172A] border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <div>
              <h3 className="text-base font-bold text-[#11182F] dark:text-slate-100">Your Social Presence</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Connected handles & verified stats.</p>
            </div>
            
            <Link href="/settings">
              <button
                type="button"
                className="text-[11px] font-bold text-[#315BEF] dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center gap-1 cursor-pointer transition-colors group"
              >
                <span>Manage social accounts</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <Instagram className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                <Badge className="bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[9px] font-bold">✓ Verified</Badge>
              </div>
              <div>
                <span className="font-bold text-xs text-[#11182F] dark:text-slate-100 block">IG {followersCount}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Instagram handle</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <Video className="w-4 h-4 text-slate-900 dark:text-slate-100" />
                <Badge className="bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[9px] font-bold">✓ Verified</Badge>
              </div>
              <div>
                <span className="font-bold text-xs text-[#11182F] dark:text-slate-100 block">TikTok 86K</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">TikTok handle</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <Youtube className="w-4 h-4 text-red-600 dark:text-red-400" />
                <Badge className="bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 text-[9px] font-bold">✓ Connected</Badge>
              </div>
              <div>
                <span className="font-bold text-xs text-[#11182F] dark:text-slate-100 block">YT 32K</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">YouTube channel</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: ✨ AI Assistant */}
        <div className="lg:col-span-3 rounded-2xl bg-gradient-to-br from-[#315BEF] via-indigo-600 to-indigo-800 text-white p-5 shadow-md shadow-blue-600/15 flex flex-col justify-between space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/15 backdrop-blur-md flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-blue-200" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 font-mono">✨ AI Assistant</span>
          </div>

          <p className="text-xs sm:text-sm font-bold leading-snug">
            3 campaigns match your audience & niche profile.
          </p>

          <div>
            <Link href="/ai-assistant">
              <Button className="h-8 px-4 rounded-xl bg-white text-[#11182F] hover:bg-slate-100 font-bold text-xs shadow-xs hover:-translate-y-0.5 transition-all cursor-pointer">
                Ask AI →
              </Button>
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
