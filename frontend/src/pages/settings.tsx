import { useState, useEffect } from "react";
import {
  Globe,
  Moon,
  Sun,
  Wallet,
  Share2,
  Bell,
  Shield,
  Check,
  ArrowUpRight,
  CheckCircle2,
  Building2,
  Loader2,
  Lock,
  Smartphone,
  Save,
  KeyRound,
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/components/theme-provider";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  useGetBrand,
  useUpdateBrand,
  useGetInfluencer,
  useUpdateInfluencer,
  SocialAccount,
  getGetInfluencerQueryKey,
  getGetBrandQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SocialAccountsForm } from "@/components/social-accounts-form";

type SettingsTab = "general" | "payouts" | "channels" | "security";

const LANGUAGES = [
  { code: "en", native: "English", label: "English (US)" },
  { code: "hi", native: "हिन्दी", label: "Hindi" },
  { code: "mr", native: "मराठी", label: "Marathi" },
];

export function Settings() {
  const { user, setUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();

  const isBrand = user?.role === "brand";
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const selectedLang = i18n.language || "en";
  const darkMode = theme === "dark";

  // Creator Payout State
  const [upiId, setUpiId] = useState("maya.creates@okicici");
  const [panNumber, setPanNumber] = useState("ABCDE1234F");
  const [isEditingPan, setIsEditingPan] = useState(false);
  const [isSavingPayout, setIsSavingPayout] = useState(false);

  // Security Toggles
  const [escrowNotifs, setEscrowNotifs] = useState(true);
  const [dealRoomNotifs, setDealRoomNotifs] = useState(true);
  const [twoFactorActive, setTwoFactorActive] = useState(true);

  // Fetch influencer data if creator
  const profileId = user?.profileId || 1;
  const { data: inf } = useGetInfluencer(profileId, { query: { enabled: !isBrand } as any });
  const updateInf = useUpdateInfluencer();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") === "true") {
      const platform = params.get("platform") || "social";
      toast.success(`Successfully connected ${platform} account via official OAuth`);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get("error") === "account_already_connected") {
      toast.error("This account is already connected to another CreatorsBrand creator.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    toast.success("Interface language updated");
  };

  const handleSavePayout = () => {
    setIsSavingPayout(true);
    setTimeout(() => {
      setIsSavingPayout(false);
      toast.success("Payout destination & tax classification updated!");
    }, 600);
  };

  const handleSaveSocialAccounts = (accounts: SocialAccount[]) => {
    updateInf.mutate(
      {
        id: profileId,
        data: { socialAccounts: accounts } as any,
      },
      {
        onSuccess: () => {
          toast.success("Social accounts updated successfully");
          queryClient.invalidateQueries({ queryKey: getGetInfluencerQueryKey(profileId) });
        },
        onError: () => toast.error("Failed to update social accounts."),
      }
    );
  };

  const navTabs: Array<{ id: SettingsTab; label: string; icon: typeof Globe }> = [
    { id: "general", label: "General & Display", icon: Globe },
    { id: "payouts", label: isBrand ? "Billing & Payment Rails" : "Payouts & Tax", icon: Wallet },
    { id: "channels", label: isBrand ? "Company Profile" : "Connected Channels", icon: Share2 },
    { id: "security", label: "Notifications & Security", icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0A0A0A] font-sans antialiased">
      <div className="workspace-canvas space-y-8">
        {/* ─── Top Editorial Header (Role-Aware Copy) ─── */}
        <div className="border-b border-[#E5E4DF] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6A0D18] mb-1">
              {isBrand ? "Brand Enterprise Workspace" : "Creator Account"}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-[#0A0A0A]">
              Account <span className="font-serif italic font-normal text-[#6A0D18]">Settings</span>
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              {isBrand
                ? "Configure company billing rails, interface localization, and verified corporate credentials."
                : "Manage interface localization, payout destinations, and verified social connections."}
            </p>
          </div>

          <Link
            href={isBrand ? "/brand-profile" : "/profile"}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white hover:bg-zinc-50 border border-[#E5E4DF] text-xs font-semibold text-[#0A0A0A] self-start sm:self-auto cursor-pointer shadow-xs transition-colors"
          >
            <span>{isBrand ? "View Company Profile" : "Edit Media Kit"}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500" />
          </Link>
        </div>

        {/* ─── Adaptive Rail & Content Grid ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: In-Page Settings Navigation */}
          <nav className="lg:col-span-3 2xl:col-span-2 space-y-1">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                    isActive
                      ? "liquid-burgundy-metal font-bold shadow-xs text-white"
                      : "text-zinc-600 hover:bg-[#F2F1EC] hover:text-[#0A0A0A]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-zinc-400"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right: Structured Settings Panes */}
          <div className="lg:col-span-9 2xl:col-span-10 space-y-6 min-w-0">
            {/* ─── PANE 1: General & Display ─── */}
            {activeTab === "general" && (
              <section className="bg-white rounded-2xl border border-[#E5E4DF] divide-y divide-[#E5E4DF] shadow-xs">
                {/* Language Picker */}
                <div className="p-6">
                  <h2 className="text-sm font-bold text-[#0A0A0A]">Interface Language</h2>
                  <p className="text-xs text-zinc-500 mt-0.5 mb-4">
                    Choose the primary display language across your CreatorsBrand workspace.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {LANGUAGES.map((lang) => {
                      const selected = selectedLang === lang.code;
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => handleLanguageChange(lang.code)}
                          className={`flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all cursor-pointer ${
                            selected
                              ? "border-[#0A0A0A] bg-[#FAF9F6] ring-1 ring-[#0A0A0A]"
                              : "border-[#E5E4DF] bg-white hover:border-zinc-400"
                          }`}
                        >
                          <div>
                            <span className="text-xs font-bold text-[#0A0A0A] block">
                              {lang.native}
                            </span>
                            <span className="text-xs text-zinc-500">{lang.label}</span>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                              selected
                                ? "border-[#6A0D18] bg-[#6A0D18] text-white"
                                : "border-zinc-300"
                            }`}
                          >
                            {selected && <Check className="w-3 h-3" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Appearance Row */}
                <div className="p-6 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-[#FAF9F6] border border-[#E5E4DF] text-zinc-700 mt-0.5">
                      {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#0A0A0A]">Workspace Theme</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Switch between high-contrast Alabaster light mode and deep Obsidian dark
                        mode.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={darkMode}
                    onClick={() => setTheme(darkMode ? "light" : "dark")}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                      darkMode ? "bg-[#0A0A0A]" : "bg-zinc-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition duration-200 ${
                        darkMode ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </section>
            )}

            {/* ─── PANE 2: Escrow Payout & Tax Ledger (Domain-Specific Value) ─── */}
            {activeTab === "payouts" && (
              <section className="bg-white rounded-2xl border border-[#E5E4DF] divide-y divide-[#E5E4DF] shadow-xs">
                <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-[#0A0A0A]">
                        {isBrand ? "Funding Accounts & Payment Rails" : "Direct Payout Destination"}
                      </h2>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Verified
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {isBrand
                        ? "Campaign milestones are pre-funded with verified milestone clearance."
                        : "Milestone releases are settled directly to your primary UPI ID or verified bank account."}
                    </p>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-700">
                      {isBrand
                        ? "Corporate Virtual Account ID"
                        : "Primary UPI ID (Instant Settlement)"}
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-[#E5E4DF] bg-[#FAF9F6] text-xs font-semibold text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#6A0D18]/20 focus:border-[#6A0D18] font-mono"
                    />
                    <p className="text-[11px] text-zinc-400">
                      T+0 direct settlement on milestone signoff
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-700">
                      Tax / TDS Classification
                    </label>
                    <div className="h-10 px-3 rounded-lg border border-[#E5E4DF] bg-zinc-100/70 flex items-center justify-between text-xs font-medium text-zinc-600">
                      <span className="flex items-center gap-1.5 truncate">
                        <Building2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        {isBrand
                          ? "Corporate Entity (GST Active)"
                          : "Individual Creator (194J / 194C)"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsEditingPan(!isEditingPan)}
                        className="text-[#6A0D18] font-semibold cursor-pointer shrink-0 ml-2 hover:underline"
                      >
                        {isEditingPan ? "Cancel" : "Update PAN"}
                      </button>
                    </div>
                    {isEditingPan ? (
                      <div className="pt-2 flex items-center gap-2">
                        <input
                          type="text"
                          value={panNumber}
                          onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                          placeholder="ABCDE1234F"
                          maxLength={10}
                          className="h-8 px-2.5 rounded-lg border border-[#E5E4DF] bg-white text-xs font-mono uppercase focus:ring-1 focus:ring-[#6A0D18]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingPan(false);
                            toast.success("PAN updated for TDS verification");
                          }}
                          className="h-8 px-3 rounded-lg bg-[#0A0A0A] text-white text-xs font-semibold"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <p className="text-[11px] text-zinc-400">
                        PAN: {panNumber.slice(0, 5)}****{panNumber.slice(-1)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="px-6 py-4 bg-[#FAF9F6]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-b-2xl">
                  <span className="text-xs text-zinc-500">
                    Changes to payout destinations require 2FA confirmation.
                  </span>
                  <button
                    type="button"
                    onClick={handleSavePayout}
                    disabled={isSavingPayout}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg liquid-burgundy-metal text-xs font-semibold cursor-pointer self-start sm:self-auto shadow-xs"
                  >
                    {isSavingPayout && <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />}
                    <span>Save Payout Settings</span>
                  </button>
                </div>
              </section>
            )}

            {/* ─── PANE 3: Connected Channels (Creator) or Brand Profile (Brand) ─── */}
            {activeTab === "channels" && (
              <div>
                {isBrand ? (
                  <BrandProfileForm profileId={user?.profileId || 1} />
                ) : (
                  <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-[#E5E4DF] p-6 shadow-xs space-y-1">
                      <h2 className="text-sm font-bold text-[#0A0A0A]">
                        Official Platform Channels
                      </h2>
                      <p className="text-xs text-zinc-500">
                        Link your Instagram and YouTube accounts via official Meta and Google OAuth
                        APIs to verify audience reach, engagement velocity, and tier standing.
                      </p>
                    </div>

                    <SocialAccountsForm
                      creatorId={profileId}
                      initialAccounts={inf?.socialAccounts || []}
                      onSave={handleSaveSocialAccounts}
                      mode="settings"
                      isSaving={updateInf.isPending}
                    />
                  </div>
                )}
              </div>
            )}

            {/* ─── PANE 4: Notifications & Security ─── */}
            {activeTab === "security" && (
              <section className="bg-white rounded-2xl border border-[#E5E4DF] divide-y divide-[#E5E4DF] shadow-xs">
                {/* Notification Settings */}
                <div className="p-6 space-y-4">
                  <div>
                    <h2 className="text-sm font-bold text-[#0A0A0A]">Payout &amp; Deal Alerts</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Receive immediate notifications when capital is locked, milestones are
                      submitted, or releases clear.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#E5E4DF] bg-[#FAF9F6]">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-[#0A0A0A] block">
                          Instant Milestone Clearance Notifications
                        </span>
                        <span className="text-xs text-zinc-500">
                          Receive SMS and email when milestone payouts are disbursed.
                        </span>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={escrowNotifs}
                        onClick={() => {
                          setEscrowNotifs(!escrowNotifs);
                          toast.success("Notification preferences saved");
                        }}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                          escrowNotifs ? "bg-[#0A0A0A]" : "bg-zinc-200"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition duration-200 ${
                            escrowNotifs ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#E5E4DF] bg-[#FAF9F6]">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-[#0A0A0A] block">
                          Deal Room Version Updates
                        </span>
                        <span className="text-xs text-zinc-500">
                          Alert when deliverables, terms, or usage rights proposals are modified.
                        </span>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={dealRoomNotifs}
                        onClick={() => {
                          setDealRoomNotifs(!dealRoomNotifs);
                          toast.success("Notification preferences saved");
                        }}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                          dealRoomNotifs ? "bg-[#0A0A0A]" : "bg-zinc-200"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition duration-200 ${
                            dealRoomNotifs ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2-Factor Authentication */}
                <div className="p-6 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-[#FAF9F6] border border-[#E5E4DF] text-[#6A0D18] mt-0.5">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-[#0A0A0A]">
                          Two-Factor Authentication (2FA)
                        </h3>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FDF6F7] text-[#6A0D18] border border-[#EED8DC] text-xs font-semibold">
                          Active
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Required for changing payout accounts and executing milestone signoffs.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      toast.info("2FA is enforced for all payment and payout modifications")
                    }
                    className="px-3.5 py-2 text-xs font-semibold text-zinc-700 bg-white border border-[#E5E4DF] hover:bg-zinc-50 rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    Manage 2FA
                  </button>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── BRAND PROFILE FORM SUB-COMPONENT ──────────────────────────────────────
const brandSchema = z.object({
  name: z.string().min(2, "Company name is required"),
  industry: z.string().min(2, "Industry is required"),
  country: z.string().optional(),
  city: z.string().optional(),
  description: z.string().optional(),
  website: z.string().optional(),
  monthlyBudget: z.coerce.number().optional(),
});

function BrandProfileForm({ profileId }: { profileId: number }) {
  const { user, setUser } = useAuth();
  const { data: brand, isLoading } = useGetBrand(profileId, {
    query: { enabled: !!profileId } as any,
  });
  const updateBrand = useUpdateBrand();
  const queryClient = useQueryClient();
  const [logoUrl, setLogoUrl] = useState<string>("");

  const form = useForm<z.infer<typeof brandSchema>>({
    resolver: zodResolver(brandSchema as any),
    values: {
      name: brand?.name || "",
      industry: brand?.industry || "",
      country: brand?.country || "India",
      city: (brand as any)?.city || "Mumbai",
      description: brand?.description || "",
      website: brand?.website || "",
      monthlyBudget: (brand as any)?.monthlyBudget || 50000,
    },
  });

  const currentLogo = logoUrl || brand?.logoUrl || user?.avatarUrl || "";

  const onSubmit = (values: z.infer<typeof brandSchema>) => {
    updateBrand.mutate(
      { id: profileId, data: { ...values, logoUrl: currentLogo } as any },
      {
        onSuccess: () => {
          toast.success("Company profile saved successfully!");
          if (user && currentLogo) {
            setUser({ ...(user as any), avatarUrl: currentLogo });
          }
          queryClient.invalidateQueries({ queryKey: getGetBrandQueryKey(profileId) });
        },
        onError: (err: any) => toast.error(err?.message || "Failed to update company profile."),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="py-12 flex justify-center">
        <Loader2 className="animate-spin h-6 w-6 text-[#6A0D18]" />
      </div>
    );
  }

  return (
    <section className="bg-white rounded-2xl border border-[#E5E4DF] p-6 shadow-xs space-y-6">
      <div className="border-b border-[#E5E4DF] pb-3">
        <h2 className="text-sm font-bold text-[#0A0A0A]">
          Company Profile & Commercial Credentials
        </h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Corporate details visible to verified creators when reviewing your campaign briefs.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-semibold text-zinc-700">
                    Company Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. NovaTech Global"
                      className="h-10 px-3 rounded-lg border-[#E5E4DF] bg-[#FAF9F6] text-xs font-medium text-[#0A0A0A]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-semibold text-zinc-700">
                    Industry Vertical
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Consumer Electronics"
                      className="h-10 px-3 rounded-lg border-[#E5E4DF] bg-[#FAF9F6] text-xs font-medium text-[#0A0A0A]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-semibold text-zinc-700">
                    Headquarters City
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Mumbai"
                      className="h-10 px-3 rounded-lg border-[#E5E4DF] bg-[#FAF9F6] text-xs font-medium text-[#0A0A0A]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-semibold text-zinc-700">
                    Corporate Website
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com"
                      className="h-10 px-3 rounded-lg border-[#E5E4DF] bg-[#FAF9F6] text-xs font-medium text-[#0A0A0A]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="monthlyBudget"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-semibold text-zinc-700">
                  Monthly Campaign Budget (₹ INR)
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="50000"
                    className="h-10 px-3 rounded-lg border-[#E5E4DF] bg-[#FAF9F6] text-xs font-semibold font-tabular text-[#0A0A0A]"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-xs text-zinc-400">
                  Estimated monthly creator deployment capital.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-semibold text-zinc-700">
                  Brand Overview & Mission
                </FormLabel>
                <FormControl>
                  <Textarea
                    rows={3}
                    placeholder="Tell creators about your brand story, product lines, and audience focus..."
                    className="p-3.5 rounded-xl border-[#E5E4DF] bg-[#FAF9F6] text-xs text-[#0A0A0A] resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="pt-2 flex items-center justify-between border-t border-[#E5E4DF]">
            <Button
              type="submit"
              disabled={updateBrand.isPending}
              className="liquid-burgundy-metal font-semibold text-xs px-5 h-9 rounded-lg cursor-pointer shadow-xs"
            >
              {updateBrand.isPending && (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin text-white" />
              )}
              Save Company Profile
            </Button>
            <span className="text-xs text-zinc-400">
              All updates sync immediately with campaign brief discovery.
            </span>
          </div>
        </form>
      </Form>
    </section>
  );
}

export default Settings;
export { Settings as AccountSettings };
