import {
  pgTable,
  serial,
  timestamp,
  integer,
  text,
  boolean,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { influencersTable } from "./influencers";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export type PortfolioMediaType = "video" | "image";
export type PortfolioMediaStatus = "pending" | "ready" | "failed" | "deleted";

export const creatorPortfolioMediaTable = pgTable(
  "creator_portfolio_media",
  {
    id: serial("id").primaryKey(),
    creatorId: integer("creator_id")
      .notNull()
      .references(() => influencersTable.id, { onDelete: "cascade" }),
    mediaType: text("media_type").notNull().default("video"),
    storageKey: text("storage_key").notNull().unique(),
    thumbnailStorageKey: text("thumbnail_storage_key"),
    mimeType: text("mime_type").notNull(),
    fileSizeBytes: integer("file_size_bytes").notNull(),
    durationSeconds: integer("duration_seconds"),
    width: integer("width"),
    height: integer("height"),
    sortOrder: integer("sort_order").notNull().default(0),
    isFeatured: boolean("is_featured").notNull().default(false),
    status: text("status").notNull().default("ready"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_creator_portfolio_creator_sort").on(table.creatorId, table.sortOrder),
    index("idx_creator_portfolio_creator_status").on(table.creatorId, table.status),
    uniqueIndex("idx_creator_portfolio_featured_unique")
      .on(table.creatorId)
      .where(sql`is_featured = true`),
  ]
);

export const insertCreatorPortfolioMediaSchema = createInsertSchema(
  creatorPortfolioMediaTable
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCreatorPortfolioMedia = z.infer<typeof insertCreatorPortfolioMediaSchema>;
export type CreatorPortfolioMedia = typeof creatorPortfolioMediaTable.$inferSelect;
