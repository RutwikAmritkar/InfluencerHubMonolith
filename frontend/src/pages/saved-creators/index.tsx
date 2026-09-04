import { useState } from "react";
import { DEFAULT_CAMPAIGN_SHORTLISTS } from "@/services/brand-service";
import { CampaignShortlist } from "@/types/creator-discovery";
import { 
  Bookmark, 
  Users, 
  DollarSign, 
  ExternalLink, 
  Send, 
  CheckCircle2, 
  Plus, 
  MessageSquare,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import { toast } from "sonner";

export default function SavedCreatorsPage() {
  const [shortlists, setShortlists] = useState<CampaignShortlist[]>(DEFAULT_CAMPAIGN_SHORTLISTS);
  const activeShortlist = shortlists[0];

  const handleCreateShortlist = () => {
    toast.info("New shortlist creator dialog ready.");
  };

  return (
    <div className="space-y-8 w-full pb-16 text-slate-900 dark:text-slate-100">
      
      {/* ─── 1. HEADER ROW ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#101828] dark:text-slate-100">
              Saved Creators & Shortlists
            </h1>
            <Badge className="bg-blue-50 dark:bg-blue-950/80 text-[#315CF5] dark:text-blue-400 border border-blue-200 text-[10px] font-bold">
              Brand Shortlist Domain
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#667085] dark:text-slate-400 font-medium mt-0.5">
            Organize shortlisted creators into campaign rosters, compare pricing ranges, and invite to active campaigns.
          </p>
        </div>

        <Button onClick={handleCreateShortlist} className="bg-[#315CF5] hover:bg-blue-600 text-white font-bold text-xs rounded-xl h-9 px-4 cursor-pointer shadow-xs flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          <span>New Shortlist</span>
        </Button>
      </div>

      {/* ─── 2. ACTIVE SHORTLIST CONTAINER ─────────────────────────────────── */}
      {activeShortlist && activeShortlist.creators.length > 0 ? (
        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-[#11172A] border border-[#E3E8F2] dark:border-slate-800/90 rounded-[16px] shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#101828] dark:text-slate-100">{activeShortlist.title}</h2>
              <p className="text-xs text-[#667085] dark:text-slate-400 font-medium">{activeShortlist.description}</p>
            </div>
            <Badge variant="outline" className="text-xs font-bold font-mono">
              {activeShortlist.creators.length} Creator Shortlisted
            </Badge>
          </div>

          <div className="grid gap-4 w-full">
            {activeShortlist.creators.map((item) => (
              <Card key={item.creatorId} className="rounded-[16px] bg-white dark:bg-[#11172A] border border-[#E3E8F2] dark:border-slate-800/90 shadow-xs">
                <CardContent className="p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 border border-slate-200 dark:border-slate-700 shrink-0">
                        <AvatarImage src={item.avatarUrl} />
                        <AvatarFallback className="bg-blue-100 text-[#315CF5] font-extrabold text-sm">
                          {item.creatorName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-base sm:text-lg font-bold text-[#101828] dark:text-slate-100">{item.creatorName}</h3>
                          <CheckCircle2 className="w-4 h-4 text-[#315CF5]" />
                        </div>
                        <p className="text-xs text-[#667085] dark:text-slate-400 font-mono">
                          {item.creatorHandle} · <span className="font-semibold text-slate-700 dark:text-slate-300">{item.category}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-extrabold px-3 py-1 rounded-full">
                        ✦ {item.matchBreakdown.overallMatchScore}% Match
                      </Badge>
                      <Badge className="bg-blue-50 text-[#315CF5] border-blue-200 text-xs font-bold capitalize px-3 py-1 rounded-full">
                        Status: {item.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-3.5 bg-[#F9FAFD] dark:bg-slate-800/50 rounded-xl border border-[#E3E8F2] dark:border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold text-[#98A2B3] dark:text-slate-500 uppercase tracking-wider text-[10px] font-mono block">
                        CREATOR ASKING RATE / RECOMMENDED RANGE:
                      </span>
                      <p className="text-base font-black text-[#101828] dark:text-slate-100 mt-0.5">
                        ${item.pricing.creatorAskingRate?.toLocaleString()} (${item.pricing.comparableMarketRange.min.toLocaleString()} – ${item.pricing.comparableMarketRange.max.toLocaleString()})
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link href="/messages">
                        <Button variant="outline" size="sm" className="h-8 px-3.5 rounded-xl border-[#E3E8F2] dark:border-slate-700 text-[#101828] dark:text-slate-200 font-bold text-xs hover:bg-[#F2F5FF] cursor-pointer flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Message</span>
                        </Button>
                      </Link>
                      <Button size="sm" className="h-8 px-3.5 rounded-xl bg-[#315CF5] hover:bg-blue-600 text-white font-bold text-xs cursor-pointer shadow-2xs flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5" />
                        <span>Invite to Campaign</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-[#E3E8F2] dark:border-slate-800 rounded-[16px] bg-white dark:bg-[#11172A] w-full">
          <Bookmark className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#101828] dark:text-slate-100 mb-1">No shortlisted creators yet</h3>
          <p className="text-xs text-[#667085] dark:text-slate-400 mb-4">Search and add candidate creators to your shortlist roster.</p>
          <Link href="/find-creators">
            <Button className="h-9 px-4 bg-[#315CF5] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer">
              Find Creators & Build Roster →
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
