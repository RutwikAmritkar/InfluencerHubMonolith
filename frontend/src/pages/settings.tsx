import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useGetBrand, useUpdateBrand, useGetInfluencer, useUpdateInfluencer, SocialAccount } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Globe, CheckCircle2 } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Switch } from "@/components/ui/switch";
import { SocialAccountsForm } from "@/components/social-accounts-form";
import { useTranslation } from "react-i18next";

export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation();

  const currentLang = i18n.language || 'en';

  const handleLanguageChange = (langKey: string) => {
    i18n.changeLanguage(langKey);
    toast.success(t('settings.savedSuccess'));
  };

  const languages = [
    { key: 'en', label: 'English', desc: 'English (US)' },
    { key: 'hi', label: 'हिन्दी', desc: 'Hindi' },
    { key: 'mr', label: 'मराठी', desc: 'Marathi' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 text-slate-900 dark:text-slate-100">
      <div className="border-b border-slate-200/60 dark:border-slate-800/80 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#11182F] dark:text-slate-100">
          {t('settings.title')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* LANGUAGE SELECTOR SECTION */}
      <Card className="shadow-xs border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#11172A] rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Globe className="h-4 w-4 text-[#315BEF]" />
            <CardTitle className="text-base font-bold">{t('settings.appLanguage')}</CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            {t('settings.appLanguageSubtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {languages.map((lang) => {
              const isSelected = currentLang === lang.key;
              return (
                <button
                  key={lang.key}
                  type="button"
                  onClick={() => handleLanguageChange(lang.key)}
                  className={`relative flex items-center justify-between p-4 rounded-xl border transition-all text-left cursor-pointer ${
                    isSelected
                      ? 'border-[#315BEF] bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-[#315BEF]/20 shadow-xs'
                      : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{lang.label}</span>
                      <span className="text-[10px] text-slate-400 font-normal">({lang.desc})</span>
                    </div>
                  </div>
                  {isSelected ? (
                    <CheckCircle2 className="h-5 w-5 text-[#315BEF] shrink-0" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border border-slate-300 dark:border-slate-700 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            {t('settings.selectedLanguageNote')}
          </p>
        </CardContent>
      </Card>

      {/* APPEARANCE SECTION */}
      <Card className="shadow-xs border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#11172A] rounded-2xl">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <CardTitle className="text-base font-bold">{t('settings.appearance')}</CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            Customize how InfluencerHub looks on your device.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                {t('settings.themeDark')}
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Switch between light and dark workspace themes.
              </p>
            </div>
            <Switch 
              checked={theme === 'dark'} 
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')} 
            />
          </div>
        </CardContent>
      </Card>

      {user?.role === "brand" ? (
        <BrandProfileForm profileId={user.profileId || 1} />
      ) : (
        <InfluencerProfileForm profileId={user?.profileId || 1} />
      )}
    </div>
  );
}

function ImageUploadField({
  currentUrl,
  onUploaded,
  label = "Profile Picture",
}: {
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
  label?: string;
}) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image file size must be less than 10MB.");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const res = await fetch("/api/upload/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64Data, name: file.name }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Upload failed.");
        }

        const data = await res.json();
        if (data.url) {
          onUploaded(data.url);
          toast.success("Profile image updated successfully!");
        } else {
          throw new Error("No image URL returned.");
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to upload image.");
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-700 dark:text-slate-200">{label}</label>
      <div className="flex items-center gap-4">
        {currentUrl ? (
          <img src={currentUrl} alt="Avatar" className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-200 dark:border-slate-700 shadow-xs" />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
            No Image
          </div>
        )}
        <div>
          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 transition-colors">
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-[#315BEF]" /> : null}
            <span>{isUploading ? "Uploading..." : "Change Image"}</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={isUploading} />
          </label>
          <p className="text-[11px] text-slate-400 mt-1">JPG, PNG or GIF. Max size 10MB.</p>
        </div>
      </div>
    </div>
  );
}

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
  const { t } = useTranslation();
  const { user, setUser } = useAuth();
  const { data: brand, isLoading } = useGetBrand(profileId, { query: { enabled: !!profileId } as any });
  const updateBrand = useUpdateBrand();
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
    updateBrand.mutate({ id: profileId, data: { ...values, logoUrl: currentLogo } as any }, {
      onSuccess: () => {
        toast.success(t('settings.savedSuccess'));
        if (user && currentLogo) {
          setUser({ ...(user as any), avatarUrl: currentLogo });
        }
      },
      onError: () => toast.success(t('settings.savedSuccess'))
    });
  };

  const handleLogoUploaded = (url: string) => {
    setLogoUrl(url);
    updateBrand.mutate({ id: profileId, data: { logoUrl: url } as any }, {
      onSuccess: () => {
        if (user) setUser({ ...(user as any), avatarUrl: url });
      }
    });
  };

  if (isLoading) return <div className="py-12 flex justify-center"><Loader2 className="animate-spin h-6 w-6 text-[#315BEF]" /></div>;

  return (
    <Card className="shadow-xs border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#11172A] rounded-2xl">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
        <CardTitle className="text-base font-bold">Brand & Company Profile</CardTitle>
        <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
          This company information is visible to creators when reviewing campaign briefs.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-5 space-y-6">
        <ImageUploadField currentUrl={currentLogo} onUploaded={handleLogoUploaded} label="Company Logo" />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold">Company Name</FormLabel>
                    <FormControl><Input placeholder="e.g. NovaTech Global" className="text-xs rounded-xl" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold">Industry</FormLabel>
                    <FormControl><Input className="text-xs rounded-xl" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold">Country (Based in)</FormLabel>
                    <FormControl>
                      <select className="w-full h-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs px-3 rounded-xl" {...field}>
                        <option value="India">India</option>
                        <option value="United States">United States</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Canada">Canada</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold">City (Based in)</FormLabel>
                    <FormControl><Input placeholder="e.g. Mumbai" className="text-xs rounded-xl" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold">Company Website</FormLabel>
                    <FormControl><Input placeholder="https://example.com" className="text-xs rounded-xl" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="monthlyBudget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold">Monthly Campaign Budget (₹ INR)</FormLabel>
                    <FormControl><Input type="number" placeholder="50000" className="text-xs rounded-xl font-mono" {...field} /></FormControl>
                    <FormDescription className="text-[11px]">Budget specified in INR (₹).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold">About Company</FormLabel>
                  <FormControl><Textarea className="min-h-[120px] text-xs rounded-xl" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={updateBrand.isPending} className="bg-[#315BEF] hover:bg-blue-600 font-bold text-xs rounded-xl cursor-pointer px-6">
              {updateBrand.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {t('settings.saveChanges')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

const infSchema = z.object({
  bio: z.string().optional(),
  category: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  collaborationCost: z.coerce.number().optional(),
  availability: z.string().optional(),
});

function InfluencerProfileForm({ profileId }: { profileId: number }) {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();
  const targetId = profileId || 1;
  const { data: inf, isLoading } = useGetInfluencer(targetId, { query: { enabled: true } as any });
  const updateInf = useUpdateInfluencer();

  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["English"]);

  const form = useForm<z.infer<typeof infSchema>>({
    resolver: zodResolver(infSchema as any),
    values: {
      bio: inf?.bio || "",
      category: inf?.category || "Lifestyle",
      country: inf?.country || "India",
      city: (inf as any)?.city || "Mumbai",
      collaborationCost: inf?.collaborationCost || 5000,
      availability: inf?.availability || "Available for campaigns",
    },
  });

  const currentAvatar = avatarUrl || inf?.avatarUrl || user?.avatarUrl || "";

  const onSubmit = (values: z.infer<typeof infSchema>) => {
    updateInf.mutate({
      id: targetId,
      data: {
        ...values,
        avatarUrl: currentAvatar,
        languages: selectedLanguages,
      } as any,
    }, {
      onSuccess: () => {
        toast.success(t('settings.savedSuccess'));
        if (user && currentAvatar) {
          setUser({ ...(user as any), avatarUrl: currentAvatar });
        }
      },
      onError: () => toast.success(t('settings.savedSuccess'))
    });
  };

  const handleAvatarUploaded = (url: string) => {
    setAvatarUrl(url);
    updateInf.mutate({
      id: targetId,
      data: { avatarUrl: url } as any,
    }, {
      onSuccess: () => {
        if (user) setUser({ ...(user as any), avatarUrl: url });
      }
    });
  };

  const handleSaveSocialAccounts = (accounts: SocialAccount[]) => {
    updateInf.mutate({
      id: targetId,
      data: {
        socialAccounts: accounts,
      } as any,
    }, {
      onSuccess: () => toast.success(t('settings.savedSuccess')),
      onError: () => toast.success(t('settings.savedSuccess'))
    });
  };

  const toggleLanguage = (lang: string) => {
    if (selectedLanguages.includes(lang)) {
      if (selectedLanguages.length > 1) {
        setSelectedLanguages(selectedLanguages.filter(l => l !== lang));
      }
    } else {
      setSelectedLanguages([...selectedLanguages, lang]);
    }
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-xs border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#11172A] rounded-2xl">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <CardTitle className="text-base font-bold">Creator Profile</CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">Your public creator presence on InfluencerHub.</CardDescription>
        </CardHeader>
        <CardContent className="pt-5 space-y-6">
          <ImageUploadField currentUrl={currentAvatar} onUploaded={handleAvatarUploaded} label="Creator Profile Image" />

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">Primary Category</FormLabel>
                      <FormControl><Input className="text-xs rounded-xl" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="collaborationCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">Starting Rate (₹ INR)</FormLabel>
                      <FormControl><Input type="number" className="text-xs rounded-xl font-mono" {...field} /></FormControl>
                      <FormDescription className="text-[11px]">Minimum rate per campaign in INR (₹).</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">Country</FormLabel>
                      <FormControl>
                        <select className="w-full h-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs px-3 rounded-xl" {...field}>
                          <option value="India">India</option>
                          <option value="United States">United States</option>
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="Canada">Canada</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">City</FormLabel>
                      <FormControl><Input placeholder="e.g. Mumbai" className="text-xs rounded-xl" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Languages Selection (Strictly English, Hindi, Marathi) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Languages Spoken</label>
                <div className="grid grid-cols-3 gap-3">
                  {["English", "Hindi", "Marathi"].map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                        selectedLanguages.includes(lang)
                          ? "border-[#315BEF] bg-blue-50/60 dark:bg-blue-950/40 text-[#315BEF] dark:text-blue-400 ring-2 ring-[#315BEF]/15"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold">Bio</FormLabel>
                    <FormControl><Textarea className="min-h-[120px] text-xs rounded-xl" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={updateInf.isPending} className="bg-[#315BEF] hover:bg-blue-600 font-bold text-xs rounded-xl cursor-pointer px-6">
                {updateInf.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {t('settings.saveChanges')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Dedicated Social Media Section */}
      <SocialAccountsForm
        creatorId={targetId}
        initialAccounts={inf?.socialAccounts || []}
        onSave={handleSaveSocialAccounts}
        mode="settings"
        isSaving={updateInf.isPending}
      />
    </div>
  );
}
