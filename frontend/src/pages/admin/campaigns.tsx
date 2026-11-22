import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Megaphone,
  Search,
  Loader2,
  RefreshCw,
  PauseCircle,
  PlayCircle,
  CheckCircle2,
  Users,
  Calendar,
  AlertCircle,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAdmin } from "@/contexts/admin-context";

interface CampaignItem {
  id: number;
  brandId: number;
  title: string;
  description: string | null;
  budget: string | null;
  platform: string;
  status: "active" | "paused" | "completed" | "draft";
  deadline: string | null;
  createdAt: string;
  brandName: string | null;
  applicantCount: number;
}

export default function AdminCampaignsPage() {
  const queryClient = useQueryClient();
  const { hasPermission, isSuperAdmin } = useAdmin();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const limit = 20;

  const [selectedCampaign, setSelectedCampaign] = useState<CampaignItem | null>(null);
  const [targetStatus, setTargetStatus] = useState<string>("paused");
  const [reason, setReason] = useState("");

  const canManage = isSuperAdmin || hasPermission("admin.campaigns.manage");

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["/api/admin/campaigns", search, statusFilter, page],
    queryFn: async () => {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        limit: String(limit),
        offset: String(page * limit),
      });
      const res = await fetch(`${apiUrl}/api/admin/campaigns?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load campaigns");
      return res.json();
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({
      campaignId,
      status,
      reason,
    }: {
      campaignId: number;
      status: string;
      reason: string;
    }) => {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${apiUrl}/api/admin/campaigns/${campaignId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status, reason }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update campaign status");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Campaign status updated and logged to audit trail.");
      setSelectedCampaign(null);
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/overview"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to execute status update.");
    },
  });

  const campaigns: CampaignItem[] = data?.campaigns || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50";
      case "paused":
        return "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50";
      case "completed":
        return "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/50";
      default:
        return "bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700";
    }
  };

  const getPlatformBadge = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes("instagram"))
      return "bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-400 border-pink-200 dark:border-pink-800/50";
    if (p.includes("youtube"))
      return "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50";
    if (p.includes("tiktok"))
      return "bg-slate-900 dark:bg-zinc-800 text-white border-slate-700 dark:border-zinc-700";
    if (p.includes("twitter") || p.includes("x"))
      return "bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-400 border-sky-200 dark:border-sky-800/50";
    return "bg-zinc-100 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E5E4DF] dark:border-white/10">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0A0A0A] dark:text-[#F8FAFC]">
            Campaign Briefs &amp; Marketplace Listings
          </h1>
          <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] mt-0.5">
            Audit and moderate brand campaigns, inspect applicant queues, and override campaign
            states.
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
          Refresh Campaigns
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
            placeholder="Search campaigns by title, keywords, or platform..."
            className="pl-9 h-10 bg-white dark:bg-[#18181E] border-[#E5E4DF] dark:border-white/10 text-xs text-[#0A0A0A] dark:text-[#F8FAFC] placeholder:text-[#52525B] dark:placeholder:text-[#A1A1AA] rounded-lg"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All Briefs" },
            { id: "active", label: "Active" },
            { id: "paused", label: "Paused" },
            { id: "completed", label: "Completed" },
            { id: "draft", label: "Draft" },
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
              Querying marketplace campaign registry...
            </p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Megaphone className="w-8 h-8 text-[#52525B] dark:text-[#A1A1AA] mx-auto opacity-40" />
            <p className="text-sm font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
              No campaign briefs found
            </p>
            <p className="text-xs text-[#52525B] dark:text-[#A1A1AA]">
              Try adjusting your search terms or filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] dark:bg-[#18181E] border-b border-[#E5E4DF] dark:border-white/10 text-[11px] font-bold uppercase tracking-wider text-[#52525B] dark:text-[#A1A1AA]">
                <tr>
                  <th className="px-5 py-3.5">Campaign &amp; Platform</th>
                  <th className="px-4 py-3.5">Brand Sponsor</th>
                  <th className="px-4 py-3.5">Budget</th>
                  <th className="px-4 py-3.5">Applicants</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Created</th>
                  <th className="px-5 py-3.5 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E4DF] dark:divide-white/10">
                {campaigns.map((camp) => (
                  <tr
                    key={camp.id}
                    className="hover:bg-[#FAF9F6]/60 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="space-y-1 max-w-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#0A0A0A] dark:text-[#F8FAFC] line-clamp-1">
                            {camp.title}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase ${getPlatformBadge(
                              camp.platform
                            )}`}
                          >
                            {camp.platform}
                          </span>
                        </div>
                        {camp.description && (
                          <p className="text-[11px] text-[#52525B] dark:text-[#A1A1AA] line-clamp-1">
                            {camp.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-[#0A0A0A] dark:text-[#F8FAFC]">
                        {camp.brandName || "Brand #" + camp.brandId}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                        {camp.budget || "Flexible"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FAF9F6] dark:bg-[#18181E] border border-[#E5E4DF] dark:border-white/10 text-[#0A0A0A] dark:text-[#F8FAFC]">
                        <Users className="w-3 h-3 text-[#52525B] dark:text-[#A1A1AA]" />
                        {camp.applicantCount}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-extrabold uppercase border ${getStatusBadge(
                          camp.status
                        )}`}
                      >
                        {camp.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[#52525B] dark:text-[#A1A1AA] whitespace-nowrap">
                      {new Date(camp.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {canManage && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCampaign(camp);
                            setTargetStatus(camp.status === "active" ? "paused" : "active");
                          }}
                          className="h-8 px-2.5 text-xs border-[#E5E4DF] dark:border-white/10 text-[#0A0A0A] dark:text-[#F8FAFC] hover:bg-[#FAF9F6] dark:hover:bg-white/[0.05] cursor-pointer"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 mr-1 text-[#6A0D18] dark:text-[#E87985]" />
                          Override
                        </Button>
                      )}
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
            <strong className="text-[#0A0A0A] dark:text-[#F8FAFC]">{campaigns.length}</strong> of{" "}
            <strong className="text-[#0A0A0A] dark:text-[#F8FAFC]">{total}</strong> briefs
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

      <Dialog open={Boolean(selectedCampaign)} onOpenChange={() => setSelectedCampaign(null)}>
        <DialogContent className="max-w-md bg-white dark:bg-[#121216] border-[#E5E4DF] dark:border-white/10 text-[#0A0A0A] dark:text-[#F8FAFC]">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-[#0A0A0A] dark:text-[#F8FAFC] flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-[#6A0D18] dark:text-[#E87985]" />
              Override Campaign Status
            </DialogTitle>
            <DialogDescription className="text-xs text-[#52525B] dark:text-[#A1A1AA]">
              Modify the operational state of{" "}
              <strong className="text-[#0A0A0A] dark:text-[#F8FAFC]">
                {selectedCampaign?.title}
              </strong>
              . All state changes are immutably logged to the administrative security audit trail.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">Target Status</label>
              <Select value={targetStatus} onValueChange={setTargetStatus}>
                <SelectTrigger className="h-9 bg-white dark:bg-[#18181E] border-[#E5E4DF] dark:border-white/10 text-[#0A0A0A] dark:text-[#F8FAFC] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#18181E] border-[#E5E4DF] dark:border-white/10 text-xs">
                  <SelectItem value="active">Active (Visible in Marketplace)</SelectItem>
                  <SelectItem value="paused">Paused (Halt new applications)</SelectItem>
                  <SelectItem value="completed">Completed (Archived)</SelectItem>
                  <SelectItem value="draft">Draft (Restricted)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                Audit Reason <span className="text-rose-600">*</span>
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Specify the reason for this administrative status change..."
                className="h-20 bg-white dark:bg-[#18181E] border-[#E5E4DF] dark:border-white/10 text-[#0A0A0A] dark:text-[#F8FAFC] text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedCampaign(null)}
              className="text-xs border-[#E5E4DF] dark:border-white/10 bg-white dark:bg-[#18181E] text-[#0A0A0A] dark:text-[#F8FAFC]"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!reason.trim() || statusMutation.isPending}
              onClick={() => {
                if (selectedCampaign) {
                  statusMutation.mutate({
                    campaignId: selectedCampaign.id,
                    status: targetStatus,
                    reason: reason.trim(),
                  });
                }
              }}
              className="text-xs bg-[#6A0D18] hover:bg-[#8B1524] text-white cursor-pointer"
            >
              {statusMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Confirm Status Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
