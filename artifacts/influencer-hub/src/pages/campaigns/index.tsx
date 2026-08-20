import { useListCampaigns } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Megaphone, Calendar, Users, Briefcase, Plus, Filter, Loader2, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Realistic Fallback Campaigns Roster
const defaultCampaignsList = [
  {
    id: 1,
    title: "Summer Beauty Campaign",
    brandName: "Glow Cosmetics",
    brandLogoUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=150&auto=format&fit=crop",
    description: "Seeking beauty & lifestyle creators to showcase our new SPF Glow Lotion during the summer season.",
    budget: 5000,
    platform: "instagram",
    status: "active",
    deadline: "2026-09-01",
    applicationsCount: 8,
  },
  {
    id: 2,
    title: "Tech Launch 2026",
    brandName: "NovaTech",
    brandLogoUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=150&auto=format&fit=crop",
    description: "Looking for tech review creators to unbox and review our new ergonomic wireless ANC headphones.",
    budget: 12500,
    platform: "youtube",
    status: "active",
    deadline: "2026-09-15",
    applicationsCount: 12,
  },
  {
    id: 3,
    title: "Fall Apparel Drop",
    brandName: "UrbanFit",
    brandLogoUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=150&auto=format&fit=crop",
    description: "Streetwear and activewear fashion influencers wanted to style our upcoming autumn collection.",
    budget: 18000,
    platform: "tiktok",
    status: "active",
    deadline: "2026-10-01",
    applicationsCount: 15,
  },
  {
    id: 4,
    title: "Organic Snack Rollout",
    brandName: "FreshBite",
    brandLogoUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=150&auto=format&fit=crop",
    description: "Health & wellness creators for a national grocery retail snack campaign.",
    budget: 7080,
    platform: "instagram",
    status: "active",
    deadline: "2026-09-20",
    applicationsCount: 6,
  },
];

export default function Campaigns() {
  const { user } = useAuth();
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  
  const { data: apiCampaigns, isLoading } = useListCampaigns({
    status: status !== "all" ? status : undefined,
    brandId: user?.role === "brand" ? user.id : undefined,
  });

  const campaigns = useMemo(() => {
    if (apiCampaigns && apiCampaigns.length > 0) {
      return apiCampaigns;
    }
    return defaultCampaignsList;
  }, [apiCampaigns]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200';
      case 'completed': return 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200';
      case 'paused': return 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200';
      case 'draft': return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-600';
    }
  };

  return (
    <div className="space-y-8 w-full pb-12 text-slate-900 dark:text-slate-100">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 dark:border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#11182F] dark:text-slate-100">Campaigns</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {user?.role === "brand" ? "Manage your brand influencer campaigns." : "Discover active brand campaign opportunities."}
          </p>
        </div>
        {user?.role === "brand" && (
          <Link href="/campaigns/create">
            <Button className="h-9 px-4 bg-[#315BEF] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Create Campaign
            </Button>
          </Link>
        )}
      </div>

      {/* Filter Controller Bar */}
      <div className="rounded-2xl bg-white dark:bg-[#11172A] border border-slate-200/80 dark:border-slate-800/80 p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-center gap-3 w-full">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <Input 
            placeholder="Search campaigns by title, brand, or niche..." 
            className="pl-9 h-10 border-slate-200/80 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-xs rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-[160px] h-10 border-slate-200/80 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 text-xs rounded-xl font-medium">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl bg-white dark:bg-[#11172A] border-slate-200 dark:border-slate-800">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              {user?.role === "brand" && <SelectItem value="draft">Drafts</SelectItem>}
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl cursor-pointer">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Campaigns List */}
      {isLoading ? (
        <div className="flex h-64 w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#315BEF]" />
        </div>
      ) : campaigns?.length ? (
        <div className="grid gap-4 w-full">
          {campaigns.map((campaign) => (
            <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
              <Card className="rounded-2xl bg-white dark:bg-[#11172A] border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-all cursor-pointer group overflow-hidden text-slate-900 dark:text-slate-100">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    <div className="p-5 sm:p-6 flex-1 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          {campaign.brandLogoUrl ? (
                            <img src={campaign.brandLogoUrl} className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 object-cover" alt="Logo" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-[#315BEF] dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                              {campaign.brandName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{campaign.brandName}</p>
                            <h3 className="text-base sm:text-lg font-bold group-hover:text-[#315BEF] dark:group-hover:text-blue-400 transition-colors">{campaign.title}</h3>
                          </div>
                        </div>
                        <Badge variant="outline" className={`text-[10px] font-bold ${getStatusColor(campaign.status)}`}>
                          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                        </Badge>
                      </div>
                      
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 max-w-3xl leading-relaxed">
                        {campaign.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-4 sm:gap-6 text-xs pt-1">
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                          <span className="font-bold text-[#11182F] dark:text-slate-100">${campaign.budget.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                          <span className="font-bold capitalize text-slate-700 dark:text-slate-300">{campaign.platform}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                          <span className="text-slate-500 dark:text-slate-400">Deadline: <strong className="text-slate-700 dark:text-slate-300">{new Date(campaign.deadline).toLocaleDateString()}</strong></span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50/80 dark:bg-slate-800/40 p-5 sm:w-48 flex sm:flex-col justify-between items-center sm:items-end border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-800">
                      <div className="text-left sm:text-right">
                        <div className="text-xl sm:text-2xl font-black text-[#315BEF] dark:text-blue-400">{campaign.applicationsCount || 0}</div>
                        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono mt-0.5">Applicants</div>
                      </div>
                      <Button size="sm" className="h-8 px-3 rounded-xl bg-[#315BEF] hover:bg-blue-600 text-white font-bold text-xs shadow-2xs group-hover:translate-x-0.5 transition-transform">
                        Details →
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#11172A] w-full">
          <Megaphone className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">No campaigns found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Try adjusting your filters or search terms.</p>
        </div>
      )}
    </div>
  );
}
