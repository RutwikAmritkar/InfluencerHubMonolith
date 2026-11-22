import React, { useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import {
  CheckCircle2,
  Instagram,
  Youtube,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  MapPin,
  Clock,
  Copy,
  ExternalLink,
  Lock,
  ArrowLeft,
  FileCheck2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function PublicMediaKitPage() {
  const [, params] = useRoute<{ handle: string }>("/c/:handle");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const rawHandle = params ? params.handle : "maya";
  const [selectedDeliverable, setSelectedDeliverable] = useState<string>("1× Instagram Reel");

  const {
    data: creator,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["publicMediaKit", rawHandle],
    queryFn: async () => {
      const res = await fetch(`/api/c/${encodeURIComponent(rawHandle)}`);
      if (!res.ok) {
        throw new Error("Creator media kit not found");
      }
      return res.json();
    },
  });

  const handleProposeDeal = () => {
    if (!user) {
      toast.info("Sign in or create a Brand account to open a direct Deal Room.");
      setLocation(`/login?redirect=/c/${rawHandle}`);
      return;
    }
    if (user.role === "brand") {
      setLocation(
        `/deals?creatorId=${creator?.id || 1}&creatorName=${encodeURIComponent(creator?.name || "")}`
      );
    } else {
      toast.info("Switch to a Brand account to initiate a commercial collaboration.");
      setLocation("/deals");
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Media Kit link copied to clipboard!");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-6 text-[#0A0A0A]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Loading Verified Media Kit...
          </span>
        </div>
      </div>
    );
  }

  const name = creator?.name || "Maya Chen";
  const handle = creator?.handle || `@${rawHandle}`;
  const bio =
    creator?.bio ||
    "Lifestyle & technology content creator delivering high-retention commercial Reels.";
  const followers = creator?.followers || 285000;
  const er = creator?.engagementRate || 6.2;
  const avgViews = creator?.avgViews || 75000;
  const startingRate = creator?.collaborationCost || 45000;
  const avatarUrl =
    creator?.avatarUrl ||
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=600&auto=format&fit=crop";
  const isVerified = Boolean(creator?.isVerified);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0A0A0A] antialiased">
      {/* ─── 1. TOP EDITORIAL NAVIGATION ───────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-[#E5E4DF]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0A0A0A] text-white flex items-center justify-center font-bold text-xs tracking-tighter">
              CB
            </div>
            <span className="font-bold text-sm tracking-tight text-[#0A0A0A]">
              Creators<span className="font-serif italic font-normal text-[#6A0D18]">Brand</span>
            </span>
          </Link>

          <div className="flex items-center gap-2.5">
            <button
              onClick={copyShareLink}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E4DF] bg-white hover:bg-[#FAF9F6] text-xs font-semibold text-[#0A0A0A] transition-colors shadow-2xs"
            >
              <Copy className="w-3.5 h-3.5 text-zinc-500" />
              <span>Share Kit</span>
            </button>

            <Button
              onClick={handleProposeDeal}
              className="h-9 px-4 rounded-lg bg-[#0A0A0A] hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#6A0D18]" />
              <span>Propose a Deal</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ─── 2. MAIN MEDIA KIT DOSSIER ─────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* HERO CARD */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E5E4DF] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="relative">
                <img
                  src={avatarUrl}
                  alt={name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-[#E5E4DF] shadow-xs"
                />
                {isVerified && (
                  <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full shadow-xs border border-[#E5E4DF]">
                    <CheckCircle2 className="w-4 h-4 text-[#6A0D18] fill-[#FDF6F7]" />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0A0A0A]">
                    {name}
                  </h1>
                  {isVerified && (
                    <span className="px-2 py-0.5 rounded-md bg-[#FDF6F7] border border-[#EED8DC] text-[#6A0D18] text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Verified Handle</span>
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm font-semibold text-zinc-500">
                  {handle} • {creator?.category || "Lifestyle & Tech"}
                </p>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-zinc-500 pt-0.5">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                    <span>
                      {creator?.city || "Mumbai"}, {creator?.country || "India"}
                    </span>
                  </span>
                  <span>•</span>
                  <span>Direct Milestone Protection</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleProposeDeal}
              className="w-full sm:w-auto h-11 px-6 rounded-xl bg-[#0A0A0A] hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <span>Initiate Direct Deal Room</span>
              <ArrowRight className="w-4 h-4 text-[#6A0D18]" />
            </Button>
          </div>

          <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed font-normal pt-2 border-t border-[#E5E4DF]">
            {bio}
          </p>
        </div>

        {/* ─── 3. AUDIENCE TELEMETRY LEDGER (4 COLS) ─────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-[#E5E4DF] shadow-xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
              Audience Reach
            </span>
            <span className="text-2xl font-bold font-tabular text-[#0A0A0A]">
              {followers.toLocaleString("en-IN")}
            </span>
            <span className="text-[11px] text-zinc-500 block">Verified Audience Velocity</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E5E4DF] shadow-xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
              Engagement Rate
            </span>
            <span className="text-2xl font-bold font-tabular text-emerald-600">{er}%</span>
            <span className="text-[11px] text-zinc-500 block">4.2× Indian Benchmark</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E5E4DF] shadow-xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
              Average Impressions
            </span>
            <span className="text-2xl font-bold font-tabular text-[#0A0A0A]">
              {avgViews.toLocaleString("en-IN")}
            </span>
            <span className="text-[11px] text-zinc-500 block">Median Organic Reach</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E5E4DF] shadow-xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
              Starting Rate Card
            </span>
            <span className="text-2xl font-bold font-tabular text-[#6A0D18]">
              ₹{startingRate.toLocaleString("en-IN")}
            </span>
            <span className="text-[11px] text-zinc-500 block">Single Deliverable Base</span>
          </div>
        </div>

        {/* ─── 4. COMMERCIAL RATE CARD SCOPE ─────────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-[#0A0A0A] tracking-tight">
              Commercial Deliverables &amp; Formats
            </h2>
            <span className="text-xs text-zinc-500 font-semibold">
              Canonical Dual Sign-Off Guaranteed
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => setSelectedDeliverable("1× Instagram Reel")}
              className={`p-5 rounded-2xl border transition-all cursor-pointer bg-white space-y-3 ${
                selectedDeliverable === "1× Instagram Reel"
                  ? "border-[#6A0D18] ring-2 ring-[#6A0D18]/10 shadow-xs"
                  : "border-[#E5E4DF] hover:border-zinc-400 shadow-2xs"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-pink-50 text-pink-700 border border-pink-200 inline-flex items-center gap-1">
                  <Instagram className="w-3 h-3" />
                  <span>Instagram</span>
                </span>
                <span className="text-base font-bold font-tabular text-[#0A0A0A]">₹45,000</span>
              </div>
              <h3 className="text-sm font-bold text-[#0A0A0A]">1× 9:16 Vertical Reel</h3>
              <p className="text-xs text-zinc-500 leading-relaxed font-normal">
                30–60s organic narrative integration with custom caption, brand tag, and 30-day
                usage rights.
              </p>
            </div>

            <div
              onClick={() => setSelectedDeliverable("1× Dedicated YouTube Video")}
              className={`p-5 rounded-2xl border transition-all cursor-pointer bg-white space-y-3 ${
                selectedDeliverable === "1× Dedicated YouTube Video"
                  ? "border-[#6A0D18] ring-2 ring-[#6A0D18]/10 shadow-xs"
                  : "border-[#E5E4DF] hover:border-zinc-400 shadow-2xs"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-50 text-red-700 border border-red-200 inline-flex items-center gap-1">
                  <Youtube className="w-3 h-3" />
                  <span>YouTube</span>
                </span>
                <span className="text-base font-bold font-tabular text-[#0A0A0A]">₹1,20,000</span>
              </div>
              <h3 className="text-sm font-bold text-[#0A0A0A]">1× Dedicated 4K Review</h3>
              <p className="text-xs text-zinc-500 leading-relaxed font-normal">
                8–12 min long-form deep dive with end-card CTA, pinned comment, and description
                affiliate tracking.
              </p>
            </div>

            <div
              onClick={() => setSelectedDeliverable("1× UGC Video Only")}
              className={`p-5 rounded-2xl border transition-all cursor-pointer bg-white space-y-3 ${
                selectedDeliverable === "1× UGC Video Only"
                  ? "border-[#6A0D18] ring-2 ring-[#6A0D18]/10 shadow-xs"
                  : "border-[#E5E4DF] hover:border-zinc-400 shadow-2xs"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#FDF6F7] text-[#6A0D18] border border-[#EED8DC] inline-flex items-center gap-1">
                  <FileCheck2 className="w-3 h-3" />
                  <span>UGC Production</span>
                </span>
                <span className="text-base font-bold font-tabular text-[#0A0A0A]">₹30,000</span>
              </div>
              <h3 className="text-sm font-bold text-[#0A0A0A]">Direct Raw Asset (No Post)</h3>
              <p className="text-xs text-zinc-500 leading-relaxed font-normal">
                Clean master cut delivered with full Spark Ads commercial advertising permissions
                for 60 days.
              </p>
            </div>
          </div>
        </div>

        {/* ─── 5. COMMERCIAL SECURITY GUARANTEE ───────────────────────────────── */}
        <div className="p-6 rounded-2xl bg-zinc-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Pre-Funded Milestone Security
              </span>
            </div>
            <p className="text-xs text-zinc-400 max-w-xl">
              Brand commits budget prior to creator production. Creators produce with certainty.
              Funds release only upon bilateral delivery confirmation.
            </p>
          </div>

          <Button
            onClick={handleProposeDeal}
            className="w-full sm:w-auto h-10 px-5 rounded-lg bg-white hover:bg-zinc-100 text-[#0A0A0A] font-semibold text-xs shadow-xs cursor-pointer inline-flex items-center justify-center gap-1.5 shrink-0"
          >
            <span>Propose Commercial Terms</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </main>
    </div>
  );
}
