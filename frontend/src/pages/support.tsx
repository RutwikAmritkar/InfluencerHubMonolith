import { useState, useRef } from "react";
import {
  ShieldAlert,
  Wallet,
  Flag,
  Wrench,
  UploadCloud,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  FileText,
  Lock,
  X,
  FileCheck2,
} from "lucide-react";
import { toast } from "sonner";

type IssueCategory = "payout" | "fraud" | "scope" | "technical";

interface SupportTicket {
  id: string;
  categoryLabel: string;
  subject: string;
  campaignRef?: string;
  status: "Under Review" | "Payout Held" | "Resolved";
  updatedAt: string;
  lastNote: string;
}

const CATEGORIES: Array<{
  id: IssueCategory;
  title: string;
  subtitle: string;
  icon: typeof Wallet;
  badge?: string;
}> = [
  {
    id: "payout",
    title: "Milestone & Payout Dispute",
    subtitle: "Delayed milestone approval, payout hold, or UPI settlement issue",
    icon: Wallet,
    badge: "Priority SLA",
  },
  {
    id: "fraud",
    title: "Report Fraud or Scam",
    subtitle: "Off-platform payment pressure, fake brand, or free-work solicitation",
    icon: ShieldAlert,
    badge: "Trust & Safety",
  },
  {
    id: "scope",
    title: "Brand Scope / Deliverable Issue",
    subtitle: "Unpaid extra revisions, missing sample shipment, or brief mismatch",
    icon: Flag,
  },
  {
    id: "technical",
    title: "Account & Technical Bug",
    subtitle: "Instagram/YouTube API sync delay, upload error, or profile issue",
    icon: Wrench,
  },
];

const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: "CB-1048",
    categoryLabel: "Milestone & Payout",
    subject: "Milestone 1 approval pending past 72h review window",
    campaignRef: "NovaTech Gear • Everyday Desk Setup",
    status: "Under Review",
    updatedAt: "2 hours ago",
    lastNote:
      "Trust & Safety specialist assigned. If brand does not respond within 24h, auto-release triggers.",
  },
  {
    id: "CB-1019",
    categoryLabel: "Fraud Report",
    subject: "Brand requested shipping fee deposit via WhatsApp",
    campaignRef: "Unverified Listing #884",
    status: "Resolved",
    updatedAt: "Nov 08, 2026",
    lastNote:
      "Listing permanently banned and flagged across CreatorsBrand. Your account remains protected.",
  },
];

export default function SupportAndDisputes() {
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory>("payout");
  const [linkedCampaign, setLinkedCampaign] = useState("camp-1");
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [freezeEscrow, setFreezeEscrow] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [submittedBanner, setSubmittedBanner] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const names = Array.from(e.target.files).map((f) => f.name);
      setAttachedFiles((prev) => [...prev, ...names]);
      toast.success(`${names.length} file(s) attached as evidence.`);
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !details.trim()) return;

    const catObj = CATEGORIES.find((c) => c.id === selectedCategory)!;
    const campaignMap: Record<string, string | undefined> = {
      "camp-1": "Glow Cosmetics • Summer Skincare Launch",
      "camp-2": "NovaTech Gear • Everyday Desk Setup & Unboxing",
      "camp-3": "UrbanFit Apparel • Winter Athleisure Drop",
      none: undefined,
    };

    const newTicket: SupportTicket = {
      id: `CB-${Math.floor(1050 + Math.random() * 900)}`,
      categoryLabel: catObj.title.split(" ")[0],
      subject: subject.trim(),
      campaignRef: campaignMap[linkedCampaign],
      status: freezeEscrow ? "Payout Held" : "Under Review",
      updatedAt: "Just now",
      lastNote:
        "Ticket logged with audited workspace timestamps. A resolution specialist will respond within 4 hours.",
    };

    setTickets((prev) => [newTicket, ...prev]);
    setSubject("");
    setDetails("");
    setFreezeEscrow(false);
    setAttachedFiles([]);
    setSubmittedBanner(true);
    toast.success("Dispute & report ticket registered with Trust & Safety.");
    setTimeout(() => setSubmittedBanner(false), 5000);
  };

  return (
    <div className="workspace-canvas min-h-screen text-[#0A0A0A] space-y-6 antialiased pb-16">
      {/* ─── Header ─── */}
      <div className="border-b border-[#E5E4DF] pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6A0D18] mb-1">
            Creator Protection &amp; Trust
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-[#0A0A0A]">
            Support &amp;{" "}
            <span className="font-serif italic font-normal text-[#6A0D18]">Disputes</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Report suspicious briefs, raise milestone payment disputes, or get priority assistance
            from our Trust &amp; Safety team.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-[#E5E4DF] text-xs font-medium text-zinc-700 self-start sm:self-auto shadow-2xs">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>All chat &amp; brief logs are tamper-evident</span>
        </div>
      </div>

      {/* Confirmation Toast Banner */}
      {submittedBanner && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-xs text-emerald-900 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">
              Report submitted successfully. Your ticket is now tracked in the Resolution Ledger on
              the right.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSubmittedBanner(false)}
            className="font-semibold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ─── Asymmetric 7 / 5 Grid ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT 7 COLUMNS: Structured Issue & Fraud Reporting Form */}
        <form
          onSubmit={handleSubmit}
          className="xl:col-span-7 bg-white rounded-2xl border border-[#E5E4DF] p-6 lg:p-7 shadow-xs space-y-6"
        >
          <div>
            <h2 className="text-sm font-bold text-[#0A0A0A]">1. Select Issue Category</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Routing to the right specialist ensures faster resolution.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between space-y-2.5 cursor-pointer ${
                      isSelected
                        ? "border-[#0A0A0A] bg-[#FAF9F6] ring-1 ring-[#0A0A0A]"
                        : "border-[#E5E4DF] bg-white hover:border-zinc-400"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div
                        className={`p-2 rounded-lg border ${
                          isSelected
                            ? "bg-[#0A0A0A] text-white border-[#0A0A0A]"
                            : "bg-[#FAF9F6] text-zinc-700 border-[#E5E4DF]"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      {cat.badge && (
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            cat.id === "fraud"
                              ? "bg-rose-50 text-rose-700 border border-rose-200/70"
                              : "bg-[#FDF6F7] text-[#6A0D18] border border-[#EED8DC]"
                          }`}
                        >
                          {cat.badge}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#0A0A0A] block">{cat.title}</span>
                      <span className="text-xs text-zinc-500 leading-snug block mt-0.5">
                        {cat.subtitle}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Campaign Reference & Details */}
          <div className="space-y-4 pt-2 border-t border-[#E5E4DF]">
            <h2 className="text-sm font-bold text-[#0A0A0A]">2. Provide Context &amp; Evidence</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700">
                  Related Campaign / Brand
                </label>
                <select
                  value={linkedCampaign}
                  onChange={(e) => setLinkedCampaign(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#E5E4DF] bg-[#FAF9F6] text-xs font-semibold text-[#0A0A0A] focus:outline-none focus:border-[#6A0D18] cursor-pointer"
                >
                  <option value="camp-1">Glow Cosmetics — Summer Skincare Launch</option>
                  <option value="camp-2">NovaTech Gear — Everyday Desk Setup &amp; Unboxing</option>
                  <option value="camp-3">UrbanFit Apparel — Winter Athleisure Drop</option>
                  <option value="none">General / Unlisted Brand</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700">Issue Summary</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Brand asking to move payment outside platform"
                  className="w-full h-10 px-3 rounded-lg border border-[#E5E4DF] bg-[#FAF9F6] text-xs text-[#0A0A0A] placeholder:text-zinc-400 focus:outline-none focus:border-[#6A0D18]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-700">
                Detailed Description
              </label>
              <textarea
                rows={4}
                required
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Include dates, deliverable links, or specific messages. Our team automatically attaches your Deal Discussion history if a campaign is selected."
                className="w-full p-3.5 rounded-xl border border-[#E5E4DF] bg-[#FAF9F6] text-xs text-[#0A0A0A] placeholder:text-zinc-400 leading-relaxed focus:outline-none focus:border-[#6A0D18]"
              />
            </div>

            {/* Evidence Attachment Dropzone */}
            <div className="p-4 rounded-xl border border-dashed border-[#D6D4CC] bg-[#FAF9F6]/70 flex flex-col sm:flex-row items-center justify-between gap-3">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white border border-[#E5E4DF] text-zinc-600">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-[#0A0A0A] block">
                    Attach Screenshots or Proof (Optional)
                  </span>
                  <span className="text-xs text-zinc-500">
                    PNG, JPG, or PDF up to 15MB (e.g., external DMs, draft timestamps)
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-zinc-50 border border-[#E5E4DF] text-xs font-semibold text-[#0A0A0A] transition-colors shrink-0 cursor-pointer shadow-2xs"
              >
                Select Files
              </button>
            </div>

            {/* Attached files list */}
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {attachedFiles.map((name, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#E5E4DF] text-xs font-medium text-zinc-700"
                  >
                    <FileCheck2 className="w-3.5 h-3.5 text-[#6A0D18]" />
                    <span className="truncate max-w-[180px]">{name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="p-0.5 text-zinc-400 hover:text-red-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Conditional Dispute Hold Option for Active Disputes */}
            {(selectedCategory === "payout" || selectedCategory === "fraud") && (
              <label className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={freezeEscrow}
                  onChange={(e) => setFreezeEscrow(e.target.checked)}
                  className="mt-0.5 rounded border-amber-400 text-[#0A0A0A] focus:ring-0"
                />
                <div className="text-xs">
                  <span className="font-bold text-amber-950 block">
                    Place immediate dispute hold on campaign payout
                  </span>
                  <span className="text-amber-800">
                    Prevents unilateral cancellation or fund clawback while Trust &amp; Safety
                    reviews submitted deliverables.
                  </span>
                </div>
              </label>
            )}
          </div>

          <div className="pt-2 flex items-center justify-between gap-4">
            <span className="text-xs text-zinc-500">
              False fraud reports may affect account trust standing.
            </span>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg liquid-burgundy-metal text-xs font-semibold shrink-0 cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5 text-white" />
              <span>Submit Report</span>
            </button>
          </div>
        </form>

        {/* RIGHT 5 COLUMNS: SLA Guarantees & Live Resolution Ledger */}
        <div className="xl:col-span-5 space-y-6">
          {/* SLA Trust Card */}
          <div className="bg-white rounded-2xl border border-[#E5E4DF] p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0A0A0A]">
              <AlertTriangle className="w-4 h-4 text-[#6A0D18]" />
              <span>Safety &amp; Anti-Fraud Policy</span>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Never accept off-platform UPI/bank transfers or pay "shipping deposits" to receive
              brand samples. CreatorsBrand guarantees{" "}
              <strong className="text-[#0A0A0A]">100% payout protection</strong> only for
              deliverables tracked inside verified Milestone Agreements.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E5E4DF] text-xs">
              <div>
                <span className="text-zinc-400 block">Fraud &amp; Payment SLA</span>
                <span className="font-bold text-[#0A0A0A] font-tabular">Under 4 Hours</span>
              </div>
              <div>
                <span className="text-zinc-400 block">General Support SLA</span>
                <span className="font-bold text-[#0A0A0A] font-tabular">Under 24 Hours</span>
              </div>
            </div>
          </div>

          {/* Active & Past Tickets Ledger */}
          <section className="bg-white rounded-2xl border border-[#E5E4DF] shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E5E4DF] flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#0A0A0A]">Your Resolution Ledger</h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Track open disputes and Trust &amp; Safety responses
                </p>
              </div>
              <FileText className="w-4 h-4 text-zinc-400" />
            </div>

            <div className="divide-y divide-[#E5E4DF]">
              {tickets.map((t) => (
                <div key={t.id} className="p-5 space-y-2.5 hover:bg-[#FAF9F6]/70 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#6A0D18]">{t.id}</span>
                      <span className="text-zinc-300">•</span>
                      <span className="text-xs font-semibold text-zinc-600">{t.categoryLabel}</span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border ${
                        t.status === "Resolved"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200/70"
                          : t.status === "Payout Held"
                            ? "bg-rose-50 text-rose-700 border-rose-200/70"
                            : "bg-amber-50 text-amber-700 border-amber-200/70"
                      }`}
                    >
                      {t.status === "Resolved" ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      {t.status}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-[#0A0A0A] leading-snug">{t.subject}</h3>

                  {t.campaignRef && (
                    <p className="text-xs text-zinc-500 font-medium">Linked: {t.campaignRef}</p>
                  )}

                  <div className="p-3 rounded-lg bg-[#FAF9F6] border border-[#E5E4DF] text-xs text-zinc-600 leading-relaxed">
                    {t.lastNote}
                  </div>

                  <div className="text-xs text-zinc-400 font-tabular">
                    Last updated {t.updatedAt}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
