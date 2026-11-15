import { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
import {
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  IndianRupee,
  MapPin,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  SlidersHorizontal,
  X,
  FileCheck,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import {
  OpportunityItem,
  INITIAL_OPPORTUNITIES,
  getSavedApplications,
  saveApplication,
  ApplicationItem,
} from "@/services/creator-funnel";

export default function Opportunities() {
  const [opportunities] = useState<OpportunityItem[]>(INITIAL_OPPORTUNITIES);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [minPayoutFilter, setMinPayoutFilter] = useState<number>(0);

  // Apply Modal State
  const [pitchModalItem, setPitchModalItem] = useState<OpportunityItem | null>(null);
  const [quotedRate, setQuotedRate] = useState<string>("");
  const [pitchMessage, setPitchMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync applied campaigns from storage
  const loadApplications = () => {
    setApplications(getSavedApplications());
  };

  useEffect(() => {
    loadApplications();
    const handleUpdate = () => loadApplications();
    window.addEventListener("cb_applications_updated", handleUpdate);
    return () => window.removeEventListener("cb_applications_updated", handleUpdate);
  }, []);

  const appliedCampaignIds = useMemo(() => {
    return new Set(applications.filter((a) => a.status !== "withdrawn").map((a) => a.campaignId));
  }, [applications]);

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((op) => {
      const matchesSearch =
        search === "" ||
        op.title.toLowerCase().includes(search.toLowerCase()) ||
        op.brandName.toLowerCase().includes(search.toLowerCase()) ||
        op.description.toLowerCase().includes(search.toLowerCase());

      const matchesCategory = categoryFilter === "all" || op.category === categoryFilter;

      const matchesFormat = formatFilter === "all" || op.format === formatFilter;

      const matchesCity = cityFilter === "all" || op.city === cityFilter;

      const matchesPayout = minPayoutFilter === 0 || op.maxPayout >= minPayoutFilter;

      return matchesSearch && matchesCategory && matchesFormat && matchesCity && matchesPayout;
    });
  }, [opportunities, search, categoryFilter, formatFilter, cityFilter, minPayoutFilter]);

  const handleOpenPitchModal = (op: OpportunityItem) => {
    setPitchModalItem(op);
    setQuotedRate(String(op.minPayout));
    setPitchMessage(
      `Hi ${op.brandName} team! I'm very excited about the ${op.title}. My audience has high affinity for ${op.category} and I'd love to deliver high-retention content for this campaign.`
    );
  };

  const handleSubmitPitch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pitchModalItem) return;

    const rateNum = Number(quotedRate);
    if (!rateNum || rateNum <= 0) {
      toast.error("Please enter a valid quoted rate in ₹.");
      return;
    }

    if (!pitchMessage.trim()) {
      toast.error("Please provide a brief pitch message for the brand.");
      return;
    }

    setIsSubmitting(true);

    const newApp: ApplicationItem = {
      id: `app-${Date.now()}`,
      campaignId: pitchModalItem.id,
      campaignTitle: pitchModalItem.title,
      brandName: pitchModalItem.brandName,
      brandInitials: pitchModalItem.brandInitials,
      brandLogoUrl: pitchModalItem.brandLogoUrl,
      deliverableProposed: pitchModalItem.deliverable,
      quotedRate: rateNum,
      appliedDate: new Date().toISOString().split("T")[0],
      status: "pending",
      pitchMessage: pitchMessage.trim(),
      platform: pitchModalItem.format === "YT Shorts" ? "youtube" : "instagram",
    };

    saveApplication(newApp);
    setApplications(getSavedApplications());
    setIsSubmitting(false);
    setPitchModalItem(null);

    toast.success(
      `Pitch submitted for ${pitchModalItem.brandName}! Tracked in Stage 2 Applications.`
    );
  };

  return (
    <div className="workspace-canvas space-y-8 pb-16 antialiased text-[#0A0A0A]">
      {/* ─── 1. STAGE 1 FUNNEL HEADER ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-4 border-b border-[#E5E4DF]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60">
              Stage 1 of Funnel
            </span>
            <span className="text-zinc-400">•</span>
            <span className="text-xs font-semibold text-zinc-500">Discovery &amp; Open Briefs</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0A0A0A]">
            Marketplace{" "}
            <span className="font-serif italic font-normal text-blue-700">Opportunities</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-2xl">
            Filter verified, pre-funded brand briefs matching your audience demographics, delivery
            format, and starting rate card.
          </p>
        </div>

        {/* Funnel Progress Pill */}
        <Link
          href="/applications"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[#E5E4DF] hover:border-zinc-400 text-xs font-semibold text-[#0A0A0A] transition-all shadow-xs cursor-pointer group"
        >
          <FileCheck className="w-3.5 h-3.5 text-blue-700" />
          <span>View Pitched Applications ({applications.length})</span>
          <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* ─── 2. MULTI-AXIS FILTER CONTROLLER ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E5E4DF] p-4 sm:p-5 shadow-xs space-y-4">
        {/* Search Bar + Active Count */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search briefs by brand, product title, or keyword..."
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-[#E5E4DF] bg-[#FAF9F6] text-xs text-[#0A0A0A] placeholder:text-zinc-400 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-zinc-500 font-medium shrink-0">
            <span>
              Showing{" "}
              <strong className="text-[#0A0A0A] font-tabular">
                {filteredOpportunities.length}
              </strong>{" "}
              active briefs
            </span>
          </div>
        </div>

        {/* Hairline Divided Filter Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-[#E5E4DF]">
          {/* 1. Category */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-[#E5E4DF] bg-[#FAF9F6] text-xs font-semibold text-[#0A0A0A] focus:outline-none focus:border-blue-700 cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="Beauty & Lifestyle">Beauty &amp; Lifestyle</option>
              <option value="Tech & Gadgets">Tech &amp; Gadgets</option>
              <option value="Fashion & Apparel">Fashion &amp; Apparel</option>
              <option value="Food & Fitness">Food &amp; Fitness</option>
            </select>
          </div>

          {/* 2. Format */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block">
              Deliverable Format
            </label>
            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-[#E5E4DF] bg-[#FAF9F6] text-xs font-semibold text-[#0A0A0A] focus:outline-none focus:border-blue-700 cursor-pointer"
            >
              <option value="all">All Formats</option>
              <option value="9:16 Reels">9:16 Reels</option>
              <option value="YT Shorts">YT Shorts</option>
              <option value="Carousels">Carousels</option>
            </select>
          </div>

          {/* 3. City */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block">
              Target City
            </label>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-[#E5E4DF] bg-[#FAF9F6] text-xs font-semibold text-[#0A0A0A] focus:outline-none focus:border-blue-700 cursor-pointer"
            >
              <option value="all">All Locations (Pan-India)</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Delhi NCR">Delhi NCR</option>
              <option value="Pune">Pune</option>
              <option value="Hyderabad">Hyderabad</option>
            </select>
          </div>

          {/* 4. Minimum Payout */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block">
              Minimum Payout
            </label>
            <select
              value={minPayoutFilter}
              onChange={(e) => setMinPayoutFilter(Number(e.target.value))}
              className="w-full h-9 px-3 rounded-lg border border-[#E5E4DF] bg-[#FAF9F6] text-xs font-semibold text-[#0A0A0A] focus:outline-none focus:border-blue-700 cursor-pointer"
            >
              <option value={0}>Any Budget</option>
              <option value={30000}>₹30,000+ Min</option>
              <option value={45000}>₹45,000+ Min</option>
              <option value={60000}>₹60,000+ Min</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── 3. DISCOVERY GRID (STAGE 1 FULL-WIDTH BRIEFS) ───────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
        {filteredOpportunities.map((item) => {
          const isApplied = appliedCampaignIds.has(item.id);

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-[#E5E4DF] p-6 shadow-xs flex flex-col justify-between hover:border-zinc-400 transition-all space-y-5"
            >
              {/* Top Row: Brand Monogram + Title + Escrow Badge */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {item.brandLogoUrl ? (
                      <img
                        src={item.brandLogoUrl}
                        alt={item.brandName}
                        className="w-10 h-10 rounded-xl object-cover border border-[#E5E4DF] shadow-2xs"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-[#0A0A0A] text-white font-bold text-xs flex items-center justify-center">
                        {item.brandInitials}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#0A0A0A]">{item.brandName}</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />
                      </div>
                      <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-zinc-400" />
                        {item.city}
                      </span>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{item.escrowStatus}</span>
                  </span>
                </div>

                {/* Campaign Title & Deliverable Scope */}
                <div>
                  <h3 className="text-base font-bold text-[#0A0A0A] leading-snug">{item.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded-md bg-[#FAF9F6] border border-[#E5E4DF] text-xs font-semibold text-blue-700">
                      {item.format}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-[#FAF9F6] border border-[#E5E4DF] text-xs font-medium text-zinc-600">
                      {item.category}
                    </span>
                  </div>
                </div>

                {/* Description Narrative */}
                <p className="text-xs text-zinc-500 leading-relaxed line-clamp-3">
                  {item.description}
                </p>
              </div>

              {/* Bottom Card Footer: Deliverable, Budget Range & Funnel Action */}
              <div className="space-y-4 pt-4 border-t border-[#E5E4DF]">
                {/* Deliverable & Escrow Range Strip */}
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[11px] text-zinc-400 block">Deliverable Scope</span>
                    <span className="font-semibold text-[#0A0A0A]">{item.deliverable}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-zinc-400 block">Budget Range</span>
                    <span className="font-bold text-emerald-700 font-tabular text-sm">
                      ₹{item.minPayout.toLocaleString("en-IN")} – ₹
                      {item.maxPayout.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Action Bar with Linked State */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    <span>
                      Deadline:{" "}
                      <strong className="text-zinc-600 font-medium">{item.deadline}</strong>
                    </span>
                  </div>

                  {isApplied ? (
                    <Link
                      href="/applications"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FAF9F6] hover:bg-[#F2F1EC] border border-[#E5E4DF] text-xs font-semibold text-zinc-700 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Applied • View →</span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenPitchModal(item)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0A0A0A] hover:bg-zinc-800 text-white text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer shadow-xs"
                    >
                      <span>Apply with Pitch</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── 4. APPLY WITH PITCH MODAL ─────────────────────────────────────── */}
      {pitchModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#E5E4DF] max-w-lg w-full p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-[#E5E4DF] pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block mb-0.5">
                  Direct Creator Pitch
                </span>
                <h3 className="text-lg font-bold text-[#0A0A0A]">
                  Apply for {pitchModalItem.title}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Brand: {pitchModalItem.brandName} • Budget: ₹
                  {pitchModalItem.minPayout.toLocaleString("en-IN")} – ₹
                  {pitchModalItem.maxPayout.toLocaleString("en-IN")}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPitchModalItem(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-[#0A0A0A] hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Pitch Form */}
            <form onSubmit={handleSubmitPitch} className="space-y-4">
              {/* Deliverable Recap Box */}
              <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E5E4DF] text-xs space-y-1">
                <span className="text-zinc-500 font-medium">Deliverable Required:</span>
                <p className="font-bold text-[#0A0A0A]">{pitchModalItem.deliverable}</p>
              </div>

              {/* Quoted Rate Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#0A0A0A]">
                  Your Quoted Fee (₹ INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={quotedRate}
                    onChange={(e) => setQuotedRate(e.target.value)}
                    placeholder="e.g. 45000"
                    className="w-full h-10 pl-8 pr-3 rounded-lg border border-[#E5E4DF] bg-white text-xs font-bold font-tabular text-[#0A0A0A] focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
                    required
                  />
                </div>
                <span className="text-[11px] text-zinc-400">
                  Protected by verified milestones once brand accepts your quote.
                </span>
              </div>

              {/* Pitch Narrative Textarea */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#0A0A0A]">
                  Pitch &amp; Creative Concept
                </label>
                <textarea
                  rows={4}
                  value={pitchMessage}
                  onChange={(e) => setPitchMessage(e.target.value)}
                  placeholder="Explain why your audience is a strong match, your proposed visual hook, and past results..."
                  className="w-full p-3 rounded-lg border border-[#E5E4DF] bg-white text-xs text-[#0A0A0A] leading-relaxed focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700 resize-none"
                  required
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E4DF]">
                <button
                  type="button"
                  onClick={() => setPitchModalItem(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0A0A0A] hover:bg-zinc-800 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer active:scale-[0.98]"
                >
                  <span>Submit Pitch to Brand</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
