import { useGetAiSuggestions, useGetInfluencerMatches } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, ArrowRight, Loader2, Search, Bot } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export default function AiAssistant() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const { data: suggestions, isLoading: suggLoading } = useGetAiSuggestions();

  // If brand searches, simulate a match query (just for visual representation here)
  const { data: matches, isLoading: matchesLoading } = useGetInfluencerMatches({ campaignId: 1 }, { 
    query: { enabled: hasSearched && user?.role === 'brand' } 
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setHasSearched(true);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col items-center text-center py-8">
        <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">InfluencerHub AI</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          {user?.role === "brand" 
            ? "Describe your ideal campaign or audience, and our AI will find the perfect creators."
            : "Get AI-powered insights on how to optimize your profile and pitch to brands."}
        </p>

        <form onSubmit={handleSearch} className="w-full max-w-2xl mt-8 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={user?.role === "brand" ? "e.g. Find me Gen Z lifestyle creators in NY under $5k..." : "How can I improve my bio for tech brands?"}
            className="w-full h-14 pl-12 pr-32 rounded-full shadow-sm border-primary/20 text-base"
          />
          <Button type="submit" className="absolute right-2 top-2 bottom-2 rounded-full px-6">
            Generate
          </Button>
        </form>
      </div>

      {!hasSearched ? (
        <div className="grid md:grid-cols-3 gap-6 pt-8">
          {suggLoading ? (
            <div className="col-span-3 flex justify-center py-12"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>
          ) : suggestions?.map((sugg) => (
            <Card key={sugg.id} className="bg-card hover:border-primary/50 transition-colors cursor-pointer group shadow-sm border-muted">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">{sugg.type}</Badge>
                  <span className="text-xs font-medium text-muted-foreground">{sugg.confidence}% Match</span>
                </div>
                <h3 className="font-bold mb-2 group-hover:text-primary transition-colors">{sugg.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{sugg.body}</p>
                <div className="flex items-center text-sm font-medium text-primary">
                  {sugg.action} <ArrowRight className="ml-1 h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-card border rounded-2xl p-6 shadow-sm">
          <div className="flex items-start gap-4 mb-8">
            <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center text-white shrink-0 mt-1">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">Here's what I found for you:</h3>
              <p className="text-muted-foreground mb-6">
                Based on your criteria, I've analyzed our creator database. These profiles have the highest demographic overlap and engagement metrics for your requirements.
              </p>
              
              {matchesLoading ? (
                <div className="py-8 flex items-center gap-3 text-muted-foreground"><Loader2 className="animate-spin h-5 w-5" /> Analyzing profiles...</div>
              ) : matches?.length ? (
                <div className="space-y-4">
                  {matches.map((match, i) => (
                    <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-xl gap-4 bg-muted/20 hover:bg-muted/40 transition-colors">
                      <div className="flex items-center gap-4">
                        <img src={match.influencer.avatarUrl} className="h-12 w-12 rounded-full border" />
                        <div>
                          <h4 className="font-bold">{match.influencer.name}</h4>
                          <p className="text-sm text-muted-foreground capitalize">{match.influencer.category} • {(match.influencer.followers/1000).toFixed(1)}k followers</p>
                        </div>
                      </div>
                      <div className="flex-1 max-w-sm">
                        <div className="text-xs space-y-1">
                          {match.matchReasons.map((reason, j) => (
                            <div key={j} className="flex items-center gap-2 text-teal-600">
                              <div className="h-1.5 w-1.5 rounded-full bg-teal-500 shrink-0" />
                              <span className="truncate">{reason}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-lg font-bold text-primary">{match.matchScore}% Match</div>
                        <Button variant="link" size="sm" className="p-0 h-auto">View Profile</Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground italic">No specific matches found. Try broadening your criteria.</p>
              )}
            </div>
          </div>
          <div className="border-t pt-4">
            <Button variant="outline" onClick={() => { setQuery(""); setHasSearched(false); }}>Ask another question</Button>
          </div>
        </div>
      )}
    </div>
  );
}
