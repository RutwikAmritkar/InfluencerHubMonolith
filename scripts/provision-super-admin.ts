import { db } from "../database/src/index";
import { user } from "../database/src/schema/auth-schema";
import {
  adminRolesTable,
  adminUsersTable,
  adminAuditLogsTable,
} from "../database/src/schema/admin";
import { eq } from "drizzle-orm";

// Parse CLI flag --email <email> or INITIAL_SUPER_ADMIN_EMAIL
function getTargetEmail(): string {
  const args = process.argv.slice(2);
  const emailFlagIdx = args.findIndex((arg) => arg === "--email" || arg === "-e");
  if (emailFlagIdx !== -1 && args[emailFlagIdx + 1]) {
    return args[emailFlagIdx + 1].trim().toLowerCase();
  }
  const envEmail = process.env.INITIAL_SUPER_ADMIN_EMAIL;
  if (envEmail && envEmail.trim() !== "") {
    return envEmail.trim().toLowerCase();
  }
  console.error("❌ Error: Target email required.");
  console.error("Usage: pnpm provision:admin --email user@example.com");
  console.error("   OR: INITIAL_SUPER_ADMIN_EMAIL=user@example.com pnpm provision:admin");
  process.exit(1);
}

async function provisionSuperAdmin() {
  const targetEmail = getTargetEmail();
  console.log(`Searching for account: ${targetEmail}`);

  const users = await db
    .select({ id: user.id, email: user.email, name: user.name, role: user.role })
    .from(user)
    .where(eq(user.email, targetEmail))
    .limit(1);

  if (users.length === 0) {
    console.error(`User '${targetEmail}' was not found in the platform database.`);
    console.error("Please register the user first, then re-run this provisioning command.");
    process.exit(1);
  }

  const targetUser = users[0];
  console.log(`Found user: ${targetUser.name} (${targetUser.id}, marketplace role: ${targetUser.role})`);

  const roles = await db
    .select()
    .from(adminRolesTable)
    .where(eq(adminRolesTable.slug, "super_admin"))
    .limit(1);

  if (roles.length === 0) {
    console.error("'super_admin' role not found in admin_roles. Run db:seed:admin first.");
    process.exit(1);
  }

  const superAdminRole = roles[0];

  const existingAdmin = await db
    .select()
    .from(adminUsersTable)
    .where(eq(adminUsersTable.userId, targetUser.id))
    .limit(1);

  let adminUserId: number;

  if (existingAdmin.length > 0) {
    const adminRecord = existingAdmin[0];
    if (adminRecord.roleId === superAdminRole.id && adminRecord.isActive) {
      console.log(`User '${targetEmail}' is already an active Super Admin.`);
      process.exit(0);
    }

    const [updated] = await db
      .update(adminUsersTable)
      .set({
        roleId: superAdminRole.id,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(adminUsersTable.id, adminRecord.id))
      .returning();

    adminUserId = updated.id;
    console.log(`Upgraded existing admin record to Super Admin (admin_user ID: ${adminUserId}).`);
  } else {
    const [inserted] = await db
      .insert(adminUsersTable)
      .values({
        userId: targetUser.id,
        roleId: superAdminRole.id,
        isActive: true,
      })
      .returning();

    adminUserId = inserted.id;
    console.log(`Provisioned as Super Admin (admin_user ID: ${adminUserId}).`);
  }

  await db.insert(adminAuditLogsTable).values({
    adminUserId: targetUser.id,
    action: "SYSTEM_PROVISION_INITIAL_SUPER_ADMIN",
    targetEntityType: "user",
    targetEntityId: targetUser.id,
    reason: "Initial Super Admin provisioned via secure CLI script",
    beforeState: existingAdmin[0] ? { roleId: existingAdmin[0].roleId, isActive: existingAdmin[0].isActive } : null,
    afterState: { roleId: superAdminRole.id, roleSlug: "super_admin", isActive: true },
    ipAddress: "127.0.0.1",
    userAgent: "CLI/ProvisionSuperAdmin",
  });

  console.log(`Recorded audit trail entry.`);
  console.log(`Provisioning complete. User '${targetEmail}' now has full Super Admin privileges.`);
}

provisionSuperAdmin()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Provisioning failed:", err);
    process.exit(1);
  });
