import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import InfluencerDetail from "@/pages/influencers/detail";
import { CreatorProfileEditor } from "@/components/creator-profile-editor";
import {
  User,
  Eye,
  ShieldCheck,
  CheckCircle2,
  Copy,
  ExternalLink,
  Instagram,
  Youtube,
  KeyRound,
  Check,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function MyProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyPlatform, setVerifyPlatform] = useState<"instagram" | "youtube">("instagram");
  const [verifyHandle, setVerifyHandle] = useState("");

  const profileId = user?.profileId || 1;

  // Fetch influencer data
  const { data: influencer, refetch } = useQuery({
    queryKey: ["influencerProfile", profileId],
    queryFn: async () => {
      const res = await fetch(`/api/influencers/${profileId}`);
      if (!res.ok) return null;
      return res.json();
    },
  });

  // Token Generation Mutation
  const tokenMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/influencers/verification-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to generate verification token.");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success("Verification token generated! Copy it into your public bio.");
      refetch();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // Social Verification Mutation
  const verifySocialMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/influencers/verify-social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: verifyPlatform,
          handleOrUrl: verifyHandle.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Verification failed.");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setShowVerifyModal(false);
      toast.success(data.message || "Social handle verified successfully!");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["influencerProfile"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const creatorHandle =
    influencer?.socialAccounts?.[0]?.username || (user?.email ? user.email.split("@")[0] : "maya");
  const publicKitUrl = `${window.location.origin}/c/${creatorHandle}`;
  const isIgVerified = Boolean(influencer?.instagramVerified);
  const isYtVerified = Boolean(influencer?.youtubeVerified);
  const verificationCode = influencer?.verificationCode;

  const copyPublicLink = () => {
    navigator.clipboard.writeText(publicKitUrl);
    toast.success("Public Media Kit link copied to clipboard!");
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Verification code copied to clipboard!");
  };

  return (
    <div className="workspace-canvas space-y-6 pb-12 text-[#0A0A0A]">
      {/* ─── 1. VERIFIED HANDLE & PUBLIC MEDIA KIT BANNER ───────────────────── */}
      <div className="p-5 rounded-2xl bg-white border border-[#E5E4DF] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
              Verified Social Roster
            </span>
            {(isIgVerified || isYtVerified) && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Verified Creator</span>
              </span>
            )}
          </div>
          <h2 className="text-base sm:text-lg font-bold text-[#0A0A0A]">
            Social Handle Ownership &amp; Public Media Kit
          </h2>
          <p className="text-xs text-zinc-500">
            Authenticate your Instagram/YouTube handle via short bio verification token to activate
            your verified badge.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowVerifyModal(true)}
            className="h-9 px-3 rounded-xl border-[#E5E4DF] bg-white hover:bg-zinc-50 text-xs font-semibold shadow-2xs inline-flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
            <span>Verify Handle</span>
          </Button>

          <Button
            size="sm"
            onClick={copyPublicLink}
            className="h-9 px-3.5 rounded-xl bg-[#0A0A0A] hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs inline-flex items-center gap-1.5"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Media Kit Link</span>
          </Button>

          <a
            href={`/c/${creatorHandle}`}
            target="_blank"
            rel="noreferrer"
            className="h-9 px-3 rounded-xl border border-[#E5E4DF] bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 inline-flex items-center gap-1 shadow-2xs"
          >
            <span>Preview Kit</span>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
          </a>
        </div>
      </div>

      {/* Verification Code Active Pill if present */}
      {verificationCode && (
        <div className="p-3.5 rounded-xl bg-blue-50/40 border border-blue-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-blue-700 shrink-0" />
            <div>
              <span className="font-semibold text-zinc-800">Your Bio Verification Token: </span>
              <code className="font-mono font-bold text-blue-800 bg-white px-2 py-0.5 rounded border border-blue-200">
                {verificationCode}
              </code>
            </div>
          </div>
          <button
            onClick={() => copyCode(verificationCode)}
            className="text-xs font-bold text-blue-700 hover:underline cursor-pointer inline-flex items-center gap-1"
          >
            <Copy className="w-3 h-3" />
            <span>Copy Token</span>
          </button>
        </div>
      )}

      {/* Studio Mode Switcher */}
      <div className="flex items-center justify-between border-b border-[#E5E4DF] pb-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700">
          <span>Creator Studio</span>
          <span className="text-zinc-300">•</span>
          <span className="text-zinc-500 font-medium normal-case">
            Storefront &amp; Deliverable Configuration
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-[#FAF9F6] p-1 rounded-xl border border-[#E5E4DF] shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("edit")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "edit"
                ? "bg-[#0A0A0A] text-white shadow-xs"
                : "text-[#52525B] hover:text-[#0A0A0A]"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile Editor</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "preview"
                ? "bg-[#0A0A0A] text-white shadow-xs"
                : "text-[#52525B] hover:text-[#0A0A0A]"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Full Public Dossier</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "edit" ? (
        <CreatorProfileEditor profileId={profileId} />
      ) : (
        <div className="bg-white p-6 rounded-2xl border border-[#E5E4DF] shadow-xs">
          <InfluencerDetail params={{ id: String(profileId) }} />
        </div>
      )}

      {/* ─── VERIFY SOCIAL ACCOUNT DIALOG ─────────────────────────────────── */}
      <Dialog open={showVerifyModal} onOpenChange={setShowVerifyModal}>
        <DialogContent className="max-w-md bg-[#FAF9F6] border border-[#E5E4DF] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0A0A0A]">
              Authenticate Social Handle
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Verify your Instagram or YouTube handle to earn an authenticated badge and lock your
              media kit.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Step 1: Token Generation */}
            <div className="p-3.5 rounded-xl bg-white border border-[#E5E4DF] space-y-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Step 1: Bio Verification Token
              </span>
              {verificationCode ? (
                <div className="flex items-center justify-between">
                  <code className="font-mono font-bold text-sm text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                    {verificationCode}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyCode(verificationCode)}
                    className="h-8 text-xs font-semibold"
                  >
                    Copy Token
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={() => tokenMutation.mutate()}
                  disabled={tokenMutation.isPending}
                  className="w-full bg-[#0A0A0A] text-white text-xs font-semibold rounded-lg"
                >
                  {tokenMutation.isPending ? "Generating..." : "Generate Bio Token"}
                </Button>
              )}
              <p className="text-[11px] text-zinc-500">
                Paste this token into your Instagram bio or YouTube channel description.
              </p>
            </div>

            {/* Step 2: Handle Verification Form */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">
                  Select Platform *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVerifyPlatform("instagram")}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      verifyPlatform === "instagram"
                        ? "bg-white text-pink-700 border-pink-300 shadow-xs"
                        : "bg-zinc-50 text-zinc-600 border-[#E5E4DF]"
                    }`}
                  >
                    <Instagram className="w-3.5 h-3.5 text-pink-600" />
                    <span>Instagram</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVerifyPlatform("youtube")}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      verifyPlatform === "youtube"
                        ? "bg-white text-red-700 border-red-300 shadow-xs"
                        : "bg-zinc-50 text-zinc-600 border-[#E5E4DF]"
                    }`}
                  >
                    <Youtube className="w-3.5 h-3.5 text-red-600" />
                    <span>YouTube</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">
                  Handle or Profile URL *
                </label>
                <input
                  type="text"
                  placeholder={verifyPlatform === "instagram" ? "@mayachen_tech" : "@techburner"}
                  value={verifyHandle}
                  onChange={(e) => setVerifyHandle(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-lg bg-white border border-[#E5E4DF] text-xs text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-blue-700/20"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E4DF]">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVerifyModal(false)}
              className="rounded-lg text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={verifySocialMutation.isPending || !verifyHandle.trim()}
              onClick={() => verifySocialMutation.mutate()}
              className="rounded-lg bg-[#0A0A0A] hover:bg-zinc-800 text-white text-xs font-semibold"
            >
              {verifySocialMutation.isPending ? "Verifying Handle..." : "Verify Ownership"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
