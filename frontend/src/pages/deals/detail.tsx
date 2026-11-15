import React, { useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  MessageSquare,
  Activity,
  Calendar,
  ShieldCheck,
  Send,
  AlertCircle,
  Plus,
  Lock,
  ChevronRight,
  Layers,
  HelpCircle,
  Loader2,
  RefreshCw,
  Package,
  IndianRupee,
  Sparkles,
  ExternalLink,
  Trash2,
  XCircle,
  Copy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export default function DealRoomDetail() {
  const [, params] = useRoute<{ id: string }>("/deals/:id");
  const dealId = params?.id ? parseInt(params.id, 10) : 0;
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isCreator = user?.role === "influencer" || (user?.role as string) === "creator";
  const userParty = isCreator ? "creator" : "brand";

  const [showCounterModal, setShowCounterModal] = useState(false);
  const [selectedVersionForView, setSelectedVersionForView] = useState<number | null>(null);

  // Counter Proposal Form State
  const [counterPriceINR, setCounterPriceINR] = useState("45000");
  const [counterCollabType, setCounterCollabType] = useState<"paid" | "barter" | "hybrid">("paid");
  const [counterDeliverables, setCounterDeliverables] = useState<
    Array<{ title: string; count: number; specs?: string }>
  >([{ title: "Sponsored Content", count: 1, specs: "" }]);
  const [counterBarterDesc, setCounterBarterDesc] = useState("");
  const [counterBarterQuantity, setCounterBarterQuantity] = useState("1");
  const [counterBarterValuation, setCounterBarterValuation] = useState("5000");
  const [counterBarterShipping, setCounterBarterShipping] = useState<"brand" | "creator">("brand");
  const [counterSubmissionDate, setCounterSubmissionDate] = useState("");
  const [counterPublishingDate, setCounterPublishingDate] = useState("");
  const [counterUsageDays, setCounterUsageDays] = useState("30");
  const [counterExclusivityDays, setCounterExclusivityDays] = useState("0");
  const [counterRevisionCount, setCounterRevisionCount] = useState("2");
  const [counterPaidAds, setCounterPaidAds] = useState(false);
  const [counterNotes, setCounterNotes] = useState("");

  // Deliverable Submission State
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [submissionLink, setSubmissionLink] = useState("");
  const [submissionNotes, setSubmissionNotes] = useState("");

  // Fetch Deal Details
  const {
    data: deal,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["deal", dealId],
    queryFn: async () => {
      const res = await fetch(`/api/deals/${dealId}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to load Deal Room.");
      }
      return res.json();
    },
    enabled: Boolean(dealId),
  });

  // Fetch Proposals History
  const { data: proposalsHistory = [] } = useQuery<any[]>({
    queryKey: ["dealProposals", dealId],
    queryFn: async () => {
      const res = await fetch(`/api/deals/${dealId}/proposals`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: Boolean(dealId),
  });

  // Dual Confirmation Mutation
  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!deal?.activeProposal?.version) {
        throw new Error("No active proposal version to sign.");
      }
      const res = await fetch(`/api/deals/${dealId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalVersion: deal.activeProposal.version }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to sign terms.");
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (data.confirmed) {
        toast.success("Deal Confirmed! Both parties have executed signoffs.");
      } else {
        toast.success("Terms signed successfully! Waiting for counterparty signoff.");
      }
      queryClient.invalidateQueries({ queryKey: ["deal", dealId] });
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      refetch();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // Submit Counter-Proposal Mutation (Optimistic Locking)
  const counterMutation = useMutation({
    mutationFn: async () => {
      const activeProp = deal?.activeProposal;
      if (!activeProp) throw new Error("No active proposal to counter.");

      const pricePaise =
        counterCollabType === "barter" ? 0 : Math.round(Number(counterPriceINR || 0) * 100);

      const barterDetails =
        counterCollabType === "barter" || counterCollabType === "hybrid"
          ? {
              productDescription: counterBarterDesc.trim(),
              quantity: Number(counterBarterQuantity) || 1,
              estimatedValuePaise: Math.round(Number(counterBarterValuation || 0) * 100),
              shippingBy: counterBarterShipping,
            }
          : null;

      const timelines = {
        contentSubmissionDate: counterSubmissionDate || undefined,
        publishingDate: counterPublishingDate || undefined,
      };

      const payload = {
        baseProposalId: activeProp.id,
        baseVersion: activeProp.version,
        dealTitle: deal.title,
        collabType: counterCollabType,
        pricePaise,
        currency: "INR",
        deliverables: counterDeliverables.map((d) => ({
          title: d.title,
          count: d.count || 1,
          specs: d.specs || "",
        })),
        barterDetails,
        timelines,
        usageRightsDays: Number(counterUsageDays) || 30,
        exclusivityDays: Number(counterExclusivityDays) || 0,
        revisionCount: Number(counterRevisionCount) || 1,
        paidAdsPermission: counterPaidAds,
        notes: counterNotes,
      };

      const res = await fetch(`/api/deals/${dealId}/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 409) {
          throw new Error(
            "STALE_PROPOSAL: A newer counter-offer was already proposed by your partner. Please refresh and review."
          );
        }
        throw new Error(err.error || "Failed to submit counter-proposal.");
      }
      return res.json();
    },
    onSuccess: () => {
      setShowCounterModal(false);
      toast.success("Counter-proposal dispatched to partner!");
      queryClient.invalidateQueries({ queryKey: ["deal", dealId] });
      queryClient.invalidateQueries({ queryKey: ["dealProposals", dealId] });
      refetch();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // Creator Content Submission Mutation
  const submissionMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/deals/${dealId}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          round: 1,
          contentUrls: submissionLink.trim()
            ? [submissionLink.trim()]
            : ["https://instagram.com/reel/demo_preview"],
          notes: submissionNotes.trim() || "Deliverables ready for brand review.",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to submit deliverable package.");
      }
      return res.json();
    },
    onSuccess: () => {
      setShowSubmissionModal(false);
      toast.success("Deliverable package submitted for brand review!");
      queryClient.invalidateQueries({ queryKey: ["deal", dealId] });
      refetch();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // Brand Deliverable Review Mutation
  const reviewMutation = useMutation({
    mutationFn: async ({
      action,
      notes,
    }: {
      action: "approve" | "request_revision";
      notes?: string;
    }) => {
      const res = await fetch(`/api/deals/${dealId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, revisionNotes: notes }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to review deliverable package.");
      }
      return res.json();
    },
    onSuccess: (_, vars) => {
      if (vars.action === "approve") {
        toast.success("Deliverable package approved! Ready for milestone settlement.");
      } else {
        toast.info("Revision requested from creator.");
      }
      queryClient.invalidateQueries({ queryKey: ["deal", dealId] });
      refetch();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // Brand Payment Settlement Mutation
  const settlePaymentMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/deals/${dealId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "PAYOUT_RELEASED",
          utrReference: "UPI-SETTLED-" + Date.now(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to record payment settlement.");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Milestone payout settled & released to creator!");
      queryClient.invalidateQueries({ queryKey: ["deal", dealId] });
      refetch();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const openCounterModalPrefilled = () => {
    if (!deal?.activeProposal) return;
    const p = deal.activeProposal;
    setCounterPriceINR(p.pricePaise ? String(Math.round(p.pricePaise / 100)) : "45000");
    setCounterCollabType(p.collabType || "paid");
    setCounterDeliverables(
      p.deliverables && p.deliverables.length > 0
        ? p.deliverables.map((d: any) => ({
            title: d.title || "Deliverable",
            count: d.count || d.quantity || 1,
            specs: d.specs || d.description || "",
          }))
        : [{ title: "Sponsored Deliverable", count: 1, specs: "" }]
    );
    if (p.barterDetails) {
      setCounterBarterDesc(p.barterDetails.productDescription || "");
      setCounterBarterQuantity(String(p.barterDetails.quantity || 1));
      setCounterBarterValuation(
        p.barterDetails.estimatedValuePaise
          ? String(Math.round(p.barterDetails.estimatedValuePaise / 100))
          : "5000"
      );
      setCounterBarterShipping(p.barterDetails.shippingBy || "brand");
    }
    setCounterSubmissionDate(
      p.timelines?.contentSubmissionDate
        ? p.timelines.contentSubmissionDate.substring(0, 10)
        : p.contentDeadline
          ? p.contentDeadline.substring(0, 10)
          : ""
    );
    setCounterPublishingDate(
      p.timelines?.publishingDate
        ? p.timelines.publishingDate.substring(0, 10)
        : p.postingDate
          ? p.postingDate.substring(0, 10)
          : ""
    );
    setCounterUsageDays(String(p.usageRightsDays || 30));
    setCounterExclusivityDays(String(p.exclusivityDays || 0));
    setCounterRevisionCount(String(p.revisionCount || 1));
    setCounterPaidAds(Boolean(p.paidAdsPermission));
    setCounterNotes(p.notes || "");
    setShowCounterModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16">
        <Loader2 className="h-8 w-8 animate-spin text-[#0A0A0A] mb-4" />
        <p className="text-xs font-semibold text-zinc-500">Loading Negotiation Room...</p>
      </div>
    );
  }

  if (isError || !deal) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="max-w-md w-full rounded-2xl bg-white border border-[#E5E4DF] p-8 text-center space-y-4 shadow-xs">
          <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-[#0A0A0A]">Deal Room Unavailable</h2>
          <p className="text-xs text-zinc-500">
            {error?.message || "Deal Room not found or access denied."}
          </p>
          <Button
            onClick={() => setLocation("/deals")}
            className="w-full bg-[#0A0A0A] hover:bg-zinc-800 text-white text-xs rounded-lg"
          >
            Return to Deals
          </Button>
        </div>
      </div>
    );
  }

  // Active Proposal or Historical Proposal Selected
  const displayedProposal =
    selectedVersionForView != null
      ? proposalsHistory.find((p) => p.version === selectedVersionForView) || deal.activeProposal
      : deal.activeProposal;

  const isConfirmed = deal.agreementStatus === "CONFIRMED" || deal.agreementStatus === "ACCEPTED";
  const brandApproved = deal.approvals?.some((a: any) => a.party === "brand");
  const creatorApproved = deal.approvals?.some((a: any) => a.party === "creator");
  const userHasApproved = userParty === "brand" ? brandApproved : creatorApproved;
  const isViewingHistorical =
    selectedVersionForView != null && selectedVersionForView !== deal.activeProposal?.version;

  return (
    <div className="workspace-canvas space-y-6 pb-16 antialiased text-[#0A0A0A]">
      {/* ─── 1. BREADCRUMBS & TOP BAR ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-[#E5E4DF]">
        <div className="flex items-center gap-3">
          <Link
            href="/deals"
            className="p-2 rounded-xl bg-white border border-[#E5E4DF] text-zinc-500 hover:text-[#0A0A0A] transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                NEGOTIATION ROOM
              </span>
              <span className="text-xs text-zinc-400">•</span>
              <span className="text-xs font-semibold text-zinc-500">
                {isCreator ? `With ${deal.brandName}` : `With ${deal.influencerName}`}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0A0A0A] mt-0.5">
              {deal.title}
            </h1>
          </div>
        </div>

        {/* Global Deal Status Badge */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
              isConfirmed
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-blue-50 text-blue-700 border border-blue-200"
            )}
          >
            {isConfirmed ? "Terms Confirmed" : "Under Negotiation"}
          </span>
        </div>
      </div>

      {/* ─── 2. ASYMMETRIC 7 / 5 SPLIT ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ─── LEFT COLUMN (7 COLS): ACTIVE TERMS & DELIVERABLES ─────────────────── */}
        <div className="lg:col-span-7 space-y-6">
          {/* Version Switcher Bar */}
          <div className="p-4 rounded-2xl bg-white border border-[#E5E4DF] shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#0A0A0A]">Version History:</span>
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {proposalsHistory.map((p) => {
                  const isCurrentActive = p.version === deal.activeProposal?.version;
                  const isSelected =
                    (selectedVersionForView == null && isCurrentActive) ||
                    selectedVersionForView === p.version;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedVersionForView(p.version)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-bold transition-all font-tabular cursor-pointer",
                        isSelected
                          ? "bg-[#0A0A0A] text-white shadow-xs"
                          : "bg-[#F2F1EC] text-zinc-600 hover:text-[#0A0A0A] border border-[#E5E4DF]"
                      )}
                    >
                      v{p.version} {isCurrentActive && "(Active)"}
                    </button>
                  );
                })}
              </div>
            </div>

            {isViewingHistorical && (
              <button
                onClick={() => setSelectedVersionForView(null)}
                className="text-xs font-semibold text-blue-700 hover:underline"
              >
                Back to Active v{deal.activeProposal?.version}
              </button>
            )}
          </div>

          {/* Active Version Contract Overview Card */}
          <div className="p-6 rounded-2xl bg-white border border-[#E5E4DF] shadow-xs space-y-5">
            <div className="flex items-start justify-between border-b border-[#E5E4DF] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#F2F1EC] text-zinc-700 border border-[#E5E4DF] font-tabular">
                    Version {displayedProposal?.version || 1}
                  </span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider",
                      displayedProposal?.collabType === "barter"
                        ? "bg-purple-50 text-purple-700 border border-purple-200"
                        : displayedProposal?.collabType === "hybrid"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                    )}
                  >
                    {displayedProposal?.collabType || "paid"}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#0A0A0A] mt-1">
                  Proposed by{" "}
                  {displayedProposal?.proposedByParty === "brand"
                    ? "Brand Partner"
                    : "Creator Partner"}
                </h3>
              </div>

              {/* Compensation */}
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                  Agreed Payout
                </span>
                <span className="text-xl font-bold font-tabular text-[#0A0A0A]">
                  {displayedProposal?.collabType === "barter"
                    ? "Product Barter"
                    : displayedProposal?.pricePaise
                      ? `₹${Math.round(displayedProposal.pricePaise / 100).toLocaleString("en-IN")}`
                      : "₹45,000"}
                </span>
                {displayedProposal?.collabType === "hybrid" && (
                  <span className="text-[11px] text-blue-700 block font-semibold">
                    + Product Barter
                  </span>
                )}
              </div>
            </div>

            {/* Deliverables Breakdown */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider block">
                Itemized Deliverables ({displayedProposal?.deliverables?.length || 0})
              </span>

              <div className="divide-y divide-[#E5E4DF] rounded-xl border border-[#E5E4DF] overflow-hidden">
                {displayedProposal?.deliverables?.map((deliv: any, idx: number) => (
                  <div key={idx} className="p-4 bg-[#FAF9F6] space-y-1 text-xs">
                    <div className="flex items-center justify-between font-bold text-[#0A0A0A]">
                      <span>
                        {deliv.count || deliv.quantity || 1}x {deliv.title}
                      </span>
                      {deliv.platform && (
                        <span className="px-2 py-0.5 rounded-md bg-white border border-[#E5E4DF] text-[10px] text-zinc-600">
                          {deliv.platform}
                        </span>
                      )}
                    </div>
                    {deliv.specs && (
                      <p className="text-zinc-600 text-[11px]">Specs: {deliv.specs}</p>
                    )}
                    {deliv.publishingRequirement && (
                      <p className="text-blue-700 text-[11px]">
                        Publishing: {deliv.publishingRequirement}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Product Barter Details if applicable */}
            {(displayedProposal?.collabType === "barter" ||
              displayedProposal?.collabType === "hybrid") &&
              displayedProposal?.barterDetails && (
                <div className="p-4 rounded-xl bg-blue-50/30 border border-blue-200/60 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                    <Package className="w-4 h-4 text-blue-700" />
                    <span>Product Barter Package</span>
                  </div>
                  <p className="text-xs text-zinc-700">
                    {displayedProposal.barterDetails.productDescription}
                  </p>
                  <div className="flex flex-wrap gap-3 text-[11px] text-zinc-500 font-medium pt-1">
                    <span>Quantity: {displayedProposal.barterDetails.quantity}</span>
                    <span>•</span>
                    <span>
                      Est. Valuation: ₹
                      {Math.round(
                        (displayedProposal.barterDetails.estimatedValuePaise || 0) / 100
                      ).toLocaleString("en-IN")}
                    </span>
                    <span>•</span>
                    <span>Shipping: {displayedProposal.barterDetails.shippingBy || "brand"}</span>
                  </div>
                </div>
              )}

            {/* Legal & Terms Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 text-center text-xs">
              <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E5E4DF]">
                <span className="text-[10px] text-zinc-400 block uppercase font-bold">
                  Revisions
                </span>
                <span className="font-bold text-[#0A0A0A]">
                  {displayedProposal?.revisionCount ?? 1} Rounds
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E5E4DF]">
                <span className="text-[10px] text-zinc-400 block uppercase font-bold">
                  Usage Rights
                </span>
                <span className="font-bold text-[#0A0A0A]">
                  {displayedProposal?.usageRightsDays ?? 30} Days
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E5E4DF]">
                <span className="text-[10px] text-zinc-400 block uppercase font-bold">
                  Exclusivity
                </span>
                <span className="font-bold text-[#0A0A0A]">
                  {displayedProposal?.exclusivityDays ?? 0} Days
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E5E4DF]">
                <span className="text-[10px] text-zinc-400 block uppercase font-bold">
                  Spark Ads
                </span>
                <span className="font-bold text-[#0A0A0A]">
                  {displayedProposal?.paidAdsPermission ? "Permitted" : "No"}
                </span>
              </div>
            </div>

            {/* Notes & Cancellation Terms */}
            {(displayedProposal?.notes || displayedProposal?.cancellationTerms) && (
              <div className="space-y-2 pt-2 text-xs border-t border-[#E5E4DF]">
                {displayedProposal?.notes && (
                  <div>
                    <span className="font-bold text-zinc-500 uppercase text-[10px] block">
                      Creative Notes
                    </span>
                    <p className="text-zinc-700 mt-0.5">{displayedProposal.notes}</p>
                  </div>
                )}
                {displayedProposal?.cancellationTerms && (
                  <div>
                    <span className="font-bold text-zinc-500 uppercase text-[10px] block">
                      Cancellation Terms
                    </span>
                    <p className="text-zinc-700 mt-0.5">{displayedProposal.cancellationTerms}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ─── RIGHT COLUMN (5 COLS): BILATERAL SIGNOFF & ACTIVITY ──────────────── */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. Bilateral Signoff Card */}
          <div className="p-6 rounded-2xl bg-white border border-[#E5E4DF] shadow-xs space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-700" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A]">
                  Bilateral Cryptographic Signoff
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Both parties must independently sign the exact same canonical terms version to
                activate execution.
              </p>
            </div>

            {/* Partner Status Indicators */}
            <div className="space-y-3">
              {/* Brand Status */}
              <div className="p-3.5 rounded-xl border border-[#E5E4DF] bg-[#FAF9F6] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs",
                      brandApproved ? "bg-emerald-600 text-white" : "bg-zinc-200 text-zinc-600"
                    )}
                  >
                    {brandApproved ? "✓" : "•"}
                  </div>
                  <div>
                    <div className="font-bold text-[#0A0A0A]">{deal.brandName}</div>
                    <div className="text-[10px] text-zinc-500">Brand Signoff</div>
                  </div>
                </div>
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md",
                    brandApproved ? "bg-emerald-50 text-emerald-800" : "bg-zinc-100 text-zinc-600"
                  )}
                >
                  {brandApproved ? "Executed" : "Pending"}
                </span>
              </div>

              {/* Creator Status */}
              <div className="p-3.5 rounded-xl border border-[#E5E4DF] bg-[#FAF9F6] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs",
                      creatorApproved ? "bg-emerald-600 text-white" : "bg-zinc-200 text-zinc-600"
                    )}
                  >
                    {creatorApproved ? "✓" : "•"}
                  </div>
                  <div>
                    <div className="font-bold text-[#0A0A0A]">{deal.influencerName}</div>
                    <div className="text-[10px] text-zinc-500">Creator Signoff</div>
                  </div>
                </div>
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md",
                    creatorApproved ? "bg-emerald-50 text-emerald-800" : "bg-zinc-100 text-zinc-600"
                  )}
                >
                  {creatorApproved ? "Executed" : "Pending"}
                </span>
              </div>
            </div>

            {/* SHA-256 Canonical Hash Pill */}
            {displayedProposal?.termsHash && (
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Canonical SHA-256 Digest
                </span>
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-700 truncate">
                  <span className="truncate">{displayedProposal.termsHash}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(displayedProposal.termsHash);
                      toast.info("Canonical hash copied to clipboard.");
                    }}
                    className="ml-2 text-zinc-400 hover:text-[#0A0A0A] cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {!isConfirmed && !isViewingHistorical && (
              <div className="space-y-2 pt-2 border-t border-[#E5E4DF]">
                {!userHasApproved ? (
                  <Button
                    onClick={() => confirmMutation.mutate()}
                    disabled={confirmMutation.isPending}
                    className="w-full bg-[#0A0A0A] hover:bg-zinc-800 text-white text-xs font-semibold py-2.5 rounded-xl shadow-xs"
                  >
                    {confirmMutation.isPending
                      ? "Signing Terms..."
                      : `Accept & Sign Version ${deal.activeProposal?.version}`}
                  </Button>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center text-xs font-semibold text-emerald-800">
                    ✓ You have signed this version. Waiting on partner.
                  </div>
                )}

                <Button
                  variant="outline"
                  onClick={openCounterModalPrefilled}
                  className="w-full text-xs font-semibold rounded-xl border-[#E5E4DF] bg-white hover:bg-[#FAF9F6] shadow-xs"
                >
                  Counter-Propose Terms
                </Button>
              </div>
            )}

            {/* Post-Confirmation Execution & Settlement Lifecycle */}
            {isConfirmed && !isViewingHistorical && (
              <div className="space-y-3 pt-3 border-t border-[#E5E4DF]">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#0A0A0A]">Execution Stage:</span>
                  <span className="px-2 py-0.5 rounded-md font-semibold text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {deal.executionStatus || "EXECUTION_READY"}
                  </span>
                </div>

                {/* Creator Content Package Submission */}
                {userParty === "creator" && deal.executionStatus !== "COMPLETED" && (
                  <div className="space-y-2">
                    {deal.executionStatus === "FINAL_CONTENT_SUBMITTED" ? (
                      <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-center text-xs font-semibold text-blue-900">
                        ✓ Deliverable package submitted. Awaiting brand review &amp; payout release.
                      </div>
                    ) : (
                      <Button
                        onClick={() => setShowSubmissionModal(true)}
                        className="w-full bg-[#0A0A0A] hover:bg-zinc-800 text-white text-xs font-semibold py-2.5 rounded-xl shadow-xs"
                      >
                        Submit Deliverable Package
                      </Button>
                    )}
                  </div>
                )}

                {/* Brand Review Actions */}
                {userParty === "brand" && deal.executionStatus === "FINAL_CONTENT_SUBMITTED" && (
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
                      Deliverable package received. Review content and approve or request revision.
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => reviewMutation.mutate({ action: "approve" })}
                        disabled={reviewMutation.isPending}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl"
                      >
                        Approve Package
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          reviewMutation.mutate({
                            action: "request_revision",
                            notes: "Please adjust ending CTA.",
                          })
                        }
                        disabled={reviewMutation.isPending}
                        className="text-xs font-semibold rounded-xl border-[#E5E4DF]"
                      >
                        Request Revision
                      </Button>
                    </div>
                  </div>
                )}

                {/* Brand Payment Settlement */}
                {userParty === "brand" &&
                  deal.executionStatus === "COMPLETED" &&
                  deal.paymentStatus !== "PAYOUT_RELEASED" && (
                    <div className="space-y-2">
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                        Content approved! Release milestone payment settlement to creator.
                      </div>
                      <Button
                        onClick={() => settlePaymentMutation.mutate()}
                        disabled={settlePaymentMutation.isPending}
                        className="w-full bg-[#0A0A0A] hover:bg-zinc-800 text-white text-xs font-semibold py-2.5 rounded-xl shadow-xs"
                      >
                        Release &amp; Settle Payout
                      </Button>
                    </div>
                  )}

                {deal.paymentStatus === "PAYOUT_RELEASED" && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center text-xs font-semibold text-emerald-800">
                    ✓ Milestone Payout Settled &amp; Released to Creator
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Live Deal Activity Timeline */}
          <div className="p-6 rounded-2xl bg-white border border-[#E5E4DF] shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-700" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A]">
                Negotiation Audit Trail
              </span>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {deal.activityLogs?.map((log: any) => (
                <div key={log.id} className="text-xs flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <p className="font-semibold text-[#0A0A0A]">{log.description}</p>
                    <span className="text-[10px] text-zinc-400 font-tabular">
                      {new Date(log.createdAt).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. COUNTER-PROPOSAL MODAL (WITH OPTIMISTIC LOCKING) ─────────────────── */}
      <Dialog open={showCounterModal} onOpenChange={setShowCounterModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-6 bg-[#FAF9F6] border border-[#E5E4DF] rounded-2xl shadow-2xl antialiased text-[#0A0A0A]">
          <DialogHeader className="pb-3 border-b border-[#E5E4DF]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60 w-fit">
              OPTIMISTIC COUNTER-PROPOSAL
            </span>
            <DialogTitle className="text-lg font-bold text-[#0A0A0A] mt-1.5">
              Submit Counter-Offer (Version {(deal.activeProposal?.version || 1) + 1})
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Proposing revised terms will advance the contract version and notify your partner for
              re-approval.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Commercial Model Toggle */}
            <div className="grid grid-cols-3 gap-2">
              {(["paid", "barter", "hybrid"] as const).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setCounterCollabType(t)}
                  className={cn(
                    "py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer",
                    counterCollabType === t
                      ? "bg-[#0A0A0A] text-white border-[#0A0A0A]"
                      : "bg-white text-zinc-600 border-[#E5E4DF]"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Price Field */}
            {(counterCollabType === "paid" || counterCollabType === "hybrid") && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">
                  Proposed Cash Compensation (INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-zinc-400 text-xs font-bold">₹</span>
                  <input
                    type="number"
                    value={counterPriceINR}
                    onChange={(e) => setCounterPriceINR(e.target.value)}
                    className="w-full h-9 pl-7 pr-3 rounded-lg bg-white border border-[#E5E4DF] text-xs font-bold text-[#0A0A0A]"
                  />
                </div>
              </div>
            )}

            {/* Barter Fields */}
            {(counterCollabType === "barter" || counterCollabType === "hybrid") && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">
                  Barter Goods Description
                </label>
                <input
                  type="text"
                  value={counterBarterDesc}
                  onChange={(e) => setCounterBarterDesc(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-white border border-[#E5E4DF] text-xs font-medium text-[#0A0A0A]"
                />
              </div>
            )}

            {/* Deliverables List */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase">
                Deliverables Scope
              </label>
              {counterDeliverables.map((deliv, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={deliv.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCounterDeliverables((prev) =>
                        prev.map((d, i) => (i === idx ? { ...d, title: val } : d))
                      );
                    }}
                    className="flex-1 h-9 px-3 rounded-lg bg-white border border-[#E5E4DF] text-xs font-medium text-[#0A0A0A]"
                  />
                  <input
                    type="number"
                    min={1}
                    value={deliv.count}
                    onChange={(e) => {
                      const count = parseInt(e.target.value, 10) || 1;
                      setCounterDeliverables((prev) =>
                        prev.map((d, i) => (i === idx ? { ...d, count } : d))
                      );
                    }}
                    className="w-16 h-9 px-2 rounded-lg bg-white border border-[#E5E4DF] text-xs font-medium text-[#0A0A0A]"
                  />
                </div>
              ))}
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase">
                Negotiation Notes / Counter Justification
              </label>
              <textarea
                rows={3}
                placeholder="Explain why terms are modified (e.g. additional deliverable requires higher budget)..."
                value={counterNotes}
                onChange={(e) => setCounterNotes(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-white border border-[#E5E4DF] text-xs text-[#0A0A0A]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E4DF]">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCounterModal(false)}
              className="rounded-lg text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={counterMutation.isPending}
              onClick={() => counterMutation.mutate()}
              className="rounded-lg bg-[#0A0A0A] hover:bg-zinc-800 text-white text-xs font-semibold"
            >
              {counterMutation.isPending ? "Dispatching..." : "Submit Counter-Offer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deliverable Package Submission Modal */}
      <Dialog open={showSubmissionModal} onOpenChange={setShowSubmissionModal}>
        <DialogContent className="max-w-md bg-[#FAF9F6] border border-[#E5E4DF] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0A0A0A]">
              Submit Deliverable Package
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Provide live content URLs or preview drive links for brand review &amp; signoff.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase">
                Content / Video URL *
              </label>
              <input
                type="url"
                placeholder="https://instagram.com/reel/... or https://drive.google.com/..."
                value={submissionLink}
                onChange={(e) => setSubmissionLink(e.target.value)}
                className="w-full h-10 px-3.5 rounded-lg bg-white border border-[#E5E4DF] text-xs text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-blue-700/20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase">
                Notes for Brand
              </label>
              <textarea
                rows={3}
                placeholder="Include audio credits, caption draft, or any specific notes for review..."
                value={submissionNotes}
                onChange={(e) => setSubmissionNotes(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-white border border-[#E5E4DF] text-xs text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-blue-700/20"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E4DF]">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSubmissionModal(false)}
              className="rounded-lg text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={submissionMutation.isPending}
              onClick={() => submissionMutation.mutate()}
              className="rounded-lg bg-[#0A0A0A] hover:bg-zinc-800 text-white text-xs font-semibold"
            >
              {submissionMutation.isPending ? "Submitting..." : "Submit Package"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
