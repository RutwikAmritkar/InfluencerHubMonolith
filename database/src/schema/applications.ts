import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const applicationsTable = pgTable("applications", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  influencerId: integer("influencer_id").notNull(),
  status: text("status").notNull().default("pending"),
  message: text("message"),
  quotedRatePaise: integer("quoted_rate_paise"),
  pitchText: text("pitch_text"),
  proposedTimeline: text("proposed_timeline"),
  portfolioSamples: jsonb("portfolio_samples").$type<string[]>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertApplicationSchema = createInsertSchema(applicationsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applicationsTable.$inferSelect;
