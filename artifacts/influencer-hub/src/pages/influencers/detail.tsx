import { useGetInfluencer, getGetInfluencerQueryKey } from "@workspace/api-client-react";
import { Loader2, MapPin, ExternalLink, MessageSquare, Star, TrendingUp, Users, Eye, PlaySquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";

export default function InfluencerDetail({ params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  
  const { data: influencer, isLoading } = useGetInfluencer(id, {
    query: {
      enabled: !!id,
      queryKey: getGetInfluencerQueryKey(id),
    }
  });

  if (isLoading || !influencer) {
    return (
      <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < Math.floor(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
    ));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header Profile */}
      <div className="relative rounded-2xl overflow-hidden bg-card border shadow-sm">
        <div className="h-48 md:h-64 bg-muted relative">
          {influencer.coverUrl ? (
            <img src={influencer.coverUrl} className="w-full h-full object-cover" alt="Cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-cyan-500/30 backdrop-blur-3xl"></div>
          )}
        </div>
        
        <div className="px-6 md:px-10 pb-8 flex flex-col md:flex-row gap-6 items-start md:items-end -mt-16 md:-mt-20 relative z-10">
          <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-card shadow-xl rounded-2xl">
            <AvatarImage src={influencer.avatarUrl} className="object-cover rounded-2xl" />
            <AvatarFallback className="text-4xl font-bold bg-primary/10 text-primary rounded-2xl">{influencer.name.charAt(0)}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2 mb-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{influencer.name}</h1>
              {influencer.isVerified && (
                <div className="bg-blue-500 text-white rounded-full p-0.5 shadow-sm">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2m-1.9 14.7L6 12.6l1.5-1.5 2.6 2.6 6.4-6.4 1.5 1.5-7.9 7.9z"/></svg>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-3 text-muted-foreground font-medium">
              <span className="capitalize text-foreground">{influencer.category}</span>
              <span>•</span>
              <span className="flex items-center"><MapPin className="h-4 w-4 mr-1" /> {influencer.country}</span>
              {influencer.availability && (
                <>
                  <span>•</span>
                  <Badge variant="outline" className="bg-teal-500/10 text-teal-600 border-teal-500/20 shadow-none">
                    {influencer.availability}
                  </Badge>
                </>
              )}
            </div>
          </div>
          
          <div className="flex w-full md:w-auto gap-3 shrink-0">
            <Button variant="outline" className="flex-1 md:flex-none" asChild>
              <Link href={`/messages?user=${influencer.id}`}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Message
              </Link>
            </Button>
            <Button className="flex-1 md:flex-none">
              Invite to Campaign
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Stats & Info */}
        <div className="space-y-6">
          <Card className="shadow-sm border-muted">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-y-6">
                <div>
                  <div className="text-sm text-muted-foreground mb-1 flex items-center"><Users className="h-4 w-4 mr-1" /> Followers</div>
                  <div className="text-2xl font-bold">{(influencer.followers / 1000).toFixed(1)}k</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1 flex items-center"><TrendingUp className="h-4 w-4 mr-1" /> Engagement</div>
                  <div className="text-2xl font-bold text-cyan-600">{influencer.engagementRate}%</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1 flex items-center"><Eye className="h-4 w-4 mr-1" /> Avg Views</div>
                  <div className="text-2xl font-bold">{(influencer.avgViews / 1000).toFixed(1)}k</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Starting at</div>
                  <div className="text-2xl font-bold">${influencer.collaborationCost}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-muted">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {influencer.bio || "No bio provided."}
              </p>
              
              <div>
                <h4 className="text-sm font-semibold mb-3 text-foreground">Platforms</h4>
                <div className="flex flex-wrap gap-2">
                  {influencer.platforms.map(p => (
                    <Badge key={p} variant="secondary" className="capitalize px-3 py-1 bg-muted">
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold mb-3 text-foreground">Languages</h4>
                <div className="flex flex-wrap gap-2">
                  {influencer.languages.map(l => (
                    <Badge key={l} variant="outline" className="capitalize px-3 py-1">
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
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent mb-6">
              <TabsTrigger 
                value="portfolio" 
                className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent px-6 py-3 font-medium"
              >
                Portfolio
              </TabsTrigger>
              <TabsTrigger 
                value="reviews" 
                className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent px-6 py-3 font-medium"
              >
                Reviews
              </TabsTrigger>
              <TabsTrigger 
                value="collaborations" 
                className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent px-6 py-3 font-medium"
              >
                Past Collabs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="portfolio" className="mt-0 outline-none">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {influencer.portfolio && influencer.portfolio.length > 0 ? (
                  influencer.portfolio.map((img, i) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden bg-muted group relative cursor-pointer border">
                      <img src={img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={`Portfolio ${i}`} />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <PlaySquare className="text-white h-8 w-8" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center border rounded-xl bg-muted/10 border-dashed">
                    <p className="text-muted-foreground">No portfolio items available.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-0 outline-none">
              <div className="space-y-4">
                {influencer.reviews && influencer.reviews.length > 0 ? (
                  influencer.reviews.map((review) => (
                    <Card key={review.id} className="shadow-none border-muted bg-card">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-bold text-base">{review.brandName}</h4>
                            <div className="flex items-center gap-1 mt-1">
                              {renderStars(review.rating)}
                              <span className="text-xs text-muted-foreground ml-2">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-foreground/80 leading-relaxed italic">
                          "{review.comment}"
                        </p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="py-12 text-center border rounded-xl bg-muted/10 border-dashed">
                    <Star className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-20" />
                    <p className="text-muted-foreground">No reviews yet.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="collaborations" className="mt-0 outline-none">
              <div className="space-y-4">
                {influencer.previousCollaborations && influencer.previousCollaborations.length > 0 ? (
                  influencer.previousCollaborations.map((collab) => (
                    <div key={collab.id} className="flex items-center justify-between p-4 border rounded-xl bg-card">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center font-bold text-muted-foreground">
                          {collab.brandName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm">{collab.brandName}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">{collab.campaignTitle}</p>
                        </div>
                      </div>
                      <Badge variant="secondary">{collab.year}</Badge>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center border rounded-xl bg-muted/10 border-dashed">
                    <p className="text-muted-foreground">No previous collaborations listed.</p>
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
