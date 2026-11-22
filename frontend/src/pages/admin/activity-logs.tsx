import React, { useState, useEffect } from "react";
import {
  Activity,
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  User,
  Building2,
  Megaphone,
  Briefcase,
  CreditCard,
  Radio,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface ActivityEvent {
  id: number;
  actorUserId: string | null;
  actorParty: "creator" | "brand" | "admin" | "system";
  eventType: string;
  entityType: string;
  entityId: string;
  summary: string;
  metadata: any;
  createdAt: string;
  actorName: string | null;
  actorEmail: string | null;
  actorImage: string | null;
  isOnline: boolean;
}

export default function AdminActivityLogsPage() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [onlineCount, setOnlineCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [page, setPage] = useState(0);
  const limit = 20;

  // Selected event for right-side drawer
  const [selectedEvent, setSelectedEvent] = useState<ActivityEvent | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(page * limit),
        role: roleFilter,
        status: statusFilter,
        eventType: eventTypeFilter,
        search,
      });

      const res = await fetch(`/api/admin/activity-logs?${params.toString()}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        setTotal(data.total || 0);
        setOnlineCount(data.onlineCount || 0);
      }
    } catch (e) {
      console.error("Failed to load activity logs:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [page, roleFilter, statusFilter, eventTypeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchEvents();
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType.toLowerCase()) {
      case "campaign":
        return <Megaphone className="w-3.5 h-3.5 text-[#6A0D18]" />;
      case "deal":
        return <Briefcase className="w-3.5 h-3.5 text-blue-700" />;
      case "payment":
      case "disbursement":
        return <CreditCard className="w-3.5 h-3.5 text-emerald-700" />;
      default:
        return <User className="w-3.5 h-3.5 text-[#52525B]" />;
    }
  };

  const formatRelativeTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return new Date(isoString).toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  };

  const handleCopyPayload = (obj: any) => {
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 text-[#0A0A0A] dark:text-[#F8FAFC]">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E4DF] dark:border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-[#0A0A0A] dark:text-[#F8FAFC]">
              Active User Activity
            </h1>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
              <span>{onlineCount} Online Now</span>
            </div>
          </div>
          <p className="text-xs text-[#52525B] dark:text-[#A1A1AA]">
            Real-time audit telemetry across both Brand and Creator workspaces.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEvents}
            disabled={loading}
            className="h-8.5 px-3 rounded-lg border-[#E5E4DF] dark:border-white/10 bg-white dark:bg-[#121216] text-xs font-semibold text-[#0A0A0A] dark:text-[#F8FAFC] hover:bg-[#F2F1EC] dark:hover:bg-white/[0.08] transition-all cursor-pointer shadow-2xs"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin text-[#6A0D18] dark:text-[#E87985]" : ""}`}
            />
            Refresh Feed
          </Button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="liquid-silver-card rounded-xl p-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search user, email, summary, or entity ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8.5 pl-8 pr-3 bg-white dark:bg-[#121216] text-xs text-[#0A0A0A] dark:text-[#F8FAFC] rounded-lg border-[#E5E4DF] dark:border-white/10 focus:border-[#6A0D18] dark:focus:border-[#E87985] focus:ring-1 focus:ring-[#6A0D18]"
            />
          </form>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Role Filter */}
            <div className="flex items-center bg-white dark:bg-[#121216] border border-[#E5E4DF] dark:border-white/10 rounded-lg p-0.5">
              {[
                { id: "all", label: "All Roles" },
                { id: "creator", label: "Creators" },
                { id: "brand", label: "Brands" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setRoleFilter(tab.id);
                    setPage(0);
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    roleFilter === tab.id
                      ? "liquid-burgundy-metal text-white shadow-2xs"
                      : "text-[#52525B] dark:text-[#A1A1AA] hover:text-[#0A0A0A] dark:hover:text-[#F8FAFC]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Online Status Filter */}
            <div className="flex items-center bg-white dark:bg-[#121216] border border-[#E5E4DF] dark:border-white/10 rounded-lg p-0.5">
              {[
                { id: "all", label: "All Status" },
                { id: "online", label: "Online Now" },
                { id: "offline", label: "Offline" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setStatusFilter(tab.id);
                    setPage(0);
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    statusFilter === tab.id
                      ? "bg-[#0A0A0A] dark:bg-white text-white dark:text-[#0A0A0A] shadow-2xs"
                      : "text-[#52525B] dark:text-[#A1A1AA] hover:text-[#0A0A0A] dark:hover:text-[#F8FAFC]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Event Type Dropdown */}
            <select
              value={eventTypeFilter}
              onChange={(e) => {
                setEventTypeFilter(e.target.value);
                setPage(0);
              }}
              className="h-8.5 px-2.5 bg-white dark:bg-[#121216] border border-[#E5E4DF] dark:border-white/10 rounded-lg text-xs font-semibold text-[#0A0A0A] dark:text-[#F8FAFC] outline-none cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600"
            >
              <option value="all">All Event Types</option>
              <option value="user.login">user.login</option>
              <option value="campaign.created">campaign.created</option>
              <option value="application.submitted">application.submitted</option>
              <option value="deal.proposal_created">deal.proposal_created</option>
              <option value="deal.counter_offer">deal.counter_offer</option>
              <option value="deal.signed">deal.signed</option>
              <option value="deliverable.submitted">deliverable.submitted</option>
              <option value="content.approved">content.approved</option>
              <option value="payment.settled">payment.settled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dense Activity Ledger */}
      <div className="liquid-silver-card rounded-2xl overflow-hidden border border-[#E5E4DF] dark:border-white/10 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E5E4DF] dark:border-white/10 bg-white/70 dark:bg-[#121216]/70 text-[11px] font-bold uppercase tracking-wider text-[#52525B] dark:text-[#A1A1AA]">
                <th className="py-3 px-4">User &amp; Status</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Action &amp; Summary</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E4DF] dark:divide-white/10 text-xs font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#52525B] dark:text-[#A1A1AA]">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#6A0D18] dark:text-[#E87985]" />
                    Loading platform activity events...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#52525B] dark:text-[#A1A1AA]">
                    No activity logs match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                events.map((ev) => (
                  <tr
                    key={ev.id}
                    className="hover:bg-white/90 dark:hover:bg-white/[0.04] transition-colors group cursor-pointer"
                    onClick={() => {
                      setSelectedEvent(ev);
                      setDrawerOpen(true);
                    }}
                  >
                    {/* User & Status */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="relative shrink-0">
                          <Avatar className="h-8 w-8 rounded-full border border-[#E5E4DF] dark:border-white/10">
                            <AvatarImage src={ev.actorImage || undefined} />
                            <AvatarFallback className="bg-[#FAF9F6] dark:bg-[#18181E] text-[#0A0A0A] dark:text-[#F8FAFC] font-bold text-xs">
                              {ev.actorName?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#121216] ${
                              ev.isOnline
                                ? "bg-emerald-500 animate-pulse"
                                : "bg-zinc-300 dark:bg-zinc-600"
                            }`}
                            title={ev.isOnline ? "Online Now" : "Offline"}
                          />
                        </div>
                        <div className="truncate max-w-[160px]">
                          <p className="font-bold text-[#0A0A0A] dark:text-[#F8FAFC] truncate">
                            {ev.actorName || "Unregistered Actor"}
                          </p>
                          <p className="text-[11px] text-[#52525B] dark:text-[#A1A1AA] truncate font-mono">
                            {ev.actorEmail || ev.actorUserId || "system"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Role Pill */}
                    <td className="py-3 px-4">
                      {ev.actorParty === "brand" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F2F1EC] dark:bg-white/10 text-[#0A0A0A] dark:text-[#F8FAFC] border border-[#E5E4DF] dark:border-white/10">
                          <Building2 className="w-2.5 h-2.5 text-[#52525B] dark:text-[#A1A1AA]" />
                          Brand
                        </span>
                      ) : ev.actorParty === "creator" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FDF6F7] dark:bg-[#6A0D18]/25 text-[#6A0D18] dark:text-[#E87985] border border-[#EED8DC] dark:border-[#6A0D18]/40">
                          <Sparkles className="w-2.5 h-2.5 text-[#6A0D18] dark:text-[#E87985]" />
                          Creator
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10">
                          {ev.actorParty}
                        </span>
                      )}
                    </td>

                    {/* Action & Summary */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5 max-w-sm">
                        <span className="inline-block px-1.5 py-0.5 rounded bg-white dark:bg-[#18181E] text-[10px] font-mono font-bold text-[#6A0D18] dark:text-[#E87985] border border-[#6A0D18]/20 dark:border-[#E87985]/30">
                          {ev.eventType}
                        </span>
                        <p className="text-xs text-[#0A0A0A] dark:text-[#F8FAFC] font-medium line-clamp-1">
                          {ev.summary}
                        </p>
                      </div>
                    </td>

                    {/* Entity Badge */}
                    <td className="py-3 px-4">
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white dark:bg-[#18181E] border border-[#E5E4DF] dark:border-white/10 text-xs font-semibold text-[#0A0A0A] dark:text-[#F8FAFC] shadow-2xs">
                        {getEntityIcon(ev.entityType)}
                        <span className="capitalize">{ev.entityType}</span>
                        <span className="font-mono text-[#52525B] dark:text-[#A1A1AA]">
                          #{ev.entityId}
                        </span>
                      </div>
                    </td>

                    {/* Timestamp */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-[#0A0A0A] dark:text-[#F8FAFC]">
                          {formatRelativeTime(ev.createdAt)}
                        </p>
                        <p className="text-[10px] text-[#52525B] dark:text-[#A1A1AA] font-mono">
                          {new Date(ev.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </td>

                    {/* Details Button */}
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 rounded-lg text-zinc-500 hover:text-[#6A0D18] dark:hover:text-[#E87985] hover:bg-[#6A0D18]/10 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3.5 border-t border-[#E5E4DF] dark:border-white/10 bg-white/60 dark:bg-[#121216]/60 flex items-center justify-between text-xs text-[#52525B] dark:text-[#A1A1AA]">
          <span>
            Showing {events.length > 0 ? page * limit + 1 : 0} to{" "}
            {Math.min((page + 1) * limit, total)} of {total.toLocaleString()} events
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(p - 1, 0))}
              disabled={page === 0}
              className="h-7 px-2.5 text-xs rounded-md border-[#E5E4DF] dark:border-white/10 bg-white dark:bg-[#121216] text-[#0A0A0A] dark:text-[#F8FAFC] hover:bg-[#F2F1EC] dark:hover:bg-white/[0.08] disabled:opacity-50 cursor-pointer"
            >
              Previous
            </Button>
            <span className="font-mono tabular-nums text-xs font-semibold text-[#0A0A0A] dark:text-[#F8FAFC]">
              Page {page + 1} of {Math.max(Math.ceil(total / limit), 1)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={(page + 1) * limit >= total}
              className="h-7 px-2.5 text-xs rounded-md border-[#E5E4DF] dark:border-white/10 bg-white dark:bg-[#121216] text-[#0A0A0A] dark:text-[#F8FAFC] hover:bg-[#F2F1EC] dark:hover:bg-white/[0.08] disabled:opacity-50 cursor-pointer"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Right-Side Silver Liquid Glass Slide-Over Inspection Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-md bg-[#FAF9F6] dark:bg-[#0E0E12] border-l border-[#E5E4DF] dark:border-white/10 p-6 overflow-y-auto space-y-6 text-[#0A0A0A] dark:text-[#F8FAFC]">
          <SheetHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FDF6F7] dark:bg-[#6A0D18]/25 text-[#6A0D18] dark:text-[#E87985] border border-[#EED8DC] dark:border-[#6A0D18]/40">
                Event #{selectedEvent?.id}
              </span>
              <div className="flex items-center gap-1.5 text-xs">
                <span
                  className={`w-2 h-2 rounded-full ${
                    selectedEvent?.isOnline
                      ? "bg-emerald-500 animate-pulse"
                      : "bg-zinc-300 dark:bg-zinc-600"
                  }`}
                />
                <span className="font-semibold text-[#52525B] dark:text-[#A1A1AA]">
                  {selectedEvent?.isOnline ? "Online Now" : "Offline"}
                </span>
              </div>
            </div>
            <SheetTitle className="text-base font-extrabold text-[#0A0A0A] dark:text-[#F8FAFC]">
              Telemetry Inspection
            </SheetTitle>
            <SheetDescription className="text-xs text-[#52525B] dark:text-[#A1A1AA]">
              Detailed payload and actor footprint captured by platform telemetry.
            </SheetDescription>
          </SheetHeader>

          {selectedEvent && (
            <div className="space-y-5 text-xs">
              {/* Actor Profile Card */}
              <div className="liquid-silver-card rounded-xl p-4 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#52525B] dark:text-[#A1A1AA]">
                  Actor Footprint
                </span>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 rounded-full border border-[#E5E4DF] dark:border-white/10">
                    <AvatarImage src={selectedEvent.actorImage || undefined} />
                    <AvatarFallback className="bg-white dark:bg-[#18181E] font-bold text-sm text-[#0A0A0A] dark:text-[#F8FAFC]">
                      {selectedEvent.actorName?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="truncate">
                    <p className="font-bold text-sm text-[#0A0A0A] dark:text-[#F8FAFC]">
                      {selectedEvent.actorName || "Unregistered Actor"}
                    </p>
                    <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] font-mono">
                      {selectedEvent.actorEmail}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white dark:bg-[#18181E] border border-[#E5E4DF] dark:border-white/10">
                        {selectedEvent.actorParty}
                      </span>
                      <span className="text-[10px] text-[#52525B] dark:text-[#A1A1AA] font-mono">
                        UID: {selectedEvent.actorUserId}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Summary Card */}
              <div className="liquid-silver-card rounded-xl p-4 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#52525B] dark:text-[#A1A1AA]">
                  Operation Overview
                </span>
                <div className="space-y-2">
                  <div>
                    <span className="text-[11px] text-[#52525B] dark:text-[#A1A1AA]">
                      Event Type:
                    </span>
                    <p className="font-mono font-bold text-[#6A0D18] dark:text-[#E87985]">
                      {selectedEvent.eventType}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#52525B] dark:text-[#A1A1AA]">
                      Target Entity:
                    </span>
                    <div className="mt-0.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white dark:bg-[#18181E] border border-[#E5E4DF] dark:border-white/10 font-semibold text-[#0A0A0A] dark:text-[#F8FAFC]">
                      {getEntityIcon(selectedEvent.entityType)}
                      <span className="capitalize">{selectedEvent.entityType}</span>
                      <span className="font-mono text-[#52525B] dark:text-[#A1A1AA]">
                        #{selectedEvent.entityId}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#52525B] dark:text-[#A1A1AA]">Summary:</span>
                    <p className="text-xs font-semibold text-[#0A0A0A] dark:text-[#F8FAFC] mt-0.5">
                      {selectedEvent.summary}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#52525B] dark:text-[#A1A1AA]">
                      Recorded At:
                    </span>
                    <p className="font-mono text-[11px] text-[#0A0A0A] dark:text-[#F8FAFC] mt-0.5">
                      {new Date(selectedEvent.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Structured Metadata JSON */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#52525B] dark:text-[#A1A1AA]">
                    Structured Metadata JSON
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyPayload(selectedEvent.metadata)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#6A0D18] dark:text-[#E87985] hover:underline cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Payload</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-[#0A0A0A] text-zinc-200 font-mono text-[11px] overflow-x-auto max-h-60 border border-zinc-800">
                  <pre>{JSON.stringify(selectedEvent.metadata || {}, null, 2)}</pre>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
