import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  UserCheck,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  BadgeCheck,
  Eye,
  Instagram,
  Youtube,
  Globe,
  SlidersHorizontal,
  Mail,
  MapPin,
  TrendingUp,
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

export default function AdminCreatorsPage() {
  const queryClient = useQueryClient();
  const { hasPermission, isSuperAdmin } = useAdmin();
  const [search, setSearch] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("all");
  const [page, setPage] = useState(0);
  const limit = 20;

  const [selectedCreator, setSelectedCreator] = useState<any | null>(null);
  const [inspectingCreator, setInspectingCreator] = useState<any | null>(null);
  const [targetVerify, setTargetVerify] = useState<boolean>(true);
  const [reason, setReason] = useState("");

  const canManage = isSuperAdmin || hasPermission("admin.users.view");

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["/api/admin/creators", search, verifiedFilter, page],
    queryFn: async () => {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const params = new URLSearchParams({
        search,
        verified: verifiedFilter,
        limit: String(limit),
        offset: String(page * limit),
      });
      const res = await fetch(`${apiUrl}/api/admin/creators?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load creators");
      return res.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async ({
      creatorId,
      isVerified,
      reason,
    }: {
      creatorId: number;
      isVerified: boolean;
      reason: string;
    }) => {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${apiUrl}/api/admin/creators/${creatorId}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isVerified, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update verification status");
      return data;
    },
    onSuccess: (_, vars) => {
      toast.success(
        vars.isVerified
          ? "Creator verified and awarded platform badge."
          : "Verification badge revoked."
      );
      setSelectedCreator(null);
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/creators"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/overview"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update verification.");
    },
  });

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error("An administrative reason is required for compliance audit logging.");
      return;
    }
    mutation.mutate({
      creatorId: selectedCreator.id,
      isVerified: targetVerify,
      reason: reason.trim(),
    });
  };

  const formatFollowers = (count: number) => {
    if (!count) return "0";
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E5E4DF] dark:border-white/10">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0A0A0A] dark:text-[#F8FAFC]">
            Creator Roster &amp; Verified Talent
          </h1>
          <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] mt-0.5">
            Audit creator profiles, follower metrics, audience categories, and grant verified
            credentials.
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
          Refresh Roster
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
            placeholder="Search by creator name, email, or category..."
            className="pl-9 h-10 bg-white dark:bg-[#18181E] border-[#E5E4DF] dark:border-white/10 text-xs text-[#0A0A0A] dark:text-[#F8FAFC] placeholder:text-[#52525B] dark:placeholder:text-[#A1A1AA] rounded-lg"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All Creators" },
            { id: "verified", label: "Verified Only" },
            { id: "pending", label: "Pending Verification" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setVerifiedFilter(tab.id);
                setPage(0);
              }}
              className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                verifiedFilter === tab.id
                  ? "bg-[#6A0D18] text-white border-[#6A0D18]"
                  : "bg-white dark:bg-[#18181E] text-[#52525B] dark:text-[#A1A1AA] border-[#E5E4DF] dark:border-white/10 hover:bg-[#FAF9F6] dark:hover:bg-white/[0.05] hover:text-[#0A0A0A] dark:hover:text-[#F8FAFC]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table in Liquid Silver Card */}
      <div className="liquid-silver-card rounded-xl border border-[#6A0D18]/30 dark:border-white/10 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#6A0D18] dark:text-[#E87985]" />
            <p className="text-xs text-[#52525B] dark:text-[#A1A1AA]">
              Querying verified creator roster...
            </p>
          </div>
        ) : !data || data.creators.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <UserCheck className="w-8 h-8 text-[#52525B] dark:text-[#A1A1AA] mx-auto opacity-40" />
            <p className="text-sm font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
              No creator profiles found
            </p>
            <p className="text-xs text-[#52525B] dark:text-[#A1A1AA]">
              No creators match the selected verification or search filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] dark:bg-[#18181E] border-b border-[#E5E4DF] dark:border-white/10 text-[11px] font-bold uppercase tracking-wider text-[#52525B] dark:text-[#A1A1AA]">
                <tr>
                  <th className="py-3.5 px-5">Creator</th>
                  <th className="py-3.5 px-4">Content Category</th>
                  <th className="py-3.5 px-4">Audience Scale</th>
                  <th className="py-3.5 px-4">Rate Card</th>
                  <th className="py-3.5 px-4">Verification</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E4DF] dark:divide-white/10">
                {data.creators.map((creator: any) => (
                  <tr
                    key={creator.id}
                    className="hover:bg-[#FAF9F6]/70 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#FAF9F6] dark:bg-[#18181E] border border-[#6A0D18]/25 flex items-center justify-center font-bold text-[#6A0D18] dark:text-[#E87985] text-xs">
                          {creator.name?.charAt(0) || "C"}
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[#0A0A0A] dark:text-[#F8FAFC]">
                              {creator.name}
                            </span>
                            {creator.isVerified && (
                              <BadgeCheck className="w-3.5 h-3.5 text-[#6A0D18] dark:text-[#E87985]" />
                            )}
                          </div>
                          <p className="text-[11px] text-[#52525B] dark:text-[#A1A1AA] font-mono">
                            {creator.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FAF9F6] dark:bg-[#18181E] border border-[#E5E4DF] dark:border-white/10 text-[#0A0A0A] dark:text-[#F8FAFC]">
                        {creator.category || "Lifestyle"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold tabular-nums text-[#0A0A0A] dark:text-[#F8FAFC]">
                      {formatFollowers(creator.followers)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#0A0A0A] dark:text-[#F8FAFC]">
                      {creator.collaborationCost || "Custom"}
                    </td>
                    <td className="py-3.5 px-4">
                      {creator.isVerified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#6A0D18]/10 text-[#6A0D18] dark:text-[#E87985] border border-[#6A0D18]/25 dark:border-[#6A0D18]/40">
                          <BadgeCheck className="w-3 h-3" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-white/[0.06] text-[#52525B] dark:text-[#A1A1AA] border border-zinc-200 dark:border-white/10">
                          Unverified
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInspectingCreator(creator)}
                          className="h-7 px-2 text-[11px] font-semibold border-[#E5E4DF] dark:border-white/10 text-[#0A0A0A] dark:text-[#F8FAFC] hover:bg-white dark:hover:bg-[#18181E] cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1 text-[#6A0D18] dark:text-[#E87985]" />
                          Inspect
                        </Button>
                        {canManage && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCreator(creator);
                              setTargetVerify(!creator.isVerified);
                              setReason("");
                            }}
                            className={`h-7 px-2 text-[11px] font-semibold cursor-pointer border ${
                              creator.isVerified
                                ? "text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                : "text-[#6A0D18] dark:text-[#E87985] border-[#6A0D18]/30 dark:border-[#6A0D18]/50 hover:bg-[#6A0D18]/5 dark:hover:bg-[#6A0D18]/20"
                            }`}
                          >
                            {creator.isVerified ? "Revoke" : "Award Badge"}
                          </Button>
                        )}
                      </div>
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
              creators
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
        open={Boolean(inspectingCreator)}
        onOpenChange={(open) => !open && setInspectingCreator(null)}
      >
        <SheetContent className="sm:max-w-md bg-white dark:bg-[#121216] border-l border-[#6A0D18]/30 dark:border-white/10 p-6 overflow-y-auto text-[#0A0A0A] dark:text-[#F8FAFC]">
          <SheetHeader className="pb-4 border-b border-[#E5E4DF] dark:border-white/10">
            <SheetTitle className="text-base font-extrabold flex items-center justify-between text-[#0A0A0A] dark:text-[#F8FAFC]">
              <span className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#6A0D18] dark:text-[#E87985]" />
                Creator Profile
              </span>
              {inspectingCreator?.isVerified && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#6A0D18]/10 text-[#6A0D18] dark:text-[#E87985] border border-[#6A0D18]/25 dark:border-[#6A0D18]/40 flex items-center gap-1">
                  <BadgeCheck className="w-3 h-3" /> Verified
                </span>
              )}
            </SheetTitle>
            <SheetDescription className="text-xs text-[#52525B] dark:text-[#A1A1AA]">
              Creator ID: #{inspectingCreator?.id}
            </SheetDescription>
          </SheetHeader>

          {inspectingCreator && (
            <div className="space-y-5 py-4 text-xs">
              <div className="p-4 rounded-xl bg-gradient-to-br from-white to-[#FAF9F6] dark:from-[#18181E] dark:to-[#121216] border border-[#6A0D18]/25 dark:border-white/10 space-y-2">
                <p className="text-base font-extrabold text-[#0A0A0A] dark:text-[#F8FAFC]">
                  {inspectingCreator.name}
                </p>
                <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] font-mono flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  {inspectingCreator.email}
                </p>
                <div className="flex items-center gap-2 pt-2 border-t border-[#E5E4DF] dark:border-white/10">
                  <span className="text-[11px] font-semibold text-[#52525B] dark:text-[#A1A1AA]">
                    Category:{" "}
                    <strong className="text-[#0A0A0A] dark:text-[#F8FAFC]">
                      {inspectingCreator.category || "General"}
                    </strong>
                  </span>
                  <span>•</span>
                  <span className="text-[11px] font-semibold text-[#52525B] dark:text-[#A1A1AA]">
                    Country:{" "}
                    <strong className="text-[#0A0A0A] dark:text-[#F8FAFC]">
                      {inspectingCreator.country || "IN"}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-lg bg-[#FAF9F6] dark:bg-[#18181E] border border-[#E5E4DF] dark:border-white/10 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#52525B] dark:text-[#A1A1AA]">
                    Followers
                  </span>
                  <p className="text-lg font-mono font-extrabold text-[#0A0A0A] dark:text-[#F8FAFC] tabular-nums">
                    {formatFollowers(inspectingCreator.followers)}
                  </p>
                </div>
                <div className="p-3.5 rounded-lg bg-[#FAF9F6] dark:bg-[#18181E] border border-[#E5E4DF] dark:border-white/10 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#52525B] dark:text-[#A1A1AA]">
                    Engagement Rate
                  </span>
                  <p className="text-lg font-mono font-extrabold text-[#6A0D18] dark:text-[#E87985] tabular-nums">
                    {inspectingCreator.engagementRate || "N/A"}%
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#FAF9F6] dark:bg-[#18181E] border border-[#E5E4DF] dark:border-white/10 space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#52525B] dark:text-[#A1A1AA]">
                  Rate Card
                </span>
                <p className="font-mono font-bold text-sm text-[#0A0A0A] dark:text-[#F8FAFC]">
                  {inspectingCreator.collaborationCost || "Market Standard"}
                </p>
              </div>

              <div className="pt-4 border-t border-[#E5E4DF] dark:border-white/10 space-y-2">
                {canManage && (
                  <Button
                    onClick={() => {
                      setSelectedCreator(inspectingCreator);
                      setTargetVerify(!inspectingCreator.isVerified);
                      setReason("");
                      setInspectingCreator(null);
                    }}
                    className={`w-full text-xs h-9 justify-center gap-2 text-white cursor-pointer ${
                      inspectingCreator.isVerified
                        ? "bg-rose-700 hover:bg-rose-800"
                        : "bg-[#6A0D18] hover:bg-[#8B1524]"
                    }`}
                  >
                    <BadgeCheck className="w-3.5 h-3.5" />
                    {inspectingCreator.isVerified
                      ? "Revoke Verification Badge"
                      : "Award Verified Badge"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Verification Dialog with Mandatory Audit Reason */}
      <Dialog
        open={Boolean(selectedCreator)}
        onOpenChange={(open) => !open && setSelectedCreator(null)}
      >
        <DialogContent className="sm:max-w-md bg-white dark:bg-[#121216] border border-[#E5E4DF] dark:border-white/10 p-6 rounded-xl shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-[#0A0A0A] dark:text-[#F8FAFC] flex items-center gap-2">
              <BadgeCheck className="w-5 h-5 text-[#6A0D18] dark:text-[#E87985]" />
              {targetVerify ? "Award Verification Badge" : "Revoke Verification Badge"}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#52525B] dark:text-[#A1A1AA] pt-1">
              {targetVerify
                ? `Grant platform verified status to ${selectedCreator?.name}. This displays a verified badge across marketplace directories.`
                : `Revoke verified status from ${selectedCreator?.name}.`}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleVerifySubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label
                htmlFor="reason"
                className="text-xs font-bold text-[#0A0A0A] dark:text-[#F8FAFC] block"
              >
                Compliance Audit Reason <span className="text-rose-600">*</span>
              </label>
              <Textarea
                id="reason"
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="State the audit rationale for this verification update..."
                className="text-xs border-[#E5E4DF] dark:border-white/10 bg-white dark:bg-[#18181E] text-[#0A0A0A] dark:text-[#F8FAFC] focus-visible:ring-[#6A0D18]"
              />
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedCreator(null)}
                className="text-xs border-[#E5E4DF] dark:border-white/10 bg-white dark:bg-[#18181E] text-[#0A0A0A] dark:text-[#F8FAFC]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={mutation.isPending || !reason.trim()}
                className={`text-xs text-white cursor-pointer ${
                  targetVerify ? "bg-[#6A0D18] hover:bg-[#8B1524]" : "bg-rose-700 hover:bg-rose-800"
                }`}
              >
                {mutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                ) : null}
                {targetVerify ? "Confirm Verification" : "Confirm Revocation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
