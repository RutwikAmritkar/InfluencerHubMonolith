import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import {
  FileCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Search,
  ExternalLink,
  ChevronDown,
  Building2,
  User,
  Sparkles,
  Eye,
  XCircle,
  ThumbsUp,
  Inbox,
  Filter,
  Layers,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ApplicationStatus = "all" | "pending" | "shortlisted" | "accepted" | "rejected";

interface ApplicationData {
  id: number;
  campaignId: number;
  campaignTitle: string | null;
  campaignBudget: number | null;
  brandId: number | null;
  brandName: string | null;
  brandLogoUrl: string | null;
  influencerId: number;
  influencerName: string | null;
  influencerAvatarUrl: string | null;
  influencerCategory: string | null;
  influencerFollowers: number | null;
  status: string;
  message: string | null;
  pitchText: string | null;
  quotedRatePaise: number | null;
  quotedRate: number | null;
  proposedTimeline: string | null;
  portfolioSamples: string[];
  createdAt: string;
}

export default function BrandApplicationsPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<ApplicationStatus>("all");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [inspectingApp, setInspectingApp] = useState<ApplicationData | null>(null);

  // 1. Fetch Brand Applications
  const {
    data: applications = [],
    isLoading,
    isError,
  } = useQuery<ApplicationData[]>({
    queryKey: ["brandApplications"],
    queryFn: async () => {
      const res = await fetch("/api/applications/brand");
      if (!res.ok) {
        if (res.status === 401) return [];
        throw new Error("Failed to load brand applications");
      }
      return res.json();
    },
  });

  // 2. Fetch Brand Campaigns for dropdown
  const { data: campaigns = [] } = useQuery<Array<{ id: number; title: string }>>({
    queryKey: ["brandCampaignsMy"],
    queryFn: async () => {
      const res = await fetch("/api/campaigns/my");
      if (!res.ok) return [];
      return res.json();
    },
  });

  // 3. Status Update Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update application status");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["brandApplications"] });
      const statusLabel =
        variables.status === "shortlisted"
          ? "Shortlisted"
          : variables.status === "rejected"
            ? "Declined"
            : variables.status;
      toast.success(`Application marked as ${statusLabel}.`);
      if (inspectingApp && inspectingApp.id === variables.id) {
        setInspectingApp((prev) => (prev ? { ...prev, status: variables.status } : null));
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update status");
    },
  });

  // 4. Open Deal Room Mutation
  const openDealMutation = useMutation({
    mutationFn: async (applicationId: number) => {
      const res = await fetch(`/api/applications/${applicationId}/open-deal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to open deal room");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["brandApplications"] });
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Deal Room initialized! Redirecting to commercial room...");
      if (data?.deal?.id) {
        setLocation(`/deals/${data.deal.id}`);
      } else {
        setLocation("/deals");
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Could not open deal room");
    },
  });

  // Filtered Applications & Counts
  const counts = useMemo(() => {
    return {
      all: applications.length,
      pending: applications.filter((a) => a.status === "pending").length,
      shortlisted: applications.filter((a) => a.status === "shortlisted").length,
      accepted: applications.filter((a) => a.status === "accepted").length,
      rejected: applications.filter((a) => a.status === "rejected" || a.status === "declined")
        .length,
    };
  }, [applications]);

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      // Tab filter
      if (activeTab === "pending" && app.status !== "pending") return false;
      if (activeTab === "shortlisted" && app.status !== "shortlisted") return false;
      if (activeTab === "accepted" && app.status !== "accepted") return false;
      if (activeTab === "rejected" && app.status !== "rejected" && app.status !== "declined")
        return false;

      // Campaign filter
      if (selectedCampaignId !== "all" && String(app.campaignId) !== selectedCampaignId) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = app.influencerName?.toLowerCase().includes(q);
        const campaignMatch = app.campaignTitle?.toLowerCase().includes(q);
        const pitchMatch =
          app.pitchText?.toLowerCase().includes(q) || app.message?.toLowerCase().includes(q);
        const categoryMatch = app.influencerCategory?.toLowerCase().includes(q);
        if (!nameMatch && !campaignMatch && !pitchMatch && !categoryMatch) return false;
      }

      return true;
    });
  }, [applications, activeTab, selectedCampaignId, searchQuery]);

  return (
    <div className="workspace-canvas space-y-6 pb-16 antialiased text-[#0A0A0A]">
      {/* ─── 1. PAGE HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-4 border-b border-[#E5E4DF]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-[#FDF6F7] text-[#6A0D18] border border-[#EED8DC]">
              COMMERCIAL INBOX
            </span>
            <span className="text-zinc-400">•</span>
            <span className="text-xs font-semibold text-zinc-500">
              Creator Pitches &amp; Review
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0A0A0A]">
            Deal <span className="font-serif italic font-normal text-[#6A0D18]">Applications</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-2xl">
            Review incoming creator pitches, audit proposed deliverables and quoted rates, shortlist
            top talent, and open versioned Deal Rooms.
          </p>
        </div>

        {/* Quick Nav to Campaigns */}
        <div className="flex items-center gap-2">
          <Link
            href="/campaigns"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E5E4DF] bg-white hover:bg-[#F2F1EC] text-xs font-semibold text-[#0A0A0A] transition-colors shadow-xs"
          >
            <Building2 className="w-3.5 h-3.5 text-zinc-500" />
            <span>Manage Campaigns</span>
          </Link>
          <Link
            href="/deals"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg liquid-burgundy-metal text-xs font-semibold shadow-xs"
          >
            <span>Open Deal Rooms</span>
            <ArrowRight className="w-3.5 h-3.5 text-white" />
          </Link>
        </div>
      </div>

      {/* ─── 2. CONTROLS & FILTER BAR ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="inline-flex items-center p-1 rounded-xl bg-[#F2F1EC] border border-[#E5E4DF] overflow-x-auto">
          {(
            [
              { id: "all", label: "All Pitches", count: counts.all },
              { id: "pending", label: "Pending", count: counts.pending },
              { id: "shortlisted", label: "Shortlisted", count: counts.shortlisted },
              { id: "accepted", label: "Accepted", count: counts.accepted },
              { id: "rejected", label: "Declined", count: counts.rejected },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer",
                activeTab === tab.id
                  ? "liquid-burgundy-metal font-bold shadow-xs"
                  : "text-zinc-600 hover:text-[#0A0A0A]"
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "text-[10px] font-bold px-1.5 py-0.2 rounded-md font-tabular",
                  activeTab === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-white/80 text-zinc-600 border border-[#E5E4DF]"
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Campaign Filter & Search Input */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          {/* Campaign Selector */}
          <div className="relative w-full sm:w-56">
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="w-full h-9 pl-3 pr-8 rounded-lg bg-white border border-[#E5E4DF] text-xs font-medium text-[#0A0A0A] appearance-none focus:outline-none focus:border-[#0A0A0A] cursor-pointer shadow-xs"
            >
              <option value="all">All Campaigns</option>
              {campaigns.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.title}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-3 pointer-events-none" />
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search creator or pitch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-8 pr-3 rounded-lg bg-white border border-[#E5E4DF] text-xs font-medium text-[#0A0A0A] placeholder:text-zinc-400 focus:outline-none focus:border-[#0A0A0A] shadow-xs"
            />
          </div>
        </div>
      </div>

      {/* ─── 3. APPLICATION INBOX LEDGER ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E5E4DF] divide-y divide-[#E5E4DF] shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#6A0D18] border-t-transparent animate-spin mx-auto" />
            <p className="text-xs font-semibold text-zinc-500">
              Loading incoming creator pitches...
            </p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F2F1EC] flex items-center justify-center mx-auto text-zinc-400">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#0A0A0A]">No applications found</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              {activeTab !== "all"
                ? `There are currently no creator applications in the "${activeTab}" view.`
                : "Your campaigns haven't received any creator applications matching the current filter."}
            </p>
          </div>
        ) : (
          filteredApplications.map((app) => {
            const displayQuoted =
              app.quotedRate != null
                ? `₹${app.quotedRate.toLocaleString("en-IN")}`
                : app.quotedRatePaise != null
                  ? `₹${Math.round(app.quotedRatePaise / 100).toLocaleString("en-IN")}`
                  : app.campaignBudget
                    ? `₹${app.campaignBudget.toLocaleString("en-IN")}`
                    : "₹45,000";

            return (
              <div
                key={app.id}
                className="p-5 sm:p-6 transition-colors hover:bg-[#FAF9F6] flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                {/* Left: Creator & Campaign Meta */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {/* Creator Avatar */}
                  <div className="relative shrink-0">
                    {app.influencerAvatarUrl ? (
                      <img
                        src={app.influencerAvatarUrl}
                        alt={app.influencerName || "Creator"}
                        className="w-12 h-12 rounded-full object-cover border border-[#E5E4DF]"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#EAE6DF] flex items-center justify-center font-bold text-sm text-[#0A0A0A] border border-[#E5E4DF]">
                        {app.influencerName ? app.influencerName.slice(0, 2).toUpperCase() : "CR"}
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#6A0D18] border-2 border-white flex items-center justify-center text-[9px] text-white">
                      ✓
                    </span>
                  </div>

                  {/* Creator & Pitch Info */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/influencers/${app.influencerId}`}
                        className="text-sm font-bold text-[#0A0A0A] hover:text-[#6A0D18] transition-colors inline-flex items-center gap-1"
                      >
                        <span>{app.influencerName || "Creator"}</span>
                        <ArrowUpRight className="w-3 h-3 text-zinc-400" />
                      </Link>

                      {app.influencerCategory && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#F2F1EC] text-zinc-700 border border-[#E5E4DF]">
                          {app.influencerCategory}
                        </span>
                      )}

                      {app.influencerFollowers != null && (
                        <span className="text-[11px] font-medium text-zinc-500 font-tabular">
                          {app.influencerFollowers.toLocaleString("en-IN")} followers
                        </span>
                      )}

                      {/* Status Badge */}
                      <span
                        className={cn(
                          "ml-auto sm:ml-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          app.status === "shortlisted"
                            ? "bg-[#FDF6F7] text-[#6A0D18] border border-[#EED8DC]"
                            : app.status === "accepted"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200/70"
                              : app.status === "rejected" || app.status === "declined"
                                ? "bg-zinc-100 text-zinc-600 border border-zinc-200"
                                : "bg-amber-50 text-amber-800 border border-amber-200/70"
                        )}
                      >
                        {app.status}
                      </span>
                    </div>

                    {/* Campaign Context */}
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <span>Applied to:</span>
                      <Link
                        href={`/campaigns/${app.campaignId}`}
                        className="font-semibold text-[#6A0D18] hover:underline truncate max-w-xs"
                      >
                        {app.campaignTitle || "Campaign Brief"}
                      </Link>
                      <span className="text-zinc-300">•</span>
                      <span className="text-[11px] font-tabular">
                        {new Date(app.createdAt).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    {/* Pitch Excerpt */}
                    <p className="text-xs text-zinc-600 line-clamp-2 mt-1">
                      {app.pitchText || app.message || "No custom pitch note provided."}
                    </p>

                    {/* Portfolio Samples preview pills */}
                    {app.portfolioSamples && app.portfolioSamples.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                          Samples:
                        </span>
                        {app.portfolioSamples.map((sampleUrl, idx) => (
                          <a
                            key={idx}
                            href={sampleUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F2F1EC] hover:bg-[#EAE6DF] text-[11px] font-medium text-[#6A0D18] border border-[#E5E4DF] transition-colors"
                          >
                            <span>Sample {idx + 1}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Commercial Terms & Action Buttons */}
                <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#E5E4DF]">
                  {/* Quoted Fee */}
                  <div className="text-left lg:text-right">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                      Quoted Commercials
                    </span>
                    <span className="text-base sm:text-lg font-bold text-[#0A0A0A] font-tabular">
                      {displayQuoted}
                    </span>
                    {app.proposedTimeline && (
                      <span className="text-[11px] text-zinc-500 block">
                        Est: {app.proposedTimeline}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setInspectingApp(app)}
                      className="px-3 py-1.5 rounded-lg border border-[#E5E4DF] hover:bg-[#F2F1EC] text-xs font-semibold text-zinc-700 transition-colors cursor-pointer"
                      title="Inspect Full Pitch"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    {app.status === "pending" && (
                      <>
                        <button
                          disabled={updateStatusMutation.isPending}
                          onClick={() =>
                            updateStatusMutation.mutate({ id: app.id, status: "shortlisted" })
                          }
                          className="px-3 py-1.5 rounded-lg border border-[#EED8DC] bg-[#FDF6F7] hover:bg-[#FBECEF] text-[#6A0D18] text-xs font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          Shortlist
                        </button>
                        <button
                          disabled={openDealMutation.isPending}
                          onClick={() => openDealMutation.mutate(app.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg liquid-burgundy-metal text-xs font-semibold cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          <span>Open Deal Room</span>
                          <ArrowRight className="w-3.5 h-3.5 text-white" />
                        </button>
                      </>
                    )}

                    {app.status === "shortlisted" && (
                      <>
                        <button
                          disabled={updateStatusMutation.isPending}
                          onClick={() =>
                            updateStatusMutation.mutate({ id: app.id, status: "rejected" })
                          }
                          className="px-2.5 py-1.5 rounded-lg border border-[#E5E4DF] hover:bg-red-50 text-red-600 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Decline
                        </button>
                        <button
                          disabled={openDealMutation.isPending}
                          onClick={() => openDealMutation.mutate(app.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg liquid-burgundy-metal text-xs font-semibold cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          <span>Open Deal Room</span>
                          <ArrowRight className="w-3.5 h-3.5 text-white" />
                        </button>
                      </>
                    )}

                    {app.status === "accepted" && (
                      <Link
                        href="/deals"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg liquid-burgundy-metal text-xs font-semibold cursor-pointer shadow-xs"
                      >
                        <span>Go to Deal Room</span>
                        <ArrowRight className="w-3.5 h-3.5 text-white" />
                      </Link>
                    )}

                    {app.status === "rejected" && (
                      <button
                        disabled={updateStatusMutation.isPending}
                        onClick={() =>
                          updateStatusMutation.mutate({ id: app.id, status: "pending" })
                        }
                        className="px-3 py-1.5 rounded-lg border border-[#E5E4DF] hover:bg-[#F2F1EC] text-xs font-semibold text-zinc-600 transition-colors cursor-pointer"
                      >
                        Reconsider
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ─── 4. INSPECT PITCH MODAL ──────────────────────────────────────────────── */}
      {inspectingApp && (
        <Dialog open={Boolean(inspectingApp)} onOpenChange={() => setInspectingApp(null)}>
          <DialogContent className="max-w-xl p-6 bg-[#FAF9F6] border border-[#E5E4DF] rounded-2xl shadow-xl">
            <DialogHeader className="pb-3 border-b border-[#E5E4DF]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6A0D18] bg-[#FDF6F7] px-2 py-0.5 rounded-md border border-[#EED8DC]">
                  CREATOR PITCH AUDIT
                </span>
                <span className="text-xs text-zinc-500 font-tabular">
                  Applied {new Date(inspectingApp.createdAt).toLocaleDateString("en-IN")}
                </span>
              </div>
              <DialogTitle className="text-xl font-bold text-[#0A0A0A] mt-2">
                {inspectingApp.influencerName || "Creator Pitch"}
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500">
                Pitched for campaign:{" "}
                <span className="font-semibold text-[#0A0A0A]">{inspectingApp.campaignTitle}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              {/* Commercial Terms Snapshot */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-white border border-[#E5E4DF]">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                    Quoted Rate
                  </span>
                  <span className="text-lg font-bold text-[#0A0A0A] font-tabular">
                    {inspectingApp.quotedRate != null
                      ? `₹${inspectingApp.quotedRate.toLocaleString("en-IN")}`
                      : inspectingApp.quotedRatePaise != null
                        ? `₹${Math.round(inspectingApp.quotedRatePaise / 100).toLocaleString("en-IN")}`
                        : "Standard Rate"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                    Turnaround Timeline
                  </span>
                  <span className="text-sm font-semibold text-[#0A0A0A]">
                    {inspectingApp.proposedTimeline || "Standard Delivery"}
                  </span>
                </div>
              </div>

              {/* Pitch Note */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider">
                  Pitch &amp; Creative Angle
                </span>
                <div className="p-3.5 rounded-xl bg-white border border-[#E5E4DF] text-xs text-zinc-700 leading-relaxed max-h-48 overflow-y-auto">
                  {inspectingApp.pitchText || inspectingApp.message || "No pitch note provided."}
                </div>
              </div>

              {/* Portfolio Samples */}
              {inspectingApp.portfolioSamples && inspectingApp.portfolioSamples.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider">
                    Linked Portfolio Samples
                  </span>
                  <div className="space-y-1.5">
                    {inspectingApp.portfolioSamples.map((sampleUrl, i) => (
                      <a
                        key={i}
                        href={sampleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-[#E5E4DF] hover:border-[#EED8DC] text-xs text-[#6A0D18] font-medium transition-colors"
                      >
                        <span className="truncate">{sampleUrl}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-zinc-400 shrink-0 ml-2" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E4DF]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInspectingApp(null)}
                className="rounded-lg text-xs font-semibold"
              >
                Close
              </Button>
              {inspectingApp.status !== "accepted" && (
                <Button
                  size="sm"
                  onClick={() => {
                    openDealMutation.mutate(inspectingApp.id);
                    setInspectingApp(null);
                  }}
                  className="rounded-lg bg-[#0A0A0A] hover:bg-zinc-800 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <span>Open Deal Room</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
