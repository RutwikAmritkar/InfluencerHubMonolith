import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  Users,
  Building2,
  PieChart,
  BarChart3,
  Loader2,
  RefreshCw,
  Layers,
  Sparkles,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface CategoryStat {
  category: string;
  count: number;
}

interface DealStatusStat {
  status: string;
  count: number;
}

interface PlatformStat {
  platform: string;
  count: number;
}

interface AnalyticsData {
  creatorCategories: CategoryStat[];
  dealStatuses: DealStatusStat[];
  campaignPlatforms: PlatformStat[];
  audienceRatio: {
    creators: number;
    brands: number;
  };
}

export default function AdminAnalyticsPage() {
  const { data, isLoading, refetch, isRefetching } = useQuery<AnalyticsData>({
    queryKey: ["/api/admin/analytics"],
    queryFn: async () => {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${apiUrl}/api/admin/analytics`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load platform analytics");
      return res.json();
    },
  });

  const categories = data?.creatorCategories || [];
  const dealStatuses = data?.dealStatuses || [];
  const platforms = data?.campaignPlatforms || [];
  const audience = data?.audienceRatio || { creators: 0, brands: 0 };

  const totalAudience = audience.creators + audience.brands;
  const creatorPercentage =
    totalAudience > 0 ? Math.round((audience.creators / totalAudience) * 100) : 0;
  const brandPercentage = totalAudience > 0 ? 100 - creatorPercentage : 0;

  const totalCategoryCreators = categories.reduce((acc, c) => acc + c.count, 0);
  const totalDeals = dealStatuses.reduce((acc, s) => acc + s.count, 0);
  const totalCampaigns = platforms.reduce((acc, p) => acc + p.count, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E5E4DF] dark:border-white/10">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0A0A0A] dark:text-[#F8FAFC]">
            Platform Analytics &amp; Demographics
          </h1>
          <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] mt-0.5">
            Aggregated telemetry on audience composition, niche saturation, deal progression, and
            social platform affinity.
          </p>
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
          Refresh Telemetry
        </Button>
      </div>

      {isLoading ? (
        <div className="bg-white dark:bg-[#121216] rounded-xl border border-[#E5E4DF] dark:border-white/10 p-16 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#6A0D18] dark:text-[#E87985]" />
          <p className="text-xs text-[#52525B] dark:text-[#A1A1AA]">
            Computing real-time cross-table aggregations...
          </p>
        </div>
      ) : (
        <>
          <div className="liquid-silver-card p-6 rounded-xl border border-[#6A0D18]/30 dark:border-white/10 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#0A0A0A] dark:text-[#F8FAFC] flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#6A0D18] dark:text-[#E87985]" />
                  Marketplace Participant Ratio
                </h2>
                <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] mt-0.5">
                  Proportion of registered talent vs demand-side brand workspace accounts
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-[#52525B] dark:text-[#A1A1AA]">
                {totalAudience.toLocaleString()} total accounts
              </span>
            </div>

            <div className="space-y-2">
              <div className="h-4 w-full bg-[#FAF9F6] dark:bg-white/10 border border-[#E5E4DF] dark:border-white/10 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${creatorPercentage}%` }}
                  className="bg-[#6A0D18] h-full transition-all duration-500"
                  title={`Creators: ${creatorPercentage}%`}
                />
                <div
                  style={{ width: `${brandPercentage}%` }}
                  className="bg-[#0A0A0A] dark:bg-[#FAF9F6] h-full transition-all duration-500"
                  title={`Brands: ${brandPercentage}%`}
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-[#6A0D18]" />
                  <span className="font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                    Creators: {audience.creators.toLocaleString()} ({creatorPercentage}%)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-[#0A0A0A] dark:bg-[#FAF9F6]" />
                  <span className="font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                    Brands: {audience.brands.toLocaleString()} ({brandPercentage}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="liquid-silver-card p-5 rounded-xl border border-[#6A0D18]/30 dark:border-white/10 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-[#0A0A0A] dark:text-[#F8FAFC] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#6A0D18] dark:text-[#E87985]" />
                  Creator Niche Distribution
                </h3>
                <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] mt-0.5">
                  Breakdown of verified creator talent across content categories
                </p>
              </div>

              {categories.length === 0 ? (
                <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] py-6 text-center">
                  No categories registered.
                </p>
              ) : (
                <div className="space-y-3">
                  {categories.map((cat) => {
                    const pct =
                      totalCategoryCreators > 0
                        ? Math.round((cat.count / totalCategoryCreators) * 100)
                        : 0;
                    return (
                      <div key={cat.category} className="space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#0A0A0A] dark:text-[#F8FAFC]">
                            {cat.category || "General / Lifestyle"}
                          </span>
                          <span className="font-mono text-[#52525B] dark:text-[#A1A1AA]">
                            <strong className="text-[#0A0A0A] dark:text-[#F8FAFC]">
                              {cat.count}
                            </strong>{" "}
                            ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 w-full bg-[#FAF9F6] dark:bg-white/10 border border-[#E5E4DF] dark:border-white/10 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className="bg-[#6A0D18] h-full rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="liquid-silver-card p-5 rounded-xl border border-[#6A0D18]/30 dark:border-white/10 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-[#0A0A0A] dark:text-[#F8FAFC] flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#6A0D18] dark:text-[#E87985]" />
                  Commercial Agreement Cohorts
                </h3>
                <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] mt-0.5">
                  Deal distribution across negotiation, confirmation, and settlement states
                </p>
              </div>

              {dealStatuses.length === 0 ? (
                <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] py-6 text-center">
                  No deals recorded.
                </p>
              ) : (
                <div className="space-y-3">
                  {dealStatuses.map((ds) => {
                    const pct = totalDeals > 0 ? Math.round((ds.count / totalDeals) * 100) : 0;
                    return (
                      <div key={ds.status} className="space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#0A0A0A] dark:text-[#F8FAFC] uppercase tracking-wide">
                            {ds.status}
                          </span>
                          <span className="font-mono text-[#52525B] dark:text-[#A1A1AA]">
                            <strong className="text-[#0A0A0A] dark:text-[#F8FAFC]">
                              {ds.count}
                            </strong>{" "}
                            ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 w-full bg-[#FAF9F6] dark:bg-white/10 border border-[#E5E4DF] dark:border-white/10 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className="bg-emerald-600 h-full rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="liquid-silver-card p-5 rounded-xl border border-[#6A0D18]/30 dark:border-white/10 shadow-xs space-y-4 lg:col-span-2">
              <div>
                <h3 className="text-sm font-extrabold text-[#0A0A0A] dark:text-[#F8FAFC] flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-[#6A0D18] dark:text-[#E87985]" />
                  Campaign Platforms Demand
                </h3>
                <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] mt-0.5">
                  Target media platforms specified by brand sponsors in published briefs
                </p>
              </div>

              {platforms.length === 0 ? (
                <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] py-6 text-center">
                  No platform data available.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {platforms.map((p) => {
                    const pct =
                      totalCampaigns > 0 ? Math.round((p.count / totalCampaigns) * 100) : 0;
                    return (
                      <div
                        key={p.platform}
                        className="p-4 rounded-lg bg-[#FAF9F6] dark:bg-[#18181E] border border-[#E5E4DF] dark:border-white/10 space-y-1"
                      >
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#52525B] dark:text-[#A1A1AA]">
                          {p.platform}
                        </span>
                        <p className="text-xl font-extrabold font-mono text-[#0A0A0A] dark:text-[#F8FAFC]">
                          {p.count}
                        </p>
                        <p className="text-[10px] text-[#52525B] dark:text-[#A1A1AA]">
                          {pct}% of campaign briefs
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
