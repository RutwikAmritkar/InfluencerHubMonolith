import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Inbox,
  Search,
  Loader2,
  RefreshCw,
  Users,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ApplicationItem {
  id: number;
  campaignId: number;
  influencerId: number;
  status: string;
  message: string | null;
  quotedRatePaise: number | null;
  createdAt: string;
  campaignTitle: string | null;
  campaignBudget: string | null;
  campaignPlatform: string | null;
  brandId: number | null;
  brandName: string | null;
  creatorName: string;
  creatorCategory: string;
  creatorFollowers: number;
}

export default function AdminApplicationsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const limit = 20;

  const [inspectApp, setInspectApp] = useState<ApplicationItem | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["/api/admin/applications", search, statusFilter, page],
    queryFn: async () => {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        limit: String(limit),
        offset: String(page * limit),
      });
      const res = await fetch(`${apiUrl}/api/admin/applications?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load applications queue");
      return res.json();
    },
  });

  const applications: ApplicationItem[] = data?.applications || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "accepted":
        return "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50";
      case "rejected":
        return "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/50";
      case "pending":
      default:
        return "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50";
    }
  };

  const formatFollowers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E5E4DF] dark:border-white/10">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0A0A0A] dark:text-[#F8FAFC]">
            Applications &amp; Pitch Queue
          </h1>
          <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] mt-0.5">
            Audit creator proposals, rate quotes, and collaboration applications submitted across
            campaigns.
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
          Refresh Queue
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
            placeholder="Search by campaign title, pitch contents..."
            className="pl-9 h-10 bg-white dark:bg-[#18181E] border-[#E5E4DF] dark:border-white/10 text-xs text-[#0A0A0A] dark:text-[#F8FAFC] placeholder:text-[#52525B] dark:placeholder:text-[#A1A1AA] rounded-lg"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All Applications" },
            { id: "pending", label: "Pending Review" },
            { id: "accepted", label: "Accepted" },
            { id: "rejected", label: "Declined" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setPage(0);
              }}
              className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                statusFilter === tab.id
                  ? "bg-[#6A0D18] text-white border-[#6A0D18]"
                  : "bg-white dark:bg-[#18181E] text-[#52525B] dark:text-[#A1A1AA] border-[#E5E4DF] dark:border-white/10 hover:bg-[#FAF9F6] dark:hover:bg-white/[0.05] hover:text-[#0A0A0A] dark:hover:text-[#F8FAFC]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="liquid-silver-card rounded-xl border border-[#6A0D18]/30 dark:border-white/10 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#6A0D18] dark:text-[#E87985]" />
            <p className="text-xs text-[#52525B] dark:text-[#A1A1AA]">
              Querying application ledger...
            </p>
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Inbox className="w-8 h-8 text-[#52525B] dark:text-[#A1A1AA] mx-auto opacity-40" />
            <p className="text-sm font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
              No applications found
            </p>
            <p className="text-xs text-[#52525B] dark:text-[#A1A1AA]">
              No creator applications match the current filter parameters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] dark:bg-[#18181E] border-b border-[#E5E4DF] dark:border-white/10 text-[11px] font-bold uppercase tracking-wider text-[#52525B] dark:text-[#A1A1AA]">
                <tr>
                  <th className="px-5 py-3.5">Campaign Brief</th>
                  <th className="px-4 py-3.5">Creator Partner</th>
                  <th className="px-4 py-3.5">Quoted Rate</th>
                  <th className="px-4 py-3.5">Pitch Preview</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E4DF] dark:divide-white/10">
                {applications.map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-[#FAF9F6]/60 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="space-y-0.5">
                        <div className="font-bold text-[#0A0A0A] dark:text-[#F8FAFC] line-clamp-1">
                          {app.campaignTitle || "Untitled Campaign"}
                        </div>
                        <div className="text-[11px] text-[#52525B] dark:text-[#A1A1AA]">
                          by {app.brandName || "Brand Sponsor"} • {app.campaignPlatform || "Multi"}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-[#0A0A0A] dark:text-[#F8FAFC]">
                          {app.creatorName}
                        </div>
                        <div className="text-[11px] text-[#52525B] dark:text-[#A1A1AA]">
                          {app.creatorCategory} • {formatFollowers(app.creatorFollowers)} followers
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                      {app.quotedRatePaise
                        ? `₹${Math.round(app.quotedRatePaise / 100).toLocaleString("en-IN")}`
                        : "Market Standard"}
                    </td>
                    <td className="px-4 py-3.5 max-w-xs">
                      <p className="text-[11px] text-[#52525B] dark:text-[#A1A1AA] line-clamp-1 italic">
                        "{app.message || "No pitch statement provided."}"
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-extrabold uppercase border ${getStatusBadge(
                          app.status
                        )}`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[#52525B] dark:text-[#A1A1AA] whitespace-nowrap">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setInspectApp(app)}
                        className="h-8 px-2.5 text-xs border-[#E5E4DF] dark:border-white/10 text-[#0A0A0A] dark:text-[#F8FAFC] hover:bg-[#FAF9F6] dark:hover:bg-white/[0.05] cursor-pointer"
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

        <div className="px-5 py-3.5 bg-[#FAF9F6] dark:bg-[#18181E] border-t border-[#E5E4DF] dark:border-white/10 flex items-center justify-between text-xs text-[#52525B] dark:text-[#A1A1AA]">
          <span>
            Showing{" "}
            <strong className="text-[#0A0A0A] dark:text-[#F8FAFC]">{applications.length}</strong> of{" "}
            <strong className="text-[#0A0A0A] dark:text-[#F8FAFC]">{total}</strong> applications
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="h-8 px-2.5 text-xs border-[#E5E4DF] dark:border-white/10 bg-white dark:bg-[#121216] text-[#0A0A0A] dark:text-[#F8FAFC] cursor-pointer"
            >
              Previous
            </Button>
            <span className="font-semibold text-[#0A0A0A] dark:text-[#F8FAFC]">
              Page {page + 1} of {Math.max(1, totalPages)}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 px-2.5 text-xs border-[#E5E4DF] dark:border-white/10 bg-white dark:bg-[#121216] text-[#0A0A0A] dark:text-[#F8FAFC] cursor-pointer"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={Boolean(inspectApp)} onOpenChange={() => setInspectApp(null)}>
        <DialogContent className="max-w-lg bg-white dark:bg-[#121216] border-[#E5E4DF] dark:border-white/10 text-[#0A0A0A] dark:text-[#F8FAFC]">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-[#0A0A0A] dark:text-[#F8FAFC] flex items-center gap-2">
              <Inbox className="w-4 h-4 text-[#6A0D18] dark:text-[#E87985]" />
              Application Pitch Details
            </DialogTitle>
            <DialogDescription className="text-xs text-[#52525B] dark:text-[#A1A1AA]">
              Creator application submitted for{" "}
              <strong className="text-[#0A0A0A] dark:text-[#F8FAFC]">
                {inspectApp?.campaignTitle}
              </strong>
            </DialogDescription>
          </DialogHeader>

          {inspectApp && (
            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-[#FAF9F6] dark:bg-[#18181E] border border-[#E5E4DF] dark:border-white/10">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#52525B] dark:text-[#A1A1AA]">
                    Creator
                  </span>
                  <p className="font-bold text-[#0A0A0A] dark:text-[#F8FAFC] mt-0.5">
                    {inspectApp.creatorName}
                  </p>
                  <p className="text-[11px] text-[#52525B] dark:text-[#A1A1AA]">
                    {inspectApp.creatorCategory} • {formatFollowers(inspectApp.creatorFollowers)}{" "}
                    followers
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#52525B] dark:text-[#A1A1AA]">
                    Brand Sponsor
                  </span>
                  <p className="font-bold text-[#0A0A0A] dark:text-[#F8FAFC] mt-0.5">
                    {inspectApp.brandName || "Brand #" + inspectApp.brandId}
                  </p>
                  <p className="text-[11px] text-[#52525B] dark:text-[#A1A1AA]">
                    Platform: {inspectApp.campaignPlatform || "All"}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#52525B] dark:text-[#A1A1AA]">
                    Quoted Rate
                  </span>
                  <p className="font-bold font-mono text-[#6A0D18] dark:text-[#E87985] text-sm mt-0.5">
                    {inspectApp.quotedRatePaise
                      ? `₹${Math.round(inspectApp.quotedRatePaise / 100).toLocaleString("en-IN")}`
                      : "Market Standard"}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#52525B] dark:text-[#A1A1AA]">
                    Status
                  </span>
                  <p className="mt-0.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${getStatusBadge(
                        inspectApp.status
                      )}`}
                    >
                      {inspectApp.status}
                    </span>
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                  Creator Pitch Statement
                </label>
                <div className="p-3 bg-[#FAF9F6] dark:bg-[#18181E] border border-[#E5E4DF] dark:border-white/10 rounded-lg text-xs leading-relaxed text-[#0A0A0A] dark:text-[#F8FAFC]">
                  {inspectApp.message || "No pitch text was provided with this application."}
                </div>
              </div>

              <div className="text-[11px] text-[#52525B] dark:text-[#A1A1AA]">
                Submitted on {new Date(inspectApp.createdAt).toLocaleString()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
