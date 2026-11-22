import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  KeyRound,
  ShieldCheck,
  Shield,
  UserPlus,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAdmin } from "@/contexts/admin-context";

export default function AdminRolesPage() {
  const queryClient = useQueryClient();
  const { isSuperAdmin } = useAdmin();
  const [modalOpen, setModalOpen] = useState(false);
  const [targetEmail, setTargetEmail] = useState("");
  const [targetRole, setTargetRole] = useState("operations_admin");
  const [reason, setReason] = useState("");

  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ["/api/admin/roles"],
    queryFn: async () => {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${apiUrl}/api/admin/roles`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load roles");
      return res.json();
    },
  });

  const {
    data: adminsData,
    isLoading: adminsLoading,
    refetch,
  } = useQuery({
    queryKey: ["/api/admin/roles/admins"],
    queryFn: async () => {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${apiUrl}/api/admin/roles/admins`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load admin operators");
      return res.json();
    },
  });

  const assignMutation = useMutation({
    mutationFn: async ({
      email,
      roleSlug,
      reason,
    }: {
      email: string;
      roleSlug: string;
      reason: string;
    }) => {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${apiUrl}/api/admin/roles/admins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, roleSlug, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to assign administrative role");
      return data;
    },
    onSuccess: () => {
      toast.success("Administrative operator provisioned successfully.");
      setModalOpen(false);
      setTargetEmail("");
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/roles/admins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/roles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/overview"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to assign operator.");
    },
  });

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmail.trim() || !reason.trim()) {
      toast.error("User email and administrative reason are required.");
      return;
    }
    assignMutation.mutate({
      email: targetEmail.trim(),
      roleSlug: targetRole,
      reason: reason.trim(),
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E5E4DF] dark:border-white/10">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0A0A0A] dark:text-[#F8FAFC]">
            Roles, Permissions &amp; Operators
          </h1>
          <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] mt-0.5">
            Decoupled role-based access control governance, active operator roster, and granular
            permission matrices.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <Button
              size="sm"
              onClick={() => setModalOpen(true)}
              className="text-xs h-9 bg-[#6A0D18] hover:bg-[#8B1524] text-white cursor-pointer gap-2"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Assign Operator
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="text-xs h-9 border-[#E5E4DF] dark:border-white/10 bg-white dark:bg-[#18181E] text-[#0A0A0A] dark:text-[#F8FAFC] hover:bg-[#FAF9F6] dark:hover:bg-white/[0.05] cursor-pointer gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#52525B] dark:text-[#A1A1AA]" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-bold text-[#0A0A0A] dark:text-[#F8FAFC] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#6A0D18] dark:text-[#E87985]" />
          Active Administrative Operators
        </h2>
        <div className="liquid-silver-card rounded-xl border border-[#6A0D18]/30 dark:border-white/10 shadow-xs overflow-hidden">
          {adminsLoading ? (
            <div className="p-8 text-center text-xs text-[#52525B] dark:text-[#A1A1AA]">
              Loading operators...
            </div>
          ) : !adminsData?.admins || adminsData.admins.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#52525B] dark:text-[#A1A1AA]">
              No operators provisioned.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF9F6] dark:bg-[#18181E] border-b border-[#E5E4DF] dark:border-white/10 text-[#52525B] dark:text-[#A1A1AA] uppercase text-[10px] tracking-wider font-bold">
                  <tr>
                    <th className="py-3 px-4">Operator</th>
                    <th className="py-3 px-4">Administrative Role</th>
                    <th className="py-3 px-4">User ID</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Assigned Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E4DF] dark:divide-white/10">
                  {adminsData.admins.map((adm: any) => (
                    <tr
                      key={adm.id}
                      className="hover:bg-[#FAF9F6]/60 dark:hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold text-[#0A0A0A] dark:text-[#F8FAFC]">
                        <div>
                          <p className="font-bold text-xs">{adm.userName}</p>
                          <p className="text-[11px] text-[#52525B] dark:text-[#A1A1AA] font-mono">
                            {adm.userEmail}
                          </p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#6A0D18]/10 text-[#6A0D18] dark:text-[#E87985] border border-[#6A0D18]/20 dark:border-[#6A0D18]/40">
                          <Lock className="w-3 h-3" />
                          {adm.roleName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#52525B] dark:text-[#A1A1AA]">
                        {adm.userId.slice(0, 16)}...
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-[#52525B] dark:text-[#A1A1AA] text-[11px]">
                        {new Date(adm.createdAt).toLocaleDateString([], {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-bold text-[#0A0A0A] dark:text-[#F8FAFC] flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-[#6A0D18] dark:text-[#E87985]" />
          Platform Roles &amp; Permission Catalog
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rolesData?.roles?.map((role: any) => (
            <div
              key={role.id}
              className="liquid-silver-card p-5 rounded-xl border border-[#6A0D18]/30 dark:border-white/10 shadow-xs space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                    {role.name}
                  </span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#FAF9F6] dark:bg-[#18181E] border border-[#E5E4DF] dark:border-white/10 text-[#52525B] dark:text-[#A1A1AA]">
                    {role.operatorCount} active
                  </span>
                </div>
                <p className="text-xs text-[#52525B] dark:text-[#A1A1AA]">{role.description}</p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-[#E5E4DF] dark:border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#52525B] dark:text-[#A1A1AA] block">
                  Granted Privileges ({role.permissions?.length || 0})
                </span>
                <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto">
                  {role.permissions?.map((p: any) => (
                    <span
                      key={p.slug}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#FAF9F6] dark:bg-[#18181E] border border-[#E5E4DF] dark:border-white/10 text-[#0A0A0A] dark:text-[#F8FAFC]"
                      title={p.description}
                    >
                      {p.slug}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-[#121216] border border-[#E5E4DF] dark:border-white/10 p-6 rounded-xl shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-[#0A0A0A] dark:text-[#F8FAFC] flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#6A0D18] dark:text-[#E87985]" />
              Assign Administrative Role
            </DialogTitle>
            <DialogDescription className="text-xs text-[#52525B] dark:text-[#A1A1AA] pt-1">
              Grant elevated platform governance privileges to a registered user account.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAssignSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs font-bold text-[#0A0A0A] dark:text-[#F8FAFC] block"
              >
                User Account Email <span className="text-rose-600">*</span>
              </label>
              <Input
                id="email"
                type="email"
                required
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                placeholder="operator@creatorsbrand.in"
                className="text-xs h-9 border-[#E5E4DF] dark:border-white/10 bg-white dark:bg-[#18181E] text-[#0A0A0A] dark:text-[#F8FAFC]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0A0A0A] dark:text-[#F8FAFC] block">
                Administrative Role
              </label>
              <Select value={targetRole} onValueChange={setTargetRole}>
                <SelectTrigger className="h-9 text-xs border-[#E5E4DF] dark:border-white/10 bg-white dark:bg-[#18181E] text-[#0A0A0A] dark:text-[#F8FAFC]">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#18181E] border-[#E5E4DF] dark:border-white/10 text-xs">
                  <SelectItem value="operations_admin">Operations Admin</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="support_admin">Support Admin</SelectItem>
                  <SelectItem value="analyst">Analyst</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="reason"
                className="text-xs font-bold text-[#0A0A0A] dark:text-[#F8FAFC] block"
              >
                Audit Justification <span className="text-rose-600">*</span>
              </label>
              <Textarea
                id="reason"
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="E.g., Appointed marketplace operations manager for campaigns..."
                className="text-xs border-[#E5E4DF] dark:border-white/10 bg-white dark:bg-[#18181E] text-[#0A0A0A] dark:text-[#F8FAFC] focus-visible:ring-[#6A0D18]"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                className="text-xs h-9 border-[#E5E4DF] dark:border-white/10 bg-white dark:bg-[#18181E] text-[#0A0A0A] dark:text-[#F8FAFC]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={assignMutation.isPending || !targetEmail.trim() || !reason.trim()}
                className="text-xs h-9 font-semibold bg-[#6A0D18] hover:bg-[#8B1524] text-white cursor-pointer"
              >
                {assignMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : null}
                Confirm Operator Role
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
