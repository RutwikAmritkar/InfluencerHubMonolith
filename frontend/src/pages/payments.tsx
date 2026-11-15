import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import {
  Wallet,
  IndianRupee,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Lock,
  Download,
  Filter,
  Layers,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LedgerTab = "all" | "active" | "released" | "draft";

interface DealSummary {
  id: number;
  title: string;
  brandName?: string;
  influencerName?: string;
  agreementStatus: string;
  paymentStatus: string;
  executionStatus: string;
  pricePaise?: number;
  deliverables?: Array<{ title: string; count?: number }>;
  updatedAt: string;
  confirmedAt?: string;
}

export default function PaymentsPage() {
  const { user } = useAuth();
  const isCreator = user?.role === "influencer" || (user?.role as string) === "creator";
  const [activeTab, setActiveTab] = useState<LedgerTab>("all");

  const { data: deals = [], isLoading } = useQuery<DealSummary[]>({
    queryKey: ["deals"],
    queryFn: async () => {
      const res = await fetch("/api/deals");
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Calculate Metrics from Deals
  const metrics = useMemo(() => {
    let totalCommitted = 0;
    let activeSecured = 0;
    let releasedSettled = 0;

    deals.forEach((d) => {
      const amount = (d.pricePaise || 100000) / 100;
      totalCommitted += amount;

      if (d.paymentStatus === "RELEASED") {
        releasedSettled += amount;
      } else if (d.paymentStatus === "HELD_IN_ESCROW" || d.agreementStatus === "ACCEPTED") {
        activeSecured += amount;
      }
    });

    return {
      totalCommitted,
      activeSecured,
      releasedSettled,
    };
  }, [deals]);

  const filteredDeals = useMemo(() => {
    return deals.filter((d) => {
      if (activeTab === "active") {
        return d.paymentStatus === "HELD_IN_ESCROW" || d.agreementStatus === "ACCEPTED";
      }
      if (activeTab === "released") {
        return d.paymentStatus === "RELEASED";
      }
      if (activeTab === "draft") {
        return d.agreementStatus === "DRAFT" || d.agreementStatus === "PROPOSED";
      }
      return true;
    });
  }, [deals, activeTab]);

  return (
    <div className="workspace-canvas space-y-6 pb-16 antialiased text-[#0A0A0A]">
      {/* ─── 1. PAGE HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-4 border-b border-[#E5E4DF]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60">
              COMMERCIAL LEDGER
            </span>
            <span className="text-zinc-400">•</span>
            <span className="text-xs font-semibold text-zinc-500">
              {isCreator ? "Earnings & Milestone Payouts" : "Committed Budgets & Release Ledger"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0A0A0A]">
            Payment <span className="font-serif italic font-normal text-blue-700">Ledger</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-2xl">
            {isCreator
              ? "Track verified milestone deliverables, monitor secured funds in active contracts, and audit settled payouts."
              : "Audit committed campaign budgets, review pending milestone deliverables, and execute dual-signoff payout releases."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/deals"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0A0A0A] hover:bg-zinc-800 text-white text-xs font-semibold transition-colors shadow-xs"
          >
            <span>View Deal Rooms</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ─── 2. SUMMARY METRIC CARDS ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#E5E4DF] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {isCreator ? "Total Deal Volume" : "Total Committed Budget"}
            </span>
            <Wallet className="w-4 h-4 text-blue-700" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-tabular text-[#0A0A0A]">
            ₹{metrics.totalCommitted.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-zinc-500">
            Across {deals.length} active and completed commercial agreements
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E5E4DF] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Secured in Active Deals
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-tabular text-[#0A0A0A]">
            ₹{metrics.activeSecured.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-zinc-500">
            Committed and waiting for deliverable verification
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E5E4DF] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Settled &amp; Released
            </span>
            <CheckCircle2 className="w-4 h-4 text-blue-700" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-tabular text-[#0A0A0A]">
            ₹{metrics.releasedSettled.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-zinc-500">Approved deliverables transferred to bank/UPI</p>
        </div>
      </div>

      {/* ─── 3. TAB CONTROLS ─────────────────────────────────────────────────────── */}
      <div className="inline-flex items-center p-1 rounded-xl bg-[#F2F1EC] border border-[#E5E4DF] overflow-x-auto">
        {(
          [
            { id: "all", label: "All Milestones" },
            { id: "active", label: "Active & Secured" },
            { id: "released", label: "Settled & Released" },
            { id: "draft", label: "Pending Terms" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer",
              activeTab === tab.id
                ? "bg-white text-[#0A0A0A] shadow-xs"
                : "text-zinc-600 hover:text-[#0A0A0A]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── 4. MILESTONES & PAYOUT LEDGER ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E5E4DF] divide-y divide-[#E5E4DF] shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin mx-auto" />
            <p className="text-xs font-semibold text-zinc-500">Loading payment ledger...</p>
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F2F1EC] flex items-center justify-center mx-auto text-zinc-400">
              <Wallet className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#0A0A0A]">No transactions in this view</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Milestone payouts and committed budgets will appear here once deals are initiated.
            </p>
          </div>
        ) : (
          filteredDeals.map((deal) => {
            const amountINR = Math.round((deal.pricePaise || 100000) / 100);

            return (
              <div
                key={deal.id}
                className="p-5 sm:p-6 transition-colors hover:bg-[#FAF9F6] flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Deal Info */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-[#0A0A0A] hover:text-blue-700 transition-colors">
                      {deal.title || `Collaboration Deal #${deal.id}`}
                    </span>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider font-tabular",
                        deal.paymentStatus === "RELEASED"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200/70"
                          : deal.agreementStatus === "ACCEPTED"
                            ? "bg-blue-50 text-blue-700 border border-blue-200/70"
                            : "bg-amber-50 text-amber-800 border border-amber-200/70"
                      )}
                    >
                      {deal.paymentStatus === "RELEASED"
                        ? "Settled Payout"
                        : deal.agreementStatus === "ACCEPTED"
                          ? "Terms Confirmed"
                          : "Draft Agreement"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <span>
                      {isCreator
                        ? `Brand: ${deal.brandName || "Partner Brand"}`
                        : `Creator: ${deal.influencerName || "Partner Creator"}`}
                    </span>
                    <span className="text-zinc-300">•</span>
                    <span>Release Condition: Dual Signoff</span>
                    <span className="text-zinc-300">•</span>
                    <span className="font-tabular">
                      Updated {new Date(deal.updatedAt).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Right: Commercial Amount & Action */}
                <div className="flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-[#E5E4DF]">
                  <div className="text-left md:text-right">
                    <span className="text-[11px] uppercase font-bold text-zinc-400 block tracking-wider">
                      Agreed Payout
                    </span>
                    <span className="text-base sm:text-lg font-bold font-tabular text-[#0A0A0A]">
                      ₹{amountINR.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <Link
                    href={`/deals/${deal.id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#E5E4DF] bg-white hover:bg-[#F2F1EC] text-xs font-semibold text-[#0A0A0A] transition-colors shadow-xs"
                  >
                    <span>Deal Room</span>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
