import { pgTable, text, serial, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const oauthStatesTable = pgTable(
  "oauth_states",
  {
    id: serial("id").primaryKey(),
    state: text("state").notNull(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("idx_oauth_states_state").on(table.state),
    index("idx_oauth_states_user_id").on(table.userId),
  ]
);

export type OAuthStateRecord = typeof oauthStatesTable.$inferSelect;
