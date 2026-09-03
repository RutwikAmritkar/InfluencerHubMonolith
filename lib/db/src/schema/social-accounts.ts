import { pgTable, text, serial, timestamp, boolean, uniqueIndex, index } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const socialAccountsTable = pgTable(
  "social_accounts",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    platform: text("platform", { enum: ["instagram", "youtube", "tiktok"] }).notNull(),
    externalAccountId: text("external_account_id").notNull(),
    username: text("username").notNull(),
    displayName: text("display_name"),
    profileUrl: text("profile_url"),
    avatarUrl: text("avatar_url"),
    verificationStatus: text("verification_status", {
      enum: ["CONNECTED", "VERIFIED", "DISCONNECTED", "SYNC_ERROR", "REAUTH_REQUIRED"],
    }).notNull().default("CONNECTED"),
    isOfficialOAuth: boolean("is_official_oauth").notNull().default(true),
    connectedAt: timestamp("connected_at", { withTimezone: true }).notNull().defaultNow(),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_social_accounts_platform_external").on(table.platform, table.externalAccountId),
    index("idx_social_accounts_user_id").on(table.userId),
  ]
);

export type SocialAccountRecord = typeof socialAccountsTable.$inferSelect;

