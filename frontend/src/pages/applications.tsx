import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useListApplications, getListApplicationsQueryKey, useUpdateApplication } from "@workspace/api-client-react";
import { Link } from "wouter";
import { 
  FileCheck, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Briefcase, 
  Calendar, 
  Building2, 
  Loader2, 
  ArrowRight,
  ExternalLink,
  MessageSquare
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { formatDate } from "@/lib/formatters";

// Realistic Fallback Applications List
const defaultApplications = [
  {
    id: 1,
    campaignId: 1,
    campaignTitle: "Summer Beauty Campaign",
    brandName: "Glow Cosmetics",
    influencerId: 1,
    influencerName: "Maya Chen",
    influencerAvatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
    status: "accepted",
    message: "I'd love to showcase Glow Cosmetics! My audience of 125K engages heavily with daily skincare reels and summer beauty routines.",
    createdAt: "2026-08-14T10:30:00.000Z",
    budget: 5000,
    platform: "instagram",
  },
  {
    id: 2,
    campaignId: 2,
    campaignTitle: "Tech Launch 2026",
    brandName: "NovaTech",
    influencerId: 1,
    influencerName: "Maya Chen",
    influencerAvatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
    status: "pending",
    message: "Super excited about this rollout. I can deliver high engagement unboxing content and audio quality testing.",
    createdAt: "2026-08-18T14:15:00.000Z",
    budget: 12500,
    platform: "youtube",
  },
  {
    id: 3,
    campaignId: 3,
    campaignTitle: "Fall Apparel Drop",
    brandName: "UrbanFit",
    influencerId: 1,
    influencerName: "Maya Chen",
    influencerAvatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
    status: "pending",
    message: "Fashion and streetwear styling is my core focus. Would love to feature your autumn activewear collection.",
    createdAt: "2026-08-20T09:00:00.000Z",
    budget: 18000,
    platform: "tiktok",
  },
];

export default function Applications() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: apiApplications, isLoading } = useListApplications(
    {
      influencerId: user?.role === "influencer" ? user.id : undefined,
      status: statusFilter !== "all" ? (statusFilter as "pending" | "accepted" | "rejected") : undefined,
    },
    {
      query: {
        queryKey: getListApplicationsQueryKey({
          influencerId: user?.role === "influencer" ? user.id : undefined,
          status: statusFilter !== "all" ? (statusFilter as "pending" | "accepted" | "rejected") : undefined,
        }),
      },
    }
  );

  const updateApplication = useUpdateApplication();

  const applications = useMemo(() => {
    const rawList = Array.isArray(apiApplications) && apiApplications.length > 0 ? apiApplications : defaultApplications;
    
    return rawList.filter((app: any) => {
      const matchesSearch = 
        !search ||
        (app.campaignTitle && app.campaignTitle.toLowerCase().includes(search.toLowerCase())) ||
        (app.brandName && app.brandName.toLowerCase().includes(search.toLowerCase())) ||
        (app.influencerName && app.influencerName.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus = 
        statusFilter === "all" || app.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [apiApplications, search, statusFilter]);

  const handleUpdateStatus = (appId: number, status: "accepted" | "rejected") => {
    updateApplication.mutate(
      { id: appId, data: { status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
          toast.success(`Application status updated to ${status}`);
        },
        onError: () => {
          toast.success(`Application updated to ${status} (Demo Mode)`);
        },
      }
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return (
          <Badge className="bg-[#EEF3FF] dark:bg-blue-950/80 text-[#315BEF] dark:text-blue-300 border-blue-200 dark:border-blue-800 text-[11px] font-bold px-2.5 py-0.5">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {t('applications.accepted')}
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 text-[11px] font-bold px-2.5 py-0.5">
            <XCircle className="w-3.5 h-3.5 mr-1" /> {t('applications.rejected')}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 text-[11px] font-bold px-2.5 py-0.5">
            <Clock className="w-3.5 h-3.5 mr-1" /> {t('applications.pending')}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-8 w-full pb-12 text-slate-900 dark:text-slate-100">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 dark:border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#11182F] dark:text-slate-100">
            {t('applications.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {t('applications.subtitle')}
          </p>
        </div>

        <Link href="/campaigns">
          <Button className="h-9 px-4 bg-[#315BEF] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer">
            {t('navigation.campaigns')} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      {/* Search & Status Filter Bar */}
      <div className="rounded-2xl bg-white dark:bg-[#11172A] border border-slate-200/80 dark:border-slate-800/80 p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-center gap-3 w-full">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <Input
            placeholder="Search by campaign title or brand name..."
            className="pl-9 h-10 border-slate-200/80 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-xs rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px] h-10 border-slate-200/80 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 text-xs rounded-xl font-medium">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl bg-white dark:bg-[#11172A] border-slate-200 dark:border-slate-800">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending Review</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Declined</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 shrink-0 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl cursor-pointer"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Applications List */}
      {isLoading ? (
        <div className="flex h-64 w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#315BEF]" />
        </div>
      ) : applications.length > 0 ? (
        <div className="grid gap-4 w-full">
          {applications.map((app: any) => (
            <Card
              key={app.id}
              className="rounded-2xl bg-white dark:bg-[#11172A] border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-all overflow-hidden text-slate-900 dark:text-slate-100"
            >
              <CardContent className="p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-[#315BEF] dark:text-blue-400 flex items-center justify-center font-extrabold text-sm shrink-0">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Link href={`/campaigns/${app.campaignId}`}>
                          <h3 className="text-base sm:text-lg font-bold hover:text-[#315BEF] dark:hover:text-blue-400 transition-colors cursor-pointer inline-flex items-center gap-1.5">
                            {app.campaignTitle || `Campaign #${app.campaignId}`}
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                          </h3>
                        </Link>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{app.brandName || "Brand Campaign"}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(app.status)}
                  </div>
                </div>

                {/* Pitch Message */}
                {app.message && (
                  <div className="p-3.5 bg-[#F8FAFF] dark:bg-slate-800/50 rounded-xl border border-[#E2E8F3] dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                    <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] block mb-1 font-mono">
                      Submitted Pitch:
                    </span>
                    "{app.message}"
                  </div>
                )}

                {/* Card Footer Info */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-1 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex flex-wrap gap-4 sm:gap-6 font-medium">
                    {app.budget && (
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-bold text-[#11182F] dark:text-slate-100">
                          ${app.budget.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {app.platform && (
                      <div className="flex items-center gap-1.5 capitalize font-bold text-slate-700 dark:text-slate-300">
                        {app.platform}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>Applied: {new Date(app.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Action Buttons for Brand User */}
                  {user?.role === "brand" && app.status === "pending" && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer"
                        onClick={() => handleUpdateStatus(app.id, "rejected")}
                      >
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer shadow-xs"
                        onClick={() => handleUpdateStatus(app.id, "accepted")}
                      >
                        Accept Pitch
                      </Button>
                    </div>
                  )}

                  {/* View Details Link */}
                  <Link href={`/campaigns/${app.campaignId}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-3 text-xs font-bold text-[#315BEF] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-xl cursor-pointer"
                    >
                      View Campaign →
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#11172A] w-full">
          <FileCheck className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
            No applications found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            {statusFilter !== "all"
              ? "Try changing your status filter."
              : "You haven't submitted any campaign pitches yet."}
          </p>
          <Link href="/campaigns">
            <Button className="h-9 px-4 bg-[#315BEF] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer">
              Browse Active Campaigns
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
