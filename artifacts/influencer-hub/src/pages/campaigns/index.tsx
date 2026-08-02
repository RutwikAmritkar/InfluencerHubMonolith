import { useListCampaigns } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Megaphone, Calendar, Users, Briefcase, Plus, Filter, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Campaigns() {
  const { user } = useAuth();
  const [status, setStatus] = useState<string>("all");
  
  const { data: campaigns, isLoading } = useListCampaigns({
    status: status !== "all" ? status : undefined,
    brandId: user?.role === "brand" ? user.id : undefined, // Brands see their own, creators see open ones (or we could fetch all active)
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-teal-500/10 text-teal-600 border-teal-500/20';
      case 'completed': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'paused': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'draft': return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
      default: return 'bg-slate-500/10 text-slate-600';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            {user?.role === "brand" ? "Manage your influencer campaigns." : "Discover opportunities with top brands."}
          </p>
        </div>
        {user?.role === "brand" && (
          <Button className="shrink-0" asChild>
            <Link href="/campaigns/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Campaign
            </Link>
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search campaigns..." className="pl-9 h-11 bg-card" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-[180px] h-11 bg-card">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            {user?.role === "brand" && <SelectItem value="draft">Drafts</SelectItem>}
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 bg-card">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-64 w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : campaigns?.length ? (
        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
              <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    <div className="p-6 flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          {campaign.brandLogoUrl ? (
                            <img src={campaign.brandLogoUrl} className="w-10 h-10 rounded-lg border object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                              {campaign.brandName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">{campaign.brandName}</p>
                            <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{campaign.title}</h3>
                          </div>
                        </div>
                        <Badge variant="outline" className={getStatusColor(campaign.status)}>
                          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                        </Badge>
                      </div>
                      
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-6 max-w-3xl">
                        {campaign.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-4 sm:gap-8 text-sm">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">${campaign.budget.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span><span className="font-medium capitalize">{campaign.platform}</span> Platform</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Deadline: <span className="font-medium">{new Date(campaign.deadline).toLocaleDateString()}</span></span>
                        </div>
                      </div>
                    </div>
                    
                    {user?.role === "brand" && (
                      <div className="bg-muted/30 p-6 sm:w-48 flex sm:flex-col justify-between items-center sm:items-end border-t sm:border-t-0 sm:border-l">
                        <div className="text-center sm:text-right">
                          <div className="text-2xl font-bold text-primary">{campaign.applicationsCount}</div>
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">Applicants</div>
                        </div>
                        <div className="text-sm font-medium text-primary group-hover:underline">
                          View details →
                        </div>
                      </div>
                    )}
                    
                    {user?.role === "influencer" && (
                      <div className="bg-muted/30 p-6 sm:w-48 flex sm:flex-col justify-between items-center sm:items-end border-t sm:border-t-0 sm:border-l">
                        <Button className="w-full">View Details</Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-32 border border-dashed rounded-xl bg-muted/10">
          <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-bold mb-1">No campaigns found</h3>
          <p className="text-muted-foreground">
            {user?.role === "brand" ? "Create your first campaign to get started." : "No open campaigns match your criteria."}
          </p>
          {user?.role === "brand" && (
            <Button className="mt-6" asChild>
              <Link href="/campaigns/create">Create Campaign</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
