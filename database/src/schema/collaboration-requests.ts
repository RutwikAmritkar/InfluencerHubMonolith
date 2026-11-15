import {
  pgTable,
  serial,
  timestamp,
  integer,
  text,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { brandsTable } from "./brands";
import { influencersTable } from "./influencers";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const collaborationRequestsTable = pgTable(
  "collaboration_requests",
  {
    id: serial("id").primaryKey(),
    brandId: integer("brand_id")
      .notNull()
      .references(() => brandsTable.id, { onDelete: "cascade" }),
    influencerId: integer("influencer_id")
      .notNull()
      .references(() => influencersTable.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"), // 'pending' | 'accepted' | 'declined' | 'withdrawn'
    title: text("title").notNull(),
    description: text("description").notNull(),
    deliverables: jsonb("deliverables")
      .$type<Array<{ title: string; count: number; description?: string }>>()
      .notNull(),
    budgetMinPaise: integer("budget_min_paise"),
    budgetMaxPaise: integer("budget_max_paise"),
    currency: text("currency").notNull().default("INR"),
    proposedTimeline: text("proposed_timeline"),
    message: text("message"),
    declineReason: text("decline_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_collab_requests_brand_creator_pending").on(table.brandId, table.influencerId),
    index("idx_collab_requests_influencer_status").on(table.influencerId, table.status),
    index("idx_collab_requests_brand_status").on(table.brandId, table.status),
  ]
);

export const insertCollaborationRequestSchema = createInsertSchema(collaborationRequestsTable).omit(
  { id: true, createdAt: true, updatedAt: true }
);
export type InsertCollaborationRequest = z.infer<typeof insertCollaborationRequestSchema>;
export type CollaborationRequest = typeof collaborationRequestsTable.$inferSelect;
