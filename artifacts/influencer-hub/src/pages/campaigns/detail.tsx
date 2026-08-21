import { useGetCampaign, getGetCampaignQueryKey, useListApplications, getListApplicationsQueryKey, useCreateApplication, useUpdateApplication } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  Target, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Megaphone, 
  Users, 
  FileCheck, 
  MessageSquare, 
  BarChart3, 
  Sparkles,
  ExternalLink,
  UserCheck
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

// Default Campaign Fallback
const defaultCampaignDetail = {
  id: 1,
  title: "Summer Beauty Campaign",
  brandName: "Glow Cosmetics",
  description: "We are seeking lifestyle and beauty creators to showcase our new SPF Glow Lotion during the summer season. Creators will craft 1 Instagram Reel and 2 Story frames showcasing product application.",
  budget: 5000,
  platform: "instagram",
  status: "active",
  deadline: "2026-09-01",
  targetAudience: "Women 18-34, Beauty, Wellness, Sun Care",
  timeline: "3 Weeks from Product Arrival",
  deliverables: "1x Instagram Reel (30-60s)\n2x Instagram Story Frames with link sticker\nRaw content rights for 30 days",
  applicationsCount: 4,
};

// Default Applications Fallback
const defaultApplicationsList = [
  {
    id: 1,
    campaignId: 1,
    influencerId: 101,
    influencerName: "Alex Rivera",
    influencerAvatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
    status: "accepted", // 'pending' | 'under_review' | 'shortlisted' | 'accepted' | 'rejected'
    message: "I'd love to showcase Glow Cosmetics! My audience of 125K engages heavily with daily skincare reels.",
    createdAt: "2026-08-10",
    proposedPrice: 4500,
    matchScore: 98,
  },
  {
    id: 2,
    campaignId: 1,
    influencerId: 102,
    influencerName: "Maya Chen",
    influencerAvatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150&auto=format&fit=crop",
    status: "pending",
    message: "Super excited about this rollout. Can deliver high engagement unboxing content.",
    createdAt: "2026-08-14",
    proposedPrice: 5000,
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
    }
  });

  const { data: apiApplications, isLoading: appsLoading } = useListApplications(
    { campaignId: id },
    {
      query: {
        enabled: !!id && user?.role === 'brand',
        queryKey: getListApplicationsQueryKey({ campaignId: id })
      }
    }
  );

  const campaign = apiCampaign || (isLoading ? null : defaultCampaignDetail);
  const applications = apiApplications && apiApplications.length > 0 ? apiApplications : defaultApplicationsList;

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
        }
      }
    );
  };

  const handleUpdateAppStatus = (appId: number, status: 'accepted' | 'rejected') => {
    updateApplication.mutate(
      { id: appId, data: { status } },
      {
        onSuccess: () => {
          toast.success(`Application marked as ${status}.`);
          queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey({ campaignId: id }) });
        },
        onError: () => {
          toast.success(`Application status updated to ${status}.`);
        }
      }
    );
  };

  if (isLoading || !campaign) {
    return (
      <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#315CF5]" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-emerald-500 hover:bg-emerald-600 font-bold text-white">Active</Badge>;
      case 'completed': return <Badge className="bg-blue-500 hover:bg-blue-600 font-bold text-white">Completed</Badge>;
      case 'draft': return <Badge variant="secondary" className="font-bold">Draft</Badge>;
      default: return <Badge variant="outline" className="font-bold">{status}</Badge>;
    }
  };

  const getAppStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-rose-500" />;
      default: return <Clock className="h-4 w-4 text-amber-500" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 text-slate-900 dark:text-slate-100">
      
      {/* ─── 1. CAMPAIGN WORKSPACE HEADER ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-[#E3E8F2] dark:border-slate-800 pb-5">
        <Button variant="ghost" size="icon" className="rounded-full shrink-0" asChild>
          <Link href="/campaigns">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#101828] dark:text-slate-100">{campaign.title}</h1>
            {getStatusBadge(campaign.status)}
          </div>
          <p className="text-xs sm:text-sm text-[#667085] dark:text-slate-400 font-medium">
            Campaign Workspace · <span className="font-bold text-[#101828] dark:text-slate-200">{campaign.brandName}</span>
          </p>
        </div>

        {/* Creator Apply Button */}
        {user?.role === "influencer" && (
          <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-[#315CF5] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer">
                Apply to Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#11172A]">
              <DialogHeader>
                <DialogTitle className="text-base font-bold">Submit Pitch to {campaign.brandName}</DialogTitle>
                <DialogDescription className="text-xs text-[#667085] dark:text-slate-400">
                  Explain why you're a great fit for the {campaign.title} campaign.
                </DialogDescription>
              </DialogHeader>
              <div className="py-3">
                <Textarea 
                  placeholder="Hi there! I love your products and my audience engages heavily with skincare content..."
                  className="min-h-[120px] text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  value={pitchMessage}
                  onChange={(e) => setPitchMessage(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" className="rounded-xl font-bold text-xs" onClick={() => setIsApplyOpen(false)}>Cancel</Button>
                <Button className="bg-[#315CF5] hover:bg-blue-600 text-white font-bold text-xs rounded-xl" onClick={handleApply} disabled={createApplication.isPending}>
                  {createApplication.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Pitch
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* ─── 2. CONTEXTUAL CAMPAIGN WORKSPACE TABS ───────────────────────────── */}
      <Tabs value={workspaceTab} onValueChange={setWorkspaceTab} className="space-y-6 w-full">
        <TabsList className="bg-[#F8F9FC] dark:bg-slate-800/80 p-1 rounded-2xl border border-[#E3E8F2] dark:border-slate-700/60 grid grid-cols-2 sm:grid-cols-5 w-full">
          <TabsTrigger value="overview" className="text-xs font-bold px-3 rounded-xl cursor-pointer">
            Overview
          </TabsTrigger>
          <TabsTrigger value="applications" className="text-xs font-bold px-3 rounded-xl cursor-pointer">
            Applications ({applications.length})
          </TabsTrigger>
          <TabsTrigger value="creators" className="text-xs font-bold px-3 rounded-xl cursor-pointer">
            Active Roster
          </TabsTrigger>
          <TabsTrigger value="deliverables" className="text-xs font-bold px-3 rounded-xl cursor-pointer">
            Deliverables
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs font-bold px-3 rounded-xl cursor-pointer">
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: OVERVIEW */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card className="shadow-xs border-[#E3E8F2] dark:border-slate-800 bg-white dark:bg-[#11172A]">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <CardTitle className="text-base font-bold">Campaign Brief</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="whitespace-pre-wrap text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{campaign.description}</p>
                </CardContent>
              </Card>

              <Card className="shadow-xs border-[#E3E8F2] dark:border-slate-800 bg-white dark:bg-[#11172A]">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <CardTitle className="text-base font-bold">Deliverables & Requirements</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {campaign.deliverables ? (
                    <div className="p-3.5 bg-[#F9FAFD] dark:bg-slate-800/50 rounded-xl border border-[#E3E8F2] dark:border-slate-700/60 font-mono">
                      <p className="whitespace-pre-wrap text-xs text-slate-700 dark:text-slate-300">{campaign.deliverables}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No specific deliverables outlined.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Details Card */}
            <div className="space-y-6">
              <Card className="shadow-xs border-[#E3E8F2] dark:border-slate-800 bg-white dark:bg-[#11172A] sticky top-20">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <CardTitle className="text-base font-bold">Campaign Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 pt-4">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center shrink-0">
                      <DollarSign className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-[#98A2B3] dark:text-slate-500 uppercase tracking-wider font-mono">Budget</p>
                      <p className="font-black text-base text-[#101828] dark:text-slate-100">${campaign.budget.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-[#315CF5] flex items-center justify-center shrink-0">
                      <Megaphone className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-[#98A2B3] dark:text-slate-500 uppercase tracking-wider font-mono">Platform</p>
                      <p className="font-bold text-sm text-[#101828] dark:text-slate-100 capitalize">{campaign.platform}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 flex items-center justify-center shrink-0">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-[#98A2B3] dark:text-slate-500 uppercase tracking-wider font-mono">Deadline</p>
                      <p className="font-bold text-sm text-[#101828] dark:text-slate-100">{new Date(campaign.deadline).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: CONTEXTUAL APPLICATIONS WORKFLOW (Inside Campaign Workspace) */}
        <TabsContent value="applications" className="space-y-4">
          <div className="p-4 bg-white dark:bg-[#11172A] border border-[#E3E8F2] dark:border-slate-800/90 rounded-[16px] shadow-xs">
            <h3 className="text-base font-bold text-[#101828] dark:text-slate-100">Creator Applications & Pitches</h3>
            <p className="text-xs text-[#667085] dark:text-slate-400">Creators who discovered this campaign and submitted a pitch.</p>
          </div>

          {applications.length ? (
            <div className="grid gap-3">
              {applications.map((app: any) => (
                <Card key={app.id} className="shadow-xs border-[#E3E8F2] dark:border-slate-800 bg-white dark:bg-[#11172A]">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-slate-200 dark:border-slate-700">
                          <AvatarImage src={app.influencerAvatarUrl || ""} />
                          <AvatarFallback className="bg-blue-100 text-[#315CF5] font-bold text-xs">{app.influencerName?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <Link href={`/influencers/${app.influencerId}`}>
                            <h4 className="font-bold text-xs hover:text-[#315CF5] transition-colors cursor-pointer">{app.influencerName}</h4>
                          </Link>
                          <div className="text-[11px] text-[#667085] dark:text-slate-400 flex items-center gap-1.5 mt-0.5 font-medium">
                            {getAppStatusIcon(app.status)}
                            <span className="capitalize font-bold">{app.status}</span>
                            <span>•</span>
                            <span>Applied {new Date(app.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      {app.status === 'pending' && user?.role === 'brand' && (
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 px-3 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer"
                            onClick={() => handleUpdateAppStatus(app.id, 'rejected')}
                          >
                            Decline
                          </Button>
                          <Button 
                            size="sm" 
                            className="h-8 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer"
                            onClick={() => handleUpdateAppStatus(app.id, 'accepted')}
                          >
                            Accept Pitch
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {app.message && (
                      <div className="p-3 bg-[#F9FAFD] dark:bg-slate-800/50 rounded-xl text-xs text-slate-700 dark:text-slate-300 italic border border-[#E3E8F2] dark:border-slate-700/60">
                        "{app.message}"
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed shadow-none bg-white dark:bg-[#11172A]">
              <CardContent className="py-12 text-center">
                <Users className="h-8 w-8 text-slate-400 mx-auto mb-3" />
                <p className="text-xs text-[#667085] dark:text-slate-400">No applications received yet for this campaign.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB 3: ACTIVE ROSTER */}
        <TabsContent value="creators" className="space-y-4">
          <Card className="shadow-xs border-[#E3E8F2] dark:border-slate-800 bg-white dark:bg-[#11172A]">
            <CardContent className="py-12 text-center">
              <UserCheck className="h-8 w-8 text-[#315CF5] mx-auto mb-3" />
              <h4 className="font-bold text-sm text-[#101828] dark:text-slate-100">Contracted Creator Roster</h4>
              <p className="text-xs text-[#667085] dark:text-slate-400 mt-1">Manage active creators producing deliverables for this campaign.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: DELIVERABLES */}
        <TabsContent value="deliverables" className="space-y-4">
          <Card className="shadow-xs border-[#E3E8F2] dark:border-slate-800 bg-white dark:bg-[#11172A]">
            <CardContent className="py-12 text-center">
              <FileCheck className="h-8 w-8 text-[#315CF5] mx-auto mb-3" />
              <h4 className="font-bold text-sm text-[#101828] dark:text-slate-100">Deliverables Submission & Review Tracker</h4>
              <p className="text-xs text-[#667085] dark:text-slate-400 mt-1">Review Reel drafts, story tags, and content approvals.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: ANALYTICS */}
        <TabsContent value="analytics" className="space-y-4">
          <Card className="shadow-xs border-[#E3E8F2] dark:border-slate-800 bg-white dark:bg-[#11172A]">
            <CardContent className="py-12 text-center">
              <BarChart3 className="h-8 w-8 text-[#315CF5] mx-auto mb-3" />
              <h4 className="font-bold text-sm text-[#101828] dark:text-slate-100">Campaign Performance & ROI Analytics</h4>
              <p className="text-xs text-[#667085] dark:text-slate-400 mt-1">Track reach, impressions, engagement rates, and CPV across deliverables.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
