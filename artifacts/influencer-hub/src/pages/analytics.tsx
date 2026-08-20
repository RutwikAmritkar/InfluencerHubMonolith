import { useGetCampaignAnalytics, useGetInfluencerAnalytics } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, TrendingUp, Users, Target, Activity } from "lucide-react";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

export default function Analytics() {
  const { user } = useAuth();
  // Using ID 1 as placeholder since we don't have a specific campaign/influencer ID from context
  const id = user?.profileId || 1; 

  // Depending on role, we would fetch different analytics.
  const isBrand = user?.role === "brand";
  
  const { data: brandData, isLoading: brandLoading } = useGetCampaignAnalytics(id, {
    query: { enabled: isBrand } as any
  });

  const { data: infData, isLoading: infLoading } = useGetInfluencerAnalytics(id, {
    query: { enabled: !isBrand } as any
  });

  const isLoading = isBrand ? brandLoading : infLoading;

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  if (isBrand && brandData) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaign Analytics</h1>
          <p className="text-muted-foreground mt-1">Measure the impact of your influencer partnerships.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm border-muted">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Reach</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{(brandData.totalReach / 1000000).toFixed(1)}M</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-muted">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Engagement</CardTitle>
              <Activity className="h-4 w-4 text-cyan-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{(brandData.totalEngagement / 1000).toFixed(1)}k</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-muted">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Impressions</CardTitle>
              <Target className="h-4 w-4 text-teal-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{(brandData.impressions / 1000000).toFixed(1)}M</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-muted bg-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-primary">Estimated ROI</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{brandData.estimatedRoi}%</div>
            </CardContent>
          </Card>
        </div>

        {brandData.performanceByDay && (
          <Card className="shadow-sm border-muted">
            <CardHeader>
              <CardTitle>Performance Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={brandData.performanceByDay} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="reach" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorReach)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (!isBrand && infData) {
    const genderData = [
      { name: 'Male', value: infData.audienceGender.male },
      { name: 'Female', value: infData.audienceGender.female },
      { name: 'Other', value: infData.audienceGender.other },
    ];

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audience Analytics</h1>
          <p className="text-muted-foreground mt-1">Deep dive into your audience demographics and growth.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-sm border-muted">
            <CardHeader>
              <CardTitle>Follower Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={infData.followerGrowth} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="followers" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-muted">
            <CardHeader>
              <CardTitle>Engagement Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={infData.engagementByMonth} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="rate" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="shadow-sm border-muted">
            <CardHeader>
              <CardTitle>Gender Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {genderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-muted md:col-span-2">
            <CardHeader>
              <CardTitle>Age Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={infData.ageDistribution} margin={{ top: 10, right: 30, left: 0, bottom: 0 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" axisLine={false} tickLine={false} hide />
                    <YAxis type="category" dataKey="range" axisLine={false} tickLine={false} width={60} />
                    <Tooltip />
                    <Bar dataKey="percentage" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]}>
                      {infData.ageDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(var(--accent))`} />
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

  return null;
}
