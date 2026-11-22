import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAdmin } from "@/contexts/admin-context";

export default function AdminReportsPage() {
  const queryClient = useQueryClient();
  const { hasPermission, isSuperAdmin } = useAdmin();
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const limit = 20;

  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [status, setStatus] = useState<string>("resolved");
  const [resolutionNotes, setResolutionNotes] = useState("");

  const canResolve = isSuperAdmin || hasPermission("admin.reports.resolve");

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["/api/admin/reports", statusFilter, page],
    queryFn: async () => {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const params = new URLSearchParams({
        status: statusFilter,
        limit: String(limit),
        offset: String(page * limit),
      });
      const res = await fetch(`${apiUrl}/api/admin/reports?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch moderation reports");
      return res.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async ({
      reportId,
      status,
      resolutionNotes,
    }: {
      reportId: number;
      status: string;
      resolutionNotes: string;
    }) => {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${apiUrl}/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status, resolutionNotes }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update report");
      }
      return data;
    },
    onSuccess: () => {
      toast.success("Moderation report updated and resolution recorded.");
      setSelectedReport(null);
      setResolutionNotes("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/overview"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update report.");
    },
  });

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) {
      toast.error("Resolution notes are required for administrative documentation.");
      return;
    }
    mutation.mutate({
      reportId: selectedReport.id,
      status,
      resolutionNotes: resolutionNotes.trim(),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E5E4DF] dark:border-white/10">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0A0A0A] dark:text-[#F8FAFC]">
            Moderation & Platform Dispute Queue
          </h1>
          <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] mt-0.5">
            Investigate contract breaches, abusive behaviors, fraudulent claims, and disputed
            milestone submissions.
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
          Refresh Reports
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: "all", label: "All Tickets" },
          { id: "open", label: "Open / Pending" },
          { id: "investigating", label: "In Investigation" },
          { id: "resolved", label: "Resolved" },
          { id: "dismissed", label: "Dismissed" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setStatusFilter(tab.id);
              setPage(0);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
              statusFilter === tab.id
                ? "bg-[#6A0D18] text-white border-[#6A0D18]"
                : "bg-white dark:bg-[#18181E] text-[#52525B] dark:text-[#A1A1AA] border-[#E5E4DF] dark:border-white/10 hover:bg-[#FAF9F6] dark:hover:bg-white/[0.05] hover:text-[#0A0A0A] dark:hover:text-[#F8FAFC]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="liquid-silver-card rounded-xl border border-[#6A0D18]/30 dark:border-white/10 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#6A0D18] dark:text-[#E87985] mx-auto mb-2" />
            <p className="text-xs text-[#52525B] dark:text-[#A1A1AA]">
              Loading moderation reports...
            </p>
          </div>
        ) : !data?.reports || data.reports.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#52525B] dark:text-[#A1A1AA]">
            No moderation reports found in this status.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] dark:bg-[#18181E] border-b border-[#E5E4DF] dark:border-white/10 text-[#52525B] dark:text-[#A1A1AA] uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Reporter</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E4DF] dark:divide-white/10">
                {data.reports.map((report: any) => (
                  <tr
                    key={report.id}
                    className="hover:bg-[#FAF9F6]/60 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                      #{report.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[11px] capitalize text-[#0A0A0A] dark:text-[#F8FAFC]">
                        {report.category?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5 truncate max-w-[140px]">
                        <p className="font-bold text-xs truncate text-[#0A0A0A] dark:text-[#F8FAFC]">
                          {report.reporterName || "User"}
                        </p>
                        <p className="text-[10px] text-[#52525B] dark:text-[#A1A1AA] font-mono truncate">
                          {report.reporterEmail}
                        </p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#52525B] dark:text-[#A1A1AA] font-mono text-[11px]">
                      {report.targetType}: {report.targetId}
                    </td>
                    <td
                      className="py-3.5 px-4 text-[#52525B] dark:text-[#A1A1AA] text-xs max-w-[220px] truncate"
                      title={report.description}
                    >
                      {report.description}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          report.status === "open"
                            ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50"
                            : report.status === "investigating"
                              ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50"
                              : report.status === "resolved"
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50"
                                : "bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"
                        }`}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!canResolve}
                        onClick={() => {
                          setSelectedReport(report);
                          setStatus(report.status === "open" ? "investigating" : "resolved");
                          setResolutionNotes(report.resolutionNotes || "");
                        }}
                        className="h-7 text-[11px] font-semibold text-[#0A0A0A] dark:text-[#F8FAFC] border-[#E5E4DF] dark:border-white/10 hover:bg-[#FAF9F6] dark:hover:bg-white/[0.05] cursor-pointer"
                      >
                        Resolve
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
              reports
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

      <Dialog
        open={Boolean(selectedReport)}
        onOpenChange={(open) => !open && setSelectedReport(null)}
      >
        <DialogContent className="sm:max-w-md bg-white dark:bg-[#121216] border border-[#E5E4DF] dark:border-white/10 p-6 rounded-xl shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-[#0A0A0A] dark:text-[#F8FAFC] flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#6A0D18] dark:text-[#E87985]" />
              Manage Report #{selectedReport?.id}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#52525B] dark:text-[#A1A1AA] pt-1">
              Category:{" "}
              <span className="font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                {selectedReport?.category}
              </span>{" "}
              • Reported by {selectedReport?.reporterEmail}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleResolveSubmit} className="space-y-4 pt-2">
            <div className="p-3 bg-[#FAF9F6] dark:bg-[#18181E] border border-[#E5E4DF] dark:border-white/10 rounded-lg text-xs space-y-1">
              <p className="font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">Report Description:</p>
              <p className="text-[#52525B] dark:text-[#A1A1AA]">{selectedReport?.description}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0A0A0A] dark:text-[#F8FAFC] block">
                Update Status
              </label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-9 text-xs border-[#E5E4DF] dark:border-white/10 bg-white dark:bg-[#18181E] text-[#0A0A0A] dark:text-[#F8FAFC]">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#18181E] border-[#E5E4DF] dark:border-white/10 text-xs">
                  <SelectItem value="investigating">
                    In Investigation (Hold active payouts)
                  </SelectItem>
                  <SelectItem value="resolved">Resolved (Action taken / completed)</SelectItem>
                  <SelectItem value="dismissed">Dismissed (No violation found)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="notes"
                className="text-xs font-bold text-[#0A0A0A] dark:text-[#F8FAFC] block"
              >
                Resolution Summary & Internal Notes <span className="text-rose-600">*</span>
              </label>
              <Textarea
                id="notes"
                required
                rows={3}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Explain the investigative outcome, actions taken, or reason for dismissal..."
                className="text-xs border-[#E5E4DF] dark:border-white/10 bg-white dark:bg-[#18181E] text-[#0A0A0A] dark:text-[#F8FAFC] focus-visible:ring-[#6A0D18]"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedReport(null)}
                className="text-xs h-9 border-[#E5E4DF] dark:border-white/10 bg-white dark:bg-[#18181E] text-[#0A0A0A] dark:text-[#F8FAFC]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending || !resolutionNotes.trim()}
                className="text-xs h-9 font-semibold bg-[#6A0D18] hover:bg-[#8B1524] text-white cursor-pointer"
              >
                {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Save Resolution
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
