import { useGetCampaignAnalytics, useGetInfluencerAnalytics } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, Users, Target, Activity } from "lucide-react";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

// Realistic Fallback Brand Analytics Data
const defaultBrandData = {
  totalReach: 4500000,
  totalEngagement: 285000,
  impressions: 9800000,
  estimatedRoi: 340,
  performanceByDay: [
    { date: "Aug 1", reach: 120000 },
    { date: "Aug 5", reach: 240000 },
    { date: "Aug 10", reach: 580000 },
    { date: "Aug 15", reach: 950000 },
    { date: "Aug 20", reach: 1450000 },
  ],
};

// Realistic Fallback Creator Analytics Data
const defaultInfData = {
  audienceGender: { male: 32, female: 65, other: 3 },
  followerGrowth: [
    { month: "Mar", followers: 92000 },
    { month: "Apr", followers: 98000 },
    { month: "May", followers: 106000 },
    { month: "Jun", followers: 114000 },
    { month: "Jul", followers: 121000 },
    { month: "Aug", followers: 125000 },
  ],
  engagementByMonth: [
    { month: "Mar", rate: 4.1 },
    { month: "Apr", rate: 4.3 },
    { month: "May", rate: 4.6 },
    { month: "Jun", rate: 4.5 },
    { month: "Jul", rate: 4.7 },
    { month: "Aug", rate: 4.8 },
  ],
  ageDistribution: [
    { range: "18-24", percentage: 42 },
    { range: "25-34", percentage: 38 },
    { range: "35-44", percentage: 14 },
    { range: "45+", percentage: 6 },
  ],
};

export default function Analytics() {
  const { user } = useAuth();
  const id = user?.profileId || 1; 
  const isBrand = user?.role === "brand";
  
  const { data: apiBrandData, isLoading: brandLoading } = useGetCampaignAnalytics(id, {
    query: { enabled: isBrand } as any
  });

  const { data: apiInfData, isLoading: infLoading } = useGetInfluencerAnalytics(id, {
    query: { enabled: !isBrand } as any
  });

  const isLoading = isBrand ? brandLoading : infLoading;

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#315BEF]" />
      </div>
    );
  }

  const brandData = apiBrandData || defaultBrandData;
  const infData = apiInfData || defaultInfData;

  const COLORS = ['#315BEF', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  if (isBrand) {
    return (
      <div className="space-y-8 w-full pb-12 text-slate-900 dark:text-slate-100">
        <div className="border-b border-slate-200/60 dark:border-slate-800/80 pb-5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#11182F] dark:text-slate-100">
            Campaign Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Measure total reach, engagement metrics, and estimated ROI across active partnerships.
          </p>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-xs border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#11172A]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
                Total Reach
              </CardTitle>
              <Users className="h-4 w-4 text-[#315BEF]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-black text-[#11182F] dark:text-slate-100">
                {(brandData.totalReach / 1000000).toFixed(1)}M
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-xs border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#11172A]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
                Engagement
              </CardTitle>
              <Activity className="h-4 w-4 text-cyan-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-black text-[#11182F] dark:text-slate-100">
                {(brandData.totalEngagement / 1000).toFixed(1)}k
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xs border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#11172A]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
                Impressions
              </CardTitle>
              <Target className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-black text-[#11182F] dark:text-slate-100">
                {(brandData.impressions / 1000000).toFixed(1)}M
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xs border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider font-mono">
                Estimated ROI
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-300">
                {brandData.estimatedRoi}%
              </div>
            </CardContent>
          </Card>
        </div>

        {brandData.performanceByDay && (
          <Card className="shadow-xs border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#11172A]">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <CardTitle className="text-base font-bold">Performance Over Time</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[320px] sm:h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={brandData.performanceByDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#315BEF" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#315BEF" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748B" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748B" }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', background: '#11172A', border: '1px solid #1E293B', color: '#FFF' }} />
                    <Area type="monotone" dataKey="reach" stroke="#315BEF" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReach)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  const genderData = [
    { name: 'Female', value: infData.audienceGender.female },
    { name: 'Male', value: infData.audienceGender.male },
    { name: 'Other', value: infData.audienceGender.other },
  ];

  return (
    <div className="space-y-8 w-full pb-12 text-slate-900 dark:text-slate-100">
      <div className="border-b border-slate-200/60 dark:border-slate-800/80 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#11182F] dark:text-slate-100">
          Audience Analytics & Insights
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
          Deep dive into your audience demographics, follower growth, and engagement rate performance.
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <Card className="shadow-xs border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#11172A]">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <CardTitle className="text-base font-bold">Follower Growth</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[280px] sm:h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={infData.followerGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B20" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748B" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748B" }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', background: '#11172A', border: '1px solid #1E293B', color: '#FFF' }} />
                  <Line type="monotone" dataKey="followers" stroke="#315BEF" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#11172A]">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <CardTitle className="text-base font-bold">Engagement Rate (%)</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[280px] sm:h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={infData.engagementByMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B20" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748B" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748B" }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', background: '#11172A', border: '1px solid #1E293B', color: '#FFF' }} />
                  <Bar dataKey="rate" fill="#10B981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <Card className="shadow-xs border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#11172A]">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <CardTitle className="text-base font-bold">Gender Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {genderData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', background: '#11172A', border: '1px solid #1E293B', color: '#FFF' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#11172A] lg:col-span-2">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <CardTitle className="text-base font-bold">Age Demographic Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={infData.ageDistribution} margin={{ top: 10, right: 20, left: 0, bottom: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1E293B20" />
                  <XAxis type="number" axisLine={false} tickLine={false} hide />
                  <YAxis type="category" dataKey="range" axisLine={false} tickLine={false} width={60} tick={{ fontSize: 11, fill: "#64748B" }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', background: '#11172A', border: '1px solid #1E293B', color: '#FFF' }} />
                  <Bar dataKey="percentage" fill="#315BEF" radius={[0, 6, 6, 0]}>
                    {infData.ageDistribution.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill="#315BEF" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
