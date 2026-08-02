import { useState } from "react";
import { useListInfluencers } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Instagram, Youtube, Twitter, Filter, Loader2, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";

export default function Influencers() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [platform, setPlatform] = useState<string>("all");
  
  const debouncedSearch = useDebounce(search, 500);

  const { data: influencers, isLoading } = useListInfluencers({
    search: debouncedSearch || undefined,
    category: category !== "all" ? category : undefined,
    platform: platform !== "all" ? platform : undefined,
  });

  const PlatformIcon = ({ name }: { name: string }) => {
    switch (name.toLowerCase()) {
      case 'instagram': return <Instagram className="h-4 w-4" />;
      case 'youtube': return <Youtube className="h-4 w-4" />;
      case 'tiktok': return <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>;
      case 'twitter': return <Twitter className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Creator Discovery</h1>
          <p className="text-muted-foreground mt-1">Find the perfect match for your next campaign.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 p-4 bg-card border rounded-xl shadow-sm mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name, handle, or keyword..." 
              className="pl-9 h-11 border-none shadow-none focus-visible:ring-0 bg-transparent"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="hidden sm:block w-px bg-border my-2"></div>
          
          <div className="flex gap-2">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[140px] h-11 border-none shadow-none focus:ring-0 bg-transparent font-medium">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="lifestyle">Lifestyle</SelectItem>
                <SelectItem value="tech">Technology</SelectItem>
                <SelectItem value="beauty">Beauty & Fashion</SelectItem>
                <SelectItem value="gaming">Gaming</SelectItem>
                <SelectItem value="fitness">Fitness</SelectItem>
              </SelectContent>
            </Select>

            <div className="hidden sm:block w-px bg-border my-2"></div>

            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="w-[140px] h-11 border-none shadow-none focus:ring-0 bg-transparent font-medium">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" className="h-11 w-11 shrink-0">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : influencers?.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {influencers.map((influencer) => (
            <Link key={influencer.id} href={`/influencers/${influencer.id}`}>
              <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group h-full flex flex-col border-muted hover:border-primary/50">
                <div className="relative h-32 bg-muted overflow-hidden">
                  {influencer.coverUrl ? (
                    <img src={influencer.coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-primary/20 to-cyan-500/20"></div>
                  )}
                  {influencer.isVerified && (
                    <div className="absolute top-3 right-3 bg-white text-blue-500 rounded-full p-0.5 shadow-sm">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2m-1.9 14.7L6 12.6l1.5-1.5 2.6 2.6 6.4-6.4 1.5 1.5-7.9 7.9z"/></svg>
                    </div>
                  )}
                </div>
                <CardContent className="p-5 pt-0 relative flex-1 flex flex-col">
                  <Avatar className="h-20 w-20 border-4 border-card absolute -top-10 shadow-sm">
                    <AvatarImage src={influencer.avatarUrl} className="object-cover" />
                    <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">{influencer.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  
                  <div className="mt-12 flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{influencer.name}</h3>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                      <span className="capitalize font-medium text-foreground">{influencer.category}</span>
                      <span>•</span>
                      <span className="flex items-center"><MapPin className="h-3 w-3 mr-0.5" /> {influencer.country}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-muted/50 rounded-xl">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Followers</div>
                        <div className="font-bold">{(influencer.followers / 1000).toFixed(1)}k</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Engagement</div>
                        <div className="font-bold text-cyan-600">{influencer.engagementRate}%</div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {influencer.platforms.slice(0, 3).map(p => (
                        <Badge key={p} variant="secondary" className="h-7 w-7 p-0 flex items-center justify-center bg-background border shadow-sm">
                          <PlatformIcon name={p} />
                        </Badge>
                      ))}
                      {influencer.platforms.length > 3 && (
                        <Badge variant="secondary" className="h-7 px-2 bg-background border shadow-sm">
                          +{influencer.platforms.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-5 pt-4 border-t flex justify-between items-center text-sm">
                    <span className="font-medium">From ${influencer.collaborationCost}</span>
                    <span className="text-primary font-medium flex items-center group-hover:underline">
                      View Profile <ArrowUpRight className="ml-1 h-3 w-3" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-32 border border-dashed rounded-xl bg-muted/10">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-bold mb-1">No creators found</h3>
          <p className="text-muted-foreground">Try adjusting your filters or search terms.</p>
          <Button variant="outline" className="mt-4" onClick={() => { setSearch(""); setCategory("all"); setPlatform("all"); }}>
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  );
}
