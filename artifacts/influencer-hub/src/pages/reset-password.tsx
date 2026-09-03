import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, CheckCircle2, Lock, ArrowLeft, AlertCircle } from "lucide-react";

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm your new password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Extract token from URL query params
    const searchParams = new URLSearchParams(window.location.search);
    const tokenParam = searchParams.get("token") || searchParams.get("code");
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setErrorMessage("No valid password reset token found in link URL.");
    }
  }, []);

  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema as any),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: z.infer<typeof resetPasswordSchema>) => {
    if (!token) {
      toast.error("Invalid reset link. Token is missing.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: values.password, newPassword: values.password }),
      });

      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || "Unable to reset password. Link may have expired or already been used.";
        setErrorMessage(msg);
        toast.error(msg);
        return;
      }

      setIsSuccess(true);
      toast.success("Password reset successfully! 🎉");
    } catch (_err) {
      toast.error("Network error during password reset.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0D111D] text-white flex flex-col justify-between p-6 sm:p-10 font-sans selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Background SVG Orbits */}
      <div className="absolute inset-0 opacity-15 pointer-events-none overflow-hidden">
        <svg className="w-full h-full text-blue-500" viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M-100 200C200 400 400 -100 800 300C1200 700 1600 200 1800 500" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" />
          <path d="M-200 600C100 200 600 800 1000 400C1400 0 1700 800 1900 600" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="400" cy="250" r="180" stroke="currentColor" strokeWidth="1" opacity="0.4" />
          <circle cx="1100" cy="550" r="240" stroke="currentColor" strokeWidth="1" opacity="0.3" />
        </svg>
      </div>

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between w-full max-w-7xl mx-auto">
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
      </header>

      {/* Main Content Area */}
      <main className="relative z-20 my-auto py-8 w-full max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full rounded-[24px] bg-[#141A2E]/90 border border-slate-800/80 p-8 sm:p-10 shadow-2xl backdrop-blur-xl text-left space-y-6 ring-1 ring-white/5"
        >
          {isSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-extrabold text-white tracking-tight">Password updated successfully.</h2>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  Your password has been changed. You can now sign in to your InfluencerHub account using your new credentials.
                </p>
              </div>

              <Button
                type="button"
                onClick={() => setLocation("/login")}
                className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full text-xs shadow-lg shadow-blue-600/30 cursor-pointer"
              >
                Log In
              </Button>
            </motion.div>
          ) : !token || errorMessage ? (
            <div className="text-center space-y-5">
              <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold text-white">Invalid Reset Link</h2>
                <p className="text-xs text-red-400 font-medium leading-relaxed">
                  {errorMessage || "The password reset link is invalid or missing a security token."}
                </p>
              </div>

              <Link href="/forgot-password">
                <Button
                  type="button"
                  className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full text-xs cursor-pointer shadow-md"
                >
                  Request a new password reset link
                </Button>
              </Link>

              <div className="pt-2 border-t border-slate-800/60">
                <Link href="/login" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white font-medium cursor-pointer">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign in
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-xl mx-auto border border-blue-500/20 shadow-inner">
                  <Lock className="w-6 h-6" />
                </div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">Create a new password</h1>
                <p className="text-xs text-slate-400 font-medium">
                  Set a strong new password for your account. Minimum 6 characters.
                </p>
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-xs text-slate-300 font-medium block">
                    New Password <span className="text-blue-400">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      className="h-11 bg-slate-950/80 border-slate-800 text-white rounded-xl text-xs pr-10 focus-visible:ring-blue-500"
                      {...form.register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form.formState.errors.password && (
                    <span className="text-[11px] text-red-400">{form.formState.errors.password.message}</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirmPassword" className="text-xs text-slate-300 font-medium block">
                    Confirm New Password <span className="text-blue-400">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      className="h-11 bg-slate-950/80 border-slate-800 text-white rounded-xl text-xs pr-10 focus-visible:ring-blue-500"
                      {...form.register("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form.formState.errors.confirmPassword && (
                    <span className="text-[11px] text-red-400">{form.formState.errors.confirmPassword.message}</span>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full text-xs shadow-lg shadow-blue-600/30 cursor-pointer transition-all mt-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>

              <div className="pt-2 text-center border-t border-slate-800/60">
                <Link href="/login" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white font-medium cursor-pointer transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign in
                </Link>
              </div>
            </>
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 w-full max-w-md mx-auto text-center text-[11px] text-slate-500">
        Protected by 256-bit SSL encryption • InfluencerHub Inc.
      </footer>
    </div>
  );
}
