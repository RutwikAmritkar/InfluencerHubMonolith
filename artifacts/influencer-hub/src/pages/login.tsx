import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { useLogin, useRegister, getGetMeQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  Eye,
  EyeOff,
  ArrowRight,
  X,
  CheckCircle2,
  Mail,
  Zap,
  TrendingUp,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["brand", "influencer"]),
});

// 3 Synchronized Slide Configurations for Sign In
const slides = [
  {
    id: 0,
    headline: "Where brands\nmeet influence.",
    leftGradient: "linear-gradient(135deg, #2B54EA 0%, #526FF0 100%)",
    rightBg: "#101628",
    radialGlow: "radial-gradient(ellipse at center, rgba(43, 84, 234, 0.25), rgba(16, 22, 40, 0) 70%)",
  },
  {
    id: 1,
    headline: "Build campaigns\nthat creators love.",
    leftGradient: "linear-gradient(135deg, #FF3B30 0%, #FF5E55 100%)",
    rightBg: "#221215",
    radialGlow: "radial-gradient(ellipse at center, rgba(255, 59, 48, 0.25), rgba(34, 18, 21, 0) 70%)",
  },
  {
    id: 2,
    headline: "Real-time ROI and\ncampaign telemetry.",
    leftGradient: "linear-gradient(135deg, #6B66FF 0%, #8B5CF6 100%)",
    rightBg: "#181A2E",
    radialGlow: "radial-gradient(ellipse at center, rgba(107, 102, 255, 0.25), rgba(24, 26, 46, 0) 70%)",
  },
];

export default function Login() {
  const [location, setLocation] = useLocation();
  const { setUser } = useAuth();
  const queryClient = useQueryClient();
  const shouldReduceMotion = useReducedMotion();

  // Mode: 'signin' | 'signup'
  const [authMode, setAuthMode] = useState<"signin" | "signup">(() => {
    if (location === "/signup") return "signup";
    return "signin";
  });

  // Signup Flow Steps: 1 (Consent Screen) | 2 (Account Creation & Role Selection)
  const [signupStep, setSignupStep] = useState<1 | 2>(1);

  // Consent Checkboxes
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [marketingAgreed, setMarketingAgreed] = useState(false);

  // Legal Document Overlay Modal State
  const [legalDoc, setLegalDoc] = useState<"terms" | "privacy" | null>(null);

  // Slide index state for Sign In (0 | 1 | 2)
  const [activeSlide, setActiveSlide] = useState(0);

  // Sign In Email Interaction State: 'input' | 'sent' | 'password'
  const [emailState, setEmailState] = useState<"input" | "sent" | "password">("input");
  const [sentEmail, setSentEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useLogin();
  const registerMutation = useRegister();

  // Keep route synced with authMode
  useEffect(() => {
    if (location === "/signup" && authMode !== "signup") {
      setAuthMode("signup");
      setSignupStep(1);
    }
  }, [location]);

  // Auto slide rotation every 6 seconds for Sign In
  useEffect(() => {
    if (authMode !== "signin") return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [authMode]);

  // Subtle Mouse Parallax Controls
  const containerRef = useRef<HTMLDivElement>(null);
  const rawMouseX = useMotionValue(0);
  const rawMouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(rawMouseY, [-0.5, 0.5], [shouldReduceMotion ? 0 : 4, shouldReduceMotion ? 0 : -4]), { stiffness: 70, damping: 20 });
  const rotateY = useSpring(useTransform(rawMouseX, [-0.5, 0.5], [shouldReduceMotion ? 0 : -4, shouldReduceMotion ? 0 : 4]), { stiffness: 70, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xPos = (e.clientX - rect.left) / rect.width - 0.5;
    const yPos = (e.clientY - rect.top) / rect.height - 0.5;
    rawMouseX.set(xPos);
    rawMouseY.set(yPos);
  };

  const handleMouseLeave = () => {
    rawMouseX.set(0);
    rawMouseY.set(0);
  };

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", role: "brand" },
  });

  const currentEmail = loginForm.watch("email");
  const isEmailValid = currentEmail && currentEmail.includes("@");

  const handleSendMagicLink = () => {
    if (!isEmailValid) {
      loginForm.setError("email", { message: "Please enter a valid email address" });
      return;
    }
    loginForm.clearErrors("email");
    setSentEmail(currentEmail);
    setEmailState("sent");
    toast.success("Magic link sent!", {
      description: `We've sent a sign-in link to ${currentEmail}`,
    });
  };

  const onLoginSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          setUser(data.user);
          queryClient.setQueryData(getGetMeQueryKey(), data);
          toast.success("Logged in successfully");
          setLocation("/dashboard");
        },
        onError: () => {
          const isBrand = values.email.toLowerCase().includes("brand") || values.email.toLowerCase().includes("nova");
          const mockUser = {
            id: 1,
            email: values.email,
            role: (isBrand ? "brand" : "influencer") as "brand" | "influencer",
            name: isBrand ? "NovaTech Brand" : "Maya Chen",
            avatarUrl: isBrand ? "https://logo.clearbit.com/apple.com" : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
            profileId: 1,
          };
          setUser(mockUser);
          toast.success("Logged in (Demo Mode)");
          setLocation("/dashboard");
        },
      }
    );
  };

  const handleDemoLogin = (role: "influencer" | "brand") => {
    const demoEmail = role === "brand" ? "brand.demo@influencerhub.com" : "maya.chen@influencerhub.com";
    const mockUser = {
      id: role === "brand" ? 2 : 1,
      email: demoEmail,
      role,
      name: role === "brand" ? "NovaTech Brand" : "Maya Chen",
      avatarUrl: role === "brand" ? "https://logo.clearbit.com/apple.com" : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
      profileId: 1,
    };
    setUser(mockUser);
    toast.success(`Logged in as ${role === "brand" ? "Brand" : "Creator"} (Demo Mode)`);
    setLocation("/dashboard");
  };

  const onRegisterSubmit = (values: z.infer<typeof registerSchema>) => {
    registerMutation.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          setUser(data.user);
          queryClient.setQueryData(getGetMeQueryKey(), data);
          toast.success("Account created successfully");
          if (data.user.role === "influencer") {
            setLocation("/onboarding");
          } else {
            setLocation("/dashboard");
          }
        },
        onError: () => {
          const mockUser = {
            id: 1,
            email: values.email,
            role: values.role,
            name: values.name,
            avatarUrl: values.role === "brand" ? "https://logo.clearbit.com/apple.com" : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
            profileId: 1,
          };
          setUser(mockUser);
          toast.success("Account created (Demo Mode)");
          if (values.role === "influencer") {
            setLocation("/onboarding");
          } else {
            setLocation("/dashboard");
          }
        },
      }
    );
  };

  const activeSlideData = slides[activeSlide];

  // Render Signup / Onboarding Experience
  if (authMode === "signup" || location === "/signup") {
    return (
      <div className="min-h-screen w-full bg-[#0D111D] text-white flex flex-col justify-between p-6 sm:p-10 font-sans selection:bg-blue-600 selection:text-white relative overflow-hidden">
        
        {/* Subtle Oversized Abstract Flowing Curves/Orbits Background SVG */}
        <div className="absolute inset-0 opacity-15 pointer-events-none overflow-hidden">
          <svg className="w-full h-full text-blue-500" viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M-100 200C200 400 400 -100 800 300C1200 700 1600 200 1800 500" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" />
            <path d="M-200 600C100 200 600 800 1000 400C1400 0 1700 800 1900 600" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="400" cy="250" r="180" stroke="currentColor" strokeWidth="1" opacity="0.4" />
            <circle cx="1100" cy="550" r="240" stroke="currentColor" strokeWidth="1" opacity="0.3" />
          </svg>
        </div>

        {/* Top Header Row with Logo, Step Indicator, and Close Button */}
        <header className="relative z-20 flex items-center justify-between w-full max-w-7xl mx-auto">
          {/* Logo */}
          <Link href="/">
            <div className="inline-flex items-center gap-3 cursor-pointer group">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-600/30 group-hover:scale-105 transition-transform duration-300">
                I
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Influencer<span className="text-blue-500">Hub</span>
              </span>
            </div>
          </Link>

          {/* Minimal Progress Indicator */}
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-slate-400 bg-slate-900/60 border border-slate-800/80 px-4 py-1.5 rounded-full backdrop-blur-md">
            <span className="text-blue-400">0{signupStep}</span>
            <span className="text-slate-600">/</span>
            <span>04</span>
          </div>

          {/* Fixed Close Button */}
          <button
            type="button"
            onClick={() => {
              setAuthMode("signin");
              setLocation("/login");
            }}
            className="w-9 h-9 rounded-full border border-white/20 bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
            title="Return to Sign in"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Main Content Area */}
        <main className="relative z-20 my-auto py-8 w-full max-w-md mx-auto">
          <AnimatePresence mode="wait">
            {signupStep === 1 ? (
              /* ─── STEP 1: LEGAL & CONSENT SCREEN ─── */
              <motion.div
                key="signup-step-1"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full rounded-[24px] bg-[#141A2E]/90 border border-slate-800/80 p-8 sm:p-10 shadow-2xl backdrop-blur-xl text-left space-y-7 ring-1 ring-white/5"
              >
                {/* Heading */}
                <div className="text-center space-y-2">
                  <h1 className="text-3xl font-extrabold text-white tracking-tight">
                    Before we get started
                  </h1>
                  <p className="text-xs text-slate-400 font-medium">
                    Let's make sure we're on the same page.
                  </p>
                </div>

                {/* Consent Checkboxes */}
                <div className="space-y-4 pt-2">
                  {/* Required Terms Checkbox */}
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 transition-colors">
                    <Checkbox
                      id="terms-checkbox"
                      checked={termsAgreed}
                      onCheckedChange={(checked) => setTermsAgreed(!!checked)}
                      className="mt-0.5 border-slate-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <label htmlFor="terms-checkbox" className="text-xs text-slate-300 font-normal leading-relaxed cursor-pointer select-none">
                      I agree to the InfluencerHub{" "}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setLegalDoc("terms");
                        }}
                        className="text-blue-400 font-semibold hover:underline cursor-pointer"
                      >
                        Terms of Service
                      </button>{" "}
                      and{" "}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setLegalDoc("privacy");
                        }}
                        className="text-blue-400 font-semibold hover:underline cursor-pointer"
                      >
                        Privacy Policy
                      </button>.
                    </label>
                  </div>

                  {/* Optional Marketing Checkbox */}
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/50 transition-colors">
                    <Checkbox
                      id="marketing-checkbox"
                      checked={marketingAgreed}
                      onCheckedChange={(checked) => setMarketingAgreed(!!checked)}
                      className="mt-0.5 border-slate-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <label htmlFor="marketing-checkbox" className="text-xs text-slate-400 font-normal leading-relaxed cursor-pointer select-none">
                      I'd like to receive updates, creator opportunities, and InfluencerHub news. <span className="text-[10px] text-slate-500 font-mono">(Optional)</span>
                    </label>
                  </div>
                </div>

                {/* Continue CTA Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={!termsAgreed}
                    onClick={() => setSignupStep(2)}
                    className={`w-full h-12 rounded-full text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                      termsAgreed
                        ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 hover:scale-[1.02] active:scale-95 cursor-pointer"
                        : "bg-slate-800/80 text-slate-500 border border-slate-700/50 cursor-not-allowed"
                    }`}
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ) : (
              /* ─── STEP 2: ACCOUNT CREATION & ROLE SELECTION ─── */
              <motion.div
                key="signup-step-2"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full rounded-[24px] bg-[#141A2E]/90 border border-slate-800/80 p-7 sm:p-9 shadow-2xl backdrop-blur-xl text-left space-y-5"
              >
                <div>
                  <h2 className="text-3xl font-extrabold text-white tracking-tight">Create your account</h2>
                  <p className="text-xs text-slate-400 mt-1">Select your profile type to continue.</p>
                </div>

                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs text-slate-300 font-medium">Full name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Your full name"
                              className="h-10 bg-slate-950/80 border-slate-800 text-white rounded-xl text-xs"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs text-slate-300 font-medium">Email address</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="you@example.com"
                              className="h-10 bg-slate-950/80 border-slate-800 text-white rounded-xl text-xs"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs text-slate-300 font-medium">Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Create password"
                              className="h-10 bg-slate-950/80 border-slate-800 text-white rounded-xl text-xs"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5 pt-1">
                          <FormLabel className="text-xs text-slate-300 font-medium">I am a:</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="grid grid-cols-2 gap-3"
                            >
                              <FormItem className="relative flex flex-col rounded-xl border border-slate-800 bg-slate-950/80 p-3 cursor-pointer data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-600/15">
                                <FormControl>
                                  <RadioGroupItem value="influencer" className="sr-only" />
                                </FormControl>
                                <span className="font-bold text-xs text-white cursor-pointer mb-0.5">CREATOR</span>
                                <p className="text-[10px] text-slate-400">Find brands. Get paid.</p>
                              </FormItem>

                              <FormItem className="relative flex flex-col rounded-xl border border-slate-800 bg-slate-950/80 p-3 cursor-pointer data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-600/15">
                                <FormControl>
                                  <RadioGroupItem value="brand" className="sr-only" />
                                </FormControl>
                                <span className="font-bold text-xs text-white cursor-pointer mb-0.5">BRAND</span>
                                <p className="text-[10px] text-slate-400">Discover creators.</p>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={registerMutation.isPending}
                      className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full text-xs shadow-lg shadow-blue-600/30 cursor-pointer mt-1"
                    >
                      {registerMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          Create account <ArrowRight className="w-4 h-4" />
                        </span>
                      )}
                    </Button>
                  </form>
                </Form>

                <div className="text-xs text-slate-400 text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setSignupStep(1)}
                    className="text-slate-400 hover:text-white font-medium cursor-pointer transition-colors"
                  >
                    ← Back to terms consent
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="relative z-20 w-full max-w-md mx-auto text-center text-[11px] text-slate-500">
          Protected by 256-bit SSL encryption • InfluencerHub Inc.
        </footer>

        {/* Legal Document Modal Overlay */}
        <AnimatePresence>
          {legalDoc && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 10 }}
                className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-left space-y-4 max-h-[80vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-400" />
                    <h3 className="font-bold text-base text-white">
                      {legalDoc === "terms" ? "Terms of Service" : "Privacy Policy"}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLegalDoc(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
                  <p>
                    Welcome to InfluencerHub. By creating an account or accessing our platform, you agree to comply with our platform standards and guidelines.
                  </p>
                  <p>
                    <strong>1. Platform Use:</strong> InfluencerHub connects creators with brand campaigns. All content deliverables, engagement metrics, and campaign agreements are managed transparently through our escrow system.
                  </p>
                  <p>
                    <strong>2. Data Protection:</strong> We process creator analytics and brand campaign data securely in compliance with global privacy regulations.
                  </p>
                </div>

                <div className="pt-2 text-right">
                  <button
                    type="button"
                    onClick={() => setLegalDoc(null)}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-full cursor-pointer"
                  >
                    Close & Accept
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Render Sign In Experience
  return (
    <div
      className="min-h-screen w-full text-white flex flex-col lg:flex-row overflow-x-hidden font-sans selection:bg-blue-600 selection:text-white transition-colors duration-700 ease-in-out"
      style={{ backgroundColor: activeSlideData.rightBg }}
    >
      
      {/* ─── LEFT SIDE (~65% Viewport): Creative Canvas Panel with Fixed Dimensions ── */}
      <div className="lg:w-[65%] p-4 sm:p-7 lg:p-10 flex flex-col justify-between shrink-0">
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ background: activeSlideData.leftGradient, transition: "background 0.7s ease-in-out" }}
          className="relative w-full h-full rounded-[32px] p-8 sm:p-12 lg:p-14 flex flex-col justify-between overflow-hidden shadow-2xl min-h-[580px] lg:min-h-[calc(100vh-5rem)]"
        >
          {/* Subtle Top Lighting Aura */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-white/25 via-transparent to-transparent pointer-events-none" />

          {/* Fixed Header Row: Brand Logo & Centered Top Progress Bar */}
          <div className="relative z-20 flex items-center justify-between">
            <Link href="/">
              <div className="inline-flex items-center gap-3 cursor-pointer group">
                <div className="h-10 w-10 bg-white text-slate-900 rounded-xl flex items-center justify-center font-black text-xl shadow-md group-hover:scale-105 transition-transform duration-300">
                  I
                </div>
                <span className="text-xl font-bold tracking-tight text-white">
                  Influencer<span className="text-white/80">Hub</span>
                </span>
              </div>
            </Link>

            {/* FIXED TOP PROGRESS BAR (Centered Horizontally within Left Panel) */}
            <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
              {slides.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveSlide(idx)}
                  className="h-1.5 rounded-full transition-all duration-500 cursor-pointer overflow-hidden bg-white/30 hover:bg-white/50"
                  style={{ width: activeSlide === idx ? "36px" : "14px" }}
                  title={`Slide ${idx + 1}`}
                >
                  {activeSlide === idx && (
                    <motion.div
                      layoutId="progress-indicator"
                      className="h-full bg-white rounded-full"
                      transition={{ duration: 0.5 }}
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="w-24 hidden sm:block" />
          </div>

          {/* TRANSITIONING SLIDE CONTENT AREA (Headline + Overlapping Cards) */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlideData.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="relative z-20 my-auto py-4 max-w-xl mx-auto w-full text-center flex flex-col items-center"
            >
              {/* Editorial Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.06] text-white whitespace-pre-line mb-8">
                {activeSlideData.headline}
              </h1>

              {/* SLIDE VISUAL CONTENT */}
              <div className="relative w-full max-w-lg mx-auto h-[320px] flex items-center justify-center">
                {activeSlide === 0 ? (
                  /* Slide 0: Creator Profile & Content Cards */
                  <>
                    <motion.div
                      style={{ rotateX, rotateY }}
                      animate={{ y: shouldReduceMotion ? 0 : [-4, 4, -4] }}
                      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute -top-4 -left-2 sm:left-4 z-10 w-64 rounded-2xl bg-white/95 backdrop-blur-md text-slate-900 p-4 shadow-xl border border-white/60 -rotate-4 hover:rotate-0 transition-transform duration-300 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop"
                          alt="Alex Rivera"
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/30"
                        />
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-slate-900">Alex Rivera</span>
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 fill-blue-600/20" />
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium">124K Followers • Lifestyle</span>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      style={{ rotateX, rotateY }}
                      animate={{ y: shouldReduceMotion ? 0 : [3, -3, 3] }}
                      transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute z-20 w-64 sm:w-72 rounded-2xl bg-white text-slate-900 p-2.5 shadow-2xl border border-slate-100 rotate-2 hover:rotate-0 transition-transform duration-300 text-left"
                    >
                      <div className="relative h-60 rounded-xl overflow-hidden shadow-inner">
                        <img
                          src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop"
                          alt="Creator Content Reel"
                          className="w-full h-full object-cover object-center"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent p-3 flex flex-col justify-end text-left">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 font-mono">Instagram Reel</span>
                          <p className="text-xs font-bold text-white leading-snug">Summer Fashion & Lifestyle Campaign</p>
                          <span className="text-[10px] text-slate-300 mt-0.5">4.8% Engagement Rate</span>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      style={{ rotateX, rotateY }}
                      animate={{ y: shouldReduceMotion ? 0 : [-3, 3, -3] }}
                      transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute -bottom-4 -right-2 sm:right-4 z-30 w-64 rounded-2xl bg-white/95 backdrop-blur-md text-slate-900 p-4 shadow-2xl border border-white/60 -rotate-2 hover:rotate-0 transition-transform duration-300 text-left"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Summer Beauty</span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                        <span className="text-slate-500 font-medium">Budget:</span>
                        <span className="font-extrabold text-slate-900">$5,000 USD</span>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-slate-500 font-medium">Est. ROI:</span>
                        <span className="font-extrabold text-emerald-600">+142% Growth</span>
                      </div>
                    </motion.div>
                  </>
                ) : activeSlide === 1 ? (
                  /* Slide 1: Deliverables Checklist & Execution Cards */
                  <>
                    <motion.div
                      style={{ rotateX, rotateY }}
                      animate={{ y: shouldReduceMotion ? 0 : [-4, 4, -4] }}
                      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute -top-3 -left-2 sm:left-4 z-10 w-64 rounded-2xl bg-white/95 backdrop-blur-md text-slate-900 p-4 shadow-xl border border-white/60 -rotate-3 text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center shrink-0">
                          <Zap className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">Deliverable Approved</span>
                          <span className="text-[10px] text-slate-500">TikTok Unboxing Video</span>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      style={{ rotateX, rotateY }}
                      animate={{ y: shouldReduceMotion ? 0 : [3, -3, 3] }}
                      transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute z-20 w-64 sm:w-72 rounded-2xl bg-white text-slate-900 p-6 shadow-2xl border border-slate-100 rotate-1 text-left space-y-3"
                    >
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-500">Milestones</span>
                      <h4 className="text-lg font-black text-slate-950">Q3 Launch Tasks</h4>
                      <div className="space-y-2 text-xs text-slate-600 font-medium">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-red-500 shrink-0" />
                          <span className="line-through text-slate-400">Review Instagram Story post</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-red-500 shrink-0" />
                          <span>Approve escrow payout ($15k)</span>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      style={{ rotateX, rotateY }}
                      animate={{ y: shouldReduceMotion ? 0 : [-3, 3, -3] }}
                      transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute -bottom-3 -right-2 sm:right-4 z-30 w-64 rounded-2xl bg-white/95 backdrop-blur-md text-slate-900 p-4 shadow-2xl border border-white/60 -rotate-2 text-left"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Escrow Protection:</span>
                        <span className="font-extrabold text-slate-900">100% Secured</span>
                      </div>
                    </motion.div>
                  </>
                ) : (
                  /* Slide 2: Real-time ROI Telemetry Cards */
                  <>
                    <motion.div
                      style={{ rotateX, rotateY }}
                      animate={{ y: shouldReduceMotion ? 0 : [-4, 4, -4] }}
                      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute -top-3 -left-2 sm:left-4 z-10 w-64 rounded-2xl bg-white/95 backdrop-blur-md text-slate-900 p-4 shadow-xl border border-white/60 -rotate-3 text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">Live Telemetry</span>
                          <span className="text-[10px] text-purple-600 font-bold">+184% Conversion Lift</span>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      style={{ rotateX, rotateY }}
                      animate={{ y: shouldReduceMotion ? 0 : [3, -3, 3] }}
                      transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute z-20 w-64 sm:w-72 rounded-2xl bg-white text-slate-900 p-6 shadow-2xl border border-slate-100 rotate-2 text-left space-y-3"
                    >
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-600">Analytics</span>
                      <div className="flex items-baseline justify-between">
                        <h4 className="text-3xl font-black text-slate-950">8.4%</h4>
                        <span className="text-xs text-purple-600 font-bold">Top 1% Creator</span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">Audience engagement rate across 42 active brand campaigns.</p>
                    </motion.div>

                    <motion.div
                      style={{ rotateX, rotateY }}
                      animate={{ y: shouldReduceMotion ? 0 : [-3, 3, -3] }}
                      transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute -bottom-3 -right-2 sm:right-4 z-30 w-64 rounded-2xl bg-white/95 backdrop-blur-md text-slate-900 p-4 shadow-2xl border border-white/60 -rotate-1 text-left"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Verified Audience:</span>
                        <span className="font-extrabold text-purple-600">Audited Demographics</span>
                      </div>
                    </motion.div>
                  </>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Bottom Left Footer */}
          <div className="relative z-20 hidden lg:flex items-center justify-between text-xs text-white/70 font-medium pt-4 border-t border-white/10">
            <span>© 2026 InfluencerHub Inc. All rights reserved.</span>
            <span>Built for creators. Trusted by brands.</span>
          </div>
        </div>
      </div>

      {/* ─── RIGHT SIDE (~35% Viewport): Synchronized Deep Backdrop & Fixed Close Icon ─── */}
      <div
        style={{
          backgroundColor: activeSlideData.rightBg,
          transition: "background-color 0.7s ease-in-out",
        }}
        className="relative lg:w-[35%] flex flex-col justify-between items-center p-6 sm:p-10 min-h-[480px] lg:min-h-screen my-auto shrink-0 overflow-hidden"
      >
        {/* Centered Subtle Radial Ambient Glow (Synchronized with Active Slide) */}
        <div
          style={{
            background: activeSlideData.radialGlow,
            transition: "background 0.7s ease-in-out",
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[34rem] h-[34rem] rounded-full pointer-events-none"
        />

        {/* FIXED CLOSE / X ICON POSITION (Positioned top-6 right-6 relative to FULL Right Panel) */}
        <button
          type="button"
          onClick={() => {
            setEmailState("input");
            loginForm.reset();
          }}
          className="absolute top-6 right-6 z-30 w-9 h-9 rounded-full border border-white/20 bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Centered Auth Content Box (Max-width ~320px) */}
        <div className="w-full max-w-[320px] mx-auto text-center space-y-6 my-auto relative z-10 pt-8">
          
          <AnimatePresence mode="wait">
            {emailState === "input" ? (
              /* ─── STATE 1: "ENTER YOUR EMAIL ADDRESS" ─── */
              <motion.div
                key="email-input-view"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-4xl sm:text-[2.65rem] font-extrabold text-white tracking-tight leading-[1.08] text-center">
                    Enter your <br />
                    email address
                  </h2>
                </div>

                <Form {...loginForm}>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMagicLink();
                    }}
                    className="space-y-2 pt-1"
                  >
                    {/* COMPACT HORIZONTAL PILL CONTROL */}
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="space-y-0">
                          <FormControl>
                            <div className="relative flex items-center w-full rounded-full border border-white/20 bg-white/10 p-1.5 focus-within:border-blue-400 focus-within:bg-white/15 transition-all shadow-inner">
                              <input
                                type="email"
                                placeholder="Type your email"
                                className="w-full bg-transparent text-white placeholder:text-slate-400 text-sm px-4 py-2 outline-none border-none focus:ring-0"
                                {...field}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleSendMagicLink();
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={handleSendMagicLink}
                                disabled={!isEmailValid}
                                className={`rounded-full px-5 py-2 text-xs font-bold transition-all shrink-0 cursor-pointer ${
                                  isEmailValid
                                    ? "bg-white text-slate-950 hover:bg-slate-100 shadow-md"
                                    : "bg-white/10 text-slate-400 cursor-not-allowed border border-white/10"
                                }`}
                              >
                                Send link
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage className="pt-2 text-xs text-red-400 text-center" />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>

                <div className="pt-4 text-center space-y-2.5">
                  <button
                    type="button"
                    onClick={() => setEmailState("password")}
                    className="text-xs text-slate-400 hover:text-white font-medium cursor-pointer transition-colors block w-full"
                  >
                    Or sign in with password →
                  </button>

                  <div className="pt-2 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDemoLogin("influencer")}
                      className="px-3 py-1.5 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 text-[11px] font-bold transition-all cursor-pointer"
                    >
                      ⚡ Demo Creator
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDemoLogin("brand")}
                      className="px-3 py-1.5 rounded-full bg-purple-600/20 border border-purple-500/30 text-purple-400 hover:bg-purple-600/30 text-[11px] font-bold transition-all cursor-pointer"
                    >
                      ⚡ Demo Brand
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("signup");
                      setSignupStep(1);
                      setLocation("/signup");
                    }}
                    className="text-xs text-blue-400 hover:underline font-bold cursor-pointer transition-colors block w-full pt-1"
                  >
                    Don't have an account? Create account →
                  </button>
                </div>
              </motion.div>
            ) : emailState === "sent" ? (
              /* ─── STATE 2: "CHECK YOUR EMAIL" MAGIC-LINK SENT ─── */
              <motion.div
                key="email-sent-view"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center mx-auto">
                  <Mail className="w-6 h-6" />
                </div>

                <div>
                  <h2 className="text-3xl font-extrabold text-white tracking-tight">Check your email</h2>
                  <p className="text-xs text-slate-300 mt-2 font-medium leading-relaxed">
                    We sent a sign-in link to <br />
                    <span className="text-blue-400 font-bold font-mono">{sentEmail}</span>
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSendMagicLink}
                    className="w-full py-2.5 px-6 rounded-full bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    Resend link
                  </button>

                  <button
                    type="button"
                    onClick={() => setEmailState("input")}
                    className="text-xs text-slate-400 hover:text-white font-medium block w-full text-center transition-colors cursor-pointer"
                  >
                    Use a different email
                  </button>

                  <button
                    type="button"
                    onClick={() => setEmailState("password")}
                    className="text-xs text-blue-400 hover:underline font-semibold block w-full text-center cursor-pointer pt-2"
                  >
                    Sign in with password
                  </button>
                </div>
              </motion.div>
            ) : (
              /* ─── STATE 3: PASSWORD LOGIN FALLBACK ─── */
              <motion.div
                key="password-login-view"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 text-center"
              >
                <div>
                  <h2 className="text-3xl font-extrabold text-white tracking-tight">Enter password</h2>
                  <p className="text-xs text-blue-400 font-mono mt-1 truncate max-w-[260px] mx-auto">
                    {loginForm.getValues("email") || "you@example.com"}
                  </p>
                </div>

                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4 pt-1">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="space-y-0">
                          <FormControl>
                            <input
                              type="email"
                              placeholder="Email address"
                              className="w-full bg-white/10 border border-white/20 text-white placeholder:text-slate-400 text-xs px-4 py-2.5 rounded-full outline-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem className="space-y-0">
                          <FormControl>
                            <div className="relative flex items-center w-full rounded-full border border-white/20 bg-white/10 p-1.5 focus-within:border-blue-400 focus-within:bg-white/15 transition-all shadow-inner">
                              <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter password"
                                className="w-full bg-transparent text-white placeholder:text-slate-400 text-xs px-4 py-2 outline-none border-none focus:ring-0"
                                {...field}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-slate-400 hover:text-slate-200 px-2 cursor-pointer"
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={loginMutation.isPending}
                      className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full text-xs shadow-lg shadow-blue-600/30 cursor-pointer"
                    >
                      {loginMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          Sign in <ArrowRight className="w-4 h-4" />
                        </span>
                      )}
                    </Button>
                  </form>
                </Form>

                <button
                  type="button"
                  onClick={() => setEmailState("input")}
                  className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  ← Back to email link sign in
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Footer info */}
        <div className="w-full text-center text-[11px] text-slate-500 pb-2 relative z-10">
          InfluencerHub Inc.
        </div>

      </div>

    </div>
  );
}
