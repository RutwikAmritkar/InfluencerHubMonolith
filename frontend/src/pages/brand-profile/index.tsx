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
    <div className="space-y-8 w-full pb-16 text-[#0A0A0A]">
      {/* ─── 1. EDITORIAL HEADER ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-4 border-b border-[#E5E4DF] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.03em] text-[#0A0A0A]">
              Brand <span className="font-serif italic font-normal">Identity</span>
            </h1>
            <Badge className="bg-[#FDF6F7] text-[#6A0D18] border border-[#EED8DC] text-xs font-semibold px-2.5 py-0.5 rounded-full">
              <BadgeCheck className="w-3.5 h-3.5 mr-1" /> Enterprise Verified
            </Badge>
          </div>
          <p className="text-xs text-[#52525B] mt-1">
            Brand parameters, payment settings, and commercial partnership terms.
          </p>
        </div>

        {/* View Switcher: Private Management vs Creator Public View */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-[#E5E4DF] rounded-xl shadow-xs">
          <button
            type="button"
            onClick={() => setViewMode("private_manage")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === "private_manage"
                ? "bg-[#0A0A0A] text-white shadow-xs"
                : "text-[#52525B] hover:text-[#0A0A0A]"
            }`}
          >
            <Lock className="w-3 h-3" />
            <span>Manage Settings</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("public_preview")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === "public_preview"
                ? "bg-[#0A0A0A] text-white shadow-xs"
                : "text-[#52525B] hover:text-[#0A0A0A]"
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>Public Media Kit</span>
          </button>
        </div>
      </div>

      {viewMode === "public_preview" ? (
        /* ─── CREATOR PUBLIC VIEW PREVIEW ──────────────────────────────────── */
        <div className="space-y-6">
          <Card className="rounded-xl bg-white border border-[#E5E4DF] shadow-xs overflow-hidden">
            <div className="h-44 bg-[#0A0A0A] relative overflow-hidden">
              <img
                src={profile.identity.coverImageUrl}
                className="w-full h-full object-cover opacity-50 filter grayscale contrast-125"
                alt="Cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/80 to-transparent" />
            </div>
            <CardContent className="p-6 relative pt-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-12 mb-4">
                <img
                  src={profile.identity.logoUrl}
                  className="w-24 h-24 rounded-xl border-4 border-white shadow-md object-cover bg-white"
                  alt="Logo"
                />
                <Button className="bg-[#0A0A0A] hover:bg-zinc-800 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors">
                  View Active Briefs
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold tracking-[-0.02em] text-[#0A0A0A]">
                    {profile.identity.brandName}
                  </h2>
                  <CheckCircle2 className="w-5 h-5 text-[#6A0D18]" />
                </div>
                <p className="text-xs text-[#52525B] max-w-3xl leading-relaxed">
                  {profile.identity.description}
                </p>

                <div className="flex flex-wrap gap-5 text-xs pt-2 text-[#52525B] border-t border-[#E5E4DF]">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#52525B]" />
                    <span className="font-semibold text-[#0A0A0A]">
                      {profile.identity.industry}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-[#52525B]" />
                    <a
                      href={profile.identity.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#6A0D18] font-semibold hover:underline flex items-center gap-1"
                    >
                      {profile.identity.websiteUrl} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#52525B]" />
                    <span className="font-tabular">{profile.identity.companySize} employees</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* ─── PRIVATE BRAND MANAGEMENT DOMAIN ──────────────────────────────── */
        <Tabs defaultValue="identity" className="space-y-6 w-full">
          <TabsList className="bg-[#FAF9F6] p-1 rounded-xl border border-[#E5E4DF] grid grid-cols-2 sm:grid-cols-4 w-full sm:w-auto">
            <TabsTrigger
              value="identity"
              className="text-xs font-semibold px-4 rounded-lg cursor-pointer data-[state=active]:bg-[#0A0A0A] data-[state=active]:text-white"
            >
              1. Brand Identity
            </TabsTrigger>
            <TabsTrigger
              value="preferences"
              className="text-xs font-semibold px-4 rounded-lg cursor-pointer data-[state=active]:bg-[#0A0A0A] data-[state=active]:text-white"
            >
              2. Creator Preferences
            </TabsTrigger>
            <TabsTrigger
              value="budgets"
              className="text-xs font-semibold px-4 rounded-lg cursor-pointer data-[state=active]:bg-[#0A0A0A] data-[state=active]:text-white"
            >
              3. Campaign Budgets
            </TabsTrigger>
            <TabsTrigger
              value="verification"
              className="text-xs font-semibold px-4 rounded-lg cursor-pointer data-[state=active]:bg-[#0A0A0A] data-[state=active]:text-white"
            >
              4. Verification Status
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: BRAND IDENTITY */}
          <TabsContent value="identity">
            <Card className="rounded-xl bg-white border border-[#E5E4DF] shadow-xs">
              <CardContent className="p-6 space-y-6">
                <div className="border-b border-[#E5E4DF] pb-4">
                  <h3 className="font-bold text-base text-[#0A0A0A]">
                    Brand Identity &amp; Organization
                  </h3>
                  <p className="text-xs text-[#52525B]">
                    Official corporate details displayed across campaign briefs and commercial
                    contracts.
                  </p>
                </div>

                <form onSubmit={handleSavePreferences} className="space-y-4 max-w-2xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#0A0A0A]">
                        Brand Display Name
                      </label>
                      <Input
                        value={profile.identity.brandName}
                        onChange={(e) =>
                          setProfile((p) => ({
                            ...p,
                            identity: { ...p.identity, brandName: e.target.value },
                          }))
                        }
                        className="h-10 text-xs rounded-lg border-[#E5E4DF] bg-[#FAF9F6]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#0A0A0A]">
                        Legal Entity Name
                      </label>
                      <Input
                        value={profile.identity.legalName}
                        onChange={(e) =>
                          setProfile((p) => ({
                            ...p,
                            identity: { ...p.identity, legalName: e.target.value },
                          }))
                        }
                        className="h-10 text-xs rounded-lg border-[#E5E4DF] bg-[#FAF9F6]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#0A0A0A]">
                      Company Description
                    </label>
                    <textarea
                      value={profile.identity.description}
                      onChange={(e) =>
                        setProfile((p) => ({
                          ...p,
                          identity: { ...p.identity, description: e.target.value },
                        }))
                      }
                      rows={3}
                      className="w-full p-3 bg-[#FAF9F6] border border-[#E5E4DF] rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#0A0A0A]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#0A0A0A]">
                        Industry Sector
                      </label>
                      <Input
                        value={profile.identity.industry}
                        onChange={(e) =>
                          setProfile((p) => ({
                            ...p,
                            identity: { ...p.identity, industry: e.target.value },
                          }))
                        }
                        className="h-10 text-xs rounded-lg border-[#E5E4DF] bg-[#FAF9F6]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#0A0A0A]">Website URL</label>
                      <Input
                        value={profile.identity.websiteUrl}
                        onChange={(e) =>
                          setProfile((p) => ({
                            ...p,
                            identity: { ...p.identity, websiteUrl: e.target.value },
                          }))
                        }
                        className="h-10 text-xs rounded-lg border-[#E5E4DF] bg-[#FAF9F6]"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="bg-[#0A0A0A] hover:bg-zinc-800 text-white font-semibold text-xs rounded-lg px-5 h-9 cursor-pointer transition-colors shadow-xs"
                  >
                    Save Brand Identity
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: CREATOR PREFERENCES */}
          <TabsContent value="preferences">
            <Card className="rounded-xl bg-white border border-[#E5E4DF] shadow-xs">
              <CardContent className="p-6 space-y-6">
                <div className="border-b border-[#E5E4DF] pb-4">
                  <h3 className="font-bold text-base text-[#0A0A0A]">Target Creator Profiles</h3>
                  <p className="text-xs text-[#52525B]">
                    Parameters used by the algorithmic discovery engine to match relevant creators.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-[#FAF9F6] rounded-xl border border-[#E5E4DF] space-y-3">
                    <h4 className="font-bold text-xs text-[#0A0A0A] flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-[#6A0D18]" /> Preferred Niches
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.creatorPreferences.preferredCategories.map((cat) => (
                        <Badge
                          key={cat}
                          className="bg-white text-[#0A0A0A] border border-[#E5E4DF] text-xs px-2.5 py-1"
                        >
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-[#FAF9F6] rounded-xl border border-[#E5E4DF] space-y-3">
                    <h4 className="font-bold text-xs text-[#0A0A0A] flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-[#6A0D18]" /> Preferred Channels & Tiers
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.creatorPreferences.preferredPlatforms.map((plat) => (
                        <Badge
                          key={plat}
                          variant="outline"
                          className="capitalize text-xs px-2.5 py-1 bg-white border-[#E5E4DF] text-[#0A0A0A]"
                        >
                          {plat}
                        </Badge>
                      ))}
                      {profile.creatorPreferences.preferredCreatorSizes.map((size) => (
                        <Badge
                          key={size}
                          className="bg-[#059669]/10 text-[#059669] border border-[#059669]/20 text-xs px-2.5 py-1 capitalize"
                        >
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
            <Card className="rounded-xl bg-white border border-[#E5E4DF] shadow-xs">
              <CardContent className="p-6 space-y-6">
                <div className="border-b border-[#E5E4DF] pb-4">
                  <h3 className="font-bold text-base text-[#0A0A0A]">
                    Campaign &amp; Creator Payout Benchmarks
                  </h3>
                  <p className="text-xs text-[#52525B]">
                    Used for instant budget calculations and marketplace pricing indicators.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                  <div className="p-4 bg-[#FAF9F6] rounded-xl border border-[#E5E4DF] space-y-1">
                    <span className="text-xs font-semibold text-[#52525B] block">
                      Average Campaign Allocation
                    </span>
                    <p className="text-xl font-extrabold text-[#0A0A0A] font-tabular">
                      ₹{profile.campaignPreferences.typicalCampaignBudgetMin.toLocaleString()} – ₹
                      {profile.campaignPreferences.typicalCampaignBudgetMax.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-[#FAF9F6] rounded-xl border border-[#E5E4DF] space-y-1">
                    <span className="text-xs font-semibold text-[#52525B] block">
                      Creator Deliverable Range
                    </span>
                    <p className="text-xl font-extrabold text-[#6A0D18] font-tabular">
                      ₹{profile.campaignPreferences.typicalCreatorPayoutMin.toLocaleString()} – ₹
                      {profile.campaignPreferences.typicalCreatorPayoutMax.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: VERIFICATION STATUS */}
          <TabsContent value="verification">
            <Card className="rounded-xl bg-white border border-[#E5E4DF] shadow-xs">
              <CardContent className="p-6 space-y-6">
                <div className="border-b border-[#E5E4DF] pb-4">
                  <h3 className="font-bold text-base text-[#0A0A0A]">
                    Verification &amp; Trust Ledger
                  </h3>
                  <p className="text-xs text-[#52525B]">
                    Verified credentials unlock direct talent reach and automated milestone
                    clearance.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
                  <div className="p-3.5 bg-white border border-[#E5E4DF] rounded-xl flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0A0A0A]">
                      Business Entity Verification
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                  </div>
                  <div className="p-3.5 bg-white border border-[#E5E4DF] rounded-xl flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0A0A0A]">
                      Domain Ownership Verified
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                  </div>
                  <div className="p-3.5 bg-white border border-[#E5E4DF] rounded-xl flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0A0A0A]">
                      Official Channels Connected
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                  </div>
                  <div className="p-3.5 bg-white border border-[#E5E4DF] rounded-xl flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0A0A0A]">
                      Commercial Payment Rail Active
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-[#059669]" />
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
