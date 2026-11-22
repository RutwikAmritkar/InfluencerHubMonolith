import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Settings,
  ShieldAlert,
  Save,
  RefreshCw,
  Loader2,
  Lock,
  Clock,
  Mail,
  Sliders,
  AlertTriangle,
  CheckCircle2,
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
import { toast } from "sonner";
import { useAdmin } from "@/contexts/admin-context";

interface PlatformSettingItem {
  id: number;
  key: string;
  value: string;
  description: string | null;
  updatedAt: string | null;
}

const SETTING_METADATA: Record<
  string,
  { label: string; description: string; type: "number" | "text" | "boolean" }
> = {
  "escrow.fee_percentage": {
    label: "Platform Escrow Commission Take-Rate (%)",
    description: "Percentage cut deducted by CreatorsBrand on deal releases.",
    type: "number",
  },
  "escrow.dispute_window_days": {
    label: "Dispute Window Window (Days)",
    description: "Period brand or creator can raise a dispute following delivery submission.",
    type: "number",
  },
  "payouts.auto_release_days": {
    label: "Automatic Escrow Release Window (Days)",
    description: "Days after milestone completion when funds auto-release if no dispute raised.",
    type: "number",
  },
  maintenance_mode: {
    label: "Global Platform Maintenance Mode",
    description: "When true, marketplace actions are blocked for non-admin accounts.",
    type: "boolean",
  },
  "creators.auto_verification": {
    label: "Automated Creator Profile Verification",
    description: "Automatically grant verification status to qualifying creator accounts.",
    type: "boolean",
  },
  "system.support_email": {
    label: "Administrative Support Contact",
    description: "System email destination for escalation alerts and legal notices.",
    type: "text",
  },
};

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const { hasPermission, isSuperAdmin } = useAdmin();
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [reasonModalOpen, setReasonModalOpen] = useState(false);
  const [auditReason, setAuditReason] = useState("");

  const canManage = isSuperAdmin || hasPermission("admin.settings.manage");

  const { data, isLoading, refetch, isRefetching } = useQuery<{
    settings: PlatformSettingItem[];
  }>({
    queryKey: ["/api/admin/settings"],
    queryFn: async () => {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${apiUrl}/api/admin/settings`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load platform settings");
      return res.json();
    },
  });

  useEffect(() => {
    if (data?.settings) {
      const values: Record<string, string> = {};
      data.settings.forEach((s) => {
        values[s.key] = s.value;
      });
      setFormValues(values);
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: async ({
      settings,
      reason,
    }: {
      settings: { key: string; value: string }[];
      reason: string;
    }) => {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${apiUrl}/api/admin/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ settings, reason }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update platform settings");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Platform settings updated and recorded to security audit log.");
      setReasonModalOpen(false);
      setAuditReason("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update platform settings.");
    },
  });

  const handleChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveClick = (e: React.FormEvent) => {
    e.preventDefault();
    setReasonModalOpen(true);
  };

  const handleConfirmSave = () => {
    const payload = Object.entries(formValues).map(([key, value]) => ({ key, value }));
    updateMutation.mutate({ settings: payload, reason: auditReason.trim() });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E5E4DF] dark:border-white/10">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0A0A0A] dark:text-[#F8FAFC]">
            Platform Governance &amp; Global Parameters
          </h1>
          <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] mt-0.5">
            Configure platform commission take-rates, escrow auto-release intervals, and operational
            modes.
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
          Reload Settings
        </Button>
      </div>

      {formValues["maintenance_mode"] === "true" && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 flex items-center gap-3 text-amber-900 dark:text-amber-300">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div className="text-xs">
            <span className="font-extrabold uppercase tracking-wide">
              Warning: Maintenance Mode Active
            </span>
            <p className="text-amber-700 dark:text-amber-400 mt-0.5">
              Marketplace operations are temporarily locked for non-administrative creator and brand
              accounts.
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white dark:bg-[#121216] rounded-xl border border-[#E5E4DF] dark:border-white/10 p-16 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#6A0D18] dark:text-[#E87985]" />
          <p className="text-xs text-[#52525B] dark:text-[#A1A1AA]">
            Loading platform settings from PostgreSQL...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSaveClick} className="space-y-6">
          <div className="liquid-silver-card rounded-xl border border-[#6A0D18]/30 dark:border-white/10 shadow-xs divide-y divide-[#E5E4DF] dark:divide-white/10">
            {(data?.settings || []).map((setting) => {
              const meta = SETTING_METADATA[setting.key] || {
                label: setting.key,
                description: setting.description || "Platform configuration parameter",
                type: "text",
              };

              const currentValue = formValues[setting.key] ?? setting.value;

              return (
                <div
                  key={setting.key}
                  className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div className="space-y-0.5 max-w-lg">
                    <label className="text-xs font-bold text-[#0A0A0A] dark:text-[#F8FAFC] block">
                      {meta.label}
                    </label>
                    <p className="text-[11px] text-[#52525B] dark:text-[#A1A1AA]">
                      {meta.description}
                    </p>
                    <span className="text-[10px] font-mono text-[#52525B] dark:text-[#A1A1AA] opacity-75">
                      Key: {setting.key}
                    </span>
                  </div>

                  <div className="w-full sm:w-64">
                    {meta.type === "boolean" ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={!canManage}
                          onClick={() =>
                            handleChange(setting.key, currentValue === "true" ? "false" : "true")
                          }
                          className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                            currentValue === "true"
                              ? "bg-[#6A0D18]"
                              : "bg-zinc-300 dark:bg-zinc-700"
                          }`}
                        >
                          <div
                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                              currentValue === "true" ? "translate-x-6" : "translate-x-0"
                            }`}
                          />
                        </button>
                        <span className="text-xs font-mono font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                          {currentValue === "true" ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                    ) : (
                      <Input
                        type={meta.type === "number" ? "number" : "text"}
                        step={meta.type === "number" ? "any" : undefined}
                        disabled={!canManage}
                        value={currentValue}
                        onChange={(e) => handleChange(setting.key, e.target.value)}
                        className="h-9 bg-[#FAF9F6] dark:bg-[#18181E] border-[#E5E4DF] dark:border-white/10 text-xs font-mono text-[#0A0A0A] dark:text-[#F8FAFC]"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {canManage && (
            <div className="flex justify-end">
              <Button
                type="submit"
                className="bg-[#6A0D18] hover:bg-[#8B1524] text-white text-xs h-10 px-5 rounded-lg cursor-pointer flex items-center gap-2 shadow-xs"
              >
                <Save className="w-4 h-4" />
                Commit Platform Changes
              </Button>
            </div>
          )}
        </form>
      )}

      <Dialog open={reasonModalOpen} onOpenChange={setReasonModalOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-[#121216] border-[#E5E4DF] dark:border-white/10 text-[#0A0A0A] dark:text-[#F8FAFC]">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-[#0A0A0A] dark:text-[#F8FAFC] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#6A0D18] dark:text-[#E87985]" />
              Confirm Platform Configuration Change
            </DialogTitle>
            <DialogDescription className="text-xs text-[#52525B] dark:text-[#A1A1AA]">
              Administrative parameters directly govern commercial take-rates and platform security.
              Provide a clear audit reason before applying these changes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                Audit Reason <span className="text-rose-600">*</span>
              </label>
              <Textarea
                value={auditReason}
                onChange={(e) => setAuditReason(e.target.value)}
                placeholder="e.g. Updating platform take-rate for festive Q4 promotions..."
                className="h-24 bg-white dark:bg-[#18181E] border-[#E5E4DF] dark:border-white/10 text-[#0A0A0A] dark:text-[#F8FAFC] text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReasonModalOpen(false)}
              className="text-xs border-[#E5E4DF] dark:border-white/10 bg-white dark:bg-[#18181E] text-[#0A0A0A] dark:text-[#F8FAFC]"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!auditReason.trim() || updateMutation.isPending}
              onClick={handleConfirmSave}
              className="text-xs bg-[#6A0D18] hover:bg-[#8B1524] text-white cursor-pointer"
            >
              {updateMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Authorize &amp; Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
