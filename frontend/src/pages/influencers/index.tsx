import { useState, useMemo, memo } from "react";
import { useListInfluencers } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Instagram, Youtube, Twitter, Filter, Loader2, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";

// Populated 8-Creator Fallback Roster
const defaultCreatorsList = [
  {
    id: "1",
    name: "Alex Rivera",
    category: "lifestyle",
    country: "US",
    followers: 125000,
    engagementRate: 4.2,
    collaborationCost: 1500,
    isVerified: true,
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
    coverUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop",
    platforms: ["instagram", "tiktok", "youtube"],
  },
  {
    id: "2",
    name: "Maya Chen",
    category: "tech",
    country: "US",
    followers: 285000,
    engagementRate: 6.2,
    collaborationCost: 2800,
    isVerified: true,
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150&auto=format&fit=crop",
    coverUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop",
    platforms: ["tiktok", "youtube"],
  },
  {
    id: "3",
    name: "Jordan Lee",
    category: "beauty",
    country: "UK",
    followers: 410000,
    engagementRate: 5.1,
    collaborationCost: 4200,
    isVerified: true,
    avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=150&auto=format&fit=crop",
    coverUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800&auto=format&fit=crop",
    platforms: ["youtube", "instagram"],
  },
  {
    id: "4",
    name: "Sofia Martinez",
    category: "fitness",
    country: "US",
    followers: 95000,
    engagementRate: 7.4,
    collaborationCost: 1200,
    isVerified: true,
    avatarUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=150&auto=format&fit=crop",
    coverUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=800&auto=format&fit=crop",
    platforms: ["instagram", "tiktok"],
  },
  {
    id: "5",
    name: "Liam Vance",
    category: "lifestyle",
    country: "CA",
    followers: 180000,
    engagementRate: 5.8,
    collaborationCost: 2100,
    isVerified: true,
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop",
    coverUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800&auto=format&fit=crop",
    platforms: ["instagram", "youtube"],
  },
  {
    id: "6",
    name: "Emma Watson",
    category: "beauty",
    country: "FR",
    followers: 320000,
    engagementRate: 4.9,
    collaborationCost: 3500,
    isVerified: true,
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop",
    coverUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop",
    platforms: ["instagram", "tiktok"],
  },
  {
    id: "7",
    name: "Lucas Silva",
    category: "gaming",
    country: "BR",
    followers: 150000,
    engagementRate: 6.5,
    collaborationCost: 1800,
    isVerified: true,
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop",
    coverUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop",
    platforms: ["youtube", "twitter"],
  },
  {
    id: "8",
    name: "Zoe Kravitz",
    category: "lifestyle",
    country: "US",
    followers: 210000,
    engagementRate: 5.3,
    collaborationCost: 2400,
    isVerified: true,
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
    coverUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop",
    platforms: ["instagram", "tiktok"],
  },
];

const PlatformIcon = memo(({ name }: { name: string }) => {
  switch (name.toLowerCase()) {
    case 'instagram': return <Instagram className="h-3.5 w-3.5" />;
    case 'youtube': return <Youtube className="h-3.5 w-3.5" />;
    case 'tiktok': return <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>;
    case 'twitter': return <Twitter className="h-3.5 w-3.5" />;
    default: return null;
  }
});
PlatformIcon.displayName = "PlatformIcon";

export default function Influencers() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [platform, setPlatform] = useState<string>("all");
  
  const debouncedSearch = useDebounce(search, 500);

  const { data: apiInfluencers, isLoading } = useListInfluencers({
    search: debouncedSearch || undefined,
    category: category !== "all" ? category : undefined,
    platform: platform !== "all" ? platform : undefined,
  });

  // MEMOIZED ARRAY MERGE (prevents re-filtering on every render pass)
  const influencers = useMemo(() => {
    const list = Array.isArray(apiInfluencers) ? apiInfluencers : [];
    if (list.length >= 8) {
      return list;
    }
    return [
      ...list,
      ...defaultCreatorsList.filter(d => !list.some((a: any) => a.id === d.id || a.name === d.name))
    ];
  }, [apiInfluencers]);

  return (
    <div className="space-y-8 w-full pb-12">
      
      {/* Page Title Header */}
      <div className="flex flex-col gap-1 pt-1 border-b border-slate-200/60 dark:border-slate-800/80 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#11182F] dark:text-slate-100 tracking-tight">Creator Discovery</h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">Find and recruit the perfect verified creators for your next brand campaign.</p>
      </div>

      {/* SEARCH & FILTER CONTROLLER BAR */}
      <div className="rounded-2xl bg-white dark:bg-[#11172A] border border-slate-200/80 dark:border-slate-800/80 p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-center gap-3 w-full">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <Input 
            placeholder="Search by name, handle, or keyword..." 
            className="pl-9 h-10 border-slate-200/80 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-[150px] h-10 border-slate-200/80 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 text-xs rounded-xl font-medium">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="rounded-xl bg-white dark:bg-[#11172A] border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="lifestyle">Lifestyle</SelectItem>
              <SelectItem value="tech">Technology</SelectItem>
              <SelectItem value="beauty">Beauty & Fashion</SelectItem>
              <SelectItem value="gaming">Gaming</SelectItem>
              <SelectItem value="fitness">Fitness</SelectItem>
            </SelectContent>
          </Select>

          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="w-full sm:w-[150px] h-10 border-slate-200/80 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 text-xs rounded-xl font-medium">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent className="rounded-xl bg-white dark:bg-[#11172A] border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl cursor-pointer">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* CREATOR CARDS GRID */}
      {isLoading ? (
        <div className="flex h-64 w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#315BEF]" />
        </div>
      ) : influencers?.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
          {influencers.map((influencer) => (
            <Link key={influencer.id} href={`/influencers/${influencer.id}`}>
              <Card className="rounded-2xl bg-white dark:bg-[#11172A] border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer group h-full flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
                
                {/* Banner Cover */}
                <div className="relative h-28 bg-gradient-to-r from-[#315BEF] via-blue-600 to-indigo-600 overflow-hidden">
                  {influencer.coverUrl && (
                    <img src={influencer.coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90" alt="Cover" />
                  )}
                  {influencer.isVerified && (
                    <div className="absolute top-3 right-3 bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 rounded-full p-0.5 shadow-md" title="Verified Creator">
                      <CheckCircle2 className="w-4 h-4 fill-blue-600/20 dark:fill-blue-400/20" />
                    </div>
                  )}
                </div>

                <CardContent className="p-5 pt-0 relative flex-1 flex flex-col">
                  {/* Avatar Overlay */}
                  <Avatar className="h-16 w-16 border-4 border-white dark:border-[#11172A] shadow-md absolute -top-8 left-4">
                    <AvatarImage src={influencer.avatarUrl} className="object-cover" />
                    <AvatarFallback className="text-lg font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">{influencer.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  
                  <div className="mt-10 flex-1 space-y-3">
                    <div>
                      <h3 className="font-bold text-base text-[#11182F] dark:text-slate-100 leading-tight group-hover:text-[#315BEF] dark:group-hover:text-blue-400 transition-colors">{influencer.name}</h3>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        <span className="capitalize font-semibold text-slate-700 dark:text-slate-300">{influencer.category}</span>
                        <span>•</span>
                        <span className="flex items-center"><MapPin className="h-3 w-3 mr-0.5 text-slate-400 dark:text-slate-500" /> {influencer.country}</span>
                      </div>
                    </div>

                    {/* Metrics Summary Box */}
                    <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/60">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">Followers</div>
                        <div className="font-black text-sm text-[#11182F] dark:text-slate-100">{(influencer.followers / 1000).toFixed(1)}k</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">Engagement</div>
                        <div className="font-black text-sm text-emerald-600 dark:text-emerald-400">{influencer.engagementRate}%</div>
                      </div>
                    </div>

                    {/* Platform Icons */}
                    <div className="flex gap-1.5 pt-1">
                      {influencer.platforms.slice(0, 3).map(p => (
                        <Badge key={p} variant="secondary" className="h-6 px-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-none text-[10px] font-semibold flex items-center gap-1">
                          <PlatformIcon name={p} />
                          <span className="capitalize">{p}</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {/* Footer Row */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-600 dark:text-slate-400">From <strong className="text-[#11182F] dark:text-slate-100 font-bold">${influencer.collaborationCost}</strong></span>
                    <span className="text-[#315BEF] dark:text-blue-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 font-bold">
                      View Profile <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#11172A] w-full">
          <Search className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">No creators found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Try adjusting your search terms or filters.</p>
          <Button variant="outline" className="mt-4 text-xs font-bold rounded-full" onClick={() => { setSearch(""); setCategory("all"); setPlatform("all"); }}>
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  );
}
