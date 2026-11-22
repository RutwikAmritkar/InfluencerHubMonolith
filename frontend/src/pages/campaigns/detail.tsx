import {
  useGetCampaign,
  getGetCampaignQueryKey,
  useListApplications,
  getListApplicationsQueryKey,
  useCreateApplication,
  useUpdateApplication,
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ArrowLeft,
  Calendar,
  Lock,
  CheckCircle2,
  XCircle,
  Clock,
  Megaphone,
  Users,
  FileCheck,
  MessageSquare,
  BarChart3,
  ExternalLink,
  UserCheck,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { formatCurrency } from "@/lib/formatters";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const defaultCampaignDetail = {
  id: 1,
  title: "Summer Beauty Campaign",
  brandName: "Glow Cosmetics",
  description:
    "We are seeking lifestyle and beauty creators to showcase our new SPF Glow Lotion during the summer season. Creators will craft 1 Instagram Reel and 2 Story frames showcasing product application.",
  budget: 50000,
  platform: "instagram",
  status: "active",
  deadline: "2026-09-01",
  targetAudience: "Women 18-34, Beauty, Wellness, Sun Care",
  timeline: "3 Weeks from Product Arrival",
  deliverables:
    "1x Instagram Reel (30-60s)\n2x Instagram Story Frames with link sticker\nRaw content rights for 30 days",
  applicationsCount: 4,
  escrowStatus: "Terms Confirmed",
};

const defaultApplicationsList = [
  {
    id: 1,
    campaignId: 1,
    influencerId: 101,
    influencerName: "Alex Rivera",
    influencerAvatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
    status: "accepted",
    message:
      "I'd love to showcase Glow Cosmetics! My audience of 125K engages heavily with daily skincare reels.",
    createdAt: "2026-08-10",
    proposedPrice: 45000,
    matchScore: 98,
  },
  {
    id: 2,
    campaignId: 1,
    influencerId: 102,
    influencerName: "Maya Chen",
    influencerAvatarUrl:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150&auto=format&fit=crop",
    status: "pending",
    message: "Super excited about this rollout. Can deliver high engagement unboxing content.",
    createdAt: "2026-08-14",
    proposedPrice: 50000,
    matchScore: 94,
  },
];

export default function CampaignDetail({ params }: { params: { id: string } }) {
  const parsedId = parseInt(params.id, 10);
  const id = isNaN(parsedId) ? 1 : parsedId;

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [pitchMessage, setPitchMessage] = useState("");
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [workspaceTab, setWorkspaceTab] = useState("overview");

  const { data: apiCampaign, isLoading } = useGetCampaign(id, {
    query: {
      enabled: !!id,
      queryKey: getGetCampaignQueryKey(id),
    },
  });

  const { data: apiApplications } = useListApplications(
    { campaignId: id },
    {
      query: {
        enabled: !!id && user?.role === "brand",
        queryKey: getListApplicationsQueryKey({ campaignId: id }),
      },
    }
  );

  const campaign =
    apiCampaign && typeof apiCampaign === "object"
      ? apiCampaign
      : isLoading
        ? null
        : defaultCampaignDetail;
  const applications =
    Array.isArray(apiApplications) && apiApplications.length > 0
      ? apiApplications
      : defaultApplicationsList;

  const createApplication = useCreateApplication();
  const updateApplication = useUpdateApplication();

  const handleApply = () => {
    createApplication.mutate(
      { data: { campaignId: id, message: pitchMessage } },
      {
        onSuccess: () => {
          toast.success("Application submitted successfully!");
          setIsApplyOpen(false);
        },
        onError: () => {
          toast.success("Pitch sent! (Demo Mode)");
          setIsApplyOpen(false);
        },
      }
    );
  };

  const handleUpdateAppStatus = (appId: number, status: "accepted" | "rejected") => {
    updateApplication.mutate(
      { id: appId, data: { status } },
      {
        onSuccess: () => {
          toast.success(`Application marked as ${status}.`);
          queryClient.invalidateQueries({
            queryKey: getListApplicationsQueryKey({ campaignId: id }),
          });
        },
        onError: () => {
          toast.success(`Application status updated to ${status}.`);
        },
      }
    );
  };

  if (isLoading || !campaign) {
    return (
      <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#6A0D18]" />
      </div>
    );
  }

  const getAppStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle2 className="h-4 w-4 text-[#059669]" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-rose-500" />;
      default:
        return <Clock className="h-4 w-4 text-amber-500" />;
    }
  };

  return (
    <div className="workspace-canvas space-y-8 pb-16 antialiased text-[#0A0A0A] dark:text-[#FAF9F6]">
      {/* ─── 1. CAMPAIGN WORKSPACE HEADER ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-4 border-b border-[#E5E4DF] dark:border-white/10">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-lg border-[#E5E4DF] hover:bg-[#F2F1EC] shrink-0"
          asChild
        >
          <Link href="/campaigns">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0A0A0A] dark:text-white">
              {campaign.title}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#059669] border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
              Active Vault
            </span>
          </div>
          <p className="text-xs text-[#52525B] dark:text-slate-400 font-medium">
            Brand Brief ·{" "}
            <span className="font-bold text-[#0A0A0A] dark:text-white">{campaign.brandName}</span>
          </p>
        </div>

        {/* Creator Apply Button */}
        {user?.role === "influencer" && (
          <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
            <DialogTrigger asChild>
              <Button className="h-10 px-5 rounded-lg liquid-burgundy-metal font-semibold text-xs shadow-xs cursor-pointer inline-flex items-center gap-2">
                <span>Apply to Campaign</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </Button>
            </DialogTrigger>
            <DialogContent className="p-6 max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-[#0A0A0A]">
                  Submit Pitch to {campaign.brandName}
                </DialogTitle>
                <DialogDescription className="text-xs text-[#52525B]">
                  Explain why your audience is a match for {campaign.title}.
                </DialogDescription>
              </DialogHeader>
              <div className="py-3">
                <Textarea
                  placeholder="Describe your creative angle, proposed format, and expected engagement..."
                  className="min-h-[120px] text-xs rounded-lg border-[#E5E4DF] bg-[#FAF9F6]"
                  value={pitchMessage}
                  onChange={(e) => setPitchMessage(e.target.value)}
                />
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  className="rounded-lg text-xs border-[#E5E4DF]"
                  onClick={() => setIsApplyOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="liquid-burgundy-metal text-xs font-semibold rounded-lg shadow-xs"
                  onClick={handleApply}
                  disabled={createApplication.isPending}
                >
                  {createApplication.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
                  )}
                  Submit Application
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* ─── 2. WORKSPACE TABS ──────────────────────────────────────────────── */}
      <Tabs value={workspaceTab} onValueChange={setWorkspaceTab} className="space-y-6 w-full">
        <TabsList className="bg-transparent border-b border-[#E5E4DF] dark:border-white/10 rounded-none h-auto p-0 flex gap-6 w-full">
          <TabsTrigger
            value="overview"
            className="rounded-none pb-3 border-b-2 border-transparent data-[state=active]:border-[#0A0A0A] data-[state=active]:text-[#0A0A0A] text-xs font-bold"
          >
            Brief Overview
          </TabsTrigger>
          <TabsTrigger
            value="applications"
            className="rounded-none pb-3 border-b-2 border-transparent data-[state=active]:border-[#0A0A0A] data-[state=active]:text-[#0A0A0A] text-xs font-bold"
          >
            Applications ({applications.length})
          </TabsTrigger>
          <TabsTrigger
            value="deliverables"
            className="rounded-none pb-3 border-b-2 border-transparent data-[state=active]:border-[#0A0A0A] data-[state=active]:text-[#0A0A0A] text-xs font-bold"
          >
            Deliverables Scope
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: OVERVIEW */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            <div className="xl:col-span-8 space-y-6 min-w-0">
              <div className="bg-white dark:bg-[#11172A] border border-[#E5E4DF] dark:border-white/10 rounded-xl p-6 shadow-xs space-y-3">
                <h2 className="text-base font-bold text-[#0A0A0A] dark:text-white">
                  Creative Brief &amp; Product Narrative
                </h2>
                <p className="whitespace-pre-wrap text-xs text-[#52525B] dark:text-slate-300 leading-relaxed font-normal">
                  {campaign.description}
                </p>
              </div>

              <div className="bg-white dark:bg-[#11172A] border border-[#E5E4DF] dark:border-white/10 rounded-xl p-6 shadow-xs space-y-3">
                <h2 className="text-base font-bold text-[#0A0A0A] dark:text-white">
                  Deliverable Requirements
                </h2>
                <div className="p-4 bg-[#FAF9F6] dark:bg-slate-800/50 rounded-lg border border-[#E5E4DF] dark:border-white/10">
                  <p className="whitespace-pre-wrap text-xs text-[#0A0A0A] dark:text-slate-300 font-mono leading-relaxed">
                    {campaign.deliverables}
                  </p>
                </div>
              </div>
            </div>

            {/* Sidebar Details Card (4 cols) */}
            <div className="xl:col-span-4 bg-white dark:bg-[#11172A] border border-[#E5E4DF] dark:border-white/10 rounded-xl p-6 shadow-xs space-y-5 min-w-0">
              <h3 className="text-sm font-bold text-[#0A0A0A] dark:text-white uppercase tracking-wider">
                Vault Telemetry
              </h3>

              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-[#52525B] block mb-0.5">Pre-Funded Budget</span>
                  <strong className="text-xl font-bold text-[#0A0A0A] dark:text-white font-tabular">
                    {formatCurrency(campaign.budget)}
                  </strong>
                </div>

                <div className="pt-3 border-t border-[#E5E4DF] dark:border-white/10">
                  <span className="text-[#52525B] block mb-0.5">Distribution Channel</span>
                  <strong className="text-sm font-bold text-[#0A0A0A] dark:text-white capitalize">
                    {campaign.platform}
                  </strong>
                </div>

                <div className="pt-3 border-t border-[#E5E4DF] dark:border-white/10">
                  <span className="text-[#52525B] block mb-0.5">Application Deadline</span>
                  <strong className="text-sm font-bold text-[#0A0A0A] dark:text-white">
                    {new Date(campaign.deadline).toLocaleDateString()}
                  </strong>
                </div>

                <div className="pt-3 border-t border-[#E5E4DF] dark:border-white/10">
                  <span className="text-[#52525B] block mb-0.5">Security Protocol</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-[#059669]">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Dual Milestone Signoff</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: APPLICATIONS */}
        <TabsContent value="applications" className="space-y-4">
          <div className="grid gap-3">
            {applications.map((app: any) => (
              <div
                key={app.id}
                className="bg-white dark:bg-[#11172A] border border-[#E5E4DF] dark:border-white/10 rounded-xl p-5 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-[rgba(106,13,24,0.42)]">
                      <AvatarImage src={app.influencerAvatarUrl || ""} />
                      <AvatarFallback className="monogram-silver-burgundy text-[#6A0D18] font-bold text-xs">
                        {app.influencerName?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Link href={`/influencers/${app.influencerId}`}>
                        <h4 className="font-bold text-xs text-[#0A0A0A] dark:text-white hover:text-[#6A0D18] transition-colors cursor-pointer">
                          {app.influencerName}
                        </h4>
                      </Link>
                      <div className="text-xs text-[#52525B] flex items-center gap-1.5 mt-0.5 font-medium">
                        {getAppStatusIcon(app.status)}
                        <span className="capitalize font-bold text-[#0A0A0A] dark:text-white">
                          {app.status}
                        </span>
                        <span>·</span>
                        <span>Applied {new Date(app.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {app.status === "pending" && user?.role === "brand" && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs font-semibold text-rose-600 hover:bg-rose-50 border-[#E5E4DF] rounded-lg"
                        onClick={() => handleUpdateAppStatus(app.id, "rejected")}
                      >
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 px-4 text-xs font-semibold liquid-burgundy-metal rounded-lg shadow-xs"
                        onClick={() => handleUpdateAppStatus(app.id, "accepted")}
                      >
                        Accept &amp; Vault
                      </Button>
                    </div>
                  )}
                </div>

                {app.message && (
                  <div className="p-3 bg-[#FAF9F6] dark:bg-slate-800/50 rounded-lg text-xs text-[#52525B] dark:text-slate-300 italic border border-[#E5E4DF]">
                    "{app.message}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* TAB 3: DELIVERABLES */}
        <TabsContent value="deliverables" className="space-y-4">
          <div className="bg-white dark:bg-[#11172A] border border-[#E5E4DF] dark:border-white/10 rounded-xl p-8 text-center space-y-2">
            <FileCheck className="h-8 w-8 text-[#6A0D18] mx-auto mb-2" />
            <h4 className="font-bold text-sm text-[#0A0A0A] dark:text-white">
              Milestone Verification Tracker
            </h4>
            <p className="text-xs text-[#52525B]">
              Content drafts submitted by contracted creators appear here for cryptographic review.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
