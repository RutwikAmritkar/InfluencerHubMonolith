import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { socialAccountsTable } from "./social-accounts";

export const socialMetricSnapshotsTable = pgTable("social_metric_snapshots", {
  id: serial("id").primaryKey(),
  socialAccountId: integer("social_account_id").notNull().references(() => socialAccountsTable.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(),
  snapshotDate: timestamp("snapshot_date", { withTimezone: true }).notNull().defaultNow(),
  followers: integer("followers").notNull().default(0),
  following: integer("following"),
  totalContent: integer("total_content").notNull().default(0),
  totalViews: text("total_views").notNull().default("0"),
  totalLikes: text("total_likes").notNull().default("0"),
  avgViews: integer("avg_views").notNull().default(0),
  avgLikes: integer("avg_likes").notNull().default(0),
  avgComments: integer("avg_comments").notNull().default(0),
  engagementRate: text("engagement_rate").notNull().default("0.00"),
  followerGrowth24h: integer("follower_growth_24h").default(0),
  followerGrowth7d: integer("follower_growth_7d").default(0),
  followerGrowth30d: integer("follower_growth_30d").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SocialMetricSnapshotRecord = typeof socialMetricSnapshotsTable.$inferSelect;
