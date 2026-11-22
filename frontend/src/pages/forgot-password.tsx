import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { LEGAL_CONFIG } from "@/lib/legal-config";
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
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${apiUrl}/api/auth/forget-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
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
          {!isSubmitted ? (
            <>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-xl bg-[#FAF9F6] text-[#0A0A0A] border border-[#E5E4DF] flex items-center justify-center text-xl mx-auto shadow-xs">
                  <Mail className="w-5 h-5 text-[#6A0D18]" />
                </div>
                <h1 className="text-2xl font-extrabold text-[#0A0A0A] tracking-[-0.03em]">
                  Reset your{" "}
                  <span className="font-serif italic font-normal text-[#6A0D18]">password</span>
                </h1>
                <p className="text-xs text-[#52525B] leading-relaxed">
                  Enter your email address and we will dispatch a secure credential reset link.
                </p>
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs text-[#0A0A0A] font-semibold block">
                    Account Email Address <span className="text-[#6A0D18]">*</span>
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="h-10 bg-[#FAF9F6] border-[#E5E4DF] text-[#0A0A0A] rounded-lg text-xs focus-visible:ring-[#0A0A0A]"
                    {...form.register("email")}
                  />
                  {form.formState.errors.email && (
                    <span className="text-xs text-rose-600">
                      {form.formState.errors.email.message}
                    </span>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-10 bg-[#0A0A0A] hover:bg-zinc-800 text-white font-semibold rounded-lg text-xs shadow-xs cursor-pointer transition-colors"
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
              <div className="w-12 h-12 rounded-full bg-[#059669]/10 text-[#059669] border border-[#059669]/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-[#0A0A0A]">Check your inbox</h2>
                <p className="text-xs text-[#52525B] leading-relaxed">
                  If an account exists for{" "}
                  <span className="text-[#0A0A0A] font-bold font-tabular">{submittedEmail}</span>,
                  we've dispatched a password reset link.
                </p>
              </div>

              <div className="p-3.5 bg-[#FAF9F6] border border-[#E5E4DF] rounded-lg text-xs text-[#52525B] text-left space-y-1">
                <div className="flex items-center gap-1.5 text-[#6A0D18] font-semibold">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Security Notice</span>
                </div>
                <p>
                  The reset link expires in 1 hour and can only be used once. Please check your spam
                  folder if it doesn't appear shortly.
                </p>
              </div>

              <Button
                type="button"
                onClick={() => {
                  setIsSubmitted(false);
                  form.reset();
                }}
                className="w-full h-10 bg-white border border-[#E5E4DF] hover:bg-[#FAF9F6] text-[#0A0A0A] font-semibold rounded-lg text-xs cursor-pointer shadow-xs"
              >
                Send another reset email
              </Button>
            </motion.div>
          )}

          <div className="pt-2 text-center border-t border-[#E5E4DF]">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-xs text-[#52525B] hover:text-[#0A0A0A] font-medium cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign in
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 w-full max-w-md mx-auto text-center text-xs text-[#52525B]">
        Protected by 256-bit SSL encryption • {LEGAL_CONFIG.FULL_LEGAL_STATEMENT}
      </footer>
    </div>
  );
}
