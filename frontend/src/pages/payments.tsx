import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
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
  Building,
  CreditCard,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  const queryClient = useQueryClient();
  const isCreator = user?.role === "influencer" || (user?.role as string) === "creator";
  const [activeTab, setActiveTab] = useState<LedgerTab>("all");

  // Payout Account Modal & Form State
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [accountType, setAccountType] = useState<"bank_account" | "vpa">("bank_account");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [vpaAddress, setVpaAddress] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [panNumber, setPanNumber] = useState("");

  const { data: deals = [], isLoading } = useQuery<DealSummary[]>({
    queryKey: ["deals"],
    queryFn: async () => {
      const res = await fetch("/api/deals");
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Query Linked Payout Account for Creator
  const { data: payoutAccountData, refetch: refetchPayoutAccount } = useQuery({
    queryKey: ["payout-account"],
    queryFn: async () => {
      const res = await fetch("/api/payments/payout-account");
      if (!res.ok) return null;
      return res.json();
    },
    enabled: isCreator,
  });

  // Update Payout Account Mutation
  const updatePayoutMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        accountType,
        beneficiaryName,
        panNumber,
      };
      if (accountType === "bank_account") {
        payload.accountNumber = accountNumber;
        payload.ifscCode = ifscCode;
        payload.bankName = bankName;
      } else {
        payload.vpaAddress = vpaAddress;
      }

      const res = await fetch("/api/payments/payout-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update payout account.");
      }
      return data;
    },
    onSuccess: (data: any) => {
      toast.success(data?.message || "Payout account registered! 24-Hour security hold initiated.");
      setShowPayoutModal(false);
      refetchPayoutAccount();
      queryClient.invalidateQueries({ queryKey: ["payout-account"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const openPrefilledPayoutModal = () => {
    if (payoutAccountData?.account) {
      const acc = payoutAccountData.account;
      setAccountType(acc.accountType || "bank_account");
      setBeneficiaryName(acc.beneficiaryName || "");
      setBankName(acc.bankName || "");
      setIfscCode(acc.ifscCode || "");
      setVpaAddress(acc.vpaAddress || "");
    }
    setShowPayoutModal(true);
  };

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
    <div className="workspace-canvas space-y-6 pb-16 antialiased text-[#0A0A0A] dark:text-[#F8FAFC]">
      {/* ─── 1. PAGE HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-4 border-b border-[#E5E4DF] dark:border-white/10">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-[#FDF6F7] dark:bg-[#6A0D18]/20 text-[#6A0D18] dark:text-[#E87985] border border-[#EED8DC] dark:border-[#6A0D18]/40">
              COMMERCIAL LEDGER
            </span>
            <span className="text-zinc-400 dark:text-zinc-600">•</span>
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              {isCreator ? "Earnings & Milestone Payouts" : "Committed Budgets & Release Ledger"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0A0A0A] dark:text-[#F8FAFC]">
            Payment{" "}
            <span className="font-serif italic font-normal text-[#6A0D18] dark:text-[#E87985]">
              Ledger
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl">
            {isCreator
              ? "Track verified milestone deliverables, monitor secured funds in active contracts, and audit settled payouts."
              : "Audit committed campaign budgets, review pending milestone deliverables, and execute dual-signoff payout releases."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/deals"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg liquid-burgundy-metal text-xs font-semibold shadow-xs"
          >
            <span>View Deal Rooms</span>
            <ArrowRight className="w-3.5 h-3.5 text-white" />
          </Link>
        </div>
      </div>

      {/* ─── 2. SUMMARY METRIC CARDS ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl liquid-silver-card space-y-2">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {isCreator ? "Total Deal Volume" : "Total Committed Budget"}
            </span>
            <Wallet className="w-4 h-4 text-[#6A0D18] dark:text-[#E87985]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-tabular text-[#0A0A0A] dark:text-[#F8FAFC]">
            ₹{metrics.totalCommitted.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Across {deals.length} active and completed commercial agreements
          </p>
        </div>

        <div className="p-5 rounded-2xl liquid-silver-card space-y-2">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Secured in Active Deals
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-tabular text-[#0A0A0A] dark:text-[#F8FAFC]">
            ₹{metrics.activeSecured.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Committed and waiting for deliverable verification
          </p>
        </div>

        <div className="p-5 rounded-2xl liquid-silver-card space-y-2">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Settled &amp; Released
            </span>
            <CheckCircle2 className="w-4 h-4 text-[#6A0D18] dark:text-[#E87985]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-tabular text-[#0A0A0A] dark:text-[#F8FAFC]">
            ₹{metrics.releasedSettled.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Approved deliverables transferred to bank/UPI
          </p>
        </div>
      </div>

      {/* ─── 2B. CREATOR DISBURSEMENT PAYOUT ACCOUNT & 24H LOCK STATUS ─────────── */}
      {isCreator && (
        <div className="p-5 rounded-2xl liquid-silver-card border border-[#6A0D18]/30 dark:border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FDF6F7] dark:bg-[#6A0D18]/25 border border-[#EED8DC] dark:border-[#6A0D18]/40 flex items-center justify-center text-[#6A0D18] dark:text-[#E87985]">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                  Disbursement Payout Account &amp; KYC Verification
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Direct Bank NEFT/RTGS &amp; UPI VPA route for milestone escrow disbursements.
                </p>
              </div>
            </div>

            <Button
              onClick={openPrefilledPayoutModal}
              variant="outline"
              size="sm"
              className="text-xs h-9 border-[#E5E4DF] dark:border-white/10 bg-white dark:bg-[#18181E] text-[#0A0A0A] dark:text-[#F8FAFC] hover:bg-[#FAF9F6] dark:hover:bg-white/[0.05] cursor-pointer gap-1.5 shrink-0"
            >
              <Edit className="w-3.5 h-3.5 text-[#6A0D18] dark:text-[#E87985]" />
              {payoutAccountData?.hasLinkedAccount
                ? "Update Account Details"
                : "Link Payout Account"}
            </Button>
          </div>

          {payoutAccountData?.hasLinkedAccount ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-[#E5E4DF] dark:border-white/10 text-xs">
              <div className="p-3 rounded-xl bg-white/60 dark:bg-[#18181E]/60 border border-[#E5E4DF] dark:border-white/10 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Beneficiary Legal Name
                </span>
                <p className="font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                  {payoutAccountData.account.beneficiaryName}
                </p>
                <span className="text-[10px] font-mono text-zinc-500">
                  PAN: {payoutAccountData.account.panNumberMasked}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/60 dark:bg-[#18181E]/60 border border-[#E5E4DF] dark:border-white/10 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  {payoutAccountData.account.accountType === "bank_account"
                    ? "Bank Account"
                    : "UPI Virtual Address"}
                </span>
                <p className="font-mono font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                  {payoutAccountData.account.accountType === "bank_account"
                    ? payoutAccountData.account.accountNumberMasked
                    : payoutAccountData.account.vpaAddress}
                </p>
                {payoutAccountData.account.ifscCode && (
                  <span className="text-[10px] font-mono text-zinc-500">
                    IFSC: {payoutAccountData.account.ifscCode} •{" "}
                    {payoutAccountData.account.bankName || "Bank"}
                  </span>
                )}
              </div>

              <div className="p-3 rounded-xl bg-white/60 dark:bg-[#18181E]/60 border border-[#E5E4DF] dark:border-white/10 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Security &amp; KYC Status
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    KYC Verified
                  </span>
                </div>
                {payoutAccountData.account.isLocked ? (
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 pt-0.5">
                    <Lock className="w-3 h-3 shrink-0" />
                    <span>
                      24h Security Hold until{" "}
                      {new Date(
                        payoutAccountData.account.beneficiaryLockedUntil
                      ).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block pt-0.5">
                    Active for automated escrow split-settlement
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-300 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  No verified payout account linked. Link your Bank Account or UPI VPA so brand
                  escrow milestones can be disbursed to you.
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── 3. TAB CONTROLS ─────────────────────────────────────────────────────── */}
      <div className="flex items-center p-1 rounded-xl bg-[#F2F1EC] dark:bg-[#18181E] border border-[#E5E4DF] dark:border-white/10 overflow-x-auto max-w-full">
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
                ? "liquid-burgundy-metal font-bold shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-[#0A0A0A] dark:hover:text-[#F8FAFC]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── 4. MILESTONES & PAYOUT LEDGER ───────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#121216] rounded-2xl border border-[#E5E4DF] dark:border-white/10 divide-y divide-[#E5E4DF] dark:divide-white/10 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#6A0D18] dark:border-[#E87985] border-t-transparent animate-spin mx-auto" />
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Loading payment ledger...
            </p>
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F2F1EC] dark:bg-[#18181E] flex items-center justify-center mx-auto text-zinc-400">
              <Wallet className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
              No transactions in this view
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              Milestone payouts and committed budgets will appear here once deals are initiated.
            </p>
          </div>
        ) : (
          filteredDeals.map((deal) => {
            const amountINR = Math.round((deal.pricePaise || 100000) / 100);

            return (
              <div
                key={deal.id}
                className="p-5 sm:p-6 transition-colors hover:bg-[#FAF9F6] dark:hover:bg-white/[0.04] flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Deal Info */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-[#0A0A0A] dark:text-[#F8FAFC] hover:text-[#6A0D18] dark:hover:text-[#E87985] transition-colors">
                      {deal.title || `Collaboration Deal #${deal.id}`}
                    </span>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider font-tabular",
                        deal.paymentStatus === "RELEASED"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50"
                          : deal.agreementStatus === "ACCEPTED"
                            ? "bg-[#FDF6F7] text-[#6A0D18] border border-[#EED8DC] dark:bg-[#6A0D18]/25 dark:text-[#E87985] dark:border-[#6A0D18]/40"
                            : "bg-amber-50 text-amber-800 border border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50"
                      )}
                    >
                      {deal.paymentStatus === "RELEASED"
                        ? "Settled Payout"
                        : deal.agreementStatus === "ACCEPTED"
                          ? "Terms Confirmed"
                          : "Draft Agreement"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                    <span>
                      {isCreator
                        ? `Brand: ${deal.brandName || "Partner Brand"}`
                        : `Creator: ${deal.influencerName || "Partner Creator"}`}
                    </span>
                    <span className="text-zinc-300 dark:text-zinc-600">•</span>
                    <span>Release Condition: Dual Signoff</span>
                    <span className="text-zinc-300 dark:text-zinc-600">•</span>
                    <span className="font-tabular">
                      Updated {new Date(deal.updatedAt).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Right: Commercial Amount & Action */}
                <div className="flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-[#E5E4DF] dark:border-white/10">
                  <div className="text-left md:text-right">
                    <span className="text-[11px] uppercase font-bold text-zinc-400 dark:text-zinc-500 block tracking-wider">
                      Agreed Payout
                    </span>
                    <span className="text-base sm:text-lg font-bold font-tabular text-[#0A0A0A] dark:text-[#F8FAFC]">
                      ₹{amountINR.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <Link
                    href={`/deals/${deal.id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#E5E4DF] dark:border-white/10 bg-white dark:bg-[#18181E] hover:bg-[#F2F1EC] dark:hover:bg-white/[0.08] text-xs font-semibold text-[#0A0A0A] dark:text-[#F8FAFC] transition-colors shadow-xs"
                  >
                    <span>Deal Room</span>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ─── 5. CONFIGURE / UPDATE PAYOUT ACCOUNT MODAL ─────────────────────────── */}
      <Dialog open={showPayoutModal} onOpenChange={setShowPayoutModal}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-[#121216] border border-[#6A0D18]/30 dark:border-white/10 text-[#0A0A0A] dark:text-[#F8FAFC]">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold flex items-center gap-2">
              <Building className="w-4 h-4 text-[#6A0D18] dark:text-[#E87985]" />
              Disbursement Payout Account
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
              Set up your linked bank account or UPI VPA for automated milestone escrow releases.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* 24-Hour Security Hold Disclosure */}
            <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 space-y-1 text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-1.5 font-bold">
                <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                RBI 24-Hour Security Freeze Policy
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                To prevent account takeover and unauthorized fund diversion, editing beneficiary
                details initiates a mandatory 24-hour security lock-in during which escrow payouts
                are paused.
              </p>
            </div>

            {/* Account Type Toggle */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Disbursement Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAccountType("bank_account")}
                  className={cn(
                    "p-2.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all cursor-pointer",
                    accountType === "bank_account"
                      ? "liquid-burgundy-metal font-bold shadow-xs border-[#6A0D18]"
                      : "bg-[#FAF9F6] dark:bg-[#18181E] border-[#E5E4DF] dark:border-white/10 text-zinc-600 dark:text-zinc-400"
                  )}
                >
                  <Building className="w-3.5 h-3.5" />
                  Bank Account
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType("vpa")}
                  className={cn(
                    "p-2.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all cursor-pointer",
                    accountType === "vpa"
                      ? "liquid-burgundy-metal font-bold shadow-xs border-[#6A0D18]"
                      : "bg-[#FAF9F6] dark:bg-[#18181E] border-[#E5E4DF] dark:border-white/10 text-zinc-600 dark:text-zinc-400"
                  )}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  UPI VPA
                </button>
              </div>
            </div>

            {/* Beneficiary Legal Name */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Beneficiary Legal Name (as on Bank / PAN)
              </label>
              <Input
                value={beneficiaryName}
                onChange={(e) => setBeneficiaryName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                className="h-9 bg-white dark:bg-[#18181E] border-[#E5E4DF] dark:border-white/10 text-xs"
              />
            </div>

            {/* PAN Number */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                PAN Number (for 1% Section 194J TDS compliance)
              </label>
              <Input
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                placeholder="ABCDE1234F"
                maxLength={10}
                className="h-9 font-mono bg-white dark:bg-[#18181E] border-[#E5E4DF] dark:border-white/10 text-xs uppercase"
              />
            </div>

            {accountType === "bank_account" ? (
              <>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Bank Account Number
                  </label>
                  <Input
                    type="password"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Enter full account number"
                    className="h-9 font-mono bg-white dark:bg-[#18181E] border-[#E5E4DF] dark:border-white/10 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      IFSC Code
                    </label>
                    <Input
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                      placeholder="HDFC0001234"
                      className="h-9 font-mono bg-white dark:bg-[#18181E] border-[#E5E4DF] dark:border-white/10 text-xs uppercase"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Bank Name
                    </label>
                    <Input
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="HDFC Bank"
                      className="h-9 bg-white dark:bg-[#18181E] border-[#E5E4DF] dark:border-white/10 text-xs"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  UPI VPA Address
                </label>
                <Input
                  value={vpaAddress}
                  onChange={(e) => setVpaAddress(e.target.value)}
                  placeholder="e.g. creator@okaxis"
                  className="h-9 font-mono bg-white dark:bg-[#18181E] border-[#E5E4DF] dark:border-white/10 text-xs"
                />
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPayoutModal(false)}
                className="h-9 text-xs border-[#E5E4DF] dark:border-white/10 dark:text-[#F8FAFC]"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => updatePayoutMutation.mutate()}
                disabled={updatePayoutMutation.isPending}
                className="h-9 text-xs liquid-burgundy-metal font-semibold"
              >
                {updatePayoutMutation.isPending ? "Saving Account..." : "Save & Activate 24h Lock"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
