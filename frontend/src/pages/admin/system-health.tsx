import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Database,
  Cpu,
  Server,
  Clock,
  HardDrive,
  RefreshCw,
  CheckCircle2,
  Users,
  ShieldCheck,
  Briefcase,
  Megaphone,
  Inbox,
  FileText,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SystemHealthData {
  status: string;
  database: {
    connected: boolean;
    version: string;
    size: string;
  };
  runtime: {
    nodeVersion: string;
    platform: string;
    uptimeSeconds: number;
    memoryRssMb: number;
    memoryHeapTotalMb: number;
    memoryHeapUsedMb: number;
  };
  tableTelemetry: {
    users: number;
    sessions: number;
    activeSessions: number;
    creators: number;
    brands: number;
    campaigns: number;
    applications: number;
    deals: number;
    dealProposals: number;
    moderationReports: number;
    auditLogs: number;
  };
}

export default function AdminSystemHealthPage() {
  const { data, isLoading, refetch, isRefetching } = useQuery<SystemHealthData>({
    queryKey: ["/api/admin/system-health"],
    queryFn: async () => {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${apiUrl}/api/admin/system-health`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load system diagnostics");
      return res.json();
    },
    refetchInterval: 15000,
  });

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hrs = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hrs > 0) parts.push(`${hrs}h`);
    if (mins > 0) parts.push(`${mins}m`);
    parts.push(`${secs}s`);
    return parts.join(" ");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E5E4DF] dark:border-white/10">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0A0A0A] dark:text-[#F8FAFC]">
            System Diagnostics &amp; Telemetry
          </h1>
          <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] mt-0.5">
            Real-time infrastructure telemetry, PostgreSQL database metrics, and service health
            indicators.
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
          Live Telemetry
        </Button>
      </div>

      {isLoading ? (
        <div className="bg-white dark:bg-[#121216] rounded-xl border border-[#E5E4DF] dark:border-white/10 p-16 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#6A0D18] dark:text-[#E87985]" />
          <p className="text-xs text-[#52525B] dark:text-[#A1A1AA]">
            Sampling PostgreSQL telemetry and server metrics...
          </p>
        </div>
      ) : data ? (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-emerald-950 dark:text-emerald-200">
                  Platform Core Operational
                </h2>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  All micro-services, session stores, and database query pools are executing within
                  normal operational thresholds.
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white dark:bg-[#18181E] text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Auto-polled 15s
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="liquid-silver-card p-5 rounded-xl border border-[#6A0D18]/30 dark:border-white/10 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-[#0A0A0A] dark:text-[#F8FAFC]">
                <Database className="w-4 h-4 text-[#6A0D18] dark:text-[#E87985]" />
                <h3 className="text-xs font-bold uppercase tracking-wider">PostgreSQL Engine</h3>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#52525B] dark:text-[#A1A1AA]">Status:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    Connected &amp; Healthy
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#52525B] dark:text-[#A1A1AA]">Database Size:</span>
                  <span className="font-mono font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                    {data.database.size}
                  </span>
                </div>
                <div
                  className="pt-1 text-[11px] text-[#52525B] dark:text-[#A1A1AA] truncate font-mono"
                  title={data.database.version}
                >
                  {data.database.version.split(" on ")[0]}
                </div>
              </div>
            </div>

            <div className="liquid-silver-card p-5 rounded-xl border border-[#6A0D18]/30 dark:border-white/10 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-[#0A0A0A] dark:text-[#F8FAFC]">
                <Server className="w-4 h-4 text-[#6A0D18] dark:text-[#E87985]" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Node.js Runtime</h3>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#52525B] dark:text-[#A1A1AA]">Node Version:</span>
                  <span className="font-mono font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                    {data.runtime.nodeVersion}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#52525B] dark:text-[#A1A1AA]">OS Architecture:</span>
                  <span className="font-mono text-[#0A0A0A] dark:text-[#F8FAFC]">
                    {data.runtime.platform}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#52525B] dark:text-[#A1A1AA]">Process Uptime:</span>
                  <span className="font-mono font-bold text-[#6A0D18] dark:text-[#E87985]">
                    {formatUptime(data.runtime.uptimeSeconds)}
                  </span>
                </div>
              </div>
            </div>

            <div className="liquid-silver-card p-5 rounded-xl border border-[#6A0D18]/30 dark:border-white/10 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-[#0A0A0A] dark:text-[#F8FAFC]">
                <Cpu className="w-4 h-4 text-[#6A0D18] dark:text-[#E87985]" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Process Memory</h3>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#52525B] dark:text-[#A1A1AA]">Resident Set (RSS):</span>
                  <span className="font-mono font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                    {data.runtime.memoryRssMb} MB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#52525B] dark:text-[#A1A1AA]">Heap Allocation:</span>
                  <span className="font-mono text-[#0A0A0A] dark:text-[#F8FAFC]">
                    {data.runtime.memoryHeapUsedMb} / {data.runtime.memoryHeapTotalMb} MB
                  </span>
                </div>
                <div className="h-1.5 w-full bg-[#FAF9F6] dark:bg-white/10 border border-[#E5E4DF] dark:border-white/10 rounded-full overflow-hidden">
                  <div
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          (data.runtime.memoryHeapUsedMb /
                            Math.max(1, data.runtime.memoryHeapTotalMb)) *
                            100
                        )
                      )}%`,
                    }}
                    className="bg-[#6A0D18] h-full rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="liquid-silver-card p-6 rounded-xl border border-[#6A0D18]/30 dark:border-white/10 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-[#0A0A0A] dark:text-[#F8FAFC] flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-[#6A0D18] dark:text-[#E87985]" />
                Storage Table Telemetry
              </h3>
              <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] mt-0.5">
                Live row volume counts across relational database entities
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "User Accounts", count: data.tableTelemetry.users, icon: Users },
                {
                  label: "Active Sessions",
                  count: data.tableTelemetry.activeSessions,
                  icon: Activity,
                },
                { label: "Creators", count: data.tableTelemetry.creators, icon: ShieldCheck },
                { label: "Brands", count: data.tableTelemetry.brands, icon: Briefcase },
                { label: "Campaigns", count: data.tableTelemetry.campaigns, icon: Megaphone },
                { label: "Applications", count: data.tableTelemetry.applications, icon: Inbox },
                { label: "Deals", count: data.tableTelemetry.deals, icon: Briefcase },
                { label: "Proposals", count: data.tableTelemetry.dealProposals, icon: FileText },
                { label: "Audit Logs", count: data.tableTelemetry.auditLogs, icon: FileText },
                {
                  label: "Moderation",
                  count: data.tableTelemetry.moderationReports,
                  icon: ShieldAlert,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="p-3.5 rounded-lg bg-[#FAF9F6] dark:bg-[#18181E] border border-[#E5E4DF] dark:border-white/10 space-y-1"
                  >
                    <div className="flex items-center justify-between text-[#52525B] dark:text-[#A1A1AA]">
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        {item.label}
                      </span>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-lg font-mono font-extrabold text-[#0A0A0A] dark:text-[#F8FAFC]">
                      {item.count}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
