import { useGetInfluencerDashboard, getGetInfluencerDashboardQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, DollarSign, Eye, Inbox, ArrowUpRight, Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function InfluencerDashboard() {
  const { data, isLoading, isError } = useGetInfluencerDashboard({
    query: {
      queryKey: getGetInfluencerDashboardQueryKey(),
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-2">Could not load dashboard</h2>
        <p className="text-muted-foreground">Please try again later.</p>
      </div>
    );
  }

  const { profileCompletion, followers, monthlyEarnings, campaignInvites, recentApplications, profileViews, viewsThisWeek } = data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-teal-500/10 text-teal-600 hover:bg-teal-500/20';
      case 'rejected': return 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20';
      case 'pending': return 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20';
      default: return 'bg-slate-500/10 text-slate-600 hover:bg-slate-500/20';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-1">Welcome back. Here's your performance snapshot.</p>
        </div>
        <Button asChild>
          <Link href="/campaigns">
            Find Campaigns
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {profileCompletion < 100 && (
        <Card className="bg-primary/5 border-primary/20 shadow-none">
          <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">Complete your profile</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Brands are more likely to hire creators with complete profiles including rate cards and previous work.
              </p>
              <div className="flex items-center gap-4">
                <Progress value={profileCompletion} className="h-2 flex-1" />
                <span className="text-sm font-medium">{profileCompletion}%</span>
              </div>
            </div>
            <Button variant="secondary" asChild>
              <Link href="/settings">Edit Profile</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-muted">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Audience</CardTitle>
            <div className="h-8 w-8 bg-indigo-500/10 text-indigo-600 rounded-md flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{(followers / 1000).toFixed(1)}k</div>
            <p className="text-xs text-teal-600 font-medium mt-1 flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +2.4% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-muted">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Earnings</CardTitle>
            <div className="h-8 w-8 bg-teal-500/10 text-teal-600 rounded-md flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${monthlyEarnings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Estimated this month
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-muted">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Profile Views</CardTitle>
            <div className="h-8 w-8 bg-cyan-500/10 text-cyan-600 rounded-md flex items-center justify-center">
              <Eye className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{profileViews.toLocaleString()}</div>
            <p className="text-xs text-teal-600 font-medium mt-1 flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +14% from last week
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-muted">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Campaign Invites</CardTitle>
            <div className="h-8 w-8 bg-amber-500/10 text-amber-600 rounded-md flex items-center justify-center">
              <Inbox className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{campaignInvites}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Waiting for response
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 shadow-sm border-muted flex flex-col">
          <CardHeader>
            <CardTitle>Profile Views (This Week)</CardTitle>
            <CardDescription>Brand visibility over time</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-0 pl-0">
            {viewsThisWeek && viewsThisWeek.length > 0 ? (
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={viewsThisWeek} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                      itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="views" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorViews)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                Not enough data to display
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 shadow-sm border-muted">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Applications</CardTitle>
              <CardDescription>Your active pitches</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {recentApplications && recentApplications.length > 0 ? (
              <div className="space-y-6">
                {recentApplications.map((app) => (
                  <div key={app.id} className="flex items-center gap-4 border-b last:border-0 pb-4 last:pb-0">
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                      <Megaphone className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <Link href={`/campaigns/${app.campaignId}`}>
                        <p className="font-medium text-sm hover:text-primary transition-colors cursor-pointer truncate">
                          {app.campaignTitle || `Campaign #${app.campaignId}`}
                        </p>
                      </Link>
                      <div className="text-xs text-muted-foreground mt-1">
                        Applied {new Date(app.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant="secondary" className={getStatusColor(app.status)}>
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <Inbox className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground mb-4">You haven't applied to any campaigns yet.</p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/campaigns">Find Campaigns</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
