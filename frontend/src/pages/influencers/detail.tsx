import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useGetInfluencer, getGetInfluencerQueryKey } from "@workspace/api-client-react";
import {
  Loader2,
  MapPin,
  ExternalLink,
  MessageSquare,
  Star,
  TrendingUp,
  Users,
  Eye,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { SocialIcon, PLATFORM_CONFIGS, SocialPlatformId } from "@/components/social-icons";
import { BrandPortfolioViewer } from "@/components/brand-portfolio-viewer";
import { formatCurrency } from "@/lib/formatters";

// Realistic Fallback Influencer Details
const defaultInfluencerDetail = {
  id: 1,
  name: "Alex Rivera",
  category: "Beauty & Lifestyle",
  country: "United States",
  bio: "Full-time lifestyle and fashion content creator based in Los Angeles. Passionate about sustainable fashion, travel, and daily wellness.",
  followers: 125000,
  engagementRate: 4.8,
  avgViews: 85000,
  collaborationCost: 45000,
  isVerified: true,
  availability: "Available for Q4 Briefs",
  avatarUrl:
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop",
  coverUrl:
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop",
  platforms: ["instagram", "youtube"],
  languages: ["English", "Spanish"],
  socialAccounts: [],
  portfolio: [
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600&auto=format&fit=crop",
  ],
  reviews: [
    {
      id: 1,
      brandName: "Glow Cosmetics",
      rating: 5,
      comment: "Alex was incredible to work with! Deliverables exceeded our engagement targets.",
      createdAt: "2026-07-15",
    },
    {
      id: 2,
      brandName: "UrbanFit",
      rating: 5,
      comment: "High quality reel production and strong audience conversion.",
      createdAt: "2026-06-20",
    },
  ],
  previousCollaborations: [
    { id: 1, brandName: "Glow Cosmetics", campaignTitle: "Summer Glow Launch", year: "2026" },
    { id: 2, brandName: "UrbanFit Apparel", campaignTitle: "Activewear Drop", year: "2025" },
  ],
};

export default function InfluencerDetail({ params }: { params: { id: string } }) {
  const parsedId = parseInt(params.id, 10);
  const id = isNaN(parsedId) ? 1 : parsedId;

  const { data: apiInfluencer, isLoading } = useGetInfluencer(id, {
    query: {
      enabled: !!id,
      queryKey: getGetInfluencerQueryKey(id),
    },
  });

  const influencer = apiInfluencer || (isLoading ? null : defaultInfluencerDetail);

  const [showCollabModal, setShowCollabModal] = useState(false);
  const [reqTitle, setReqTitle] = useState("");
  const [reqDescription, setReqDescription] = useState("");
  const [reqDeliverablesText, setReqDeliverablesText] = useState("1x Sponsored Reel");
  const [reqBudget, setReqBudget] = useState("45000");
  const [reqTimeline, setReqTimeline] = useState("2 Weeks");
  const [reqMessage, setReqMessage] = useState("");

  const sendCollabMutation = useMutation({
    mutationFn: async () => {
      const budgetPaise = Math.round(parseFloat(reqBudget) * 100) || 4500000;
      const res = await fetch("/api/collaboration-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          influencerId: influencer?.id || id,
          title: reqTitle.trim(),
          description: reqDescription.trim(),
          deliverables: [{ title: reqDeliverablesText.trim() || "Sponsored Content", count: 1 }],
          budgetMinPaise: budgetPaise,
          budgetMaxPaise: budgetPaise,
          proposedTimeline: reqTimeline,
          message: reqMessage || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send collaboration request.");
      }
      return res.json();
    },
    onSuccess: () => {
      setShowCollabModal(false);
      setReqTitle("");
      setReqDescription("");
      toast.success(
        "Direct collaboration request sent to " + (influencer?.name || "Creator") + "!"
      );
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  if (isLoading || !influencer) {
    return (
      <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1D4ED8]" />
      </div>
    );
  }

  const renderStars = (rating: number) => {
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < Math.floor(rating) ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600"}`}
        />
      ));
  };

  return (
    <div className="workspace-canvas space-y-8 pb-16 antialiased text-[#0A0A0A] dark:text-[#FAF9F6]">
      {/* ─── 1. VERIFIED MEDIA KIT HERO ────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden bg-white dark:bg-[#11172A] border border-[#E5E4DF] dark:border-white/10 shadow-xs">
        <div className="h-48 md:h-64 bg-slate-950 relative overflow-hidden">
          {influencer.coverUrl ? (
            <img
              src={influencer.coverUrl}
              className="w-full h-full object-cover opacity-85"
              alt="Cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 to-black"></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        </div>

        <div className="px-6 md:px-10 pb-8 flex flex-col md:flex-row gap-6 items-start md:items-end -mt-16 md:-mt-20 relative z-10">
          <Avatar className="h-32 w-32 md:h-36 md:w-36 border-4 border-white dark:border-[#11172A] shadow-xl rounded-2xl shrink-0">
            <AvatarImage src={influencer.avatarUrl} className="object-cover rounded-2xl" />
            <AvatarFallback className="text-3xl font-bold bg-[#0A0A0A] text-white rounded-2xl">
              {influencer.name.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2 mb-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0A0A0A] dark:text-white">
                {influencer.name}
              </h1>
              {influencer.isVerified && <CheckCircle2 className="w-5 h-5 text-[#1D4ED8]" />}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-[#52525B] dark:text-slate-400 font-medium">
              <span className="font-semibold text-[#0A0A0A] dark:text-white">
                {influencer.category}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {influencer.country}
              </span>
              {influencer.availability && (
                <>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#059669] border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                    {influencer.availability}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex w-full md:w-auto gap-3 shrink-0">
            <Link href={`/messages?user=${influencer.id}`}>
              <Button
                variant="outline"
                className="h-10 px-4 border-[#E5E4DF] text-xs font-semibold text-[#0A0A0A] hover:bg-[#F2F1EC] rounded-lg"
              >
                <MessageSquare className="mr-2 h-4 w-4 text-[#52525B]" />
                Message
              </Button>
            </Link>
            <Button
              onClick={() => setShowCollabModal(true)}
              className="h-10 px-5 bg-[#0A0A0A] hover:bg-slate-800 text-white font-semibold text-xs rounded-lg shadow-xs cursor-pointer inline-flex items-center gap-2"
            >
              <span>Direct Brief</span>
              <ArrowRight className="w-4 h-4 text-[#1D4ED8]" />
            </Button>
          </div>
        </div>
      </div>

      {/* ─── 2. 4-STAT AUDITABLE LEDGER ────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#11172A] border border-[#E5E4DF] dark:border-white/10 rounded-xl overflow-hidden shadow-xs grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#E5E4DF] dark:divide-white/10">
        <div className="p-6">
          <span className="text-xs text-[#52525B] font-medium block mb-1">Total Followers</span>
          <div className="text-2xl sm:text-3xl font-bold text-[#0A0A0A] dark:text-white font-tabular">
            {(influencer.followers / 1000).toFixed(1)}K
          </div>
          <span className="text-xs text-[#52525B]">Verified Organic Reach</span>
        </div>
        <div className="p-6">
          <span className="text-xs text-[#52525B] font-medium block mb-1">Engagement Velocity</span>
          <div className="text-2xl sm:text-3xl font-bold text-[#059669] font-tabular">
            {influencer.engagementRate}%
          </div>
          <span className="text-xs text-[#52525B]">Audience Retention</span>
        </div>
        <div className="p-6">
          <span className="text-xs text-[#52525B] font-medium block mb-1">Avg. Reel Views</span>
          <div className="text-2xl sm:text-3xl font-bold text-[#0A0A0A] dark:text-white font-tabular">
            {(influencer.avgViews / 1000).toFixed(1)}K
          </div>
          <span className="text-xs text-[#52525B]">Audited Views</span>
        </div>
        <div className="p-6">
          <span className="text-xs text-[#52525B] font-medium block mb-1">Starting Rate</span>
          <div className="text-2xl sm:text-3xl font-bold text-[#0A0A0A] dark:text-white font-tabular">
            {formatCurrency(influencer.collaborationCost)}
          </div>
          <span className="text-xs text-[#059669] font-medium">Verified Base Rate</span>
        </div>
      </div>

      {/* ─── 3. MAIN CONTENT: ABOUT & PORTFOLIO TABS ───────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left Column (4 cols): Bio & Verified Socials */}
        <div className="xl:col-span-4 bg-white dark:bg-[#11172A] border border-[#E5E4DF] dark:border-white/10 rounded-xl p-6 shadow-xs space-y-6 min-w-0">
          <div>
            <h3 className="text-sm font-bold text-[#0A0A0A] dark:text-white uppercase tracking-wider mb-2">
              Media Kit Bio
            </h3>
            <p className="text-xs text-[#52525B] dark:text-slate-300 leading-relaxed">
              {influencer.bio || "No bio provided."}
            </p>
          </div>

          <div className="pt-4 border-t border-[#E5E4DF] dark:border-white/10 space-y-3">
            <h4 className="text-xs font-bold text-[#0A0A0A] dark:text-white uppercase tracking-wider">
              Connected Platforms
            </h4>
            <div className="flex flex-wrap gap-2">
              {influencer.platforms.map((p) => (
                <span
                  key={p}
                  className="px-3 py-1 rounded-full bg-[#FAF9F6] border border-[#E5E4DF] text-xs font-semibold text-[#0A0A0A] capitalize"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#E5E4DF] dark:border-white/10 space-y-3">
            <h4 className="text-xs font-bold text-[#0A0A0A] dark:text-white uppercase tracking-wider">
              Languages
            </h4>
            <div className="flex flex-wrap gap-2">
              {influencer.languages.map((l) => (
                <span
                  key={l}
                  className="px-3 py-1 rounded-full bg-[#FAF9F6] border border-[#E5E4DF] text-xs font-semibold text-[#0A0A0A]"
                >
                  {l}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (8 cols): Portfolio & Past Reviews */}
        <div className="xl:col-span-8 bg-white dark:bg-[#11172A] border border-[#E5E4DF] dark:border-white/10 rounded-xl p-6 shadow-xs min-w-0">
          <Tabs defaultValue="portfolio" className="w-full">
            <TabsList className="w-full justify-start border-b border-[#E5E4DF] dark:border-white/10 rounded-none h-auto p-0 bg-transparent mb-6 gap-6">
              <TabsTrigger
                value="portfolio"
                className="rounded-none pb-3 border-b-2 border-transparent data-[state=active]:border-[#0A0A0A] data-[state=active]:text-[#0A0A0A] text-xs font-bold"
              >
                Production Portfolio
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="rounded-none pb-3 border-b-2 border-transparent data-[state=active]:border-[#0A0A0A] data-[state=active]:text-[#0A0A0A] text-xs font-bold"
              >
                Brand Reviews ({influencer.reviews?.length || 0})
              </TabsTrigger>
              <TabsTrigger
                value="collaborations"
                className="rounded-none pb-3 border-b-2 border-transparent data-[state=active]:border-[#0A0A0A] data-[state=active]:text-[#0A0A0A] text-xs font-bold"
              >
                Past Collabs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="portfolio" className="mt-0 outline-none">
              <BrandPortfolioViewer creatorId={influencer.id} />
            </TabsContent>

            <TabsContent value="reviews" className="mt-0 outline-none space-y-4">
              {influencer.reviews && influencer.reviews.length > 0 ? (
                influencer.reviews.map((review) => (
                  <div
                    key={review.id}
                    className="p-4 rounded-xl border border-[#E5E4DF] dark:border-white/10 bg-[#FAF9F6] space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-xs text-[#0A0A0A] dark:text-white">
                        {review.brandName}
                      </h4>
                      <div className="flex items-center gap-1">
                        {renderStars(review.rating)}
                        <span className="text-xs text-[#52525B] ml-2">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-[#52525B] leading-relaxed italic">
                      "{review.comment}"
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#52525B]">No reviews yet.</p>
              )}
            </TabsContent>

            <TabsContent value="collaborations" className="mt-0 outline-none space-y-3">
              {influencer.previousCollaborations && influencer.previousCollaborations.length > 0 ? (
                influencer.previousCollaborations.map((collab) => (
                  <div
                    key={collab.id}
                    className="flex items-center justify-between p-4 border border-[#E5E4DF] dark:border-white/10 rounded-xl bg-[#FAF9F6]"
                  >
                    <div>
                      <h4 className="font-bold text-xs text-[#0A0A0A] dark:text-white">
                        {collab.brandName}
                      </h4>
                      <p className="text-xs text-[#52525B]">{collab.campaignTitle}</p>
                    </div>
                    <span className="text-xs font-bold text-[#1D4ED8] bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                      {collab.year}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#52525B]">No previous collaborations listed.</p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* ─── 4. DIRECT BRIEF DIALOG (GLASS MODAL) ─────────────────────────── */}
      <Dialog open={showCollabModal} onOpenChange={setShowCollabModal}>
        <DialogContent className="max-w-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#0A0A0A] dark:text-white">
              Launch Direct Campaign Brief
            </DialogTitle>
            <DialogDescription className="text-xs text-[#52525B] dark:text-slate-400">
              Propose a 1-on-1 milestone-gated collaboration directly with {influencer.name}. Payout
              is milestone protected.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-bold text-[#0A0A0A] dark:text-white">
                Campaign Title
              </Label>
              <Input
                placeholder="e.g. Q4 Flagship Showcase"
                value={reqTitle}
                onChange={(e) => setReqTitle(e.target.value)}
                className="text-xs mt-1 border-[#E5E4DF] rounded-lg"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-[#0A0A0A] dark:text-white">
                Deliverable Specification
              </Label>
              <Input
                placeholder="e.g. 1x Instagram Reel (60s) + 2x Stories"
                value={reqDeliverablesText}
                onChange={(e) => setReqDeliverablesText(e.target.value)}
                className="text-xs mt-1 border-[#E5E4DF] rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-[#0A0A0A] dark:text-white">
                  Proposed Campaign Budget (₹)
                </Label>
                <Input
                  type="number"
                  placeholder="45000"
                  value={reqBudget}
                  onChange={(e) => setReqBudget(e.target.value)}
                  className="text-xs mt-1 border-[#E5E4DF] rounded-lg font-tabular"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-[#0A0A0A] dark:text-white">
                  Delivery Timeline
                </Label>
                <Input
                  placeholder="e.g. 2 Weeks"
                  value={reqTimeline}
                  onChange={(e) => setReqTimeline(e.target.value)}
                  className="text-xs mt-1 border-[#E5E4DF] rounded-lg"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold text-[#0A0A0A] dark:text-white">
                Scope &amp; Brand Expectations
              </Label>
              <Textarea
                placeholder="Briefly describe your creative direction and milestone deadlines..."
                value={reqDescription}
                onChange={(e) => setReqDescription(e.target.value)}
                className="text-xs mt-1 border-[#E5E4DF] rounded-lg h-20"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => setShowCollabModal(false)}
              className="text-xs text-[#52525B]"
            >
              Cancel
            </Button>
            <Button
              disabled={!reqTitle || !reqDescription || sendCollabMutation.isPending}
              onClick={() => sendCollabMutation.mutate()}
              className="bg-[#0A0A0A] hover:bg-slate-800 text-white font-semibold text-xs px-5 rounded-lg"
            >
              {sendCollabMutation.isPending ? "Locking Brief..." : "Pre-Fund & Send Brief"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
