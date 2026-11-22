import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CreditCard,
  Search,
  Loader2,
  RefreshCw,
  Lock,
  Clock,
  CheckCircle2,
  AlertCircle,
  Coins,
  TrendingUp,
  Receipt,
  Eye,
  Briefcase,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Link } from "wouter";

interface PaymentSummary {
  totalCommittedPaise: number;
  inEscrowPaise: number;
  releasedPayoutsPaise: number;
  refundedPaise: number;
  estimatedPlatformFeePaise: number;
}

interface PaymentLedgerItem {
  id: number;
  dealId: number;
  title: string;
  brandName: string;
  creatorName: string;
  amountPaise: number;
  amountRupees: number;
  currency: string;
  paymentStatus: string;
  agreementStatus: string;
  platformFeePaise: number;
  gstAmountPaise?: number;
  tdsAmountPaise?: number;
  netCreatorPayoutPaise?: number;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  autoReleaseAt?: string | null;
  confirmedAt: string | null;
  createdAt: string;
}

interface DoubleEntryLedgerEntry {
  id: number;
  paymentOrderId: number;
  dealId: number;
  entryType: string;
  direction: string;
  amountPaise: number;
  providerTransferId: string | null;
  utrNumber: string | null;
  description: string | null;
  createdAt: string;
}

export default function AdminPaymentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"deals" | "journal">("deals");
  const [inspectingPayment, setInspectingPayment] = useState<PaymentLedgerItem | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["/api/admin/payments"],
    queryFn: async () => {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${apiUrl}/api/admin/payments`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load payment escrow ledger");
      return res.json();
    },
  });

  const summary: PaymentSummary = data?.summary || {
    totalCommittedPaise: 0,
    inEscrowPaise: 0,
    releasedPayoutsPaise: 0,
    refundedPaise: 0,
    estimatedPlatformFeePaise: 0,
  };

  const ledger: PaymentLedgerItem[] = (data?.ledger || []).filter((item: PaymentLedgerItem) => {
    const matchesSearch =
      !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.brandName.toLowerCase().includes(search.toLowerCase()) ||
      item.creatorName.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || item.paymentStatus.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const formatRupees = (paise: number) => {
    const rupees = Math.round(paise / 100);
    return `₹${rupees.toLocaleString("en-IN")}`;
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "RELEASED":
        return "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50";
      case "IN_ESCROW":
        return "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50";
      case "REFUNDED":
        return "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/50";
      default:
        return "bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E5E4DF] dark:border-white/10">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0A0A0A] dark:text-[#F8FAFC]">
            Payments &amp; Escrow Ledger
          </h1>
          <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] mt-0.5">
            Bilateral escrow balances, payout settlements, platform commission take, and financial
            telemetry.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex p-0.5 rounded-lg bg-[#FAF9F6] dark:bg-[#18181E] border border-[#E5E4DF] dark:border-white/10">
            <button
              onClick={() => setViewMode("deals")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "deals"
                  ? "bg-[#6A0D18] text-white shadow-xs"
                  : "text-[#52525B] dark:text-[#A1A1AA] hover:text-[#0A0A0A] dark:hover:text-[#F8FAFC]"
              }`}
            >
              Deal Escrows
            </button>
            <button
              onClick={() => setViewMode("journal")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "journal"
                  ? "bg-[#6A0D18] text-white shadow-xs"
                  : "text-[#52525B] dark:text-[#A1A1AA] hover:text-[#0A0A0A] dark:hover:text-[#F8FAFC]"
              }`}
            >
              Double-Entry Ledger
            </button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching || isLoading}
            className="text-xs h-9 border-[#E5E4DF] dark:border-white/10 bg-white dark:bg-[#18181E] text-[#0A0A0A] dark:text-[#F8FAFC] hover:bg-[#FAF9F6] dark:hover:bg-white/[0.05] cursor-pointer gap-2 shrink-0"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin text-[#6A0D18] dark:text-[#E87985]" : "text-[#52525B] dark:text-[#A1A1AA]"}`}
            />
            Refresh Ledger
          </Button>
        </div>
      </div>

      {/* KPI Cards in Liquid Silver Card */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="liquid-silver-card rounded-xl p-4.5 space-y-1">
          <div className="flex items-center justify-between text-[#52525B] dark:text-[#A1A1AA]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Gross Committed</span>
            <Coins className="w-4 h-4 text-[#6A0D18] dark:text-[#E87985]" />
          </div>
          <p className="text-xl font-extrabold font-mono tracking-tight text-[#0A0A0A] dark:text-[#F8FAFC] tabular-nums">
            {formatRupees(summary.totalCommittedPaise)}
          </p>
          <p className="text-[10px] text-[#52525B] dark:text-[#A1A1AA]">Contractual deal volume</p>
        </div>

        <div className="liquid-silver-card rounded-xl p-4.5 space-y-1">
          <div className="flex items-center justify-between text-[#52525B] dark:text-[#A1A1AA]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Held in Escrow</span>
            <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-xl font-extrabold font-mono tracking-tight text-amber-700 dark:text-amber-400 tabular-nums">
            {formatRupees(summary.inEscrowPaise)}
          </p>
          <p className="text-[10px] text-[#52525B] dark:text-[#A1A1AA]">
            Locked awaiting milestones
          </p>
        </div>

        <div className="liquid-silver-card rounded-xl p-4.5 space-y-1">
          <div className="flex items-center justify-between text-[#52525B] dark:text-[#A1A1AA]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Released Payouts</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-xl font-extrabold font-mono tracking-tight text-emerald-700 dark:text-emerald-400 tabular-nums">
            {formatRupees(summary.releasedPayoutsPaise)}
          </p>
          <p className="text-[10px] text-[#52525B] dark:text-[#A1A1AA]">Disbursed to creators</p>
        </div>

        <div className="liquid-silver-card rounded-xl p-4.5 space-y-1">
          <div className="flex items-center justify-between text-[#52525B] dark:text-[#A1A1AA]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Estimated Take</span>
            <TrendingUp className="w-4 h-4 text-[#6A0D18] dark:text-[#E87985]" />
          </div>
          <p className="text-xl font-extrabold font-mono tracking-tight text-[#6A0D18] dark:text-[#E87985] tabular-nums">
            {formatRupees(summary.estimatedPlatformFeePaise)}
          </p>
          <p className="text-[10px] text-[#52525B] dark:text-[#A1A1AA]">5% standard commission</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#52525B] dark:text-[#A1A1AA]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions by deal title, brand, or creator..."
            className="pl-9 h-10 bg-white dark:bg-[#18181E] border-[#E5E4DF] dark:border-white/10 text-xs text-[#0A0A0A] dark:text-[#F8FAFC] placeholder:text-[#52525B] dark:placeholder:text-[#A1A1AA] rounded-lg"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All Transactions" },
            { id: "IN_ESCROW", label: "In Escrow" },
            { id: "RELEASED", label: "Released" },
            { id: "REFUNDED", label: "Refunded" },
            { id: "PENDING", label: "Pending" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                statusFilter === tab.id
                  ? "bg-[#6A0D18] text-white border-[#6A0D18]"
                  : "bg-white dark:bg-[#18181E] text-[#52525B] dark:text-[#A1A1AA] border-[#E5E4DF] dark:border-white/10 hover:bg-[#FAF9F6] dark:hover:bg-white/[0.05] hover:text-[#0A0A0A] dark:hover:text-[#F8FAFC]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Table inside Liquid Silver Card */}
      <div className="liquid-silver-card rounded-xl border border-[#6A0D18]/30 dark:border-white/10 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#6A0D18] dark:text-[#E87985]" />
            <p className="text-xs text-[#52525B] dark:text-[#A1A1AA]">
              Querying financial escrow ledger...
            </p>
          </div>
        ) : viewMode === "journal" ? (
          // ─── DOUBLE-ENTRY FINANCIAL JOURNAL VIEW ───────────────────────────
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] dark:bg-[#18181E] border-b border-[#E5E4DF] dark:border-white/10 text-[11px] font-bold uppercase tracking-wider text-[#52525B] dark:text-[#A1A1AA]">
                <tr>
                  <th className="py-3.5 px-5">Entry ID</th>
                  <th className="py-3.5 px-4">Deal ID</th>
                  <th className="py-3.5 px-4">Entry Type</th>
                  <th className="py-3.5 px-4">Direction</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">UTR / Transfer Ref</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E4DF] dark:divide-white/10">
                {(data?.doubleEntryLedger || []).length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-12 text-center text-xs text-[#52525B] dark:text-[#A1A1AA]"
                    >
                      No double-entry journal entries recorded yet. Entries populate when escrow is
                      funded or released.
                    </td>
                  </tr>
                ) : (
                  (data?.doubleEntryLedger || []).map((entry: DoubleEntryLedgerEntry) => (
                    <tr
                      key={entry.id}
                      className="hover:bg-[#FAF9F6]/70 dark:hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="py-3.5 px-5 font-mono font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                        #{entry.id}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#52525B] dark:text-[#A1A1AA]">
                        <Link
                          href={`/deals/${entry.dealId}`}
                          className="hover:underline text-[#6A0D18] dark:text-[#E87985]"
                        >
                          Deal #{entry.dealId}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#FDF6F7] dark:bg-[#6A0D18]/25 text-[#6A0D18] dark:text-[#E87985] border border-[#EED8DC] dark:border-[#6A0D18]/40">
                          {entry.entryType.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            entry.direction === "credit"
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50"
                              : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50"
                          }`}
                        >
                          {entry.direction}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold tabular-nums text-[#0A0A0A] dark:text-[#F8FAFC]">
                        {formatRupees(entry.amountPaise)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#52525B] dark:text-[#A1A1AA]">
                        {entry.utrNumber || entry.providerTransferId || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-[#52525B] dark:text-[#A1A1AA] max-w-xs truncate">
                        {entry.description || "General ledger record"}
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono text-[11px] text-[#52525B] dark:text-[#A1A1AA]">
                        {new Date(entry.createdAt).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : ledger.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <CreditCard className="w-8 h-8 text-[#52525B] dark:text-[#A1A1AA] mx-auto opacity-40" />
            <p className="text-sm font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
              No escrow records found
            </p>
            <p className="text-xs text-[#52525B] dark:text-[#A1A1AA]">
              No transactions match the selected search or escrow status.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] dark:bg-[#18181E] border-b border-[#E5E4DF] dark:border-white/10 text-[11px] font-bold uppercase tracking-wider text-[#52525B] dark:text-[#A1A1AA]">
                <tr>
                  <th className="py-3.5 px-5">Commercial Deal</th>
                  <th className="py-3.5 px-4">Brand Buyer</th>
                  <th className="py-3.5 px-4">Creator Partner</th>
                  <th className="py-3.5 px-4">Escrow Amount</th>
                  <th className="py-3.5 px-4">Platform Take</th>
                  <th className="py-3.5 px-4">Escrow State</th>
                  <th className="py-3.5 px-4">Agreement</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E4DF] dark:divide-white/10">
                {ledger.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#FAF9F6]/70 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="py-3.5 px-5">
                      <div className="space-y-0.5">
                        <span className="font-bold text-[#0A0A0A] dark:text-[#F8FAFC] line-clamp-1">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-mono text-[#52525B] dark:text-[#A1A1AA]">
                          Deal #{item.dealId}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#0A0A0A] dark:text-[#F8FAFC]">
                      {item.brandName}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#0A0A0A] dark:text-[#F8FAFC]">
                      {item.creatorName}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold tabular-nums text-[#0A0A0A] dark:text-[#F8FAFC]">
                      {formatRupees(item.amountPaise)}
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-[#6A0D18] dark:text-[#E87985]">
                      {formatRupees(item.platformFeePaise)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${getPaymentStatusBadge(
                          item.paymentStatus
                        )}`}
                      >
                        {item.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[11px] font-semibold text-[#52525B] dark:text-[#A1A1AA] uppercase">
                        {item.agreementStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setInspectingPayment(item)}
                        className="h-7 px-2 text-[11px] font-semibold border-[#E5E4DF] dark:border-white/10 text-[#0A0A0A] dark:text-[#F8FAFC] hover:bg-white dark:hover:bg-[#18181E] cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1 text-[#6A0D18] dark:text-[#E87985]" />
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-5 py-3.5 bg-[#FAF9F6] dark:bg-[#18181E] border-t border-[#E5E4DF] dark:border-white/10 flex items-center justify-between text-xs text-[#52525B] dark:text-[#A1A1AA]">
          <span>
            {viewMode === "journal" ? (
              <>
                Displaying{" "}
                <strong className="text-[#0A0A0A] dark:text-[#F8FAFC] font-mono">
                  {(data?.doubleEntryLedger || []).length}
                </strong>{" "}
                double-entry journal records
              </>
            ) : (
              <>
                Displaying{" "}
                <strong className="text-[#0A0A0A] dark:text-[#F8FAFC] font-mono">
                  {ledger.length}
                </strong>{" "}
                commercial transactions
              </>
            )}
          </span>
          <span className="font-mono text-[11px] text-[#52525B] dark:text-[#A1A1AA]">
            Standard Platform Take:{" "}
            <strong className="text-[#0A0A0A] dark:text-[#F8FAFC]">10.0% + 18% GST</strong>
          </span>
        </div>
      </div>

      {/* Slide-Over Inspection Drawer: Silver Liquid Glass */}
      <Sheet
        open={Boolean(inspectingPayment)}
        onOpenChange={(open) => !open && setInspectingPayment(null)}
      >
        <SheetContent className="sm:max-w-md bg-white dark:bg-[#121216] border-l border-[#6A0D18]/30 dark:border-white/10 p-6 overflow-y-auto text-[#0A0A0A] dark:text-[#F8FAFC]">
          <SheetHeader className="pb-4 border-b border-[#E5E4DF] dark:border-white/10">
            <SheetTitle className="text-base font-extrabold flex items-center gap-2 text-[#0A0A0A] dark:text-[#F8FAFC]">
              <CreditCard className="w-4 h-4 text-[#6A0D18] dark:text-[#E87985]" />
              Escrow Ledger Record
            </SheetTitle>
            <SheetDescription className="text-xs text-[#52525B] dark:text-[#A1A1AA]">
              Deal #{inspectingPayment?.dealId} • {inspectingPayment?.title}
            </SheetDescription>
          </SheetHeader>

          {inspectingPayment && (
            <div className="space-y-5 py-4 text-xs">
              {/* Comprehensive Split-Settlement Breakdown */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-white to-[#FAF9F6] dark:from-[#18181E] dark:to-[#121216] border border-[#6A0D18]/25 dark:border-white/10 space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#52525B] dark:text-[#A1A1AA]">
                  Financial Settlement Breakdown (RBI Route)
                </span>
                <p className="text-2xl font-black font-mono text-[#6A0D18] dark:text-[#E87985] tabular-nums">
                  {formatRupees(inspectingPayment.amountPaise)}
                </p>

                <div className="space-y-1.5 pt-2 border-t border-[#E5E4DF] dark:border-white/10 text-[11px]">
                  <div className="flex items-center justify-between text-[#52525B] dark:text-[#A1A1AA]">
                    <span>Platform Commission (10%):</span>
                    <span className="font-mono font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                      {formatRupees(inspectingPayment.platformFeePaise)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#52525B] dark:text-[#A1A1AA]">
                    <span>18% GST on Fee:</span>
                    <span className="font-mono font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                      {formatRupees(
                        inspectingPayment.gstAmountPaise ||
                          Math.round(inspectingPayment.platformFeePaise * 0.18)
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#52525B] dark:text-[#A1A1AA]">
                    <span>1% Statutory TDS (Sec 194J/C):</span>
                    <span className="font-mono font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                      {formatRupees(
                        inspectingPayment.tdsAmountPaise ||
                          Math.round(inspectingPayment.amountPaise * 0.01)
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1.5 border-t border-[#E5E4DF] dark:border-white/10 text-emerald-700 dark:text-emerald-400 font-bold">
                    <span>Net Creator Payout:</span>
                    <span className="font-mono">
                      {formatRupees(
                        inspectingPayment.netCreatorPayoutPaise ||
                          Math.round(
                            inspectingPayment.amountPaise -
                              inspectingPayment.platformFeePaise -
                              Math.round(inspectingPayment.amountPaise * 0.01)
                          )
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Gateway References */}
              {(inspectingPayment.razorpayOrderId || inspectingPayment.razorpayPaymentId) && (
                <div className="p-3.5 rounded-lg bg-[#FAF9F6] dark:bg-[#18181E] border border-[#E5E4DF] dark:border-white/10 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-[#52525B] dark:text-[#A1A1AA] block tracking-wider">
                    Razorpay Gateway Telemetry
                  </span>
                  {inspectingPayment.razorpayOrderId && (
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[#52525B] dark:text-[#A1A1AA]">Order ID:</span>
                      <span className="font-mono font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                        {inspectingPayment.razorpayOrderId}
                      </span>
                    </div>
                  )}
                  {inspectingPayment.razorpayPaymentId && (
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[#52525B] dark:text-[#A1A1AA]">Payment ID:</span>
                      <span className="font-mono font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                        {inspectingPayment.razorpayPaymentId}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* 72h Auto Release Timestamp if set */}
              {inspectingPayment.autoReleaseAt && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-[11px] text-amber-900 dark:text-amber-200">
                  <div className="flex items-center gap-1.5 font-bold mb-0.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    72-Hour Auto-Release SLA
                  </div>
                  <div>
                    Deadline:{" "}
                    <strong>
                      {new Date(inspectingPayment.autoReleaseAt).toLocaleString("en-IN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </strong>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#52525B] dark:text-[#A1A1AA] block">
                  Bilateral Parties
                </span>
                <div className="p-3 rounded-lg bg-[#FAF9F6] dark:bg-[#18181E] border border-[#E5E4DF] dark:border-white/10 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#52525B] dark:text-[#A1A1AA]">
                    Brand Buyer
                  </span>
                  <p className="font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                    {inspectingPayment.brandName}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#FAF9F6] dark:bg-[#18181E] border border-[#E5E4DF] dark:border-white/10 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#52525B] dark:text-[#A1A1AA]">
                    Creator Partner
                  </span>
                  <p className="font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                    {inspectingPayment.creatorName}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-[#FAF9F6] dark:bg-[#18181E] border border-[#E5E4DF] dark:border-white/10">
                  <span className="text-[10px] text-[#52525B] dark:text-[#A1A1AA] block">
                    Escrow State
                  </span>
                  <span className="font-bold uppercase text-[11px] text-[#6A0D18] dark:text-[#E87985]">
                    {inspectingPayment.paymentStatus}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[#FAF9F6] dark:bg-[#18181E] border border-[#E5E4DF] dark:border-white/10">
                  <span className="text-[10px] text-[#52525B] dark:text-[#A1A1AA] block">
                    Agreement
                  </span>
                  <span className="font-bold uppercase text-[11px] text-[#0A0A0A] dark:text-[#F8FAFC]">
                    {inspectingPayment.agreementStatus}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-[#52525B] dark:text-[#A1A1AA]">
                Created on {new Date(inspectingPayment.createdAt).toLocaleString()}
              </div>

              <div className="pt-4 border-t border-[#E5E4DF] dark:border-white/10">
                <Link href={`/deals/${inspectingPayment.dealId}`}>
                  <Button
                    variant="outline"
                    className="w-full text-xs h-9 justify-center gap-2 border-[#E5E4DF] dark:border-white/10 bg-white dark:bg-[#18181E] text-[#0A0A0A] dark:text-[#F8FAFC] hover:bg-[#FAF9F6] dark:hover:bg-white/[0.05] cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#52525B] dark:text-[#A1A1AA]" />
                    Inspect Deal Room #{inspectingPayment.dealId}
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
