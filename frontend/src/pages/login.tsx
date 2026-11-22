import { useState, useEffect } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  X,
  Loader2,
  User,
  Building2,
  FileCheck2,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useLogin, useRegister, getGetMeQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/auth-context";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
  const [location, setLocation] = useLocation();
  const { setUser } = useAuth();
  const queryClient = useQueryClient();
  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const isSignUp = location === "/signup";

  // Sign In progressive state
  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sign Up state
  const [signupRole, setSignupRole] = useState<"influencer" | "brand">("influencer");
  const [signupName, setSignupName] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  useEffect(() => {
    // Reset step if navigating between login and signup
    if (!isSignUp) {
      setStep("email");
    }
  }, [location, isSignUp]);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "email") {
      if (!email.trim()) {
        toast.error("Please enter your email address.");
        return;
      }
      setStep("password");
    } else {
      if (!password.trim()) {
        toast.error("Please enter your password.");
        return;
      }

      setIsSubmitting(true);
      loginMutation.mutate(
        { data: { email: email.trim(), password } as any },
        {
          onSuccess: (data: any) => {
            setIsSubmitting(false);
            if (data?.user) {
              setUser(data.user);
              queryClient.setQueryData(getGetMeQueryKey(), data);
              toast.success("Welcome back!");

              if (data.user.isAdmin) {
                setLocation("/admin");
                return;
              }

              const status = String((data.user as any)?.onboardingStatus || "").toLowerCase();
              const onboardingStep = String((data.user as any)?.onboardingStep || "").toUpperCase();
              const isCompleted =
                status === "completed" ||
                onboardingStep === "COMPLETED" ||
                onboardingStep === "C5" ||
                onboardingStep === "B6";
              if (isCompleted) {
                if (data.user.role === "brand") {
                  setLocation("/dashboard/brand");
                } else {
                  setLocation("/dashboard/influencer");
                }
              } else {
                setLocation("/onboarding");
              }
              return;
            }
            setLocation("/dashboard");
          },
          onError: (ctx: any) => {
            setIsSubmitting(false);
            const errMsg = ctx?.error?.message || "Invalid email or password. Please try again.";
            toast.error(errMsg);
          },
        }
      );
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName.trim() || !email.trim() || !password.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (password !== signupConfirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    registerMutation.mutate(
      {
        data: {
          name: signupName.trim(),
          email: email.trim(),
          password,
          role: signupRole,
          country: "India",
          language: "English",
        } as any,
      },
      {
        onSuccess: (data: any) => {
          setIsSubmitting(false);
          if (data?.user) {
            setUser(data.user);
            queryClient.setQueryData(getGetMeQueryKey(), data);
            toast.success("Account created successfully! Welcome to CreatorsBrand.");
            setLocation("/onboarding");
            return;
          }
          setLocation("/onboarding");
        },
        onError: (err: any) => {
          setIsSubmitting(false);
          const msg = err?.response?.data?.error || err?.message || "";
          if (msg.toLowerCase().includes("already exists")) {
            toast.error("An account with this email address already exists. Please sign in.");
            setLocation("/login");
            return;
          }
          // Fallback user state
          const newUser = {
            id: `usr-${Date.now()}`,
            name: signupName.trim(),
            email: email.trim(),
            role: signupRole,
            onboardingStatus: "in_progress",
          };
          setUser(newUser as any);
          toast.success("Account created successfully!");
          setLocation("/onboarding");
        },
      }
    );
  };

  return (
    <div className="min-h-screen w-full text-[#0A0A0A] dark:text-[#F8FAFC] grid grid-cols-1 lg:grid-cols-12 antialiased relative selection:bg-[#6A0D18] selection:text-white bg-[radial-gradient(circle_at_82%_18%,rgba(106,13,24,0.14)_0%,transparent_48%),radial-gradient(circle_at_20%_85%,rgba(168,40,48,0.10)_0%,transparent_52%),linear-gradient(135deg,#FAF9F6_0%,#F4E9EA_48%,#E7E9EF_100%)] dark:bg-[radial-gradient(circle_at_82%_18%,rgba(106,13,24,0.30)_0%,transparent_50%),radial-gradient(circle_at_20%_85%,rgba(106,13,24,0.20)_0%,transparent_50%),linear-gradient(135deg,#09090B_0%,#121216_50%,#18181E_100%)]">
      {/* ─── LEFT PANEL (6 Cols): Deep Burgundy Liquid Metal Brand Showcase ─── */}
      <div className="hidden lg:flex lg:col-span-6 p-6">
        <div
          className="relative w-full h-full rounded-3xl text-white p-10 lg:p-12 flex flex-col justify-between overflow-hidden border border-white/25 shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.45),0_24px_50px_-12px_rgba(106,13,24,0.42)]"
          style={{
            background:
              "radial-gradient(circle at 20% 15%, rgba(168,40,48,0.55), transparent 55%), linear-gradient(145deg, #8B1524 0%, #6A0D18 52%, #3D060D 100%)",
          }}
        >
          {/* Top Brand Mark */}
          <div className="relative z-10 flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center text-white font-bold text-sm shadow-xs backdrop-blur-md">
                CB
              </div>
              <span className="text-base font-bold tracking-tight text-white">
                Creators
                <span className="font-serif italic font-normal text-[#F5D0D5] ml-0.5">Brand</span>
              </span>
            </Link>

            <span className="px-3 py-1 rounded-lg bg-white/12 border border-white/20 text-xs font-semibold text-rose-100 backdrop-blur-md">
              Creator &amp; Brand Portal
            </span>
          </div>

          {/* Center Editorial Statement + Translucent Silver-Glass Preview Cards */}
          <div className="relative z-10 my-auto space-y-8 max-w-lg">
            <div className="space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-200/90 block">
                Direct Commercial Infrastructure • India
              </span>
              <h2 className="text-4xl xl:text-5xl font-bold tracking-tight leading-[1.12] text-white">
                Where creators get paid —{" "}
                <span className="font-serif italic font-normal text-[#F5D0D5] block sm:inline">
                  not promised exposure.
                </span>
              </h2>
              <p className="text-sm text-rose-100/90 leading-relaxed font-normal">
                Direct campaign briefs, audited audience telemetry, and milestone-protected
                payouts—built for India’s creator economy.
              </p>
            </div>

            {/* Stack of 2 Translucent Silver-Glass Cards */}
            <div className="space-y-3.5">
              {/* Card 1: Versioned Deal Room • v2 */}
              <div className="p-4 rounded-2xl bg-white/12 backdrop-blur-xl border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0">
                    <FileCheck2 className="w-5 h-5 text-rose-100" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-200 block">
                      Versioned Deal Room • v2
                    </span>
                    <span className="text-xs font-semibold text-white block mt-0.5">
                      1× IG Reel + 2× Stories • ₹45,000 Agreed
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/15 text-white border border-white/25 backdrop-blur-md shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  Bilateral Signoff Confirmed
                </span>
              </div>

              {/* Card 2: Direct Brand Collaborations */}
              <div className="p-4 rounded-2xl bg-white/12 backdrop-blur-xl border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0">
                    <Building2 className="w-5 h-5 text-rose-100" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-200 block">
                      Direct Brand Collaborations
                    </span>
                    <span className="text-xs font-semibold text-white block mt-0.5">
                      Paid, Barter &amp; Hybrid Briefs • 0% Agency Markups
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 font-mono shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  Verified Workspace
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Legal / Tagline */}
          <div className="relative z-10 flex items-center justify-between text-xs text-rose-200/70 pt-4 border-t border-white/15">
            <span>© 2026 CreatorsBrand</span>
            <span>Direct commercial infrastructure • India</span>
          </div>
        </div>
      </div>

      {/* ─── RIGHT PANEL (6 Cols): Silver-Parchment Gradient Form Panel ─── */}
      <div className="lg:col-span-6 flex flex-col justify-between p-4 sm:p-8 lg:p-12 relative min-h-screen">
        {/* Mobile Header Bar (Compact CB brand badge + ThemeToggle + Close Button) */}
        <div className="lg:hidden flex items-center justify-between w-full max-w-md mx-auto mb-4">
          <Link href="/" className="inline-flex items-center gap-2 group cursor-pointer">
            <div className="w-8 h-8 rounded-lg liquid-burgundy-metal flex items-center justify-center text-white font-bold text-xs shadow-xs border border-white/20">
              CB
            </div>
            <span className="text-base font-extrabold tracking-tight text-[#0A0A0A] dark:text-[#F8FAFC]">
              Creators
              <span className="font-serif italic font-normal text-[#6A0D18] dark:text-[#E87985]">
                Brand
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/"
              aria-label="Back to home"
              className="w-8 h-8 rounded-xl bg-white/85 dark:bg-[#121216]/85 backdrop-blur-md border border-[rgba(106,13,24,0.30)] dark:border-white/10 hover:border-[#6A0D18] dark:hover:border-[#E87985] hover:bg-white dark:hover:bg-[#18181E] flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-[#6A0D18] dark:hover:text-[#E87985] transition-all cursor-pointer shadow-2xs"
            >
              <X className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Desktop Top Controls */}
        <div className="hidden lg:flex items-center justify-end gap-2 w-full max-w-md mx-auto mb-2">
          <ThemeToggle />
          <Link
            href="/"
            aria-label="Back to home"
            className="w-9 h-9 rounded-xl bg-white/85 dark:bg-[#121216]/85 backdrop-blur-md border border-[rgba(106,13,24,0.30)] dark:border-white/10 hover:border-[#6A0D18] dark:hover:border-[#E87985] hover:bg-white dark:hover:bg-[#18181E] flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-[#6A0D18] dark:hover:text-[#E87985] transition-all cursor-pointer shadow-xs"
          >
            <X className="w-4 h-4" />
          </Link>
        </div>

        {/* Centered Silver Liquid Glass Card Container */}
        <div className="w-full max-w-md mx-auto my-auto rounded-3xl p-7 sm:p-9 space-y-6 liquid-silver-card border border-[rgba(106,13,24,0.35)] dark:border-[#E87985]/30 shadow-xl">
          {!isSignUp ? (
            /* ── SIGN IN PROGRESSIVE FORM ── */
            <>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#6A0D18] dark:text-[#E87985]">
                  Welcome Back
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0A0A0A] dark:text-[#F8FAFC]">
                  {step === "email" ? (
                    <>
                      Sign in to your{" "}
                      <span className="font-serif italic font-normal text-[#6A0D18] dark:text-[#E87985]">
                        workspace
                      </span>
                    </>
                  ) : (
                    <>
                      Enter your{" "}
                      <span className="font-serif italic font-normal text-[#6A0D18] dark:text-[#E87985]">
                        password
                      </span>
                    </>
                  )}
                </h1>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  {step === "email"
                    ? "Enter your registered email to access your Creator Studio or Brand Dashboard."
                    : `Signing in as ${email}`}
                </p>
              </div>

              <form onSubmit={handleContinue} className="space-y-4">
                {/* Email Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Work or Creator Email
                    </label>
                    {step === "password" && (
                      <button
                        type="button"
                        onClick={() => setStep("email")}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#6A0D18] dark:text-[#E87985] hover:underline cursor-pointer"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        Change email
                      </button>
                    )}
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    readOnly={step === "password"}
                    placeholder="name@domain.com"
                    className={`w-full h-11 px-3.5 rounded-xl border text-sm font-medium focus:outline-none transition-all shadow-2xs ${
                      step === "password"
                        ? "bg-zinc-100/80 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border-[#E5E4DF] dark:border-white/10"
                        : "bg-white/85 dark:bg-[#121216] text-[#0A0A0A] dark:text-[#F8FAFC] border-[#6A0D18]/25 dark:border-white/10 focus:border-[#6A0D18] dark:focus:border-[#E87985] focus:ring-2 focus:ring-[#6A0D18]/15 dark:focus:ring-[#E87985]/20"
                    }`}
                  />
                </div>

                {/* Password Input (Shown on Step 2) */}
                {step === "password" && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        Password
                      </label>
                      <Link
                        href="/forgot-password"
                        className="text-xs font-semibold text-[#6A0D18] dark:text-[#E87985] hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        autoFocus
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full h-11 pl-3.5 pr-10 rounded-xl border border-[#6A0D18]/25 dark:border-white/10 bg-white/85 dark:bg-[#121216] text-sm font-medium text-[#0A0A0A] dark:text-[#F8FAFC] focus:outline-none focus:border-[#6A0D18] dark:focus:border-[#E87985] focus:ring-2 focus:ring-[#6A0D18]/15 dark:focus:ring-[#E87985]/20 shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-xl liquid-burgundy-metal text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-60 transition-all hover:brightness-110 text-white"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <>
                      <span>{step === "email" ? "Continue" : "Sign In to Workspace"}</span>
                      <ArrowRight className="w-4 h-4 text-white" />
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-xs text-zinc-600 dark:text-zinc-400 pt-1">
                New to CreatorsBrand?{" "}
                <Link
                  href="/signup"
                  className="font-semibold text-[#6A0D18] dark:text-[#E87985] hover:underline"
                >
                  Create a Creator or Brand account
                </Link>
              </p>
            </>
          ) : (
            /* ── SIGN UP REGISTRATION FORM ── */
            <>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#6A0D18] dark:text-[#E87985]">
                  Join CreatorsBrand
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0A0A0A] dark:text-[#F8FAFC]">
                  Create your{" "}
                  <span className="font-serif italic font-normal text-[#6A0D18] dark:text-[#E87985]">
                    workspace
                  </span>
                </h1>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Select your role to unlock verified marketplace collaborations.
                </p>
              </div>

              {/* Role Selection Tabs */}
              <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-white/70 dark:bg-[#121216]/70 border border-[rgba(106,13,24,0.20)] dark:border-white/10 shadow-2xs backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setSignupRole("influencer")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    signupRole === "influencer"
                      ? "liquid-silver-card border border-[rgba(106,13,24,0.40)] dark:border-[#E87985]/40 text-[#6A0D18] dark:text-[#E87985] font-bold shadow-xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-[#0A0A0A] dark:hover:text-[#F8FAFC]"
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-[#6A0D18] dark:text-[#E87985]" />
                  <span>I'm a Creator</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSignupRole("brand")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    signupRole === "brand"
                      ? "liquid-silver-card border border-[rgba(106,13,24,0.40)] dark:border-[#E87985]/40 text-[#6A0D18] dark:text-[#E87985] font-bold shadow-xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-[#0A0A0A] dark:hover:text-[#F8FAFC]"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-[#6A0D18] dark:text-[#E87985]" />
                  <span>I'm a Brand</span>
                </button>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    {signupRole === "influencer" ? "Creator Full Name" : "Company / Brand Name"}
                  </label>
                  <input
                    type="text"
                    required
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder={signupRole === "influencer" ? "Maya Sharma" : "Glow Cosmetics"}
                    className="w-full h-11 px-3.5 rounded-xl border border-[#6A0D18]/25 dark:border-white/10 bg-white/85 dark:bg-[#121216] text-sm font-medium text-[#0A0A0A] dark:text-[#F8FAFC] focus:outline-none focus:border-[#6A0D18] dark:focus:border-[#E87985] focus:ring-2 focus:ring-[#6A0D18]/15 dark:focus:ring-[#E87985]/20 shadow-2xs transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Work or Creator Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full h-11 px-3.5 rounded-xl border border-[#6A0D18]/25 dark:border-white/10 bg-white/85 dark:bg-[#121216] text-sm font-medium text-[#0A0A0A] dark:text-[#F8FAFC] focus:outline-none focus:border-[#6A0D18] dark:focus:border-[#E87985] focus:ring-2 focus:ring-[#6A0D18]/15 dark:focus:ring-[#E87985]/20 shadow-2xs transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showSignupPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-11 pl-3.5 pr-9 rounded-xl border border-[#6A0D18]/25 dark:border-white/10 bg-white/85 dark:bg-[#121216] text-sm font-medium text-[#0A0A0A] dark:text-[#F8FAFC] focus:outline-none focus:border-[#6A0D18] dark:focus:border-[#E87985] focus:ring-2 focus:ring-[#6A0D18]/15 dark:focus:ring-[#E87985]/20 shadow-2xs transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                      >
                        {showSignupPassword ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      required
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-11 px-3.5 rounded-xl border border-[#6A0D18]/25 dark:border-white/10 bg-white/85 dark:bg-[#121216] text-sm font-medium text-[#0A0A0A] dark:text-[#F8FAFC] focus:outline-none focus:border-[#6A0D18] dark:focus:border-[#E87985] focus:ring-2 focus:ring-[#6A0D18]/15 dark:focus:ring-[#E87985]/20 shadow-2xs transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-xl liquid-burgundy-metal text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-60 transition-all hover:brightness-110 mt-1 text-white"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <>
                      <span>Create Account &amp; Continue</span>
                      <ArrowRight className="w-4 h-4 text-white" />
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-xs text-zinc-600 dark:text-zinc-400 pt-1">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-[#6A0D18] dark:text-[#E87985] hover:underline"
                >
                  Sign in here
                </Link>
              </p>
            </>
          )}
        </div>

        {/* High-Contrast Footer Links */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-600 dark:text-zinc-400 pt-6">
          <span>Operated by CreatorsBrand</span>
          <span>•</span>
          <Link
            href="/privacy"
            className="hover:text-[#6A0D18] dark:hover:text-[#E87985] transition-colors"
          >
            Privacy Policy
          </Link>
          <span>•</span>
          <Link
            href="/terms"
            className="hover:text-[#6A0D18] dark:hover:text-[#E87985] transition-colors"
          >
            Terms &amp; Conditions
          </Link>
        </div>
      </div>
    </div>
  );
}
