import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  ArrowLeft,
  Lock,
  Database,
  RefreshCw,
  Eye,
  Key,
  Mail,
  CheckCircle2,
} from "lucide-react";
import { LEGAL_CONFIG } from "@/lib/legal-config";

export default function PrivacyPolicy() {
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
              className="bg-[#0A0A0A] hover:bg-zinc-800 text-white font-semibold text-xs rounded-lg px-4 transition-colors shadow-xs"
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF9F6] border border-[#E5E4DF] text-[#6A0D18] text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-[#6A0D18]" />
            <span>Audited Data Protection Standards</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0A0A0A] tracking-[-0.03em]">
            Privacy <span className="font-serif italic font-normal">Policy</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#52525B] max-w-2xl mx-auto leading-relaxed">
            This document outlines how {LEGAL_CONFIG.FULL_LEGAL_STATEMENT} collects, protects,
            encrypts, and processes creator analytics and brand campaign records.
          </p>
          <div className="pt-2 text-xs font-tabular text-[#52525B]">
            Last Updated: September 30, 2026 • Version 1.0
          </div>
        </div>
      </section>

      {/* Main Content Body */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Notice Box */}
        <div className="p-5 rounded-xl bg-white border border-[#E5E4DF] text-xs sm:text-sm text-[#52525B] space-y-2 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-[#0A0A0A] text-sm">
            <Lock className="w-4 h-4 text-[#6A0D18]" />
            <span>Core Privacy Commitment</span>
          </div>
          <p className="leading-relaxed">
            {LEGAL_CONFIG.PLATFORM_NAME} strictly respects creator and brand confidentiality. We do
            not sell personal information or social metrics to third-party data brokers. All
            connected OAuth access tokens are encrypted using server-side AES-256-GCM encryption and
            are never exposed in logs or client-side JavaScript.
          </p>
        </div>

        {/* Section 1: Introduction */}
        <section className="space-y-4 text-[#52525B]">
          <h2 className="text-xl sm:text-2xl font-bold text-[#0A0A0A] tracking-[-0.02em] flex items-center gap-2 border-b border-[#E5E4DF] pb-3">
            <span className="text-[#6A0D18] font-tabular">1.</span> Introduction & Scope
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed">
            This Privacy Policy applies to the {LEGAL_CONFIG.PLATFORM_NAME} web application,
            services, APIs, and associated tools operated by{" "}
            <span className="text-[#0A0A0A] font-semibold">{LEGAL_CONFIG.LEGAL_ENTITY_NAME}</span>{" "}
            (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;).
          </p>
          <p className="text-xs sm:text-sm leading-relaxed">
            {LEGAL_CONFIG.PLATFORM_NAME} is an influencer marketing marketplace designed to connect
            creators with brands and agencies. By creating an account or accessing the platform, you
            agree to the collection and use of information in accordance with this policy.
          </p>
        </section>

        {/* Section 2: Information We Collect */}
        <section className="space-y-4 text-[#52525B]">
          <h2 className="text-xl sm:text-2xl font-bold text-[#0A0A0A] tracking-[-0.02em] flex items-center gap-2 border-b border-[#E5E4DF] pb-3">
            <span className="text-[#6A0D18] font-tabular">2.</span> Information We Collect
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-5 rounded-xl bg-white border border-[#E5E4DF] space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-[#0A0A0A] font-bold text-sm">
                <Key className="w-4 h-4 text-[#6A0D18]" />
                <span>Account & Authentication</span>
              </div>
              <p className="text-xs text-[#52525B] leading-relaxed">
                When you register or log in, we collect your name, email address, password hash
                (processed via secure bcrypt/Argon2 hashing), user role, and session IP metadata.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-[#E5E4DF] space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-[#0A0A0A] font-bold text-sm">
                <Database className="w-4 h-4 text-[#6A0D18]" />
                <span>Media Kit & Profile Details</span>
              </div>
              <p className="text-xs text-[#52525B] leading-relaxed">
                We store creator and brand profile details, including bio, category tags, geographic
                location, rate quotes in INR (₹), portfolio links, and campaign application details.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-[#E5E4DF] space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-[#0A0A0A] font-bold text-sm">
                <RefreshCw className="w-4 h-4 text-[#059669]" />
                <span>Verified Social Media Telemetry</span>
              </div>
              <p className="text-xs text-[#52525B] leading-relaxed">
                When a Creator connects an official social account, we verify external IDs, handle,
                profile picture URLs, follower counts, and engagement rates directly via
                authenticated API protocols.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-[#E5E4DF] space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-[#0A0A0A] font-bold text-sm">
                <Eye className="w-4 h-4 text-[#0A0A0A]" />
                <span>Discussions & Agreements</span>
              </div>
              <p className="text-xs text-[#52525B] leading-relaxed">
                We store platform messages, campaign proposals, and milestone agreement terms
                transmitted between authenticated Creators and Brands to facilitate dispute
                resolution and deliverable verification.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Social Account & Token Security */}
        <section className="space-y-4 text-[#52525B]">
          <h2 className="text-xl sm:text-2xl font-bold text-[#0A0A0A] tracking-[-0.02em] flex items-center gap-2 border-b border-[#E5E4DF] pb-3">
            <span className="text-[#6A0D18] font-tabular">3.</span> OAuth Security & Encryption
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed">
            {LEGAL_CONFIG.PLATFORM_NAME} strictly integrates with external platforms through
            authorized API protocols:
          </p>
          <ul className="space-y-2 text-xs sm:text-sm text-[#52525B] pl-4 list-disc">
            <li>
              <strong className="text-[#0A0A0A]">Single-Use OAuth States:</strong> Social connection
              attempts generate cryptographically signed, single-use state tokens to prevent CSRF
              attacks.
            </li>
            <li>
              <strong className="text-[#0A0A0A]">AES-256-GCM Token Encryption:</strong> Access
              tokens are encrypted on our server using 256-bit AES-GCM encryption with unique
              initialization vectors prior to persistence.
            </li>
            <li>
              <strong className="text-[#0A0A0A]">Zero Token Exposure:</strong> Access tokens and
              secret keys are never returned in client JavaScript bundles or logged in telemetry.
            </li>
          </ul>
        </section>

        {/* Section 4: Contact Info */}
        <section className="p-6 rounded-xl bg-white border border-[#E5E4DF] space-y-3 shadow-xs">
          <h3 className="text-base font-bold text-[#0A0A0A] flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#6A0D18]" />
            <span>Contact & Data Controller</span>
          </h3>
          <p className="text-xs text-[#52525B] leading-relaxed">
            If you have questions regarding this Privacy Policy or your data, please contact our
            team at:
          </p>
          <div className="text-xs text-[#52525B] space-y-1.5 pt-1">
            <p>
              <strong>Platform:</strong> {LEGAL_CONFIG.PLATFORM_NAME}
            </p>
            <p>
              <strong>Legal Entity:</strong> {LEGAL_CONFIG.LEGAL_ENTITY_NAME}
            </p>
            <p>
              <strong>Contact Email:</strong>{" "}
              <a
                href={`mailto:${LEGAL_CONFIG.CONTACT.PRIVACY_EMAIL}`}
                className="text-[#6A0D18] hover:underline font-mono"
              >
                {LEGAL_CONFIG.CONTACT.PRIVACY_EMAIL}
              </a>
            </p>
            <p>
              <strong>Address:</strong> {LEGAL_CONFIG.CONTACT.REGISTERED_ADDRESS}
            </p>
            <p>
              <strong>Jurisdiction:</strong> {LEGAL_CONFIG.CONTACT.GOVERNING_JURISDICTION}
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
            <Link href="/privacy" className="text-[#0A0A0A] font-semibold hover:underline">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-[#0A0A0A] transition-colors">
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
