import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  FileText,
  ArrowLeft,
  Shield,
  Users,
  AlertTriangle,
  Scale,
  CheckCircle2,
  Mail,
} from "lucide-react";
import { LEGAL_CONFIG } from "@/lib/legal-config";

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0A0A0A] font-sans selection:bg-[#0A0A0A] selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#E5E4DF] px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 cursor-pointer group">
            <div className="h-8 w-8 bg-[#0A0A0A] text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-xs group-hover:scale-105 transition-transform">
              CB
            </div>
            <span className="text-lg font-extrabold tracking-[-0.03em] text-[#0A0A0A]">
              Creators<span className="font-serif italic font-normal">Brand</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-[#52525B] hover:text-[#0A0A0A] hover:bg-[#F2F1EC] rounded-lg"
              asChild
            >
              <Link href="/">
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                Return to Workspace
              </Link>
            </Button>
            <Button
              size="sm"
              className="bg-[#0A0A0A] hover:bg-[#1D4ED8] text-white font-semibold text-xs rounded-lg px-4 transition-colors shadow-xs"
              asChild
            >
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-b border-[#E5E4DF] bg-white">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF9F6] border border-[#E5E4DF] text-[#1D4ED8] text-xs font-semibold">
            <FileText className="w-4 h-4" />
            <span>Platform Agreement &amp; Milestone Terms</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0A0A0A] tracking-[-0.03em]">
            Terms &amp; <span className="font-serif italic font-normal">Conditions</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#52525B] max-w-2xl mx-auto leading-relaxed">
            These terms govern your access to the {LEGAL_CONFIG.PLATFORM_NAME} marketplace, verified
            creator media kits, brand campaigns, and milestone disbursements.
          </p>
          <div className="pt-2 text-xs font-tabular text-[#52525B]">
            Last Updated: September 30, 2026 • Version 1.0
          </div>
        </div>
      </section>

      {/* Main Content Body */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Section 1: Agreement to Terms */}
        <section className="space-y-4 text-[#52525B]">
          <h2 className="text-xl sm:text-2xl font-bold text-[#0A0A0A] tracking-[-0.02em] flex items-center gap-2 border-b border-[#E5E4DF] pb-3">
            <span className="text-[#1D4ED8] font-tabular">1.</span> Agreement to Terms
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed">
            By accessing, registering for, or using {LEGAL_CONFIG.PLATFORM_NAME}{" "}
            (&quot;Platform&quot;), operated by{" "}
            <span className="text-[#0A0A0A] font-semibold">{LEGAL_CONFIG.LEGAL_ENTITY_NAME}</span>{" "}
            (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), you (&quot;User&quot;,
            &quot;Creator&quot;, or &quot;Brand&quot;) agree to be legally bound by these Terms
            &amp; Conditions and our Privacy Policy.
          </p>
          <p className="text-xs sm:text-sm leading-relaxed">
            If you do not agree to all of these terms, you are prohibited from accessing or using
            the Platform.
          </p>
        </section>

        {/* Section 2: Account Registration & Roles */}
        <section className="space-y-4 text-[#52525B]">
          <h2 className="text-xl sm:text-2xl font-bold text-[#0A0A0A] tracking-[-0.02em] flex items-center gap-2 border-b border-[#E5E4DF] pb-3">
            <span className="text-[#1D4ED8] font-tabular">2.</span> Account Registration &amp; Roles
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-5 rounded-xl bg-white border border-[#E5E4DF] space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-[#0A0A0A] font-bold text-sm">
                <Users className="w-4 h-4 text-[#1D4ED8]" />
                <span>Creator Accounts</span>
              </div>
              <p className="text-xs text-[#52525B] leading-relaxed">
                Creators build verified media kits, complete onboarding, connect social channels via
                official OAuth APIs, and apply to vaulted brand campaigns.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-[#E5E4DF] space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-[#0A0A0A] font-bold text-sm">
                <Shield className="w-4 h-4 text-[#059669]" />
                <span>Brand Accounts</span>
              </div>
              <p className="text-xs text-[#52525B] leading-relaxed">
                Brands publish marketing briefs, discover creators using category and demographic
                filters, review pitches, and fund milestones via our verified payment
                infrastructure.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Milestones & Payout Clearance */}
        <section className="space-y-4 text-[#52525B]">
          <h2 className="text-xl sm:text-2xl font-bold text-[#0A0A0A] tracking-[-0.02em] flex items-center gap-2 border-b border-[#E5E4DF] pb-3">
            <span className="text-[#1D4ED8] font-tabular">3.</span> Milestone Commitments &amp;
            Payout Clearance
          </h2>
          <div className="space-y-3 text-xs sm:text-sm leading-relaxed">
            <p>
              <strong className="text-[#0A0A0A]">Committed Allocations:</strong> All brand campaign
              allocations are securely committed at agreement confirmation. Funds remain held until
              specified content deliverables are reviewed and cleared.
            </p>
            <p>
              <strong className="text-[#0A0A0A]">Creator Fulfillment:</strong> Creators agree to
              submit draft assets prior to scheduled deadlines. Upon brand approval or automated
              milestone expiry, disbursements are released immediately to the creator's payout
              destination.
            </p>
          </div>
        </section>

        {/* Section 4: Governing Law & Contact */}
        <section className="p-6 rounded-xl bg-white border border-[#E5E4DF] space-y-3 shadow-xs">
          <h3 className="text-base font-bold text-[#0A0A0A] flex items-center gap-2">
            <Scale className="w-5 h-5 text-[#1D4ED8]" />
            <span>Governing Law &amp; Legal Notices</span>
          </h3>
          <p className="text-xs text-[#52525B] leading-relaxed">
            These Terms shall be governed by and construed in accordance with the laws of{" "}
            <span className="text-[#0A0A0A] font-semibold">
              {LEGAL_CONFIG.CONTACT.GOVERNING_JURISDICTION}
            </span>
            . For legal inquiries, contact:
          </p>
          <div className="text-xs text-[#52525B] space-y-1.5 pt-1">
            <p>
              <strong>Platform:</strong> {LEGAL_CONFIG.PLATFORM_NAME}
            </p>
            <p>
              <strong>Legal Entity:</strong> {LEGAL_CONFIG.LEGAL_ENTITY_NAME}
            </p>
            <p>
              <strong>Support Email:</strong>{" "}
              <a
                href={`mailto:${LEGAL_CONFIG.CONTACT.SUPPORT_EMAIL}`}
                className="text-[#1D4ED8] hover:underline font-mono"
              >
                {LEGAL_CONFIG.CONTACT.SUPPORT_EMAIL}
              </a>
            </p>
            <p>
              <strong>Registered Address:</strong> {LEGAL_CONFIG.CONTACT.REGISTERED_ADDRESS}
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E5E4DF] py-8 px-4 sm:px-8 bg-white text-xs text-[#52525B] mt-12">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 bg-[#0A0A0A] text-white rounded-md flex items-center justify-center font-bold text-xs">
              CB
            </div>
            <span className="font-bold text-[#0A0A0A] text-sm">{LEGAL_CONFIG.PLATFORM_NAME}</span>
          </div>
          <div className="flex items-center gap-4 text-[#52525B]">
            <Link href="/privacy" className="hover:text-[#0A0A0A] transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/terms" className="text-[#0A0A0A] font-semibold hover:underline">
              Terms & Conditions
            </Link>
          </div>
          <div>
            &copy; {new Date().getFullYear()} {LEGAL_CONFIG.LEGAL_ENTITY_NAME}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
