import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Search,
  Filter,
  ShieldCheck,
  Clock,
  Eye,
  Loader2,
  RefreshCw,
  Code2,
  User,
  Activity,
  Fingerprint,
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

export default function AdminAuditLogsPage() {
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(0);
  const limit = 25;

  const [inspectingLog, setInspectingLog] = useState<any | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["/api/admin/audit-logs", actionFilter, page],
    queryFn: async () => {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const params = new URLSearchParams({
        action: actionFilter,
        limit: String(limit),
        offset: String(page * limit),
      });
      const res = await fetch(`${apiUrl}/api/admin/audit-logs?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch audit logs");
      return res.json();
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E5E4DF] dark:border-white/10">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0A0A0A] dark:text-[#F8FAFC]">
            Immutable Security Audit Logs
          </h1>
          <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] mt-0.5">
            Cryptographically sealed and tamper-resistant audit records of all administrative
            actions, interventions, and policy changes.
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
          Refresh Logs
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: "", label: "All Audit Actions" },
          { id: "USER_SUSPENDED", label: "Suspensions" },
          { id: "USER_REACTIVATED", label: "Reactivations" },
          { id: "CREATOR_VERIFIED", label: "Verifications" },
          { id: "CAMPAIGN_STATUS_UPDATED", label: "Campaign Overrides" },
          { id: "DEAL_INTERVENTION", label: "Deal Interventions" },
          { id: "PLATFORM_SETTINGS_UPDATED", label: "Settings Changes" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActionFilter(tab.id);
              setPage(0);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
              actionFilter === tab.id
                ? "bg-[#6A0D18] text-white border-[#6A0D18]"
                : "bg-white dark:bg-[#18181E] text-[#52525B] dark:text-[#A1A1AA] border-[#E5E4DF] dark:border-white/10 hover:bg-[#FAF9F6] dark:hover:bg-white/[0.05] hover:text-[#0A0A0A] dark:hover:text-[#F8FAFC]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Ledger Table inside Liquid Silver Card */}
      <div className="liquid-silver-card rounded-xl border border-[#6A0D18]/30 dark:border-white/10 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#6A0D18] dark:text-[#E87985]" />
            <p className="text-xs text-[#52525B] dark:text-[#A1A1AA]">
              Querying immutable security audit logs...
            </p>
          </div>
        ) : !data || data.logs.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <FileText className="w-8 h-8 text-[#52525B] dark:text-[#A1A1AA] mx-auto opacity-40" />
            <p className="text-sm font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
              No audit logs recorded
            </p>
            <p className="text-xs text-[#52525B] dark:text-[#A1A1AA]">
              No administrative events match the selected action filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] dark:bg-[#18181E] border-b border-[#E5E4DF] dark:border-white/10 text-[11px] font-bold uppercase tracking-wider text-[#52525B] dark:text-[#A1A1AA]">
                <tr>
                  <th className="py-3.5 px-5">Administrative Action</th>
                  <th className="py-3.5 px-4">Operator</th>
                  <th className="py-3.5 px-4">Target Entity</th>
                  <th className="py-3.5 px-4">Audit Rationale</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-5 text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E4DF] dark:divide-white/10">
                {data.logs.map((log: any) => (
                  <tr
                    key={log.id}
                    className="hover:bg-[#FAF9F6]/70 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="py-3.5 px-5">
                      <span className="font-mono font-bold text-[11px] text-[#0A0A0A] dark:text-[#F8FAFC] bg-[#FAF9F6] dark:bg-[#18181E] px-2 py-0.5 rounded border border-[#E5E4DF] dark:border-white/10">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <p className="font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                          {log.adminName || "Operator"}
                        </p>
                        <p className="text-[11px] text-[#52525B] dark:text-[#A1A1AA] font-mono">
                          {log.adminEmail}
                        </p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#52525B] dark:text-[#A1A1AA]">
                      <span className="capitalize font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                        {log.targetEntityType}
                      </span>{" "}
                      #{log.targetEntityId}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-[11px] text-[#52525B] dark:text-[#A1A1AA] italic">
                      "{log.reason}"
                    </td>
                    <td className="py-3.5 px-4 text-[#52525B] dark:text-[#A1A1AA] font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setInspectingLog(log)}
                        className="h-7 px-2 text-[11px] font-semibold border-[#E5E4DF] dark:border-white/10 text-[#0A0A0A] dark:text-[#F8FAFC] hover:bg-white dark:hover:bg-[#18181E] cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1 text-[#6A0D18] dark:text-[#E87985]" />
                        Diff
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
              records
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

      {/* Slide-Over Inspection Drawer: Silver Liquid Glass with Before/After Diff */}
      <Sheet open={Boolean(inspectingLog)} onOpenChange={(open) => !open && setInspectingLog(null)}>
        <SheetContent className="sm:max-w-md bg-white dark:bg-[#121216] border-l border-[#6A0D18]/30 dark:border-white/10 p-6 overflow-y-auto text-[#0A0A0A] dark:text-[#F8FAFC]">
          <SheetHeader className="pb-4 border-b border-[#E5E4DF] dark:border-white/10">
            <SheetTitle className="text-base font-extrabold flex items-center gap-2 text-[#0A0A0A] dark:text-[#F8FAFC]">
              <FileText className="w-4 h-4 text-[#6A0D18] dark:text-[#E87985]" />
              Audit Event #{inspectingLog?.id}
            </SheetTitle>
            <SheetDescription className="text-xs text-[#52525B] dark:text-[#A1A1AA]">
              {inspectingLog?.action}
            </SheetDescription>
          </SheetHeader>

          {inspectingLog && (
            <div className="space-y-5 py-4 text-xs">
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-white to-[#FAF9F6] dark:from-[#18181E] dark:to-[#121216] border border-[#6A0D18]/25 dark:border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#52525B] dark:text-[#A1A1AA]">
                    Authorized Operator
                  </span>
                  <span className="text-[11px] font-mono text-[#52525B] dark:text-[#A1A1AA]">
                    {new Date(inspectingLog.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                  {inspectingLog.adminName || "Operator"}
                </p>
                <p className="font-mono text-[11px] text-[#52525B] dark:text-[#A1A1AA]">
                  {inspectingLog.adminEmail}
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-[#FAF9F6] dark:bg-[#18181E] border border-[#E5E4DF] dark:border-white/10 space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#52525B] dark:text-[#A1A1AA]">
                  Compliance Justification
                </span>
                <p className="text-xs text-[#0A0A0A] dark:text-[#F8FAFC] leading-relaxed italic">
                  "{inspectingLog.reason}"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-[#FAF9F6] dark:bg-[#18181E] border border-[#E5E4DF] dark:border-white/10">
                  <span className="text-[10px] text-[#52525B] dark:text-[#A1A1AA] block">
                    Target Entity
                  </span>
                  <span className="font-mono font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                    {inspectingLog.targetEntityType} #{inspectingLog.targetEntityId}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[#FAF9F6] dark:bg-[#18181E] border border-[#E5E4DF] dark:border-white/10">
                  <span className="text-[10px] text-[#52525B] dark:text-[#A1A1AA] block">
                    Network IP
                  </span>
                  <span className="font-mono text-[#0A0A0A] dark:text-[#F8FAFC] text-[11px]">
                    {inspectingLog.ipAddress || "Internal System"}
                  </span>
                </div>
              </div>

              {/* Before State Payload */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-[#52525B] dark:text-[#A1A1AA]">
                  Before State Payload
                </span>
                <pre className="p-3 bg-[#FAF9F6] dark:bg-[#18181E] border border-[#E5E4DF] dark:border-white/10 rounded-lg font-mono text-[11px] overflow-x-auto text-[#0A0A0A] dark:text-[#F8FAFC]">
                  {JSON.stringify(inspectingLog.beforeState || {}, null, 2)}
                </pre>
              </div>

              {/* After State Payload */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-[#52525B] dark:text-[#A1A1AA]">
                  After State Payload
                </span>
                <pre className="p-3 bg-[#FAF9F6] dark:bg-[#18181E] border border-[#E5E4DF] dark:border-white/10 rounded-lg font-mono text-[11px] overflow-x-auto text-[#0A0A0A] dark:text-[#F8FAFC]">
                  {JSON.stringify(inspectingLog.afterState || {}, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
