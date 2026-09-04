import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { toast } from "sonner";
import { Loader2, Mail, ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export default function ForgotPassword() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema as any),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: z.infer<typeof forgotPasswordSchema>) => {
    setIsSubmitting(true);
    setSubmittedEmail(values.email);

    try {
      const res = await fetch("/api/auth/forget-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Unable to send reset email. Please try again.");
        return;
      }

      setIsSubmitted(true);
      toast.success("Password reset request received!");
    } catch (_err) {
      toast.error("Network error. Please try again later.");
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
          {!isSubmitted ? (
            <>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-xl mx-auto border border-blue-500/20 shadow-inner">
                  <Mail className="w-6 h-6" />
                </div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">Forgot your password?</h1>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  Enter the email address associated with your account and we'll send you a password reset link.
                </p>
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs text-slate-300 font-medium block">
                    Email address <span className="text-blue-400">*</span>
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="h-11 bg-slate-950/80 border-slate-800 text-white rounded-xl text-xs focus-visible:ring-blue-500"
                    {...form.register("email")}
                  />
                  {form.formState.errors.email && (
                    <span className="text-[11px] text-red-400">{form.formState.errors.email.message}</span>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full text-xs shadow-lg shadow-blue-600/30 cursor-pointer transition-all"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-5"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold text-white">Check your email</h2>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  If an account exists for <span className="text-blue-400 font-bold font-mono">{submittedEmail}</span>, we've sent a password reset link.
                </p>
              </div>

              <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl text-[11px] text-slate-400 text-left space-y-1">
                <div className="flex items-center gap-1.5 text-blue-400 font-semibold">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Security Tip</span>
                </div>
                <p>The reset link expires in 1 hour and can only be used once. Please check your spam folder if it doesn't appear shortly.</p>
              </div>

              <Button
                type="button"
                onClick={() => {
                  setIsSubmitted(false);
                  form.reset();
                }}
                className="w-full h-10 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-full text-xs cursor-pointer"
              >
                Send another reset email
              </Button>
            </motion.div>
          )}

          <div className="pt-2 text-center border-t border-slate-800/60">
            <Link href="/login" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white font-medium cursor-pointer transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign in
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 w-full max-w-md mx-auto text-center text-[11px] text-slate-500">
        Protected by 256-bit SSL encryption • InfluencerHub Inc.
      </footer>
    </div>
  );
}
