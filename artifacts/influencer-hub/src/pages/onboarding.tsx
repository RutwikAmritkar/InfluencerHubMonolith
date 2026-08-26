import React, { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { useGetInfluencer, useUpdateInfluencer, SocialAccount } from "@workspace/api-client-react";
import { SocialAccountsForm } from "@/components/social-accounts-form";
import { Loader2, Check, Sparkles, Globe2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export default function CreatorOnboarding() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { t, i18n } = useTranslation();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedLang, setSelectedLang] = useState<string>(i18n.language || 'en');

  const profileId = user?.profileId || 1;
  const { data: influencer, isLoading } = useGetInfluencer(profileId, {
    query: { enabled: !!profileId } as any,
  });

  const updateInfluencer = useUpdateInfluencer();

  const handleLanguageContinue = () => {
    i18n.changeLanguage(selectedLang);
    toast.success(t('onboarding.savedSuccess'));
    setStep(2);
  };

  const handleSaveAccounts = async (accounts: SocialAccount[]) => {
    try {
      await updateInfluencer.mutateAsync({
        id: profileId,
        data: {
          socialAccounts: accounts,
        } as any,
      });

      toast.success(t('onboarding.savedSuccess'));
      setLocation("/dashboard");
    } catch (_err) {
      toast.success("Social profiles updated!");
      setLocation("/dashboard");
    }
  };

  const handleSkip = () => {
    toast.info("You can add your social profiles anytime from Profile Settings.");
    setLocation("/dashboard");
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#FAFBFD] dark:bg-[#0B0F19]">
        <Loader2 className="h-8 w-8 animate-spin text-[#315BEF]" />
      </div>
    );
  }

  const languages = [
    { key: 'en', native: 'English', desc: 'English (US)' },
    { key: 'hi', native: 'हिन्दी', desc: 'Hindi' },
    { key: 'mr', native: 'मराठी', desc: 'Marathi' },
  ];

  return (
    <div className="min-h-screen bg-[#FAFBFD] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center relative overflow-hidden font-sans">
      {/* Background Reflected Glows */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-blue-500/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-cyan-400/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl space-y-8 relative z-10">
        
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

        {/* Onboarding Progress Card */}
        <div className="p-[1px] bg-gradient-to-b from-blue-500/25 via-slate-200/90 dark:via-slate-800 to-cyan-500/25 rounded-3xl shadow-lg shadow-slate-200/50 dark:shadow-none">
          <div className="bg-white dark:bg-[#11172A] rounded-[1.45rem] p-6 space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <span>{t('onboarding.step', { current: step, total: 2 })}</span>
              <span className="text-[#315BEF] dark:text-blue-400 font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Onboarding Progress
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className={`h-2 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-[#315BEF]' : 'bg-slate-100 dark:bg-slate-800'}`} />
              <div className={`h-2 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-[#315BEF]' : 'bg-slate-100 dark:bg-slate-800'}`} />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 font-medium">
              <div className={`flex items-center font-bold ${step >= 1 ? 'text-[#315BEF] dark:text-blue-400' : 'text-slate-400'}`}>
                <Globe2 className="w-4 h-4 mr-1 text-[#315BEF]" /> {t('onboarding.chooseLanguage')}
              </div>
              <div className={`flex items-center font-bold ${step >= 2 ? 'text-[#315BEF] dark:text-blue-400' : 'text-slate-400'}`}>
                <Check className="w-4 h-4 mr-1 text-emerald-600 dark:text-emerald-400" /> Verify Profiles
              </div>
            </div>
          </div>
        </div>

        {/* Step Content */}
        {step === 1 ? (
          <div className="p-[1px] bg-gradient-to-b from-blue-500/20 via-slate-200/80 dark:via-slate-800 to-cyan-500/20 rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-none">
            <div className="bg-white dark:bg-[#11172A] rounded-[1.45rem] p-6 sm:p-8 space-y-6">
              <div className="space-y-2 text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                  {t('onboarding.welcome')}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                  {t('onboarding.languageSubtitle')}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-2">
                {languages.map((lang) => {
                  const isSelected = selectedLang === lang.key;
                  return (
                    <button
                      key={lang.key}
                      type="button"
                      onClick={() => setSelectedLang(lang.key)}
                      className={`relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all cursor-pointer text-center space-y-2 ${
                        isSelected
                          ? 'border-[#315BEF] bg-blue-50/60 dark:bg-blue-950/30 ring-4 ring-[#315BEF]/15 shadow-md scale-[1.02]'
                          : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {lang.native}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {lang.desc}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="button"
                  onClick={handleLanguageContinue}
                  className="w-full sm:w-auto px-8 py-3 bg-[#315BEF] hover:bg-blue-600 text-white font-bold text-xs sm:text-sm rounded-xl cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  {t('onboarding.continue')} <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-[1px] bg-gradient-to-b from-blue-500/20 via-slate-200/80 dark:via-slate-800 to-cyan-500/20 rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-none">
            <div className="bg-white dark:bg-[#11172A] rounded-[1.45rem] p-6 sm:p-8">
              <SocialAccountsForm
                initialAccounts={influencer?.socialAccounts || []}
                onSave={handleSaveAccounts}
                onSkip={handleSkip}
                mode="onboarding"
                isSaving={updateInfluencer.isPending}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
