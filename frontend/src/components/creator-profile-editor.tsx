import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  useGetInfluencer,
  useUpdateInfluencer,
  SocialAccount,
  getGetInfluencerQueryKey,
  getGetMeQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Camera,
  Check,
  MapPin,
  Sparkles,
  Globe,
  IndianRupee,
  Eye,
  UploadCloud,
  Loader2,
  Trash2,
} from "lucide-react";
import { SocialAccountsForm } from "@/components/social-accounts-form";

const AVAILABLE_LANGUAGES = ["English", "Hindi", "Marathi", "Gujarati", "Tamil", "Bengali"];

export function CreatorProfileEditor({ profileId }: { profileId?: number }) {
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  const targetId = profileId || user?.profileId || 1;
  const { data: inf, isLoading } = useGetInfluencer(targetId, { query: { enabled: true } as any });
  const updateInf = useUpdateInfluencer();

  // ─── Local State Initialized with Server Data or Editorial Fallbacks ───
  const [name, setName] = useState("Maya");
  const [category, setCategory] = useState("Lifestyle");
  const [startingRate, setStartingRate] = useState("4500");
  const [state, setState] = useState("Maharashtra");
  const [city, setCity] = useState("Mumbai");
  const [languages, setLanguages] = useState<string[]>(["English"]);
  const [bio, setBio] = useState(
    "Lifestyle & everyday aesthetic creator based in Mumbai. Partnering with consumer brands for high-retention Reels and authentic product storytelling."
  );
  const [coverUrl, setCoverUrl] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Sync state when server data is loaded
  useEffect(() => {
    if (inf) {
      if (user?.name || (inf as any)?.name) {
        setName(user?.name?.trim().split(" ")[0] || (inf as any)?.name || "Maya");
      }
      if (inf.category) setCategory(inf.category);
      if (inf.collaborationCost !== undefined && inf.collaborationCost !== null) {
        setStartingRate(String(inf.collaborationCost));
      }
      if ((inf as any).state) setState((inf as any).state);
      if ((inf as any).city) setCity((inf as any).city);
      if (Array.isArray(inf.languages) && inf.languages.length > 0) {
        setLanguages(inf.languages);
      }
      if (inf.bio) setBio(inf.bio);
      if (inf.coverUrl) setCoverUrl(inf.coverUrl);
      if (inf.avatarUrl || user?.avatarUrl) setAvatarUrl(inf.avatarUrl || user?.avatarUrl || "");
    }
  }, [inf, user]);

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "MC";

  const toggleLanguage = (lang: string) => {
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: getGetInfluencerQueryKey(targetId) });
    queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
  };

  // ─── Cover Image Upload Handler ───
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid image type. Please select a JPG, PNG, or WEBP file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Cover image file size must be less than 10MB.");
      return;
    }

    setIsUploadingCover(true);
    try {
      const presignRes = await fetch("/api/upload/cover/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          contentLength: file.size,
        }),
      });

      if (!presignRes.ok) {
        const errData = await presignRes.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to authorize cover upload.");
      }

      const { uploadUrl, objectKey } = await presignRes.json();
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) throw new Error("Failed to upload cover image.");

      const confirmRes = await fetch("/api/upload/cover/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ storageKey: objectKey }),
      });

      if (!confirmRes.ok) throw new Error("Failed to confirm cover upload.");

      const data = await confirmRes.json();
      if (data.url) {
        setCoverUrl(data.url);
        toast.success("Cover banner updated!");
        updateInf.mutate(
          { id: targetId, data: { coverUrl: data.url } as any },
          { onSuccess: invalidateQueries }
        );
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to upload cover banner.");
    } finally {
      setIsUploadingCover(false);
    }
  };

  // ─── Avatar Upload Handler ───
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid image type. Please select a JPG, PNG, or WEBP file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Avatar image file size must be less than 10MB.");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const presignRes = await fetch("/api/upload/avatar/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          contentLength: file.size,
        }),
      });

      if (!presignRes.ok) {
        const errData = await presignRes.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to authorize avatar upload.");
      }

      const { uploadUrl, objectKey } = await presignRes.json();
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) throw new Error("Failed to upload avatar image.");

      const confirmRes = await fetch("/api/upload/avatar/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ storageKey: objectKey }),
      });

      if (!confirmRes.ok) throw new Error("Failed to confirm avatar upload.");

      const data = await confirmRes.json();
      if (data.url) {
        setAvatarUrl(data.url);
        if (user) {
          setUser({ ...(user as any), avatarUrl: data.url });
        }
        toast.success("Profile image updated!");
        updateInf.mutate(
          { id: targetId, data: { avatarUrl: data.url } as any },
          { onSuccess: invalidateQueries }
        );
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to upload avatar image.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // ─── Discard Changes ───
  const handleDiscard = () => {
    if (inf) {
      setName(user?.name?.trim().split(" ")[0] || (inf as any)?.name || "Maya");
      setCategory(inf.category || "Lifestyle");
      setStartingRate(String(inf.collaborationCost ?? 4500));
      setState((inf as any).state || "Maharashtra");
      setCity((inf as any).city || "Mumbai");
      setLanguages(
        Array.isArray(inf.languages) && inf.languages.length > 0 ? inf.languages : ["English"]
      );
      setBio(
        inf.bio ||
          "Lifestyle & everyday aesthetic creator based in Mumbai. Partnering with consumer brands for high-retention Reels and authentic product storytelling."
      );
      setCoverUrl(inf.coverUrl || "");
      setAvatarUrl(inf.avatarUrl || user?.avatarUrl || "");
      toast.info("Changes reverted to published profile.");
    }
  };

  // ─── Save & Publish ───
  const handleSave = () => {
    if (bio.length > 250) {
      toast.error("Bio cannot exceed 250 characters.");
      return;
    }

    updateInf.mutate(
      {
        id: targetId,
        data: {
          category,
          collaborationCost: Number(startingRate) || 0,
          state,
          city,
          languages,
          bio,
          coverUrl,
          avatarUrl,
        } as any,
      },
      {
        onSuccess: () => {
          toast.success("Profile & Media Kit published successfully!");
          invalidateQueries();
        },
        onError: (err: any) => {
          toast.error(err?.message || "Failed to publish profile updates.");
        },
      }
    );
  };

  // ─── Social Media Accounts Sync ───
  const handleSaveSocialAccounts = (accounts: SocialAccount[]) => {
    updateInf.mutate(
      {
        id: targetId,
        data: { socialAccounts: accounts } as any,
      },
      {
        onSuccess: () => {
          toast.success("Social accounts updated successfully");
          invalidateQueries();
        },
        onError: () => toast.error("Failed to update social accounts."),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-6 h-6 animate-spin text-[#6A0D18]" />
        <span className="text-xs text-zinc-500 font-medium">Loading Creator Studio...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-[#0A0A0A]">
      {/* ─── Top Page Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E5E4DF] pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6A0D18] mb-1">
            Creator Studio
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-[#0A0A0A]">
            {name}’s{" "}
            <span className="font-serif italic font-normal text-[#6A0D18]">
              Profile & Media Kit
            </span>
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Configure how your storefront, deliverables, and starting rates appear to verified
            brands.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDiscard}
            disabled={updateInf.isPending}
            className="px-4 py-2.5 text-xs font-semibold text-zinc-700 bg-white border border-[#E5E4DF] hover:bg-zinc-50 rounded-lg transition-colors cursor-pointer"
          >
            Discard Changes
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={updateInf.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold liquid-burgundy-metal rounded-lg shadow-xs transition-all active:scale-[0.99] cursor-pointer"
          >
            {updateInf.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />}
            <span>Save & Publish Profile</span>
          </button>
        </div>
      </div>

      {/* ─── Asymmetric 7 / 5 Grid Structure ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* ─── LEFT: STRUCTURED EDITOR ─── */}
        <div className="xl:col-span-7 2xl:col-span-8 space-y-6 min-w-0">
          {/* Section 1: Unified Visual Identity (Cover + Overlapping Avatar) */}
          <section className="bg-white rounded-2xl border border-[#E5E4DF] overflow-hidden shadow-xs">
            {/* Cover Banner Dropzone */}
            <div className="relative h-44 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 flex items-center justify-center group overflow-hidden">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt="Cover Banner"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                />
              ) : null}

              {/* Upload Overlay */}
              <div
                className={`absolute inset-0 bg-black/40 ${coverUrl ? "opacity-0 group-hover:opacity-100" : "opacity-100"} transition-opacity flex items-center justify-center`}
              >
                <label className="cursor-pointer inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/85 hover:bg-white backdrop-blur-md border border-white/60 text-xs font-semibold text-[#0A0A0A] shadow-sm transition-all">
                  {isUploadingCover ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#6A0D18]" />
                  ) : (
                    <UploadCloud className="w-4 h-4 text-[#6A0D18]" />
                  )}
                  <span>
                    {isUploadingCover
                      ? "Uploading..."
                      : coverUrl
                        ? "Change Cover Banner"
                        : "Upload Cover Banner"}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleCoverUpload}
                    disabled={isUploadingCover}
                  />
                </label>
              </div>

              <span className="absolute bottom-3 right-4 text-xs text-white/70 pointer-events-none drop-shadow-xs">
                1500 × 500px • JPG, PNG or WEBP
              </span>

              {coverUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setCoverUrl("");
                    updateInf.mutate(
                      { id: targetId, data: { coverUrl: "" } as any },
                      { onSuccess: invalidateQueries }
                    );
                    toast.success("Cover removed");
                  }}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/60 hover:bg-red-600 text-white text-xs transition-colors cursor-pointer"
                  title="Remove cover photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Overlapping Avatar + Identity Bar */}
            <div className="px-6 pb-6">
              <div className="relative -mt-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="flex items-end gap-4">
                  <div className="relative w-24 h-24 rounded-2xl bg-[#6A0D18] border-4 border-white shadow-md flex items-center justify-center text-white text-2xl font-bold shrink-0 overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                    <label
                      aria-label="Change profile image"
                      className="cursor-pointer absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-lg bg-[#0A0A0A] text-white flex items-center justify-center border-2 border-white hover:bg-zinc-800 transition-colors shadow-xs"
                    >
                      {isUploadingAvatar ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                      ) : (
                        <Camera className="w-3.5 h-3.5" />
                      )}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={handleAvatarUpload}
                        disabled={isUploadingAvatar}
                      />
                    </label>
                  </div>
                  <div className="pb-1">
                    <h2 className="text-base font-bold text-[#0A0A0A]">{name}</h2>
                    <p className="text-xs text-zinc-500">JPG, PNG or WEBP • Max 10MB</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Commercials & Niche */}
          <section className="bg-white rounded-2xl border border-[#E5E4DF] p-6 space-y-5 shadow-xs">
            <div className="border-b border-[#E5E4DF] pb-3">
              <h3 className="text-sm font-bold text-[#0A0A0A]">Commercials & Niche</h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Set your primary content vertical and baseline collaboration rate.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700">
                  Primary Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#E5E4DF] bg-[#FAF9F6] text-sm font-medium text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#6A0D18]/20 focus:border-[#6A0D18] cursor-pointer"
                >
                  <option value="Lifestyle">Lifestyle</option>
                  <option value="Fashion & Beauty">Fashion & Beauty</option>
                  <option value="Tech & Gadgets">Tech & Gadgets</option>
                  <option value="Food & Travel">Food & Travel</option>
                  <option value="Fitness & Wellness">Fitness & Wellness</option>
                  <option value="Gaming & Esports">Gaming & Esports</option>
                  <option value="Finance & Business">Finance & Business</option>
                  <option value="Entertainment">Entertainment</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700">
                  Starting Rate (INR)
                </label>
                <div className="relative">
                  <IndianRupee className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="number"
                    min={0}
                    value={startingRate}
                    onChange={(e) => setStartingRate(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#E5E4DF] bg-[#FAF9F6] text-sm font-semibold text-[#0A0A0A] font-tabular focus:outline-none focus:ring-2 focus:ring-[#6A0D18]/20 focus:border-[#6A0D18]"
                  />
                </div>
                <p className="text-xs text-zinc-400">Minimum single-deliverable campaign rate</p>
              </div>
            </div>
          </section>

          {/* Section 3: Location & Languages */}
          <section className="bg-white rounded-2xl border border-[#E5E4DF] p-6 space-y-5 shadow-xs">
            <div className="border-b border-[#E5E4DF] pb-3">
              <h3 className="text-sm font-bold text-[#0A0A0A]">Location & Content Languages</h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Helps brands filter creators for regional shoots and vernacular campaigns.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700">Country</label>
                <div className="h-10 px-3 rounded-lg border border-[#E5E4DF] bg-zinc-100/70 flex items-center justify-between text-xs font-medium text-zinc-600">
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-zinc-400" />
                    India
                  </span>
                  <span className="text-zinc-400">Default</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700">State / UT</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#E5E4DF] bg-[#FAF9F6] text-sm font-medium text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#6A0D18]/20 focus:border-[#6A0D18] cursor-pointer"
                >
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Delhi NCR">Delhi NCR</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Telangana">Telangana</option>
                  <option value="West Bengal">West Bengal</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Rajasthan">Rajasthan</option>
                  <option value="Punjab">Punjab</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Mumbai"
                  className="w-full h-10 px-3 rounded-lg border border-[#E5E4DF] bg-[#FAF9F6] text-sm font-medium text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#6A0D18]/20 focus:border-[#6A0D18]"
                />
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <label className="block text-xs font-semibold text-zinc-700">Languages Spoken</label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_LANGUAGES.map((lang) => {
                  const selected = languages.includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        selected
                          ? "bg-[#0A0A0A] text-white border-[#0A0A0A]"
                          : "bg-[#FAF9F6] text-zinc-600 border-[#E5E4DF] hover:border-zinc-400"
                      }`}
                    >
                      {selected && <Check className="w-3.5 h-3.5 text-[#EED8DC]" />}
                      <span>{lang}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Section 4: Public Bio */}
          <section className="bg-white rounded-2xl border border-[#E5E4DF] p-6 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-[#0A0A0A]">Public Bio & Pitch</label>
              <span
                className={`text-xs font-medium font-tabular ${bio.length >= 250 ? "text-red-500 font-bold" : "text-zinc-400"}`}
              >
                {bio.length} / 250
              </span>
            </div>
            <textarea
              rows={4}
              maxLength={250}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Describe your audience demographic, content style, and past brand niches..."
              className="w-full p-3.5 rounded-xl border border-[#E5E4DF] bg-[#FAF9F6] text-sm text-[#0A0A0A] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#6A0D18]/20 focus:border-[#6A0D18] resize-none"
            />
          </section>

          {/* Section 5: Connected Social Channels */}
          <div className="pt-2">
            <SocialAccountsForm
              creatorId={targetId}
              initialAccounts={inf?.socialAccounts || []}
              onSave={handleSaveSocialAccounts}
              mode="settings"
              isSaving={updateInf.isPending}
            />
          </div>
        </div>

        {/* ─── RIGHT: STICKY LIVE BRAND PREVIEW ─── */}
        <div className="xl:col-span-5 2xl:col-span-4 xl:sticky xl:top-20 space-y-3 min-w-0">
          <div className="flex items-center justify-between px-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600">
              <Eye className="w-3.5 h-3.5 text-[#6A0D18]" />
              Live Brand Discovery Preview
            </span>
            <span className="text-xs text-zinc-400">Updates in real time</span>
          </div>

          {/* Glassmorphic Creator Media Kit Card */}
          <div className="rounded-2xl border border-[#E5E4DF] bg-white overflow-hidden shadow-[0_20px_40px_-15px_rgba(15,23,42,0.08)]">
            {/* Mini Cover */}
            <div className="h-32 bg-gradient-to-br from-zinc-900 via-[#3D060D] to-[#6A0D18] relative p-4 flex justify-end items-start overflow-hidden">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt="Cover Preview"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
              <span className="relative z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/75 backdrop-blur-md border border-white/80 text-xs font-semibold text-[#0A0A0A] shadow-xs">
                <Sparkles className="w-3 h-3 text-[#6A0D18]" />
                {category}
              </span>
            </div>

            <div className="px-6 pb-6">
              {/* Avatar & Starting Rate */}
              <div className="-mt-10 mb-3 flex items-end justify-between">
                <div className="relative w-20 h-20 rounded-2xl bg-[#6A0D18] border-4 border-white shadow-sm flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xs text-zinc-400 block">Starting at</span>
                  <span className="text-lg font-bold text-[#0A0A0A] font-tabular">
                    ₹{Number(startingRate || 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Identity & Location */}
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[#0A0A0A]">{name}</h3>
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                  <span>
                    {city || "City"}, {state}
                  </span>
                </div>
              </div>

              {/* Bio */}
              <p className="mt-4 text-xs text-zinc-600 leading-relaxed">
                {bio || "Your public bio will appear here for brand managers reviewing your pitch."}
              </p>

              {/* Languages */}
              <div className="mt-4 pt-4 border-t border-[#E5E4DF] flex flex-wrap gap-1.5">
                {languages.length > 0 ? (
                  languages.map((lang) => (
                    <span
                      key={lang}
                      className="px-2.5 py-1 rounded-md bg-[#FAF9F6] border border-[#E5E4DF] text-xs font-medium text-zinc-700"
                    >
                      {lang}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-zinc-400">No languages selected</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreatorProfileEditor;
