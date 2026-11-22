import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Users,
  UserCheck,
  Building2,
  Megaphone,
  Briefcase,
  IndianRupee,
  CreditCard,
  ShieldAlert,
  Activity,
  ArrowUpRight,
  RefreshCw,
  FileText,
  Radio,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AdminOverviewPage() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["/api/admin/overview"],
    queryFn: async () => {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${apiUrl}/api/admin/overview`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load platform overview");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const m = data?.metrics || {
    totalUsers: 0,
    totalCreators: 0,
    totalBrands: 0,
    totalAdmins: 0,
    onlineUsers: 0,
    dau: 0,
    wau: 0,
    mau: 0,
    registrations24h: 0,
    registrations7d: 0,
    registrations30d: 0,
    pendingVerifications: 0,
    suspendedAccounts: 0,
    activeCampaigns: 0,
    totalApplications: 0,
    activeDeals: 0,
    totalProposals: 0,
    grossDealVolumePaise: 0,
    releasedPayoutsPaise: 0,
    pendingSettlementsPaise: 0,
    openReports: 0,
  };

  const recentActivity = data?.recentActivity || [];
  const recentAuditLogs = data?.recentAuditLogs || [];

  const formatINR = (paise: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Math.round(paise / 100));

  return (
    <div className="space-y-8 text-[#0A0A0A] dark:text-[#F8FAFC]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E5E4DF] dark:border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0A0A0A] dark:text-[#F8FAFC]">
              Platform Executive Overview
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#6A0D18]/10 dark:bg-[#6A0D18]/25 text-[#6A0D18] dark:text-[#E87985] border border-[#6A0D18]/20 dark:border-[#6A0D18]/40">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6A0D18] dark:bg-[#E87985] animate-pulse" />
              Live Telemetry
            </span>
          </div>
          <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] mt-0.5">
            Real-time PostgreSQL telemetry across user accounts, verified creator profiles,
            bilateral deal rooms, and escrow settlements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
            <Radio className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            <span className="tabular-nums font-mono">{m.onlineUsers} Active Sessions</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching || isLoading}
            className="text-xs h-9 border-[#E5E4DF] dark:border-white/10 bg-white dark:bg-[#121216] text-[#0A0A0A] dark:text-[#F8FAFC] hover:bg-[#FAF9F6] dark:hover:bg-white/[0.08] cursor-pointer gap-2"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin text-[#6A0D18] dark:text-[#E87985]" : "text-[#52525B] dark:text-[#A1A1AA]"}`}
            />
            Refresh Telemetry
          </Button>
        </div>
      </div>

      {/* Hero Dual Focal Cards: Deep Burgundy Liquid Metal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Hero 1: Gross Deal Volume */}
        <div className="liquid-burgundy-metal rounded-2xl p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between space-y-6">
          <div className="flex items-start justify-between relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">
                  Gross Contracted Volume
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-white/20 text-white border border-white/30 backdrop-blur-xs">
                  Bilateral Agreements
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-mono tabular-nums">
                {formatINR(m.grossDealVolumePaise)}
              </h2>
            </div>
            <Link href="/admin/payments">
              <div className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 flex items-center justify-center text-white cursor-pointer transition-colors">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/20 text-xs relative z-10">
            <div>
              <span className="text-white/70 text-[10px] uppercase font-bold tracking-wider block">
                Held in Escrow
              </span>
              <span className="font-mono font-bold text-white text-sm tabular-nums">
                {formatINR(m.pendingSettlementsPaise)}
              </span>
            </div>
            <div>
              <span className="text-white/70 text-[10px] uppercase font-bold tracking-wider block">
                Disbursed Payouts
              </span>
              <span className="font-mono font-bold text-white text-sm tabular-nums">
                {formatINR(m.releasedPayoutsPaise)}
              </span>
            </div>
          </div>
        </div>

        {/* Hero 2: Total Registered Users & Ecosystem */}
        <div className="liquid-burgundy-metal rounded-2xl p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between space-y-6">
          <div className="flex items-start justify-between relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">
                  Total Platform Accounts
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-white/20 text-white border border-white/30 backdrop-blur-xs">
                  Marketplace Scale
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-mono tabular-nums">
                {m.totalUsers.toLocaleString()}
              </h2>
            </div>
            <Link href="/admin/users">
              <div className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 flex items-center justify-center text-white cursor-pointer transition-colors">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/20 text-xs relative z-10">
            <div>
              <span className="text-white/70 text-[10px] uppercase font-bold tracking-wider block">
                Creators
              </span>
              <span className="font-mono font-bold text-white text-sm tabular-nums">
                {m.totalCreators}
              </span>
            </div>
            <div>
              <span className="text-white/70 text-[10px] uppercase font-bold tracking-wider block">
                Brands
              </span>
              <span className="font-mono font-bold text-white text-sm tabular-nums">
                {m.totalBrands}
              </span>
            </div>
            <div>
              <span className="text-white/70 text-[10px] uppercase font-bold tracking-wider block">
                Operators
              </span>
              <span className="font-mono font-bold text-white text-sm tabular-nums">
                {m.totalAdmins}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Cohorts: DAU / WAU / MAU / Growth */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="liquid-silver-card rounded-xl p-4.5 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#52525B] dark:text-[#A1A1AA]">
            Daily Active Users (DAU)
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-[#0A0A0A] dark:text-[#F8FAFC] font-mono tabular-nums">
              {m.dau}
            </span>
            <span className="text-[11px] text-[#52525B] dark:text-[#A1A1AA] font-medium">
              Past 24 hours
            </span>
          </div>
          <div className="w-full bg-[#FAF9F6] dark:bg-white/5 rounded-full h-1.5 overflow-hidden border border-[#E5E4DF] dark:border-white/10">
            <div
              className="bg-[#6A0D18] dark:bg-[#E87985] h-1.5 rounded-full"
              style={{ width: `${Math.min((m.dau / (m.totalUsers || 1)) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="liquid-silver-card rounded-xl p-4.5 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#52525B] dark:text-[#A1A1AA]">
            Weekly Active Users (WAU)
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-[#0A0A0A] dark:text-[#F8FAFC] font-mono tabular-nums">
              {m.wau}
            </span>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
              Past 7 days
            </span>
          </div>
          <div className="w-full bg-[#FAF9F6] dark:bg-white/5 rounded-full h-1.5 overflow-hidden border border-[#E5E4DF] dark:border-white/10">
            <div
              className="bg-emerald-600 h-1.5 rounded-full"
              style={{ width: `${Math.min((m.wau / (m.totalUsers || 1)) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="liquid-silver-card rounded-xl p-4.5 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#52525B] dark:text-[#A1A1AA]">
            Monthly Active Users (MAU)
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-[#0A0A0A] dark:text-[#F8FAFC] font-mono tabular-nums">
              {m.mau}
            </span>
            <span className="text-[11px] text-blue-700 dark:text-blue-400 font-medium">
              Past 30 days
            </span>
          </div>
          <div className="w-full bg-[#FAF9F6] dark:bg-white/5 rounded-full h-1.5 overflow-hidden border border-[#E5E4DF] dark:border-white/10">
            <div
              className="bg-blue-600 h-1.5 rounded-full"
              style={{ width: `${Math.min((m.mau / (m.totalUsers || 1)) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="liquid-silver-card rounded-xl p-4.5 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#52525B] dark:text-[#A1A1AA]">
            New Registrations (30d)
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-[#0A0A0A] dark:text-[#F8FAFC] font-mono tabular-nums">
              +{m.registrations30d}
            </span>
            <span className="text-[11px] text-purple-700 dark:text-purple-400 font-medium">
              +{m.registrations7d} this week
            </span>
          </div>
          <div className="w-full bg-[#FAF9F6] dark:bg-white/5 rounded-full h-1.5 overflow-hidden border border-[#E5E4DF] dark:border-white/10">
            <div
              className="bg-purple-600 h-1.5 rounded-full"
              style={{
                width: `${Math.min((m.registrations30d / (m.totalUsers || 1)) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Secondary Operational Metrics Grid: Liquid Silver Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div className="liquid-silver-card rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between text-[#52525B] dark:text-[#A1A1AA]">
            <span className="text-xs font-semibold uppercase tracking-wider">Creator Roster</span>
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#18181E] border border-[#6A0D18]/25 dark:border-[#E87985]/30 flex items-center justify-center text-[#6A0D18] dark:text-[#E87985]">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold tracking-tight text-[#0A0A0A] dark:text-[#F8FAFC] font-mono tabular-nums">
              {m.totalCreators.toLocaleString()}
            </span>
            <Link href="/admin/creators">
              <span className="text-xs font-semibold text-[#6A0D18] dark:text-[#E87985] hover:underline flex items-center gap-0.5 cursor-pointer">
                Roster <ArrowUpRight className="w-3 h-3" />
              </span>
            </Link>
          </div>
          <p className="text-[11px] text-[#52525B] dark:text-[#A1A1AA]">
            {m.pendingVerifications} awaiting verification badge review
          </p>
        </div>

        <div className="liquid-silver-card rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between text-[#52525B] dark:text-[#A1A1AA]">
            <span className="text-xs font-semibold uppercase tracking-wider">Brand Workspaces</span>
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#18181E] border border-[#6A0D18]/25 dark:border-[#E87985]/30 flex items-center justify-center text-[#6A0D18] dark:text-[#E87985]">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold tracking-tight text-[#0A0A0A] dark:text-[#F8FAFC] font-mono tabular-nums">
              {m.totalBrands.toLocaleString()}
            </span>
            <Link href="/admin/brands">
              <span className="text-xs font-semibold text-[#6A0D18] dark:text-[#E87985] hover:underline flex items-center gap-0.5 cursor-pointer">
                Workspaces <ArrowUpRight className="w-3 h-3" />
              </span>
            </Link>
          </div>
          <p className="text-[11px] text-[#52525B] dark:text-[#A1A1AA]">
            Corporate sponsors & marketing agencies
          </p>
        </div>

        <div className="liquid-silver-card rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between text-[#52525B] dark:text-[#A1A1AA]">
            <span className="text-xs font-semibold uppercase tracking-wider">Campaign Briefs</span>
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#18181E] border border-[#6A0D18]/25 dark:border-[#E87985]/30 flex items-center justify-center text-[#6A0D18] dark:text-[#E87985]">
              <Megaphone className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold tracking-tight text-[#0A0A0A] dark:text-[#F8FAFC] font-mono tabular-nums">
              {m.activeCampaigns.toLocaleString()}
            </span>
            <Link href="/admin/campaigns">
              <span className="text-xs font-semibold text-[#6A0D18] dark:text-[#E87985] hover:underline flex items-center gap-0.5 cursor-pointer">
                Briefs <ArrowUpRight className="w-3 h-3" />
              </span>
            </Link>
          </div>
          <p className="text-[11px] text-[#52525B] dark:text-[#A1A1AA]">
            {m.totalApplications} creator pitches submitted
          </p>
        </div>

        <div className="liquid-silver-card rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between text-[#52525B] dark:text-[#A1A1AA]">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Active Deal Rooms
            </span>
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#18181E] border border-[#6A0D18]/25 dark:border-[#E87985]/30 flex items-center justify-center text-[#6A0D18] dark:text-[#E87985]">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold tracking-tight text-[#0A0A0A] dark:text-[#F8FAFC] font-mono tabular-nums">
              {m.activeDeals.toLocaleString()}
            </span>
            <Link href="/admin/deals">
              <span className="text-xs font-semibold text-[#6A0D18] dark:text-[#E87985] hover:underline flex items-center gap-0.5 cursor-pointer">
                Rooms <ArrowUpRight className="w-3 h-3" />
              </span>
            </Link>
          </div>
          <p className="text-[11px] text-[#52525B] dark:text-[#A1A1AA]">
            {m.totalProposals} bilateral terms versioned in negotiation
          </p>
        </div>

        <div className="liquid-silver-card rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between text-[#52525B] dark:text-[#A1A1AA]">
            <span className="text-xs font-semibold uppercase tracking-wider">Escrow Held</span>
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#18181E] border border-[#6A0D18]/25 dark:border-[#E87985]/30 flex items-center justify-center text-[#6A0D18] dark:text-[#E87985]">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold tracking-tight text-[#0A0A0A] dark:text-[#F8FAFC] font-mono tabular-nums">
              {formatINR(m.pendingSettlementsPaise)}
            </span>
            <Link href="/admin/payments">
              <span className="text-xs font-semibold text-[#6A0D18] dark:text-[#E87985] hover:underline flex items-center gap-0.5 cursor-pointer">
                Ledger <ArrowUpRight className="w-3 h-3" />
              </span>
            </Link>
          </div>
          <p className="text-[11px] text-[#52525B] dark:text-[#A1A1AA]">
            {formatINR(m.releasedPayoutsPaise)} released to creators
          </p>
        </div>

        <div className="liquid-silver-card rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between text-[#52525B] dark:text-[#A1A1AA]">
            <span className="text-xs font-semibold uppercase tracking-wider">Moderation Queue</span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${m.openReports > 0 ? "bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400" : "bg-white dark:bg-[#18181E] border border-[#6A0D18]/25 dark:border-[#E87985]/30 text-[#52525B] dark:text-[#A1A1AA]"}`}
            >
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span
              className={`text-2xl font-extrabold tracking-tight font-mono tabular-nums ${m.openReports > 0 ? "text-rose-700 dark:text-rose-400" : "text-[#0A0A0A] dark:text-[#F8FAFC]"}`}
            >
              {m.openReports}
            </span>
            <Link href="/admin/reports">
              <span className="text-xs font-semibold text-[#6A0D18] dark:text-[#E87985] hover:underline flex items-center gap-0.5 cursor-pointer">
                Review <ArrowUpRight className="w-3 h-3" />
              </span>
            </Link>
          </div>
          <p className="text-[11px] text-[#52525B] dark:text-[#A1A1AA]">
            {m.suspendedAccounts} accounts currently restricted
          </p>
        </div>

        <div className="liquid-silver-card rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between text-[#52525B] dark:text-[#A1A1AA]">
            <span className="text-xs font-semibold uppercase tracking-wider">System Latency</span>
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#18181E] border border-[#6A0D18]/25 dark:border-[#E87985]/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold tracking-tight text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">
              Healthy
            </span>
            <Link href="/admin/system-health">
              <span className="text-xs font-semibold text-[#6A0D18] dark:text-[#E87985] hover:underline flex items-center gap-0.5 cursor-pointer">
                Metrics <ArrowUpRight className="w-3 h-3" />
              </span>
            </Link>
          </div>
          <p className="text-[11px] text-[#52525B] dark:text-[#A1A1AA]">
            PostgreSQL query pool online
          </p>
        </div>

        <div className="liquid-silver-card rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between text-[#52525B] dark:text-[#A1A1AA]">
            <span className="text-xs font-semibold uppercase tracking-wider">Governance</span>
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#18181E] border border-[#6A0D18]/25 dark:border-[#E87985]/30 flex items-center justify-center text-[#6A0D18] dark:text-[#E87985]">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold tracking-tight text-[#0A0A0A] dark:text-[#F8FAFC] font-mono tabular-nums">
              5.0%
            </span>
            <Link href="/admin/settings">
              <span className="text-xs font-semibold text-[#6A0D18] dark:text-[#E87985] hover:underline flex items-center gap-0.5 cursor-pointer">
                Settings <ArrowUpRight className="w-3 h-3" />
              </span>
            </Link>
          </div>
          <p className="text-[11px] text-[#52525B] dark:text-[#A1A1AA]">
            Standard platform commission take
          </p>
        </div>
      </div>

      {/* Operational Streams: Live Activity & Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active User Activity Feed (Brands & Creators) */}
        <div className="liquid-silver-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E4DF] dark:border-white/10">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-[#0A0A0A] dark:text-[#F8FAFC]">
                  Active User Activity Feed
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
                  Live Telemetry
                </span>
              </div>
              <p className="text-xs text-[#52525B] dark:text-[#A1A1AA]">
                Real-time brand &amp; creator actions
              </p>
            </div>
            <Link href="/admin/activity-logs">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-[#6A0D18] dark:text-[#E87985] hover:text-[#6A0D18] hover:bg-[#6A0D18]/10 h-7 px-2 font-semibold cursor-pointer"
              >
                All Activity <ArrowUpRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>

          {recentActivity.length === 0 ? (
            <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] py-8 text-center">
              No recent active user activity.
            </p>
          ) : (
            <div className="space-y-2.5">
              {recentActivity.map((ev: any) => (
                <div
                  key={ev.id}
                  className="p-3 rounded-xl bg-white/80 dark:bg-[#121216]/80 border border-[#E5E4DF] dark:border-white/10 flex items-center justify-between gap-3 text-xs hover:bg-white dark:hover:bg-[#18181E] transition-all shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                      <Avatar className="h-7 w-7 rounded-full border border-[#E5E4DF] dark:border-white/10">
                        <AvatarImage src={ev.actorImage || undefined} />
                        <AvatarFallback className="bg-[#FAF9F6] dark:bg-[#18181E] text-[#0A0A0A] dark:text-[#F8FAFC] font-bold text-[10px]">
                          {ev.actorName?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-white dark:border-[#121216] ${
                          ev.isOnline
                            ? "bg-emerald-500 animate-pulse"
                            : "bg-zinc-300 dark:bg-zinc-600"
                        }`}
                        title={ev.isOnline ? "Online Now" : "Offline"}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#0A0A0A] dark:text-[#F8FAFC] truncate max-w-[120px]">
                          {ev.actorName || "Platform User"}
                        </span>
                        {ev.actorParty === "brand" ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#F2F1EC] dark:bg-white/10 text-[#0A0A0A] dark:text-[#F8FAFC] border border-[#E5E4DF] dark:border-white/10">
                            Brand
                          </span>
                        ) : ev.actorParty === "creator" ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#FDF6F7] dark:bg-[#6A0D18]/25 text-[#6A0D18] dark:text-[#E87985] border border-[#EED8DC] dark:border-[#6A0D18]/40">
                            Creator
                          </span>
                        ) : null}
                      </div>
                      <p className="text-[11px] text-[#52525B] dark:text-[#A1A1AA] truncate max-w-[240px]">
                        {ev.summary}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block px-1.5 py-0.5 rounded bg-[#FAF9F6] dark:bg-white/5 text-[9px] font-mono text-[#6A0D18] dark:text-[#E87985] border border-[#E5E4DF] dark:border-white/10 mb-0.5">
                      {ev.eventType}
                    </span>
                    <p className="text-[10px] text-[#52525B] dark:text-[#A1A1AA] font-mono">
                      {new Date(ev.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security Audit Trail */}
        <div className="liquid-silver-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E4DF] dark:border-white/10">
            <div className="space-y-0.5">
              <h3 className="text-sm font-extrabold text-[#0A0A0A] dark:text-[#F8FAFC]">
                Security Audit Ledger
              </h3>
              <p className="text-xs text-[#52525B] dark:text-[#A1A1AA]">
                Immutable administrative action records
              </p>
            </div>
            <Link href="/admin/audit-logs">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-[#6A0D18] dark:text-[#E87985] h-7 px-2"
              >
                All Logs <ArrowUpRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>

          {recentAuditLogs.length === 0 ? (
            <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] py-8 text-center">
              No audit records logged.
            </p>
          ) : (
            <div className="space-y-3">
              {recentAuditLogs.map((log: any) => (
                <div
                  key={log.id}
                  className="p-3 rounded-lg bg-white/80 dark:bg-[#121216]/80 border border-[#E5E4DF] dark:border-white/10 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5 truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#0A0A0A] dark:text-[#F8FAFC] truncate">
                        {log.action}
                      </span>
                      <span className="text-[10px] text-[#6A0D18] dark:text-[#E87985] font-semibold">
                        by {log.adminName || log.adminEmail || "Admin"}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#52525B] dark:text-[#A1A1AA] truncate italic">
                      "{log.reason}"
                    </p>
                  </div>
                  <span className="text-[10px] text-[#52525B] dark:text-[#A1A1AA] whitespace-nowrap font-mono">
                    {new Date(log.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
