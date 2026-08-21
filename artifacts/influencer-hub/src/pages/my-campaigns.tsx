import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useListApplications, useListCampaigns } from "@workspace/api-client-react";
import { Link } from "wouter";
import { 
  Megaphone, 
  Briefcase, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  FileText, 
  DollarSign, 
  Loader2, 
  Sparkles,
  Search,
  ChevronRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Realistic Accepted / Contracted Creator Campaigns
const defaultAcceptedCampaigns = [
  {
    id: 1,
    campaignId: 1,
    title: "Summer Beauty Campaign",
    brandName: "Glow Cosmetics",
    brandLogoUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=150&auto=format&fit=crop",
    description: "Create 1 Instagram Reel and 2 Story frames featuring product application for the new SPF Glow Lotion.",
    budget: 5000,
    platform: "instagram",
    stage: "active", // 'active' | 'upcoming' | 'completed'
    startDate: "2026-08-01",
    deadline: "2026-09-01",
    deliverablesStatus: "1 of 3 Deliverables Submitted",
    nextMilestone: "Instagram Reel Draft Review",
  },
  {
    id: 2,
    campaignId: 2,
    title: "Tech Launch 2026",
    brandName: "NovaTech",
    brandLogoUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=150&auto=format&fit=crop",
    description: "Unboxing & hands-on review video for the new ergonomic wireless ANC headphones on YouTube.",
    budget: 12500,
    platform: "youtube",
    stage: "upcoming",
    startDate: "2026-09-05",
    deadline: "2026-09-25",
    deliverablesStatus: "Contract Signed • Awaiting Product Sample",
    nextMilestone: "Product Sample Shipment Tracking",
  },
  {
    id: 3,
    campaignId: 4,
    title: "Spring Wellness Rollout",
    brandName: "FreshBite",
    brandLogoUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=150&auto=format&fit=crop",
    description: "TikTok organic snack recipe integration and grocery haul vlog featuring FreshBite products.",
    budget: 4200,
    platform: "tiktok",
    stage: "completed",
    startDate: "2026-05-10",
    deadline: "2026-06-15",
    deliverablesStatus: "All Deliverables Approved",
    nextMilestone: "Payout Released ($4,200)",
  },
];

export default function MyCampaigns() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"active" | "upcoming" | "completed">("active");
  const [search, setSearch] = useState("");

  const { data: apiApplications, isLoading: appsLoading } = useListApplications({
    influencerId: user?.id,
    status: "accepted",
  });

  const campaigns = useMemo(() => {
    // If backend data is returned, filter accepted applications
    let list = defaultAcceptedCampaigns;
    if (apiApplications && apiApplications.length > 0) {
      list = apiApplications.map((app: any) => ({
        id: app.id,
        campaignId: app.campaignId,
        title: app.campaignTitle || "Accepted Campaign",
        brandName: app.brandName || "Brand Partner",
        brandLogoUrl: app.brandLogoUrl || "",
        description: app.message || "Contracted campaign deliverable.",
        budget: app.budget || 5000,
        platform: app.platform || "instagram",
        stage: app.stage || "active",
        startDate: app.startDate || "2026-08-01",
        deadline: app.deadline || "2026-09-01",
        deliverablesStatus: app.deliverablesStatus || "In Progress",
        nextMilestone: app.nextMilestone || "Content Review",
      }));
    }

    return list.filter((c) => {
      const matchesTab = c.stage === activeTab;
      const matchesSearch =
        !search ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.brandName.toLowerCase().includes(search.toLowerCase());

      return matchesTab && matchesSearch;
    });
  }, [apiApplications, activeTab, search]);

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case "active":
        return (
          <Badge className="bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 text-[11px] font-bold">
            🟢 Active & In Progress
          </Badge>
        );
      case "upcoming":
        return (
          <Badge className="bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200 text-[11px] font-bold">
            🔵 Scheduled / Upcoming
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 text-[11px] font-bold">
            ✓ Completed & Paid
          </Badge>
        );
      default:
        return <Badge variant="outline">{stage}</Badge>;
    }
  };

  return (
    <div className="space-y-8 w-full pb-12 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 dark:border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#11182F] dark:text-slate-100">
            My Campaigns
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Manage your contracted brand partnerships, submit deliverables, and track payout milestones.
          </p>
        </div>

        <Link href="/opportunities">
          <Button className="h-9 px-4 bg-[#315BEF] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer">
            Explore Opportunities →
          </Button>
        </Link>
      </div>

      {/* Tabs & Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full sm:w-auto">
            <TabsList className="bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 grid grid-cols-3 w-full sm:w-auto">
              <TabsTrigger value="active" className="text-xs font-bold px-5 rounded-xl cursor-pointer">
                Active
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="text-xs font-bold px-5 rounded-xl cursor-pointer">
                Upcoming
              </TabsTrigger>
              <TabsTrigger value="completed" className="text-xs font-bold px-5 rounded-xl cursor-pointer">
                Completed
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <Input
              placeholder="Search my campaigns..."
              className="pl-9 h-10 border-slate-200/80 dark:border-slate-700 bg-white dark:bg-[#11172A] text-xs rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Campaigns List */}
        {appsLoading ? (
          <div className="flex h-64 w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#315BEF]" />
          </div>
        ) : campaigns.length > 0 ? (
          <div className="grid gap-4 w-full pt-2">
            {campaigns.map((c) => (
              <Card
                key={c.id}
                className="rounded-2xl bg-white dark:bg-[#11172A] border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-all overflow-hidden text-slate-900 dark:text-slate-100"
              >
                <CardContent className="p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      {c.brandLogoUrl ? (
                        <img
                          src={c.brandLogoUrl}
                          className="w-11 h-11 rounded-xl border border-slate-200 dark:border-slate-700 object-cover"
                          alt="Brand Logo"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-[#315BEF] dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                          {c.brandName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{c.brandName}</p>
                        </div>
                        <Link href={`/campaigns/${c.campaignId}`}>
                          <h3 className="text-base sm:text-lg font-bold hover:text-[#315BEF] dark:hover:text-blue-400 transition-colors cursor-pointer inline-flex items-center gap-1.5">
                            {c.title}
                          </h3>
                        </Link>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {getStageBadge(c.stage)}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                    {c.description}
                  </p>

                  <div className="p-3.5 bg-[#F8FAFF] dark:bg-slate-800/50 rounded-xl border border-[#E2E8F3] dark:border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] block font-mono">
                        Deliverable Status:
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                        {c.deliverablesStatus}
                      </span>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] block font-mono">
                        Next Milestone:
                      </span>
                      <span className="font-bold text-[#315BEF] dark:text-blue-400 mt-0.5 block">
                        {c.nextMilestone}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-1 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex flex-wrap gap-4 sm:gap-6 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-bold text-[#11182F] dark:text-slate-100">
                          ${c.budget.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 capitalize font-bold text-slate-700 dark:text-slate-300">
                        {c.platform}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>Deadline: {new Date(c.deadline).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <Link href={`/campaigns/${c.campaignId}`}>
                      <Button className="h-8 px-4 bg-[#315BEF] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-2xs cursor-pointer">
                        Manage Campaign →
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#11172A] w-full">
            <Megaphone className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
              No {activeTab} campaigns
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {activeTab === "active"
                ? "You don't have any active campaign deliverables right now."
                : activeTab === "upcoming"
                ? "No upcoming scheduled campaigns."
                : "No completed campaign history yet."}
            </p>
            <Link href="/opportunities">
              <Button className="h-9 px-4 bg-[#315BEF] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer">
                Explore & Apply to Opportunities
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
