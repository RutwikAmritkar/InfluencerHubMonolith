import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { LEGAL_CONFIG } from "@/lib/legal-config";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  useInView,
} from "framer-motion";
import {
  Users,
  Zap,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Target,
  Inbox,
  Calendar,
  CheckSquare,
  ListTodo,
  Star,
  CheckCircle2,
  Megaphone,
  Laptop,
  Smartphone,
  ShieldCheck,
  Search,
  Instagram,
  Youtube,
  BarChart3,
  DollarSign,
  Send,
  Eye,
  Sliders,
  Award,
  Lock,
  ArrowUpRight,
  CircleDollarSign,
  FileCheck2,
  Layers,
  MapPin,
} from "lucide-react";

// ─── ANIMATED NUMBER COUNTER ───────────────────────────────────────────────
function AnimatedCounter({
  from = 0,
  to,
  duration = 1.5,
  suffix = "",
  prefix = "",
}: {
  from?: number;
  to: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
}) {
  const [count, setCount] = useState(from);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!isInView) return;
    let startTime: number;
    let animationFrame: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      setCount(Math.floor(progress * (to - from) + from));
      if (progress < 1) {
        animationFrame = requestAnimationFrame(step);
      }
    };

    animationFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrame);
  }, [isInView, from, to, duration]);

  return (
    <span ref={ref} className="font-mono font-bold tracking-tight">
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

// ─── REAL INDIAN BENCHMARKS & DISCOVERY PREVIEW SECTION ──────────────────
const REAL_INDIAN_BENCHMARKS = [
  {
    name: "Komal Pandey",
    handle: "@komalpandeyofficial",
    instagramUrl: "https://www.instagram.com/komalpandeyofficial/",
    initials: "KP",
    niche: "Fashion & Editorial Styling",
    followers: "1.9M+",
    primaryDemo: "18–34 • 78% India",
    topCities: "Delhi NCR, Mumbai",
    formatStrength: "9:16 Styling Reels",
    badge: "Public Benchmark",
  },
  {
    name: "Ankush Bahuguna",
    handle: "@ankushbahuguna",
    instagramUrl: "https://www.instagram.com/ankushbahuguna/",
    initials: "AB",
    niche: "Men's Grooming & Comedy",
    followers: "1.3M+",
    primaryDemo: "18–34 • 84% India",
    topCities: "Mumbai, Bengaluru",
    formatStrength: "Skits & Beauty Reviews",
    badge: "Public Benchmark",
  },
  {
    name: "Shlok Srivastava",
    handle: "@techburner",
    instagramUrl: "https://www.instagram.com/techburner/",
    initials: "TB",
    niche: "Consumer Tech & Gadgets",
    followers: "4.5M+",
    primaryDemo: "18–34 • 89% India",
    topCities: "Delhi NCR, Pune",
    formatStrength: "High-Retention Tech Reels",
    badge: "Public Benchmark",
  },
];

export function DiscoveryPreviewSection() {
  return (
    <section id="discovery" className="py-20 px-6 lg:px-10 max-w-7xl mx-auto space-y-12">
      {/* Section Header */}
      <div className="max-w-2xl mx-auto text-center space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
          Creator Discovery Engine
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0A0A0A]">
          Evaluate Indian creators with{" "}
          <span className="font-serif italic font-normal text-blue-700">
            verified audience data.
          </span>
        </h2>
        <p className="text-sm text-zinc-500 leading-relaxed">
          Inspect real demographic splits, Tier-1 city concentrations, and format performance before
          sending a collaboration brief.
        </p>
      </div>

      {/* 3-Column Creator Benchmark Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {REAL_INDIAN_BENCHMARKS.map((creator) => (
          <div
            key={creator.handle}
            className="bg-white rounded-2xl border border-[#E5E4DF] p-6 shadow-xs flex flex-col justify-between space-y-5 hover:border-zinc-400 transition-colors"
          >
            {/* Top Identity Row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-[#0A0A0A] text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {creator.initials}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-[#0A0A0A] truncate">{creator.name}</h3>
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                  </div>
                  <a
                    href={creator.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-blue-700 transition-colors truncate"
                  >
                    <Instagram className="w-3 h-3 shrink-0" />
                    <span className="truncate">{creator.handle}</span>
                  </a>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 text-xs font-semibold shrink-0">
                {creator.badge}
              </span>
            </div>

            {/* Niche Tag */}
            <div className="px-3 py-1.5 rounded-lg bg-[#FAF9F6] border border-[#E5E4DF] text-xs font-medium text-zinc-700">
              {creator.niche}
            </div>

            {/* 2x2 Audience Ledger */}
            <div className="grid grid-cols-2 gap-y-3.5 gap-x-4 pt-1 border-t border-[#E5E4DF] text-xs">
              <div>
                <span className="text-zinc-400 block">Instagram Reach</span>
                <span className="font-bold text-[#0A0A0A] font-tabular">{creator.followers}</span>
              </div>
              <div>
                <span className="text-zinc-400 block">Primary Format</span>
                <span className="font-bold text-blue-700">{creator.formatStrength}</span>
              </div>
              <div>
                <span className="text-zinc-400 block">Core Audience</span>
                <span className="font-semibold text-[#0A0A0A] font-tabular">
                  {creator.primaryDemo}
                </span>
              </div>
              <div>
                <span className="text-zinc-400 block">Top Metros</span>
                <span className="font-semibold text-[#0A0A0A] truncate block">
                  {creator.topCities}
                </span>
              </div>
            </div>

            {/* Footer Action Linking to Real Instagram Profile */}
            <div className="pt-3 border-t border-[#E5E4DF] flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                India
              </span>
              <a
                href={creator.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FAF9F6] hover:bg-[#0A0A0A] text-[#0A0A0A] hover:text-white border border-[#E5E4DF] text-xs font-semibold transition-colors"
              >
                <span>Inspect Instagram</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── CREATOR JOURNEY STEPS ────────────────────────────────────────────────
const JOURNEY_STEPS = [
  {
    step: "01",
    title: "Connect Social Accounts",
    desc: "Link Instagram and YouTube with official OAuth authentication.",
    icon: Zap,
  },
  {
    step: "02",
    title: "Verified Identity Pass",
    desc: "Gain roster verification, rate card transparency, and milestone payment protection.",
    icon: ShieldCheck,
  },
  {
    step: "03",
    title: "Review Matching Briefs",
    desc: "Access high-ticket brand campaigns matching your niche and minimum fee.",
    icon: Search,
  },
  {
    step: "04",
    title: "Mutual Deal Room",
    desc: "Negotiate milestone deadlines and compensation with clear contractual terms.",
    icon: FileCheck2,
  },
  {
    step: "05",
    title: "Confirm Terms & Deliver",
    desc: "Brands pre-fund 100% of the contract budget into safe milestone vaults.",
    icon: Lock,
  },
  {
    step: "06",
    title: "Automated Release",
    desc: "Funds disburse directly to creator accounts upon deliverable signoff.",
    icon: CircleDollarSign,
  },
];

export default function Landing() {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [hoveredCreatorId, setHoveredCreatorId] = useState<number | null>(1);
  const [aiStage, setAiStage] = useState<"idle" | "typing" | "analyzing" | "complete">("idle");
  const shouldReduceMotion = useReducedMotion();

  // AI Assistant Interactive Simulation Trigger
  const triggerAiDemo = () => {
    setAiStage("typing");
    setTimeout(() => {
      setAiStage("analyzing");
      setTimeout(() => {
        setAiStage("complete");
      }, 1200);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0A0A0A] selection:bg-[#1D4ED8] selection:text-white font-sans antialiased">
      {/* ─── 1. MINIMAL CENTERED-LOGO TOP NAVIGATION ───────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#FAF9F6]/80 backdrop-blur-lg border-b border-slate-200/60 transition-colors">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 grid grid-cols-3 items-center">
          {/* Col 1: Left Flanking Links */}
          <nav className="flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-[#52525B] justify-self-start">
            <a href="#discovery" className="hover:text-[#0A0A0A] transition-colors cursor-pointer">
              Discovery
            </a>
            <a
              href="#social-proof"
              className="hover:text-[#0A0A0A] transition-colors cursor-pointer hidden sm:inline-block"
            >
              Economics
            </a>
            <a
              href="#telemetry"
              className="hover:text-[#0A0A0A] transition-colors cursor-pointer hidden md:inline-block"
            >
              Telemetry
            </a>
            <a
              href="#workflow"
              className="hover:text-[#0A0A0A] transition-colors cursor-pointer hidden lg:inline-block"
            >
              Architecture
            </a>
          </nav>

          {/* Col 2: Mathematically Centered Wordmark */}
          <Link
            href="/"
            className="flex items-center gap-2 group cursor-pointer justify-self-center"
          >
            <div className="h-7 w-7 rounded-md bg-[#0A0A0A] text-white flex items-center justify-center font-bold text-xs tracking-tighter shadow-xs group-hover:bg-[#1D4ED8] transition-colors">
              CB
            </div>
            <span className="text-base font-bold tracking-tight text-[#0A0A0A]">
              Creators
              <span className="font-serif italic font-normal text-[#1D4ED8] ml-0.5">Brand</span>
            </span>
          </Link>

          {/* Col 3: Right Controls & Auth CTA */}
          <div className="flex items-center gap-3 justify-self-end">
            <Link
              href="/login"
              className="text-xs font-semibold text-[#52525B] hover:text-[#0A0A0A] transition-colors px-2 py-1"
            >
              Sign in
            </Link>
            <Link href="/signup">
              <Button className="h-9 px-4 rounded-lg bg-[#0A0A0A] hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer">
                Join Roster
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ─── 2. ASYMMETRIC 50/50 SPLIT-SCREEN HERO SECTION ─────────────────── */}
        <section className="p-3 sm:p-6 lg:p-8 bg-[#EEF2F6]/60">
          <div className="max-w-7xl mx-auto rounded-3xl bg-[#FAF9F6] border border-black/[0.07] shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
            {/* LEFT 50%: ATMOSPHERIC CREATOR VISUAL + FROSTED TELEMETRY ARTIFACTS */}
            <div className="lg:col-span-6 relative p-3 sm:p-4 flex flex-col justify-between overflow-hidden min-h-[540px] lg:min-h-full">
              {/* Visual Frame */}
              <div className="absolute inset-3 sm:inset-4 rounded-2xl overflow-hidden bg-slate-950">
                <img
                  src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1400&auto=format&fit=crop"
                  alt="Creator Production Studio"
                  className="w-full h-full object-cover object-center opacity-85 scale-105 transition-transform duration-700 hover:scale-100"
                />
                {/* Atmospheric Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/35" />
                <div className="absolute inset-0 bg-radial-at-c from-transparent via-transparent to-black/50" />
              </div>

              {/* FLOATING FROSTED CARD 1: Escrow Balance & Vault Telemetry (Top Left) */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="relative z-10 m-2 sm:m-4 self-start bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl backdrop-saturate-150 border border-white/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8),0_20px_40px_-15px_rgba(15,23,42,0.12)] p-4 rounded-2xl max-w-[280px] sm:max-w-xs text-[#0A0A0A] space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#52525B]">
                    Terms Confirmed
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Locked &amp; Secured
                  </span>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0A0A0A]">
                    ₹2,45,000
                  </div>
                  <p className="text-[11px] text-[#52525B] font-medium mt-0.5">
                    Pre-funded milestone budget for Q4 campaigns
                  </p>
                </div>
                <div className="pt-2 border-t border-black/[0.06] flex items-center justify-between text-[11px]">
                  <span className="text-[#52525B]">Release Condition</span>
                  <span className="font-semibold text-[#0A0A0A]">Dual Signoff</span>
                </div>
              </motion.div>

              {/* FLOATING FROSTED CARD 2: Recent Brand Payouts Feed (Middle Stagger) */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="relative z-10 my-auto self-end mr-2 sm:mr-4 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl backdrop-saturate-150 border border-white/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8),0_20px_40px_-15px_rgba(15,23,42,0.12)] p-3.5 rounded-2xl max-w-[290px] sm:max-w-[310px] text-[#0A0A0A] space-y-2"
              >
                <div className="flex items-center justify-between text-[11px] text-[#52525B]">
                  <span className="font-semibold uppercase tracking-wider">Cleared Payout</span>
                  <span className="font-mono text-emerald-700 font-semibold">Instant T+0</span>
                </div>
                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 text-[#1D4ED8] flex items-center justify-center font-bold text-xs shrink-0">
                      LB
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#0A0A0A] truncate">
                        Lumière Beauty
                      </p>
                      <p className="text-[11px] text-[#52525B] truncate">Instagram Reel Delivery</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold text-emerald-700 block">+₹65,000</span>
                    <span className="text-[11px] text-[#52525B]">Payout Released</span>
                  </div>
                </div>
              </motion.div>

              {/* FLOATING FROSTED CARD 3: Obsidian Verified Creator Pass (Bottom Left) */}
              <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="relative z-10 m-2 sm:m-4 self-start bg-[#0A0A0A]/85 backdrop-blur-xl border border-white/15 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)] p-4 rounded-2xl max-w-[300px] sm:max-w-xs text-white space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Verified Creator Pass
                  </span>
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                    Tier 1 Elite
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150&auto=format&fit=crop"
                    alt="Maya Chen"
                    className="w-10 h-10 rounded-full object-cover border border-white/20 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-white">Maya Chen</h4>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB]" />
                    </div>
                    <p className="text-[11px] text-slate-400">@mayachen_tech · 285K</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Avg. Engagement</span>
                  <span className="font-bold text-white">6.2% Verified</span>
                </div>
              </motion.div>
            </div>

            {/* RIGHT 50%: EDITORIAL TYPOGRAPHY & TACTILE SPLIT-ACTION CTA */}
            <div className="lg:col-span-6 p-8 sm:p-12 lg:p-16 flex flex-col justify-between space-y-10">
              {/* Category Kicker */}
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-black/[0.05] text-xs font-semibold text-[#52525B]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8]" />
                  Commercial Operating System for Creators & Brands
                </div>
              </div>

              {/* Main Headline with Editorial Italic Serif Contrast */}
              <div className="space-y-6">
                <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-[#0A0A0A] tracking-[-0.035em] leading-[1.04]">
                  Where verified influence meets{" "}
                  <span className="font-serif italic font-normal text-[#1D4ED8] block sm:inline">
                    guaranteed payouts.
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-[#52525B] font-normal leading-relaxed max-w-xl">
                  CreatorsBrand is the disciplined marketplace connecting vetted brands with
                  high-retention creators. Milestone-gated contracts, auditable audience telemetry,
                  and zero payment delays.
                </p>
              </div>

              {/* Tactile Split-Action Primary CTA */}
              <div className="space-y-4 pt-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <Link href="/signup">
                    <div className="inline-flex items-center gap-3 p-1.5 pl-5 pr-2 rounded-full bg-[#0A0A0A] hover:bg-slate-800 text-white transition-all duration-200 group shadow-md cursor-pointer">
                      <span className="text-sm font-semibold tracking-tight">
                        Explore Open Campaigns
                      </span>
                      <div className="h-9 w-9 rounded-full bg-[#1D4ED8] group-hover:bg-blue-600 text-white flex items-center justify-center transition-colors shrink-0 shadow-xs">
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/find-creators"
                    className="text-xs font-semibold text-[#52525B] hover:text-[#0A0A0A] transition-colors py-2 px-1 inline-flex items-center gap-1 group"
                  >
                    <span>Browse 63+ Verified Creators</span>
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Link>
                </div>

                {/* Micro Guarantee Label */}
                <p className="text-xs text-[#52525B] font-normal">
                  Pre-funded milestone budgets · 100% deliverable signoff protection · Official
                  Instagram OAuth
                </p>
              </div>

              {/* Three Stat Anchors */}
              <div className="pt-8 border-t border-black/[0.06] grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xl sm:text-2xl font-bold tracking-tight text-[#0A0A0A]">
                    100%
                  </div>
                  <p className="text-xs text-[#52525B] font-normal mt-0.5">
                    Agreed Payout Protection
                  </p>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold tracking-tight text-[#0A0A0A]">
                    T+0
                  </div>
                  <p className="text-xs text-[#52525B] font-normal mt-0.5">Payout Clearance</p>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold tracking-tight text-[#0A0A0A]">
                    0%
                  </div>
                  <p className="text-xs text-[#52525B] font-normal mt-0.5">Agency Markups</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 3. SECTION 2: TYPOGRAPHIC SOCIAL PROOF & VALUE NARRATIVE ────────── */}
        <section
          id="social-proof"
          className="py-24 px-6 lg:px-12 bg-white border-t border-black/[0.06]"
        >
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left 7 Columns: Bold Typographic Statement & 3 Hairline Feature Rows */}
            <div className="lg:col-span-7 space-y-10">
              <div className="space-y-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#1D4ED8] block">
                  Commercial Architecture
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0A0A0A] tracking-[-0.035em] leading-[1.08]">
                  Built for direct creator collaborations —{" "}
                  <span className="font-serif italic font-normal text-[#1D4ED8]">
                    without agency markups.
                  </span>
                </h2>
                <p className="text-base text-[#52525B] font-normal leading-relaxed max-w-2xl">
                  Brands and creators eliminate middleman markups with direct milestone-protected
                  payouts, verified audience telemetry, and clear commercial terms.
                </p>
              </div>

              {/* 3 Hairline-Divided Feature Value Rows */}
              <div className="divide-y divide-black/[0.08] border-y border-black/[0.08]">
                {/* Item 1 */}
                <div className="py-6 grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-6 items-baseline">
                  <div className="sm:col-span-4">
                    <span className="text-xs font-semibold tracking-wider text-blue-700 block mb-1">
                      01 / VAULTS
                    </span>
                    <h3 className="text-base font-bold text-[#0A0A0A]">Pre-Funded Budget</h3>
                  </div>
                  <div className="sm:col-span-8">
                    <p className="text-sm text-[#52525B] leading-relaxed">
                      Brands commit 100% of compensation into milestone-protected vaults before
                      creator production begins. Creators produce with certainty that payout is
                      guaranteed upon approval.
                    </p>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="py-6 grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-6 items-baseline">
                  <div className="sm:col-span-4">
                    <span className="text-xs font-semibold tracking-wider text-blue-700 block mb-1">
                      02 / MATCHING
                    </span>
                    <h3 className="text-base font-bold text-[#0A0A0A]">
                      Verified Audience Metrics
                    </h3>
                  </div>
                  <div className="sm:col-span-8">
                    <p className="text-sm text-[#52525B] leading-relaxed">
                      Zero follower inflation. Roster intelligence ranks creators by authentic
                      engagement velocity, verified follower demographics, and confirmed deliverable
                      track records.
                    </p>
                  </div>
                </div>

                {/* Item 3 */}
                <div className="py-6 grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-6 items-baseline">
                  <div className="sm:col-span-4">
                    <span className="text-xs font-semibold tracking-wider text-blue-700 block mb-1">
                      03 / CANONICAL
                    </span>
                    <h3 className="text-base font-bold text-[#0A0A0A]">
                      Clear Usage Rights & Terms
                    </h3>
                  </div>
                  <div className="sm:col-span-8">
                    <p className="text-sm text-[#52525B] leading-relaxed">
                      Deliverables, licensing durations, and milestone payout schedules are clearly
                      defined and mutually approved before work begins — eliminating scope creep.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Overlapping Creator Portrait & Live Deliverable Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden bg-[#EAE6DF] shadow-[0_24px_48px_-12px_rgba(15,23,42,0.12)] border border-[#E5E4DF]">
                {/* Ambient Silent Creator Video Loop */}
                <video
                  ref={(el) => {
                    if (el) {
                      el.defaultMuted = true;
                      el.muted = true;
                      const playPromise = el.play();
                      if (playPromise !== undefined) {
                        playPromise.catch(() => {});
                      }
                    }
                  }}
                  src="/videos/creator-hero.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  poster="/images/creator-hero.jpg"
                  className="w-full h-full object-cover object-center"
                >
                  <source src="/videos/creator-hero.mp4" type="video/mp4" />
                  <source
                    src="https://res.cloudinary.com/demo/video/upload/c_fill,ar_4:5,w_720,q_auto/samples/cld-sample-video.mp4"
                    type="video/mp4"
                  />
                </video>

                {/* Subtle Top-Right Glass Pill */}
                <div className="absolute top-4 right-4 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/75 backdrop-blur-md border border-white/80 text-xs font-semibold text-[#0A0A0A] shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-700" />
                  <span>Verified Creator</span>
                </div>

                {/* Overlapping Frosted Glass Campaign Telemetry Card */}
                <div className="absolute bottom-5 left-5 right-5 sm:right-auto sm:w-80 z-10 p-4 rounded-2xl bg-white/70 backdrop-blur-xl backdrop-saturate-150 border border-white/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.85),0_20px_40px_-15px_rgba(15,23,42,0.14)] space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold tracking-wider uppercase text-blue-700">
                      Festive Launch Campaign
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50/90 text-emerald-700 border border-emerald-200/70 text-xs font-semibold">
                      Terms Confirmed
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs border-t border-black/5 pt-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-600">Campaign Deliverable</span>
                      <span className="font-semibold text-[#0A0A0A]">
                        1× IG Reel + Story Series
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-600">Milestone Status</span>
                      <span className="font-semibold text-emerald-700">Protected</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-black/5 text-xs">
                    <div>
                      <span className="text-zinc-500 block">Agreed Payout</span>
                      <span className="text-sm font-bold text-[#0A0A0A] font-tabular">₹45,000</span>
                    </div>
                    <div className="text-right">
                      <span className="text-zinc-500 block">Release Condition</span>
                      <span className="font-semibold text-[#0A0A0A]">Dual Signoff</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 4. SECTION 3: REAL INDIAN BENCHMARKS DISCOVERY ──────── */}
        <div className="border-t border-[#E5E4DF] bg-[#FAF9F6]">
          <DiscoveryPreviewSection />
        </div>

        {/* ─── 5. SECTION 4: REAL-TIME TELEMETRY & WORKFLOW PIPELINE ─────────── */}
        <section
          id="telemetry"
          className="py-24 px-6 lg:px-12 bg-white border-t border-black/[0.06]"
        >
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#1D4ED8] block">
                  Audit Telemetry
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-[#0A0A0A] tracking-[-0.035em] leading-tight">
                  Transparent conversion lift & CPV analytics.
                </h2>
                <p className="text-base text-[#52525B] font-normal leading-relaxed">
                  Every active deal publishes real-time impression telemetry, engagement velocity,
                  and effective CPV directly into both brand and creator workspaces.
                </p>
                <div className="grid grid-cols-2 gap-6 pt-2">
                  <div className="p-4 rounded-xl bg-[#FAF9F6] border border-black/[0.06]">
                    <span className="text-xs font-mono text-[#52525B] block">AVG ENGAGEMENT</span>
                    <span className="text-2xl font-bold text-[#0A0A0A] block mt-1">5.8%</span>
                    <span className="text-xs text-emerald-700 font-semibold mt-0.5 block">
                      2.4x Industry Benchmark
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#FAF9F6] border border-black/[0.06]">
                    <span className="text-xs font-mono text-[#52525B] block">MEAN TIME TO PAY</span>
                    <span className="text-2xl font-bold text-[#0A0A0A] block mt-1">2.4 hrs</span>
                    <span className="text-xs text-emerald-700 font-semibold mt-0.5 block">
                      Post Milestone Signoff
                    </span>
                  </div>
                </div>
              </div>

              {/* Architectural Telemetry Box */}
              <div className="rounded-2xl bg-[#FAF9F6] border border-black/[0.08] p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
                  <div>
                    <h3 className="text-sm font-bold text-[#0A0A0A]">Live Deal Telemetry</h3>
                    <p className="text-xs text-[#52525B]">Active Deal Milestone Monitor</p>
                  </div>
                  <span className="text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-semibold">
                    Terms Confirmed
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs p-3 rounded-lg bg-white border border-black/[0.05]">
                    <span className="font-semibold text-[#0A0A0A]">Deliverable Package</span>
                    <span className="font-mono font-bold text-[#0A0A0A]">1x Reel + 2 Stories</span>
                  </div>
                  <div className="flex items-center justify-between text-xs p-3 rounded-lg bg-white border border-black/[0.05]">
                    <span className="font-semibold text-[#0A0A0A]">Effective Blended CPV</span>
                    <span className="font-mono font-bold text-[#1D4ED8]">₹0.38 / View</span>
                  </div>
                  <div className="flex items-center justify-between text-xs p-3 rounded-lg bg-white border border-black/[0.05]">
                    <span className="font-semibold text-[#0A0A0A]">Milestone Payment Vault</span>
                    <span className="font-mono font-bold text-emerald-700">
                      ₹2,45,000 Protected
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Workflow Steps Grid */}
            <div id="workflow" className="pt-8 border-t border-black/[0.06] space-y-10">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#1D4ED8] block">
                  Operating Pipeline
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-[#0A0A0A] mt-1">
                  How CreatorsBrand eliminates commercial friction.
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {JOURNEY_STEPS.map((s) => (
                  <div
                    key={s.step}
                    className="p-5 rounded-xl bg-[#FAF9F6] border border-black/[0.06] space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#1D4ED8]">{s.step}</span>
                      <s.icon className="w-4 h-4 text-[#52525B]" />
                    </div>
                    <h4 className="text-sm font-bold text-[#0A0A0A]">{s.title}</h4>
                    <p className="text-xs text-[#52525B] leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── 6. CLOSING CTA BANNER ───────────────────────────────────────── */}
        <section className="py-24 px-6 lg:px-12 bg-[#EEF2F6]/60 border-t border-black/[0.06]">
          <div className="max-w-4xl mx-auto text-center rounded-3xl bg-[#0A0A0A] text-white p-10 sm:p-16 space-y-8 relative overflow-hidden shadow-2xl">
            <div className="relative z-10 max-w-2xl mx-auto space-y-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 block">
                Enterprise & Creator Onboarding
              </span>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
                Build high-yield campaigns on{" "}
                <span className="font-serif italic font-normal text-blue-400">
                  proven milestone rails.
                </span>
              </h2>
              <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
                Join top verified creators and forward-thinking brands running commercial
                partnerships with automated payout security.
              </p>
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <div className="inline-flex items-center gap-3 p-1.5 pl-6 pr-2 rounded-full bg-white hover:bg-slate-100 text-[#0A0A0A] transition-all group shadow-md cursor-pointer">
                  <span className="text-sm font-semibold tracking-tight">Create Free Account</span>
                  <div className="h-9 w-9 rounded-full bg-[#1D4ED8] text-white flex items-center justify-center shrink-0">
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Link>
              <Link
                href="/login"
                className="text-xs font-semibold text-slate-400 hover:text-white transition-colors py-2 px-3"
              >
                Existing Member? Sign In
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ─── 7. MINIMAL ARCHITECTURAL FOOTER ───────────────────────────────── */}
      <footer className="border-t border-black/[0.06] bg-white py-12 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-[#0A0A0A] text-white flex items-center justify-center font-bold text-[11px]">
              CB
            </div>
            <span className="text-sm font-bold tracking-tight text-[#0A0A0A]">
              Creators<span className="font-serif italic font-normal text-[#1D4ED8]">Brand</span>
            </span>
            <span className="text-xs text-[#52525B] ml-2">© {new Date().getFullYear()}</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-[#52525B]">
            <Link href="/terms" className="hover:text-[#0A0A0A] transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy" className="hover:text-[#0A0A0A] transition-colors">
              Privacy Policy
            </Link>
            <span className="text-[#52525B]/70">{LEGAL_CONFIG.OPERATED_BY}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
