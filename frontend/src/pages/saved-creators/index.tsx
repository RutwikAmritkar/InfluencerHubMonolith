import { useState } from "react";
import { DEFAULT_CAMPAIGN_SHORTLISTS } from "@/services/brand-service";
import { formatCurrency } from "@/lib/formatters";
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
  ShieldCheck,
  TrendingUp,
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
    <div className="space-y-8 w-full pb-16 text-[#0A0A0A]">
      {/* ─── 1. EDITORIAL HEADER ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-4 border-b border-[#E5E4DF] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.03em] text-[#0A0A0A]">
            Curated <span className="font-serif italic font-normal">Shortlists</span>
          </h1>
          <p className="text-xs text-[#52525B] mt-1">
            Audited creator rosters prepared for multi-milestone campaign brief dispatch.
          </p>
        </div>

        <Button
          onClick={handleCreateShortlist}
          className="liquid-burgundy-metal font-semibold text-xs rounded-lg h-9 px-4 cursor-pointer shadow-xs flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-white" />
          <span>New Roster Shortlist</span>
        </Button>
      </div>

      {/* ─── 2. ACTIVE SHORTLIST CONTAINER ─────────────────────────────────── */}
      {activeShortlist && activeShortlist.creators.length > 0 ? (
        <div className="space-y-4">
          <div className="p-4 bg-white border border-[#E5E4DF] rounded-xl shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#0A0A0A] tracking-[-0.02em]">
                  {activeShortlist.title}
                </h2>
                <Badge className="bg-[#FAF9F6] text-[#52525B] border border-[#E5E4DF] text-xs font-semibold px-2 py-0.5 rounded-full">
                  Verified Tier
                </Badge>
              </div>
              <p className="text-xs text-[#52525B] mt-0.5">{activeShortlist.description}</p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF9F6] border border-[#E5E4DF] text-xs font-semibold text-[#0A0A0A] font-tabular">
              <Users className="w-3.5 h-3.5 text-[#6A0D18]" />
              <span>{activeShortlist.creators.length} Creators Shortlisted</span>
            </div>
          </div>

          <div className="grid gap-4 w-full">
            {activeShortlist.creators.map((item) => (
              <div
                key={item.creatorId}
                className="rounded-xl bg-white border border-[#E5E4DF] shadow-xs p-5 sm:p-6 space-y-4 hover:border-[#0A0A0A]/30 transition-colors"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E5E4DF] pb-4">
                  <div className="flex items-center gap-3.5">
                    <Avatar className="h-11 w-11 border border-[#E5E4DF] shrink-0">
                      <AvatarImage src={item.avatarUrl} />
                      <AvatarFallback className="bg-[#FAF9F6] text-[#0A0A0A] font-bold text-xs">
                        {item.creatorName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Link href={`/influencers/${item.creatorId}`}>
                          <h3 className="text-base font-bold text-[#0A0A0A] hover:text-[#6A0D18] transition-colors cursor-pointer">
                            {item.creatorName}
                          </h3>
                        </Link>
                        <CheckCircle2 className="w-4 h-4 text-[#6A0D18]" />
                      </div>
                      <p className="text-xs text-[#52525B]">
                        {item.creatorHandle} ·{" "}
                        <span className="font-semibold text-[#0A0A0A]">{item.category}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Badge className="bg-[#059669]/10 text-[#059669] border border-[#059669]/20 text-xs font-semibold px-2.5 py-0.5 rounded-full font-tabular">
                      {item.matchBreakdown.overallMatchScore}% Audience Match
                    </Badge>
                    <Badge className="bg-[#FAF9F6] text-[#52525B] border border-[#E5E4DF] text-xs font-medium px-2.5 py-0.5 rounded-full capitalize">
                      {item.status}
                    </Badge>
                  </div>
                </div>

                {/* Asking Rate Ledger & Actions */}
                <div className="py-3 px-4 bg-[#FAF9F6] rounded-lg border border-[#E5E4DF] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-xs text-[#52525B] font-medium block">
                      Creator Asking Rate / Comparable Market Range
                    </span>
                    <p className="text-sm font-extrabold text-[#0A0A0A] mt-0.5 font-tabular">
                      {item.pricing.creatorAskingRate != null
                        ? formatCurrency(item.pricing.creatorAskingRate)
                        : ""}{" "}
                      <span className="text-xs font-normal text-[#52525B]">
                        ({formatCurrency(item.pricing.comparableMarketRange.min)} –{" "}
                        {formatCurrency(item.pricing.comparableMarketRange.max)})
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href="/messages">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 rounded-lg border-[#E5E4DF] text-[#0A0A0A] font-semibold text-xs hover:bg-white cursor-pointer flex items-center gap-1.5 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-[#52525B]" />
                        <span>Message</span>
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      className="h-8 px-3.5 rounded-lg liquid-burgundy-metal text-xs font-semibold cursor-pointer shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5 text-white" />
                      <span>Invite to Campaign</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-[#E5E4DF] rounded-xl bg-white w-full">
          <Bookmark className="h-8 w-8 text-[#52525B]/40 mx-auto mb-2.5" />
          <h3 className="text-sm font-bold text-[#0A0A0A] mb-1">No shortlisted creators yet</h3>
          <p className="text-xs text-[#52525B] mb-4">
            Search verified media kits and add candidate talent to your shortlist roster.
          </p>
          <Link href="/find-creators">
            <Button className="h-9 px-4 liquid-burgundy-metal text-xs font-semibold rounded-lg shadow-xs cursor-pointer transition-colors">
              Discover Creators
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
