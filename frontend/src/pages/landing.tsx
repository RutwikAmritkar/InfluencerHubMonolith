import { useState, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { LEGAL_CONFIG } from "@/lib/legal-config";
import { ArrowRight, ArrowUpRight, CheckCircle2, Video, Layers, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

// ─── TYPES ───────────────────────────────────────────────────────────────────
export interface RegisteredCreatorPreview {
  id: number;
  name: string;
  category: string;
  followers: number;
  engagementRate: string | number;
  avatarUrl?: string;
  country?: string;
  isVerified?: boolean;
}

// ─── MARKETPLACE DELIVERABLE CATEGORIES ──────────────────────────────────────
const MARKETPLACE_FORMATS = [
  {
    id: "reels",
    badge: "9:16 Vertical Video",
    title: "Instagram Reels & Stories",
    deliverable: "1× Dedicated Reel + 2× Stories",
    typicalBudget: "₹25,000 – ₹85,000",
    specs: "Hook in 1.8s • Dual revision boundary • Tier-1 reach",
    actionLabel: "Browse Open Briefs",
    actionHref: "/opportunities",
    icon: Video,
  },
  {
    id: "youtube",
    badge: "Long-Form Video",
    title: "YouTube Dedicated & Mid-Rolls",
    deliverable: "60–90s Integrated Sponsor Segment",
    typicalBudget: "₹45,000 – ₹1,80,000",
    specs: "Pinned description link • 14-day telemetry • In-depth demo",
    actionLabel: "Explore Opportunities",
    actionHref: "/opportunities",
    icon: Sparkles,
  },
  {
    id: "ugc",
    badge: "Performance Creatives",
    title: "UGC Ad Packages & Whitelisting",
    deliverable: "3× Raw 4K Hooks + Paid Ad Rights",
    typicalBudget: "₹20,000 – ₹70,000",
    specs: "High-CTR scripting • Dual aspect ratio • Meta Spark ready",
    actionLabel: "Join as a Creator",
    actionHref: "/signup",
    icon: Layers,
  },
];

// ─── LIVE MARKETPLACE PREVIEW SECTION ────────────────────────────────────────
export function DiscoveryPreviewSection() {
  const { data: registeredCreators } = useQuery<RegisteredCreatorPreview[]>({
    queryKey: ["/api/influencers/featured"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/influencers/featured");
        if (!res.ok) return [];
        return (await res.json()) as RegisteredCreatorPreview[];
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const hasRealCreators = registeredCreators && registeredCreators.length > 0;

  return (
    <section id="discovery" className="py-12 lg:py-16 px-6 lg:px-10 max-w-7xl mx-auto space-y-8">
      {/* Section Header */}
      <div className="max-w-2xl mx-auto text-center space-y-2.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#6A0D18] dark:text-[#E87985]">
          Live Marketplace Preview
        </p>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#0A0A0A] dark:text-[#F8FAFC]">
          Structured creator formats with{" "}
          <span className="font-serif italic font-normal text-[#6A0D18] dark:text-[#E87985]">
            milestone-protected payouts.
          </span>
        </h2>
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl mx-auto">
          Explore structured commercial packages, review deliverables before production begins, and
          negotiate in versioned deal rooms without middleman markups.
        </p>
      </div>

      {/* Grid: Real Registered Creators or Standardized Format Hubs */}
      {hasRealCreators ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {registeredCreators.slice(0, 3).map((creator) => (
            <div
              key={creator.id}
              className="liquid-silver-card rounded-2xl p-6 flex flex-col justify-between space-y-5 transition-all border border-[rgba(106,13,24,0.35)] dark:border-[#E87985]/30 shadow-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl monogram-silver-burgundy flex items-center justify-center font-bold text-base text-[#6A0D18] dark:text-[#E87985] shrink-0">
                    {creator.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-[#0A0A0A] dark:text-[#F8FAFC] truncate">
                        {creator.name}
                      </h3>
                      {creator.isVerified && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#6A0D18] dark:text-[#E87985] shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                      {creator.category}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-md bg-[#FDF6F7] dark:bg-[#6A0D18]/25 text-[#6A0D18] dark:text-[#E87985] border border-[#EED8DC] dark:border-[#6A0D18]/40 text-xs font-semibold">
                  Verified Creator
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E5E4DF] dark:border-white/10 text-xs">
                <div>
                  <span className="text-zinc-400 dark:text-zinc-500 block text-[11px]">
                    Audience Reach
                  </span>
                  <span className="font-bold text-[#0A0A0A] dark:text-[#F8FAFC] font-tabular">
                    {creator.followers ? `${(creator.followers / 1000).toFixed(0)}K+` : "Growing"}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 dark:text-zinc-500 block text-[11px]">
                    Engagement Rate
                  </span>
                  <span className="font-bold text-[#6A0D18] dark:text-[#E87985]">
                    {creator.engagementRate ? `${creator.engagementRate}%` : "Audited"}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E5E4DF] dark:border-white/10 flex items-center justify-between gap-3">
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  India Roster
                </span>
                <Link href={`/influencers/${creator.id}`}>
                  <button className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg liquid-burgundy-metal text-xs font-semibold text-white shadow-xs cursor-pointer">
                    <span>View Media Kit</span>
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MARKETPLACE_FORMATS.map((fmt) => {
            const Icon = fmt.icon;
            return (
              <div
                key={fmt.id}
                className="liquid-silver-card rounded-2xl p-6 h-full flex flex-col justify-between space-y-5 transition-all border border-[rgba(106,13,24,0.35)] dark:border-[#E87985]/30 shadow-xs"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-[#FDF6F7] dark:bg-[#6A0D18]/25 text-[#6A0D18] dark:text-[#E87985] border border-[#EED8DC] dark:border-[#6A0D18]/40 text-xs font-semibold">
                      {fmt.badge}
                    </span>
                    <div className="h-8 w-8 rounded-lg bg-white/80 dark:bg-white/10 border border-[#E5E4DF] dark:border-white/10 flex items-center justify-center text-[#6A0D18] dark:text-[#E87985]">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                      {fmt.title}
                    </h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium mt-1">
                      {fmt.deliverable}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-[#E5E4DF] dark:border-white/10 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">Benchmark Rate</span>
                    <span className="font-bold text-[#0A0A0A] dark:text-[#F8FAFC] font-tabular">
                      {fmt.typicalBudget}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-zinc-500 dark:text-zinc-400 block text-[11px]">
                      Operating Specs
                    </span>
                    <p className="font-medium text-[#6A0D18] dark:text-[#E87985] text-xs leading-relaxed">
                      {fmt.specs}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E5E4DF] dark:border-white/10 flex items-center justify-between gap-3">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    Bilateral Terms
                  </span>
                  <Link href={fmt.actionHref}>
                    <button className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg liquid-burgundy-metal text-xs font-semibold text-white shadow-xs cursor-pointer">
                      <span>{fmt.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-white" />
                    </button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ─── MAIN LANDING PAGE COMPONENT ─────────────────────────────────────────────
export default function Landing() {
  const heroCardRef = useRef<HTMLDivElement>(null);
  const [heroMousePos, setHeroMousePos] = useState({ x: 50, y: 50 });
  const [isHeroHovered, setIsHeroHovered] = useState(false);

  const handleHeroMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroCardRef.current) return;
    const rect = heroCardRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setHeroMousePos({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
    setIsHeroHovered(true);
  }, []);

  const handleHeroMouseLeave = useCallback(() => {
    setHeroMousePos({ x: 50, y: 50 });
    setIsHeroHovered(false);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#09090B] text-[#0A0A0A] dark:text-[#F8FAFC] selection:bg-[#6A0D18] selection:text-white font-sans antialiased">
      {/* ─── 1. TOP EDITORIAL NAVIGATION ─────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#FAF9F6]/85 dark:bg-[#09090B]/85 backdrop-blur-lg border-b border-[#E5E4DF] dark:border-white/10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between md:grid md:grid-cols-3">
          {/* Col 1: Left Flanking Links (Desktop only) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 justify-self-start">
            <a
              href="#discovery"
              className="hover:text-[#6A0D18] dark:hover:text-[#E87985] transition-colors cursor-pointer"
            >
              Marketplace
            </a>
            <a
              href="#value-strip"
              className="hover:text-[#6A0D18] dark:hover:text-[#E87985] transition-colors cursor-pointer"
            >
              Economics
            </a>
            <a
              href="#workflow"
              className="hover:text-[#6A0D18] dark:hover:text-[#E87985] transition-colors cursor-pointer"
            >
              Workflow
            </a>
          </nav>

          {/* Col 2: Wordmark (Centered on desktop, left on mobile) */}
          <Link
            href="/"
            className="flex items-center gap-2 group cursor-pointer md:justify-self-center"
          >
            <div className="h-7 w-7 rounded-md bg-[#0A0A0A] dark:bg-white text-white dark:text-[#0A0A0A] flex items-center justify-center font-bold text-xs tracking-tighter shadow-xs group-hover:bg-[#6A0D18] dark:group-hover:bg-[#8B1524] dark:group-hover:text-white transition-colors">
              CB
            </div>
            <span className="text-base font-bold tracking-tight text-[#0A0A0A] dark:text-[#F8FAFC]">
              Creators
              <span className="font-serif italic font-normal text-[#6A0D18] dark:text-[#E87985] ml-0.5">
                Brand
              </span>
            </span>
          </Link>

          {/* Col 3: Right Controls & Auth CTA */}
          <div className="flex items-center gap-2 sm:gap-3 justify-self-end">
            <ThemeToggle />
            <Link
              href="/login"
              className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-[#0A0A0A] dark:hover:text-white transition-colors px-2 py-1"
            >
              Sign in
            </Link>
            <Link href="/signup">
              <button className="h-9 px-3.5 sm:px-4 rounded-lg liquid-burgundy-metal text-xs font-semibold text-white shadow-xs transition-all cursor-pointer">
                Join Roster
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ─── 2. ABOVE-THE-FOLD HERO SECTION WITH WARM EDITORIAL GRADIENT ─── */}
        <section className="relative py-12 sm:py-16 lg:py-20 border-b border-[#E5E4DF] dark:border-white/10 bg-editorial-hero">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* LEFT COLUMN (7 COLS): HEADLINE, SUBHEADLINE & DUAL ROLE CTAS */}
              <div className="lg:col-span-7 space-y-6 sm:space-y-8">
                {/* Eyebrow Badge */}
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full liquid-silver-card text-xs font-semibold text-[#0A0A0A] dark:text-[#F8FAFC] shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-[#6A0D18] dark:bg-[#E87985]" />
                    <span>DIRECT CREATOR–BRAND MARKETPLACE • INDIA</span>
                  </div>
                </div>

                {/* Display Headline with Signature Editorial Contrast */}
                <div className="space-y-4">
                  <h1 className="text-3xl sm:text-5xl lg:text-[3.5rem] font-bold text-[#0A0A0A] dark:text-[#F8FAFC] tracking-[-0.035em] leading-[1.08]">
                    Where creators get paid —{" "}
                    <span className="font-serif italic font-normal text-[#6A0D18] dark:text-[#E87985] block sm:inline">
                      not promised exposure.
                    </span>
                  </h1>

                  <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed max-w-xl">
                    Discover verified Indian creators, lock deliverables and INR payouts in
                    versioned deal rooms, review final content packages, and track settlements
                    without agency markups.
                  </p>
                </div>

                {/* Dual Role CTAs */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1">
                  <Link href="/signup">
                    <button className="px-6 py-3.5 rounded-xl liquid-burgundy-metal text-xs sm:text-sm font-semibold text-white inline-flex items-center justify-center gap-2 shadow-md hover:brightness-110 transition-all cursor-pointer w-full sm:w-auto">
                      <span>Launch a Campaign</span>
                      <ArrowRight className="w-4 h-4 text-white" />
                    </button>
                  </Link>

                  <Link href="/signup">
                    <button className="px-6 py-3.5 rounded-xl liquid-silver-card text-xs sm:text-sm font-semibold text-[#0A0A0A] dark:text-[#F8FAFC] hover:text-[#6A0D18] dark:hover:text-[#E87985] inline-flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer w-full sm:w-auto">
                      <span>Join as a Creator</span>
                      <ArrowUpRight className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                    </button>
                  </Link>
                </div>

                {/* Micro Guarantee & Key Metrics Anchor Row */}
                <div className="pt-6 border-t border-[#E5E4DF] dark:border-white/10 grid grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <div className="text-lg sm:text-2xl font-bold tracking-tight text-[#0A0A0A] dark:text-[#F8FAFC] font-tabular">
                      100%
                    </div>
                    <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-normal mt-0.5 leading-snug">
                      Agreed Payout Protection
                    </p>
                  </div>
                  <div>
                    <div className="text-lg sm:text-2xl font-bold tracking-tight text-[#0A0A0A] dark:text-[#F8FAFC] font-tabular">
                      T+0
                    </div>
                    <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-normal mt-0.5 leading-snug">
                      Settlement on Signoff
                    </p>
                  </div>
                  <div>
                    <div className="text-lg sm:text-2xl font-bold tracking-tight text-[#0A0A0A] dark:text-[#F8FAFC] font-tabular">
                      0%
                    </div>
                    <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-normal mt-0.5 leading-snug">
                      Agency Markups
                    </p>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN (5 COLS): LIVE CREATOR SHOWCASE VIDEO & DEAL TELEMETRY */}
              <div className="lg:col-span-5 relative">
                <div
                  ref={heroCardRef}
                  onMouseMove={handleHeroMouseMove}
                  onMouseLeave={handleHeroMouseLeave}
                  className="relative w-full rounded-3xl p-[1.5px] transition-[background] duration-300 ease-out shadow-[0_24px_48px_-12px_rgba(106,13,24,0.42)]"
                  style={{
                    background: isHeroHovered
                      ? `radial-gradient(340px circle at ${heroMousePos.x}% ${heroMousePos.y}%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.4) 30%, rgba(139,21,36,0.85) 70%, rgba(71,7,15,1) 100%)`
                      : `linear-gradient(145deg, rgba(255,255,255,0.65) 0%, rgba(139,21,36,0.8) 50%, rgba(71,7,15,1) 100%)`,
                  }}
                >
                  <div className="relative rounded-[22.5px] liquid-burgundy-metal p-2.5 sm:p-3 border border-white/20 backdrop-blur-2xl overflow-hidden">
                    {/* Video Container with Fallback Poster Frame */}
                    <div className="relative w-full h-[470px] sm:h-[510px] lg:h-[530px] rounded-[20px] overflow-hidden bg-[#2D0509]">
                      <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="auto"
                        poster="/images/creator-hero.jpg"
                        className="object-cover w-full h-full rounded-[20px]"
                      >
                        <source src="/videos/creator-hero.mp4" type="video/mp4" />
                        <img
                          src="/images/creator-hero.jpg"
                          alt="Creator filming campaign reel"
                          className="object-cover w-full h-full rounded-[20px]"
                        />
                      </video>

                      {/* Ambient Vignette & Gradient for Legibility */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40 pointer-events-none rounded-[20px]" />

                      {/* Top Badges Row */}
                      <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between gap-2 pointer-events-none">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-semibold shadow-lg">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Live Creator Studio</span>
                        </div>

                        <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-white/15 text-white border border-white/25 backdrop-blur-md">
                          DEAL ROOM • V2
                        </span>
                      </div>

                      {/* Compact, Frosted Silver-Glass Deal Telemetry Pill */}
                      <div className="absolute bottom-3 sm:bottom-3.5 inset-x-3 sm:inset-x-3.5 liquid-silver-card rounded-2xl p-4 sm:p-4.5 border border-[rgba(106,13,24,0.35)] dark:border-[#E87985]/30 shadow-2xl backdrop-blur-xl">
                        {/* Telemetry Header */}
                        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#E5E4DF] dark:border-white/10">
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#6A0D18] dark:text-[#E87985] px-2 py-0.5 rounded bg-[#FDF6F7] dark:bg-[#6A0D18]/25 border border-[#EED8DC] dark:border-[#6A0D18]/40">
                            FESTIVE LAUNCH DEAL • v2
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            Bilateral Signoff Confirmed
                          </span>
                        </div>

                        {/* Financial & Milestone Status */}
                        <div className="pt-2.5 flex items-end justify-between gap-3">
                          <div>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0A0A0A] dark:text-[#F8FAFC] font-tabular">
                                ₹45,000
                              </span>
                              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                Agreed
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal mt-0.5">
                              100% Escrow • T+0 UPI Settlement
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-bold text-[#0A0A0A] dark:text-[#F8FAFC] block">
                              1× IG Reel + 2× Stories
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 block mt-0.5">
                              SHA-256 Verified
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 3. FULL-WIDTH HORIZONTAL VALUE STRIP (SILVER-PARCHMENT) ─────── */}
        <section
          id="value-strip"
          className="border-b border-[#E5E4DF] dark:border-white/10 bg-[linear-gradient(180deg,#FAF9F6_0%,#F7F5F0_100%)] dark:bg-[linear-gradient(180deg,#09090B_0%,#121216_100%)]"
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E5E4DF] dark:divide-white/10">
              {/* Item 1 */}
              <div className="py-6 sm:py-8 px-0 sm:px-6 first:sm:pl-0 last:sm:pr-0 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6A0D18] dark:text-[#E87985]">
                  <span className="font-mono">01</span>
                  <span className="h-1 w-1 rounded-full bg-[#6A0D18] dark:bg-[#E87985]" />
                  <span>Direct Economics</span>
                </div>
                <h3 className="text-base font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                  0% Agency Markups
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Direct brand-to-creator agreements with transparent rates and zero hidden
                  commissions.
                </p>
              </div>

              {/* Item 2 */}
              <div className="py-6 sm:py-8 px-0 sm:px-6 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6A0D18] dark:text-[#E87985]">
                  <span className="font-mono">02</span>
                  <span className="h-1 w-1 rounded-full bg-[#6A0D18] dark:bg-[#E87985]" />
                  <span>Deal Flexibility</span>
                </div>
                <h3 className="text-base font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                  Paid, Barter & Hybrid
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Structure flexible commercial proposals across fixed INR fees, gifting/barter, and
                  performance tiers.
                </p>
              </div>

              {/* Item 3 */}
              <div className="py-6 sm:py-8 px-0 sm:px-6 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6A0D18] dark:text-[#E87985]">
                  <span className="font-mono">03</span>
                  <span className="h-1 w-1 rounded-full bg-[#6A0D18] dark:bg-[#E87985]" />
                  <span>Audit Trail</span>
                </div>
                <h3 className="text-base font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                  Versioned Deal Rooms
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Every proposal modification and counter-offer tracked (v1, v2) with optimistic
                  locking.
                </p>
              </div>

              {/* Item 4 */}
              <div className="py-6 sm:py-8 px-0 sm:px-6 first:sm:pl-0 last:sm:pr-0 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6A0D18] dark:text-[#E87985]">
                  <span className="font-mono">04</span>
                  <span className="h-1 w-1 rounded-full bg-[#6A0D18] dark:bg-[#E87985]" />
                  <span>Clear Signoffs</span>
                </div>
                <h3 className="text-base font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                  Package-First Review
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Streamlined content submissions, deliverable links, and pre-agreed revision
                  boundaries.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 4. LIVE MARKETPLACE PREVIEW (ROSE-TINTED ALABASTER) ─────────── */}
        <div className="border-b border-[#E5E4DF] dark:border-white/10 bg-rose-alabaster">
          <DiscoveryPreviewSection />
        </div>

        {/* ─── 5. DUAL-ROLE EDITORIAL WORKFLOW SPLIT (BRANDS & CREATORS) ──── */}
        <section
          id="workflow"
          className="py-12 lg:py-16 px-6 lg:px-10 border-b border-[#E5E4DF] dark:border-white/10 bg-silver-parchment"
        >
          <div className="max-w-7xl mx-auto space-y-10">
            {/* Section Header */}
            <div className="max-w-2xl mx-auto text-center space-y-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#6A0D18] dark:text-[#E87985] block">
                Bilateral Architecture
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#0A0A0A] dark:text-[#F8FAFC]">
                Structured workflows for both sides of the table.
              </h2>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed">
                Whether you are launching high-impact campaigns or monetizing audited reach,
                CreatorsBrand guarantees complete contract transparency and pre-funded milestone
                security.
              </p>
            </div>

            {/* 2-Column Editorial Split Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              {/* Left Card: For Brands */}
              <div className="liquid-silver-card rounded-3xl p-7 sm:p-9 flex flex-col justify-between space-y-8 border border-[rgba(106,13,24,0.40)] dark:border-[#E87985]/30 shadow-sm">
                <div className="space-y-6">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-md bg-[#FDF6F7] dark:bg-[#6A0D18]/25 text-[#6A0D18] dark:text-[#E87985] border border-[#EED8DC] dark:border-[#6A0D18]/40">
                      For Brands
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                      Direct Commissioning
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-[#0A0A0A] dark:text-[#F8FAFC] tracking-tight">
                      Deploy high-ROI campaigns without agency friction.
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                      Publish structured requirements, negotiate directly in bilateral deal rooms,
                      and lock agreed milestone payouts in escrow before content production begins.
                    </p>
                  </div>

                  {/* 3 Concise Bullet Milestones */}
                  <div className="space-y-3.5 pt-2">
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-[#FDF6F7] dark:bg-[#6A0D18]/25 border border-[#EED8DC] dark:border-[#6A0D18]/40 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#6A0D18] dark:text-[#E87985]" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                          Publish structured briefs in INR
                        </h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                          Define exact deliverable specs, target niches, deadlines, and fixed
                          budgets with zero hidden cuts.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-[#FDF6F7] dark:bg-[#6A0D18]/25 border border-[#EED8DC] dark:border-[#6A0D18]/40 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#6A0D18] dark:text-[#E87985]" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                          Negotiate versioned scopes without agency fees
                        </h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                          Agree on revisions, rights, and timelines with optimistic concurrency
                          locking and auditable history.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-[#FDF6F7] dark:bg-[#6A0D18]/25 border border-[#EED8DC] dark:border-[#6A0D18]/40 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#6A0D18] dark:text-[#E87985]" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                          Approve final content packages before settlement
                        </h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                          Review video proofs, raw hooks, and caption links with dual signoff
                          required for escrow release.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-[#E5E4DF] dark:border-white/10">
                  <Link href="/campaigns/create">
                    <button className="w-full py-3.5 px-6 rounded-xl liquid-burgundy-metal text-xs sm:text-sm font-semibold text-white inline-flex items-center justify-center gap-2 shadow-sm hover:brightness-110 transition-all cursor-pointer">
                      <span>Post a Brand Brief</span>
                      <ArrowRight className="w-4 h-4 text-white" />
                    </button>
                  </Link>
                </div>
              </div>

              {/* Right Card: For Creators */}
              <div className="liquid-silver-card rounded-3xl p-7 sm:p-9 flex flex-col justify-between space-y-8 border border-[rgba(106,13,24,0.40)] dark:border-[#E87985]/30 shadow-sm">
                <div className="space-y-6">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-md bg-[#FDF6F7] dark:bg-[#6A0D18]/25 text-[#6A0D18] dark:text-[#E87985] border border-[#EED8DC] dark:border-[#6A0D18]/40">
                      For Creators
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                      Guaranteed Settlements
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-[#0A0A0A] dark:text-[#F8FAFC] tracking-tight">
                      Monetize your creative work with zero payment chasing.
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                      Lock legally binding deliverables and payouts before filming. Never work on
                      promises again—every campaign is backed by pre-funded milestone security.
                    </p>
                  </div>

                  {/* 3 Concise Bullet Milestones */}
                  <div className="space-y-3.5 pt-2">
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-[#FDF6F7] dark:bg-[#6A0D18]/25 border border-[#EED8DC] dark:border-[#6A0D18]/40 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#6A0D18] dark:text-[#E87985]" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                          Showcase verified reach & transparent rate cards
                        </h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                          Display verified audience statistics, engagement rates, and standardized
                          pricing to top brands.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-[#FDF6F7] dark:bg-[#6A0D18]/25 border border-[#EED8DC] dark:border-[#6A0D18]/40 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#6A0D18] dark:text-[#E87985]" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                          Lock deliverables, timelines & revision limits in writing
                        </h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                          Prevent scope creep with standardized deal room contracts and explicit
                          approval windows.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-[#FDF6F7] dark:bg-[#6A0D18]/25 border border-[#EED8DC] dark:border-[#6A0D18]/40 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#6A0D18] dark:text-[#E87985]" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                          Track agreed payouts & barter dispatches in one ledger
                        </h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                          Instant T+0 UPI and IMPS direct disbursements upon dual signoff with zero
                          platform clawbacks.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-[#E5E4DF] dark:border-white/10">
                  <Link href="/signup">
                    <button className="w-full py-3.5 px-6 rounded-xl liquid-burgundy-metal text-xs sm:text-sm font-semibold text-white inline-flex items-center justify-center gap-2 shadow-sm hover:brightness-110 transition-all cursor-pointer">
                      <span>Create Creator Profile</span>
                      <ArrowRight className="w-4 h-4 text-white" />
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 6. FULL-WIDTH #6A0D18 LIQUID BURGUNDY CLOSING BANNER ─────────── */}
        <section className="py-12 lg:py-16 px-6 lg:px-10 bg-[linear-gradient(180deg,#FAF9F6_0%,#F6EFEA_100%)] dark:bg-[linear-gradient(180deg,#09090B_0%,#121216_100%)]">
          <div className="max-w-7xl mx-auto rounded-3xl liquid-burgundy-metal text-white p-8 sm:p-12 lg:p-16 text-center space-y-6 sm:space-y-8 relative overflow-hidden shadow-2xl">
            <div className="relative z-10 max-w-3xl mx-auto space-y-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-200/90 block">
                Direct Commercial Infrastructure • India
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
                Stop negotiating in DMs.{" "}
                <span className="font-serif italic font-normal text-rose-200 block sm:inline">
                  Start closing structured deals.
                </span>
              </h2>
              <p className="text-sm sm:text-base text-rose-100/90 font-normal leading-relaxed max-w-2xl mx-auto">
                Pre-funded milestone vaults, dual-signoff deliverable packages, and zero agency
                markups for modern brands and high-retention creators.
              </p>
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              {/* High-Contrast Solid White Button with Burgundy Text */}
              <Link href="/signup">
                <button className="px-7 py-3.5 rounded-xl bg-white text-[#6A0D18] font-bold hover:bg-[#FDF6F7] shadow-lg text-xs sm:text-sm inline-flex items-center gap-2 transition-all cursor-pointer w-full sm:w-auto justify-center">
                  <span>Create Brand Account</span>
                  <ArrowRight className="w-4 h-4 text-[#6A0D18]" />
                </button>
              </Link>
              {/* High-Contrast Frosted Secondary Button */}
              <Link href="/signup">
                <button className="px-7 py-3.5 rounded-xl bg-white/15 text-white border border-white/40 backdrop-blur-md hover:bg-white/25 font-semibold text-xs sm:text-sm inline-flex items-center gap-2 transition-all cursor-pointer w-full sm:w-auto justify-center">
                  <span>Create Creator Profile</span>
                  <ArrowUpRight className="w-4 h-4 text-white" />
                </button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ─── 7. STRUCTURED 4-COLUMN EDITORIAL FOOTER ───────────────────────── */}
      <footer className="border-t border-[#E5E4DF] dark:border-white/10 bg-[#FAF9F6] dark:bg-[#09090B] py-12 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
            {/* Col 1: Brand & Purpose */}
            <div className="col-span-2 sm:col-span-1 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-md bg-[#0A0A0A] dark:bg-white text-white dark:text-[#0A0A0A] flex items-center justify-center font-bold text-xs tracking-tighter shadow-xs">
                  CB
                </div>
                <span className="text-base font-bold tracking-tight text-[#0A0A0A] dark:text-[#F8FAFC]">
                  Creators
                  <span className="font-serif italic font-normal text-[#6A0D18] dark:text-[#E87985]">
                    Brand
                  </span>
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xs">
                Direct commercial infrastructure connecting vetted Indian brands and verified
                high-retention creators.
              </p>
              <div className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
                {LEGAL_CONFIG.OPERATED_BY}
              </div>
            </div>

            {/* Col 2: Marketplace */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A] dark:text-[#F8FAFC]">
                Marketplace
              </h4>
              <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                <li>
                  <Link
                    href="/find-creators"
                    className="hover:text-[#6A0D18] dark:hover:text-[#E87985] transition-colors"
                  >
                    Discover Creators
                  </Link>
                </li>
                <li>
                  <a
                    href="#discovery"
                    className="hover:text-[#6A0D18] dark:hover:text-[#E87985] transition-colors"
                  >
                    Marketplace Deliverables
                  </a>
                </li>
                <li>
                  <Link
                    href="/opportunities"
                    className="hover:text-[#6A0D18] dark:hover:text-[#E87985] transition-colors"
                  >
                    Explore Open Campaigns
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="hover:text-[#6A0D18] dark:hover:text-[#E87985] transition-colors"
                  >
                    Brand Workspace
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Operating Rails */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A] dark:text-[#F8FAFC]">
                Operating Rails
              </h4>
              <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                <li>
                  <Link
                    href="/deals"
                    className="hover:text-[#6A0D18] dark:hover:text-[#E87985] transition-colors"
                  >
                    Versioned Deal Rooms
                  </Link>
                </li>
                <li>
                  <Link
                    href="/payments"
                    className="hover:text-[#6A0D18] dark:hover:text-[#E87985] transition-colors"
                  >
                    Milestone Payout Vaults
                  </Link>
                </li>
                <li>
                  <a
                    href="#value-strip"
                    className="hover:text-[#6A0D18] dark:hover:text-[#E87985] transition-colors"
                  >
                    Direct Economics
                  </a>
                </li>
                <li>
                  <a
                    href="#workflow"
                    className="hover:text-[#6A0D18] dark:hover:text-[#E87985] transition-colors"
                  >
                    Commercial Architecture
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 4: Compliance & Legal */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A] dark:text-[#F8FAFC]">
                Compliance & Legal
              </h4>
              <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                <li>
                  <Link
                    href="/terms"
                    className="hover:text-[#6A0D18] dark:hover:text-[#E87985] transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-[#6A0D18] dark:hover:text-[#E87985] transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/support"
                    className="hover:text-[#6A0D18] dark:hover:text-[#E87985] transition-colors"
                  >
                    Support & Disputes
                  </Link>
                </li>
                <li>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    Live Workspace Data
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-[#E5E4DF] dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400">
            <p>© {new Date().getFullYear()} CreatorsBrand. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link
                href="/terms"
                className="hover:text-[#0A0A0A] dark:hover:text-[#F8FAFC] transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="hover:text-[#0A0A0A] dark:hover:text-[#F8FAFC] transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/support"
                className="hover:text-[#0A0A0A] dark:hover:text-[#F8FAFC] transition-colors"
              >
                Support
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
