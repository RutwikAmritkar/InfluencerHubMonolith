import { pgTable, text, serial, timestamp, integer, index } from "drizzle-orm/pg-core";
import { socialAccountsTable } from "./social-accounts";

export const socialMediaInsightsTable = pgTable(
  "social_media_insights",
  {
    id: serial("id").primaryKey(),
    socialAccountId: integer("social_account_id")
      .notNull()
      .references(() => socialAccountsTable.id, { onDelete: "cascade" }),
    externalContentId: text("external_content_id"), // Null for account-level insights, media ID for media-level insights
    metric: text("metric").notNull(),
    value: text("value").notNull(),
    period: text("period"), // "day", "week", "days_28", "lifetime", etc.
    periodStart: timestamp("period_start", { withTimezone: true, mode: "date" }),
    periodEnd: timestamp("period_end", { withTimezone: true, mode: "date" }),
    fetchedAt: timestamp("fetched_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),

    source: text("source").notNull().default("instagram_graph_api"),
    metadata: text("metadata"),
  },
  (table) => [
    index("idx_social_insights_account").on(table.socialAccountId),
    index("idx_social_insights_metric").on(table.socialAccountId, table.metric),
    index("idx_social_insights_content").on(table.socialAccountId, table.externalContentId),
  ]
);

export type SocialMediaInsightRecord = typeof socialMediaInsightsTable.$inferSelect;
