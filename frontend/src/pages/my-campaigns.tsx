import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  Circle,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Calendar,
  Instagram,
  Link2,
  FileCheck2,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

type CampaignTab = "active" | "scheduled" | "completed";

interface DeliverableItem {
  id: string;
  title: string;
  spec: string;
  dueDate: string;
  status: "approved" | "in_review" | "pending";
  submittedUrl?: string;
}

interface ContractedCampaign {
  id: string;
  brandName: string;
  brandInitials: string;
  title: string;
  platform: string;
  totalEscrow: number;
  releasedAmount: number;
  deadline: string;
  tab: CampaignTab;
  summary: string;
  usageRights: string;
  hashtags: string[];
  deliverables: DeliverableItem[];
}

const INITIAL_CAMPAIGNS: ContractedCampaign[] = [
  {
    id: "camp-1",
    brandName: "Glow Cosmetics",
    brandInitials: "GC",
    title: "Summer Skincare Launch",
    platform: "Instagram",
    totalEscrow: 45000,
    releasedAmount: 15000,
    deadline: "Nov 24, 2026",
    tab: "active",
    summary:
      "Create 1 Instagram Reel and 2 Story frames featuring natural daylight product application for the new SPF 50 Glow Lotion.",
    usageRights: "30 Days Organic Whitelisting",
    hashtags: ["#GlowSPF50", "#CleanSkincareIndia", "#AD"],
    deliverables: [
      {
        id: "d1",
        title: "1× Instagram Reel (30–45s)",
        spec: "9:16 Vertical • Hook within first 2.5s • Natural daylight texture shot",
        dueDate: "Nov 18, 2026",
        status: "in_review",
        submittedUrl: "https://drive.google.com/file/d/glow-spf-reel-v1",
      },
      {
        id: "d2",
        title: "Story Frame #1 — Unboxing & Texture",
        spec: "15s Vertical • Close-up swatch + brand tag @glowcosmetics",
        dueDate: "Nov 22, 2026",
        status: "pending",
      },
      {
        id: "d3",
        title: "Story Frame #2 — Swipe-Up Link & Code",
        spec: "15s Vertical • Include MAYA15 discount sticker",
        dueDate: "Nov 24, 2026",
        status: "pending",
      },
    ],
  },
  {
    id: "camp-comp-1",
    brandName: "PureDew Skin",
    brandInitials: "PD",
    title: "Monsoon Hydration Essentials",
    platform: "Instagram",
    totalEscrow: 38000,
    releasedAmount: 38000,
    deadline: "Oct 18, 2026",
    tab: "completed",
    summary:
      "1× 9:16 Reel and 2 Stories demonstrating lightweight hydration serums during high-humidity season. Verified 42K organic reach.",
    usageRights: "Full Organic Usage Rights",
    hashtags: ["#PureDewHydration", "#MonsoonSkincare", "#AD"],
    deliverables: [
      {
        id: "d-comp-1",
        title: "1× 9:16 Reel (45s)",
        spec: "Full routine demonstration with verified ER",
        dueDate: "Oct 12, 2026",
        status: "approved",
        submittedUrl: "https://instagram.com/reel/C89218_demo",
      },
      {
        id: "d-comp-2",
        title: "2× Story Frames",
        spec: "Swipe-up link + ingredient transparency callout",
        dueDate: "Oct 15, 2026",
        status: "approved",
        submittedUrl: "https://instagram.com/stories/highlights/puredew",
      },
    ],
  },
];

export default function ContractedCampaigns() {
  const [campaigns, setCampaigns] = useState<ContractedCampaign[]>(INITIAL_CAMPAIGNS);
  const [activeTab, setActiveTab] = useState<CampaignTab>("active");
  const [selectedId, setSelectedId] = useState<string>("camp-1");
  const [linkInputs, setLinkInputs] = useState<Record<string, string>>({});

  const counts = {
    active: campaigns.filter((c) => c.tab === "active").length,
    scheduled: campaigns.filter((c) => c.tab === "scheduled").length,
    completed: campaigns.filter((c) => c.tab === "completed").length,
  };

  const visibleCampaigns = campaigns.filter((c) => c.tab === activeTab);
  const selectedCampaign = visibleCampaigns.find((c) => c.id === selectedId) || visibleCampaigns[0];

  const handleDeliverableSubmit = (campaignId: string, deliverableId: string) => {
    const url = linkInputs[deliverableId]?.trim();
    if (!url) {
      toast.error("Please enter a valid Google Drive, Dropbox, or live Reel URL.");
      return;
    }

    setCampaigns((prev) =>
      prev.map((camp) =>
        camp.id === campaignId
          ? {
              ...camp,
              deliverables: camp.deliverables.map((d) =>
                d.id === deliverableId ? { ...d, status: "in_review", submittedUrl: url } : d
              ),
            }
          : camp
      )
    );
    setLinkInputs((prev) => ({ ...prev, [deliverableId]: "" }));
    toast.success("Deliverable draft submitted! Brand notified for review.");
  };

  const handleDownloadPdf = () => {
    toast.success("Generating verified commercial agreement PDF dossier...");
    setTimeout(() => {
      window.print();
    }, 400);
  };

  return (
    <div className="workspace-canvas w-full min-h-screen bg-[#FAF9F6] text-[#0A0A0A] space-y-6 pb-16 antialiased font-sans">
      {/* ─── Header & Primary CTA ─── */}
      <div className="border-b border-[#E5E4DF] pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 mb-1">
            Stage 3 of Funnel • Execution Workspace
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-[#0A0A0A]">
            Contracted{" "}
            <span className="font-serif italic font-normal text-blue-700">Campaigns</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage confirmed brand partnerships, submit milestone drafts, and track deliverable
            payouts.
          </p>
        </div>

        <Link
          href="/opportunities"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0A0A0A] hover:bg-zinc-800 text-white text-xs font-semibold transition-colors self-start sm:self-auto cursor-pointer shadow-xs active:scale-[0.98]"
        >
          <span>Explore Opportunities</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* ─── Stage Filter Tabs + Compact Escrow Telemetry ─── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white border border-[#E5E4DF] shadow-2xs">
          {(
            [
              { id: "active", label: "Active", count: counts.active },
              { id: "scheduled", label: "Scheduled", count: counts.scheduled },
              { id: "completed", label: "Completed", count: counts.completed },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setActiveTab(t.id);
                const firstInTab = campaigns.find((c) => c.tab === t.id);
                if (firstInTab) setSelectedId(firstInTab.id);
              }}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === t.id
                  ? "bg-[#0A0A0A] text-white shadow-xs"
                  : "text-zinc-600 hover:text-[#0A0A0A]"
              }`}
            >
              <span>{t.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[11px] font-bold font-tabular ${
                  activeTab === t.id
                    ? "bg-white/20 text-white"
                    : "bg-[#FAF9F6] text-zinc-500 border border-[#E5E4DF]"
                }`}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="px-3.5 py-2 rounded-xl bg-white border border-[#E5E4DF] flex items-center gap-2 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-zinc-500">Agreed Payout:</span>
            <span className="font-bold text-[#0A0A0A] font-tabular">
              ₹{(selectedCampaign ? selectedCampaign.totalEscrow : 45000).toLocaleString("en-IN")}
            </span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-white border border-[#E5E4DF] flex items-center gap-2 shadow-2xs">
            <Clock className="w-4 h-4 text-blue-700" />
            <span className="text-zinc-500">Final Deadline:</span>
            <span className="font-bold text-[#0A0A0A]">
              {selectedCampaign ? selectedCampaign.deadline : "Nov 24, 2026"}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Main Asymmetric 7 / 5 Execution Grid ─── */}
      {visibleCampaigns.length > 0 && selectedCampaign ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* LEFT 7 COLUMNS: Campaign Progress & Inline Deliverable Checklist */}
          <div className="xl:col-span-7 space-y-6 min-w-0">
            {visibleCampaigns.map((camp) => {
              const completedCount = camp.deliverables.filter(
                (d) => d.status === "approved" || d.status === "in_review"
              ).length;
              const progressPct = Math.round((completedCount / camp.deliverables.length) * 100);

              return (
                <div
                  key={camp.id}
                  onClick={() => setSelectedId(camp.id)}
                  className={`bg-white rounded-2xl border transition-all shadow-xs overflow-hidden cursor-pointer ${
                    camp.id === selectedCampaign.id
                      ? "border-blue-700/60 ring-1 ring-blue-700/20"
                      : "border-[#E5E4DF] hover:border-zinc-400"
                  }`}
                >
                  {/* Card Top Bar */}
                  <div className="p-6 border-b border-[#E5E4DF] space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-zinc-900 text-white text-sm font-bold flex items-center justify-center shrink-0 shadow-2xs">
                          {camp.brandInitials}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-zinc-500">
                              {camp.brandName}
                            </span>
                            <span className="text-zinc-300">•</span>
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600">
                              <Instagram className="w-3.5 h-3.5 text-zinc-400" />
                              {camp.platform}
                            </span>
                          </div>
                          <h2 className="text-lg font-bold text-[#0A0A0A] mt-0.5">{camp.title}</h2>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-xs font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active Deal • ₹{camp.totalEscrow.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>

                    {/* Visual Milestone Progress Bar */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#0A0A0A]">
                          Deliverable Progress ({completedCount} of {camp.deliverables.length}{" "}
                          submitted)
                        </span>
                        <span className="font-bold text-blue-700 font-tabular">{progressPct}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[#F2F1EC] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-700 transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Individual Deliverable Rows (No modal needed to submit) */}
                  <div className="divide-y divide-[#E5E4DF]">
                    {camp.deliverables.map((del) => (
                      <div
                        key={del.id}
                        className="p-6 space-y-3 bg-white hover:bg-[#FAF9F6]/50 transition-colors"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            {del.status === "approved" ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            ) : del.status === "in_review" ? (
                              <Clock className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                            ) : (
                              <Circle className="w-4 h-4 text-zinc-300 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <h3 className="text-sm font-bold text-[#0A0A0A]">{del.title}</h3>
                              <p className="text-xs text-zinc-500 mt-0.5">{del.spec}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            <span className="text-xs text-zinc-500 font-tabular">
                              Due {del.dueDate}
                            </span>
                            {del.status === "in_review" ? (
                              <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/70 text-xs font-semibold">
                                Draft Under Review
                              </span>
                            ) : del.status === "approved" ? (
                              <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-xs font-semibold">
                                Approved
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-md bg-[#FAF9F6] text-zinc-600 border border-[#E5E4DF] text-xs font-medium">
                                Awaiting Submission
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Inline Link Submission or Submitted Preview */}
                        {del.submittedUrl ? (
                          <div className="ml-7 flex items-center justify-between gap-3 px-3.5 py-2 rounded-lg bg-[#FAF9F6] border border-[#E5E4DF] text-xs">
                            <span className="text-zinc-600 truncate font-mono text-[11px]">
                              {del.submittedUrl}
                            </span>
                            <a
                              href={del.submittedUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-blue-700 font-semibold shrink-0 hover:underline cursor-pointer"
                            >
                              <span>Preview</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        ) : (
                          <div className="ml-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                            <div className="relative flex-1">
                              <Link2 className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="url"
                                value={linkInputs[del.id] || ""}
                                onChange={(e) =>
                                  setLinkInputs((prev) => ({
                                    ...prev,
                                    [del.id]: e.target.value,
                                  }))
                                }
                                placeholder="Paste Drive draft link or live Instagram post URL..."
                                className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#E5E4DF] bg-[#FAF9F6] text-xs text-[#0A0A0A] placeholder:text-zinc-400 focus:outline-none focus:border-blue-700"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeliverableSubmit(camp.id, del.id);
                              }}
                              className="px-4 h-9 rounded-lg bg-[#0A0A0A] hover:bg-zinc-800 text-white text-xs font-semibold transition-colors shrink-0 cursor-pointer shadow-xs active:scale-[0.98]"
                            >
                              Submit Link
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT 5 COLUMNS: Sticky Brief Guidelines & Escrow Ledger */}
          <aside className="xl:col-span-5 xl:sticky xl:top-20 bg-white rounded-2xl border border-[#E5E4DF] shadow-xs divide-y divide-[#E5E4DF] min-w-0">
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                  Contract Brief &amp; Terms
                </span>
                <span className="text-xs text-zinc-400 font-tabular">
                  Final Deadline: {selectedCampaign.deadline}
                </span>
              </div>
              <h3 className="text-base font-bold text-[#0A0A0A]">
                {selectedCampaign.title} — {selectedCampaign.brandName}
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">{selectedCampaign.summary}</p>
            </div>

            {/* Required Tags & Usage Rights */}
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Usage Rights</span>
                <span className="font-semibold text-[#0A0A0A]">{selectedCampaign.usageRights}</span>
              </div>

              <div className="space-y-2">
                <span className="text-xs text-zinc-500 block">
                  Mandatory Hashtags &amp; Disclosures
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCampaign.hashtags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-md bg-[#FAF9F6] border border-[#E5E4DF] text-xs font-mono font-medium text-[#0A0A0A]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Milestone Breakdown */}
            <div className="p-6 space-y-3 bg-[#FAF9F6]/60">
              <h4 className="text-xs font-bold text-[#0A0A0A]">Milestone Schedule</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600">Milestone 1: Reel Draft &amp; Live Link</span>
                  <span className="font-semibold text-[#0A0A0A] font-tabular">₹30,000</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600">Milestone 2: 2× Story Frames Live</span>
                  <span className="font-semibold text-[#0A0A0A] font-tabular">₹15,000</span>
                </div>
              </div>
            </div>

            {/* Direct Thread Action */}
            <div className="p-5 flex items-center gap-3">
              <Link
                href="/messages"
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#0A0A0A] hover:bg-zinc-800 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs active:scale-[0.98]"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Message {selectedCampaign.brandName}</span>
              </Link>
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-lg border border-[#E5E4DF] bg-[#FAF9F6] hover:bg-zinc-100 text-xs font-semibold text-[#0A0A0A] transition-colors cursor-pointer shadow-2xs"
              >
                <FileCheck2 className="w-3.5 h-3.5 text-zinc-500" />
                <span>Contract PDF</span>
              </button>
            </div>
          </aside>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E5E4DF] p-12 text-center space-y-2">
          <p className="text-sm font-bold text-[#0A0A0A]">No {activeTab} campaigns yet</p>
          <p className="text-xs text-zinc-500">
            Accepted brand applications automatically appear here once terms are confirmed.
          </p>
        </div>
      )}
    </div>
  );
}

export { ContractedCampaigns as MyCampaigns };
