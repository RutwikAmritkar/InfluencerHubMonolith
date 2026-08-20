import { useState, useMemo, useEffect } from "react";
import { useGetAiSuggestions } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  ArrowRight,
  Loader2,
  Users,
  Clock,
  Megaphone,
  TrendingUp,
  DollarSign,
  Zap,
  ChevronRight,
  CheckCircle2,
  Target,
  RefreshCw,
  Activity,
  Layers,
  BarChart2,
  PieChart,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Suggested Prompt Chips List
const SUGGESTED_PROMPTS = [
  "How can I grow faster?",
  "What should I post next?",
  "Find campaigns for me",
  "Increase my earnings",
  "Analyze my audience",
];

// Context Quick Filters
const CONTEXT_TAGS = [
  { label: "Audience", icon: Users },
  { label: "Content", icon: Layers },
  { label: "Earnings", icon: DollarSign },
  { label: "Campaigns", icon: Megaphone },
];

// Semantic Category Color Configs
const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string; icon: any }> = {
  audience: {
    bg: "bg-blue-50 dark:bg-blue-950/60",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200/80 dark:border-blue-800/80",
    icon: Users,
  },
  timing: {
    bg: "bg-purple-50 dark:bg-purple-950/60",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-200/80 dark:border-purple-800/80",
    icon: Clock,
  },
  campaign: {
    bg: "bg-emerald-50 dark:bg-emerald-950/60",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200/80 dark:border-emerald-800/80",
    icon: Megaphone,
  },
  growth: {
    bg: "bg-indigo-50 dark:bg-indigo-950/60",
    text: "text-indigo-600 dark:text-indigo-400",
    border: "border-indigo-200/80 dark:border-indigo-800/80",
    icon: TrendingUp,
  },
  revenue: {
    bg: "bg-emerald-50 dark:bg-emerald-950/60",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200/80 dark:border-emerald-800/80",
    icon: DollarSign,
  },
  engagement: {
    bg: "bg-amber-50 dark:bg-amber-950/60",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200/80 dark:border-amber-800/80",
    icon: Zap,
  },
};

// Response Interfaces matching backend JSON
interface LLMInsight {
  category: "audience" | "timing" | "growth" | "revenue" | "engagement" | "campaign";
  title: string;
  description: string;
  metric: string | null;
  priority: "high" | "medium" | "low";
  relevance: number;
  action: string;
}

interface LLMRecommendation {
  title: string;
  description: string;
  action: string;
}

interface LLMGeneratedResult {
  answer: string;
  insights: LLMInsight[];
  recommendations: LLMRecommendation[];
}

// Initial Default Insights
const DEFAULT_INSIGHTS: LLMInsight[] = [
  {
    category: "timing",
    title: "Post between 6PM and 8PM for maximum reach",
    description: "Telemetry shows peak follower activity during weekday evenings. Scheduled posts get 34% higher impression rates.",
    metric: "+3.4x",
    priority: "medium",
    relevance: 91,
    action: "Schedule next post →",
  },
  {
    category: "campaign",
    title: "3 active brand briefs match your profile 92%",
    description: "Strong demographic alignment in beauty & lifestyle with 4.8% average engagement rate.",
    metric: "92%",
    priority: "high",
    relevance: 92,
    action: "Browse briefs →",
  },
  {
    category: "growth",
    title: "Reels drive 2.8x more follower growth",
    description: "Short-form video content generates significantly higher virality than static photo posts on Instagram.",
    metric: "2.8x",
    priority: "high",
    relevance: 88,
    action: "View video strategy →",
  },
  {
    category: "revenue",
    title: "You could earn $2,400 more this month",
    description: "Based on your engagement tier, updating your collaboration rate card for Q3 campaigns can boost monthly revenue.",
    metric: "+$2,400",
    priority: "high",
    relevance: 95,
    action: "Update rate card →",
  },
  {
    category: "engagement",
    title: "Engagement drops after 5 posts per week",
    description: "Audience fatigue sets in past 5 posts/week. Quality over frequency preserves high comment-to-view ratios.",
    metric: "-15%",
    priority: "low",
    relevance: 89,
    action: "Adjust frequency →",
  },
];

export default function AiAssistant() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [generatedResult, setGeneratedResult] = useState<LLMGeneratedResult | null>(null);

  const { data: apiSuggestions, isLoading: suggLoading } = useGetAiSuggestions();

  // Multi-step loading simulation sequence
  useEffect(() => {
    let interval: any;
    if (isGenerating) {
      setLoadingStep(1);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < 3 ? prev + 1 : prev));
      }, 700);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Initial insight list from API or default fallback
  const baseInsights: LLMInsight[] = useMemo(() => {
    if (apiSuggestions && apiSuggestions.length > 0) {
      return apiSuggestions.map((s) => {
        const catKey = (s.type?.toLowerCase() || "growth") as any;
        const cat = CATEGORY_STYLES[catKey] ? catKey : "growth";
        return {
          category: cat,
          title: s.title,
          description: s.body,
          metric: null,
          priority: "medium",
          relevance: s.confidence <= 1 ? Math.round(s.confidence * 100) : Math.round(s.confidence),
          action: s.action || "Explore insight →",
        };
      });
    }
    return DEFAULT_INSIGHTS;
  }, [apiSuggestions]);

  // Active displayed insights
  const activeInsights = generatedResult?.insights || baseInsights;
  const activeAnswer = generatedResult?.answer;
  const activeRecs = generatedResult?.recommendations || [];

  const handleGenerate = async (promptText?: string) => {
    const textToSubmit = promptText || query;
    if (!textToSubmit.trim()) return;

    setQuery(textToSubmit);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: textToSubmit.trim() }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as LLMGeneratedResult;
      setGeneratedResult(data);
    } catch (err: any) {
      console.warn("AI Generation call failed, using fallback:", err?.message || err);
      toast.warning("AI server response unavailable. Showing context-aware insights.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-none space-y-8 pb-16 text-slate-900 dark:text-slate-100 antialiased font-sans px-2 sm:px-4 md:px-6 lg:px-8 xl:px-10 bg-radial from-blue-500/[0.035] via-transparent to-transparent">
      
      {/* ─── 1. WORKSPACE HEADER & SYSTEM STATUS ─────────────────────────── */}
      <div className="w-full flex flex-col items-center text-center pt-2 sm:pt-4 space-y-3">
        
        {/* System Status Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/90 dark:bg-blue-950/80 border border-blue-200/80 dark:border-blue-800/80 text-[10px] font-semibold font-mono tracking-[0.08em] uppercase text-[#315BEF] dark:text-blue-400 shadow-2xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#315BEF] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#315BEF]"></span>
          </span>
          <span>✦ AI INSIGHTS ACTIVE</span>
        </div>

        {/* Product Title */}
        <h1 className="text-[30px] sm:text-[36px] md:text-[40px] font-bold tracking-[-0.025em] leading-[1.08] text-[#11182F] dark:text-slate-100">
          Your creator copilot.
        </h1>

        {/* Subtitle */}
        <p className="max-w-[640px] text-[14px] font-normal leading-[1.5] text-slate-500 dark:text-slate-400">
          Turn your audience, content, earnings, and campaign telemetry into your next best move.
        </p>
      </div>

      {/* ─── 2. HERO AI COMMAND CENTER (MAX-WIDTH 900PX) ───────────────────── */}
      <div className="max-w-[900px] w-full mx-auto space-y-3">
        
        {/* Elevated Command Center Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleGenerate();
          }}
          className="relative w-full"
        >
          <div className="rounded-2xl bg-white dark:bg-[#11172A] border border-slate-200/90 dark:border-slate-800 shadow-md shadow-blue-500/5 focus-within:border-[#315BEF] dark:focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-[#315BEF]/10 transition-all p-4 space-y-3">
            
            {/* Input Header */}
            <div className="flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-[#315BEF] dark:text-blue-400 shrink-0" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask InfluencerHub AI anything about your audience, growth, or earnings..."
                className="w-full border-none bg-transparent shadow-none focus-visible:ring-0 text-[14px] font-medium leading-[1.4] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 h-9 px-0"
              />
            </div>

            {/* Bottom Controls Row: Quick Category Filters + Generate Action */}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-3">
              
              {/* Category Quick Tags */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                {CONTEXT_TAGS.map((tag) => (
                  <button
                    key={tag.label}
                    type="button"
                    onClick={() => handleGenerate(`Analyze my ${tag.label.toLowerCase()}`)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100/80 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-slate-600 dark:text-slate-400 hover:text-[#315BEF] dark:hover:text-blue-400 text-[11px] font-semibold inline-flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <tag.icon className="w-3 h-3" />
                    <span>{tag.label}</span>
                  </button>
                ))}
              </div>

              {/* Action Button */}
              <Button
                type="submit"
                disabled={isGenerating}
                className="h-10 px-5 rounded-xl bg-[#315BEF] hover:bg-blue-600 text-white font-semibold text-[13px] shadow-md shadow-blue-600/20 shrink-0 cursor-pointer hover:scale-[1.01] active:scale-95 transition-all"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Generate <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* Suggested Prompt Chips */}
        <div className="flex flex-wrap items-center gap-2 justify-center pt-0.5">
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 font-mono uppercase tracking-[0.08em] mr-1">
            Try asking:
          </span>
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleGenerate(prompt)}
              className="px-3 py-1.5 rounded-full bg-white dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-slate-700 dark:text-slate-300 hover:text-[#315BEF] dark:hover:text-blue-400 border border-slate-200/80 dark:border-slate-700/80 text-[12px] font-medium transition-all cursor-pointer hover:scale-[1.02] shadow-2xs"
            >
              "{prompt}"
            </button>
          ))}
        </div>
      </div>

      {/* ─── 3. MULTI-STEP TELEMETRY LOADING STATE ───────────────────────── */}
      {isGenerating && (
        <div className="max-w-[760px] mx-auto p-5 rounded-2xl bg-white dark:bg-[#11172A] border border-blue-100 dark:border-blue-900/60 shadow-xs space-y-3 animate-pulse my-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#315BEF] font-mono uppercase tracking-wider">
            <Loader2 className="h-4 w-4 animate-spin text-[#315BEF]" />
            <span>Analyzing Creator Telemetry...</span>
          </div>

          <div className="space-y-1.5 pl-6 text-xs text-slate-600 dark:text-slate-300 font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`h-3.5 w-3.5 ${loadingStep >= 1 ? "text-emerald-500" : "text-slate-300"}`} />
              <span>Audience demographics & location patterns</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`h-3.5 w-3.5 ${loadingStep >= 2 ? "text-emerald-500" : "text-slate-300"}`} />
              <span>Content virality & video engagement rates</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`h-3.5 w-3.5 ${loadingStep >= 3 ? "text-emerald-500" : "text-slate-300"}`} />
              <span>Brand briefs & revenue growth potential</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── 4. CREATOR SIGNAL STRIP (BRIDGE TO DATA) ───────────────────── */}
      <div className="w-full rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-slate-50 dark:from-blue-950/40 dark:via-indigo-950/20 dark:to-[#11172A] border border-blue-100/90 dark:border-blue-900/50 p-3.5 px-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-[#315BEF] text-white flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#315BEF] dark:text-blue-400 font-mono block">
              ✦ CREATOR SIGNAL
            </span>
            <p className="text-xs font-semibold text-[#11182F] dark:text-slate-100">
              Your engagement rate is trending upward <span className="text-emerald-600 dark:text-emerald-400">+22% this week</span> across short-form videos.
            </p>
          </div>
        </div>

        <a href="/analytics" className="text-xs font-semibold text-[#315BEF] dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center gap-1 cursor-pointer shrink-0">
          <span>View analytics</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* ─── 5. GENERATED AI ANSWER BANNER ───────────────────────────────── */}
      {activeAnswer && !isGenerating && (
        <div className="w-full rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-purple-50/60 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-[#11172A] border border-blue-100/90 dark:border-blue-900/60 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5.5 h-5.5 rounded-lg bg-[#315BEF] text-white flex items-center justify-center">
                <Sparkles className="w-3 h-3" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#315BEF] dark:text-blue-400 font-mono">
                ✦ INFLUENCERHUB AI ANALYSIS
              </span>
            </div>
            <Badge className="bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 text-[10px] font-medium px-2 py-0.5 rounded-full">
              Live Verified
            </Badge>
          </div>

          <h3 className="text-[16px] sm:text-[17px] font-semibold text-[#11182F] dark:text-slate-100 leading-snug tracking-[-0.01em]">
            {activeAnswer}
          </h3>
        </div>
      )}

      {/* ─── 6. INSIGHTS SECTION FULL-WIDTH HEADER ───────────────────────── */}
      <div className="w-full flex items-center justify-between pt-3 border-b border-slate-200/60 dark:border-slate-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[20px] font-bold text-[#11182F] dark:text-slate-100 tracking-[-0.015em] leading-[1.2]">
              Your AI intelligence
            </h2>
            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 font-mono">
              Updated 2 min ago
            </span>
          </div>
          <p className="text-[13px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
            Personalized recommendations based on your creator telemetry.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleGenerate("Analyze my latest insights")}
          className="text-[12px] font-semibold text-[#315BEF] dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center gap-1 cursor-pointer transition-colors shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* ─── 7. FEATURED 2-COLUMN INSIGHT + SECONDARY 3-COLUMN GRID ─────── */}
      <div className="w-full space-y-6">
        
        {/* Top Row: 2-Column Featured Hero Insight + 1-Column Secondary Insight */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
          
          {/* FEATURED INSIGHT CARD (SPANS 2 COLUMNS) */}
          <Card className="lg:col-span-2 rounded-2xl bg-white dark:bg-[#11172A] border border-blue-100 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-200 p-6 flex flex-col justify-between group">
            <div className="space-y-4">
              
              {/* Badge Row */}
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px] font-semibold tracking-[0.06em] uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200/80">
                  <Users className="w-3 h-3" />
                  <span>FEATURED AUDIENCE INSIGHT</span>
                </Badge>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 font-mono">
                  94% relevant
                </span>
              </div>

              {/* Title & Body */}
              <div className="space-y-1.5">
                <h3 className="text-[18px] sm:text-[20px] font-bold text-[#11182F] dark:text-slate-100 group-hover:text-[#315BEF] dark:group-hover:text-blue-400 transition-colors">
                  Your audience is strongest in India
                </h3>
                <p className="text-[13.5px] font-normal leading-[1.55] text-slate-500 dark:text-slate-400 max-w-xl">
                  62% of your engaged followers are based in India. Telemetry shows peak activity during evening windows between 7PM and 10PM IST.
                </p>
              </div>

              {/* Mini Demographic Bar Visual */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-2">
                <div className="flex justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  <span>India Demographic Share</span>
                  <span className="font-mono text-[#315BEF]">62%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#315BEF] to-indigo-500 rounded-full w-[62%]" />
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[12.5px] font-semibold text-[#315BEF] dark:text-blue-400">
              <span>Optimize posting schedule →</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Card>

          {/* SECONDARY TIMING INSIGHT (1 COLUMN) */}
          <Card className="rounded-2xl bg-white dark:bg-[#11172A] border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-200 p-6 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px] font-semibold tracking-[0.06em] uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border-purple-200/80">
                  <Clock className="w-3 h-3" />
                  <span>TIMING</span>
                </Badge>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 font-mono">
                  91% relevant
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-[15px] font-semibold leading-[1.3] text-[#11182F] dark:text-slate-100 group-hover:text-[#315BEF] transition-colors">
                  Post between 6PM–8PM
                </h3>
                <p className="text-[13px] font-normal leading-[1.5] text-slate-500 dark:text-slate-400">
                  Data shows 3.4x higher engagement during weekday evening posting slots.
                </p>
              </div>

              <div className="py-2 px-3 rounded-lg bg-purple-50/60 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/60 flex items-center justify-between text-xs font-semibold text-purple-700 dark:text-purple-300 font-mono">
                <span>Engagement Boost</span>
                <span>+3.4x</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[12px] font-semibold text-[#315BEF] dark:text-blue-400">
              <span>Schedule next post →</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Card>

        </div>

        {/* Bottom Row: 3-Column Secondary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5.5 sm:gap-6 w-full">
          {suggLoading ? (
            <div className="col-span-3 flex justify-center py-12">
              <Loader2 className="animate-spin text-[#315BEF] h-7 w-7" />
            </div>
          ) : (
            activeInsights.slice(1).map((insight, idx) => {
              const catKey = (insight.category?.toLowerCase() || "growth") as string;
              const style = CATEGORY_STYLES[catKey] || CATEGORY_STYLES.growth;
              const CategoryIcon = style.icon;

              return (
                <Card
                  key={idx}
                  className="w-full min-h-[210px] rounded-2xl bg-white dark:bg-[#11172A] border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex flex-col justify-between"
                >
                  <CardContent className="p-5 sm:p-6 space-y-3 flex-1 flex flex-col justify-between">
                    
                    {/* Top Badge Row */}
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={`text-[10px] font-semibold tracking-[0.06em] uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 ${style.bg} ${style.text} ${style.border}`}>
                        <CategoryIcon className="w-3 h-3" />
                        <span>{insight.category}</span>
                      </Badge>

                      <div className="flex items-center gap-1.5">
                        {insight.metric && (
                          <span className="text-[11px] font-semibold text-[#11182F] dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                            {insight.metric}
                          </span>
                        )}
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 font-mono">
                          {insight.relevance}%
                        </span>
                      </div>
                    </div>

                    {/* Body Text */}
                    <div className="space-y-1 flex-1">
                      <h3 className="text-[15px] font-semibold leading-[1.3] text-[#11182F] dark:text-slate-100 group-hover:text-[#315BEF] dark:group-hover:text-blue-400 transition-colors">
                        {insight.title}
                      </h3>
                      <p className="text-[13px] font-normal leading-[1.55] text-slate-500 dark:text-slate-400">
                        {insight.description}
                      </p>
                    </div>

                    {/* CTA Row */}
                    <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[12px] font-semibold text-[#315BEF] dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
                      <span>{insight.action}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>

                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

      </div>

      {/* ─── 8. RECOMMENDED ACTION PLAN SECTION (FULL WIDTH) ─────────────────── */}
      {activeRecs.length > 0 && (
        <div className="w-full rounded-2xl bg-white dark:bg-[#11172A] border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Target className="w-4 h-4 text-[#315BEF] dark:text-blue-400" />
            <h3 className="text-[16px] font-bold text-[#11182F] dark:text-slate-100">
              Recommended Action Plan
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeRecs.map((rec, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60 flex items-start gap-3.5"
              >
                <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-950 text-[#315BEF] dark:text-blue-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <div className="space-y-1">
                  <h4 className="text-[13px] font-semibold text-[#11182F] dark:text-slate-100">{rec.title}</h4>
                  <p className="text-[12.5px] font-normal leading-[1.5] text-slate-500 dark:text-slate-400">{rec.description}</p>
                  <span className="text-[12px] font-semibold text-[#315BEF] dark:text-blue-400 block pt-0.5">{rec.action} →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
