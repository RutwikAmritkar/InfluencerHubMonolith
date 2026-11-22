import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { LEGAL_CONFIG } from "@/lib/legal-config";
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
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${apiUrl}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, password: values.password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Password reset token expired or invalid.");
        toast.error(data.error || "Unable to reset password.");
        return;
      }

      setIsSuccess(true);
      toast.success("Password reset successfully! You can now log in.");
    } catch (_err) {
      toast.error("Network error. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FAF9F6] text-[#0A0A0A] flex flex-col justify-between p-6 sm:p-10 font-sans selection:bg-[#0A0A0A] selection:text-white relative">
      {/* Header */}
      <header className="relative z-20 flex items-center justify-between w-full max-w-5xl mx-auto">
        <Link href="/">
          <div className="inline-flex items-center gap-2.5 cursor-pointer group">
            <div className="h-9 w-9 bg-[#0A0A0A] text-white rounded-lg flex items-center justify-center font-bold text-lg shadow-xs group-hover:scale-105 transition-transform">
              CB
            </div>
            <span className="text-xl font-extrabold tracking-[-0.03em] text-[#0A0A0A]">
              Creators<span className="font-serif italic font-normal">Brand</span>
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
          className="w-full rounded-xl bg-white border border-[#E5E4DF] p-8 sm:p-10 shadow-xs text-left space-y-6"
        >
          {isSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <div className="w-14 h-14 rounded-full bg-[#059669]/10 text-[#059669] border border-[#059669]/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-[#059669]" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold text-[#0A0A0A] tracking-[-0.03em]">
                  Password updated successfully.
                </h2>
                <p className="text-xs text-[#52525B] leading-relaxed">
                  Your credentials have been updated. You can now sign in to your CreatorsBrand
                  workspace.
                </p>
              </div>

              <Button
                type="button"
                onClick={() => setLocation("/login")}
                className="w-full h-10 bg-[#0A0A0A] hover:bg-zinc-800 text-white font-semibold rounded-lg text-xs shadow-xs cursor-pointer transition-colors"
              >
                Sign In
              </Button>
            </motion.div>
          ) : !token || errorMessage ? (
            <div className="text-center space-y-5">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-[#0A0A0A]">Invalid Reset Link</h2>
                <p className="text-xs text-rose-600 leading-relaxed">
                  {errorMessage ||
                    "The password reset link is invalid or missing a security token."}
                </p>
              </div>

              <Link href="/forgot-password">
                <Button
                  type="button"
                  className="w-full h-10 bg-[#0A0A0A] hover:bg-zinc-800 text-white font-semibold rounded-lg text-xs cursor-pointer shadow-xs transition-colors"
                >
                  Request a new password reset link
                </Button>
              </Link>

              <div className="pt-2 border-t border-[#E5E4DF]">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-xs text-[#52525B] hover:text-[#0A0A0A] font-medium cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign in
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-xl bg-[#FAF9F6] text-[#0A0A0A] border border-[#E5E4DF] flex items-center justify-center text-xl mx-auto shadow-xs">
                  <Lock className="w-5 h-5 text-[#6A0D18]" />
                </div>
                <h1 className="text-2xl font-extrabold text-[#0A0A0A] tracking-[-0.03em]">
                  Create a new{" "}
                  <span className="font-serif italic font-normal text-[#6A0D18]">password</span>
                </h1>
                <p className="text-xs text-[#52525B]">
                  Set a secure new password for your account. Minimum 6 characters.
                </p>
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-xs text-[#0A0A0A] font-semibold block">
                    New Password <span className="text-[#6A0D18]">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      className="h-10 bg-[#FAF9F6] border-[#E5E4DF] text-[#0A0A0A] rounded-lg text-xs pr-10 focus-visible:ring-[#0A0A0A]"
                      {...form.register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#52525B] hover:text-[#0A0A0A] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form.formState.errors.password && (
                    <span className="text-xs text-rose-600">
                      {form.formState.errors.password.message}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="confirmPassword"
                    className="text-xs text-[#0A0A0A] font-semibold block"
                  >
                    Confirm New Password <span className="text-[#6A0D18]">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      className="h-10 bg-[#FAF9F6] border-[#E5E4DF] text-[#0A0A0A] rounded-lg text-xs pr-10 focus-visible:ring-[#0A0A0A]"
                      {...form.register("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#52525B] hover:text-[#0A0A0A] cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {form.formState.errors.confirmPassword && (
                    <span className="text-xs text-rose-600">
                      {form.formState.errors.confirmPassword.message}
                    </span>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-10 bg-[#0A0A0A] hover:bg-zinc-800 text-white font-semibold rounded-lg text-xs shadow-xs cursor-pointer transition-colors mt-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>

              <div className="pt-2 text-center border-t border-[#E5E4DF]">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-xs text-[#52525B] hover:text-[#0A0A0A] font-medium cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign in
                </Link>
              </div>
            </>
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 w-full max-w-md mx-auto text-center text-xs text-[#52525B]">
        Protected by 256-bit SSL encryption • {LEGAL_CONFIG.FULL_LEGAL_STATEMENT}
      </footer>
    </div>
  );
}
