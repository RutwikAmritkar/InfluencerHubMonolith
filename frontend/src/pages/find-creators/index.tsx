import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { DEFAULT_BRAND_PROFILE, calculateCreatorMatch, calculatePricingIntelligence } from "@/services/brand-service";
import { 
  Search, 
  Filter, 
  Sparkles, 
  CheckCircle2, 
  Bookmark, 
  ExternalLink, 
  Users, 
  DollarSign, 
  Sliders, 
  BadgeCheck, 
  ChevronRight,
  TrendingUp
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import { toast } from "sonner";

// Extended Creator Candidates Pool
const CREATOR_CANDIDATES = [
  {
    id: 101,
    name: "Alex Rivera",
    handle: "@alexrivera",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
    category: "Beauty & Wellness",
    platform: "instagram",
    followersCount: 125000,
    engagementRate: 4.8,
    location: "United States",
    bio: "Lifestyle & Fashion Content Creator based in NYC. Specializing in organic skincare routines and seasonal fashion reels.",
    tier: "mid",
    price: 4500,
  },
  {
    id: 102,
    name: "Marcus Vance",
    handle: "@marcusvance",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop",
    category: "Tech & Gaming",
    platform: "youtube",
    followersCount: 480000,
    engagementRate: 5.2,
    location: "United States",
    bio: "In-depth tech reviews, mobile accessories unboxing, and audio gear teardowns.",
    tier: "macro",
    price: 12500,
  },
  {
    id: 103,
    name: "Elena Rostova",
    handle: "@elena_style",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150&auto=format&fit=crop",
    category: "Fashion & Lifestyle",
    platform: "tiktok",
    followersCount: 860000,
    engagementRate: 6.1,
    location: "Canada",
    bio: "Streetwear lookbooks, autumn outfit transition Reels, and daily vlogs.",
    tier: "macro",
    price: 9500,
  },
  {
    id: 104,
    name: "David Kim",
    handle: "@dkim_fitness",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop",
    category: "Food & Fitness",
    platform: "instagram",
    followersCount: 92000,
    engagementRate: 4.1,
    location: "United Kingdom",
    bio: "Certified nutritionist sharing organic meal prep tips and active lifestyle routines.",
    tier: "mid",
    price: 3200,
  },
];

export default function FindCreatorsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [shortlistedIds, setShortlistedIds] = useState<number[]>([]);

  const filteredCreators = useMemo(() => {
    return CREATOR_CANDIDATES.filter((c) => {
      const matchesSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.handle.toLowerCase().includes(search.toLowerCase()) ||
        c.category.toLowerCase().includes(search.toLowerCase());

      const matchesCategory = categoryFilter === "all" || c.category.toLowerCase().includes(categoryFilter.toLowerCase());
      const matchesPlatform = platformFilter === "all" || c.platform.toLowerCase() === platformFilter.toLowerCase();

      return matchesSearch && matchesCategory && matchesPlatform;
    });
  }, [search, categoryFilter, platformFilter]);

  const toggleShortlist = (creatorId: number, name: string) => {
    if (shortlistedIds.includes(creatorId)) {
      setShortlistedIds(prev => prev.filter(id => id !== creatorId));
      toast.info(`Removed ${name} from saved shortlist.`);
    } else {
      setShortlistedIds(prev => [...prev, creatorId]);
      toast.success(`Added ${name} to campaign shortlist!`);
    }
  };

  return (
    <div className="space-y-8 w-full pb-16 text-slate-900 dark:text-slate-100">
      
      {/* ─── 1. HEADER ROW ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#101828] dark:text-slate-100">
              Find Creators
            </h1>
            <Badge className="bg-blue-50 dark:bg-blue-950/80 text-[#315CF5] dark:text-blue-400 border border-blue-200 text-[10px] font-bold">
              ✦ AI Creator Match Engine
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#667085] dark:text-slate-400 font-medium mt-0.5">
            Discover, evaluate, compare match scores, and shortlist creators for active brand campaigns.
          </p>
        </div>

        <Link href="/saved-creators">
          <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl border-[#E3E8F2] dark:border-slate-700 text-[#101828] dark:text-slate-200 font-bold text-xs hover:bg-[#F2F5FF] dark:hover:bg-slate-800 cursor-pointer flex items-center gap-1.5 shadow-xs">
            <Bookmark className="w-3.5 h-3.5 text-[#315CF5]" />
            <span>View Shortlists ({shortlistedIds.length})</span>
          </Button>
        </Link>
      </div>

      {/* ─── 2. MULTI-DIMENSIONAL SEARCH & FILTER BAR ───────────────────────── */}
      <div className="rounded-[16px] bg-white dark:bg-[#11172A] border border-[#E3E8F2] dark:border-slate-800/90 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#98A2B3] dark:text-slate-500" />
            <Input
              placeholder="Search creators by name, handle, category, or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 border-[#E3E8F2] dark:border-slate-700 bg-[#F9FAFD] dark:bg-slate-800/60 text-[#101828] dark:text-slate-100 text-xs rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[170px] h-10 border-[#E3E8F2] dark:border-slate-700 bg-[#F9FAFD] dark:bg-slate-800/60 text-xs rounded-xl font-medium">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="rounded-xl bg-white dark:bg-[#11172A]">
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="beauty">Beauty & Wellness</SelectItem>
                <SelectItem value="tech">Tech & Gaming</SelectItem>
                <SelectItem value="fashion">Fashion & Lifestyle</SelectItem>
                <SelectItem value="food">Food & Fitness</SelectItem>
              </SelectContent>
            </Select>

            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-full sm:w-[150px] h-10 border-[#E3E8F2] dark:border-slate-700 bg-[#F9FAFD] dark:bg-slate-800/60 text-xs rounded-xl font-medium">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent className="rounded-xl bg-white dark:bg-[#11172A]">
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 border-[#E3E8F2] dark:border-slate-700 rounded-xl cursor-pointer">
              <Filter className="h-4 w-4 text-[#667085]" />
            </Button>
          </div>
        </div>
      </div>

      {/* ─── 3. CREATOR MATCHING & EVALUATION CARDS ───────────────────────────── */}
      <div className="grid gap-4 w-full">
        {filteredCreators.map((creator) => {
          const match = calculateCreatorMatch(creator, DEFAULT_BRAND_PROFILE.creatorPreferences, 5000);
          const pricing = calculatePricingIntelligence(creator.followersCount, creator.engagementRate);
          const isSaved = shortlistedIds.includes(creator.id);

          return (
            <Card
              key={creator.id}
              className="rounded-[16px] bg-white dark:bg-[#11172A] border border-[#E3E8F2] dark:border-slate-800/90 shadow-xs hover:shadow-md transition-all overflow-hidden text-slate-900 dark:text-slate-100"
            >
              <CardContent className="p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border border-slate-200 dark:border-slate-700 shrink-0">
                      <AvatarImage src={creator.avatarUrl} />
                      <AvatarFallback className="bg-blue-100 dark:bg-blue-950 text-[#315CF5] font-extrabold text-sm">
                        {creator.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-base sm:text-lg font-bold text-[#101828] dark:text-slate-100">{creator.name}</h3>
                        <CheckCircle2 className="w-4 h-4 text-[#315CF5]" />
                      </div>
                      <p className="text-xs text-[#667085] dark:text-slate-400 font-mono">
                        {creator.handle} · <span className="font-semibold text-slate-700 dark:text-slate-300">{creator.category}</span>
                      </p>
                    </div>
                  </div>

                  {/* Creator Match Score Badge */}
                  <div className="flex items-center gap-3">
                    <Badge className="bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 text-xs font-extrabold px-3 py-1.5 rounded-full shadow-2xs">
                      ✦ {match.overallMatchScore}% Campaign Match
                    </Badge>
                    <button
                      type="button"
                      onClick={() => toggleShortlist(creator.id, creator.name)}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        isSaved
                          ? "bg-blue-50 border-blue-200 text-[#315CF5]"
                          : "border-[#E3E8F2] dark:border-slate-700 text-[#667085] hover:text-[#315CF5]"
                      }`}
                      title={isSaved ? "Saved to Shortlist" : "Save to Shortlist"}
                    >
                      <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-[#667085] dark:text-slate-300 leading-relaxed max-w-3xl">
                  {creator.bio}
                </p>

                {/* Match Reasons & Pricing Intelligence Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  
                  {/* Match Reasons Column */}
                  <div className="p-3.5 bg-[#F9FAFD] dark:bg-slate-800/50 rounded-xl border border-[#E3E8F2] dark:border-slate-700/60 space-y-1.5 text-xs">
                    <span className="font-bold text-[#98A2B3] dark:text-slate-500 uppercase tracking-wider text-[10px] font-mono block">
                      WHY THIS CREATOR MATCHES:
                    </span>
                    <ul className="space-y-1 text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">
                      {match.matchReasons.map((reason, i) => (
                        <li key={i}>{reason}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Pricing Intelligence Column */}
                  <div className="p-3.5 bg-[#F9FAFD] dark:bg-slate-800/50 rounded-xl border border-[#E3E8F2] dark:border-slate-700/60 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-[#98A2B3] dark:text-slate-500 uppercase tracking-wider text-[10px] font-mono block">
                        ESTIMATED RATE RANGE:
                      </span>
                      <p className="text-base font-black text-[#101828] dark:text-slate-100 mt-0.5">
                        ${pricing.comparableMarketRange.min.toLocaleString()} – ${pricing.comparableMarketRange.max.toLocaleString()}
                      </p>
                      <span className="text-[10px] text-[#667085] dark:text-slate-400 font-mono block">
                        Est. CPV: ${pricing.costPerViewEstimated} · Confidence: {pricing.pricingConfidence}
                      </span>
                    </div>

                    <Link href={`/influencers/${creator.id}`}>
                      <Button size="sm" className="h-8 px-3.5 rounded-xl bg-[#315CF5] hover:bg-blue-600 text-white font-bold text-xs cursor-pointer shadow-2xs">
                        Profile →
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
