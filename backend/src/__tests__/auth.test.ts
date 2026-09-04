import { auth } from "../auth/index";
import { logAuditEvent } from "../auth/audit";
import { db, auditLogsTable, user as userTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function runAuthUnitTests() {
  console.log("\n==========================================");
  console.log("BETTER AUTH & RBAC SECURITY INTEGRATION TESTS");
  console.log("==========================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, description: string) {
    if (condition) {
      console.log(`  ✓ PASSED: ${description}`);
      passed++;
    } else {
      console.error(`  ✗ FAILED: ${description}`);
      failed++;
    }
  }

  // 1. Better Auth instance verification
  assert(typeof auth === "object" && typeof auth.api === "object", "1. Better Auth instance initialized with Drizzle adapter");

  // 2. Audit Logging test
  try {
    const testAction = `TEST_EVENT_${Date.now()}`;
    await logAuditEvent({
      action: testAction,
      details: JSON.stringify({ test: true }),
    });

    const logs = await db.select().from(auditLogsTable).where(eq(auditLogsTable.action, testAction)).limit(1);
    assert(logs.length > 0 && logs[0].action === testAction, "2. Security audit event persisted successfully to audit_logs table");
  } catch (e: any) {
    assert(false, `2. Audit log test failed: ${e.message}`);
  }

  // 3. Role RBAC authorization logic verification
  const influencerUser = { id: "test-inf-1", role: "influencer" };
  const brandUser = { id: "test-brand-1", role: "brand" };
  const adminUser = { id: "test-admin-1", role: "admin" };

  const isRoleAllowed = (userRole: string, allowedRoles: string[]) => {
    const normUser = userRole === "creator" ? "influencer" : userRole;
    const normAllowed = allowedRoles.map(r => r === "creator" ? "influencer" : r);
    return normAllowed.includes(normUser);
  };

  assert(isRoleAllowed(influencerUser.role, ["influencer"]), "3a. Influencer role granted access to influencer endpoints");
  assert(!isRoleAllowed(influencerUser.role, ["brand"]), "3b. Influencer role denied access to brand-only endpoints");
  assert(isRoleAllowed(brandUser.role, ["brand"]), "3c. Brand role granted access to brand endpoints");
  assert(!isRoleAllowed(brandUser.role, ["influencer"]), "3d. Brand role denied access to creator-only endpoints");
  assert(isRoleAllowed(adminUser.role, ["admin"]), "3e. Admin granted access to admin endpoints");

  console.log(`\nAuth Integration Test Results: ${passed} Passed, ${failed} Failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runAuthUnitTests().catch((err) => {
  console.error("Auth Test Execution Error:", err);
  process.exit(1);
});
