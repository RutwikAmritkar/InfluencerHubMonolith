import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { DEFAULT_BRAND_PROFILE } from "@/services/brand-service";
import { BrandProfileDomain } from "@/types/brand-domain";
import { 
  Building2, 
  Globe, 
  CheckCircle2, 
  ShieldCheck, 
  Users, 
  Target, 
  Sparkles, 
  Sliders, 
  ExternalLink,
  Lock,
  Eye,
  BadgeCheck,
  DollarSign,
  Instagram,
  Video
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function BrandProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<BrandProfileDomain>(DEFAULT_BRAND_PROFILE);
  const [viewMode, setViewMode] = useState<"private_manage" | "public_preview">("private_manage");

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Brand Profile & Creator Preferences saved successfully.");
  };

  return (
    <div className="space-y-8 w-full pb-16 text-slate-900 dark:text-slate-100">
      
      {/* ─── 1. BRAND PROFILE HEADER ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#101828] dark:text-slate-100">
              Brand Profile
            </h1>
            <Badge className="bg-blue-50 dark:bg-blue-950/80 text-[#315CF5] dark:text-blue-400 border border-blue-200/80 text-[11px] font-bold">
              <BadgeCheck className="w-3.5 h-3.5 mr-1" /> Enterprise Verified
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#667085] dark:text-slate-400 font-medium mt-0.5">
            Manage your brand identity, creator preferences, campaign budgets, and verification credentials.
          </p>
        </div>

        {/* View Switcher: Private Management vs Creator Public View */}
        <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-800/80 border border-[#E3E8F2] dark:border-slate-700 rounded-xl shadow-xs">
          <button
            type="button"
            onClick={() => setViewMode("private_manage")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === "private_manage"
                ? "bg-[#315CF5] text-white shadow-2xs"
                : "text-[#667085] dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Lock className="w-3 h-3" />
            <span>Manage Settings</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("public_preview")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === "public_preview"
                ? "bg-[#315CF5] text-white shadow-2xs"
                : "text-[#667085] dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>Creator Preview</span>
          </button>
        </div>
      </div>

      {viewMode === "public_preview" ? (
        /* ─── CREATOR PUBLIC VIEW PREVIEW ──────────────────────────────────── */
        <div className="space-y-6">
          <Card className="rounded-[16px] bg-white dark:bg-[#11172A] border border-[#E3E8F2] dark:border-slate-800/90 shadow-xs overflow-hidden">
            <div className="h-40 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 relative">
              <img src={profile.identity.coverImageUrl} className="w-full h-full object-cover opacity-40" alt="Cover" />
            </div>
            <CardContent className="p-6 relative pt-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-12 mb-4">
                <img
                  src={profile.identity.logoUrl}
                  className="w-24 h-24 rounded-2xl border-4 border-white dark:border-[#11172A] shadow-md object-cover bg-white"
                  alt="Logo"
                />
                <Button className="bg-[#315CF5] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs">
                  View Active Campaigns →
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-[#101828] dark:text-slate-100">{profile.identity.brandName}</h2>
                  <CheckCircle2 className="w-5 h-5 text-[#315CF5]" />
                </div>
                <p className="text-xs text-[#667085] dark:text-slate-300 max-w-3xl leading-relaxed">
                  {profile.identity.description}
                </p>

                <div className="flex flex-wrap gap-4 text-xs pt-2 text-[#667085] dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span>{profile.identity.industry}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-slate-400" />
                    <a href={profile.identity.websiteUrl} target="_blank" rel="noreferrer" className="text-[#315CF5] font-semibold hover:underline flex items-center gap-1">
                      {profile.identity.websiteUrl} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>{profile.identity.companySize} employees</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* ─── PRIVATE BRAND MANAGEMENT DOMAIN ──────────────────────────────── */
        <Tabs defaultValue="identity" className="space-y-6 w-full">
          <TabsList className="bg-[#F8F9FC] dark:bg-slate-800/80 p-1 rounded-2xl border border-[#E3E8F2] dark:border-slate-700/60 grid grid-cols-2 sm:grid-cols-4 w-full sm:w-auto">
            <TabsTrigger value="identity" className="text-xs font-bold px-4 rounded-xl cursor-pointer">
              1. Brand Identity
            </TabsTrigger>
            <TabsTrigger value="preferences" className="text-xs font-bold px-4 rounded-xl cursor-pointer">
              2. Creator Preferences
            </TabsTrigger>
            <TabsTrigger value="budgets" className="text-xs font-bold px-4 rounded-xl cursor-pointer">
              3. Campaign Budgets
            </TabsTrigger>
            <TabsTrigger value="verification" className="text-xs font-bold px-4 rounded-xl cursor-pointer">
              4. Verification Status
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: BRAND IDENTITY */}
          <TabsContent value="identity">
            <Card className="rounded-[16px] bg-white dark:bg-[#11172A] border border-[#E3E8F2] dark:border-slate-800/90 shadow-xs">
              <CardContent className="p-6 space-y-6">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <h3 className="font-bold text-base text-[#101828] dark:text-slate-100">Brand Identity & Information</h3>
                  <p className="text-xs text-[#667085] dark:text-slate-400">Core company details visible to potential creator partners.</p>
                </div>

                <form onSubmit={handleSavePreferences} className="space-y-4 max-w-2xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#101828] dark:text-slate-200">Brand Display Name</label>
                      <Input value={profile.identity.brandName} onChange={(e) => setProfile(p => ({ ...p, identity: { ...p.identity, brandName: e.target.value } }))} className="h-10 text-xs rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#101828] dark:text-slate-200">Legal Company Name</label>
                      <Input value={profile.identity.legalName} onChange={(e) => setProfile(p => ({ ...p, identity: { ...p.identity, legalName: e.target.value } }))} className="h-10 text-xs rounded-xl" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#101828] dark:text-slate-200">Company Description</label>
                    <textarea value={profile.identity.description} onChange={(e) => setProfile(p => ({ ...p, identity: { ...p.identity, description: e.target.value } }))} rows={3} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#101828] dark:text-slate-200">Industry</label>
                      <Input value={profile.identity.industry} onChange={(e) => setProfile(p => ({ ...p, identity: { ...p.identity, industry: e.target.value } }))} className="h-10 text-xs rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#101828] dark:text-slate-200">Website URL</label>
                      <Input value={profile.identity.websiteUrl} onChange={(e) => setProfile(p => ({ ...p, identity: { ...p.identity, websiteUrl: e.target.value } }))} className="h-10 text-xs rounded-xl" />
                    </div>
                  </div>

                  <Button type="submit" className="bg-[#315CF5] hover:bg-blue-600 text-white font-bold text-xs rounded-xl px-5 h-9 cursor-pointer">
                    Save Brand Identity
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: CREATOR PREFERENCES */}
          <TabsContent value="preferences">
            <Card className="rounded-[16px] bg-white dark:bg-[#11172A] border border-[#E3E8F2] dark:border-slate-800/90 shadow-xs">
              <CardContent className="p-6 space-y-6">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <h3 className="font-bold text-base text-[#101828] dark:text-slate-100">Target Creator Preferences</h3>
                  <p className="text-xs text-[#667085] dark:text-slate-400">Used by the Creator Matching Engine to score candidate compatibility.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-[#F9FAFD] dark:bg-slate-800/50 rounded-xl border border-[#E3E8F2] dark:border-slate-700/60 space-y-3">
                    <h4 className="font-bold text-xs text-[#101828] dark:text-slate-200 flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-[#315CF5]" /> Preferred Categories
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.creatorPreferences.preferredCategories.map(cat => (
                        <Badge key={cat} className="bg-blue-50 dark:bg-blue-950/80 text-[#315CF5] dark:text-blue-400 border border-blue-200 text-xs px-2.5 py-1">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-[#F9FAFD] dark:bg-slate-800/50 rounded-xl border border-[#E3E8F2] dark:border-slate-700/60 space-y-3">
                    <h4 className="font-bold text-xs text-[#101828] dark:text-slate-200 flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-[#315CF5]" /> Preferred Platforms & Tiers
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.creatorPreferences.preferredPlatforms.map(plat => (
                        <Badge key={plat} variant="outline" className="capitalize text-xs px-2.5 py-1">
                          {plat}
                        </Badge>
                      ))}
                      {profile.creatorPreferences.preferredCreatorSizes.map(size => (
                        <Badge key={size} className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs px-2.5 py-1 capitalize">
                          {size} tier
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: CAMPAIGN BUDGETS */}
          <TabsContent value="budgets">
            <Card className="rounded-[16px] bg-white dark:bg-[#11172A] border border-[#E3E8F2] dark:border-slate-800/90 shadow-xs">
              <CardContent className="p-6 space-y-6">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <h3 className="font-bold text-base text-[#101828] dark:text-slate-100">Typical Campaign & Creator Payout Ranges</h3>
                  <p className="text-xs text-[#667085] dark:text-slate-400">Used for Pricing Intelligence estimations and commercial budget matching.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                  <div className="p-4 bg-[#F9FAFD] dark:bg-slate-800/50 rounded-xl border border-[#E3E8F2] dark:border-slate-700/60 space-y-1">
                    <span className="text-[10px] font-bold text-[#667085] dark:text-slate-400 uppercase tracking-wider font-mono">TYPICAL CAMPAIGN BUDGET</span>
                    <p className="text-xl font-black text-[#101828] dark:text-slate-100">${profile.campaignPreferences.typicalCampaignBudgetMin.toLocaleString()} – ${profile.campaignPreferences.typicalCampaignBudgetMax.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-[#F9FAFD] dark:bg-slate-800/50 rounded-xl border border-[#E3E8F2] dark:border-slate-700/60 space-y-1">
                    <span className="text-[10px] font-bold text-[#667085] dark:text-slate-400 uppercase tracking-wider font-mono">CREATOR PAYOUT RANGE</span>
                    <p className="text-xl font-black text-[#315CF5] dark:text-blue-400">${profile.campaignPreferences.typicalCreatorPayoutMin.toLocaleString()} – ${profile.campaignPreferences.typicalCreatorPayoutMax.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: VERIFICATION STATUS */}
          <TabsContent value="verification">
            <Card className="rounded-[16px] bg-white dark:bg-[#11172A] border border-[#E3E8F2] dark:border-slate-800/90 shadow-xs">
              <CardContent className="p-6 space-y-6">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <h3 className="font-bold text-base text-[#101828] dark:text-slate-100">Verification & Trust Credentials</h3>
                  <p className="text-xs text-[#667085] dark:text-slate-400">Verified credentials build trust with top creators and boost response rates.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
                  <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/80 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">Business Registration Verified</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/80 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">Website & Domain Verified</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/80 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">Social Accounts Verified</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/80 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">Escrow Payment Verified</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
