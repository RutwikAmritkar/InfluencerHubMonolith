import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { admin, bearer } from "better-auth/plugins";
import { db } from "@workspace/db";
import * as authSchema from "@workspace/db/schema";
import { logAuditEvent } from "./audit";
import { logger } from "../lib/logger.js";

import { sendPasswordResetEmail, sendVerificationEmailService } from "../services/email.service";

const baseURL = process.env.BETTER_AUTH_URL || process.env.SERVER_URL || "http://localhost:3000";
const secret =
  process.env.BETTER_AUTH_SECRET ||
  process.env.SESSION_SECRET ||
  "influencer-hub-secret-key-production-32-chars";

export function isEmailVerificationRequired(): boolean {
  const val = process.env.EMAIL_VERIFICATION_REQUIRED;
  if (!val) return false;
  return val.trim().toLowerCase() === "true";
}

export const auth = betterAuth({
  baseURL,
  secret,
  trustedOrigins: [
    process.env.APP_URL,
    process.env.CLIENT_URL,
    process.env.FRONTEND_URL,
    "https://creatorsbrand.in",
    "https://www.creatorsbrand.in",
    "http://localhost:5000",
    "http://localhost:5001",
  ].filter(Boolean) as string[],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: authSchema.user,
      session: authSchema.session,
      account: authSchema.account,
      verification: authSchema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: isEmailVerificationRequired(),
    async sendResetPassword(data, request) {
      logger.info({ email: data.user.email }, "[AUTH] Password reset requested");
      await sendPasswordResetEmail({
        email: data.user.email,
        url: data.url,
        token: data.token,
      });
      // Audit log event
      await logAuditEvent({
        userId: data.user.id,
        action: "PASSWORD_RESET_REQUESTED",
        details: JSON.stringify({ email: data.user.email }),
      });
    },
  },
  emailVerification: {
    sendOnSignUp: false,
    async sendVerificationEmail(data, request) {
      logger.info({ email: data.user.email }, "[AUTH] Verification email sent");
      await sendVerificationEmailService({
        email: data.user.email,
        url: data.url,
        token: data.token,
      });
      await logAuditEvent({
        userId: data.user.id,
        action: "EMAIL_VERIFICATION_SENT",
        details: JSON.stringify({ email: data.user.email }),
      });
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      enabled: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    },
    apple: {
      clientId: process.env.APPLE_CLIENT_ID || "",
      clientSecret: process.env.APPLE_CLIENT_SECRET || "",
      enabled: Boolean(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET),
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
  },
  advanced: {
    useSecureCookies:
      process.env.NODE_ENV === "production" &&
      !baseURL.startsWith("http://localhost") &&
      !baseURL.startsWith("http://127.0.0.1"),
  },
  plugins: [
    admin({
      defaultRole: "influencer",
      adminRole: ["admin"],
    }),
    bearer(),
  ],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await logAuditEvent({
            userId: user.id,
            action: "USER_REGISTERED",
            details: JSON.stringify({ email: user.email, role: user.role }),
          });
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          await logAuditEvent({
            userId: session.userId,
            action: "LOGIN_SUCCESS",
            ipAddress: session.ipAddress ?? undefined,
            userAgent: session.userAgent ?? undefined,
          });
        },
      },
    },
  },
});

export type Auth = typeof auth;
