import {
  pgTable,
  text,
  serial,
  timestamp,
  boolean,
  integer,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const adminRolesTable = pgTable("admin_roles", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(), // 'super_admin' | 'operations_admin' | 'moderator' | 'support_admin' | 'analyst'
  name: text("name").notNull(),
  description: text("description"),
  isSystemRole: boolean("is_system_role").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AdminRole = typeof adminRolesTable.$inferSelect;
export type InsertAdminRole = typeof adminRolesTable.$inferInsert;

export const adminPermissionsTable = pgTable("admin_permissions", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(), // e.g. 'admin.dashboard.view', 'admin.users.suspend'
  module: text("module").notNull(), // 'dashboard' | 'users' | 'campaigns' | 'deals' | 'analytics' | 'moderation' | 'audit' | 'settings' | 'admins'
  description: text("description").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AdminPermission = typeof adminPermissionsTable.$inferSelect;
export type InsertAdminPermission = typeof adminPermissionsTable.$inferInsert;

export const adminRolePermissionsTable = pgTable(
  "admin_role_permissions",
  {
    id: serial("id").primaryKey(),
    roleId: integer("role_id")
      .notNull()
      .references(() => adminRolesTable.id, { onDelete: "cascade" }),
    permissionId: integer("permission_id")
      .notNull()
      .references(() => adminPermissionsTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_admin_role_perm_unique").on(table.roleId, table.permissionId),
    index("idx_admin_role_perm_role_id").on(table.roleId),
    index("idx_admin_role_perm_perm_id").on(table.permissionId),
  ]
);

export type AdminRolePermission = typeof adminRolePermissionsTable.$inferSelect;
export type InsertAdminRolePermission = typeof adminRolePermissionsTable.$inferInsert;

export const adminUsersTable = pgTable(
  "admin_users",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" })
      .unique(),
    roleId: integer("role_id")
      .notNull()
      .references(() => adminRolesTable.id, { onDelete: "restrict" }),
    isActive: boolean("is_active").notNull().default(true),
    assignedByUserId: text("assigned_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_admin_users_user_id").on(table.userId),
    index("idx_admin_users_role_id").on(table.roleId),
    index("idx_admin_users_is_active").on(table.isActive),
  ]
);

export type AdminUser = typeof adminUsersTable.$inferSelect;
export type InsertAdminUser = typeof adminUsersTable.$inferInsert;

export const adminAuditLogsTable = pgTable(
  "admin_audit_logs",
  {
    id: serial("id").primaryKey(),
    adminUserId: text("admin_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    action: text("action").notNull(), // 'USER_SUSPENDED', 'DEAL_INTERVENED', 'SETTINGS_UPDATED', etc.
    targetEntityType: text("target_entity_type").notNull(), // 'user' | 'campaign' | 'deal' | 'setting' | 'admin' | 'report'
    targetEntityId: text("target_entity_id").notNull(),
    reason: text("reason").notNull(),
    beforeState: jsonb("before_state"),
    afterState: jsonb("after_state"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    requestId: text("request_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_admin_audit_admin_id").on(table.adminUserId),
    index("idx_admin_audit_action").on(table.action),
    index("idx_admin_audit_target").on(table.targetEntityType, table.targetEntityId),
    index("idx_admin_audit_created_at").on(table.createdAt),
  ]
);

export type AdminAuditLog = typeof adminAuditLogsTable.$inferSelect;
export type InsertAdminAuditLog = typeof adminAuditLogsTable.$inferInsert;

export const platformActivityEventsTable = pgTable(
  "platform_activity_events",
  {
    id: serial("id").primaryKey(),
    actorUserId: text("actor_user_id").references(() => user.id, { onDelete: "set null" }),
    actorParty: text("actor_party"), // 'creator' | 'brand' | 'admin' | 'system'
    eventType: text("event_type").notNull(), // 'user.registered', 'onboarding.completed', 'deal.confirmed', etc.
    entityType: text("entity_type").notNull(), // 'user' | 'campaign' | 'deal' | 'application' | 'disbursement'
    entityId: text("entity_id").notNull(),
    summary: text("summary").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_activity_events_actor").on(table.actorUserId),
    index("idx_activity_events_type").on(table.eventType),
    index("idx_activity_events_entity").on(table.entityType, table.entityId),
    index("idx_activity_events_created_at").on(table.createdAt),
  ]
);

export type PlatformActivityEvent = typeof platformActivityEventsTable.$inferSelect;
export type InsertPlatformActivityEvent = typeof platformActivityEventsTable.$inferInsert;

export const moderationReportsTable = pgTable(
  "moderation_reports",
  {
    id: serial("id").primaryKey(),
    reporterUserId: text("reporter_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    targetType: text("target_type").notNull(), // 'user' | 'campaign' | 'deal' | 'content' | 'message'
    targetId: text("target_id").notNull(),
    category: text("category").notNull(), // 'fraud' | 'harassment' | 'breach_of_contract' | 'spam' | 'other'
    description: text("description").notNull(),
    status: text("status").notNull().default("open"), // 'open' | 'investigating' | 'resolved' | 'dismissed'
    resolutionNotes: text("resolution_notes"),
    assignedAdminUserId: text("assigned_admin_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_reports_status").on(table.status),
    index("idx_reports_target").on(table.targetType, table.targetId),
    index("idx_reports_reporter").on(table.reporterUserId),
    index("idx_reports_assigned_admin").on(table.assignedAdminUserId),
  ]
);

export type ModerationReport = typeof moderationReportsTable.$inferSelect;
export type InsertModerationReport = typeof moderationReportsTable.$inferInsert;

export const platformSettingsTable = pgTable(
  "platform_settings",
  {
    key: text("key").primaryKey(), // 'escrow.fee_percentage', 'marketplace.maintenance_mode', etc.
    value: text("value").notNull(),
    valueType: text("value_type").notNull().default("string"), // 'string' | 'number' | 'boolean' | 'json'
    description: text("description"),
    isEncrypted: boolean("is_encrypted").notNull().default(false),
    updatedByUserId: text("updated_by_user_id").references(() => user.id, { onDelete: "set null" }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_platform_settings_updated_at").on(table.updatedAt)]
);

export type PlatformSetting = typeof platformSettingsTable.$inferSelect;
export type InsertPlatformSetting = typeof platformSettingsTable.$inferInsert;
