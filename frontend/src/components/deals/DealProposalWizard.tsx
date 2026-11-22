import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Plus,
  Trash2,
  Calendar,
  IndianRupee,
  Package,
  Layers,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Sparkles,
  Building2,
  User,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DeliverableFormItem {
  id: string;
  platform: string;
  contentType: string;
  quantity: number;
  specs: string;
  publishingRequirement: string;
  deadline: string;
}

interface DealProposalWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialRole?: "brand" | "creator";
  initialCounterpartyId?: number;
  initialCampaignId?: number;
  onSuccess?: (newDeal: any) => void;
}

const CONTENT_TYPES = [
  "Instagram Reels",
  "YouTube Videos",
  "YouTube Shorts",
  "Instagram Stories",
  "Static Posts",
  "Carousel Posts",
  "Product Photography",
  "UGC Videos",
  "Live Sessions",
  "Other",
] as const;

export default function DealProposalWizard({
  open,
  onOpenChange,
  initialRole,
  initialCounterpartyId,
  initialCampaignId,
  onSuccess,
}: DealProposalWizardProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const isCreator = initialRole
    ? initialRole === "creator"
    : user?.role === "influencer" || (user?.role as string) === "creator";

  // Step Tracker (1 to 5)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // ─── Step 1: Basic Information ─────────────────────────────────────────────
  const [dealTitle, setDealTitle] = useState("");
  const [counterpartyId, setCounterpartyId] = useState<string>(
    initialCounterpartyId ? String(initialCounterpartyId) : ""
  );
  const [campaignId, setCampaignId] = useState<string>(
    initialCampaignId ? String(initialCampaignId) : ""
  );
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["Instagram"]);
  const [overviewNotes, setOverviewNotes] = useState("");

  // ─── Step 2: Dynamic Deliverables ──────────────────────────────────────────
  const [deliverables, setDeliverables] = useState<DeliverableFormItem[]>([
    {
      id: "deliv-1",
      platform: "Instagram",
      contentType: "Instagram Reels",
      quantity: 1,
      specs: "9:16 60s Reel with audio sync & brand tag",
      publishingRequirement: "Collaborator tag + link sticker in story",
      deadline: "",
    },
  ]);

  // ─── Step 3: Commercial Terms ──────────────────────────────────────────────
  const [collabType, setCollabType] = useState<"paid" | "barter" | "hybrid">("paid");
  const [fixedPriceINR, setFixedPriceINR] = useState<string>("45000");
  const [barterProductDesc, setBarterProductDesc] = useState("");
  const [barterQuantity, setBarterQuantity] = useState("1");
  const [barterValuationINR, setBarterValuationINR] = useState("5000");
  const [barterShippingBy, setBarterShippingBy] = useState<"brand" | "creator">("brand");

  // ─── Step 4: Timelines & Legal ─────────────────────────────────────────────
  const [startDate, setStartDate] = useState("");
  const [productDeliveryDate, setProductDeliveryDate] = useState("");
  const [contentSubmissionDate, setContentSubmissionDate] = useState("");
  const [publishingDate, setPublishingDate] = useState("");
  const [finalApprovalDate, setFinalApprovalDate] = useState("");
  const [revisionCount, setRevisionCount] = useState("2");
  const [usageRightsDays, setUsageRightsDays] = useState("30");
  const [paidAdsPermission, setPaidAdsPermission] = useState(false);
  const [exclusivityDays, setExclusivityDays] = useState("0");
  const [cancellationTerms, setCancellationTerms] = useState(
    "50% kill fee once initial draft is submitted; 100% commitment once published."
  );

  // Preload Counterparties
  const { data: creatorOptions = [] } = useQuery<
    Array<{ id: number; name?: string; handle?: string }>
  >({
    queryKey: ["creatorsDropdown"],
    queryFn: async () => {
      const res = await fetch("/api/influencers");
      if (!res.ok) return [];
      const json = await res.json();
      return json.map((inf: any) => ({
        id: inf.id,
        name: inf.user?.name || inf.name || `Creator #${inf.id}`,
        handle: inf.instagramHandle || `@creator_${inf.id}`,
      }));
    },
    enabled: !isCreator && open,
  });

  const { data: brandOptions = [] } = useQuery<
    Array<{ id: number; name?: string; companyName?: string }>
  >({
    queryKey: ["brandsDropdown"],
    queryFn: async () => {
      const res = await fetch("/api/campaigns");
      if (!res.ok) return [];
      const json = await res.json();
      const unique = new Map<number, { id: number; name: string }>();
      json.forEach((c: any) => {
        if (c.brandId && !unique.has(c.brandId)) {
          unique.set(c.brandId, {
            id: c.brandId,
            name: c.brandName || `Brand #${c.brandId}`,
          });
        }
      });
      return Array.from(unique.values());
    },
    enabled: isCreator && open,
  });

  // Preload Campaigns if Brand
  const { data: brandCampaigns = [] } = useQuery<Array<{ id: number; title: string }>>({
    queryKey: ["brandCampaignsDropdown"],
    queryFn: async () => {
      const res = await fetch("/api/campaigns/my");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !isCreator && open,
  });

  // Reset or initialize counterparty when initialCounterpartyId updates
  useEffect(() => {
    if (initialCounterpartyId) {
      setCounterpartyId(String(initialCounterpartyId));
    }
  }, [initialCounterpartyId]);

  // Deliverables helper
  const addDeliverable = () => {
    setDeliverables((prev) => [
      ...prev,
      {
        id: `deliv-${Date.now()}`,
        platform: selectedPlatforms[0] || "Instagram",
        contentType: "Instagram Reels",
        quantity: 1,
        specs: "",
        publishingRequirement: "",
        deadline: "",
      },
    ]);
  };

  const removeDeliverable = (id: string) => {
    if (deliverables.length === 1) {
      toast.warning("At least one deliverable is required in the commercial proposal.");
      return;
    }
    setDeliverables((prev) => prev.filter((d) => d.id !== id));
  };

  const updateDeliverable = (id: string, field: keyof DeliverableFormItem, val: any) => {
    setDeliverables((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: val } : d)));
  };

  // Submit Mutation
  const createDealMutation = useMutation({
    mutationFn: async () => {
      const targetBrandId = isCreator ? Number(counterpartyId) : undefined;
      const targetInfluencerId = !isCreator ? Number(counterpartyId) : undefined;

      const pricePaise = collabType === "barter" ? 0 : Math.round(Number(fixedPriceINR || 0) * 100);

      const barterDetails =
        collabType === "barter" || collabType === "hybrid"
          ? {
              productDescription: barterProductDesc.trim(),
              quantity: Number(barterQuantity) || 1,
              estimatedValuePaise: Math.round(Number(barterValuationINR || 0) * 100),
              shippingBy: barterShippingBy,
            }
          : null;

      const timelines = {
        startDate: startDate || undefined,
        productDeliveryDate: productDeliveryDate || undefined,
        contentSubmissionDate: contentSubmissionDate || undefined,
        publishingDate: publishingDate || undefined,
        finalApprovalDate: finalApprovalDate || undefined,
      };

      const payload = {
        title: dealTitle.trim() || `${isCreator ? "Creator" : "Brand"} Commercial Proposal`,
        brandId: targetBrandId,
        influencerId: targetInfluencerId,
        campaignId: campaignId ? Number(campaignId) : undefined,
        collabType,
        deliverables: deliverables.map((d) => ({
          title: `${d.quantity}x ${d.contentType}`,
          platform: d.platform,
          contentType: d.contentType,
          quantity: d.quantity,
          specs: d.specs,
          publishingRequirement: d.publishingRequirement,
          deadline: d.deadline || contentSubmissionDate || undefined,
        })),
        pricePaise,
        currency: "INR",
        barterDetails,
        timelines,
        paidAdsPermission,
        cancellationTerms,
        usageRightsDays: Number(usageRightsDays) || 30,
        exclusivityDays: Number(exclusivityDays) || 0,
        revisionCount: Number(revisionCount) || 1,
        notes: overviewNotes,
      };

      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create deal proposal");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Deal Proposal (v1) dispatched successfully!");
      onOpenChange(false);
      if (onSuccess) {
        onSuccess(data);
      } else if (data?.id) {
        setLocation(`/deals/${data.id}`);
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to dispatch deal proposal");
    },
  });

  // Step Validation
  const validateAndProceed = () => {
    if (currentStep === 1) {
      if (!dealTitle.trim()) {
        toast.error("Please enter a deal title.");
        return;
      }
      if (!counterpartyId) {
        toast.error(`Please select a ${isCreator ? "Brand" : "Creator"} counterparty.`);
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (deliverables.some((d) => !d.contentType)) {
        toast.error("Please select a content format for every deliverable row.");
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (collabType === "paid" || collabType === "hybrid") {
        if (!fixedPriceINR || Number(fixedPriceINR) <= 0) {
          toast.error("Please enter a valid cash compensation amount in INR.");
          return;
        }
      }
      if (collabType === "barter" || collabType === "hybrid") {
        if (!barterProductDesc.trim()) {
          toast.error("Please provide the product barter description.");
          return;
        }
      }
      setCurrentStep(4);
    } else if (currentStep === 4) {
      setCurrentStep(5);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 bg-[#FAF9F6] border border-[#E5E4DF] rounded-2xl shadow-2xl antialiased text-[#0A0A0A]">
        {/* ─── HEADER & STEPPER ─────────────────────────────────────────────────── */}
        <div className="sticky top-0 z-20 bg-[#FAF9F6]/95 backdrop-blur-md p-6 border-b border-[#E5E4DF]">
          <div className="flex items-center justify-between mb-3">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-[#FDF6F7] text-[#6A0D18] border border-[#EED8DC]">
              5-STEP DEAL BUILDER
            </span>
            <span className="text-xs font-semibold text-zinc-500 font-tabular">
              Step {currentStep} of 5
            </span>
          </div>

          <DialogTitle className="text-xl font-bold tracking-tight text-[#0A0A0A]">
            Propose a Commercial{" "}
            <span className="font-serif italic font-normal text-[#6A0D18]">Deal</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 mt-0.5">
            Structured, versioned collaboration contract with immutable SHA-256 canonical hashing.
          </DialogDescription>

          {/* Stepper Progress Bar */}
          <div className="grid grid-cols-5 gap-1.5 mt-4">
            {[
              { num: 1, label: "Basics" },
              { num: 2, label: "Deliverables" },
              { num: 3, label: "Commercials" },
              { num: 4, label: "Timelines" },
              { num: 5, label: "Review" },
            ].map((s) => (
              <div key={s.num} className="space-y-1">
                <div
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    currentStep >= s.num ? "bg-[#0A0A0A]" : "bg-[#E5E4DF]"
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] font-semibold block truncate",
                    currentStep === s.num ? "text-[#0A0A0A]" : "text-zinc-400"
                  )}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── BODY STEP CONTENT ───────────────────────────────────────────────── */}
        <div className="p-6 space-y-6">
          {/* ═══ STEP 1: BASIC INFORMATION ══════════════════════════════════════ */}
          {currentStep === 1 && (
            <div className="space-y-4">
              {/* Deal Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider">
                  Deal Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Festive Skincare Launch Reel + Story Series"
                  value={dealTitle}
                  onChange={(e) => setDealTitle(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-white border border-[#E5E4DF] text-xs font-medium text-[#0A0A0A] placeholder:text-zinc-400 focus:outline-none focus:border-[#0A0A0A] shadow-xs"
                />
              </div>

              {/* Counterparty Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider">
                    {isCreator ? "Target Brand *" : "Target Creator *"}
                  </label>
                  <select
                    value={counterpartyId}
                    onChange={(e) => setCounterpartyId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-white border border-[#E5E4DF] text-xs font-medium text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] shadow-xs cursor-pointer"
                  >
                    <option value="">Select partner...</option>
                    {isCreator
                      ? brandOptions.map((b) => (
                          <option key={b.id} value={String(b.id)}>
                            {b.name}
                          </option>
                        ))
                      : creatorOptions.map((c) => (
                          <option key={c.id} value={String(c.id)}>
                            {c.name} ({c.handle})
                          </option>
                        ))}
                  </select>
                </div>

                {/* Optional Campaign Link */}
                {!isCreator && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider">
                      Link to Campaign (Optional)
                    </label>
                    <select
                      value={campaignId}
                      onChange={(e) => setCampaignId(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-white border border-[#E5E4DF] text-xs font-medium text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] shadow-xs cursor-pointer"
                    >
                      <option value="">Direct Proposal (No Campaign)</option>
                      {brandCampaigns.map((c) => (
                        <option key={c.id} value={String(c.id)}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Platforms */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider">
                  Primary Platforms
                </label>
                <div className="flex flex-wrap gap-2">
                  {["Instagram", "YouTube", "TikTok", "LinkedIn", "Other"].map((p) => {
                    const isSelected = selectedPlatforms.includes(p);
                    return (
                      <button
                        type="button"
                        key={p}
                        onClick={() => {
                          setSelectedPlatforms((prev) =>
                            isSelected ? prev.filter((item) => item !== p) : [...prev, p]
                          );
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                          isSelected
                            ? "liquid-burgundy-metal font-bold shadow-xs"
                            : "bg-white text-zinc-600 border border-[#E5E4DF] hover:border-zinc-400"
                        )}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Overview Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider">
                  Campaign / Deal Overview
                </label>
                <textarea
                  rows={3}
                  placeholder="Summarize the core creative objective, theme, target hooks, or mood..."
                  value={overviewNotes}
                  onChange={(e) => setOverviewNotes(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white border border-[#E5E4DF] text-xs font-medium text-[#0A0A0A] placeholder:text-zinc-400 focus:outline-none focus:border-[#0A0A0A] shadow-xs"
                />
              </div>
            </div>
          )}

          {/* ═══ STEP 2: DYNAMIC DELIVERABLES BUILDER ═══════════════════════════ */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#0A0A0A]">Deliverables Breakdown</h3>
                  <p className="text-xs text-zinc-500">
                    Configure content formats, quantity, and requirements.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addDeliverable}
                  className="rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 border-[#E5E4DF] bg-white shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Deliverable</span>
                </Button>
              </div>

              <div className="space-y-3">
                {deliverables.map((d, index) => (
                  <div
                    key={d.id}
                    className="p-4 rounded-xl bg-white border border-[#E5E4DF] shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#6A0D18]">
                        Item #{index + 1}
                      </span>
                      {deliverables.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeDeliverable(d.id)}
                          className="text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">
                          Platform
                        </label>
                        <select
                          value={d.platform}
                          onChange={(e) => updateDeliverable(d.id, "platform", e.target.value)}
                          className="w-full h-9 px-2.5 rounded-lg bg-[#FAF9F6] border border-[#E5E4DF] text-xs font-medium text-[#0A0A0A]"
                        >
                          <option value="Instagram">Instagram</option>
                          <option value="YouTube">YouTube</option>
                          <option value="TikTok">TikTok</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">
                          Content Format
                        </label>
                        <select
                          value={d.contentType}
                          onChange={(e) => updateDeliverable(d.id, "contentType", e.target.value)}
                          className="w-full h-9 px-2.5 rounded-lg bg-[#FAF9F6] border border-[#E5E4DF] text-xs font-medium text-[#0A0A0A]"
                        >
                          {CONTENT_TYPES.map((ct) => (
                            <option key={ct} value={ct}>
                              {ct}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={d.quantity}
                          onChange={(e) =>
                            updateDeliverable(d.id, "quantity", parseInt(e.target.value, 10) || 1)
                          }
                          className="w-full h-9 px-2.5 rounded-lg bg-[#FAF9F6] border border-[#E5E4DF] text-xs font-medium text-[#0A0A0A]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">
                          Creative Specs (Duration, Aspect, Hooks)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 60s 9:16, show packaging in first 3s"
                          value={d.specs}
                          onChange={(e) => updateDeliverable(d.id, "specs", e.target.value)}
                          className="w-full h-9 px-2.5 rounded-lg bg-[#FAF9F6] border border-[#E5E4DF] text-xs font-medium text-[#0A0A0A]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">
                          Publishing Requirement (Tags, Bio link)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Add Brand as Collaborator + Promo code in caption"
                          value={d.publishingRequirement}
                          onChange={(e) =>
                            updateDeliverable(d.id, "publishingRequirement", e.target.value)
                          }
                          className="w-full h-9 px-2.5 rounded-lg bg-[#FAF9F6] border border-[#E5E4DF] text-xs font-medium text-[#0A0A0A]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ STEP 3: COMMERCIAL TERMS (PAID | BARTER | HYBRID) ══════════════ */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-[#0A0A0A]">Commercial Model</h3>
                <p className="text-xs text-zinc-500">
                  Choose compensation structure: Cash, Barter, or Hybrid.
                </p>
              </div>

              {/* Collab Type Radio Selector */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    id: "paid" as const,
                    title: "Paid Collaboration",
                    subtitle: "100% Cash compensation",
                    icon: IndianRupee,
                  },
                  {
                    id: "barter" as const,
                    title: "Product Barter",
                    subtitle: "Zero cash, goods exchange",
                    icon: Package,
                  },
                  {
                    id: "hybrid" as const,
                    title: "Hybrid Deal",
                    subtitle: "Cash fee + Free products",
                    icon: Sparkles,
                  },
                ].map((type) => {
                  const isSelected = collabType === type.id;
                  return (
                    <div
                      key={type.id}
                      onClick={() => setCollabType(type.id)}
                      className={cn(
                        "p-4 rounded-xl border text-left cursor-pointer transition-all",
                        isSelected
                          ? "bg-white border-[#0A0A0A] ring-1 ring-[#0A0A0A] shadow-xs"
                          : "bg-white/60 border-[#E5E4DF] hover:bg-white"
                      )}
                    >
                      <type.icon
                        className={cn(
                          "w-5 h-5 mb-2",
                          isSelected ? "text-[#6A0D18]" : "text-zinc-400"
                        )}
                      />
                      <div className="text-xs font-bold text-[#0A0A0A]">{type.title}</div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">{type.subtitle}</div>
                    </div>
                  );
                })}
              </div>

              {/* Cash Field for Paid or Hybrid */}
              {(collabType === "paid" || collabType === "hybrid") && (
                <div className="p-4 rounded-xl bg-white border border-[#E5E4DF] shadow-xs space-y-2">
                  <label className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider flex items-center justify-between">
                    <span>Total Fixed Cash Compensation (INR) *</span>
                    <span className="text-[11px] text-zinc-400 font-normal">
                      All deliverables included
                    </span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-zinc-400 text-sm font-bold">
                      ₹
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={fixedPriceINR}
                      onChange={(e) => setFixedPriceINR(e.target.value)}
                      className="w-full h-10 pl-8 pr-3 rounded-lg bg-[#FAF9F6] border border-[#E5E4DF] text-sm font-bold font-tabular text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
                    />
                  </div>
                </div>
              )}

              {/* Barter Fields for Barter or Hybrid */}
              {(collabType === "barter" || collabType === "hybrid") && (
                <div className="p-4 rounded-xl bg-white border border-[#EED8DC] bg-[#FDF6F7]/60 shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#6A0D18]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#6A0D18]">
                      Product Barter Specification
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-600 uppercase">
                      Product Description / Variants *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1x Complete Hydration Skincare Kit (Cleanser, Serum, Cream)"
                      value={barterProductDesc}
                      onChange={(e) => setBarterProductDesc(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg bg-white border border-[#E5E4DF] text-xs font-medium text-[#0A0A0A]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-600 uppercase block mb-1">
                        Item Quantity
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={barterQuantity}
                        onChange={(e) => setBarterQuantity(e.target.value)}
                        className="w-full h-9 px-2.5 rounded-lg bg-white border border-[#E5E4DF] text-xs font-medium text-[#0A0A0A]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-zinc-600 uppercase block mb-1">
                        Estimated Retail Value (INR)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={barterValuationINR}
                        onChange={(e) => setBarterValuationINR(e.target.value)}
                        className="w-full h-9 px-2.5 rounded-lg bg-white border border-[#E5E4DF] text-xs font-medium text-[#0A0A0A]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-zinc-600 uppercase block mb-1">
                        Shipping Covered By
                      </label>
                      <select
                        value={barterShippingBy}
                        onChange={(e) => setBarterShippingBy(e.target.value as "brand" | "creator")}
                        className="w-full h-9 px-2.5 rounded-lg bg-white border border-[#E5E4DF] text-xs font-medium text-[#0A0A0A]"
                      >
                        <option value="brand">Brand (Standard)</option>
                        <option value="creator">Creator</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ STEP 4: TIMELINES & LEGAL CONDITIONS ═══════════════════════════ */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#0A0A0A]">Timelines &amp; Legal Terms</h3>
                <p className="text-xs text-zinc-500">
                  Define milestone deadlines, usage rights, and advertising permissions.
                </p>
              </div>

              {/* Milestone Dates Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-white border border-[#E5E4DF] shadow-xs">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">
                    Collaboration Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg bg-[#FAF9F6] border border-[#E5E4DF] text-xs font-medium text-[#0A0A0A]"
                  />
                </div>

                {(collabType === "barter" || collabType === "hybrid") && (
                  <div>
                    <label className="text-[10px] font-bold text-[#6A0D18] uppercase block mb-1">
                      Product Delivery Deadline (Target)
                    </label>
                    <input
                      type="date"
                      value={productDeliveryDate}
                      onChange={(e) => setProductDeliveryDate(e.target.value)}
                      className="w-full h-9 px-2.5 rounded-lg bg-[#FDF6F7] border border-[#EED8DC] text-xs font-medium text-[#0A0A0A]"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">
                    Content Draft Submission Date
                  </label>
                  <input
                    type="date"
                    value={contentSubmissionDate}
                    onChange={(e) => setContentSubmissionDate(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg bg-[#FAF9F6] border border-[#E5E4DF] text-xs font-medium text-[#0A0A0A]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">
                    Target Publishing Date
                  </label>
                  <input
                    type="date"
                    value={publishingDate}
                    onChange={(e) => setPublishingDate(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg bg-[#FAF9F6] border border-[#E5E4DF] text-xs font-medium text-[#0A0A0A]"
                  />
                </div>
              </div>

              {/* Legal & Usage Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-white border border-[#E5E4DF] shadow-xs">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">
                    Revisions Allowance
                  </label>
                  <select
                    value={revisionCount}
                    onChange={(e) => setRevisionCount(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg bg-[#FAF9F6] border border-[#E5E4DF] text-xs font-medium text-[#0A0A0A]"
                  >
                    <option value="1">1 Round of Revisions</option>
                    <option value="2">2 Rounds of Revisions</option>
                    <option value="3">3 Rounds of Revisions</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">
                    Usage Rights Window
                  </label>
                  <select
                    value={usageRightsDays}
                    onChange={(e) => setUsageRightsDays(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg bg-[#FAF9F6] border border-[#E5E4DF] text-xs font-medium text-[#0A0A0A]"
                  >
                    <option value="30">30 Days Digital Rights</option>
                    <option value="60">60 Days Digital Rights</option>
                    <option value="90">90 Days Digital Rights</option>
                    <option value="365">1 Year Commercial Rights</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">
                    Category Exclusivity
                  </label>
                  <select
                    value={exclusivityDays}
                    onChange={(e) => setExclusivityDays(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg bg-[#FAF9F6] border border-[#E5E4DF] text-xs font-medium text-[#0A0A0A]"
                  >
                    <option value="0">No Exclusivity (Standard)</option>
                    <option value="14">14 Days Post-Publishing</option>
                    <option value="30">30 Days Post-Publishing</option>
                  </select>
                </div>
              </div>

              {/* Paid Advertising Permission Toggle */}
              <div className="p-4 rounded-xl bg-white border border-[#E5E4DF] shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#0A0A0A]">
                    Paid Advertising / Spark Ads Permission
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    Permit brand to amplify published content via Meta / Google ad managers.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPaidAdsPermission(!paidAdsPermission)}
                  className={cn(
                    "w-11 h-6 rounded-full transition-colors relative cursor-pointer",
                    paidAdsPermission ? "bg-[#6A0D18]" : "bg-zinc-300"
                  )}
                >
                  <span
                    className={cn(
                      "w-4 h-4 rounded-full bg-white absolute top-1 transition-transform shadow-xs",
                      paidAdsPermission ? "right-1" : "left-1"
                    )}
                  />
                </button>
              </div>

              {/* Cancellation Terms */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider">
                  Cancellation Terms
                </label>
                <input
                  type="text"
                  value={cancellationTerms}
                  onChange={(e) => setCancellationTerms(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-white border border-[#E5E4DF] text-xs font-medium text-[#0A0A0A]"
                />
              </div>
            </div>
          )}

          {/* ═══ STEP 5: CONTRACT SUMMARY & DISPATCH ════════════════════════════ */}
          {currentStep === 5 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-[#0A0A0A]">Contract Verification Summary</h3>
                <p className="text-xs text-zinc-500">
                  Review terms before dispatching initial version (v1) to counterparty.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#E5E4DF] shadow-xs space-y-4">
                {/* Header Meta */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E5E4DF] gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6A0D18]">
                      VERSION 1 PROPOSAL
                    </span>
                    <h4 className="text-base font-bold text-[#0A0A0A]">{dealTitle}</h4>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                      Compensation
                    </span>
                    <span className="text-lg font-bold font-tabular text-[#0A0A0A]">
                      {collabType === "barter"
                        ? "Product Barter"
                        : `₹${Number(fixedPriceINR || 0).toLocaleString("en-IN")}`}
                    </span>
                    {collabType === "hybrid" && (
                      <span className="text-[11px] text-[#6A0D18] block font-semibold">
                        + Product Barter
                      </span>
                    )}
                  </div>
                </div>

                {/* Deliverables List */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider">
                    Deliverables ({deliverables.length})
                  </span>
                  <div className="divide-y divide-[#E5E4DF] rounded-xl border border-[#E5E4DF] overflow-hidden">
                    {deliverables.map((d, i) => (
                      <div
                        key={d.id}
                        className="p-3 bg-[#FAF9F6] flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-[#0A0A0A]">
                            {d.quantity}x {d.contentType}
                          </span>
                          <span className="text-zinc-500 ml-2">({d.platform})</span>
                          {d.specs && <p className="text-[11px] text-zinc-500 mt-0.5">{d.specs}</p>}
                        </div>
                        <span className="text-zinc-400 font-tabular">#{i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Barter details summary if applicable */}
                {(collabType === "barter" || collabType === "hybrid") && (
                  <div className="p-3 rounded-xl bg-[#FDF6F7] border border-[#EED8DC] text-xs space-y-1">
                    <div className="font-bold text-[#6A0D18]">
                      Barter Goods: {barterProductDesc}
                    </div>
                    <div className="text-[#6A0D18]/80">
                      Quantity: {barterQuantity} • Estimated Valuation: ₹
                      {Number(barterValuationINR).toLocaleString("en-IN")} • Shipping:{" "}
                      {barterShippingBy}
                    </div>
                  </div>
                )}

                {/* Legal Summary Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-[#FAF9F6] border border-[#E5E4DF]">
                    <span className="text-[10px] text-zinc-400 block uppercase font-bold">
                      Revisions
                    </span>
                    <span className="font-bold text-[#0A0A0A]">{revisionCount} Rounds</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FAF9F6] border border-[#E5E4DF]">
                    <span className="text-[10px] text-zinc-400 block uppercase font-bold">
                      Usage Rights
                    </span>
                    <span className="font-bold text-[#0A0A0A]">{usageRightsDays} Days</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FAF9F6] border border-[#E5E4DF]">
                    <span className="text-[10px] text-zinc-400 block uppercase font-bold">
                      Exclusivity
                    </span>
                    <span className="font-bold text-[#0A0A0A]">{exclusivityDays} Days</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FAF9F6] border border-[#E5E4DF]">
                    <span className="text-[10px] text-zinc-400 block uppercase font-bold">
                      Paid Ads
                    </span>
                    <span className="font-bold text-[#0A0A0A]">
                      {paidAdsPermission ? "Allowed" : "No"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── FOOTER CONTROLS ─────────────────────────────────────────────────── */}
        <div className="sticky bottom-0 z-20 bg-[#FAF9F6] p-4 sm:p-6 border-t border-[#E5E4DF] flex items-center justify-between gap-3">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 border-[#E5E4DF] bg-white shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-lg text-xs font-semibold text-zinc-500 hover:text-[#0A0A0A]"
            >
              Cancel
            </Button>

            {currentStep < 5 ? (
              <Button
                type="button"
                size="sm"
                onClick={validateAndProceed}
                className="rounded-lg liquid-burgundy-metal text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                disabled={createDealMutation.isPending}
                onClick={() => createDealMutation.mutate()}
                className="rounded-lg liquid-burgundy-metal hover:brightness-110 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-md disabled:opacity-50 transition-all"
              >
                {createDealMutation.isPending ? (
                  <span>Dispatching...</span>
                ) : (
                  <>
                    <span>Dispatch Proposal (v1)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
