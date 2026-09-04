import { pgTable, text, serial, timestamp, integer, real, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export type SocialAccountStatus = "UNVERIFIED" | "SUBMITTED" | "VERIFYING" | "VERIFIED" | "FAILED" | "EXPIRED";
export type VerificationType = "PROFILE_EXISTS" | "OWNER_VERIFIED" | "OAUTH_CONNECTED";

export interface SocialAccount {
  id: string;
  creatorId: number;
  platform: string;
  username?: string;
  profileUrl?: string;
  inputType: "username" | "url";
  status: SocialAccountStatus;
  verificationType?: VerificationType;
  verifiedAt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export const influencersTable = pgTable("influencers", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  bio: text("bio"),
  category: text("category").notNull().default("Lifestyle"),
  country: text("country").notNull().default("India"),
  state: text("state"),
  city: text("city"),
  followers: integer("followers").notNull().default(0),
  engagementRate: real("engagement_rate").notNull().default(0),
  avgViews: integer("avg_views").notNull().default(0),
  collaborationCost: integer("collaboration_cost").notNull().default(0),
  platforms: text("platforms").array().notNull().default([]),
  languages: text("languages").array().notNull().default([]),
  avatarUrl: text("avatar_url").notNull().default(""),
  coverUrl: text("cover_url"),
  profileCompletion: integer("profile_completion").notNull().default(70),
  monthlyEarnings: integer("monthly_earnings").notNull().default(0),
  isVerified: boolean("is_verified").notNull().default(false),
  availability: text("availability").default("available"),
  portfolio: text("portfolio").array().notNull().default([]),
  socialAccounts: jsonb("social_accounts").$type<SocialAccount[]>().notNull().default([]),
  creatorType: text("creator_type").default("Micro Creator"),
  niches: text("niches").array().notNull().default([]),
  audienceData: jsonb("audience_data"),
  collaborationPreferences: jsonb("collaboration_preferences"),
  goals: text("goals").array().notNull().default([]),
  onboardingStep: text("onboarding_step").default("C1"),
  onboardingStatus: text("onboarding_status").default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertInfluencerSchema = createInsertSchema(influencersTable).omit({ id: true, createdAt: true });
export type InsertInfluencer = z.infer<typeof insertInfluencerSchema>;
export type Influencer = typeof influencersTable.$inferSelect;
