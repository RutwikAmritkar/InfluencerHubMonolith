import { useGetInfluencer, getGetInfluencerQueryKey } from "@workspace/api-client-react";
import { Loader2, MapPin, ExternalLink, MessageSquare, Star, TrendingUp, Users, Eye, PlaySquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { SocialIcon, PLATFORM_CONFIGS, SocialPlatformId } from "@/components/social-icons";

// Realistic Fallback Influencer Details
const defaultInfluencerDetail = {
  id: 1,
  name: "Alex Rivera",
  category: "lifestyle",
  country: "United States",
  bio: "Full-time lifestyle and fashion content creator based in Los Angeles. Passionate about sustainable fashion, travel, and daily wellness.",
  followers: 125000,
  engagementRate: 4.2,
  avgViews: 85000,
  collaborationCost: 1500,
  isVerified: true,
  availability: "Available for Q3/Q4",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
  coverUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop",
  platforms: ["instagram", "tiktok", "youtube"],
  languages: ["English", "Spanish"],
  socialAccounts: [
    { platform: "instagram", username: "alexrivera", profileUrl: "https://instagram.com/alexrivera", status: "VERIFIED" },
    { platform: "tiktok", username: "alexrivera.official", profileUrl: "https://tiktok.com/@alexrivera.official", status: "VERIFIED" },
    { platform: "youtube", username: "alexriveravlogs", profileUrl: "https://youtube.com/c/alexriveravlogs", status: "CONNECTED" },
  ],
  portfolio: [
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600&auto=format&fit=crop",
  ],
  reviews: [
    { id: 1, brandName: "Glow Cosmetics", rating: 5, comment: "Alex was incredible to work with! Professional deliverables on time and exceeded our engagement targets.", createdAt: "2026-07-15" },
    { id: 2, brandName: "UrbanFit", rating: 5, comment: "High quality video production and strong audience conversion.", createdAt: "2026-06-20" },
  ],
  previousCollaborations: [
    { id: 1, brandName: "Glow Cosmetics", campaignTitle: "Summer Glow Launch", year: "2026" },
    { id: 2, brandName: "UrbanFit Apparel", campaignTitle: "Activewear Drop", year: "2025" },
  ]
};

export default function InfluencerDetail({ params }: { params: { id: string } }) {
  const parsedId = parseInt(params.id, 10);
  const id = isNaN(parsedId) ? 1 : parsedId;
  
  const { data: apiInfluencer, isLoading } = useGetInfluencer(id, {
    query: {
      enabled: !!id,
      queryKey: getGetInfluencerQueryKey(id),
    }
  });

  const influencer = apiInfluencer || (isLoading ? null : defaultInfluencerDetail);

  if (isLoading || !influencer) {
    return (
      <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#315BEF]" />
      </div>
    );
  }

  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < Math.floor(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
    ));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header Profile */}
      <div className="relative rounded-2xl overflow-hidden bg-white dark:bg-[#11172A] border border-slate-200/80 dark:border-slate-800 shadow-sm text-slate-900 dark:text-slate-100">
        <div className="h-48 md:h-64 bg-slate-100 dark:bg-slate-800 relative">
          {influencer.coverUrl ? (
            <img src={influencer.coverUrl} className="w-full h-full object-cover" alt="Cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-[#315BEF]/30 to-indigo-500/30 backdrop-blur-3xl"></div>
          )}
        </div>
        
        <div className="px-6 md:px-10 pb-8 flex flex-col md:flex-row gap-6 items-start md:items-end -mt-16 md:-mt-20 relative z-10">
          <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-white dark:border-[#11172A] shadow-xl rounded-2xl">
            <AvatarImage src={influencer.avatarUrl} className="object-cover rounded-2xl" />
            <AvatarFallback className="text-4xl font-bold bg-blue-100 dark:bg-blue-950 text-[#315BEF] dark:text-blue-400 rounded-2xl">{influencer.name.charAt(0)}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2 mb-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{influencer.name}</h1>
              {influencer.isVerified && (
                <div className="bg-[#315BEF] text-white rounded-full p-0.5 shadow-sm">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2m-1.9 14.7L6 12.6l1.5-1.5 2.6 2.6 6.4-6.4 1.5 1.5-7.9 7.9z"/></svg>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-3 text-slate-500 dark:text-slate-400 font-medium">
              <span className="capitalize text-slate-900 dark:text-slate-100">{influencer.category}</span>
              <span>•</span>
              <span className="flex items-center"><MapPin className="h-4 w-4 mr-1" /> {influencer.country}</span>
              {influencer.availability && (
                <>
                  <span>•</span>
                  <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 shadow-none font-bold">
                    {influencer.availability}
                  </Badge>
                </>
              )}
            </div>
          </div>
          
          <div className="flex w-full md:w-auto gap-3 shrink-0">
            <Button variant="outline" className="flex-1 md:flex-none font-bold rounded-xl" asChild>
              <Link href={`/messages?user=${influencer.id}`}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Message
              </Link>
            </Button>
            <Button className="flex-1 md:flex-none bg-[#315BEF] hover:bg-blue-600 font-bold rounded-xl shadow-md">
              Invite to Campaign
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Stats & Info */}
        <div className="space-y-6">
          <Card className="shadow-xs border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#11172A]">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-y-6">
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 flex items-center"><Users className="h-4 w-4 mr-1 text-[#315BEF]" /> Followers</div>
                  <div className="text-2xl font-black text-[#11182F] dark:text-slate-100">{(influencer.followers / 1000).toFixed(1)}k</div>
                </div>
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 flex items-center"><TrendingUp className="h-4 w-4 mr-1 text-emerald-600" /> Engagement</div>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{influencer.engagementRate}%</div>
                </div>
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 flex items-center"><Eye className="h-4 w-4 mr-1 text-indigo-600" /> Avg Views</div>
                  <div className="text-2xl font-black text-[#11182F] dark:text-slate-100">{(influencer.avgViews / 1000).toFixed(1)}k</div>
                </div>
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Starting at</div>
                  <div className="text-2xl font-black text-[#11182F] dark:text-slate-100">${influencer.collaborationCost}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xs border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#11172A]">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold">About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {influencer.bio || "No bio provided."}
              </p>
              
              {/* Social Media Accounts */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider font-mono mb-3 text-slate-400 dark:text-slate-500">Social Media</h4>
                {influencer.socialAccounts && influencer.socialAccounts.length > 0 ? (
                  <div className="space-y-2">
                    {influencer.socialAccounts.map((acc, i) => {
                      const cfg = PLATFORM_CONFIGS[(acc.platform.toLowerCase() as SocialPlatformId) || "other"] || PLATFORM_CONFIGS.other;
                      const handleDisplay = acc.username ? `@${acc.username}` : acc.profileUrl;

                      return (
                        <a
                          key={i}
                          href={acc.profileUrl || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-xs font-medium transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={cfg.color}>
                              <SocialIcon platform={acc.platform} className="w-4 h-4" />
                            </div>
                            <span className="text-slate-900 dark:text-slate-100 font-bold">{cfg.name}</span>
                            {acc.status === "VERIFIED" && (
                              <Badge className="bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 text-[10px] px-2 py-0.5 font-bold">
                                ✓ Verified
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 gap-1 font-mono">
                            <span className="truncate max-w-[120px]">{handleDisplay}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </div>
                        </a>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {influencer.platforms.map(p => (
                      <Badge key={p} variant="secondary" className="capitalize px-3 py-1 bg-slate-100 dark:bg-slate-800">
                        {p}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider font-mono mb-3 text-slate-400 dark:text-slate-500">Languages</h4>
                <div className="flex flex-wrap gap-2">
                  {influencer.languages.map(l => (
                    <Badge key={l} variant="outline" className="capitalize px-3 py-1 border-slate-200 dark:border-slate-800 font-semibold">
                      {l}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="portfolio" className="w-full">
            <TabsList className="w-full justify-start border-b border-slate-200 dark:border-slate-800 rounded-none h-auto p-0 bg-transparent mb-6">
              <TabsTrigger 
                value="portfolio" 
                className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-[#315BEF] data-[state=active]:text-[#315BEF] dark:data-[state=active]:text-blue-400 px-6 py-3 font-bold text-xs"
              >
                Portfolio
              </TabsTrigger>
              <TabsTrigger 
                value="reviews" 
                className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-[#315BEF] data-[state=active]:text-[#315BEF] dark:data-[state=active]:text-blue-400 px-6 py-3 font-bold text-xs"
              >
                Reviews
              </TabsTrigger>
              <TabsTrigger 
                value="collaborations" 
                className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-[#315BEF] data-[state=active]:text-[#315BEF] dark:data-[state=active]:text-blue-400 px-6 py-3 font-bold text-xs"
              >
                Past Collabs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="portfolio" className="mt-0 outline-none">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {influencer.portfolio && influencer.portfolio.length > 0 ? (
                  influencer.portfolio.map((img, i) => (
                    <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 group relative cursor-pointer border border-slate-200 dark:border-slate-800">
                      <img src={img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={`Portfolio ${i}`} />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <PlaySquare className="text-white h-8 w-8" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#11172A] border-dashed">
                    <p className="text-slate-500 dark:text-slate-400 text-xs">No portfolio items available.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-0 outline-none">
              <div className="space-y-4">
                {influencer.reviews && influencer.reviews.length > 0 ? (
                  influencer.reviews.map((review) => (
                    <Card key={review.id} className="shadow-xs border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#11172A]">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-bold text-base text-[#11182F] dark:text-slate-100">{review.brandName}</h4>
                            <div className="flex items-center gap-1 mt-1">
                              {renderStars(review.rating)}
                              <span className="text-xs text-slate-400 dark:text-slate-500 ml-2">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">
                          "{review.comment}"
                        </p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="py-12 text-center border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#11172A] border-dashed">
                    <Star className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500 dark:text-slate-400 text-xs">No reviews yet.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="collaborations" className="mt-0 outline-none">
              <div className="space-y-3">
                {influencer.previousCollaborations && influencer.previousCollaborations.length > 0 ? (
                  influencer.previousCollaborations.map((collab) => (
                    <div key={collab.id} className="flex items-center justify-between p-4 border border-slate-200/80 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#11172A]">
                      <div className="flex items-center gap-3.5">
                        <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-[#315BEF] dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                          {collab.brandName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-[#11182F] dark:text-slate-100">{collab.brandName}</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{collab.campaignTitle}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">{collab.year}</Badge>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#11172A] border-dashed">
                    <p className="text-slate-500 dark:text-slate-400 text-xs">No previous collaborations listed.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
