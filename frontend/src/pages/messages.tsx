import { useState, useRef, useEffect } from "react";
import {
  Search,
  Send,
  Paperclip,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  Clock,
  FileText,
  Sparkles,
  PanelRight,
  IndianRupee,
  ArrowLeft,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  sender: "brand" | "creator" | "system";
  text: string;
  time: string;
}

interface Thread {
  id: string;
  brandName: string;
  initials: string;
  campaignTitle: string;
  deliverable: string;
  amount: string;
  escrowStatus: "Terms Confirmed" | "Draft Review" | "In Negotiation";
  unread: boolean;
  lastTime: string;
  deadline: string;
  messages: Message[];
}

const INITIAL_THREADS: Thread[] = [
  {
    id: "t1",
    brandName: "Glow Cosmetics",
    initials: "GC",
    campaignTitle: "Summer Skincare Launch",
    deliverable: "1× Instagram Reel (30–45s)",
    amount: "₹45,000",
    escrowStatus: "Terms Confirmed",
    unread: true,
    lastTime: "14:49",
    deadline: "Nov 24, 2026",
    messages: [
      {
        id: "m1",
        sender: "brand",
        text: "Hi Maya! We reviewed your Media Kit and loved your aesthetic and Mumbai audience engagement.",
        time: "13:07",
      },
      {
        id: "m2",
        sender: "creator",
        text: "Thank you so much! I'm a huge fan of your clean skincare line and would love to collaborate on the launch Reel.",
        time: "14:02",
      },
      {
        id: "m3",
        sender: "system",
        text: "Glow Cosmetics confirmed ₹45,000 agreed payout for Summer Skincare Launch.",
        time: "14:15",
      },
      {
        id: "m4",
        sender: "brand",
        text: "Terms are confirmed! Are you available to share the initial hook script by Wednesday?",
        time: "14:49",
      },
    ],
  },
  {
    id: "t2",
    brandName: "NovaTech Gear",
    initials: "NT",
    campaignTitle: "Everyday Desk Setup",
    deliverable: "1× YT Short + 2× IG Stories",
    amount: "₹32,000",
    escrowStatus: "Draft Review",
    unread: false,
    lastTime: "Yesterday",
    deadline: "Nov 20, 2026",
    messages: [
      {
        id: "m21",
        sender: "creator",
        text: "Uploaded the rough cut link for the desk mat & wireless charger integration.",
        time: "Yesterday",
      },
      {
        id: "m22",
        sender: "brand",
        text: "Thanks for submitting the draft video! Our brand team is reviewing the lighting cuts now.",
        time: "Yesterday",
      },
    ],
  },
  {
    id: "t3",
    brandName: "UrbanFit Apparel",
    initials: "UF",
    campaignTitle: "Winter Athleisure Drop",
    deliverable: "2× 9:16 Styling Reels",
    amount: "₹55,000",
    escrowStatus: "In Negotiation",
    unread: false,
    lastTime: "Nov 12",
    deadline: "Nov 30, 2026",
    messages: [
      {
        id: "m31",
        sender: "brand",
        text: "The contract details have been updated with ₹55,000 inclusive of 30-day organic usage rights.",
        time: "Nov 12",
      },
    ],
  },
];

export default function DealDiscussions() {
  const [threads, setThreads] = useState<Thread[]>(INITIAL_THREADS);
  const [activeId, setActiveId] = useState<string>("t1");
  const [filter, setFilter] = useState<"all" | "active">("all");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [showDealDrawer, setShowDealDrawer] = useState(true);
  const [showMobileChat, setShowMobileChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeThread = threads.find((t) => t.id === activeId) || threads[0];

  const filteredThreads = threads.filter((t) => {
    const matchesSearch =
      t.brandName.toLowerCase().includes(search.toLowerCase()) ||
      t.campaignTitle.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || t.escrowStatus === "Terms Confirmed";
    return matchesSearch && matchesFilter;
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread.messages, activeId]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    const newMsg: Message = {
      id: `m-${Date.now()}`,
      sender: "creator",
      text: draft.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThread.id
          ? { ...t, messages: [...t.messages, newMsg], lastTime: newMsg.time }
          : t
      )
    );
    setDraft("");
  };

  const handleSelectThread = (id: string) => {
    setActiveId(id);
    setShowMobileChat(true);
    setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, unread: false } : t)));
  };

  const handleAttach = () => {
    toast.info("Deliverable upload: Select script draft, reel rough cut, or live link.");
  };

  const handleSubmitDraft = () => {
    toast.success(`Draft deliverable submitted for ${activeThread.brandName} review!`);
  };

  return (
    <div className="w-full h-[calc(100vh-3.5rem-4rem)] md:h-[calc(100vh-3.5rem)] bg-[#FAF9F6] text-[#0A0A0A] flex flex-col overflow-hidden font-sans antialiased">
      {/* ─── Compact Full-Bleed Workspace Subheader ─── */}
      <div className="px-4 sm:px-6 py-3.5 border-b border-[#E5E4DF] bg-[#FAF9F6] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-bold tracking-tight text-[#0A0A0A]">
            Deal <span className="font-serif italic font-normal text-[#6A0D18]">Discussions</span>
          </h1>
          <span className="hidden md:inline text-xs text-zinc-500">
            Audited correspondence linked to milestone deliverables
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-[#E5E4DF] text-xs font-medium text-zinc-600 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Milestone-Protected Thread</span>
          </span>
          <button
            type="button"
            onClick={() => setShowDealDrawer(!showDealDrawer)}
            className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white hover:bg-zinc-50 border border-[#E5E4DF] text-xs font-semibold text-[#0A0A0A] transition-colors cursor-pointer shadow-2xs"
          >
            <PanelRight className="w-3.5 h-3.5 text-zinc-500" />
            <span>{showDealDrawer ? "Hide Brief" : "Show Brief"}</span>
          </button>
        </div>
      </div>

      {/* ─── Full-Screen 3-Pane Split Container ─── */}
      <div className="flex-1 flex min-h-0 w-full overflow-hidden">
        {/* ─── PANE 1: Left Conversation Inbox ─── */}
        <aside
          className={cn(
            "w-full sm:w-80 lg:w-88 border-r border-[#E5E4DF] bg-white flex flex-col shrink-0 min-h-0",
            showMobileChat ? "hidden sm:flex" : "flex"
          )}
        >
          {/* Search & Filter Tabs */}
          <div className="p-4 border-b border-[#E5E4DF] space-y-3 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search brands or briefs..."
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#E5E4DF] bg-[#FAF9F6] text-xs text-[#0A0A0A] placeholder:text-zinc-400 focus:outline-none focus:border-[#6A0D18]"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  filter === "all"
                    ? "bg-[#0A0A0A] text-white shadow-xs"
                    : "bg-[#FAF9F6] text-zinc-600 hover:text-[#0A0A0A]"
                }`}
              >
                All Deals ({threads.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("active")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  filter === "active"
                    ? "bg-[#0A0A0A] text-white shadow-xs"
                    : "bg-[#FAF9F6] text-zinc-600 hover:text-[#0A0A0A]"
                }`}
              >
                Active Deals
              </button>
            </div>
          </div>

          {/* Conversation Rows */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#E5E4DF]">
            {filteredThreads.map((item) => {
              const isSelected = item.id === activeThread.id;
              const lastMsg = item.messages[item.messages.length - 1];
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectThread(item.id)}
                  className={`w-full p-4 text-left transition-colors flex items-start gap-3 cursor-pointer ${
                    isSelected
                      ? "bg-[#FAF9F6] border-l-2 border-l-[#6A0D18]"
                      : "hover:bg-[#FAF9F6]/60"
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    {item.initials}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#0A0A0A] truncate">
                        {item.brandName}
                      </span>
                      <span className="text-xs text-zinc-400 font-tabular shrink-0">
                        {item.lastTime}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-[#6A0D18] truncate">
                      {item.campaignTitle} • {item.amount}
                    </p>
                    <p className="text-xs text-zinc-500 truncate">{lastMsg?.text}</p>
                  </div>
                  {item.unread && (
                    <span className="w-2 h-2 rounded-full bg-[#6A0D18] shrink-0 mt-2" />
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* ─── PANE 2: Center Two-Sided Message Stream ─── */}
        <section
          className={cn(
            "flex-1 flex flex-col min-w-0 bg-[#FAF9F6] min-h-0",
            showMobileChat ? "flex" : "hidden sm:flex"
          )}
        >
          {/* Single Clean Partner Header */}
          <div className="px-4 sm:px-6 py-3.5 bg-white border-b border-[#E5E4DF] flex items-center justify-between gap-4 shrink-0 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile Back Button */}
              <button
                type="button"
                onClick={() => setShowMobileChat(false)}
                className="sm:hidden p-1.5 -ml-1 rounded-lg text-zinc-500 hover:text-[#0A0A0A] hover:bg-zinc-100 transition-colors"
                title="Back to inbox"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-2xs">
                {activeThread.initials}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-[#0A0A0A] truncate">
                    {activeThread.brandName}
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-xs font-semibold shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {activeThread.escrowStatus}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 truncate">
                  {activeThread.campaignTitle} • {activeThread.deliverable}
                </p>
              </div>
            </div>

            <Link
              href="/campaigns"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E4DF] bg-[#FAF9F6] hover:bg-zinc-100 text-xs font-semibold text-[#0A0A0A] transition-colors shrink-0 cursor-pointer shadow-2xs"
            >
              <span>Campaign Room</span>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
            </Link>
          </div>

          {/* Messages Feed (Distinct Left vs Right Alignment) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {activeThread.messages.map((msg) => {
              if (msg.sender === "system") {
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E5E4DF] text-xs text-zinc-600 shadow-2xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{msg.text}</span>
                      <span className="text-zinc-400 font-tabular">• {msg.time}</span>
                    </div>
                  </div>
                );
              }

              const isCreator = msg.sender === "creator";

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-xl ${
                    isCreator ? "ml-auto items-end" : "mr-auto items-start"
                  }`}
                >
                  <div
                    className={`px-4 py-3 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                      isCreator
                        ? "bg-[#0A0A0A] text-white rounded-br-sm"
                        : "bg-white text-[#0A0A0A] border border-[#E5E4DF] rounded-bl-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-xs text-zinc-400 mt-1 px-1 font-tabular">
                    {isCreator ? "You" : activeThread.brandName} • {msg.time}
                  </span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer Input Bar */}
          <form
            onSubmit={handleSend}
            className="p-3 sm:p-4 bg-white border-t border-[#E5E4DF] shrink-0"
          >
            <div className="flex items-end gap-2 sm:gap-3 bg-[#FAF9F6] border border-[#E5E4DF] rounded-xl p-2 focus-within:border-[#6A0D18] focus-within:ring-2 focus-within:ring-[#6A0D18]/15 transition-all">
              <button
                type="button"
                onClick={handleAttach}
                aria-label="Attach deliverable or script"
                className="p-2 rounded-lg text-zinc-500 hover:text-[#0A0A0A] hover:bg-white transition-colors cursor-pointer"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <textarea
                rows={1}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                placeholder={`Reply to ${activeThread.brandName}...`}
                className="flex-1 bg-transparent border-0 text-xs text-[#0A0A0A] placeholder:text-zinc-400 focus:outline-none py-2 resize-none"
              />

              <button
                type="submit"
                disabled={!draft.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0A0A0A] hover:bg-zinc-800 disabled:opacity-40 text-white text-xs font-semibold transition-colors shrink-0 cursor-pointer shadow-xs active:scale-[0.98]"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </section>

        {/* ─── PANE 3: Right Deal & Escrow Context Drawer ─── */}
        {showDealDrawer && (
          <aside className="hidden xl:flex w-80 border-l border-[#E5E4DF] bg-white flex-col justify-between p-5 shrink-0 overflow-y-auto min-h-0">
            <div className="space-y-6">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#6A0D18] block mb-1">
                  Active Contract
                </span>
                <h3 className="text-base font-bold text-[#0A0A0A]">{activeThread.campaignTitle}</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Partner: {activeThread.brandName}</p>
              </div>

              {/* Payout Value Box */}
              <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E5E4DF] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 font-medium">Agreed Payout</span>
                  <span className="text-emerald-700 font-semibold">Terms Confirmed</span>
                </div>
                <div className="text-2xl font-bold text-[#0A0A0A] font-tabular">
                  {activeThread.amount}
                </div>
                <p className="text-xs text-zinc-500">
                  Releases to your UPI upon live Reel link verification.
                </p>
              </div>

              {/* Milestone Checklist */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#0A0A0A]">Deliverable Milestones</h4>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-[#0A0A0A] block">Terms Confirmed</span>
                      <span className="text-zinc-500">Brand committed {activeThread.amount}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-[#6A0D18] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-[#0A0A0A] block">Script & Rough Cut</span>
                      <span className="text-zinc-500">Due {activeThread.deadline}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <FileText className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-zinc-600 block">
                        Live Post Verification
                      </span>
                      <span className="text-zinc-400">{activeThread.deliverable}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action in Drawer */}
            <div className="pt-4 border-t border-[#E5E4DF] space-y-2">
              <button
                type="button"
                onClick={handleSubmitDraft}
                className="w-full py-2.5 px-4 rounded-lg bg-[#0A0A0A] hover:bg-zinc-800 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs active:scale-[0.98]"
              >
                Submit Deliverable Draft
              </button>
              <Link
                href="/campaigns"
                className="w-full py-2 px-4 rounded-lg border border-[#E5E4DF] bg-[#FAF9F6] hover:bg-zinc-100 text-xs font-semibold text-zinc-700 transition-colors text-center block cursor-pointer"
              >
                View Full Brand Brief
              </Link>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

export { DealDiscussions as Messages };
