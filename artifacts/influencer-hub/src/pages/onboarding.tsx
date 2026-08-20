import React from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { useGetInfluencer, useUpdateInfluencer, SocialAccount } from "@workspace/api-client-react";
import { SocialAccountsForm } from "@/components/social-accounts-form";
import { Loader2, Check, ShieldCheck, Sparkles, Globe2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function CreatorOnboarding() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const profileId = user?.profileId || 1;
  const { data: influencer, isLoading } = useGetInfluencer(profileId, {
    query: { enabled: !!profileId } as any,
  });

  const updateInfluencer = useUpdateInfluencer();

  const handleSaveAccounts = async (accounts: SocialAccount[]) => {
    try {
      await updateInfluencer.mutateAsync({
        id: profileId,
        data: {
          socialAccounts: accounts,
        } as any,
      });

      toast.success("Social profiles saved successfully!");
      setLocation("/dashboard");
    } catch (_err) {
      toast.error("Failed to save social profiles. Please try again.");
    }
  };

  const handleSkip = () => {
    toast.info("You can add your social profiles anytime from Profile Settings.");
    setLocation("/dashboard");
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#FAFBFD]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFBFD] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center relative overflow-hidden font-sans">
      {/* Background Reflected Glows */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-blue-500/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-cyan-400/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl space-y-8 relative z-10">
        
        {/* Header Branding */}
        <div className="flex justify-center">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md shadow-blue-600/25 group-hover:scale-105 transition-transform duration-300">
                I
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-950">
                Influencer<span className="text-blue-600">Hub</span>
              </span>
            </div>
          </Link>
        </div>

        {/* Onboarding Progress Card */}
        <div className="p-[1px] bg-gradient-to-b from-blue-500/25 via-slate-200/90 to-cyan-500/25 rounded-3xl shadow-lg shadow-slate-200/50">
          <div className="bg-white rounded-[1.45rem] p-6 space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Step 2 of 3</span>
              <span className="text-blue-600 font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" /> Onboarding Progress
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="h-2 rounded-full bg-blue-600 shadow-xs" />
              <div className="h-2 rounded-full bg-blue-600 shadow-xs" />
              <div className="h-2 rounded-full bg-slate-100" />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1 font-medium">
              <div className="flex items-center text-blue-600 font-bold">
                <Check className="w-4 h-4 mr-1 text-emerald-600" /> Account Created
              </div>
              <div className="flex items-center text-slate-900 font-bold">
                <Globe2 className="w-4 h-4 mr-1 text-blue-600" /> Verify Profiles
              </div>
              <div className="flex items-center text-slate-400">Complete Profile</div>
            </div>
          </div>
        </div>

        {/* Main Form Component */}
        <div className="p-[1px] bg-gradient-to-b from-blue-500/20 via-slate-200/80 to-cyan-500/20 rounded-3xl shadow-xl shadow-slate-200/60">
          <div className="bg-white rounded-[1.45rem] p-8">
            <SocialAccountsForm
              initialAccounts={influencer?.socialAccounts || []}
              onSave={handleSaveAccounts}
              onSkip={handleSkip}
              mode="onboarding"
              isSaving={updateInfluencer.isPending}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
