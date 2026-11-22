import { db } from "../src/index";
import {
  adminRolesTable,
  adminPermissionsTable,
  adminRolePermissionsTable,
  platformSettingsTable,
} from "../src/schema/admin";
import { eq, and } from "drizzle-orm";

export const DEFAULT_ADMIN_ROLES = [
  {
    slug: "super_admin",
    name: "Super Admin",
    description: "Full root access across all platform entities, administrative governance, and security configurations.",
  },
  {
    slug: "operations_admin",
    name: "Operations Admin",
    description: "Marketplace operations: manage creators, brands, campaigns, applications, and commercial deal rooms.",
  },
  {
    slug: "moderator",
    name: "Moderator",
    description: "Abuse investigation, content moderation, report resolution, and temporary account restrictions.",
  },
  {
    slug: "support_admin",
    name: "Support Admin",
    description: "Customer support inspection: read users, verify onboarding stages, and investigate commercial timelines.",
  },
  {
    slug: "analyst",
    name: "Analyst",
    description: "Read-only business intelligence: marketplace health metrics, funnels, cohort activity, and reports.",
  },
];

export const DEFAULT_ADMIN_PERMISSIONS = [
  // Dashboard & Analytics
  { slug: "admin.dashboard.view", module: "dashboard", description: "View executive dashboard overview and telemetry." },
  { slug: "admin.analytics.view", module: "analytics", description: "View marketplace growth, engagement, and conversion metrics." },
  { slug: "admin.analytics.export", module: "analytics", description: "Export analytical datasets and platform reports." },

  // User Management
  { slug: "admin.users.view", module: "users", description: "View full user directory and detailed profile telemetry." },
  { slug: "admin.users.export", module: "users", description: "Export user lists and contact registries." },
  { slug: "admin.users.suspend", module: "users", description: "Suspend creator or brand workspace accounts." },
  { slug: "admin.users.reactivate", module: "users", description: "Reactivate suspended accounts." },
  { slug: "admin.users.notes.create", module: "users", description: "Add internal administrative notes on accounts." },

  // Onboarding
  { slug: "admin.onboarding.view", module: "onboarding", description: "Inspect creator and brand onboarding stages and drop-offs." },

  // Campaigns & Deals
  { slug: "admin.campaigns.view", module: "campaigns", description: "View global campaign briefs, budgets, and applicants." },
  { slug: "admin.campaigns.manage", module: "campaigns", description: "Moderate, pause, or cancel campaigns violating policies." },
  { slug: "admin.deals.view", module: "deals", description: "Inspect deal rooms, versioned terms, and milestone escrows." },
  { slug: "admin.deals.intervene", module: "deals", description: "Intervene or mediate in disputed or deadlocked commercial deals." },

  // Moderation & Reports
  { slug: "admin.reports.view", module: "moderation", description: "View user disputes, abuse reports, and platform flags." },
  { slug: "admin.reports.resolve", module: "moderation", description: "Investigate and resolve moderation reports." },

  // Security, Audit & Settings
  { slug: "admin.audit_logs.view", module: "audit", description: "Inspect immutable administrative security audit logs." },
  { slug: "admin.admins.manage", module: "admins", description: "Assign, modify, or revoke administrative roles." },
  { slug: "admin.settings.manage", module: "settings", description: "Update global platform configuration parameters." },
];

export const ROLE_PERMISSION_MATRIX: Record<string, string[]> = {
  super_admin: [
    "admin.dashboard.view",
    "admin.analytics.view",
    "admin.analytics.export",
    "admin.users.view",
    "admin.users.export",
    "admin.users.suspend",
    "admin.users.reactivate",
    "admin.users.notes.create",
    "admin.onboarding.view",
    "admin.campaigns.view",
    "admin.campaigns.manage",
    "admin.deals.view",
    "admin.deals.intervene",
    "admin.reports.view",
    "admin.reports.resolve",
    "admin.audit_logs.view",
    "admin.admins.manage",
    "admin.settings.manage",
  ],
  operations_admin: [
    "admin.dashboard.view",
    "admin.analytics.view",
    "admin.users.view",
    "admin.users.export",
    "admin.users.suspend",
    "admin.users.reactivate",
    "admin.users.notes.create",
    "admin.onboarding.view",
    "admin.campaigns.view",
    "admin.campaigns.manage",
    "admin.deals.view",
    "admin.deals.intervene",
    "admin.reports.view",
    "admin.reports.resolve",
  ],
  moderator: [
    "admin.dashboard.view",
    "admin.users.view",
    "admin.users.suspend",
    "admin.users.reactivate",
    "admin.users.notes.create",
    "admin.campaigns.view",
    "admin.deals.view",
    "admin.reports.view",
    "admin.reports.resolve",
  ],
  support_admin: [
    "admin.dashboard.view",
    "admin.users.view",
    "admin.users.notes.create",
    "admin.onboarding.view",
    "admin.campaigns.view",
    "admin.deals.view",
    "admin.reports.view",
  ],
  analyst: [
    "admin.dashboard.view",
    "admin.analytics.view",
    "admin.analytics.export",
    "admin.users.view",
    "admin.onboarding.view",
    "admin.campaigns.view",
    "admin.deals.view",
  ],
};

export async function seedAdminRBAC() {
  console.log("Seeding Admin Roles and Permissions...");

  const roleMap = new Map<string, number>();
  for (const roleDef of DEFAULT_ADMIN_ROLES) {
    const existing = await db
      .select()
      .from(adminRolesTable)
      .where(eq(adminRolesTable.slug, roleDef.slug))
      .limit(1);

    if (existing.length === 0) {
      const [inserted] = await db.insert(adminRolesTable).values(roleDef).returning();
      roleMap.set(roleDef.slug, inserted.id);
      console.log(`  + Created role: ${roleDef.name} (${roleDef.slug})`);
    } else {
      roleMap.set(roleDef.slug, existing[0].id);
    }
  }

  const permMap = new Map<string, number>();
  for (const permDef of DEFAULT_ADMIN_PERMISSIONS) {
    const existing = await db
      .select()
      .from(adminPermissionsTable)
      .where(eq(adminPermissionsTable.slug, permDef.slug))
      .limit(1);

    if (existing.length === 0) {
      const [inserted] = await db.insert(adminPermissionsTable).values(permDef).returning();
      permMap.set(permDef.slug, inserted.id);
      console.log(`  + Created permission: ${permDef.slug}`);
    } else {
      permMap.set(permDef.slug, existing[0].id);
    }
  }

  let boundCount = 0;
  for (const [roleSlug, permissions] of Object.entries(ROLE_PERMISSION_MATRIX)) {
    const roleId = roleMap.get(roleSlug);
    if (!roleId) continue;

    for (const permSlug of permissions) {
      const permId = permMap.get(permSlug);
      if (!permId) continue;

      const existingBinding = await db
        .select()
        .from(adminRolePermissionsTable)
        .where(
          and(
            eq(adminRolePermissionsTable.roleId, roleId),
            eq(adminRolePermissionsTable.permissionId, permId)
          )
        )
        .limit(1);

      if (existingBinding.length === 0) {
        await db
          .insert(adminRolePermissionsTable)
          .values({
            roleId,
            permissionId: permId,
          })
          .onConflictDoNothing();
        boundCount++;
      }
    }
  }

  console.log(`Seeded ${roleMap.size} roles, ${permMap.size} permissions, and ${boundCount} role-permission mappings.`);

  const DEFAULT_PLATFORM_SETTINGS = [
    { key: "escrow.fee_percentage", value: "5.0", valueType: "number", description: "Default platform service fee deducted upon bilateral deal payout release (percentage)." },
    { key: "marketplace.maintenance_mode", value: "false", valueType: "boolean", description: "Emergency toggle freezing new deal proposals and campaign creation." },
    { key: "creator.auto_verification", value: "false", valueType: "boolean", description: "Automatically verify creators who link verified Instagram and YouTube accounts." },
    { key: "security.require_email_verification", value: "false", valueType: "boolean", description: "Enforce email confirmation before participants can apply to commercial campaigns." },
    { key: "payout.minimum_threshold_paise", value: "100000", valueType: "number", description: "Minimum accumulated creator payout balance required for wire release (paise)." },
    { key: "deals.dispute_auto_freeze", value: "true", valueType: "boolean", description: "Instantly lock milestone disbursement when an active deal is marked disputed." },
  ];

  for (const setting of DEFAULT_PLATFORM_SETTINGS) {
    const existing = await db
      .select()
      .from(platformSettingsTable)
      .where(eq(platformSettingsTable.key, setting.key))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(platformSettingsTable).values(setting);
      console.log(`  + Seeded platform setting: ${setting.key}`);
    }
  }
}

seedAdminRBAC()
  .then(() => {
    console.log("RBAC seeding complete.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("RBAC seed failed:", err);
    process.exit(1);
  });
