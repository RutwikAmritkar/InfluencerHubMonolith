import { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
import {
  FileCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Trash2,
  Eye,
  X,
  Compass,
  AlertCircle,
  MessageSquare,
  Building2,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import {
  ApplicationItem,
  getSavedApplications,
  withdrawApplication,
} from "@/services/creator-funnel";

type FilterTab = "all" | "pending" | "shortlisted" | "accepted" | "declined" | "withdrawn";

export default function Applications() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [viewingPitch, setViewingPitch] = useState<ApplicationItem | null>(null);

  const loadData = () => {
    setApplications(getSavedApplications());
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener("cb_applications_updated", handleUpdate);
    return () => window.removeEventListener("cb_applications_updated", handleUpdate);
  }, []);

  const counts = useMemo(() => {
    return {
      all: applications.length,
      pending: applications.filter((a) => a.status === "pending").length,
      shortlisted: applications.filter((a) => a.status === "shortlisted").length,
      accepted: applications.filter((a) => a.status === "accepted").length,
      declined: applications.filter((a) => a.status === "declined").length,
      withdrawn: applications.filter((a) => a.status === "withdrawn").length,
    };
  }, [applications]);

  const filteredApplications = useMemo(() => {
    if (activeTab === "all") return applications;
    return applications.filter((a) => a.status === activeTab);
  }, [applications, activeTab]);

  const handleWithdraw = (app: ApplicationItem) => {
    if (
      confirm(
        `Withdraw your pitch for "${app.campaignTitle}"? This will return the brief to available opportunities.`
      )
    ) {
      withdrawApplication(app.id);
      const updated = getSavedApplications();
      setApplications(updated);
      if (viewingPitch && viewingPitch.id === app.id) {
        setViewingPitch(updated.find((a) => a.id === app.id) || null);
      }
      toast.info(`Pitch for ${app.brandName} marked as Withdrawn.`);
    }
  };

  return (
    <div className="workspace-canvas space-y-8 pb-16 antialiased text-[#0A0A0A]">
      {/* ─── 1. PITCH PIPELINE HEADER ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-4 border-b border-[#E5E4DF]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-[#FDF6F7] text-[#6A0D18] border border-[#EED8DC]">
              PITCH PIPELINE
            </span>
            <span className="text-zinc-400">•</span>
            <span className="text-xs font-semibold text-zinc-500">
              Application &amp; Quote Status
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0A0A0A]">
            Deal <span className="font-serif italic font-normal text-[#6A0D18]">Applications</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-2xl">
            Audit your submitted pitches, track brand decision turnarounds, and transition accepted
            collaborations into production.
          </p>
        </div>

        {/* Funnel Navigation Action */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/opportunities"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg liquid-burgundy-metal text-xs font-semibold shadow-xs"
          >
            <span>Browse Open Briefs</span>
            <ArrowRight className="w-3.5 h-3.5 text-white" />
          </Link>
        </div>
      </div>

      {/* ─── 2. FUNNEL PIPELINE SUMMARY METRICS ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl liquid-silver-card flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-zinc-500 block">Total Submitted Pitches</span>
            <span className="text-2xl font-bold text-[#0A0A0A] font-tabular">{counts.all}</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-zinc-100 border border-[#E5E4DF] flex items-center justify-center text-zinc-700">
            <FileCheck className="w-4 h-4 text-[#6A0D18]" />
          </div>
        </div>

        <div className="p-4 rounded-xl liquid-silver-card flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-zinc-500 block">Pending Brand Decisions</span>
            <span className="text-2xl font-bold text-amber-600 font-tabular">{counts.pending}</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-700">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl liquid-silver-card flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-zinc-500 block">Accepted &amp; Funded</span>
            <span className="text-2xl font-bold text-emerald-600 font-tabular">
              {counts.accepted}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ─── 3. FILTER TABS BAR ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-[#E5E4DF] pb-3 overflow-x-auto">
        {(
          [
            { id: "all", label: "All Pitches", count: counts.all },
            { id: "pending", label: "Pending Review", count: counts.pending },
            { id: "shortlisted", label: "Shortlisted", count: counts.shortlisted },
            { id: "accepted", label: "Accepted", count: counts.accepted },
            { id: "declined", label: "Declined", count: counts.declined },
            { id: "withdrawn", label: "Withdrawn", count: counts.withdrawn },
          ] as const
        ).map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "liquid-burgundy-metal font-bold shadow-xs"
                  : "text-zinc-600 hover:bg-white hover:text-[#0A0A0A]"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[11px] font-bold px-1.5 py-0.5 rounded-lg font-tabular ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-[#FAF9F6] text-zinc-500 border border-[#E5E4DF]"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─── 4. PIPELINE LEDGER (CLEAN HAIRLINE TABLE) ───────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E5E4DF] overflow-hidden shadow-xs">
        {/* Desktop Table Header (text-xs / 12px) */}
        <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3.5 bg-[#FAF9F6] border-b border-[#E5E4DF] text-xs font-bold uppercase tracking-wider text-zinc-500">
          <div className="col-span-4">Campaign &amp; Brand</div>
          <div className="col-span-3">Deliverable Proposed</div>
          <div className="col-span-2">Quoted Rate</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-2 text-right">Action</div>
        </div>

        {/* Ledger Rows */}
        {filteredApplications.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-zinc-300 mx-auto" />
            <h3 className="text-sm font-bold text-[#0A0A0A]">No applications found</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              You haven't submitted any pitches in this category. Explore opportunities to pitch
              your media kit.
            </p>
            <Link
              href="/opportunities"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0A0A0A] text-white text-xs font-semibold mt-2 shadow-xs cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Browse Open Briefs</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E4DF]">
            {filteredApplications.map((app) => {
              const isAccepted = app.status === "accepted";
              const isPending = app.status === "pending";
              const isShortlisted = app.status === "shortlisted";
              const isWithdrawn = app.status === "withdrawn";

              return (
                <div
                  key={app.id}
                  onClick={() => setViewingPitch(app)}
                  className="p-5 lg:px-6 lg:py-4 flex flex-col lg:grid lg:grid-cols-12 gap-4 items-start lg:items-center hover:bg-[#FAF9F6] transition-colors cursor-pointer group"
                >
                  {/* Col 1: Campaign & Brand (4 cols) */}
                  <div className="lg:col-span-4 flex items-center gap-3 min-w-0 w-full">
                    {app.brandLogoUrl ? (
                      <img
                        src={app.brandLogoUrl}
                        alt={app.brandName}
                        className="w-10 h-10 rounded-xl object-cover border border-[#E5E4DF] shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-[#0A0A0A] text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {app.brandInitials}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#0A0A0A] truncate">
                          {app.brandName}
                        </span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#6A0D18] shrink-0" />
                      </div>
                      <h4 className="text-xs font-semibold text-zinc-700 truncate mt-0.5 group-hover:text-[#6A0D18] transition-colors">
                        {app.campaignTitle}
                      </h4>
                      <span className="text-[11px] text-zinc-400 font-tabular block">
                        Pitched on{" "}
                        {new Date(app.appliedDate).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Col 2: Deliverable Proposed (3 cols) */}
                  <div className="lg:col-span-3 text-xs w-full">
                    <span className="lg:hidden text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">
                      Proposed Deliverable
                    </span>
                    <span className="font-semibold text-[#0A0A0A] block">
                      {app.deliverableProposed}
                    </span>
                    <span className="text-[11px] text-zinc-500 capitalize">
                      {app.platform} integration
                    </span>
                  </div>

                  {/* Col 3: Quoted Rate (2 cols) */}
                  <div className="lg:col-span-2 text-xs w-full">
                    <span className="lg:hidden text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">
                      Quoted Rate
                    </span>
                    <span className="text-sm font-bold text-[#0A0A0A] font-tabular block">
                      ₹{app.quotedRate.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[11px] text-emerald-600 font-semibold">
                      Milestone Protected
                    </span>
                  </div>

                  {/* Col 4: Status Pill (1 col) */}
                  <div className="lg:col-span-1 w-full">
                    {isAccepted ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70 whitespace-nowrap">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Accepted</span>
                      </span>
                    ) : isShortlisted ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#FDF6F7] text-[#6A0D18] border border-[#EED8DC] whitespace-nowrap">
                        <Sparkles className="w-3.5 h-3.5 text-[#6A0D18]" />
                        <span>Shortlisted</span>
                      </span>
                    ) : isPending ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/70 whitespace-nowrap">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Reviewing</span>
                      </span>
                    ) : isWithdrawn ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-100 text-zinc-500 border border-zinc-200 whitespace-nowrap">
                        <span>Withdrawn</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200 whitespace-nowrap">
                        <span>Declined</span>
                      </span>
                    )}
                  </div>

                  {/* Col 5: Actions (2 cols) */}
                  <div className="lg:col-span-2 flex items-center justify-start lg:justify-end gap-2 w-full pt-2 lg:pt-0 border-t lg:border-t-0 border-[#E5E4DF]">
                    {isAccepted ? (
                      <Link
                        href="/my-campaigns"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A0A0A] hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                      >
                        <span>Workspace</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingPitch(app);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#FAF9F6] hover:bg-zinc-100 border border-[#E5E4DF] text-xs font-semibold text-zinc-700 transition-colors cursor-pointer"
                          title="View your submitted pitch proposal"
                        >
                          <Eye className="w-3.5 h-3.5 text-zinc-500" />
                          <span>View Pitch</span>
                        </button>
                        {!isWithdrawn && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleWithdraw(app);
                            }}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Withdraw pitch proposal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── 5. INTERACTIVE RIGHT-HAND SLIDE-OVER PITCH DRAWER ────────────────── */}
      {viewingPitch && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 ease-out"
            onClick={() => setViewingPitch(null)}
          />

          {/* Drawer Container */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-8 sm:pl-12">
            <div className="w-screen max-w-md sm:max-w-lg bg-white border-l border-[#E5E4DF] shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300 ease-out">
              {/* Header */}
              <div className="p-6 border-b border-[#E5E4DF] bg-[#FAF9F6] flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-[#FDF6F7] text-[#6A0D18] border border-[#EED8DC]">
                      PITCH DOSSIER
                    </span>
                    <span className="text-zinc-400">•</span>
                    <span className="text-xs font-semibold text-zinc-600 capitalize">
                      {viewingPitch.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-[#0A0A0A] leading-snug">
                    {viewingPitch.campaignTitle}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    {viewingPitch.brandLogoUrl ? (
                      <img
                        src={viewingPitch.brandLogoUrl}
                        alt={viewingPitch.brandName}
                        className="w-5 h-5 rounded-md object-cover border border-[#E5E4DF]"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-md bg-[#0A0A0A] text-white font-bold text-[11px] flex items-center justify-center">
                        {viewingPitch.brandInitials}
                      </div>
                    )}
                    <span className="text-xs font-semibold text-zinc-700">
                      {viewingPitch.brandName}
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#6A0D18]" />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setViewingPitch(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-[#0A0A0A] hover:bg-zinc-200/60 transition-colors cursor-pointer"
                  title="Close Drawer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Body Content */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
                {/* Rate & Turnaround Summary */}
                <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-[#FAF9F6] border border-[#E5E4DF]">
                  <div>
                    <span className="text-[11px] font-medium text-zinc-500 block mb-0.5">
                      Quoted INR Rate
                    </span>
                    <span className="text-lg font-bold text-[#0A0A0A] font-tabular">
                      ₹{viewingPitch.quotedRate.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Milestone Protected
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-zinc-500 block mb-0.5">
                      Turnaround Timeline
                    </span>
                    <span className="text-sm font-bold text-[#0A0A0A] block">
                      5–7 Business Days
                    </span>
                    <span className="text-[11px] text-zinc-500 block mt-0.5">
                      48h brand review window
                    </span>
                  </div>
                </div>

                {/* Scope Specifications */}
                <div className="p-4 rounded-xl border border-[#E5E4DF] bg-white space-y-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                    Deliverable Specifications
                  </span>
                  <div className="flex items-center justify-between py-1.5 border-b border-[#E5E4DF]/60">
                    <span className="text-zinc-500">Deliverable Format</span>
                    <span className="font-semibold text-[#0A0A0A]">
                      {viewingPitch.deliverableProposed}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-[#E5E4DF]/60">
                    <span className="text-zinc-500">Platform Channel</span>
                    <span className="font-semibold text-[#0A0A0A] capitalize">
                      {viewingPitch.platform}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-zinc-500">Submission Date</span>
                    <span className="font-semibold text-[#0A0A0A] font-tabular">
                      {new Date(viewingPitch.appliedDate).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Pitch Narrative */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                    Submitted Pitch Note
                  </span>
                  <div className="p-4 rounded-xl border border-[#E5E4DF] bg-[#FAF9F6] text-zinc-700 leading-relaxed font-normal whitespace-pre-wrap text-xs">
                    {viewingPitch.pitchMessage}
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-5 border-t border-[#E5E4DF] bg-white flex items-center justify-between gap-3">
                {viewingPitch.status === "withdrawn" ? (
                  <span className="text-xs font-semibold text-zinc-400 px-3 py-2 rounded-lg bg-zinc-100 border border-zinc-200">
                    Pitch Withdrawn
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleWithdraw(viewingPitch)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Withdraw Pitch</span>
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <Link
                    href="/messages"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#E5E4DF] hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition-colors shadow-2xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Message Brand</span>
                  </Link>

                  {viewingPitch.status === "accepted" && (
                    <Link
                      href="/my-campaigns"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0A0A0A] hover:bg-zinc-800 text-white text-xs font-semibold transition-colors shadow-xs"
                    >
                      <span>Go to Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
