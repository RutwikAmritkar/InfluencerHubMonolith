import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
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
  Laptop,
  Smartphone,
  ShieldCheck,
} from "lucide-react";

export default function Landing() {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();

  // 3D Perspective Tilt Motion Controls
  const containerRef = useRef<HTMLDivElement>(null);
  const rawMouseX = useMotionValue(0);
  const rawMouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(rawMouseY, [-0.5, 0.5], [shouldReduceMotion ? 0 : 9, shouldReduceMotion ? 0 : -9]), { stiffness: 90, damping: 22 });
  const rotateY = useSpring(useTransform(rawMouseX, [-0.5, 0.5], [shouldReduceMotion ? 0 : -9, shouldReduceMotion ? 0 : 9]), { stiffness: 90, damping: 22 });

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

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0F19] text-white selection:bg-blue-600 selection:text-white relative overflow-x-hidden font-sans">
      
      {/* Background Lighting Aura */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[55rem] h-[55rem] bg-gradient-to-br from-blue-600/15 via-indigo-600/10 to-transparent rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:36px_36px] opacity-20 pointer-events-none" />

      {/* TOP NAVIGATION HEADER WITH DROPDOWNS & INCREASED FONT SIZE */}
      <header className="relative z-50 flex items-center justify-between w-full max-w-7xl mx-auto py-5 px-6 lg:px-12">
        {/* Brand Logo */}
        <Link href="/">
          <div className="inline-flex items-center gap-3 cursor-pointer group">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-600/30 group-hover:scale-105 transition-transform duration-300">
              I
            </div>
            <span className="text-2xl font-black tracking-tight text-white">
              Influencer<span className="text-blue-500">Hub</span>
            </span>
          </div>
        </Link>

        {/* Center Dropdown Navigation (Larger Font Size text-sm/text-base) */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-300">
          
          {/* Features Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setOpenDropdown("features")}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer py-2">
              Features <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === "features" ? "rotate-180 text-blue-500" : ""}`} />
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
                  <div className="p-2 hover:bg-slate-800/60 rounded-xl transition-colors cursor-pointer flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">AI Discovery</p>
                      <p className="text-[10px] text-slate-400">Audience matching matrix</p>
                    </div>
                  </div>
                  <div className="p-2 hover:bg-slate-800/60 rounded-xl transition-colors cursor-pointer flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Live Telemetry</p>
                      <p className="text-[10px] text-slate-400">Real-time metrics & ROI</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Use Cases Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setOpenDropdown("usecases")}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer py-2">
              Use Cases <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === "usecases" ? "rotate-180 text-blue-500" : ""}`} />
            </button>
            <AnimatePresence>
              {openDropdown === "usecases" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 w-64 p-3 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-2xl space-y-2 z-50"
                >
                  <div className="p-2 hover:bg-slate-800/60 rounded-xl transition-colors cursor-pointer flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">For Brands</p>
                      <p className="text-[10px] text-slate-400">Discover & hire creators</p>
                    </div>
                  </div>
                  <div className="p-2 hover:bg-slate-800/60 rounded-xl transition-colors cursor-pointer flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">For Creators</p>
                      <p className="text-[10px] text-slate-400">Monetize & grow influence</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <a href="#features" className="hover:text-white transition-colors cursor-pointer py-2">
            Updates
          </a>

          <a href="#pricing" className="hover:text-white transition-colors cursor-pointer py-2">
            Pricing
          </a>

          <button onClick={() => toast("Blog", { description: "Read creator economy insights." })} className="hover:text-white transition-colors cursor-pointer py-2">
            Blog
          </button>

          {/* Download Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setOpenDropdown("download")}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer py-2">
              Download <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === "download" ? "rotate-180 text-blue-500" : ""}`} />
            </button>
            <AnimatePresence>
              {openDropdown === "download" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full right-0 w-56 p-3 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-2xl space-y-2 z-50"
                >
                  <div className="p-2 hover:bg-slate-800/60 rounded-xl transition-colors cursor-pointer flex items-center gap-3">
                    <Laptop className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-semibold text-white">Desktop App</span>
                  </div>
                  <div className="p-2 hover:bg-slate-800/60 rounded-xl transition-colors cursor-pointer flex items-center gap-3">
                    <Smartphone className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-semibold text-white">iOS & Android App</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* Right Auth Buttons */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors px-3 py-2" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button className="text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 px-6 py-2.5 rounded-full shadow-xl shadow-blue-600/30 transition-all hover:scale-105 active:scale-95" asChild>
            <Link href="/signup">Sign up</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* CENTERED EDITORIAL HERO SECTION */}
        <section
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative overflow-hidden pt-16 pb-28 px-6 lg:px-12 flex flex-col items-center text-center"
        >
          <Badge variant="outline" className="mb-6 px-4 py-1.5 border-blue-500/30 bg-blue-500/10 text-blue-400 rounded-full font-bold text-xs">
            <Sparkles className="w-4 h-4 mr-2 text-blue-400" />
            The All-In-One Creator & Brand OS
          </Badge>
          
          <h1 className="text-5xl sm:text-7xl lg:text-[5.5rem] font-black text-white tracking-[-0.04em] leading-[0.94] max-w-5xl mb-6">
            Creators, campaigns, and analytics. <br />
            <span className="text-blue-500">Finally in one platform.</span>
          </h1>
          
          <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mb-8 leading-relaxed font-medium">
            The creator operating system for discovery, campaigns, and payments — all in one fast, beautiful platform you'll actually enjoy using.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md">
            <Button size="lg" className="h-13 px-8 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full text-base shadow-2xl shadow-blue-600/40 hover:scale-105 transition-all" asChild>
              <Link href="/signup">
                Sign up for free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
          
          {/* FLOATING 3D PERSPECTIVE macOS PRODUCT VIEWPORT FRAME */}
          <div className="mt-16 w-full max-w-5xl">
            <motion.div
              style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
              className="relative rounded-3xl border border-slate-800 bg-slate-950/80 p-3 sm:p-5 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.9)] backdrop-blur-2xl overflow-hidden ring-1 ring-white/10"
            >
              {/* macOS Window Title bar */}
              <div className="flex items-center justify-between pb-3 px-3 border-b border-slate-800/80 text-xs text-slate-500 font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                  <span className="ml-3 font-medium text-slate-400 text-[11px]">Production planning - InfluencerHub</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-300">Share</span>
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                </div>
              </div>

              {/* macOS App Layout Inner Grid */}
              <div className="grid grid-cols-12 gap-4 pt-4 text-left min-h-[360px] sm:min-h-[420px]">
                
                {/* App Left Sidebar */}
                <div className="col-span-4 sm:col-span-3 border-r border-slate-800/80 pr-4 space-y-4 text-xs font-medium text-slate-400">
                  <div className="space-y-1">
                    <div className="p-2 rounded-xl bg-blue-600/15 text-blue-400 font-bold flex items-center gap-2">
                      <Inbox className="w-4 h-4" /> Inbox
                    </div>
                    <div className="p-2 rounded-xl hover:bg-slate-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Today
                    </div>
                    <div className="p-2 rounded-xl hover:bg-slate-900 flex items-center gap-2">
                      <Zap className="w-4 h-4" /> Updates <span className="ml-auto w-2 h-2 rounded-full bg-blue-500" />
                    </div>
                    <div className="p-2 rounded-xl hover:bg-slate-900 flex items-center gap-2">
                      <CheckSquare className="w-4 h-4" /> Tasks
                    </div>
                    <div className="p-2 rounded-xl hover:bg-slate-900 flex items-center gap-2">
                      <ListTodo className="w-4 h-4" /> Lists
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800/60 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Favorites</span>
                    <div className="text-[11px] text-slate-300 font-medium pl-2">⚡ Video Pitches</div>
                    <div className="text-[11px] text-slate-300 font-medium pl-2">🎯 Brand Deals</div>
                    <div className="text-[11px] text-slate-300 font-medium pl-2">📊 Analytics Q3</div>
                  </div>
                </div>

                {/* App Main Work Canvas */}
                <div className="col-span-8 sm:col-span-9 pl-2 sm:pl-4 space-y-6">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      Campaign Planning — Q3 Launch
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 14 Active Creator Milestones • Live Synchronization
                    </p>
                  </div>

                  {/* Action Items List */}
                  <div className="space-y-2.5">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Action Items</span>
                    
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 flex items-center gap-3 text-xs text-white">
                      <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="line-through text-slate-400">Review Instagram Story deliverables from Alex Rivera</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 flex items-center gap-3 text-xs text-white">
                      <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                      <span>Approve $15,000 campaign escrow payout for YouTube integration</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 flex items-center gap-3 text-xs text-white">
                      <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                      <span>Export engagement analytics report for brand stakeholders</span>
                    </div>
                  </div>

                  {/* Media Creator Showcase Preview */}
                  <div className="relative h-32 sm:h-40 rounded-2xl overflow-hidden border border-slate-800 shadow-lg">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1200&auto=format&fit=crop"
                      alt="Creator Showcase"
                      className="w-full h-full object-cover object-center opacity-85"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-4 flex items-end justify-between">
                      <div>
                        <span className="text-xs font-bold text-white block">Sophia Chen</span>
                        <span className="text-[10px] text-cyan-400 font-mono">4.8% Engagement Rate • 850k Followers</span>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-md">
                        Verified Creator
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        </section>

        {/* Logos Section */}
        <section className="py-12 border-y border-slate-800/80 bg-slate-950/40">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-8">Trusted by fast-growing brands</p>
            <div className="flex flex-wrap justify-center gap-12 md:gap-20 text-slate-400 font-bold opacity-70">
              {['Acme Corp', 'GlobalTech', 'Nexus', 'Stark Ind.', 'Wayne Ent.'].map((logo, i) => (
                <div key={i} className="text-xl md:text-2xl font-bold tracking-tight hover:text-white transition-colors">{logo}</div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-28 px-6 lg:px-12 max-w-7xl mx-auto">
          <div className="mb-16 max-w-3xl text-left">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4 text-white">Everything you need to scale campaigns.</h2>
            <p className="text-lg text-slate-400">We built the infrastructure so you can focus on building relationships and creating incredible content.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Users className="h-6 w-6 text-blue-400" />,
                title: "AI-Powered Discovery",
                description: "Find the exact audience match. Our AI analyzes demographics, engagement rates, and content style to recommend the perfect creators."
              },
              {
                icon: <Zap className="h-6 w-6 text-cyan-400" />,
                title: "Frictionless Workflows",
                description: "From initial pitch to final payment, every step is templated, trackable, and transparent. Say goodbye to messy email threads."
              },
              {
                icon: <TrendingUp className="h-6 w-6 text-emerald-400" />,
                title: "Real-time ROI Tracking",
                description: "Live dashboards that show impressions, clicks, conversions, and estimated ROI. Know exactly what your spend is yielding."
              }
            ].map((feature, i) => (
              <Card key={i} className="border border-slate-800 shadow-xl bg-slate-900/60 backdrop-blur-md">
                <CardContent className="p-8 text-left">
                  <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Dual Value Prop */}
        <section className="py-28 bg-slate-950 border-t border-slate-800/80">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
              <div className="text-left">
                <Badge variant="outline" className="mb-6 border-cyan-500/30 text-cyan-400 bg-cyan-500/10">For Brands</Badge>
                <h2 className="text-4xl font-extrabold mb-6 leading-tight text-white">Stop guessing. Start measuring.</h2>
                <ul className="space-y-4 mb-8">
                  {["Verified audience analytics", "Automated contract generation", "Escrow payments", "Campaign performance dashboards"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-300 text-sm">
                      <CheckCircle className="h-5 w-5 text-cyan-400 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button className="rounded-full bg-blue-600 text-white hover:bg-blue-500 font-bold px-6 py-2.5">
                  <Link href="/signup">Post a Campaign</Link>
                </Button>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 rounded-3xl blur-2xl"></div>
                <div className="relative rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl text-left">
                  <div className="flex items-center gap-4 mb-8 border-b border-slate-800 pb-6">
                    <img src="https://i.pravatar.cc/150?u=a042581f4e29026024d" className="w-16 h-16 rounded-full ring-2 ring-cyan-500" />
                    <div>
                      <h4 className="font-bold text-lg text-white">Sarah Jenkins</h4>
                      <p className="text-slate-400 text-sm">Tech & Lifestyle Creator</p>
                    </div>
                    <div className="ml-auto text-right">
                      <div className="text-2xl font-bold text-cyan-400">8.4%</div>
                      <div className="text-xs text-slate-400 uppercase tracking-wider font-mono">Engagement</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-3 w-3/4 bg-slate-800 rounded-full"></div>
                    <div className="h-3 w-1/2 bg-slate-800 rounded-full"></div>
                    <div className="h-3 w-5/6 bg-slate-800 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-28 px-6 lg:px-12">
          <div className="max-w-4xl mx-auto text-center bg-blue-600/10 border border-blue-500/20 rounded-3xl p-12 lg:p-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 text-white relative z-10">Ready to elevate your partnerships?</h2>
            <p className="text-base sm:text-lg text-slate-400 mb-8 relative z-10 max-w-xl mx-auto">Join thousands of brands and creators building better business together.</p>
            <Button size="lg" className="rounded-full h-13 px-8 text-base font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-2xl shadow-blue-600/30 relative z-10" asChild>
              <Link href="/signup">Create your free account</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-10 px-6 lg:px-12 bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              I
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Influencer<span className="text-blue-500">Hub</span></span>
          </div>
          <div className="text-xs text-slate-400">
            © {new Date().getFullYear()} InfluencerHub Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
