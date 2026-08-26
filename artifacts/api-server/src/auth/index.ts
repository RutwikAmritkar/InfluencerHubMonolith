import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { admin, bearer } from "better-auth/plugins";
import { db } from "@workspace/db";
import * as authSchema from "@workspace/db/schema";
import { logAuditEvent } from "./audit";

const baseURL = process.env.BETTER_AUTH_URL || process.env.SERVER_URL || "http://localhost:3000";
const secret = process.env.BETTER_AUTH_SECRET || process.env.SESSION_SECRET || "influencer-hub-secret-key-production-32-chars";

export const auth = betterAuth({
  baseURL,
  secret,
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
    requireEmailVerification: false,
    async sendResetPassword(data, request) {
      console.log(`[AUTH LOG] Password reset requested for ${data.user.email}. Token link: ${data.url}`);
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
      console.log(`[AUTH LOG] Verification email sent to ${data.user.email}. Verification link: ${data.url}`);
      await logAuditEvent({
        userId: data.user.id,
        action: "EMAIL_VERIFICATION_SENT",
        details: JSON.stringify({ email: data.user.email }),
      });
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "demo-google-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "demo-google-client-secret",
      enabled: Boolean(process.env.GOOGLE_CLIENT_ID),
    },
    apple: {
      clientId: process.env.APPLE_CLIENT_ID || "demo-apple-client-id",
      clientSecret: process.env.APPLE_CLIENT_SECRET || "demo-apple-client-secret",
      enabled: Boolean(process.env.APPLE_CLIENT_ID),
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
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
