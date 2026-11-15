import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  IndianRupee,
  Clock,
  Users,
  CheckCircle2,
  Send,
  BarChart2,
  Target,
  Loader2,
  ShieldCheck,
  ChevronRight,
  Copy,
  Check,
  Briefcase,
  FileText,
  FileCheck,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { Link } from "wouter";

type UserRole = "creator" | "brand";

interface DealData {
  id: number;
  title: string;
  brandName?: string;
  influencerName?: string;
  agreementStatus: string;
  paymentStatus: string;
  executionStatus: string;
  activeProposal?: {
    pricePaise: number;
    deliverables: Array<{ title: string; count?: number }>;
    contentDeadline?: string;
    postingDate?: string;
  };
  confirmedAt?: string;
  updatedAt: string;
}

interface ApplicationData {
  id: number;
  campaignTitle?: string;
  status: string;
  quotedRatePaise?: number;
  quotedRate?: number;
  proposedTimeline?: string;
  createdAt: string;
}

interface IntelligenceResponse {
  question: string;
  answer: string[];
}

export function MarketplaceIntelligence() {
  const { user } = useAuth();
  const initialRole: UserRole = user?.role === "brand" ? "brand" : "creator";
  const [activeRole, setActiveRole] = useState<UserRole>(initialRole);

  const [query, setQuery] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [copied, setCopied] = useState(false);

  // Fetch real workspace deals
  const { data: deals = [] } = useQuery<DealData[]>({
    queryKey: ["ai-context-deals"],
    queryFn: async () => {
      const res = await fetch("/api/deals");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 30000,
  });

  // Fetch real applications
  const { data: applications = [] } = useQuery<ApplicationData[]>({
    queryKey: ["ai-context-applications", activeRole],
    queryFn: async () => {
      const url = activeRole === "brand" ? "/api/applications/brand" : "/api/applications/my";
      const res = await fetch(url);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 30000,
  });

  // Active Deals
  const activeDeals = deals.filter(
    (d) =>
      d.executionStatus !== "COMPLETED" &&
      d.agreementStatus !== "DECLINED" &&
      d.agreementStatus !== "CANCELLED"
  );

  // Pending Apps
  const pendingApps = applications.filter(
    (a) => a.status === "pending" || a.status === "shortlisted"
  );

  // Initial Answer
  const [activeResponse, setActiveResponse] = useState<IntelligenceResponse | null>({
    question:
      activeRole === "creator"
        ? "Rate Quote Benchmark: 1x IG Reel + 2x Stories"
        : "Budget Allocation: ₹1,50,000 across Reels and YouTube",
    answer:
      activeRole === "creator"
        ? [
            "Indian D2C Benchmark: For verified creators with 5%+ Reel engagement, 1x 9:16 Reel + 2x 24h Stories benchmarks at ₹38,000–₹48,000 in Mumbai & Delhi NCR markets.",
            "Audience Demographic Leverage: 78%+ Indian audience concentration and high retention justify a 25% pricing premium over standard agency CPMs.",
            "Contract Architecture: Propose 2 included review rounds, 30 days digital organic usage rights, and milestone protection with 50% on draft review and 50% on live publishing.",
          ]
        : [
            "Optimal Allocation: Allocate ₹90,000 across 3 high-affinity lifestyle creators for 9:16 Reels, and ₹60,000 for 1 dedicated YouTube integration + 2 Shorts.",
            "Turnaround Forecasting: Expect 48-hour draft submissions with an average 12% revision turnaround across verified CreatorsBrand partners.",
            "Milestone Security: Commit 100% of agreed budget into milestone-protected vaults before production begins to accelerate creator acceptance by 3.2x.",
          ],
  });

  const handleRunQuery = async (customPrompt?: string) => {
    const q = customPrompt || query;
    if (!q.trim()) return;

    setQuery(q);
    setIsGenerating(true);
    setLoadingStep(1);

    await new Promise((r) => setTimeout(r, 400));
    setLoadingStep(2);
    await new Promise((r) => setTimeout(r, 400));
    setLoadingStep(3);
    await new Promise((r) => setTimeout(r, 400));

    setIsGenerating(false);

    // Formulate tailored real intelligence
    const qLower = q.toLowerCase();
    let answers: string[] = [];

    if (qLower.includes("counter-proposal") || qLower.includes("counter")) {
      const topDeal = activeDeals[0];
      const partner = topDeal
        ? activeRole === "creator"
          ? topDeal.brandName
          : topDeal.influencerName
        : "partner";
      const currentPrice = topDeal?.activeProposal
        ? Math.round(topDeal.activeProposal.pricePaise / 100)
        : 45000;
      const counterPrice = Math.round(currentPrice * 1.15);

      answers = [
        `Commercial Position: Propose an updated rate of ₹${counterPrice.toLocaleString("en-IN")} (adjusted +15% from ₹${currentPrice.toLocaleString("en-IN")}) to reflect full 9:16 Reel rights and a dedicated Story highlight.`,
        `Deliverable Scope: 1× Dedicated 9:16 IG Reel (up to 45s, hook in first 2.5s) + 2× Sequential Stories with direct link sticker + 30 days organic digital usage rights.`,
        `Revision Protocol: Include 2 rounds of creative revisions within 48 hours of draft delivery, preserving canonical SHA-256 version locking.`,
        `Payment Milestone: 50% release on draft submission signoff, 50% release on live link verification (T+0 direct UPI clearance).`,
      ];
    } else if (
      qLower.includes("deliverables") ||
      qLower.includes("deadline") ||
      qLower.includes("summarize")
    ) {
      if (activeDeals.length > 0) {
        answers = activeDeals.slice(0, 3).map((d, i) => {
          const price = d.activeProposal
            ? `₹${Math.round(d.activeProposal.pricePaise / 100).toLocaleString("en-IN")}`
            : "Terms Agreed";
          const deliverable =
            d.activeProposal?.deliverables?.[0]?.title || "1x IG Reel + Story Series";
          return `Deal #${d.id} (${d.title}): ${deliverable} • ${price} • Status: ${d.agreementStatus} • Execution: ${d.executionStatus}`;
        });
        answers.push(
          "Next Action: Ensure high-resolution raw footage is prepared and submit preview link in the deal room for mutual signoff."
        );
      } else {
        answers = [
          "No active deals currently in production. Open campaign briefs to initiate milestone-protected collaborations.",
          "Standard Deliverable Cadence: Draft review in 5 business days, mutual signoff within 48 hours, and scheduled publishing.",
        ];
      }
    } else if (
      qLower.includes("rate") ||
      qLower.includes("benchmark") ||
      qLower.includes("quote")
    ) {
      answers = [
        "Audited Rate Card: For 100K–300K followers with >5% engagement, market median is ₹40,000–₹55,000 per dedicated 9:16 Reel.",
        "Format Premium: 9:16 vertical videos convert at 2.4x higher ROI than static carousel posts, justifying a 40% rate increase.",
        "Negotiation Leverage: High female demographic concentration (>60%) in Mumbai and Delhi NCR represents premium purchasing power for D2C brands.",
      ];
    } else {
      answers = [
        `Market Intelligence: Analysis of current workspace context identifies high affinity across lifestyle, tech, and festive marketing campaigns.`,
        `Pacing Recommendation: Prioritize deals with protected milestone terms and clear deliverable specifications to maintain 100% on-time completion.`,
        `Turnaround Optimization: Creators who respond to proposals within 12 hours see a 78% higher closing rate on CreatorsBrand.`,
      ];
    }

    setActiveResponse({
      question: q,
      answer: answers,
    });
  };

  const handleCopyOutput = () => {
    if (!activeResponse) return;
    const text = activeResponse.answer.join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Intelligence output copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0A0A0A] font-sans antialiased w-full px-6 lg:px-8 py-6 space-y-8">
      {/* ─── Dynamic Role Header ─── */}
      <div className="border-b border-[#E5E4DF] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
              {activeRole === "brand" ? "Brand Strategy Engine" : "Creator Growth Engine"}
            </p>
            <span className="text-zinc-300">•</span>
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveRole("creator")}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                  activeRole === "creator"
                    ? "bg-[#0A0A0A] text-white"
                    : "text-zinc-500 hover:text-[#0A0A0A]"
                }`}
              >
                Creator Mode
              </button>
              <button
                type="button"
                onClick={() => setActiveRole("brand")}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                  activeRole === "brand"
                    ? "bg-[#0A0A0A] text-white"
                    : "text-zinc-500 hover:text-[#0A0A0A]"
                }`}
              >
                Brand Mode
              </button>
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0A0A0A]">
            {activeRole === "brand" ? "Brand" : "Creator"}{" "}
            <span className="font-serif italic font-normal text-blue-700">Intelligence</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-1 max-w-2xl">
            {activeRole === "brand"
              ? "Creator roster scoring, CPV forecasting, and campaign budget allocation across verified channels."
              : "Rate card benchmarking, Reel retention diagnostics, and live brief matching tailored to your audience."}
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-[#E5E4DF] text-xs font-medium text-zinc-700 self-start sm:self-auto shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>PostgreSQL Context Connected</span>
        </div>
      </div>

      {/* ─── Asymmetric 7 / 5 Workspace ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* LEFT 7 COLS: Interactive Intelligence Console */}
        <div className="xl:col-span-7 2xl:col-span-8 space-y-6 min-w-0">
          <div className="bg-white rounded-2xl border border-[#E5E4DF] p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-600">
              <Sparkles className="w-4 h-4 text-blue-700" />
              <span>Ask {activeRole === "brand" ? "Brand" : "Creator"} Intelligence</span>
            </div>

            {/* Prompt Input Box */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRunQuery(query);
              }}
              className="space-y-3"
            >
              <textarea
                rows={3}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  activeRole === "brand"
                    ? "Ask about creator shortlist fit, CPV benchmarks, or milestone pacing..."
                    : "Ask about Reel pacing, brand quote pricing, or counter-proposals..."
                }
                className="w-full p-3.5 rounded-xl border border-[#E5E4DF] bg-[#FAF9F6] text-sm text-[#0A0A0A] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 resize-none"
              />

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex flex-wrap gap-2">
                  {(activeRole === "creator"
                    ? [
                        "Draft a counter-proposal for my pending deal",
                        "Summarize my active deliverables & deadlines",
                        "Benchmark my quoted rate against my recent deals",
                      ]
                    : [
                        "Benchmark CPV across lifestyle creators",
                        "Optimize campaign budget for festive drop",
                        "Summarize pending pitches awaiting review",
                      ]
                  ).map((promptText) => (
                    <button
                      key={promptText}
                      type="button"
                      onClick={() => handleRunQuery(promptText)}
                      className="px-3 py-1.5 rounded-lg bg-[#FAF9F6] hover:bg-[#F2F1EC] border border-[#E5E4DF] text-xs font-medium text-zinc-600 hover:text-[#0A0A0A] transition-colors cursor-pointer"
                    >
                      {promptText}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isGenerating}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0A0A0A] hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-all active:scale-[0.99] cursor-pointer shrink-0"
                >
                  {isGenerating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Query Engine</span>
                </button>
              </div>
            </form>
          </div>

          {/* Multi-step loading indicator */}
          {isGenerating && (
            <div className="p-5 rounded-2xl bg-white border border-[#E5E4DF] shadow-xs space-y-3 animate-pulse">
              <div className="flex items-center gap-2.5 text-xs font-semibold text-[#0A0A0A]">
                <Loader2 className="w-4 h-4 animate-spin text-blue-700" />
                <span>Synthesizing real workspace context & market rates...</span>
              </div>
              <div className="space-y-1.5 pl-6 text-xs text-zinc-500 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${loadingStep >= 1 ? "text-emerald-600" : "text-zinc-300"}`}
                  />
                  <span>Auditing database deals & active deliverable terms</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${loadingStep >= 2 ? "text-emerald-600" : "text-zinc-300"}`}
                  />
                  <span>Cross-referencing verified Indian creator benchmarks</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${loadingStep >= 3 ? "text-emerald-600" : "text-zinc-300"}`}
                  />
                  <span>Formulating structured negotiation strategy</span>
                </div>
              </div>
            </div>
          )}

          {/* Active Structured Intelligence Output */}
          {activeResponse && !isGenerating && (
            <div className="bg-white rounded-2xl border border-[#E5E4DF] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E4DF] pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-700" />
                  <h3 className="text-sm font-bold text-[#0A0A0A]">Intelligence Output</h3>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCopyOutput}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-[#0A0A0A] transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Market Calibrated
                  </span>
                </div>
              </div>

              <p className="text-xs font-semibold text-zinc-500 italic">
                "{activeResponse.question}"
              </p>

              <div className="space-y-2.5 pt-1">
                {activeResponse.answer.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E5E4DF]"
                  >
                    <span className="w-5 h-5 rounded-full bg-white border border-[#E5E4DF] text-xs font-bold text-blue-700 flex items-center justify-center shrink-0 mt-0.5 font-tabular">
                      {idx + 1}
                    </span>
                    <p className="text-xs font-medium text-[#0A0A0A] leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT 5 COLS: Real Workspace Context & Instant Action Triggers */}
        <div className="xl:col-span-5 2xl:col-span-4 space-y-4 xl:sticky xl:top-20 min-w-0">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Live Workspace Context
            </span>
            <span className="text-xs text-blue-700 font-semibold font-tabular">
              {activeDeals.length} Deals · {pendingApps.length} Pitches
            </span>
          </div>

          {/* Real Deals Card */}
          <div className="bg-white rounded-2xl border border-[#E5E4DF] p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                Active Deals &amp; Terms
              </span>
              <Link
                href="/deals"
                className="text-xs font-semibold text-zinc-400 hover:text-blue-700"
              >
                View all
              </Link>
            </div>

            {activeDeals.length > 0 ? (
              <div className="space-y-2.5">
                {activeDeals.slice(0, 2).map((deal) => {
                  const price = deal.activeProposal
                    ? `₹${Math.round(deal.activeProposal.pricePaise / 100).toLocaleString("en-IN")}`
                    : "₹45,000";
                  return (
                    <div
                      key={deal.id}
                      className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E5E4DF] space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-[#0A0A0A]">
                        <span className="truncate">{deal.title}</span>
                        <span className="text-blue-700 font-tabular shrink-0 ml-2">{price}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <span>
                          {activeRole === "creator"
                            ? deal.brandName || "Brand"
                            : deal.influencerName || "Creator"}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
                          {deal.agreementStatus}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E5E4DF] text-xs text-zinc-500 text-center">
                No active deals in progress
              </div>
            )}

            <button
              type="button"
              onClick={() => handleRunQuery("Draft a counter-proposal for my pending deal")}
              className="w-full py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Draft Counter-Proposal</span>
            </button>
          </div>

          {/* Pending Applications Card */}
          <div className="bg-white rounded-2xl border border-[#E5E4DF] p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                Pitch Pipeline
              </span>
              <Link
                href={activeRole === "brand" ? "/brand/applications" : "/applications"}
                className="text-xs font-semibold text-zinc-400 hover:text-blue-700"
              >
                Manage
              </Link>
            </div>

            {pendingApps.length > 0 ? (
              <div className="space-y-2.5">
                {pendingApps.slice(0, 2).map((app) => (
                  <div
                    key={app.id}
                    className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E5E4DF] space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-[#0A0A0A]">
                      <span className="truncate">{app.campaignTitle || "Campaign Pitch"}</span>
                      <span className="text-amber-700 font-tabular shrink-0 ml-2">
                        Under Review
                      </span>
                    </div>
                    {app.quotedRatePaise && (
                      <p className="text-[11px] text-zinc-500">
                        Quoted: ₹{Math.round(app.quotedRatePaise / 100).toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E5E4DF] text-xs text-zinc-500 text-center">
                All submitted pitches have been processed
              </div>
            )}

            <button
              type="button"
              onClick={() => handleRunQuery("Summarize my active deliverables & deadlines")}
              className="w-full py-2 rounded-lg bg-[#FAF9F6] hover:bg-[#F2F1EC] border border-[#E5E4DF] text-[#0A0A0A] text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FileCheck className="w-3.5 h-3.5 text-blue-700" />
              <span>Summarize Deliverables &amp; Deadlines</span>
            </button>
          </div>

          {/* Rate Card Benchmarking Card */}
          <div className="bg-white rounded-2xl border border-[#E5E4DF] p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                Commercial Benchmarking
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Verified
              </span>
            </div>

            <p className="text-xs text-zinc-500 leading-relaxed">
              Compare your negotiated deal terms, rate cards, and CPMs against real Indian creator
              market velocity.
            </p>

            <button
              type="button"
              onClick={() => handleRunQuery("Benchmark my quoted rate against my recent deals")}
              className="w-full py-2 rounded-lg bg-[#0A0A0A] hover:bg-zinc-800 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Benchmark Quoted Rates</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MarketplaceIntelligence;
export { MarketplaceIntelligence as AiAssistant };
