import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Search,
  Loader2,
  RefreshCw,
  ExternalLink,
  Briefcase,
  Megaphone,
  Eye,
  Mail,
  MapPin,
  Globe,
  Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

export default function AdminBrandsPage() {
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [inspectingBrand, setInspectingBrand] = useState<any | null>(null);
  const limit = 20;

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["/api/admin/brands", search, industryFilter, page],
    queryFn: async () => {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const params = new URLSearchParams({
        search,
        industry: industryFilter,
        limit: String(limit),
        offset: String(page * limit),
      });
      const res = await fetch(`${apiUrl}/api/admin/brands?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load brand workspaces");
      return res.json();
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E5E4DF] dark:border-white/10">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0A0A0A] dark:text-[#F8FAFC]">
            Brand Workspaces &amp; Enterprise Sponsors
          </h1>
          <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] mt-0.5">
            Directory of registered consumer brands, corporate sponsors, campaign counts, and deal
            volume.
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
          Refresh Brands
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#52525B] dark:text-[#A1A1AA]" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search by company name, industry, or email..."
            className="pl-9 h-10 bg-white dark:bg-[#18181E] border-[#E5E4DF] dark:border-white/10 text-xs text-[#0A0A0A] dark:text-[#F8FAFC] placeholder:text-[#52525B] dark:placeholder:text-[#A1A1AA] rounded-lg"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {["all", "Technology", "Beauty & Cosmetics", "Sports & Fitness", "Food & Beverage"].map(
            (ind) => (
              <button
                key={ind}
                onClick={() => {
                  setIndustryFilter(ind);
                  setPage(0);
                }}
                className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                  industryFilter === ind
                    ? "bg-[#6A0D18] text-white border-[#6A0D18]"
                    : "bg-white dark:bg-[#18181E] text-[#52525B] dark:text-[#A1A1AA] border-[#E5E4DF] dark:border-white/10 hover:bg-[#FAF9F6] dark:hover:bg-white/[0.05] hover:text-[#0A0A0A] dark:hover:text-[#F8FAFC]"
                }`}
              >
                {ind === "all" ? "All Industries" : ind}
              </button>
            )
          )}
        </div>
      </div>

      {/* Ledger Table inside Liquid Silver Card */}
      <div className="liquid-silver-card rounded-xl border border-[#6A0D18]/30 dark:border-white/10 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#6A0D18] dark:text-[#E87985]" />
            <p className="text-xs text-[#52525B] dark:text-[#A1A1AA]">
              Querying brand workspaces...
            </p>
          </div>
        ) : !data || data.brands.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Building2 className="w-8 h-8 text-[#52525B] dark:text-[#A1A1AA] mx-auto opacity-40" />
            <p className="text-sm font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
              No brand workspaces found
            </p>
            <p className="text-xs text-[#52525B] dark:text-[#A1A1AA]">
              No brand entities match the current filter or search criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] dark:bg-[#18181E] border-b border-[#E5E4DF] dark:border-white/10 text-[11px] font-bold uppercase tracking-wider text-[#52525B] dark:text-[#A1A1AA]">
                <tr>
                  <th className="py-3.5 px-5">Brand &amp; Contact</th>
                  <th className="py-3.5 px-4">Industry Niche</th>
                  <th className="py-3.5 px-4">Budget Tier</th>
                  <th className="py-3.5 px-4">Campaigns</th>
                  <th className="py-3.5 px-4">Commercial Deals</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E4DF] dark:divide-white/10">
                {data.brands.map((brand: any) => (
                  <tr
                    key={brand.id}
                    className="hover:bg-[#FAF9F6]/70 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#FAF9F6] dark:bg-[#18181E] border border-[#6A0D18]/25 flex items-center justify-center font-bold text-[#6A0D18] dark:text-[#E87985] text-xs">
                          {brand.name?.charAt(0) || "B"}
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                            {brand.name}
                          </p>
                          <p className="text-[11px] text-[#52525B] dark:text-[#A1A1AA] font-mono">
                            {brand.userEmail}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FAF9F6] dark:bg-[#18181E] border border-[#E5E4DF] dark:border-white/10 text-[#0A0A0A] dark:text-[#F8FAFC]">
                        {brand.industry || "General Retail"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                      {brand.monthlyBudget || "Tier 1"}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FAF9F6] dark:bg-[#18181E] border border-[#E5E4DF] dark:border-white/10 text-[#0A0A0A] dark:text-[#F8FAFC]">
                        <Megaphone className="w-3 h-3 text-[#6A0D18] dark:text-[#E87985]" />
                        <span className="font-mono tabular-nums">{brand.campaignCount}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FAF9F6] dark:bg-[#18181E] border border-[#E5E4DF] dark:border-white/10 text-[#0A0A0A] dark:text-[#F8FAFC]">
                        <Briefcase className="w-3 h-3 text-[#6A0D18] dark:text-[#E87985]" />
                        <span className="font-mono tabular-nums">{brand.dealCount}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setInspectingBrand(brand)}
                        className="h-7 px-2 text-[11px] font-semibold border-[#E5E4DF] dark:border-white/10 text-[#0A0A0A] dark:text-[#F8FAFC] hover:bg-white dark:hover:bg-[#18181E] cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1 text-[#6A0D18] dark:text-[#E87985]" />
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.total > limit && (
          <div className="flex items-center justify-between p-4 border-t border-[#E5E4DF] dark:border-white/10 bg-[#FAF9F6] dark:bg-[#18181E]">
            <span className="text-xs text-[#52525B] dark:text-[#A1A1AA]">
              Showing {page * limit + 1}–{Math.min((page + 1) * limit, data.total)} of {data.total}{" "}
              brands
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(p - 1, 0))}
                className="h-8 text-xs bg-white dark:bg-[#121216] border-[#E5E4DF] dark:border-white/10 text-[#0A0A0A] dark:text-[#F8FAFC]"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={(page + 1) * limit >= data.total}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 text-xs bg-white dark:bg-[#121216] border-[#E5E4DF] dark:border-white/10 text-[#0A0A0A] dark:text-[#F8FAFC]"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-Over Inspection Drawer: Silver Liquid Glass */}
      <Sheet
        open={Boolean(inspectingBrand)}
        onOpenChange={(open) => !open && setInspectingBrand(null)}
      >
        <SheetContent className="sm:max-w-md bg-white dark:bg-[#121216] border-l border-[#6A0D18]/30 dark:border-white/10 p-6 overflow-y-auto text-[#0A0A0A] dark:text-[#F8FAFC]">
          <SheetHeader className="pb-4 border-b border-[#E5E4DF] dark:border-white/10">
            <SheetTitle className="text-base font-extrabold flex items-center gap-2 text-[#0A0A0A] dark:text-[#F8FAFC]">
              <Building2 className="w-4 h-4 text-[#6A0D18] dark:text-[#E87985]" />
              Brand Workspace
            </SheetTitle>
            <SheetDescription className="text-xs text-[#52525B] dark:text-[#A1A1AA]">
              ID: #{inspectingBrand?.id}
            </SheetDescription>
          </SheetHeader>

          {inspectingBrand && (
            <div className="space-y-5 py-4 text-xs">
              <div className="p-4 rounded-xl bg-gradient-to-br from-white to-[#FAF9F6] dark:from-[#18181E] dark:to-[#121216] border border-[#6A0D18]/25 dark:border-white/10 space-y-2">
                <p className="text-base font-extrabold text-[#0A0A0A] dark:text-[#F8FAFC]">
                  {inspectingBrand.name}
                </p>
                <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] font-mono flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  {inspectingBrand.userEmail}
                </p>
                <div className="flex items-center gap-2 pt-2 border-t border-[#E5E4DF] dark:border-white/10">
                  <span className="text-[11px] font-semibold text-[#52525B] dark:text-[#A1A1AA]">
                    Industry:{" "}
                    <strong className="text-[#0A0A0A] dark:text-[#F8FAFC]">
                      {inspectingBrand.industry || "General"}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-lg bg-[#FAF9F6] dark:bg-[#18181E] border border-[#E5E4DF] dark:border-white/10 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#52525B] dark:text-[#A1A1AA]">
                    Campaign Briefs
                  </span>
                  <p className="text-lg font-mono font-extrabold text-[#0A0A0A] dark:text-[#F8FAFC] tabular-nums">
                    {inspectingBrand.campaignCount}
                  </p>
                </div>
                <div className="p-3.5 rounded-lg bg-[#FAF9F6] dark:bg-[#18181E] border border-[#E5E4DF] dark:border-white/10 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#52525B] dark:text-[#A1A1AA]">
                    Commercial Deals
                  </span>
                  <p className="text-lg font-mono font-extrabold text-[#6A0D18] dark:text-[#E87985] tabular-nums">
                    {inspectingBrand.dealCount}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#FAF9F6] dark:bg-[#18181E] border border-[#E5E4DF] dark:border-white/10 space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#52525B] dark:text-[#A1A1AA]">
                  Monthly Budget
                </span>
                <p className="font-mono font-bold text-sm text-[#0A0A0A] dark:text-[#F8FAFC]">
                  {inspectingBrand.monthlyBudget || "Tier 1 (< ₹1,00,000)"}
                </p>
              </div>

              {inspectingBrand.website && (
                <div className="p-3 rounded-lg bg-[#FAF9F6] dark:bg-[#18181E] border border-[#E5E4DF] dark:border-white/10 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#52525B] dark:text-[#A1A1AA]">
                    Website
                  </span>
                  <a
                    href={inspectingBrand.website}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-xs text-[#6A0D18] dark:text-[#E87985] hover:underline flex items-center gap-1"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    {inspectingBrand.website}
                  </a>
                </div>
              )}

              <div className="text-[11px] text-[#52525B] dark:text-[#A1A1AA]">
                Registered on {new Date(inspectingBrand.createdAt).toLocaleString()}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
