import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  ArrowRight,
  ShieldCheck,
  Briefcase,
  Search,
  ChevronRight,
  Inbox,
  Send,
  Sparkles,
  Layers,
  Building2,
  User,
  Package,
  IndianRupee,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DealProposalWizard from "@/components/deals/DealProposalWizard";
import { cn } from "@/lib/utils";

type DealsTab = "all" | "action_required" | "waiting" | "accepted" | "completed";

export default function DealsDirectory() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const isCreator = user?.role === "influencer" || (user?.role as string) === "creator";
  const userParty = isCreator ? "creator" : "brand";

  const [activeTab, setActiveTab] = useState<DealsTab>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);

  // Fetch User's Deals
  const { data: deals = [], isLoading: isLoadingDeals } = useQuery<any[]>({
    queryKey: ["deals"],
    queryFn: async () => {
      const res = await fetch("/api/deals");
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Filter deals by role-aware status
  const categorizedDeals = useMemo(() => {
    return deals.map((d) => {
      const isAccepted = d.agreementStatus === "ACCEPTED" || d.agreementStatus === "CONFIRMED";
      const isCompleted = d.executionStatus === "COMPLETED";

      const brandApproved = d.approvals?.some((a: any) => a.party === "brand");
      const creatorApproved = d.approvals?.some((a: any) => a.party === "creator");
      const myApproved = userParty === "brand" ? brandApproved : creatorApproved;
      const otherApproved = userParty === "brand" ? creatorApproved : brandApproved;

      const proposedByMe = d.activeProposal?.proposedByParty === userParty;

      let requiresMyAction = false;
      let waitingOnPartner = false;

      if (!isAccepted && d.agreementStatus !== "DECLINED" && d.agreementStatus !== "CANCELLED") {
        if (!proposedByMe && !myApproved) {
          requiresMyAction = true;
        } else if (proposedByMe && !otherApproved) {
          waitingOnPartner = true;
        } else if (myApproved && !otherApproved) {
          waitingOnPartner = true;
        }
      }

      return {
        ...d,
        isAccepted,
        isCompleted,
        requiresMyAction,
        waitingOnPartner,
        brandApproved,
        creatorApproved,
      };
    });
  }, [deals, userParty]);

  const counts = useMemo(() => {
    return {
      all: categorizedDeals.length,
      action_required: categorizedDeals.filter((d) => d.requiresMyAction).length,
      waiting: categorizedDeals.filter((d) => d.waitingOnPartner).length,
      accepted: categorizedDeals.filter((d) => d.isAccepted && !d.isCompleted).length,
      completed: categorizedDeals.filter((d) => d.isCompleted).length,
    };
  }, [categorizedDeals]);

  const filteredDeals = useMemo(() => {
    return categorizedDeals.filter((d) => {
      if (activeTab === "action_required" && !d.requiresMyAction) return false;
      if (activeTab === "waiting" && !d.waitingOnPartner) return false;
      if (activeTab === "accepted" && (!d.isAccepted || d.isCompleted)) return false;
      if (activeTab === "completed" && !d.isCompleted) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const titleMatch = d.title?.toLowerCase().includes(q);
        const brandMatch = d.brandName?.toLowerCase().includes(q);
        const creatorMatch = d.influencerName?.toLowerCase().includes(q);
        if (!titleMatch && !brandMatch && !creatorMatch) return false;
      }

      return true;
    });
  }, [categorizedDeals, activeTab, searchTerm]);

  return (
    <div className="workspace-canvas space-y-6 pb-16 antialiased text-[#0A0A0A]">
      {/* ─── 1. PAGE HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-4 border-b border-[#E5E4DF]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60">
              COMMERCIAL CONTRACTS
            </span>
            <span className="text-zinc-400">•</span>
            <span className="text-xs font-semibold text-zinc-500">
              Immutable Versioned Negotiation Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0A0A0A]">
            Deal <span className="font-serif italic font-normal text-blue-700">Rooms</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-2xl">
            Propose collaborations, negotiate dynamic deliverables and timelines with optimistic
            locking, and execute cryptographic SHA-256 signoffs.
          </p>
        </div>

        {/* Action Button: Propose New Deal */}
        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setWizardOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0A0A0A] hover:bg-zinc-800 text-white text-xs font-semibold transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Propose New Deal</span>
          </Button>
        </div>
      </div>

      {/* ─── 2. ROLE-AWARE TABS & SEARCH ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Role-Aware Tabs */}
        <div className="inline-flex items-center p-1 rounded-xl bg-[#F2F1EC] border border-[#E5E4DF] overflow-x-auto">
          {(
            [
              { id: "all", label: "All Deals", count: counts.all },
              { id: "action_required", label: "Action Required", count: counts.action_required },
              { id: "waiting", label: "Waiting on Partner", count: counts.waiting },
              { id: "accepted", label: "Mutually Accepted", count: counts.accepted },
              { id: "completed", label: "Completed", count: counts.completed },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer",
                activeTab === tab.id
                  ? "bg-white text-[#0A0A0A] shadow-xs"
                  : "text-zinc-600 hover:text-[#0A0A0A]"
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "text-[10px] font-bold px-1.5 py-0.2 rounded-md font-tabular",
                  activeTab === tab.id
                    ? "bg-[#0A0A0A] text-white"
                    : "bg-white/80 text-zinc-600 border border-[#E5E4DF]"
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search deals by title or partner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 pl-8 pr-3 rounded-lg bg-white border border-[#E5E4DF] text-xs font-medium text-[#0A0A0A] placeholder:text-zinc-400 focus:outline-none focus:border-[#0A0A0A] shadow-xs"
          />
        </div>
      </div>

      {/* ─── 3. FULL-WIDTH HAIRLINE LEDGER ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E5E4DF] divide-y divide-[#E5E4DF] shadow-xs overflow-hidden">
        {isLoadingDeals ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin mx-auto" />
            <p className="text-xs font-semibold text-zinc-500">Loading commercial deal rooms...</p>
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F2F1EC] flex items-center justify-center mx-auto text-zinc-400">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#0A0A0A]">No deals found</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              {activeTab !== "all"
                ? `No commercial deals match the "${activeTab.replace("_", " ")}" filter.`
                : "You don't have any active deal rooms yet. Initiate a deal or review incoming opportunities."}
            </p>
            <Button
              onClick={() => setWizardOpen(true)}
              className="mt-2 rounded-lg bg-[#0A0A0A] text-white text-xs font-semibold shadow-xs"
            >
              Propose Deal
            </Button>
          </div>
        ) : (
          filteredDeals.map((deal) => {
            const activeProp = deal.activeProposal;
            const collabType = activeProp?.collabType || "paid";
            const versionNum = activeProp?.version || 1;

            const displayAmount =
              collabType === "barter"
                ? "Product Barter"
                : activeProp?.pricePaise
                  ? `₹${Math.round(activeProp.pricePaise / 100).toLocaleString("en-IN")}`
                  : "₹45,000";

            return (
              <div
                key={deal.id}
                className="p-5 sm:p-6 transition-colors hover:bg-[#FAF9F6] flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                {/* Left: Deal Metadata & Badges */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-[#FAF9F6] border border-[#E5E4DF] flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-blue-700" />
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/deals/${deal.id}`}
                        className="text-sm font-bold text-[#0A0A0A] hover:text-blue-700 transition-colors"
                      >
                        {deal.title}
                      </Link>

                      {/* Current Version Badge */}
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#F2F1EC] text-zinc-700 border border-[#E5E4DF] font-tabular">
                        v{versionNum}
                      </span>

                      {/* Collaboration Type Pill */}
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider",
                          collabType === "barter"
                            ? "bg-purple-50 text-purple-700 border border-purple-200/70"
                            : collabType === "hybrid"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200/70"
                              : "bg-blue-50 text-blue-700 border border-blue-200/70"
                        )}
                      >
                        {collabType}
                      </span>

                      {/* Agreement Status */}
                      <span
                        className={cn(
                          "ml-auto sm:ml-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          deal.isAccepted
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200/70"
                            : deal.requiresMyAction
                              ? "bg-amber-50 text-amber-800 border border-amber-200/70"
                              : "bg-zinc-100 text-zinc-600 border border-zinc-200"
                        )}
                      >
                        {deal.isAccepted
                          ? "Terms Confirmed"
                          : deal.requiresMyAction
                            ? "Review Required"
                            : "Waiting on Partner"}
                      </span>
                    </div>

                    {/* Counterparty & Date Info */}
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      <span>
                        {isCreator
                          ? `Brand: ${deal.brandName || "Brand Partner"}`
                          : `Creator: ${deal.influencerName || "Creator Partner"}`}
                      </span>
                      <span className="text-zinc-300">•</span>
                      <span className="font-tabular">
                        Updated{" "}
                        {new Date(deal.updatedAt).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    {/* Deliverables summary */}
                    {activeProp?.deliverables && activeProp.deliverables.length > 0 && (
                      <p className="text-xs text-zinc-600 line-clamp-1">
                        Scope:{" "}
                        {activeProp.deliverables
                          .map((d: any) => `${d.count || d.quantity || 1}x ${d.title}`)
                          .join(", ")}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Bilateral Signoff Indicators & Action */}
                <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#E5E4DF]">
                  {/* Total Value */}
                  <div className="text-left lg:text-right">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                      Agreed Compensation
                    </span>
                    <span className="text-base sm:text-lg font-bold font-tabular text-[#0A0A0A]">
                      {displayAmount}
                    </span>
                  </div>

                  {/* Dual Signoff Indicators */}
                  <div className="flex items-center gap-2 text-[11px] font-medium">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border",
                        deal.brandApproved
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-zinc-50 text-zinc-500 border-zinc-200"
                      )}
                    >
                      <span>Brand</span>
                      {deal.brandApproved ? "✓" : "—"}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border",
                        deal.creatorApproved
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-zinc-50 text-zinc-500 border-zinc-200"
                      )}
                    >
                      <span>Creator</span>
                      {deal.creatorApproved ? "✓" : "—"}
                    </span>

                    <Link
                      href={`/deals/${deal.id}`}
                      className="ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A0A0A] hover:bg-zinc-800 text-white text-xs font-semibold transition-colors shadow-xs"
                    >
                      <span>Negotiation Room</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ─── 4. PROPOSE DEAL WIZARD MODAL ────────────────────────────────────────── */}
      <DealProposalWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        initialRole={isCreator ? "creator" : "brand"}
      />
    </div>
  );
}
