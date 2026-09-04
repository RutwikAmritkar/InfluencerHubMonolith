import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  motion, 
  AnimatePresence, 
  useMotionValue, 
  useSpring, 
  useTransform, 
  useReducedMotion,
  useInView
} from "framer-motion";
import { toast } from "sonner";
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
  Award
} from "lucide-react";

// TikTok Custom SVG Icon
function TikTokIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`fill-current ${className}`}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  );
}

// ─── 1. ANIMATED NUMBER COUNTER COMPONENT ────────────────────────────────────
function AnimatedCounter({ from = 0, to, duration = 1.5, suffix = "", prefix = "" }: {
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
    <span ref={ref} className="font-mono font-black">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

// ─── 2. CREATOR CANDIDATES FOR DISCOVERY WOW MOMENT ────────────────────────
const DISCOVERY_CREATORS = [
  {
    id: 1,
    name: "Alex Rivera",
    handle: "@alexrivera",
    category: "Beauty & Lifestyle",
    platform: "Instagram",
    followers: "125K",
    engagement: "4.8%",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
    audienceGender: "72% Female",
    audienceAge: "18–34",
    topLocation: "64% US",
    estRate: "$4,500",
    matchScore: 98,
    platformColor: "from-amber-500 via-pink-600 to-purple-600",
  },
  {
    id: 2,
    name: "Maya Chen",
    handle: "@mayachen_tech",
    category: "Tech & Gaming",
    platform: "TikTok",
    followers: "285K",
    engagement: "6.2%",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150&auto=format&fit=crop",
    audienceGender: "58% Male",
    audienceAge: "18–24",
    topLocation: "78% US",
    estRate: "$7,200",
    matchScore: 95,
    platformColor: "from-cyan-400 to-pink-500",
  },
  {
    id: 3,
    name: "Jordan Lee",
    handle: "@jordanlee_fit",
    category: "Fitness & Wellness",
    platform: "YouTube",
    followers: "92K",
    engagement: "5.1%",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop",
    audienceGender: "64% Female",
    audienceAge: "25–44",
    topLocation: "52% UK",
    estRate: "$3,800",
    matchScore: 92,
    platformColor: "from-red-600 to-rose-700",
  },
];

// ─── 3. CREATOR JOURNEY STEPS ────────────────────────────────────────────────
const JOURNEY_STEPS = [
  { step: "01", title: "Connect Social Accounts", desc: "Link Instagram, TikTok, and YouTube with zero manual entry.", icon: Zap },
  { step: "02", title: "Build Verified Profile", desc: "Showcase audience metrics, rate cards, and verified trust badges.", icon: ShieldCheck },
  { step: "03", title: "Discover Opportunities", desc: "Browse curated brand campaigns matching your niche and rate.", icon: Search },
  { step: "04", title: "Submit Pitch", desc: "Send targeted campaign pitches directly to verified brand leads.", icon: Send },
  { step: "05", title: "Collaborate", desc: "Manage deliverables, story tags, and content approvals seamlessly.", icon: CheckSquare },
  { step: "06", title: "Track Performance", desc: "View real-time reach telemetry and engagement analytics.", icon: BarChart3 },
  { step: "07", title: "Get Paid", desc: "Receive automated payouts via secure escrow upon approval.", icon: DollarSign },
];

export default function Landing() {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [hoveredCreatorId, setHoveredCreatorId] = useState<number | null>(1); // Default select Alex Rivera
  const [aiStage, setAiStage] = useState<"idle" | "typing" | "analyzing" | "complete">("idle");
  const shouldReduceMotion = useReducedMotion();

  // ─── PAGE-LEVEL AMBIENT CURSOR SPOTLIGHT ─────────────────────────────────
  // A soft radial gradient glow that lazily follows the mouse across the page.
  // Implemented as GPU-composited transform (no layout thrashing).
  const spotX = useMotionValue(-1000);
  const spotY = useMotionValue(-1000);
  const smoothSpotX = useSpring(spotX, { stiffness: 80, damping: 28, mass: 0.5 });
  const smoothSpotY = useSpring(spotY, { stiffness: 80, damping: 28, mass: 0.5 });
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice(window.matchMedia("(hover: none)").matches);
  }, []);

  const handlePageMouseMove = useCallback((e: MouseEvent) => {
    if (shouldReduceMotion || isTouchDevice) return;
    spotX.set(e.clientX);
    spotY.set(e.clientY);
  }, [shouldReduceMotion, isTouchDevice, spotX, spotY]);

  const handlePageMouseLeave = useCallback(() => {
    spotX.set(-1000);
    spotY.set(-1000);
  }, [spotX, spotY]);

  useEffect(() => {
    if (shouldReduceMotion || isTouchDevice) return;
    window.addEventListener("mousemove", handlePageMouseMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", handlePageMouseLeave);
    return () => {
      window.removeEventListener("mousemove", handlePageMouseMove);
      document.documentElement.removeEventListener("mouseleave", handlePageMouseLeave);
    };
  }, [shouldReduceMotion, isTouchDevice, handlePageMouseMove, handlePageMouseLeave]);

  // 3D Perspective Tilt Motion Controls (Restrained 2-3 degrees)
  const containerRef = useRef<HTMLDivElement>(null);
  const rawMouseX = useMotionValue(0);
  const rawMouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(rawMouseY, [-0.5, 0.5], [shouldReduceMotion ? 0 : 3, shouldReduceMotion ? 0 : -3]), { stiffness: 90, damping: 22 });
  const rotateY = useSpring(useTransform(rawMouseX, [-0.5, 0.5], [shouldReduceMotion ? 0 : -3, shouldReduceMotion ? 0 : 3]), { stiffness: 90, damping: 22 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xPos = (e.clientX - rect.left) / rect.width - 0.5;
    const yPos = (e.clientY - rect.top) / rect.height - 0.5;
    rawMouseX.set(xPos);
    rawMouseY.set(yPos);
  };

  const handleMouseLeave = () => {
    rawMouseX.set(0);
    rawMouseY.set(0);
  };

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

  // Outer ambient glow — large, very soft. Low opacity keeps it elegant, not gaming.
  const spotlightBg = useTransform(
    [smoothSpotX, smoothSpotY],
    ([x, y]: number[]) =>
      `radial-gradient(700px circle at ${x}px ${y}px, rgba(49,91,239,0.10) 0%, rgba(99,102,241,0.05) 30%, transparent 65%)`
  );

  // Inner core — slightly tighter, gives the crisp mouse-follow center
  const spotlightCore = useTransform(
    [smoothSpotX, smoothSpotY],
    ([x, y]: number[]) =>
      `radial-gradient(220px circle at ${x}px ${y}px, rgba(49,91,239,0.14) 0%, rgba(79,111,239,0.06) 50%, transparent 70%)`
  );

  // Hero inner parallax — two depth layers (rules of hooks: must be top-level)
  // Layer 1: title/badge area — shallow offset ±4px / ±2px
  const heroTitleX = useTransform(rawMouseX, [-0.5, 0.5], shouldReduceMotion ? [0, 0] : [-4, 4]);
  const heroTitleY = useTransform(rawMouseY, [-0.5, 0.5], shouldReduceMotion ? [0, 0] : [-2, 2]);
  // Layer 2: creator cards — slightly deeper ±7px / ±3px
  const heroCardsX = useTransform(rawMouseX, [-0.5, 0.5], shouldReduceMotion ? [0, 0] : [-7, 7]);
  const heroCardsY = useTransform(rawMouseY, [-0.5, 0.5], shouldReduceMotion ? [0, 0] : [-3, 3]);

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0F19] text-white selection:bg-[#315BEF] selection:text-white relative overflow-x-hidden font-sans">
      
      {/* ─── AMBIENT CURSOR SPOTLIGHT (dual-layer, Skiper61 style) ────────── */}
      {!isTouchDevice && !shouldReduceMotion && (
        <>
          {/* Outer ambient glow */}
          <motion.div
            className="pointer-events-none fixed inset-0 z-10"
            aria-hidden="true"
            style={{ background: spotlightBg }}
          />
          {/* Inner crisp core — gives the clear mouse-follow feel */}
          <motion.div
            className="pointer-events-none fixed inset-0 z-10"
            aria-hidden="true"
            style={{ background: spotlightCore }}
          />
        </>
      )}

      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[55rem] h-[55rem] bg-gradient-to-br from-[#315BEF]/15 via-indigo-600/10 to-transparent rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:36px_36px] opacity-20 pointer-events-none" />

      {/* ─── TOP NAVIGATION HEADER ────────────────────────────────────────── */}
      <header className="relative z-50 flex items-center justify-between w-full max-w-7xl mx-auto py-5 px-6 lg:px-12">
        <Link href="/">
          <div className="inline-flex items-center gap-3 cursor-pointer group">
            <div className="h-10 w-10 bg-gradient-to-br from-[#315BEF] via-blue-600 to-indigo-700 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-600/30 group-hover:scale-105 transition-transform duration-300">
              I
            </div>
            <span className="text-2xl font-black tracking-tight text-white">
              Influencer<span className="text-[#315BEF]">Hub</span>
            </span>
          </div>
        </Link>

        {/* Center Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-300">
          
          <div
            className="relative"
            onMouseEnter={() => setOpenDropdown("features")}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer py-2">
              Features <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === "features" ? "rotate-180 text-[#315BEF]" : ""}`} />
            </button>
            <AnimatePresence>
              {openDropdown === "features" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 w-64 p-3 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-2xl space-y-2 z-50"
                >
                  <Link href="/find-creators">
                    <div className="p-2 hover:bg-slate-800/60 rounded-xl transition-colors cursor-pointer flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-[#315BEF] flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">AI Creator Match</p>
                        <p className="text-[10px] text-slate-400">Audience matching engine</p>
                      </div>
                    </div>
                  </Link>
                  <Link href="/analytics">
                    <div className="p-2 hover:bg-slate-800/60 rounded-xl transition-colors cursor-pointer flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Live Telemetry</p>
                        <p className="text-[10px] text-slate-400">Real-time reach & ROI</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <a href="#discovery" className="hover:text-white transition-colors cursor-pointer py-2">
            Discovery
          </a>
          <a href="#analytics" className="hover:text-white transition-colors cursor-pointer py-2">
            Analytics
          </a>
          <a href="#workflow" className="hover:text-white transition-colors cursor-pointer py-2">
            Workflow
          </a>
        </nav>

        {/* Right Auth CTA Buttons */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors px-3 py-2" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button className="group text-sm font-bold text-white bg-[#315BEF] hover:bg-blue-600 px-6 py-2.5 rounded-full shadow-xl shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2" asChild>
            <Link href="/signup">
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        
        {/* ─── 1. HERO SECTION WITH RESTRAINED 3D TILT ─────────────────────── */}
        <section
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative overflow-hidden pt-12 sm:pt-16 pb-24 px-6 lg:px-12 flex flex-col items-center text-center"
        >
          <Badge variant="outline" className="mb-6 px-4 py-1.5 border-blue-500/30 bg-blue-500/10 text-blue-400 rounded-full font-bold text-xs">
            <Sparkles className="w-4 h-4 mr-2 text-blue-400" />
            Where Brands & Creators Meet Influence
          </Badge>
          
          <h1 className="text-4xl sm:text-6xl lg:text-[5.25rem] font-black text-white tracking-[-0.04em] leading-[0.95] max-w-5xl mb-6">
            Creators, campaigns, and analytics. <br />
            <span className="text-[#315BEF]">Finally in one platform.</span>
          </h1>
          
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mb-8 leading-relaxed font-medium">
            The creator marketplace OS for discovery, match scoring, campaigns, and ROI — built for fast, transparent creator partnerships.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md">
            <motion.div whileTap={shouldReduceMotion ? {} : { scale: 0.97 }} className="w-full sm:w-auto">
              <Button size="lg" className="group w-full sm:w-auto h-12 px-7 bg-[#315BEF] hover:bg-blue-600 text-white font-bold rounded-full text-sm shadow-xl shadow-blue-600/30 hover:shadow-blue-600/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-2" asChild>
                <Link href="/find-creators">
                  <span>Find Creators</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-150" />
                </Link>
              </Button>
            </motion.div>
            <motion.div whileTap={shouldReduceMotion ? {} : { scale: 0.97 }} className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-7 border-slate-700 bg-slate-900/80 hover:bg-slate-800 hover:border-slate-600 text-white font-bold rounded-full text-sm transition-all" asChild>
                <Link href="/opportunities">
                  For Creators
                </Link>
              </Button>
            </motion.div>
          </div>
          
          {/* FLOATING RESTRAINED 3D PERSPECTIVE PRODUCT VIEWPORT */}
          <div className="mt-14 w-full max-w-5xl">
            <motion.div
              style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
              className="relative rounded-3xl border border-slate-800 bg-slate-950/90 p-3 sm:p-5 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-2xl overflow-hidden ring-1 ring-white/10"
            >
              {/* macOS Window Header */}
              <div className="flex items-center justify-between pb-3 px-3 border-b border-slate-800/80 text-xs text-slate-500 font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                  <span className="ml-3 font-medium text-slate-400 text-[11px]">InfluencerHub — Campaign Workspace</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-bold">
                  ● Live Marketplace Sync
                </div>
              </div>

              {/* Viewport Dashboard Grid Preview */}
              <div className="grid grid-cols-12 gap-4 pt-4 text-left min-h-[340px] sm:min-h-[380px]">
                
                {/* Sidebar Column */}
                <div className="col-span-4 sm:col-span-3 border-r border-slate-800/80 pr-3 space-y-3 text-xs font-medium text-slate-400 hidden xs:block">
                  <div className="space-y-1">
                    <div className="p-2 rounded-xl bg-blue-600/15 text-[#315BEF] font-bold flex items-center gap-2">
                      <Search className="w-3.5 h-3.5" /> Find Creators
                    </div>
                    <div className="p-2 rounded-xl hover:bg-slate-900 flex items-center gap-2 text-slate-300">
                      <Target className="w-3.5 h-3.5" /> Shortlists
                    </div>
                    <div className="p-2 rounded-xl hover:bg-slate-900 flex items-center gap-2 text-slate-300">
                      <Megaphone className="w-3.5 h-3.5" /> Campaigns
                    </div>
                    <div className="p-2 rounded-xl hover:bg-slate-900 flex items-center gap-2 text-slate-300">
                      <BarChart3 className="w-3.5 h-3.5" /> Analytics
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/60 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Top Match Roster</span>
                    <div className="text-[11px] text-slate-300 font-semibold pl-2 flex items-center justify-between">
                      <span>Alex Rivera</span>
                      <span className="text-emerald-400 font-mono text-[10px]">98%</span>
                    </div>
                    <div className="text-[11px] text-slate-300 font-semibold pl-2 flex items-center justify-between">
                      <span>Maya Chen</span>
                      <span className="text-emerald-400 font-mono text-[10px]">95%</span>
                    </div>
                  </div>
                </div>

                  {/* Main Content Column — inner elements get a soft parallax offset */}
                  <div className="col-span-12 xs:col-span-8 sm:col-span-9 pl-0 xs:pl-2 space-y-4">
                    <motion.div
                      style={{ x: heroTitleX, y: heroTitleY }}
                      className="flex justify-between items-center"
                    >
                    <div>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                        Summer Skincare Launch Campaign
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Active Roster: <span className="text-white font-bold">8 Creators</span> · Total Payout: <span className="text-emerald-400 font-bold">$42,500</span>
                      </p>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold">
                      ● Active Campaign
                    </Badge>
                  </motion.div>

                  {/* Creator Card Previews — slightly deeper parallax layer */}
                  <motion.div
                    style={{ x: heroCardsX, y: heroCardsY }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                  >
                    <motion.div 
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 flex items-center gap-3 cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                    >
                      <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop" className="w-10 h-10 rounded-xl object-cover" />
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-xs text-white">Alex Rivera</span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#315BEF]" />
                        </div>
                        <span className="text-[10px] text-slate-400">125K Instagram · 4.8% Eng.</span>
                      </div>
                      <Badge className="ml-auto bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">98% Match</Badge>
                    </motion.div>

                    <motion.div 
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 flex items-center gap-3 cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                    >
                      <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150&auto=format&fit=crop" className="w-10 h-10 rounded-xl object-cover" />
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-xs text-white">Maya Chen</span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#315BEF]" />
                        </div>
                        <span className="text-[10px] text-slate-400">285K TikTok · 6.2% Eng.</span>
                      </div>
                      <Badge className="ml-auto bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">95% Match</Badge>
                    </motion.div>
                  </motion.div>
                </div>

              </div>
            </motion.div>
          </div>
        </section>

        {/* ─── 2. PROBLEM / VALUE SECTION (DISCOVER, VERIFY, MEASURE) ─────── */}
        <section className="py-20 px-6 lg:px-12 max-w-7xl mx-auto border-t border-slate-800/80">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <Badge variant="outline" className="mb-3 px-3 py-1 border-blue-500/30 text-blue-400 bg-blue-500/10 text-xs font-bold">
              Marketplace Capabilities
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
              Finding the right creator shouldn't feel like guesswork.
            </h2>
            <p className="text-slate-400 text-sm sm:text-base font-medium">
              We replaced cold emails and spreadsheets with verified audience metrics, automated contracts, and live ROI telemetry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              whileHover={shouldReduceMotion ? {} : { y: -3, boxShadow: "0 20px 40px -12px rgba(49,91,239,0.15)" }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="p-8 rounded-[16px] bg-slate-900/60 border border-slate-800 hover:border-blue-500/40 shadow-lg transition-colors text-left space-y-4"
            >
              <motion.div
                whileHover={shouldReduceMotion ? {} : { scale: 1.08 }}
                transition={{ duration: 0.2 }}
                className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[#315BEF] flex items-center justify-center"
              >
                <Search className="w-6 h-6" />
              </motion.div>
              <h3 className="text-xl font-bold text-white">DISCOVER</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Find creators matching your brand's target audience, niche, tier, and budget requirements with AI Match Scoring.
              </p>
            </motion.div>

            <motion.div
              whileHover={shouldReduceMotion ? {} : { y: -3, boxShadow: "0 20px 40px -12px rgba(16,185,129,0.12)" }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="p-8 rounded-[16px] bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 shadow-lg transition-colors text-left space-y-4"
            >
              <motion.div
                whileHover={shouldReduceMotion ? {} : { scale: 1.08 }}
                transition={{ duration: 0.2 }}
                className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center"
              >
                <ShieldCheck className="w-6 h-6" />
              </motion.div>
              <h3 className="text-xl font-bold text-white">VERIFY</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Inspect authentic engagement rates, audience quality scores, demographic distributions, and historical pricing.
              </p>
            </motion.div>

            <motion.div
              whileHover={shouldReduceMotion ? {} : { y: -3, boxShadow: "0 20px 40px -12px rgba(168,85,247,0.12)" }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="p-8 rounded-[16px] bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 shadow-lg transition-colors text-left space-y-4"
            >
              <motion.div
                whileHover={shouldReduceMotion ? {} : { scale: 1.08 }}
                transition={{ duration: 0.2 }}
                className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center"
              >
                <TrendingUp className="w-6 h-6" />
              </motion.div>
              <h3 className="text-xl font-bold text-white">MEASURE</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Track aggregate reach, story clicks, engagement rates, estimated cost-per-view (CPV), and campaign ROI live.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ─── 3. CREATOR DISCOVERY INTERACTION (PRIMARY WOW MOMENT) ─────────── */}
        <section id="discovery" className="py-24 px-6 lg:px-12 bg-slate-950/60 border-t border-slate-800/80">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center max-w-3xl mx-auto">
              <Badge variant="outline" className="mb-3 px-3 py-1 border-blue-500/30 text-blue-400 bg-blue-500/10 text-xs font-bold">
                ✦ Interactive Creator Evaluation
              </Badge>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
                Evaluate creators before making a decision.
              </h2>
              <p className="text-slate-400 text-sm sm:text-base font-medium">
                Hover or tap candidate creator profiles below to inspect verified audience demographics and match scores.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {DISCOVERY_CREATORS.map((c) => {
                const isSelected = hoveredCreatorId === c.id;
                return (
                  <motion.div
                    key={c.id}
                    onMouseEnter={() => setHoveredCreatorId(c.id)}
                    onClick={() => setHoveredCreatorId(c.id)}
                    whileHover={{ scale: 1.02 }}
                    className={`p-6 rounded-[16px] bg-slate-900 border transition-all cursor-pointer space-y-4 text-left ${
                      isSelected
                        ? "border-[#315BEF] shadow-[0_0_30px_-5px_rgba(49,91,239,0.3)] bg-slate-900/90"
                        : "border-slate-800 opacity-80 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={c.avatar} className="w-12 h-12 rounded-xl object-cover border border-slate-700" />
                        <div>
                          <div className="flex items-center gap-1">
                            <h4 className="font-bold text-sm text-white">{c.name}</h4>
                            <CheckCircle2 className="w-4 h-4 text-[#315BEF]" />
                          </div>
                          <span className="text-xs text-slate-400 font-mono">{c.handle}</span>
                        </div>
                      </div>
                      <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-mono font-bold">
                        {c.matchScore}% Match
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-500 uppercase font-mono block">Followers</span>
                        <span className="font-bold text-white text-sm">{c.followers}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-500 uppercase font-mono block">Avg. Engagement</span>
                        <span className="font-bold text-emerald-400 text-sm">{c.engagement}</span>
                      </div>
                    </div>

                    {/* EXPANDED VERIFIED AUDIENCE DETAILS (ACTIVE ON HOVER/TAP) */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          className="pt-3 border-t border-slate-800 space-y-2 text-xs"
                        >
                          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider font-mono block">
                            VERIFIED AUDIENCE BREAKDOWN
                          </span>
                          <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-semibold">
                            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                              <span className="text-slate-400 block text-[9px]">GENDER</span>
                              <span className="text-white">{c.audienceGender}</span>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                              <span className="text-slate-400 block text-[9px]">AGE</span>
                              <span className="text-white">{c.audienceAge}</span>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                              <span className="text-slate-400 block text-[9px]">TOP REGION</span>
                              <span className="text-white">{c.topLocation}</span>
                            </div>
                          </div>

                          <div className="pt-2 flex items-center justify-between">
                            <span className="text-xs text-slate-400">Asking Rate: <span className="font-bold text-white">{c.estRate}</span></span>
                            <Link href={`/find-creators`}>
                              <Button size="sm" className="h-7 px-3 text-[11px] font-bold bg-[#315BEF] hover:bg-blue-600 text-white rounded-lg">
                                View Profile →
                              </Button>
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── 4. PLATFORM MICRO-INTERACTIONS ──────────────────────────────── */}
        <section className="py-14 border-y border-slate-800/80 bg-slate-950">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-8 font-mono">SUPPORTED SOCIAL PLATFORMS & TELEMETRY</p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-14">
              
              <motion.div
                whileHover={shouldReduceMotion ? {} : { scale: 1.03, y: -1 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-pink-500/40 cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600 text-white flex items-center justify-center">
                  <Instagram className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-white">Instagram Reels</span>
              </motion.div>

              <motion.div
                whileHover={shouldReduceMotion ? {} : { scale: 1.03, y: -1 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-400/40 cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-950 text-white flex items-center justify-center border border-slate-800">
                  <TikTokIcon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-white">TikTok Shortform</span>
              </motion.div>

              <motion.div
                whileHover={shouldReduceMotion ? {} : { scale: 1.03, y: -1 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-red-500/40 cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center">
                  <Youtube className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-white">YouTube Reviews</span>
              </motion.div>

            </div>
          </div>
        </section>

        {/* ─── 5. ANALYTICS SHOWCASE SECTION (ANIMATED CHART & COUNTERS) ────── */}
        <section id="analytics" className="py-24 px-6 lg:px-12 max-w-7xl mx-auto border-t border-slate-800/80">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="text-left space-y-6">
              <Badge variant="outline" className="px-3 py-1 border-blue-500/30 text-blue-400 bg-blue-500/10 text-xs font-bold">
                ✦ Real-Time Telemetry
              </Badge>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                Not just a directory. <br />
                <span className="text-[#315BEF]">A campaign intelligence OS.</span>
              </h2>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed font-medium">
                Monitor live impressions, engagement velocity, cost-per-view (CPV), and total campaign ROI in real time across active creator partnerships.
              </p>

              {/* Live Metric Counters */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-mono font-bold">TOTAL CAMPAIGN REACH</span>
                  <div className="text-2xl sm:text-3xl text-white">
                    <AnimatedCounter to={125000} suffix="+" />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-mono font-bold">AVG. ENGAGEMENT RATE</span>
                  <div className="text-2xl sm:text-3xl text-emerald-400">
                    <AnimatedCounter to={4} suffix=".8%" />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-mono font-bold">ESTIMATED SPEND</span>
                  <div className="text-2xl sm:text-3xl text-white">
                    <AnimatedCounter to={42580} prefix="$" />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-mono font-bold">ESTIMATED RETURN (ROI)</span>
                  <div className="text-2xl sm:text-3xl text-purple-400">
                    <AnimatedCounter to={4} suffix=".8x" />
                  </div>
                </div>
              </div>
            </div>

            {/* SVG Telemetry Drawing Line Card */}
            <div className="p-6 rounded-[16px] bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h4 className="font-bold text-sm text-white">Campaign Performance Telemetry</h4>
                  <span className="text-[10px] text-slate-400 font-mono">Live 30D Aggregate Reach</span>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  ● Live Data
                </Badge>
              </div>

              <div className="h-48 w-full pt-4">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 400 150">
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#315BEF" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#315BEF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid Lines */}
                  <line x1="0" y1="30" x2="400" y2="30" stroke="#1e293b" strokeDasharray="3 3" />
                  <line x1="0" y1="75" x2="400" y2="75" stroke="#1e293b" strokeDasharray="3 3" />
                  <line x1="0" y1="120" x2="400" y2="120" stroke="#1e293b" strokeDasharray="3 3" />

                  {/* Filled Area */}
                  <polygon points="0,150 0,120 60,95 120,110 180,65 240,45 300,55 360,20 400,15 400,150" fill="url(#chartGrad)" />

                  {/* Animated Line Path */}
                  <motion.path
                    d="M 0 120 Q 60 95, 120 110 T 240 45 T 360 20 L 400 15"
                    fill="none"
                    stroke="#315BEF"
                    strokeWidth="3.5"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    transition={{ duration: 1.8, ease: "easeInOut" }}
                    viewport={{ once: true }}
                  />

                  {/* Data Points */}
                  <circle cx="120" cy="110" r="4" fill="#315BEF" />
                  <circle cx="240" cy="45" r="4" fill="#315BEF" />
                  <circle cx="400" cy="15" r="5" fill="#10B981" />
                </svg>
              </div>
            </div>

          </div>
        </section>

        {/* ─── 6. SIMULATED AI ASSISTANT SECTION ─────────────────────────────── */}
        <section className="py-24 px-6 lg:px-12 bg-slate-950/60 border-t border-slate-800/80">
          <div className="max-w-4xl mx-auto space-y-8 text-center">
            <div className="max-w-2xl mx-auto">
              <Badge variant="outline" className="mb-3 px-3 py-1 border-purple-500/30 text-purple-400 bg-purple-500/10 text-xs font-bold">
                ✦ AI Marketplace Assistant
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
                Ask AI to build your candidate shortlist.
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm font-medium">
                Our action-oriented AI engine queries candidate niches, audience demographics, and budget bounds instantly.
              </p>
            </div>

            {/* Interactive Prompt Box */}
            <div className="p-6 rounded-[16px] bg-slate-900 border border-slate-800 shadow-2xl space-y-4 text-left max-w-2xl mx-auto">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-white">Brand Requirement Prompt</span>
                <Button onClick={triggerAiDemo} size="sm" className="ml-auto h-7 px-3 bg-[#315BEF] hover:bg-blue-600 text-white font-bold text-[10px] rounded-lg cursor-pointer">
                  Run Demo Search
                </Button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 text-xs font-mono text-slate-300">
                "{aiStage === "idle" ? "Find me 10 fashion creators with 100K–500K followers, 4%+ engagement, and a US audience." : "Find me 10 fashion creators with 100K–500K followers, 4%+ engagement..."}"
              </div>

              {/* Processing / Result Animation */}
              <div className="pt-2">
                {aiStage === "typing" && (
                  <p className="text-xs text-blue-400 animate-pulse font-mono font-semibold">⚡ Analyzing creator database parameters...</p>
                )}
                {aiStage === "analyzing" && (
                  <p className="text-xs text-purple-400 animate-pulse font-mono font-semibold">✦ Scoring audience match percentages & budget fit...</p>
                )}
                {(aiStage === "complete" || aiStage === "idle") && (
                  <div className="space-y-2">
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">✓ 10 HIGH-MATCH CREATORS FOUND:</span>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Badge className="bg-slate-950 border border-slate-800 text-white text-[11px] py-1 px-2.5">
                        Alex Rivera · <span className="text-emerald-400 font-bold">98% Match</span>
                      </Badge>
                      <Badge className="bg-slate-950 border border-slate-800 text-white text-[11px] py-1 px-2.5">
                        Maya Chen · <span className="text-emerald-400 font-bold">95% Match</span>
                      </Badge>
                      <Badge className="bg-slate-950 border border-slate-800 text-white text-[11px] py-1 px-2.5">
                        Jordan Lee · <span className="text-emerald-400 font-bold">92% Match</span>
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ─── 7. CREATOR WORKFLOW JOURNEY ──────────────────────────────────── */}
        <section id="workflow" className="py-24 px-6 lg:px-12 max-w-7xl mx-auto border-t border-slate-800/80">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <Badge variant="outline" className="mb-3 px-3 py-1 border-blue-500/30 text-blue-400 bg-blue-500/10 text-xs font-bold">
              End-To-End Journey
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
              How creators and brands collaborate.
            </h2>
            <p className="text-slate-400 text-sm sm:text-base font-medium">
              A transparent, step-by-step workflow from account connection to escrow payout.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            {JOURNEY_STEPS.slice(0, 4).map((s) => (
              <motion.div
                key={s.step}
                whileHover={shouldReduceMotion ? {} : { y: -2, boxShadow: "0 12px 28px -8px rgba(49,91,239,0.12)" }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="p-6 rounded-[16px] bg-slate-900/60 border border-slate-800 hover:border-slate-700 space-y-3 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#315BEF]">{s.step}</span>
                  <s.icon className="w-4 h-4 text-slate-400" />
                </div>
                <h4 className="font-bold text-sm text-white">{s.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ─── 8. FINAL CALL TO ACTION ──────────────────────────────────────── */}
        <section className="py-24 px-6 lg:px-12">
          <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-[#315BEF]/20 via-blue-600/10 to-indigo-900/20 border border-blue-500/30 rounded-3xl p-10 sm:p-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
            <h2 className="text-3xl sm:text-5xl font-black mb-4 text-white relative z-10 tracking-tight">
              Ready to elevate your partnerships?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base mb-8 relative z-10 max-w-xl mx-auto">
              Join thousands of brands and creators building better business together on InfluencerHub.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center relative z-10">
              <motion.div whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}>
                <Button size="lg" className="group h-12 px-8 text-sm font-bold bg-[#315BEF] hover:bg-blue-600 text-white rounded-full shadow-2xl shadow-blue-600/30 hover:shadow-blue-600/40 flex items-center justify-center gap-2 transition-all" asChild>
                  <Link href="/signup">
                    <span>Create Free Account</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-150" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}>
                <Button size="lg" variant="outline" className="h-12 px-7 border-slate-700 bg-slate-900/80 hover:bg-slate-800 hover:border-slate-600 text-white font-bold rounded-full text-sm transition-all" asChild>
                  <Link href="/login">
                    Sign In
                  </Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800/80 py-8 px-6 lg:px-12 bg-slate-950 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 bg-[#315BEF] rounded-lg flex items-center justify-center text-white font-bold text-sm">
              I
            </div>
            <span className="text-base font-bold tracking-tight text-white">Influencer<span className="text-[#315BEF]">Hub</span></span>
          </div>
          <div>
            © {new Date().getFullYear()} InfluencerHub Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
