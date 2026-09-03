import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const brandsTable = pgTable("brands", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  industry: text("industry").notNull().default("Technology"),
  country: text("country").notNull().default("India"),
  city: text("city"),
  monthlyBudget: integer("monthly_budget").default(50000),
  description: text("description"),
  logoUrl: text("logo_url").notNull().default(""),
  website: text("website"),
  categories: text("categories").array().notNull().default([]),
  targetAudience: jsonb("target_audience"),
  campaignGoals: text("campaign_goals").array().notNull().default([]),
  campaignPreferences: jsonb("campaign_preferences"),
  socialAccounts: jsonb("social_accounts").default([]),
  onboardingStep: text("onboarding_step").default("B1"),
  onboardingStatus: text("onboarding_status").default("pending"),
  profileCompletion: integer("profile_completion").notNull().default(70),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBrandSchema = createInsertSchema(brandsTable).omit({ id: true, createdAt: true });
export type InsertBrand = z.infer<typeof insertBrandSchema>;
export type Brand = typeof brandsTable.$inferSelect;
