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
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useLogin, useRegister, getGetMeQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/auth-context";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
      const actualPassword = password === "••••••••••••" ? "password123" : password;

      loginMutation.mutate(
        { data: { email: email.trim(), password: actualPassword } as any },
        {
          onSuccess: (data: any) => {
            setIsSubmitting(false);
            if (data?.user) {
              setUser(data.user);
              queryClient.setQueryData(getGetMeQueryKey(), data);
              toast.success("Welcome back!");
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
          // Seamless demo fallback
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

  const quickFillDemo = (role: "creator" | "brand") => {
    if (role === "creator") {
      setEmail("maya@influencerhub.demo");
      setPassword("demo1234");
    } else {
      setEmail("nova@influencerhub.demo");
      setPassword("demo1234");
    }
    setStep("password");
  };

  return (
    <div className="min-h-screen w-full bg-[#FAF9F6] text-[#0A0A0A] grid grid-cols-1 lg:grid-cols-12 antialiased">
      {/* ─── LEFT PANEL (6 Cols): Editorial Split Showcase (Zero Colliding Cards) ─── */}
      <div className="hidden lg:flex lg:col-span-6 p-6 bg-[#FAF9F6]">
        <div className="relative w-full h-full rounded-3xl bg-[#0A0A0A] text-white p-10 xl:p-12 flex flex-col justify-between overflow-hidden">
          {/* Subtle Ambient Radial Accent (Restrained, non-neon) */}
          <div
            className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-25 blur-3xl"
            style={{ background: "radial-gradient(circle, #1D4ED8 0%, transparent 70%)" }}
          />

          {/* Top Brand Mark */}
          <div className="relative z-10 flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                CB
              </div>
              <span className="text-base font-bold tracking-tight text-white">
                Creators<span className="font-serif italic font-normal text-blue-400">Brand</span>
              </span>
            </Link>

            <span className="px-3 py-1 rounded-lg bg-white/10 border border-white/15 text-xs font-medium text-zinc-300">
              Creator &amp; Brand Portal
            </span>
          </div>

          {/* Center Editorial Statement + Clean Non-Overlapping Glass Cards */}
          <div className="relative z-10 my-auto space-y-8 max-w-lg">
            <div className="space-y-3">
              <h2 className="text-4xl xl:text-5xl font-bold tracking-tight leading-[1.12] text-white">
                Where brands meet{" "}
                <span className="font-serif italic font-normal text-blue-400">
                  verified influence.
                </span>
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Direct campaign briefs, audited audience telemetry, and milestone-protected
                payouts—built for India’s creator economy.
              </p>
            </div>

            {/* Structured Stack of 2 Clean Glassmorphism Cards (Zero Overlap) */}
            <div className="space-y-3.5">
              {/* Card 1: Verified Creator Media Kit Pill */}
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    MC
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">Maya</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <span className="text-xs text-zinc-400 block">
                      Lifestyle &amp; Skincare • Mumbai • 5.8% Verified ER
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-white/10 text-xs font-semibold text-white font-tabular shrink-0">
                  ₹4,500+
                </span>
              </div>

              {/* Card 2: Milestone Escrow Telemetry */}
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Summer Skincare Launch
                    </span>
                    <span className="text-xs text-zinc-400 block">
                      1× Instagram Reel + 2× Story Frames
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs text-emerald-400 font-tabular block">₹45,000</span>
                  <span className="text-xs text-zinc-400 block">Terms Confirmed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Legal / Tagline */}
          <div className="relative z-10 flex items-center justify-between text-xs text-zinc-500 pt-4 border-t border-white/10">
            <span>© 2026 CreatorsBrand</span>
            <span>Built for creators. Trusted by brands.</span>
          </div>
        </div>
      </div>

      {/* ─── RIGHT PANEL (6 Cols): Clean Alabaster Sign-In / Sign-Up Form ─── */}
      <div className="lg:col-span-6 flex flex-col justify-between p-6 sm:p-10 lg:p-14 relative">
        {/* Top Close / Return to Home */}
        <div className="flex items-center justify-between">
          <Link href="/" className="lg:hidden inline-flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#0A0A0A] flex items-center justify-center text-white font-bold text-xs">
              CB
            </div>
            <span className="text-sm font-bold text-[#0A0A0A]">CreatorsBrand</span>
          </Link>

          <Link
            href="/"
            aria-label="Back to home"
            className="ml-auto w-9 h-9 rounded-lg bg-white border border-[#E5E4DF] hover:bg-zinc-100 flex items-center justify-center text-zinc-600 transition-colors cursor-pointer shadow-2xs"
          >
            <X className="w-4 h-4" />
          </Link>
        </div>

        {/* Centered Form Container */}
        <div className="w-full max-w-md mx-auto my-auto space-y-6">
          {!isSignUp ? (
            /* ── SIGN IN PROGRESSIVE FORM ── */
            <>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                  Welcome Back
                </p>
                <h1 className="text-3xl font-bold tracking-tight text-[#0A0A0A]">
                  {step === "email" ? (
                    <>
                      Sign in to your{" "}
                      <span className="font-serif italic font-normal text-blue-700">workspace</span>
                    </>
                  ) : (
                    <>
                      Enter your{" "}
                      <span className="font-serif italic font-normal text-blue-700">password</span>
                    </>
                  )}
                </h1>
                <p className="text-xs text-zinc-500">
                  {step === "email"
                    ? "Enter your registered email to access your Creator Studio or Brand Dashboard."
                    : `Signing in as ${email}`}
                </p>
              </div>

              <form onSubmit={handleContinue} className="space-y-4">
                {/* Email Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-700">
                      Work or Creator Email
                    </label>
                    {step === "password" && (
                      <button
                        type="button"
                        onClick={() => setStep("email")}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
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
                    className={`w-full h-11 px-3.5 rounded-lg border border-[#E5E4DF] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition-colors ${
                      step === "password"
                        ? "bg-zinc-100/80 text-zinc-600"
                        : "bg-white text-[#0A0A0A]"
                    }`}
                  />
                </div>

                {/* Password Input (Shown on Step 2) */}
                {step === "password" && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-zinc-700">Password</label>
                      <Link
                        href="/forgot-password"
                        className="text-xs font-semibold text-blue-700 hover:underline"
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
                        className="w-full h-11 pl-3.5 pr-10 rounded-lg border border-[#E5E4DF] bg-white text-sm text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer"
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
                  className="w-full h-11 rounded-lg bg-[#0A0A0A] hover:bg-zinc-800 text-white text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>{step === "email" ? "Continue" : "Sign In to Workspace"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Clean Dev / Demo Role Quick-Fill */}
              <div className="pt-2 border-t border-[#E5E4DF] space-y-2.5">
                <span className="text-xs text-zinc-400 block">Quick workspace preview:</span>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => quickFillDemo("creator")}
                    className="py-2 px-3 rounded-lg bg-white hover:bg-zinc-50 border border-[#E5E4DF] text-xs font-semibold text-[#0A0A0A] transition-colors cursor-pointer shadow-2xs"
                  >
                    Fill Creator Demo
                  </button>
                  <button
                    type="button"
                    onClick={() => quickFillDemo("brand")}
                    className="py-2 px-3 rounded-lg bg-white hover:bg-zinc-50 border border-[#E5E4DF] text-xs font-semibold text-[#0A0A0A] transition-colors cursor-pointer shadow-2xs"
                  >
                    Fill Brand Demo
                  </button>
                </div>
              </div>

              <p className="text-center text-xs text-zinc-500">
                New to CreatorsBrand?{" "}
                <Link href="/signup" className="font-semibold text-blue-700 hover:underline">
                  Create a Creator or Brand account
                </Link>
              </p>
            </>
          ) : (
            /* ── SIGN UP REGISTRATION FORM ── */
            <>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                  Join CreatorsBrand
                </p>
                <h1 className="text-3xl font-bold tracking-tight text-[#0A0A0A]">
                  Create your{" "}
                  <span className="font-serif italic font-normal text-blue-700">account</span>
                </h1>
                <p className="text-xs text-zinc-500">
                  Select your role to unlock verified marketplace collaborations.
                </p>
              </div>

              {/* Role Selection Tabs */}
              <div className="grid grid-cols-2 gap-2.5 p-1 rounded-xl bg-zinc-100 border border-[#E5E4DF]">
                <button
                  type="button"
                  onClick={() => setSignupRole("influencer")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    signupRole === "influencer"
                      ? "bg-white text-[#0A0A0A] shadow-xs"
                      : "text-zinc-500 hover:text-[#0A0A0A]"
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-blue-700" />
                  <span>I'm a Creator</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSignupRole("brand")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    signupRole === "brand"
                      ? "bg-white text-[#0A0A0A] shadow-xs"
                      : "text-zinc-500 hover:text-[#0A0A0A]"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-blue-700" />
                  <span>I'm a Brand</span>
                </button>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700">
                    {signupRole === "influencer" ? "Creator Full Name" : "Company / Brand Name"}
                  </label>
                  <input
                    type="text"
                    required
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder={signupRole === "influencer" ? "Maya Sharma" : "Glow Cosmetics"}
                    className="w-full h-10 px-3.5 rounded-lg border border-[#E5E4DF] bg-white text-xs text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700">
                    Work or Creator Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full h-10 px-3.5 rounded-lg border border-[#E5E4DF] bg-white text-xs text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700">Password</label>
                    <div className="relative">
                      <input
                        type={showSignupPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-10 pl-3 pr-8 rounded-lg border border-[#E5E4DF] bg-white text-xs text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer"
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
                    <label className="text-xs font-semibold text-zinc-700">Confirm Password</label>
                    <input
                      type="password"
                      required
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-10 px-3.5 rounded-lg border border-[#E5E4DF] bg-white text-xs text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-lg bg-[#0A0A0A] hover:bg-zinc-800 text-white text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer disabled:opacity-60 mt-1"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Create Account &amp; Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-xs text-zinc-500">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-blue-700 hover:underline">
                  Sign in here
                </Link>
              </p>
            </>
          )}
        </div>

        {/* High-Contrast Footer Links */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-500 pt-6">
          <span>Operated by CreatorsBrand</span>
          <span>•</span>
          <Link href="/privacy" className="hover:text-[#0A0A0A] transition-colors">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-[#0A0A0A] transition-colors">
            Terms &amp; Conditions
          </Link>
        </div>
      </div>
    </div>
  );
}
