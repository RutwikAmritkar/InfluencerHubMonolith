import { useListCampaigns } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Sparkles, Calendar, Users, Briefcase, Filter, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Realistic Fallback Opportunities List for Creators
const defaultOpportunitiesList = [
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
    matchScore: 98,
    category: "Beauty & Wellness",
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
    matchScore: 94,
    category: "Tech & Gaming",
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
    matchScore: 91,
    category: "Fashion & Lifestyle",
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
    matchScore: 88,
    category: "Food & Fitness",
  },
];

export default function Opportunities() {
  const { user } = useAuth();
  const [platform, setPlatform] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  const { data: apiCampaigns, isLoading } = useListCampaigns({
    status: "active",
  });

  const opportunities = useMemo(() => {
    const list = Array.isArray(apiCampaigns) && apiCampaigns.length > 0 ? apiCampaigns : defaultOpportunitiesList;

    return list.filter((item: any) => {
      const matchesSearch =
        !search ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.brandName.toLowerCase().includes(search.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(search.toLowerCase()));

      const matchesPlatform = platform === "all" || item.platform.toLowerCase() === platform.toLowerCase();

      return matchesSearch && matchesPlatform;
    });
  }, [apiCampaigns, search, platform]);

  return (
    <div className="space-y-8 w-full pb-12 text-slate-900 dark:text-slate-100">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 dark:border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#11182F] dark:text-slate-100">
              Opportunities
            </h1>
            <Badge className="bg-blue-50 dark:bg-blue-950/80 text-[#315BEF] dark:text-blue-400 border-blue-200 text-[10px] font-bold">
              ✦ Recommended for You
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Discover active brand campaigns tailored to your niche, audience demographics, and engagement rates.
          </p>
        </div>

        <Link href="/applications">
          <Button variant="outline" className="h-9 px-4 border-slate-200 dark:border-slate-700 font-bold text-xs rounded-xl cursor-pointer">
            View My Pitches →
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl bg-white dark:bg-[#11172A] border border-slate-200/80 dark:border-slate-800/80 p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-center gap-3 w-full">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <Input
            placeholder="Search opportunities by title, brand, or niche..."
            className="pl-9 h-10 border-slate-200/80 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-xs rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="w-full sm:w-[160px] h-10 border-slate-200/80 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 text-xs rounded-xl font-medium">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent className="rounded-xl bg-white dark:bg-[#11172A] border-slate-200 dark:border-slate-800">
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl cursor-pointer">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Opportunities Cards Roster */}
      {isLoading ? (
        <div className="flex h-64 w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#315BEF]" />
        </div>
      ) : opportunities.length > 0 ? (
        <div className="grid gap-4 w-full">
          {opportunities.map((item: any) => (
            <Link key={item.id} href={`/campaigns/${item.id}`}>
              <Card className="rounded-2xl bg-white dark:bg-[#11172A] border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-all cursor-pointer group overflow-hidden text-slate-900 dark:text-slate-100">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    <div className="p-5 sm:p-6 flex-1 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          {item.brandLogoUrl ? (
                            <img src={item.brandLogoUrl} className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 object-cover" alt="Logo" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-[#315BEF] dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                              {item.brandName ? item.brandName.charAt(0) : "B"}
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{item.brandName}</p>
                            <h3 className="text-base sm:text-lg font-bold group-hover:text-[#315BEF] dark:group-hover:text-blue-400 transition-colors">{item.title}</h3>
                          </div>
                        </div>
                        <Badge className="bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 text-[10px] font-bold">
                          ✦ {item.matchScore || 95}% Match
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 max-w-3xl leading-relaxed">
                        {item.description}
                      </p>

                      <div className="flex flex-wrap gap-4 sm:gap-6 text-xs pt-1">
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                          <span className="font-bold text-[#11182F] dark:text-slate-100">${item.budget.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                          <span className="font-bold capitalize text-slate-700 dark:text-slate-300">{item.platform}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                          <span className="text-slate-500 dark:text-slate-400">Deadline: <strong className="text-slate-700 dark:text-slate-300">{new Date(item.deadline).toLocaleDateString()}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#F8FAFF] dark:bg-slate-800/40 p-5 sm:w-48 flex sm:flex-col justify-between items-center sm:items-end border-t sm:border-t-0 sm:border-l border-[#E2E8F3] dark:border-slate-800">
                      <div className="text-left sm:text-right">
                        <div className="text-xl sm:text-2xl font-black text-[#0F172A] dark:text-slate-100">${item.budget.toLocaleString()}</div>
                        <div className="text-[10px] font-bold text-[#64748B] dark:text-slate-500 uppercase tracking-wider font-mono mt-0.5">ESTIMATED PAYOUT</div>
                      </div>
                      <Button size="sm" className="h-8 px-4.5 rounded-xl bg-[#315CF5] hover:bg-blue-600 text-white font-bold text-xs shadow-2xs group-hover:translate-x-0.5 transition-transform cursor-pointer">
                        Apply Now →
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
          <Sparkles className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">No matching opportunities</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Try adjusting your filters or search terms.</p>
        </div>
      )}
    </div>
  );
}
