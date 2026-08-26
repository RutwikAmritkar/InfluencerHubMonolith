import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { socialAccountsTable } from "./social-accounts";

export const socialContentTable = pgTable("social_content", {
  id: serial("id").primaryKey(),
  socialAccountId: integer("social_account_id").notNull().references(() => socialAccountsTable.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(),
  externalContentId: text("external_content_id").notNull(),
  contentType: text("content_type").notNull(), // "post" | "reel" | "video" | "short"
  title: text("title"),
  caption: text("caption"),
  permalink: text("permalink"),
  thumbnailUrl: text("thumbnail_url"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  views: integer("views").notNull().default(0),
  likes: integer("likes").notNull().default(0),
  comments: integer("comments").notNull().default(0),
  shares: integer("shares").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SocialContentRecord = typeof socialContentTable.$inferSelect;
