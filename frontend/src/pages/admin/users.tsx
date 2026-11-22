import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Search,
  Filter,
  ShieldBan,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Calendar,
  X,
  RefreshCw,
  Eye,
  Mail,
  UserCheck,
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAdmin } from "@/contexts/admin-context";

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { hasPermission, isSuperAdmin } = useAdmin();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(0);
  const limit = 25;

  const [modalUser, setModalUser] = useState<any | null>(null);
  const [inspectingUser, setInspectingUser] = useState<any | null>(null);
  const [targetAction, setTargetAction] = useState<"suspend" | "reactivate">("suspend");
  const [reason, setReason] = useState("");

  const canSuspend = isSuperAdmin || hasPermission("admin.users.suspend");
  const canReactivate = isSuperAdmin || hasPermission("admin.users.reactivate");

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["/api/admin/users", search, roleFilter, page],
    queryFn: async () => {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const params = new URLSearchParams({
        search,
        role: roleFilter,
        limit: String(limit),
        offset: String(page * limit),
      });
      const res = await fetch(`${apiUrl}/api/admin/users?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async ({
      userId,
      isSuspended,
      reason,
    }: {
      userId: string;
      isSuspended: boolean;
      reason: string;
    }) => {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${apiUrl}/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isSuspended, reason }),
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to update user status");
      }
      return resData;
    },
    onSuccess: (res, vars) => {
      toast.success(
        vars.isSuspended
          ? `User '${modalUser?.name}' suspended successfully.`
          : `User '${modalUser?.name}' reactivated.`
      );
      setModalUser(null);
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/overview"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update account status.");
    },
  });

  const openActionModal = (user: any, action: "suspend" | "reactivate") => {
    setModalUser(user);
    setTargetAction(action);
    setReason("");
  };

  const handleConfirmStatusChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error("A mandatory administrative reason is required for audit compliance.");
      return;
    }
    mutation.mutate({
      userId: modalUser.id,
      isSuspended: targetAction === "suspend",
      reason: reason.trim(),
    });
  };

  return (
    <div className="space-y-6 text-[#0A0A0A] dark:text-[#F8FAFC]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E5E4DF] dark:border-white/10">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0A0A0A] dark:text-[#F8FAFC]">
            Users &amp; Workspace Accounts
          </h1>
          <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] mt-0.5">
            Directory of registered creator talent and enterprise brands. Inspect profiles and
            manage account restrictions.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching || isLoading}
          className="text-xs h-9 border-[#E5E4DF] dark:border-white/10 bg-white dark:bg-[#121216] text-[#0A0A0A] dark:text-[#F8FAFC] hover:bg-[#FAF9F6] dark:hover:bg-white/[0.08] cursor-pointer gap-2 shrink-0"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin text-[#6A0D18] dark:text-[#E87985]" : "text-[#52525B] dark:text-[#A1A1AA]"}`}
          />
          Refresh Directory
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
            placeholder="Search accounts by name or email address..."
            className="pl-9 h-10 bg-white dark:bg-[#121216] border-[#E5E4DF] dark:border-white/10 text-xs text-[#0A0A0A] dark:text-[#F8FAFC] rounded-lg"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All Roles" },
            { id: "influencer", label: "Creators" },
            { id: "brand", label: "Brands" },
            { id: "admin", label: "Admins" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setRoleFilter(tab.id);
                setPage(0);
              }}
              className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                roleFilter === tab.id
                  ? "bg-[#6A0D18] text-white border-[#6A0D18]"
                  : "bg-white dark:bg-[#121216] text-[#52525B] dark:text-[#A1A1AA] border-[#E5E4DF] dark:border-white/10 hover:bg-[#FAF9F6] dark:hover:bg-white/[0.08] hover:text-[#0A0A0A] dark:hover:text-[#F8FAFC]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Table inside Liquid Silver Card */}
      <div className="liquid-silver-card rounded-xl border border-[#6A0D18]/30 dark:border-[#E87985]/30 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#6A0D18] dark:text-[#E87985]" />
            <p className="text-xs text-[#52525B] dark:text-[#A1A1AA]">
              Querying user account registry...
            </p>
          </div>
        ) : !data || data.users.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Users className="w-8 h-8 text-[#52525B] dark:text-[#A1A1AA] mx-auto opacity-40" />
            <p className="text-sm font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
              No user accounts found
            </p>
            <p className="text-xs text-[#52525B] dark:text-[#A1A1AA]">
              No accounts match the current search criteria or role filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] dark:bg-[#18181E] border-b border-[#E5E4DF] dark:border-white/10 text-[11px] font-bold uppercase tracking-wider text-[#52525B] dark:text-[#A1A1AA]">
                <tr>
                  <th className="py-3.5 px-5">User &amp; Contact</th>
                  <th className="py-3.5 px-4">Marketplace Role</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-4">Verification</th>
                  <th className="py-3.5 px-4">Created</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E4DF] dark:divide-white/10">
                {data.users.map((user: any) => {
                  const isSuspended = Boolean(user.banned);

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-[#FAF9F6]/70 dark:hover:bg-white/[0.04] transition-colors"
                    >
                      <td className="py-3.5 px-5">
                        <div className="space-y-0.5">
                          <p className="font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                            {user.name}
                          </p>
                          <p className="text-[11px] text-[#52525B] dark:text-[#A1A1AA] font-mono">
                            {user.email}
                          </p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#FAF9F6] dark:bg-white/5 border border-[#E5E4DF] dark:border-white/10 text-[#0A0A0A] dark:text-[#F8FAFC]">
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {isSuspended ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                            <ShieldBan className="w-3 h-3" />
                            Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                            <ShieldCheck className="w-3 h-3" />
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[11px] font-semibold ${
                            user.emailVerified
                              ? "text-emerald-700 dark:text-emerald-400"
                              : "text-[#52525B] dark:text-[#A1A1AA]"
                          }`}
                        >
                          {user.emailVerified ? "Verified" : "Unverified"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#52525B] dark:text-[#A1A1AA] font-mono text-[11px] whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setInspectingUser(user)}
                            className="h-7 px-2 text-[11px] font-semibold border-[#E5E4DF] dark:border-white/10 text-[#0A0A0A] dark:text-[#F8FAFC] hover:bg-white dark:hover:bg-white/[0.08] cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1 text-[#6A0D18] dark:text-[#E87985]" />
                            Inspect
                          </Button>
                          {isSuspended
                            ? canReactivate && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openActionModal(user, "reactivate")}
                                  className="h-7 px-2 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
                                >
                                  Reactivate
                                </Button>
                              )
                            : canSuspend && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openActionModal(user, "suspend")}
                                  className="h-7 px-2 text-[11px] font-semibold text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                                >
                                  Suspend
                                </Button>
                              )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {data && data.total > limit && (
          <div className="flex items-center justify-between p-4 border-t border-[#E5E4DF] dark:border-white/10 bg-[#FAF9F6] dark:bg-[#18181E]">
            <span className="text-xs text-[#52525B] dark:text-[#A1A1AA]">
              Showing {page * limit + 1}–{Math.min((page + 1) * limit, data.total)} of {data.total}{" "}
              accounts
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
        open={Boolean(inspectingUser)}
        onOpenChange={(open) => !open && setInspectingUser(null)}
      >
        <SheetContent className="sm:max-w-md bg-white dark:bg-[#0E0E12] border-l border-[#6A0D18]/30 dark:border-white/10 p-6 overflow-y-auto text-[#0A0A0A] dark:text-[#F8FAFC]">
          <SheetHeader className="pb-4 border-b border-[#E5E4DF] dark:border-white/10">
            <SheetTitle className="text-base font-extrabold flex items-center justify-between text-[#0A0A0A] dark:text-[#F8FAFC]">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#6A0D18] dark:text-[#E87985]" />
                User Account Profile
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#FAF9F6] dark:bg-white/5 border border-[#E5E4DF] dark:border-white/10">
                {inspectingUser?.role}
              </span>
            </SheetTitle>
            <SheetDescription className="text-xs text-[#52525B] dark:text-[#A1A1AA]">
              ID: {inspectingUser?.id}
            </SheetDescription>
          </SheetHeader>

          {inspectingUser && (
            <div className="space-y-5 py-4 text-xs">
              <div className="p-4 rounded-xl bg-gradient-to-br from-white to-[#FAF9F6] dark:from-[#18181E] dark:to-[#121216] border border-[#6A0D18]/25 dark:border-[#E87985]/30 space-y-2">
                <p className="text-base font-extrabold text-[#0A0A0A] dark:text-[#F8FAFC]">
                  {inspectingUser.name}
                </p>
                <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] font-mono flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  {inspectingUser.email}
                </p>
                <div className="flex items-center gap-2 pt-2 border-t border-[#E5E4DF] dark:border-white/10">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      inspectingUser.banned
                        ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                        : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50"
                    }`}
                  >
                    {inspectingUser.banned ? "Suspended" : "Active & In Good Standing"}
                  </span>
                </div>
              </div>

              {inspectingUser.banReason && (
                <div className="p-3 rounded-lg bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-rose-800 dark:text-rose-300">
                    Suspension Rationale
                  </span>
                  <p className="text-xs text-rose-900 dark:text-rose-200">
                    {inspectingUser.banReason}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#52525B] dark:text-[#A1A1AA] block">
                  Onboarding &amp; Registration
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-lg bg-[#FAF9F6] dark:bg-white/5 border border-[#E5E4DF] dark:border-white/10">
                    <span className="text-[10px] text-[#52525B] dark:text-[#A1A1AA] block">
                      Onboarding Status
                    </span>
                    <span className="font-bold text-[11px] capitalize text-[#0A0A0A] dark:text-[#F8FAFC]">
                      {inspectingUser.onboardingStatus || "completed"}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#FAF9F6] dark:bg-white/5 border border-[#E5E4DF] dark:border-white/10">
                    <span className="text-[10px] text-[#52525B] dark:text-[#A1A1AA] block">
                      Email Verification
                    </span>
                    <span className="font-bold text-[11px] text-[#0A0A0A] dark:text-[#F8FAFC]">
                      {inspectingUser.emailVerified ? "Verified" : "Unverified"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-[#52525B] dark:text-[#A1A1AA]">
                Registered on {new Date(inspectingUser.createdAt).toLocaleString()}
              </div>

              <div className="pt-4 border-t border-[#E5E4DF] dark:border-white/10 space-y-2">
                {inspectingUser.banned
                  ? canReactivate && (
                      <Button
                        onClick={() => {
                          openActionModal(inspectingUser, "reactivate");
                          setInspectingUser(null);
                        }}
                        className="w-full text-xs h-9 justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer"
                      >
                        Reactivate Account
                      </Button>
                    )
                  : canSuspend && (
                      <Button
                        onClick={() => {
                          openActionModal(inspectingUser, "suspend");
                          setInspectingUser(null);
                        }}
                        className="w-full text-xs h-9 justify-center gap-2 bg-[#6A0D18] hover:bg-[#8B1524] text-white cursor-pointer"
                      >
                        Suspend Account
                      </Button>
                    )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Account Restriction Modal */}
      <Dialog open={Boolean(modalUser)} onOpenChange={(open) => !open && setModalUser(null)}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-[#121216] border border-[#E5E4DF] dark:border-white/10 p-6 rounded-xl shadow-lg text-[#0A0A0A] dark:text-[#F8FAFC]">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-[#0A0A0A] dark:text-[#F8FAFC] flex items-center gap-2">
              <ShieldBan className="w-5 h-5 text-[#6A0D18] dark:text-[#E87985]" />
              {targetAction === "suspend" ? "Suspend Account" : "Reactivate Account"}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#52525B] dark:text-[#A1A1AA] pt-1">
              {targetAction === "suspend"
                ? `Lock access to CreatorsBrand for ${modalUser?.name} (${modalUser?.email}). Active sessions will be terminated.`
                : `Restore platform access for ${modalUser?.name} (${modalUser?.email}).`}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmStatusChange} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label
                htmlFor="reason"
                className="text-xs font-bold text-[#0A0A0A] dark:text-[#F8FAFC] block"
              >
                Mandatory Audit Compliance Reason <span className="text-rose-600">*</span>
              </label>
              <Textarea
                id="reason"
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this account is being suspended or restored..."
                className="text-xs border-[#E5E4DF] dark:border-white/10 bg-white dark:bg-[#18181E] text-[#0A0A0A] dark:text-[#F8FAFC] focus-visible:ring-[#6A0D18] dark:focus-visible:ring-[#E87985]"
              />
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalUser(null)}
                className="text-xs border-[#E5E4DF] dark:border-white/10 text-[#0A0A0A] dark:text-[#F8FAFC]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={mutation.isPending || !reason.trim()}
                className={`text-xs text-white cursor-pointer ${
                  targetAction === "suspend"
                    ? "bg-[#6A0D18] hover:bg-[#8B1524]"
                    : "bg-emerald-700 hover:bg-emerald-800"
                }`}
              >
                {mutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                ) : null}
                {targetAction === "suspend" ? "Confirm Suspension" : "Confirm Reactivation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
