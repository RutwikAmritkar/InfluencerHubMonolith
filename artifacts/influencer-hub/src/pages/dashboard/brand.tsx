import { useGetBrandDashboard, getGetBrandDashboardQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Megaphone, Users, UserCheck, Heart, TrendingUp, Calendar, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function BrandDashboard() {
  const { data, isLoading, isError } = useGetBrandDashboard({
    query: {
      queryKey: getGetBrandDashboardQueryKey(),
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

  const { totalCampaigns, activeCampaigns, totalApplications, savedInfluencers, recentCampaigns, topInfluencers } = data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-teal-500/10 text-teal-600 hover:bg-teal-500/20';
      case 'completed': return 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20';
      case 'paused': return 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20';
      default: return 'bg-slate-500/10 text-slate-600 hover:bg-slate-500/20';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your campaigns today.</p>
        </div>
        <Button asChild>
          <Link href="/campaigns/create">
            <Megaphone className="mr-2 h-4 w-4" />
            New Campaign
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-muted">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Campaigns</CardTitle>
            <div className="h-8 w-8 bg-cyan-500/10 text-cyan-600 rounded-md flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeCampaigns}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Out of {totalCampaigns} total campaigns
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-muted">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Applications</CardTitle>
            <div className="h-8 w-8 bg-indigo-500/10 text-indigo-600 rounded-md flex items-center justify-center">
              <UserCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalApplications}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Waiting for review
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-muted">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Network Reach</CardTitle>
            <div className="h-8 w-8 bg-teal-500/10 text-teal-600 rounded-md flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1.2M</div>
            <p className="text-xs text-muted-foreground mt-1">
              Estimated active audience
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-muted">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saved Creators</CardTitle>
            <div className="h-8 w-8 bg-rose-500/10 text-rose-600 rounded-md flex items-center justify-center">
              <Heart className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{savedInfluencers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              In your talent pool
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 shadow-sm border-muted">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Campaigns</CardTitle>
              <CardDescription>
                Your most recently updated campaigns
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/campaigns">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentCampaigns && recentCampaigns.length > 0 ? (
              <div className="space-y-6">
                {recentCampaigns.map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center text-xl font-bold text-muted-foreground capitalize">
                        {campaign.platform.charAt(0)}
                      </div>
                      <div>
                        <Link href={`/campaigns/${campaign.id}`}>
                          <p className="font-semibold hover:text-primary transition-colors cursor-pointer">{campaign.title}</p>
                        </Link>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Badge variant="secondary" className={getStatusColor(campaign.status)}>
                            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                          </Badge>
                          <span>•</span>
                          <span>${campaign.budget.toLocaleString()} budget</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-sm">{campaign.applicationsCount} applicants</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end mt-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(campaign.deadline).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <Megaphone className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground mb-4">No campaigns yet.</p>
                <Button variant="outline" asChild>
                  <Link href="/campaigns/create">Create your first campaign</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 shadow-sm border-muted">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Top Matches</CardTitle>
              <CardDescription>Creators that fit your brand</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/influencers">Explore</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {topInfluencers && topInfluencers.length > 0 ? (
              <div className="space-y-6">
                {topInfluencers.map((influencer) => (
                  <div key={influencer.id} className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border">
                      <AvatarImage src={influencer.avatarUrl} />
                      <AvatarFallback>{influencer.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <Link href={`/influencers/${influencer.id}`}>
                        <p className="font-medium text-sm hover:text-primary transition-colors cursor-pointer truncate">
                          {influencer.name}
                        </p>
                      </Link>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground truncate">
                        <span className="capitalize">{influencer.category}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" /> {influencer.country}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-sm">{(influencer.followers / 1000).toFixed(1)}k</div>
                      <div className="text-xs text-muted-foreground">Followers</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <Users className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground">No creator matches yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
