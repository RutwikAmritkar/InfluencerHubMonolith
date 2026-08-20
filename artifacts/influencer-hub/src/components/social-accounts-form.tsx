import React, { useState, useEffect } from "react";
import { SocialAccount, SocialAccountStatus, SocialAccountVerificationType, useVerifySocialAccount } from "@workspace/api-client-react";

type VerificationType = SocialAccountVerificationType;
import { PLATFORM_CONFIGS, PlatformConfig, SocialIcon, SocialPlatformId } from "./social-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Link as LinkIcon,
  AtSign,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  RotateCw,
} from "lucide-react";
import { toast } from "sonner";

interface SocialAccountDraft {
  id?: string;
  creatorId?: number;
  platform: SocialPlatformId;
  value: string; // raw handle or url
  inputType: "username" | "url";
  status: SocialAccountStatus;
  verificationType?: VerificationType;
  verifiedAt?: string;
  errorMessage?: string;
  isVerifying?: boolean;
  error?: string;
}

interface SocialAccountsFormProps {
  creatorId?: number;
  initialAccounts?: SocialAccount[];
  onSave: (accounts: SocialAccount[]) => void | Promise<void>;
  onSkip?: () => void;
  mode?: "onboarding" | "settings";
  isSaving?: boolean;
}

export function SocialAccountsForm({
  creatorId = 1,
  initialAccounts = [],
  onSave,
  onSkip,
  mode = "onboarding",
  isSaving = false,
}: SocialAccountsFormProps) {
  const [step, setStep] = useState<"input" | "review">("input");
  const verifyMutation = useVerifySocialAccount();

  // Convert initialAccounts to draft list
  const [drafts, setDrafts] = useState<SocialAccountDraft[]>(() => {
    if (initialAccounts.length > 0) {
      return initialAccounts.map((acc) => ({
        id: acc.id,
        creatorId: acc.creatorId,
        platform: (acc.platform.toLowerCase() as SocialPlatformId) || "other",
        value: acc.inputType === "username" ? acc.username || "" : acc.profileUrl || "",
        inputType: acc.inputType || "username",
        status: (acc.status as SocialAccountStatus) || "UNVERIFIED",
        verificationType: acc.verificationType,
        verifiedAt: acc.verifiedAt,
        errorMessage: acc.errorMessage,
      }));
    }

    // Default initial platform when no accounts exist
    return [
      { platform: "instagram", value: "", inputType: "username", status: "UNVERIFIED" },
    ];
  });

  const initialAccountsSerialized = JSON.stringify(initialAccounts);

  useEffect(() => {
    if (initialAccounts && initialAccounts.length > 0) {
      setDrafts(
        initialAccounts.map((acc) => ({
          id: acc.id,
          creatorId: acc.creatorId,
          platform: (acc.platform.toLowerCase() as SocialPlatformId) || "other",
          value: acc.inputType === "username" ? acc.username || "" : acc.profileUrl || "",
          inputType: acc.inputType || "username",
          status: (acc.status as SocialAccountStatus) || "UNVERIFIED",
          verificationType: acc.verificationType,
          verifiedAt: acc.verifiedAt,
          errorMessage: acc.errorMessage,
        }))
      );
    }
  }, [initialAccountsSerialized]);

  const availablePlatforms = (Object.keys(PLATFORM_CONFIGS) as SocialPlatformId[]).filter(
    (p) => !drafts.some((d) => d.platform === p)
  );

  const handleAddPlatform = (platform: SocialPlatformId) => {
    const config = PLATFORM_CONFIGS[platform];
    setDrafts((prev) => [
      ...prev,
      {
        platform,
        value: "",
        inputType: config.defaultInputType,
        status: "UNVERIFIED",
      },
    ]);
  };

  const handleRemovePlatform = (platform: SocialPlatformId) => {
    setDrafts((prev) => prev.filter((d) => d.platform !== platform));
  };

  const handleInputChange = (platform: SocialPlatformId, val: string) => {
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.platform !== platform) return d;

        let updatedType = d.inputType;
        if (val.trim().startsWith("http://") || val.trim().startsWith("https://") || val.includes(".com") || val.includes(".tv")) {
          updatedType = "url";
        } else if (val.trim().startsWith("@") || (!val.includes("/") && !val.includes("."))) {
          updatedType = "username";
        }

        return {
          ...d,
          value: val,
          inputType: updatedType,
          status: "UNVERIFIED", // Reset verification status when input changes
          verificationType: undefined,
          verifiedAt: undefined,
          errorMessage: undefined,
          error: undefined,
        };
      })
    );
  };

  const handleTypeToggle = (platform: SocialPlatformId, newType: "username" | "url") => {
    setDrafts((prev) =>
      prev.map((d) => (d.platform === platform ? { ...d, inputType: newType, status: "UNVERIFIED", error: undefined } : d))
    );
  };

  // Normalization logic
  const normalizeAccount = (draft: SocialAccountDraft): { normalized: SocialAccount; error?: string } => {
    const raw = draft.value.trim();
    const config = PLATFORM_CONFIGS[draft.platform] || PLATFORM_CONFIGS.other;
    const now = new Date().toISOString();
    const accId = draft.id || `soc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    if (!raw) {
      return {
        normalized: {
          id: accId,
          creatorId,
          platform: draft.platform,
          inputType: draft.inputType,
          status: draft.status || "UNVERIFIED",
          createdAt: now,
          updatedAt: now,
        },
        error: `Please enter a valid ${config.name} ${draft.inputType === "username" ? "username" : "URL"}.`,
      };
    }

    if (draft.inputType === "username") {
      const cleanUsername = raw.replace(/^@+/, "").trim();
      if (!cleanUsername) {
        return {
          normalized: {
            id: accId,
            creatorId,
            platform: draft.platform,
            inputType: "username",
            status: draft.status || "UNVERIFIED",
            createdAt: now,
            updatedAt: now,
          },
          error: `Please enter a valid ${config.name} username.`,
        };
      }
      const profileUrl = `${config.urlPrefix}${cleanUsername}`;
      return {
        normalized: {
          id: accId,
          creatorId,
          platform: draft.platform,
          username: cleanUsername,
          profileUrl,
          inputType: "username",
          status: draft.status || "UNVERIFIED",
          verificationType: draft.verificationType,
          verifiedAt: draft.verifiedAt,
          errorMessage: draft.errorMessage,
          createdAt: now,
          updatedAt: now,
        },
      };
    } else {
      let urlStr = raw;
      if (!/^https?:\/\//i.test(urlStr)) {
        urlStr = `https://${urlStr}`;
      }

      try {
        const parsedUrl = new URL(urlStr);
        if (config.urlPattern && !config.urlPattern.test(urlStr)) {
          return {
            normalized: {
              id: accId,
              creatorId,
              platform: draft.platform,
              inputType: "url",
              status: draft.status || "UNVERIFIED",
              createdAt: now,
              updatedAt: now,
            },
            error: `Please enter a valid ${config.name} profile URL (e.g. ${config.urlPrefix}username).`,
          };
        }

        const pathSegments = parsedUrl.pathname.split("/").filter(Boolean);
        const extractedHandle = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1].replace(/^@/, "") : "";

        return {
          normalized: {
            id: accId,
            creatorId,
            platform: draft.platform,
            username: extractedHandle || undefined,
            profileUrl: parsedUrl.toString(),
            inputType: "url",
            status: draft.status || "UNVERIFIED",
            verificationType: draft.verificationType,
            verifiedAt: draft.verifiedAt,
            errorMessage: draft.errorMessage,
            createdAt: now,
            updatedAt: now,
          },
        };
      } catch (_e) {
        return {
          normalized: {
            id: accId,
            creatorId,
            platform: draft.platform,
            inputType: "url",
            status: draft.status || "UNVERIFIED",
            createdAt: now,
            updatedAt: now,
          },
          error: `Please enter a valid profile URL for ${config.name}.`,
        };
      }
    }
  };

  const handleVerify = async (platform: SocialPlatformId) => {
    const draftIndex = drafts.findIndex((d) => d.platform === platform);
    if (draftIndex === -1) return;
    const draft = drafts[draftIndex];

    const { normalized, error } = normalizeAccount(draft);
    if (error) {
      setDrafts((prev) => prev.map((d) => (d.platform === platform ? { ...d, error } : d)));
      toast.error(error);
      return;
    }

    // Set UI to VERIFYING state
    setDrafts((prev) =>
      prev.map((d) => (d.platform === platform ? { ...d, status: "VERIFYING", isVerifying: true, error: undefined } : d))
    );

    // Call API if account has backend ID
    if (draft.id) {
      verifyMutation.mutate(
        { id: creatorId, accountId: draft.id },
        {
          onSuccess: (updatedAcc) => {
            setDrafts((prev) =>
              prev.map((d) =>
                d.platform === platform
                  ? {
                      ...d,
                      status: updatedAcc.status as SocialAccountStatus,
                      verificationType: updatedAcc.verificationType,
                      verifiedAt: updatedAcc.verifiedAt,
                      errorMessage: updatedAcc.errorMessage,
                      isVerifying: false,
                    }
                  : d
              )
            );
            if (updatedAcc.status === "VERIFIED") {
              toast.success(`${PLATFORM_CONFIGS[platform].name} profile verified!`);
            } else {
              toast.error(updatedAcc.errorMessage || "Verification failed.");
            }
          },
          onError: () => {
            setDrafts((prev) =>
              prev.map((d) =>
                d.platform === platform
                  ? { ...d, status: "FAILED", errorMessage: "Verification error occurred.", isVerifying: false }
                  : d
              )
            );
            toast.error(`Verification failed for ${PLATFORM_CONFIGS[platform].name}.`);
          },
        }
      );
    } else {
      // Local profile validation for new draft
      setTimeout(() => {
        const config = PLATFORM_CONFIGS[platform];
        const rawVal = draft.value.trim();
        let isValid = false;

        if (draft.inputType === "url") {
          isValid = config.urlPattern ? config.urlPattern.test(rawVal) : rawVal.startsWith("http");
        } else {
          isValid = rawVal.replace(/^@+/, "").trim().length > 0;
        }

        const now = new Date().toISOString();
        setDrafts((prev) =>
          prev.map((d) =>
            d.platform === platform
              ? {
                  ...d,
                  status: isValid ? "VERIFIED" : "FAILED",
                  verificationType: isValid ? "PROFILE_EXISTS" : undefined,
                  verifiedAt: isValid ? now : undefined,
                  errorMessage: isValid ? undefined : `Could not verify ${config.name} profile URL or handle format.`,
                  isVerifying: false,
                }
              : d
          )
        );

        if (isValid) {
          toast.success(`${config.name} profile verified!`);
        } else {
          toast.error(`Could not verify ${config.name} profile format.`);
        }
      }, 700);
    }
  };

  const validateAll = (): { validAccounts: SocialAccount[]; errorsFound: boolean } => {
    let errorsFound = false;
    const validAccounts: SocialAccount[] = [];
    const updatedDrafts = [...drafts];

    const activeDrafts = updatedDrafts.filter((d) => d.value.trim().length > 0);

    activeDrafts.forEach((draft) => {
      const { normalized, error } = normalizeAccount(draft);
      if (error) {
        errorsFound = true;
        draft.error = error;
      } else {
        validAccounts.push(normalized);
      }
    });

    setDrafts(updatedDrafts);

    return { validAccounts, errorsFound };
  };

  const handleContinueToReview = () => {
    const { validAccounts, errorsFound } = validateAll();

    if (errorsFound) {
      toast.error("Please fix the validation errors before continuing.");
      return;
    }

    if (validAccounts.length === 0) {
      toast.error("Please add at least one social media account or click 'Skip for now'.");
      return;
    }

    if (mode === "onboarding") {
      setStep("review");
    } else {
      onSave(validAccounts);
    }
  };

  const handleFinalConfirm = () => {
    const { validAccounts, errorsFound } = validateAll();
    if (!errorsFound) {
      onSave(validAccounts);
    }
  };

  // Render Review Step
  if (step === "review") {
    const { validAccounts } = validateAll();

    return (
      <Card className="w-full shadow-sm border-muted">
        <CardHeader className="text-center pb-4 border-b">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Review your social profiles</CardTitle>
          <CardDescription className="text-sm">
            Check your connected accounts before saving them to your InfluencerHub profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-3">
            {validAccounts.map((acc) => {
              const config = PLATFORM_CONFIGS[(acc.platform.toLowerCase() as SocialPlatformId) || "other"];
              const displayHandle = acc.username ? `@${acc.username}` : acc.profileUrl;

              return (
                <div
                  key={acc.platform}
                  className="flex items-center justify-between p-4 rounded-xl border bg-card hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg ${config.bgLight} ${config.color}`}>
                      <SocialIcon platform={acc.platform} className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm">{config.name}</h4>
                        {acc.status === "VERIFIED" && (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs px-2 py-0.5 shadow-none font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{displayHandle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {acc.profileUrl && (
                      <a
                        href={acc.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary p-2 flex items-center"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" /> Visit
                      </a>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStep("input")}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t mt-6">
            <Button variant="outline" onClick={() => setStep("input")} className="w-full sm:w-auto">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Edit
            </Button>

            <Button onClick={handleFinalConfirm} disabled={isSaving} className="w-full sm:w-auto h-11 px-8">
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm & Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render Input Step
  return (
    <div className="w-full space-y-6">
      <Card className="shadow-sm border-muted">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            Connect your social profiles
          </CardTitle>
          <CardDescription className="text-sm">
            Add your social media profiles so brands can discover and evaluate your content.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {drafts.map((draft) => {
              const config = PLATFORM_CONFIGS[draft.platform] || PLATFORM_CONFIGS.other;

              return (
                <div
                  key={draft.platform}
                  className={`p-4 rounded-xl border transition-all ${config.bgLight} ${config.borderClass} space-y-3`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-md bg-white dark:bg-slate-900 shadow-xs ${config.color}`}>
                        <SocialIcon platform={draft.platform} className="w-5 h-5" />
                      </div>
                      <span className="font-semibold text-sm">{config.name}</span>

                      {/* Verification Status Badge */}
                      {draft.status === "VERIFIED" && (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-none font-medium flex items-center gap-1 text-xs px-2 py-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                        </Badge>
                      )}
                      {draft.status === "VERIFYING" && (
                        <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 shadow-none font-medium flex items-center gap-1 text-xs px-2 py-0.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying...
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Verify Action Button for Unverified / Failed accounts */}
                      {draft.value.trim().length > 0 && draft.status !== "VERIFIED" && draft.status !== "VERIFYING" && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleVerify(draft.platform)}
                          disabled={draft.isVerifying}
                          className="h-8 text-xs font-medium text-primary hover:text-primary hover:bg-primary/10 border-primary/30"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                          {draft.status === "FAILED" ? "Try Again" : "Verify"}
                        </Button>
                      )}

                      {/* Input Type Selector Toggle */}
                      <div className="flex items-center bg-background/80 p-0.5 rounded-lg border text-xs">
                        <button
                          type="button"
                          onClick={() => handleTypeToggle(draft.platform, "username")}
                          className={`px-2 py-1 rounded-md transition-colors ${
                            draft.inputType === "username"
                              ? "bg-primary text-primary-foreground font-medium"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <AtSign className="w-3 h-3 inline mr-1" /> @Handle
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTypeToggle(draft.platform, "url")}
                          className={`px-2 py-1 rounded-md transition-colors ${
                            draft.inputType === "url"
                              ? "bg-primary text-primary-foreground font-medium"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <LinkIcon className="w-3 h-3 inline mr-1" /> Profile URL
                        </button>
                      </div>

                      {/* Remove Button */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemovePlatform(draft.platform)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Remove platform"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Input field */}
                  <div className="relative space-y-1.5">
                    <div className="relative flex items-center">
                      {draft.inputType === "username" && (
                        <div className="absolute left-3 text-muted-foreground font-medium text-sm select-none">
                          @
                        </div>
                      )}
                      <Input
                        value={draft.value}
                        onChange={(e) => handleInputChange(draft.platform, e.target.value)}
                        placeholder={
                          draft.inputType === "username"
                            ? "johncreator"
                            : config.placeholder
                        }
                        className={`bg-background h-10 ${
                          draft.inputType === "username" ? "pl-7" : "pl-3"
                        } ${draft.error || draft.status === "FAILED" ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      />
                    </div>

                    {/* Verification Failed Banner */}
                    {draft.status === "FAILED" && (
                      <div className="flex items-center justify-between text-xs text-rose-600 dark:text-rose-400 bg-rose-500/10 p-2.5 rounded-md font-medium border border-rose-500/20">
                        <span className="flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          {draft.errorMessage || "Verification failed: Could not verify profile URL or handle format."}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVerify(draft.platform)}
                          className="h-6 text-xs text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 px-2"
                        >
                          <RotateCw className="w-3 h-3 mr-1" /> Try Again
                        </Button>
                      </div>
                    )}

                    {draft.error && (
                      <p className="text-xs text-destructive mt-1 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {draft.error}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Another Platform Dropdown */}
          {availablePlatforms.length > 0 && (
            <div className="pt-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full border-dashed h-11 hover:border-primary/50">
                    <Plus className="w-4 h-4 mr-2 text-primary" />
                    Add Another Platform
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-64">
                  <DropdownMenuLabel>Select Platform</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {availablePlatforms.map((pId) => {
                    const cfg = PLATFORM_CONFIGS[pId];
                    return (
                      <DropdownMenuItem
                        key={pId}
                        onClick={() => handleAddPlatform(pId)}
                        className="flex items-center gap-3 cursor-pointer py-2"
                      >
                        <div className={`p-1 rounded ${cfg.color}`}>
                          <SocialIcon platform={pId} className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-sm">{cfg.name}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Footer Navigation Buttons */}
          <div className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
            {onSkip ? (
              <Button
                type="button"
                variant="ghost"
                onClick={onSkip}
                className="w-full sm:w-auto text-muted-foreground hover:text-foreground"
              >
                Skip for now
              </Button>
            ) : (
              <div />
            )}

            <Button
              type="button"
              onClick={handleContinueToReview}
              disabled={isSaving}
              className="w-full sm:w-auto h-11 px-8"
            >
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {mode === "onboarding" ? "Review Profiles" : "Save Changes"}
              {mode === "onboarding" && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
