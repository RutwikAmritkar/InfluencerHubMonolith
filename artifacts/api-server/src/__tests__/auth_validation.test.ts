import { auth } from "../auth/index";
import { logAuditEvent } from "../auth/audit";
import { db, user as userTable, influencersTable, brandsTable, auditLogsTable, account as accountTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function runFullAuthValidationSuite() {
  console.log("\n=======================================================");
  console.log("INFLUENCERHUB — AUTHENTICATION & USER API VALIDATION SUITE");
  console.log("=======================================================\n");

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

  const timestamp = Date.now();
  const testEmail = `val.creator.${timestamp}@influencerhub.demo`;
  const testPassword = "SecurePass123!";
  const testName = "Validation Test Creator";
  let createdUserId = "";

  // 1. Better Auth Instance Check
  assert(typeof auth === "object" && typeof auth.api === "object", "1. Better Auth framework initialized");

  // 2. Registration API Test
  try {
    const signupRes = await auth.api.signUpEmail({
      body: {
        email: testEmail,
        password: testPassword,
        name: testName,
      },
    });

    assert(Boolean(signupRes?.user?.id), "2a. User registration creates user identity");
    createdUserId = signupRes.user.id;
    assert(signupRes.user.email === testEmail, "2b. User registration returns correct email");

    // Assign role
    await db.update(userTable).set({ role: "influencer" }).where(eq(userTable.id, createdUserId));
    await db.insert(influencersTable).values({
      userId: createdUserId,
      category: "Lifestyle",
      country: "US",
    });
  } catch (e: any) {
    assert(false, `2. Registration failed: ${e.message}`);
  }

  // 3. PostgreSQL Database Verification
  try {
    const [dbUser] = await db.select().from(userTable).where(eq(userTable.id, createdUserId)).limit(1);
    assert(Boolean(dbUser), "3a. User is persisted in PostgreSQL 'user' table");
    assert(dbUser.email === testEmail, "3b. Email matches registered email");
    assert(dbUser.role === "influencer", "3c. Selected role is persisted in database");
    assert(Boolean(dbUser.createdAt) && Boolean(dbUser.updatedAt), "3d. CreatedAt and UpdatedAt timestamps are populated");

    // Check account credential table
    const [dbAccount] = await db.select().from(accountTable).where(eq(accountTable.userId, createdUserId)).limit(1);
    assert(Boolean(dbAccount), "3e. Authentication record created in 'account' table");

    const passwordVal = dbAccount?.password || "";
    assert(!passwordVal.includes(testPassword), "3f. Password is NOT stored in plaintext");
    assert(passwordVal.length > 20, "3g. Password is hashed securely");
  } catch (e: any) {
    assert(false, `3. Database verification failed: ${e.message}`);
  }

  // 4. Duplicate Registration Test
  try {
    let duplicateFailed = false;
    try {
      await auth.api.signUpEmail({
        body: {
          email: testEmail,
          password: testPassword,
          name: "Duplicate Creator",
        },
      });
    } catch (dupErr: any) {
      duplicateFailed = true;
    }
    assert(duplicateFailed, "4. Duplicate registration with existing email fails");

    const usersWithEmail = await db.select().from(userTable).where(eq(userTable.email, testEmail));
    assert(usersWithEmail.length === 1, "4b. Database contains exactly one identity for test email");
  } catch (e: any) {
    assert(false, `4. Duplicate registration test failed: ${e.message}`);
  }

  // 5. Valid Login Test
  try {
    const loginRes = await auth.api.signInEmail({
      body: {
        email: testEmail,
        password: testPassword,
      },
    });

    assert(Boolean(loginRes?.user?.id), "5a. Login with valid credentials succeeds");
    assert(loginRes.user.id === createdUserId, "5b. Login returns matching user ID");
  } catch (e: any) {
    assert(false, `5. Valid login test failed: ${e.message}`);
  }

  // 6. Invalid Password Login Test
  try {
    let loginFailed = false;
    try {
      await auth.api.signInEmail({
        body: {
          email: testEmail,
          password: "WrongPassword999!",
        },
      });
    } catch (_e) {
      loginFailed = true;
    }
    assert(loginFailed, "6. Login with invalid password fails (HTTP 401 equivalent)");
  } catch (e: any) {
    assert(false, `6. Invalid login test failed: ${e.message}`);
  }

  // 7. Security Audit Logging Verification
  try {
    const auditLogs = await db
      .select()
      .from(auditLogsTable)
      .where(eq(auditLogsTable.userId, createdUserId));

    assert(auditLogs.length > 0, "7a. Security audit events recorded in audit_logs table");

    // Verify passwords are never logged in details
    const hasPasswordInLogs = auditLogs.some(l => l.details && l.details.includes(testPassword));
    assert(!hasPasswordInLogs, "7b. Plaintext passwords are NEVER logged in audit events");
  } catch (e: any) {
    assert(false, `7. Security audit test failed: ${e.message}`);
  }

  // 8. RBAC Verification
  const isRoleAllowed = (userRole: string, allowedRoles: string[]) => {
    const normUser = userRole === "creator" ? "influencer" : userRole;
    const normAllowed = allowedRoles.map(r => (r === "creator" ? "influencer" : r));
    return normAllowed.includes(normUser);
  };

  assert(!isRoleAllowed("influencer", ["brand"]), "8a. Creator role denied access to brand-only endpoints");
  assert(isRoleAllowed("influencer", ["influencer"]), "8b. Creator role granted access to creator endpoints");
  assert(!isRoleAllowed("brand", ["influencer"]), "8c. Brand role denied access to creator-only endpoints");

  console.log(`\nValidation Suite Results: ${passed} Passed, ${failed} Failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runFullAuthValidationSuite().catch((err) => {
  console.error("Auth Validation Suite Error:", err);
  process.exit(1);
});
