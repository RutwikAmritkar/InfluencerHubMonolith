import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { formatCurrency } from "@/lib/formatters";
import {
  DEFAULT_BRAND_PROFILE,
  calculateCreatorMatch,
  calculatePricingIntelligence,
} from "@/services/brand-service";
import {
  Search,
  Filter,
  Sparkles,
  CheckCircle2,
  Bookmark,
  ArrowRight,
  TrendingUp,
  Instagram,
  Youtube,
  ShieldCheck,
  Film,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import { toast } from "sonner";

// Verified Indian Creator Roster Pool with Auditable Metrics
const CREATOR_CANDIDATES = [
  {
    id: 101,
    name: "Komal Pandey",
    handle: "@komalpandeyofficial",
    avatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop",
    category: "Fashion & Lifestyle",
    platform: "instagram",
    followersCount: 1900000,
    avgViews: "450K",
    engagementRate: 6.8,
    location: "Delhi NCR, India",
    bio: "Editorial fashion, experimental styling, and high-production Reels. Featured in Forbes 30 Under 30.",
    tier: "Tier 1 Elite",
    startingRate: 150000,
    deliverables: "Reels · Styling Haul · Carousel",
  },
  {
    id: 102,
    name: "Shlok Srivastava",
    handle: "@techburner",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop",
    category: "Tech & Gaming",
    platform: "youtube",
    followersCount: 4500000,
    avgViews: "1200K",
    engagementRate: 5.4,
    location: "Delhi NCR, India",
    bio: "Consumer tech reviews, flagship smartphone deep dives, gadget teardowns, and creator software showcases.",
    tier: "Tier 1 Elite",
    startingRate: 350000,
    deliverables: "Dedicated Video · Shorts",
  },
  {
    id: 103,
    name: "Ankush Bahuguna",
    handle: "@ankushbahuguna",
    avatarUrl:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=600&auto=format&fit=crop",
    category: "Beauty & Wellness",
    platform: "instagram",
    followersCount: 1300000,
    avgViews: "280K",
    engagementRate: 5.9,
    location: "Mumbai, India",
    bio: "Men's grooming, skincare routine teardowns, relatable comedy skits, and honest cosmetic reviews.",
    tier: "Tier 1 Elite",
    startingRate: 120000,
    deliverables: "Reels · Story Series",
  },
  {
    id: 104,
    name: "Maya Chen",
    handle: "@mayachen_tech",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=600&auto=format&fit=crop",
    category: "Tech & Gaming",
    platform: "instagram",
    followersCount: 285000,
    avgViews: "72K",
    engagementRate: 6.2,
    location: "Bengaluru, India",
    bio: "Developer tools, AI workflows, desk setup aesthetics, and consumer electronics reviews.",
    tier: "Tier 1 Elite",
    startingRate: 45000,
    deliverables: "IG Reel · Tech Carousel · Stories",
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

      const matchesCategory =
        categoryFilter === "all" || c.category.toLowerCase().includes(categoryFilter.toLowerCase());
      const matchesPlatform =
        platformFilter === "all" || c.platform.toLowerCase() === platformFilter.toLowerCase();

      return matchesSearch && matchesCategory && matchesPlatform;
    });
  }, [search, categoryFilter, platformFilter]);

  const toggleShortlist = (creatorId: number, name: string) => {
    if (shortlistedIds.includes(creatorId)) {
      setShortlistedIds((prev) => prev.filter((id) => id !== creatorId));
      toast.info(`Removed ${name} from saved shortlist.`);
    } else {
      setShortlistedIds((prev) => [...prev, creatorId]);
      toast.success(`Added ${name} to campaign shortlist!`);
    }
  };

  return (
    <div className="workspace-canvas space-y-8 pb-16 antialiased text-[#0A0A0A] dark:text-[#FAF9F6]">
      {/* ─── 1. EDITORIAL HEADER ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-[#E5E4DF] dark:border-white/10">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6A0D18] block mb-1">
            Verified Creator Roster
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0A0A0A] dark:text-white">
            Discover Verified{" "}
            <span className="font-serif italic font-normal text-[#6A0D18]">Media Kits</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#52525B] dark:text-slate-400 font-normal mt-1">
            Browse authenticated creator media kits with auditable audience velocity and verified
            rate card pricing.
          </p>
        </div>

        <Link href="/saved-creators">
          <Button
            variant="outline"
            size="sm"
            className="h-10 px-4 rounded-lg border-[#E5E4DF] dark:border-white/10 text-[#0A0A0A] dark:text-white font-semibold text-xs hover:bg-[#F2F1EC] dark:hover:bg-slate-800 cursor-pointer flex items-center gap-2 shadow-xs transition-colors"
          >
            <Bookmark className="w-3.5 h-3.5 text-[#6A0D18]" />
            <span>Shortlists ({shortlistedIds.length})</span>
          </Button>
        </Link>
      </div>

      {/* ─── 2. SEARCH & FILTER BAR (SINGLE HAIRLINE CONTAINER) ─────────────── */}
      <div className="bg-white dark:bg-[#11172A] border border-[#E5E4DF] dark:border-white/10 rounded-xl p-3 sm:p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#52525B]" />
            <Input
              placeholder="Search creators by name, handle, category, or audience niche..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 border-[#E5E4DF] dark:border-slate-700 bg-[#FAF9F6] dark:bg-slate-800/60 text-[#0A0A0A] dark:text-white text-xs rounded-lg focus:border-[#0A0A0A]"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[170px] h-10 border-[#E5E4DF] dark:border-slate-700 bg-[#FAF9F6] dark:bg-slate-800/60 text-xs rounded-lg font-medium text-[#0A0A0A] dark:text-white">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="rounded-xl glass-dropdown">
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="beauty">Beauty &amp; Wellness</SelectItem>
                <SelectItem value="tech">Tech &amp; Gaming</SelectItem>
                <SelectItem value="fashion">Fashion &amp; Lifestyle</SelectItem>
                <SelectItem value="food">Food &amp; Fitness</SelectItem>
              </SelectContent>
            </Select>

            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-full sm:w-[150px] h-10 border-[#E5E4DF] dark:border-slate-700 bg-[#FAF9F6] dark:bg-slate-800/60 text-xs rounded-lg font-medium text-[#0A0A0A] dark:text-white">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent className="rounded-xl glass-dropdown">
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0 border-[#E5E4DF] dark:border-slate-700 rounded-lg cursor-pointer hover:bg-[#F2F1EC]"
            >
              <Filter className="h-4 w-4 text-[#52525B]" />
            </Button>
          </div>
        </div>
      </div>

      {/* ─── 3. VERIFIED MEDIA KITS GRID ───────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6 w-full">
        {filteredCreators.map((creator) => {
          const match = calculateCreatorMatch(
            creator,
            DEFAULT_BRAND_PROFILE.creatorPreferences,
            5000
          );
          const isSaved = shortlistedIds.includes(creator.id);

          return (
            <div
              key={creator.id}
              className="bg-white dark:bg-[#11172A] border border-[#E5E4DF] dark:border-white/10 rounded-xl overflow-hidden shadow-xs hover:border-[#0A0A0A] transition-all flex flex-col justify-between group"
            >
              {/* TOP: 4:5 MEDIA KIT VISUAL HERO + IDENTITY OVERLAY */}
              <div className="relative aspect-[16/9] sm:aspect-[2/1] overflow-hidden bg-slate-950">
                <img
                  src={creator.avatarUrl}
                  alt={creator.name}
                  className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-500 opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20" />

                {/* Top Badges */}
                <div className="absolute top-3 inset-x-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-md text-[#0A0A0A] border border-white/60 shadow-xs">
                    {creator.platform === "youtube" ? (
                      <Youtube className="w-3.5 h-3.5 text-red-600" />
                    ) : (
                      <Instagram className="w-3.5 h-3.5 text-pink-600" />
                    )}
                    <span>{creator.category}</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => toggleShortlist(creator.id, creator.name)}
                    className={`h-8 w-8 rounded-full flex items-center justify-center backdrop-blur-md border transition-all cursor-pointer ${
                      isSaved
                        ? "bg-[#6A0D18] text-white border-[#A82830]"
                        : "bg-white/80 text-[#0A0A0A] border-white/60 hover:bg-white"
                    }`}
                    title={isSaved ? "Saved" : "Save to Shortlist"}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-current" : ""}`} />
                  </button>
                </div>

                {/* Bottom Overlay Title */}
                <div className="absolute bottom-3 inset-x-3 text-white space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-base font-bold tracking-tight text-white">
                      {creator.name}
                    </h3>
                    <CheckCircle2 className="w-4 h-4 text-[#6A0D18] fill-white" />
                  </div>
                  <p className="text-xs text-slate-300 font-medium">
                    {creator.handle} · {creator.location}
                  </p>
                </div>
              </div>

              {/* MIDDLE: NARRATIVE BIO */}
              <div className="p-5 space-y-3">
                <p className="text-xs text-[#52525B] dark:text-slate-300 leading-relaxed font-normal">
                  {creator.bio}
                </p>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[#52525B] font-medium">Deliverables:</span>
                  <span className="font-semibold text-[#0A0A0A] dark:text-white">
                    {creator.deliverables}
                  </span>
                </div>
              </div>

              {/* BOTTOM: 3-COLUMN HAIRLINE-DIVIDED LEDGER */}
              <div className="grid grid-cols-3 divide-x divide-[#E5E4DF] dark:divide-white/10 border-t border-[#E5E4DF] dark:border-white/10 bg-[#FAF9F6] dark:bg-slate-900/60 p-4 text-xs">
                <div>
                  <span className="text-[#52525B] block mb-0.5">Audience Reach</span>
                  <strong className="text-sm font-bold text-[#0A0A0A] dark:text-white font-tabular">
                    {creator.followersCount.toLocaleString()}
                  </strong>
                </div>
                <div className="pl-3">
                  <span className="text-[#52525B] block mb-0.5">Verified ER</span>
                  <strong className="text-sm font-bold text-[#059669] font-tabular">
                    {creator.engagementRate}%
                  </strong>
                </div>
                <div className="pl-3 text-right sm:text-left">
                  <span className="text-[#52525B] block mb-0.5">Starting Rate</span>
                  <strong className="text-sm font-bold text-[#0A0A0A] dark:text-white font-tabular">
                    {formatCurrency(creator.startingRate)}
                  </strong>
                </div>
              </div>

              {/* ACTION FOOTER */}
              <div className="p-4 border-t border-[#E5E4DF] dark:border-white/10 flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-[#059669] inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified Creator</span>
                </span>

                <Link href={`/influencers/${creator.id}`}>
                  <Button className="h-8 px-4 rounded-lg liquid-burgundy-metal text-xs font-semibold shadow-xs cursor-pointer inline-flex items-center gap-1.5 transition-all">
                    <span>View Media Kit</span>
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
