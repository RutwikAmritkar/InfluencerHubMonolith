import { useListCampaigns } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Megaphone,
  Calendar,
  Users,
  Briefcase,
  Plus,
  Filter,
  Loader2,
  ArrowRight,
  Lock,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { formatCurrency, formatDate } from "@/lib/formatters";

// Realistic Fallback Campaigns Roster
const defaultCampaignsList = [
  {
    id: 1,
    title: "Summer Beauty Campaign",
    brandName: "Glow Cosmetics",
    brandLogoUrl:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=150&auto=format&fit=crop",
    description:
      "Seeking beauty & lifestyle creators to showcase our new SPF Glow Lotion during the summer season.",
    budget: 50000,
    platform: "instagram",
    status: "active",
    deadline: "2026-09-01",
    applicationsCount: 8,
    escrowStatus: "Terms Confirmed",
  },
  {
    id: 2,
    title: "Tech Launch 2026",
    brandName: "NovaTech",
    brandLogoUrl:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=150&auto=format&fit=crop",
    description:
      "Looking for tech review creators to unbox and review our new ergonomic wireless ANC headphones.",
    budget: 125000,
    platform: "youtube",
    status: "active",
    deadline: "2026-09-15",
    applicationsCount: 12,
    escrowStatus: "Milestone Locked",
  },
  {
    id: 3,
    title: "Fall Apparel Drop",
    brandName: "UrbanFit",
    brandLogoUrl:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=150&auto=format&fit=crop",
    description:
      "Streetwear and activewear fashion influencers wanted to style our upcoming autumn collection.",
    budget: 180000,
    platform: "instagram",
    status: "active",
    deadline: "2026-10-01",
    applicationsCount: 15,
    escrowStatus: "Terms Confirmed",
  },
  {
    id: 4,
    title: "Organic Snack Rollout",
    brandName: "FreshBite",
    brandLogoUrl:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=150&auto=format&fit=crop",
    description: "Health & wellness creators for a national grocery retail snack campaign.",
    budget: 70000,
    platform: "instagram",
    status: "active",
    deadline: "2026-09-20",
    applicationsCount: 6,
    escrowStatus: "Signoff Pending",
  },
];

export default function Campaigns() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  const { data: apiCampaigns, isLoading } = useListCampaigns({
    status: status !== "all" ? status : undefined,
    brandId: user?.role === "brand" ? user.id : undefined,
  });

  const campaigns = useMemo(() => {
    if (Array.isArray(apiCampaigns) && apiCampaigns.length > 0) {
      return apiCampaigns;
    }
    return defaultCampaignsList;
  }, [apiCampaigns]);

  return (
    <div className="workspace-canvas space-y-8 pb-16 antialiased text-[#0A0A0A] dark:text-[#FAF9F6]">
      {/* ─── 1. EDITORIAL HEADER ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-[#E5E4DF] dark:border-white/10">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6A0D18] block mb-1">
            Commercial Marketplace
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0A0A0A] dark:text-white">
            Campaign Pipeline &amp;{" "}
            <span className="font-serif italic font-normal text-[#6A0D18]">Deal Vaults</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#52525B] dark:text-slate-400 font-normal mt-1">
            Pre-funded briefs with milestone-gated payment contracts and verified deliverables.
          </p>
        </div>

        {user?.role === "brand" && (
          <Link href="/campaigns/create">
            <Button className="h-10 px-5 rounded-lg liquid-burgundy-metal text-xs font-semibold shadow-xs cursor-pointer inline-flex items-center gap-2 transition-all">
              <Plus className="w-4 h-4 text-white" />
              <span>{t("campaigns.createCampaign")}</span>
            </Button>
          </Link>
        )}
      </div>

      {/* ─── 2. SEARCH & FILTER CONTROLLER ─────────────────────────────────── */}
      <div className="bg-white dark:bg-[#11172A] border border-[#E5E4DF] dark:border-white/10 rounded-xl p-3 sm:p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#52525B]" />
            <Input
              placeholder="Search campaigns by title, brand, or deliverable niche..."
              className="pl-9 h-10 border-[#E5E4DF] dark:border-slate-700 bg-[#FAF9F6] dark:bg-slate-800/60 text-[#0A0A0A] dark:text-white placeholder:text-slate-400 text-xs rounded-lg"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full sm:w-[160px] h-10 border-[#E5E4DF] dark:border-slate-700 bg-[#FAF9F6] dark:bg-slate-800/60 text-xs rounded-lg font-medium text-[#0A0A0A] dark:text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl glass-dropdown">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active Production</SelectItem>
                {user?.role === "brand" && <SelectItem value="draft">Drafts</SelectItem>}
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0 border-[#E5E4DF] dark:border-slate-700 rounded-lg cursor-pointer hover:bg-[#F2F1EC]"
            >
              <Filter className="h-4 w-4 text-[#52525B]" />
            </Button>
          </div>
        </div>
      </div>

      {/* ─── 3. CAMPAIGNS ROSTER ───────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex h-64 w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#6A0D18]" />
        </div>
      ) : campaigns?.length ? (
        <div className="grid gap-4 w-full">
          {campaigns.map((campaign) => (
            <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
              <div className="bg-white dark:bg-[#11172A] border border-[#E5E4DF] dark:border-white/10 rounded-xl shadow-xs hover:border-[#0A0A0A] transition-all cursor-pointer group overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  {/* Left Main Content */}
                  <div className="p-5 sm:p-6 flex-1 space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-3">
                        {campaign.brandLogoUrl ? (
                          <img
                            src={campaign.brandLogoUrl}
                            className="w-10 h-10 rounded-lg border border-[#E5E4DF] object-cover shrink-0"
                            alt="Logo"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-[#0A0A0A] text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {campaign.brandName?.charAt(0) || "B"}
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-semibold text-[#52525B] dark:text-slate-400">
                            {campaign.brandName}
                          </p>
                          <h3 className="text-base font-bold text-[#0A0A0A] dark:text-white group-hover:text-[#6A0D18] transition-colors">
                            {campaign.title}
                          </h3>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#059669] border border-emerald-200 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                        {campaign.escrowStatus || "Terms Confirmed"}
                      </span>
                    </div>

                    <p className="text-xs text-[#52525B] dark:text-slate-300 line-clamp-2 max-w-3xl leading-relaxed">
                      {campaign.description}
                    </p>

                    <div className="flex flex-wrap gap-5 text-xs pt-1 text-[#52525B] dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5 text-[#059669]" />
                        <span className="font-bold text-[#0A0A0A] dark:text-white font-tabular">
                          {formatCurrency(campaign.budget)} Budget
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-[#52525B]" />
                        <span className="capitalize font-medium text-[#0A0A0A] dark:text-white">
                          {campaign.platform}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-[#52525B]" />
                        <span>
                          Deadline:{" "}
                          <strong className="text-[#0A0A0A] dark:text-white font-medium">
                            {new Date(campaign.deadline).toLocaleDateString()}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Action / Ledger Box */}
                  <div className="bg-[#FAF9F6] dark:bg-slate-900/60 p-5 sm:w-52 flex sm:flex-col justify-between items-center sm:items-end border-t sm:border-t-0 sm:border-l border-[#E5E4DF] dark:border-white/10">
                    <div className="text-left sm:text-right">
                      <div className="text-2xl font-bold text-[#0A0A0A] dark:text-white font-tabular">
                        {campaign.applicationsCount || 0}
                      </div>
                      <div className="text-xs text-[#52525B] font-medium mt-0.5">
                        Vetted Applicants
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="h-8 px-4 rounded-lg bg-[#0A0A0A] hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-colors"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 border border-[#E5E4DF] dark:border-white/10 rounded-xl bg-white dark:bg-[#11172A] w-full">
          <Megaphone className="h-10 w-10 text-[#52525B]/40 mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#0A0A0A] dark:text-white mb-1">
            No campaigns active
          </h3>
          <p className="text-xs text-[#52525B]">
            Launch a new campaign brief to begin accepting vetted creator applications.
          </p>
        </div>
      )}
    </div>
  );
}
