import React, { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { useGetInfluencer, SocialAccount } from "@workspace/api-client-react";
import { SocialAccountsForm } from "@/components/social-accounts-form";
import { Loader2, Check, Sparkles, Building2, UserCheck, Info, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function OnboardingPage() {
  const { user, setUser } = useAuth();
  const [, setLocation] = useLocation();

  const isBrand = user?.role === "brand";

  // Step state: 1 to 5 for Creator (C1-C5), 6 for Creator Success (C6)
  // Step state: 1 to 6 for Brand (B1-B6), 7 for Brand Success (B7)
  const [step, setStep] = useState<number>(() => {
    const savedStep = (user as any)?.onboardingStep;
    if (savedStep) {
      if (savedStep.startsWith("C") || savedStep.startsWith("B")) {
        const num = parseInt(savedStep.substring(1), 10);
        if (!isNaN(num) && num >= 1) return num;
      }
    }
    return 1;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Auto-redirect if onboarding is already completed
  useEffect(() => {
    if ((user as any)?.onboardingStatus === "completed") {
      if (isBrand) {
        setLocation("/dashboard/brand");
      } else {
        setLocation("/dashboard/influencer");
      }
    }
  }, [user?.id, (user as any)?.onboardingStatus, isBrand, setLocation]);

  // --- CREATOR ONBOARDING STATE ---
  const [creatorType, setCreatorType] = useState("Micro Creator");
  const [selectedNiches, setSelectedNiches] = useState<string[]>(["Lifestyle", "Tech & Gadgets"]);
  const [creatorState, setCreatorState] = useState("Maharashtra");
  const [creatorCity, setCreatorCity] = useState("Mumbai");
  const [creatorLanguages, setCreatorLanguages] = useState<string[]>(["English"]);

  // C2: Audience
  const [audienceAge, setAudienceAge] = useState("Gen Z");
  const [audienceGender, setAudienceGender] = useState("Balanced (50/50)");
  const [audienceTopLocation, setAudienceTopLocation] = useState("India");
  const [audienceCity, setAudienceCity] = useState("Mumbai");
  const [audienceInterests, setAudienceInterests] = useState("");

  // C4: Collaboration Preferences & Post Types
  const [collabTypes, setCollabTypes] = useState<string[]>(["Meta Ads", "Google Ads", "UGC Content"]);
  const [preferredPlatforms, setPreferredPlatforms] = useState<string[]>(["Instagram", "YouTube", "Snapchat"]);
  const [contentFormats, setContentFormats] = useState<string[]>(["Reels / Short Videos", "Dedicated Video"]);

  // C5: Goals
  const [creatorGoals, setCreatorGoals] = useState<string[]>(["Find more brand deals", "Increase earnings"]);

  // --- BRAND ONBOARDING STATE ---
  // B1: Company Info
  const [brandName, setBrandName] = useState(user?.name || "");
  const [brandWebsite, setBrandWebsite] = useState("https://example.com");
  const [brandCountry, setBrandCountry] = useState((user as any)?.country || "India");
  const [brandCity, setBrandCity] = useState("Mumbai");
  const [businessType, setBusinessType] = useState<"Product-Based" | "Service-Based">("Product-Based");

  // B2: Category
  const [brandIndustry, setBrandIndustry] = useState("Technology & SaaS");
  const [brandCategories, setBrandCategories] = useState<string[]>(["Software", "AI Tools"]);

  // B3: Target Audience
  const [brandTargetAge, setBrandTargetAge] = useState("25 - 34");
  const [brandTargetGender, setBrandTargetGender] = useState("All Genders");
  const [brandTargetLocation, setBrandTargetLocation] = useState("India");
  const [brandTargetAudiences, setBrandTargetAudiences] = useState<string[]>(["Gen Z", "Millennials"]);
  const [brandPronouns, setBrandPronouns] = useState<string[]>(["She/Her", "He/Him", "They/Them"]);

  // B4: Campaign Goals
  const [campaignGoals, setCampaignGoals] = useState<string[]>(["Brand awareness", "Sales/conversions"]);

  // B5: Campaign Preferences & Budget
  const [brandPlatforms, setBrandPlatforms] = useState<string[]>(["Instagram", "Snapchat", "YouTube"]);
  const [budgetRange, setBudgetRange] = useState("₹50,000 - ₹150,000 / mo");
  const [preferredCreatorSize, setPreferredCreatorSize] = useState("Micro (10K - 50K)");

  // B6: Brand Social Accounts
  const [brandSocialHandle, setBrandSocialHandle] = useState("@brand_official");

  const profileId = user?.profileId || 1;
  const { data: influencer } = useGetInfluencer(profileId, {
    query: { enabled: !isBrand && !!profileId, retry: false } as any,
  });

  useEffect(() => {
    const rawAge = (influencer as any)?.audienceData?.age;
    if (rawAge) {
      if (rawAge.includes("18 - 24") || rawAge.toLowerCase().includes("gen-z") || rawAge === "Gen Z") setAudienceAge("Gen Z");
      else if (rawAge.includes("25 - 34") || rawAge.toLowerCase().includes("millennial") || rawAge === "Millennials") setAudienceAge("Millennials");
      else if (rawAge.includes("35 - 44") || rawAge.toLowerCase().includes("adult") || rawAge === "Adults") setAudienceAge("Adults");
      else if (rawAge.includes("45+") || rawAge.toLowerCase().includes("mature") || rawAge === "Mature") setAudienceAge("Mature");
    }
  }, [influencer]);

  const toggleArrayItem = (list: string[], setList: (val: string[]) => void, item: string, max: number = 5) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      if (list.length < max) {
        setList([...list, item]);
      } else {
        toast.info(`Choose up to ${max} options.`);
      }
    }
  };

  // Generic Step Persistence Function
  const saveStepProgress = async (
    nextStepNum: number,
    payloadData: Record<string, any>,
    isFinal: boolean = false
  ): Promise<boolean> => {
    setIsSaving(true);
    setSaveError(null);

    const nextStepLabel = isFinal ? "COMPLETED" : isBrand ? `B${nextStepNum}` : `C${nextStepNum}`;

    try {
      const response = await fetch("/api/auth/onboarding/step", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          role: isBrand ? "brand" : "influencer",
          step: nextStepLabel,
          data: payloadData,
          isCompleted: isFinal,
        }),
      });

      if (!response.ok) {
        throw new Error("We couldn't save your progress. Please try again.");
      }

      if (user) {
        setUser({
          ...(user as any),
          onboardingStep: nextStepLabel,
          onboardingStatus: isFinal ? "completed" : "in_progress",
          profileCompletion: isFinal ? 70 : 40,
        });
      }

      setStep(nextStepNum);
      return true;
    } catch (_err) {
      setSaveError("We couldn't save your progress. Please try again.");
      toast.error("We couldn't save your progress. Please try again.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreatorC1Submit = () => {
    if (!creatorType) {
      toast.error("Please select your creator tier.");
      return;
    }
    if (selectedNiches.length < 2) {
      toast.error("Please select at least 2 content niches.");
      return;
    }
    if (selectedNiches.length > 5) {
      toast.error("Choose up to 5 content niches.");
      return;
    }
    if (!creatorState) {
      toast.error("Please select your state.");
      return;
    }
    if (!creatorCity || !creatorCity.trim()) {
      toast.error("Please enter your city.");
      return;
    }
    saveStepProgress(2, {
      creatorType,
      niches: selectedNiches,
      country: (user as any)?.country || "India",
      state: creatorState,
      city: creatorCity.trim(),
      languages: creatorLanguages,
    });
  };

  const handleCreatorC2Submit = () => {
    saveStepProgress(3, {
      audienceData: { age: audienceAge, gender: audienceGender, topLocation: audienceTopLocation, city: audienceCity, interests: audienceInterests },
    });
  };

  const handleCreatorC3Submit = () => {
    saveStepProgress(4, { socialAccounts: influencer?.socialAccounts || [] });
  };

  const handleCreatorC4Submit = () => {
    if (collabTypes.length === 0) {
      toast.error("Please select at least one post type / collaboration option.");
      return;
    }
    saveStepProgress(5, {
      collaborationPreferences: { types: collabTypes, platforms: preferredPlatforms, formats: contentFormats },
    });
  };

  const handleCreatorC5Submit = () => {
    if (creatorGoals.length === 0) {
      toast.error("Please select at least one goal.");
      return;
    }
    saveStepProgress(6, { goals: creatorGoals }, true);
  };

  // Brand Step Handlers
  const handleBrandB1Submit = () => {
    if (!brandName) {
      toast.error("Company name is required.");
      return;
    }
    if (brandWebsite && !/^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/i.test(brandWebsite.trim())) {
      toast.error("Please enter a valid website URL.");
      return;
    }
    saveStepProgress(2, { name: brandName, website: brandWebsite, country: brandCountry, city: brandCity, businessType });
  };

  const handleBrandB2Submit = () => {
    saveStepProgress(3, { industry: brandIndustry, categories: brandCategories });
  };

  const handleBrandB3Submit = () => {
    if (brandTargetAudiences.length === 0) {
      toast.error("Please select at least one target audience category.");
      return;
    }
    saveStepProgress(4, {
      targetAudience: {
        age: brandTargetAge,
        gender: brandTargetGender,
        location: brandTargetLocation,
        audiences: brandTargetAudiences,
        pronouns: brandPronouns,
      },
    });
  };

  const handleBrandB4Submit = () => {
    if (campaignGoals.length === 0) {
      toast.error("Please select at least one campaign goal.");
      return;
    }
    saveStepProgress(5, { campaignGoals });
  };

  const handleBrandB5Submit = () => {
    saveStepProgress(6, {
      campaignPreferences: { platforms: brandPlatforms, budget: budgetRange, creatorSize: preferredCreatorSize },
      monthlyBudget: budgetRange.includes("₹25,000") ? 35000 : budgetRange.includes("₹50,000") ? 100000 : budgetRange.includes("₹150,000") ? 300000 : 750000,
    });
  };

  const handleBrandB6Submit = () => {
    saveStepProgress(7, {
      socialAccounts: [{ platform: "Instagram", handle: brandSocialHandle }],
    }, true);
  };

  const nicheOptions = ["Lifestyle", "Tech & Gadgets", "Fashion & Beauty", "Fitness & Wellness", "Gaming & eSports", "Food & Travel", "Finance & Crypto", "Parenting", "Education"];
  const countries = ["India", "United States", "United Kingdom", "Canada", "Australia", "Germany", "France"];
  const creatorLanguagesOptions = ["English", "Hindi", "Marathi"];
  
  const INDIAN_STATES_AND_UTS = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Andaman and Nicobar Islands",
    "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi",
    "Jammu and Kashmir",
    "Ladakh",
    "Lakshadweep",
    "Puducherry",
  ];
  
  const citiesByCountry: Record<string, string[]> = {
    India: ["Mumbai", "Delhi", "Bengaluru", "Pune", "Hyderabad", "Chennai", "Kolkata", "Ahmedabad", "Jaipur", "Surat", "Chandigarh", "Kochi"],
    "United States": ["New York", "Los Angeles", "Chicago", "San Francisco", "Austin", "Seattle"],
    "United Kingdom": ["London", "Manchester", "Birmingham", "Edinburgh"],
    Canada: ["Toronto", "Vancouver", "Montreal", "Calgary"],
    Australia: ["Sydney", "Melbourne", "Brisbane", "Perth"],
  };

  const brandIndustries = ["Technology & SaaS", "E-commerce & Retail", "Beauty & Cosmetics", "Fashion & Apparel", "Health & Fitness", "Gaming & Entertainment", "Food & Beverage"];
  const creatorGoalOptions = ["Find more brand deals", "Increase earnings", "Grow audience", "Build long-term brand partnerships", "Improve content strategy"];
  const campaignGoalOptions = ["Brand awareness", "Product launch", "Sales/conversions", "UGC/content creation", "App downloads", "Sign Up"];

  const brandTargetAudienceOptions = [
    "Gen Z",
    "Millennials",
    "Gen X",
    "Students & Youth",
    "Working Professionals",
    "Parents & Families",
  ];

  const creatorPostTypeOptions = [
    "Meta Ads",
    "Google Ads",
    "UGC Content",
    "Affiliate Marketing",
    "Brand Ambassador",
    "Product Reviews",
  ];

  const brandPronounOptions = ["She/Her", "He/Him", "They/Them"];

  const maxSteps = isBrand ? 6 : 5;
  const currentStepNum = Math.min(step, maxSteps);
  const progressPercent = Math.round((currentStepNum / maxSteps) * 100);

  return (
    <div className="min-h-screen bg-[#FAFBFD] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center relative overflow-hidden font-sans">
      {/* Background Ambient Glows */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-blue-500/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-cyan-400/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl space-y-6 relative z-10">
        
        {/* Header Branding */}
        <div className="flex justify-center">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="h-10 w-10 bg-gradient-to-br from-[#315BEF] via-blue-600 to-indigo-700 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md shadow-blue-600/25 group-hover:scale-105 transition-transform duration-300">
                I
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                Influencer<span className="text-[#315BEF] dark:text-blue-400">Hub</span>
              </span>
            </div>
          </Link>
        </div>

        {/* Separate Onboarding Progress Bar Indicator */}
        {((!isBrand && step <= 5) || (isBrand && step <= 6)) && (
          <div className="p-[1px] bg-gradient-to-b from-blue-500/25 via-slate-200/90 dark:via-slate-800 to-cyan-500/25 rounded-3xl shadow-lg shadow-slate-200/50 dark:shadow-none">
            <div className="bg-white dark:bg-[#11172A] rounded-[1.45rem] p-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  {isBrand ? <Building2 className="w-4 h-4 text-blue-500" /> : <UserCheck className="w-4 h-4 text-blue-500" />}
                  {isBrand ? `Brand Setup — Step ${step} of 6` : `Creator Setup — Step ${step} of 5`}
                </span>
                <span className="text-[#315BEF] dark:text-blue-400 font-bold flex items-center gap-1 font-mono">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" /> {progressPercent}% Setup Completed
                </span>
              </div>

              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#315BEF] h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Error Alert Banner */}
        {saveError && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{saveError}</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => setSaveError(null)} className="h-7 text-xs border-red-500/30 text-red-300 hover:bg-red-500/20">
              Dismiss
            </Button>
          </div>
        )}

        {/* ─── CREATOR ONBOARDING FLOW (C1 - C5 + SUCCESS) ─── */}
        {!isBrand && (
          <div className="p-[1px] bg-gradient-to-b from-blue-500/20 via-slate-200/80 dark:via-slate-800 to-cyan-500/20 rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-none">
            <div className="bg-white dark:bg-[#11172A] rounded-[1.45rem] p-6 sm:p-8 space-y-6">
              
              {/* SCREEN C1: ABOUT YOU */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                      Let's build your creator profile 👋
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                      Select your creator tier, content niches (2 to 5), and location.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Creator Tier</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {["Micro (1K - 10K)", "Rising (10K - 50K)", "Established (50K - 250K)", "Macro (250K+)"].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setCreatorType(t)}
                            className={`p-3 rounded-xl border text-xs font-bold transition-all text-center ${
                              creatorType === t
                                ? "border-[#315BEF] bg-blue-50/60 dark:bg-blue-950/40 text-[#315BEF] dark:text-blue-400 ring-2 ring-[#315BEF]/15"
                                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Content Niches (Select MIN 2, MAX 5) <span className="text-blue-500">*</span>
                      </Label>
                      <div className="grid grid-cols-3 gap-2">
                        {nicheOptions.map((niche) => (
                          <button
                            key={niche}
                            type="button"
                            onClick={() => toggleArrayItem(selectedNiches, setSelectedNiches, niche, 5)}
                            className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                              selectedNiches.includes(niche)
                                ? "border-[#315BEF] bg-blue-50/60 dark:bg-blue-950/40 text-[#315BEF] dark:text-blue-400 ring-2 ring-[#315BEF]/15"
                                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                            }`}
                          >
                            {niche}
                          </button>
                        ))}
                      </div>
                      {selectedNiches.length < 2 && (
                        <p className="text-[11px] text-amber-500 font-semibold mt-1">
                          Please select at least 2 content niches.
                        </p>
                      )}
                    </div>

                    {/* Location: State Dropdown & City Textbox */}
                    <div className="space-y-3 pt-2">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Location <span className="text-blue-500">*</span></Label>

                      {!(user as any)?.country && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>Country information is missing. Please complete your account setup.</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">State / UT <span className="text-blue-500">*</span></Label>
                          <select
                            value={creatorState}
                            onChange={(e) => {
                              const newState = e.target.value;
                              setCreatorState(newState);
                              setCreatorCity(""); // Phase 5: Clear city when state changes!
                            }}
                            className="w-full h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs px-3 font-medium text-slate-900 dark:text-slate-100 mt-1 cursor-pointer"
                          >
                            {INDIAN_STATES_AND_UTS.map((st) => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">City <span className="text-blue-500">*</span></Label>
                          <Input
                            type="text"
                            value={creatorCity}
                            onChange={(e) => setCreatorCity(e.target.value)}
                            placeholder="e.g. Mumbai"
                            className="h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs font-medium mt-1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Languages Selection (Strictly English, Hindi, Marathi) */}
                    <div className="space-y-1.5 pt-2">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Languages Spoken <span className="text-blue-500">*</span></Label>
                      <div className="grid grid-cols-3 gap-2">
                        {creatorLanguagesOptions.map((lang) => (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => toggleArrayItem(creatorLanguages, setCreatorLanguages, lang, 3)}
                            className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                              creatorLanguages.includes(lang)
                                ? "border-[#315BEF] bg-blue-50/60 dark:bg-blue-950/40 text-[#315BEF] dark:text-blue-400 ring-2 ring-[#315BEF]/15"
                                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                            }`}
                          >
                            <span>{lang}</span>
                            {creatorLanguages.includes(lang) && <Check className="w-3.5 h-3.5 text-[#315BEF]" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Standardized Bottom Navigation Bar */}
                  <div className="flex items-center justify-between pt-6 border-t border-slate-200/80 dark:border-slate-800/80">
                    <Button variant="ghost" disabled className="text-xs text-slate-400 invisible">
                      ← Back
                    </Button>
                    <Button
                      type="button"
                      disabled={isSaving || selectedNiches.length < 2 || selectedNiches.length > 5}
                      onClick={handleCreatorC1Submit}
                      className="px-8 py-3 bg-[#315BEF] hover:bg-blue-600 text-white font-bold text-xs sm:text-sm rounded-xl cursor-pointer shadow-md shadow-blue-600/20 flex items-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <span>Continue →</span>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* SCREEN C2: YOUR AUDIENCE */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                      Your Audience Demographics
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                      Help brands understand who interacts with your content.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Primary Age Range <span className="text-blue-500">*</span></Label>
                        <select
                          value={audienceAge}
                          onChange={(e) => setAudienceAge(e.target.value)}
                          className="w-full h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs px-3 text-slate-900 dark:text-slate-100 font-medium cursor-pointer"
                        >
                          <option value="Gen Z">Gen Z</option>
                          <option value="Millennials">Millennials</option>
                          <option value="Adults">Adults</option>
                          <option value="Mature">Mature</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Gender Ratio</Label>
                        <select
                          value={audienceGender}
                          onChange={(e) => setAudienceGender(e.target.value)}
                          className="w-full h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs px-3 text-slate-900 dark:text-slate-100 font-medium"
                        >
                          <option value="Balanced (50/50)">Balanced (50/50)</option>
                          <option value="Female Majority (60%+)">Female Majority (60%+)</option>
                          <option value="Male Majority (60%+)">Male Majority (60%+)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Audience City</Label>
                      <Input
                        value={audienceCity}
                        onChange={(e) => setAudienceCity(e.target.value)}
                        placeholder="e.g. Los Angeles"
                        className="h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Audience Interests</Label>
                        <span className="text-[10px] text-slate-400 font-medium">(Optional)</span>
                      </div>
                      <Input
                        value={audienceInterests}
                        onChange={(e) => setAudienceInterests(e.target.value)}
                        placeholder="e.g. Technology, Fashion, Gaming (Optional)"
                        className="h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs"
                      />
                    </div>
                  </div>

                  {/* Standardized Bottom Navigation Bar */}
                  <div className="flex items-center justify-between pt-6 border-t border-slate-200/80 dark:border-slate-800/80">
                    <Button variant="outline" type="button" disabled={isSaving} onClick={() => setStep(1)} className="text-xs font-bold border-slate-300 dark:border-slate-700">
                      ← Back
                    </Button>
                    <Button
                      type="button"
                      disabled={isSaving}
                      onClick={handleCreatorC2Submit}
                      className="px-8 py-3 bg-[#315BEF] hover:bg-blue-600 text-white font-bold text-xs sm:text-sm rounded-xl cursor-pointer shadow-md shadow-blue-600/20 flex items-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <span>Continue →</span>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* SCREEN C3: CONNECT SOCIAL ACCOUNTS (OPTIONAL - HAS SKIP) */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/80 flex items-start gap-3">
                    <Info className="w-5 h-5 text-[#315BEF] dark:text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                      Connect your accounts to help brands discover you and import performance insights.
                    </p>
                  </div>

                  <SocialAccountsForm
                    initialAccounts={influencer?.socialAccounts || []}
                    onSave={() => handleCreatorC3Submit()}
                    onSkip={() => handleCreatorC3Submit()}
                    mode="onboarding"
                    isSaving={isSaving}
                  />

                  {/* Standardized Bottom Navigation Bar */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
                    <Button variant="outline" type="button" disabled={isSaving} onClick={() => setStep(2)} className="text-xs font-bold border-slate-300 dark:border-slate-700">
                      ← Back
                    </Button>
                    <div className="flex items-center gap-3">
                      <Button variant="ghost" type="button" disabled={isSaving} onClick={() => handleCreatorC3Submit()} className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium">
                        Skip for now
                      </Button>
                      <Button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleCreatorC3Submit()}
                        className="px-8 py-3 bg-[#315BEF] hover:bg-blue-600 text-white font-bold text-xs sm:text-sm rounded-xl cursor-pointer shadow-md shadow-blue-600/20 flex items-center gap-2"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <span>Continue →</span>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* SCREEN C4: COLLABORATION PREFERENCES */}
              {step === 4 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                      Collaboration Preferences
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                      Specify the types of brand partnerships you are looking for.
                    </p>
                  </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Supported Post Types & Partnership Formats <span className="text-blue-500">*</span></Label>
                        <div className="grid grid-cols-2 gap-2">
                          {creatorPostTypeOptions.map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => toggleArrayItem(collabTypes, setCollabTypes, t, 6)}
                              className={`p-3 rounded-xl border text-xs font-bold transition-all text-center flex items-center justify-between px-4 ${
                                collabTypes.includes(t)
                                  ? "border-[#315BEF] bg-blue-50/60 dark:bg-blue-950/40 text-[#315BEF] dark:text-blue-400 ring-2 ring-[#315BEF]/15"
                                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                              }`}
                            >
                              <span>{t}</span>
                              {collabTypes.includes(t) && <Check className="w-4 h-4 text-[#315BEF]" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                  {/* Standardized Bottom Navigation Bar */}
                  <div className="flex items-center justify-between pt-6 border-t border-slate-200/80 dark:border-slate-800/80">
                    <Button variant="outline" type="button" disabled={isSaving} onClick={() => setStep(3)} className="text-xs font-bold border-slate-300 dark:border-slate-700">
                      ← Back
                    </Button>
                    <Button
                      type="button"
                      disabled={isSaving || collabTypes.length === 0}
                      onClick={handleCreatorC4Submit}
                      className="px-8 py-3 bg-[#315BEF] hover:bg-blue-600 text-white font-bold text-xs sm:text-sm rounded-xl cursor-pointer shadow-md shadow-blue-600/20 flex items-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <span>Continue →</span>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* SCREEN C5: CREATOR GOALS */}
              {step === 5 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                      What are your goals on InfluencerHub?
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                      Select what you want to accomplish as a creator on our platform.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {creatorGoalOptions.map((goal) => (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => toggleArrayItem(creatorGoals, setCreatorGoals, goal, 3)}
                        className={`w-full p-3.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between ${
                          creatorGoals.includes(goal)
                            ? "border-[#315BEF] bg-blue-50/60 dark:bg-blue-950/40 text-[#315BEF] dark:text-blue-400 ring-2 ring-[#315BEF]/15"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                        }`}
                      >
                        <span>{goal}</span>
                        {creatorGoals.includes(goal) && <Check className="w-4 h-4 text-[#315BEF]" />}
                      </button>
                    ))}
                  </div>

                  {/* Standardized Bottom Navigation Bar */}
                  <div className="flex items-center justify-between pt-6 border-t border-slate-200/80 dark:border-slate-800/80">
                    <Button variant="outline" type="button" disabled={isSaving} onClick={() => setStep(4)} className="text-xs font-bold border-slate-300 dark:border-slate-700">
                      ← Back
                    </Button>
                    <Button
                      type="button"
                      disabled={isSaving || creatorGoals.length === 0}
                      onClick={handleCreatorC5Submit}
                      className="px-8 py-3 bg-[#315BEF] hover:bg-blue-600 text-white font-bold text-xs sm:text-sm rounded-xl cursor-pointer shadow-md shadow-blue-600/20 flex items-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <span>Complete Setup →</span>
                          <CheckCircle2 className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* SCREEN C6: CREATOR SUCCESS SCREEN */}
              {step === 6 && (
                <div className="text-center py-6 space-y-6">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-3xl mx-auto border border-emerald-500/20 shadow-lg">
                    🎉
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                      Welcome aboard! 🎉
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto">
                      Your creator profile is 70% complete. Head over to your dashboard to start applying for brand campaigns!
                    </p>
                  </div>

                  <div className="pt-4">
                    <Button
                      type="button"
                      onClick={() => setLocation("/dashboard/influencer")}
                      className="w-full sm:w-auto px-10 py-3.5 bg-[#315BEF] hover:bg-blue-600 text-white font-bold text-xs sm:text-sm rounded-full shadow-lg shadow-blue-600/30 cursor-pointer"
                    >
                      Go to Creator Dashboard →
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── BRAND ONBOARDING FLOW (B1 - B6 + SUCCESS) ─── */}
        {isBrand && (
          <div className="p-[1px] bg-gradient-to-b from-blue-500/20 via-slate-200/80 dark:via-slate-800 to-cyan-500/20 rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-none">
            <div className="bg-white dark:bg-[#11172A] rounded-[1.45rem] p-6 sm:p-8 space-y-6">

              {/* SCREEN B1: COMPANY INFORMATION */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                      Company Information
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                      Enter basic details about your brand workspace.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Company Name <span className="text-blue-500">*</span></Label>
                      <Input
                        required
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        placeholder="e.g. NovaTech Global"
                        className="h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Company Website</Label>
                        <span className="text-[10px] text-slate-400 font-medium">(Domain verification pending)</span>
                      </div>
                      <Input
                        value={brandWebsite}
                        onChange={(e) => setBrandWebsite(e.target.value)}
                        placeholder="https://example.com"
                        className="h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs"
                      />
                    </div>

                    {/* Based in: Country & City Selection */}
                    <div className="space-y-3 pt-1">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Based in (Country & City) <span className="text-blue-500">*</span></Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Country</Label>
                          <select
                            value={brandCountry}
                            onChange={(e) => {
                              const newCountry = e.target.value;
                              setBrandCountry(newCountry);
                              const availableCities = citiesByCountry[newCountry] || ["Mumbai", "Delhi"];
                              setBrandCity(availableCities[0]);
                            }}
                            className="w-full h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs px-3 font-medium text-slate-900 dark:text-slate-100 mt-1"
                          >
                            {countries.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">City</Label>
                          <select
                            value={brandCity}
                            onChange={(e) => setBrandCity(e.target.value)}
                            className="w-full h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs px-3 font-medium text-slate-900 dark:text-slate-100 mt-1"
                          >
                            {(citiesByCountry[brandCountry] || ["Mumbai", "Delhi"]).map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Business Type: Segmented Radio Selection */}
                    <div className="space-y-1.5 pt-2">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Business Type <span className="text-blue-500">*</span></Label>
                      <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Business Type">
                        {(["Product-Based", "Service-Based"] as const).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setBusinessType(type)}
                            className={`p-3 rounded-xl border text-xs font-bold transition-all text-center flex items-center justify-center gap-2 ${
                              businessType === type
                                ? "border-[#315BEF] bg-blue-50/60 dark:bg-blue-950/40 text-[#315BEF] dark:text-blue-400 ring-2 ring-[#315BEF]/15"
                                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                            }`}
                          >
                            <span>{type}</span>
                            {businessType === type && <Check className="w-4 h-4 text-[#315BEF]" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Standardized Bottom Navigation Bar */}
                  <div className="flex items-center justify-between pt-6 border-t border-slate-200/80 dark:border-slate-800/80">
                    <Button variant="ghost" disabled className="text-xs text-slate-400 invisible">
                      ← Back
                    </Button>
                    <Button
                      type="button"
                      disabled={isSaving || !brandName}
                      onClick={handleBrandB1Submit}
                      className="px-8 py-3 bg-[#315BEF] hover:bg-blue-600 text-white font-bold text-xs sm:text-sm rounded-xl cursor-pointer shadow-md shadow-blue-600/20 flex items-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <span>Continue →</span>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* SCREEN B2: BRAND CATEGORY */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                      Brand Category & Industry
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                      Select your primary industry so creators in relevant niches can discover your briefs.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Industry</Label>
                      <select
                        value={brandIndustry}
                        onChange={(e) => setBrandIndustry(e.target.value)}
                        className="w-full h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs px-3 text-slate-900 dark:text-slate-100 font-medium"
                      >
                        {brandIndustries.map((ind) => (
                          <option key={ind} value={ind}>{ind}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Standardized Bottom Navigation Bar */}
                  <div className="flex items-center justify-between pt-6 border-t border-slate-200/80 dark:border-slate-800/80">
                    <Button variant="outline" type="button" disabled={isSaving} onClick={() => setStep(1)} className="text-xs font-bold border-slate-300 dark:border-slate-700">
                      ← Back
                    </Button>
                    <Button
                      type="button"
                      disabled={isSaving}
                      onClick={handleBrandB2Submit}
                      className="px-8 py-3 bg-[#315BEF] hover:bg-blue-600 text-white font-bold text-xs sm:text-sm rounded-xl cursor-pointer shadow-md shadow-blue-600/20 flex items-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <span>Continue →</span>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* SCREEN B3: TARGET AUDIENCE & PRONOUNS */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                      Target Audience & Brand Profile
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                      Specify the ideal audience groups you want creators to reach.
                    </p>
                  </div>

                  <div className="space-y-5">
                    {/* Target Audience: Multi-Select Checkboxes */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Target Audience (Select all that apply) <span className="text-blue-500">*</span>
                      </Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {brandTargetAudienceOptions.map((aud) => (
                          <button
                            key={aud}
                            type="button"
                            onClick={() => toggleArrayItem(brandTargetAudiences, setBrandTargetAudiences, aud, 7)}
                            className={`p-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between ${
                              brandTargetAudiences.includes(aud)
                                ? "border-[#315BEF] bg-blue-50/60 dark:bg-blue-950/40 text-[#315BEF] dark:text-blue-400 ring-2 ring-[#315BEF]/15"
                                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                            }`}
                          >
                            <span>{aud}</span>
                            {brandTargetAudiences.includes(aud) && <Check className="w-4 h-4 text-[#315BEF]" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Pronouns: Separate Field */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Pronouns</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {brandPronounOptions.map((pr) => (
                          <button
                            key={pr}
                            type="button"
                            onClick={() => toggleArrayItem(brandPronouns, setBrandPronouns, pr, 3)}
                            className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                              brandPronouns.includes(pr)
                                ? "border-[#315BEF] bg-blue-50/60 dark:bg-blue-950/40 text-[#315BEF] dark:text-blue-400 ring-2 ring-[#315BEF]/15"
                                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                            }`}
                          >
                            <span>{pr}</span>
                            {brandPronouns.includes(pr) && <Check className="w-3.5 h-3.5 text-[#315BEF]" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Standardized Bottom Navigation Bar */}
                  <div className="flex items-center justify-between pt-6 border-t border-slate-200/80 dark:border-slate-800/80">
                    <Button variant="outline" type="button" disabled={isSaving} onClick={() => setStep(2)} className="text-xs font-bold border-slate-300 dark:border-slate-700">
                      ← Back
                    </Button>
                    <Button
                      type="button"
                      disabled={isSaving || brandTargetAudiences.length === 0}
                      onClick={handleBrandB3Submit}
                      className="px-8 py-3 bg-[#315BEF] hover:bg-blue-600 text-white font-bold text-xs sm:text-sm rounded-xl cursor-pointer shadow-md shadow-blue-600/20 flex items-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <span>Continue →</span>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* SCREEN B4: CAMPAIGN GOALS */}
              {step === 4 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                      Campaign Goals
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                      Select your primary objectives for running influencer campaigns.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {campaignGoalOptions.map((goal) => (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => toggleArrayItem(campaignGoals, setCampaignGoals, goal, 5)}
                        className={`w-full p-3.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between ${
                          campaignGoals.includes(goal)
                            ? "border-[#315BEF] bg-blue-50/60 dark:bg-blue-950/40 text-[#315BEF] dark:text-blue-400 ring-2 ring-[#315BEF]/15"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                        }`}
                      >
                        <span>{goal}</span>
                        {campaignGoals.includes(goal) && <Check className="w-4 h-4 text-[#315BEF]" />}
                      </button>
                    ))}
                  </div>

                  {/* Standardized Bottom Navigation Bar */}
                  <div className="flex items-center justify-between pt-6 border-t border-slate-200/80 dark:border-slate-800/80">
                    <Button variant="outline" type="button" disabled={isSaving} onClick={() => setStep(3)} className="text-xs font-bold border-slate-300 dark:border-slate-700">
                      ← Back
                    </Button>
                    <Button
                      type="button"
                      disabled={isSaving || campaignGoals.length === 0}
                      onClick={handleBrandB4Submit}
                      className="px-8 py-3 bg-[#315BEF] hover:bg-blue-600 text-white font-bold text-xs sm:text-sm rounded-xl cursor-pointer shadow-md shadow-blue-600/20 flex items-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <span>Continue →</span>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* SCREEN B5: CAMPAIGN PREFERENCES */}
              {step === 5 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                      Campaign Preferences & Budget
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                      Set your typical campaign parameters and budget range.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Typical Monthly Budget (₹ INR)</Label>
                      <select
                        value={budgetRange}
                        onChange={(e) => setBudgetRange(e.target.value)}
                        className="w-full h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs px-3 text-slate-900 dark:text-slate-100 font-medium font-mono"
                      >
                        <option value="₹25,000 - ₹50,000 / mo">₹25,000 - ₹50,000 / mo</option>
                        <option value="₹50,000 - ₹150,000 / mo">₹50,000 - ₹150,000 / mo</option>
                        <option value="₹150,000 - ₹500,000 / mo">₹150,000 - ₹500,000 / mo</option>
                        <option value="₹500,000+ / mo">₹500,000+ / mo</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Preferred Creator Tier</Label>
                      <select
                        value={preferredCreatorSize}
                        onChange={(e) => setPreferredCreatorSize(e.target.value)}
                        className="w-full h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs px-3 text-slate-900 dark:text-slate-100 font-medium"
                      >
                        <option value="Micro (10K - 50K)">Micro (10K - 50K)</option>
                        <option value="Mid-tier (50K - 250K)">Mid-tier (50K - 250K)</option>
                        <option value="Macro (250K+)">Macro (250K+)</option>
                      </select>
                    </div>
                  </div>

                  {/* Standardized Bottom Navigation Bar */}
                  <div className="flex items-center justify-between pt-6 border-t border-slate-200/80 dark:border-slate-800/80">
                    <Button variant="outline" type="button" disabled={isSaving} onClick={() => setStep(4)} className="text-xs font-bold border-slate-300 dark:border-slate-700">
                      ← Back
                    </Button>
                    <Button
                      type="button"
                      disabled={isSaving}
                      onClick={handleBrandB5Submit}
                      className="px-8 py-3 bg-[#315BEF] hover:bg-blue-600 text-white font-bold text-xs sm:text-sm rounded-xl cursor-pointer shadow-md shadow-blue-600/20 flex items-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <span>Continue →</span>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* SCREEN B6: CONNECT BRAND SOCIAL ACCOUNTS (OPTIONAL - HAS SKIP) */}
              {step === 6 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                      Brand Social Accounts <span className="text-xs text-slate-400 font-mono font-normal">(Optional)</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                      Add your official social handle for verification badges.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Instagram Handle</Label>
                    <Input
                      value={brandSocialHandle}
                      onChange={(e) => setBrandSocialHandle(e.target.value)}
                      placeholder="@brand_official"
                      className="h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs"
                    />
                  </div>

                  {/* Standardized Bottom Navigation Bar */}
                  <div className="flex items-center justify-between pt-6 border-t border-slate-200/80 dark:border-slate-800/80">
                    <Button variant="outline" type="button" disabled={isSaving} onClick={() => setStep(5)} className="text-xs font-bold border-slate-300 dark:border-slate-700">
                      ← Back
                    </Button>
                    <div className="flex items-center gap-3">
                      <Button variant="ghost" type="button" disabled={isSaving} onClick={() => handleBrandB6Submit()} className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium">
                        Skip for now
                      </Button>
                      <Button
                        type="button"
                        disabled={isSaving}
                        onClick={handleBrandB6Submit}
                        className="px-8 py-3 bg-[#315BEF] hover:bg-blue-600 text-white font-bold text-xs sm:text-sm rounded-xl cursor-pointer shadow-md shadow-blue-600/20 flex items-center gap-2"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <span>Complete Brand Setup →</span>
                            <CheckCircle2 className="w-4 h-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* SCREEN B7: BRAND SUCCESS SCREEN */}
              {step === 7 && (
                <div className="text-center py-6 space-y-6">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-3xl mx-auto border border-emerald-500/20 shadow-lg">
                    🎉
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                      You're all set! 🎉
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto">
                      Your brand profile is ready. Start discovering verified creators and launch your first campaign.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 max-w-md mx-auto text-left flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Profile Completion</span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">70% complete — ready to launch campaigns</p>
                    </div>
                    <span className="text-sm font-mono font-extrabold text-[#315BEF] bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded-full">70%</span>
                  </div>

                  <div className="pt-4">
                    <Button
                      type="button"
                      onClick={() => setLocation("/dashboard/brand")}
                      className="w-full sm:w-auto px-10 py-3.5 bg-[#315BEF] hover:bg-blue-600 text-white font-bold text-xs sm:text-sm rounded-full shadow-lg shadow-blue-600/30 cursor-pointer"
                    >
                      Find Creators →
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
