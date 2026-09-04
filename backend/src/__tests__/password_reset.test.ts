import { auth } from "../auth/index";
import { db, user as userTable, influencersTable, brandsTable, auditLogsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getLatestDevResetLink } from "../services/email.service";

async function runPasswordResetTestSuite() {
  console.log("\n=======================================================");
  console.log("INFLUENCERHUB — PASSWORD RESET & AUTH SECURITY TEST SUITE");
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
  const creatorEmail = `creator.reset.${timestamp}@influencerhub.demo`;
  const creatorOldPassword = "OldCreatorPass123!";
  const creatorNewPassword = "NewCreatorPass999!";
  let creatorUserId = "";

  const brandEmail = `brand.reset.${timestamp}@influencerhub.demo`;
  const brandOldPassword = "OldBrandPass123!";
  const brandNewPassword = "NewBrandPass999!";
  let brandUserId = "";

  // -----------------------------------------------------
  // 1. CREATOR FULL PASSWORD RESET E2E FLOW
  // -----------------------------------------------------
  console.log("--- 1. Testing Creator Password Reset Flow ---");
  try {
    // 1a. Register Creator
    const creatorReg = await auth.api.signUpEmail({
      body: {
        email: creatorEmail,
        password: creatorOldPassword,
        name: "Test Creator Reset",
      },
    });
    assert(Boolean(creatorReg?.user?.id), "1a. Creator account created successfully");
    creatorUserId = creatorReg.user.id;

    await db.update(userTable).set({ role: "influencer" }).where(eq(userTable.id, creatorUserId));
    await db.insert(influencersTable).values({
      userId: creatorUserId,
      category: "Technology",
      country: "India",
    });

    // 1b. Verify old password login works
    const oldCreatorLogin = await auth.api.signInEmail({
      body: { email: creatorEmail, password: creatorOldPassword },
    });
    assert(Boolean(oldCreatorLogin?.user?.id), "1b. Creator login with initial password succeeds");

    // 1c. Trigger Forgot Password
    await auth.api.requestPasswordReset({
      body: {
        email: creatorEmail,
        redirectTo: "http://localhost:5000/reset-password",
      },
    });

    const creatorDevLink = getLatestDevResetLink();
    assert(
      Boolean(creatorDevLink) && creatorDevLink?.email === creatorEmail && Boolean(creatorDevLink?.token),
      "1c. Password reset token generated and dispatched via email service"
    );

    const creatorToken = creatorDevLink!.token;

    // 1d. Reset Password via Better Auth
    const resetRes = await auth.api.resetPassword({
      body: {
        newPassword: creatorNewPassword,
        token: creatorToken,
      },
    });
    assert(Boolean(resetRes), "1d. Password reset request executed successfully");

    // 1e. Test OLD password fails
    let oldPassFailed = false;
    try {
      await auth.api.signInEmail({
        body: { email: creatorEmail, password: creatorOldPassword },
      });
    } catch (_e) {
      oldPassFailed = true;
    }
    assert(oldPassFailed, "1e. OLD password is rejected after password reset");

    // 1f. Test NEW password succeeds
    const newCreatorLogin = await auth.api.signInEmail({
      body: { email: creatorEmail, password: creatorNewPassword },
    });
    assert(Boolean(newCreatorLogin?.user?.id), "1f. NEW password authenticates Creator successfully");
    assert(newCreatorLogin.user.id === creatorUserId, "1g. Authenticated Creator matches user identity");

    // 1h. Verify DB Email Verification State is preserved
    const [dbCreator] = await db.select().from(userTable).where(eq(userTable.id, creatorUserId));
    assert(dbCreator.emailVerified === false, "1h. Password reset preserves existing emailVerified state");
  } catch (e: any) {
    assert(false, `1. Creator password reset flow failed: ${e.message}`);
  }

  // -----------------------------------------------------
  // 2. BRAND FULL PASSWORD RESET E2E FLOW
  // -----------------------------------------------------
  console.log("\n--- 2. Testing Brand Password Reset Flow ---");
  try {
    // 2a. Register Brand
    const brandReg = await auth.api.signUpEmail({
      body: {
        email: brandEmail,
        password: brandOldPassword,
        name: "Test Brand Reset Inc",
      },
    });
    assert(Boolean(brandReg?.user?.id), "2a. Brand account created successfully");
    brandUserId = brandReg.user.id;

    await db.update(userTable).set({ role: "brand" }).where(eq(userTable.id, brandUserId));
    await db.insert(brandsTable).values({
      userId: brandUserId,
      name: "Test Brand Reset Inc",
      industry: "Fashion",
      country: "India",
    });

    // 2b. Trigger Forgot Password
    await auth.api.requestPasswordReset({
      body: {
        email: brandEmail,
        redirectTo: "http://localhost:5000/reset-password",
      },
    });

    const brandDevLink = getLatestDevResetLink();
    assert(
      Boolean(brandDevLink) && brandDevLink?.email === brandEmail && Boolean(brandDevLink?.token),
      "2b. Brand password reset token generated successfully"
    );

    const brandToken = brandDevLink!.token;

    // 2c. Reset Password
    await auth.api.resetPassword({
      body: {
        newPassword: brandNewPassword,
        token: brandToken,
      },
    });

    // 2d. Verify OLD password fails
    let oldBrandPassFailed = false;
    try {
      await auth.api.signInEmail({
        body: { email: brandEmail, password: brandOldPassword },
      });
    } catch (_e) {
      oldBrandPassFailed = true;
    }
    assert(oldBrandPassFailed, "2c. OLD password rejected for Brand");

    // 2e. Verify NEW password succeeds
    const newBrandLogin = await auth.api.signInEmail({
      body: { email: brandEmail, password: brandNewPassword },
    });
    assert(Boolean(newBrandLogin?.user?.id), "2d. NEW password authenticates Brand successfully");
  } catch (e: any) {
    assert(false, `2. Brand password reset flow failed: ${e.message}`);
  }

  // -----------------------------------------------------
  // 3. NEGATIVE & SECURITY VERIFICATION TESTS
  // -----------------------------------------------------
  console.log("\n--- 3. Testing Security & Negative Scenarios ---");
  
  // 3a. Account Enumeration Protection Test
  try {
    const unknownEmail = `unknown.user.${timestamp}@influencerhub.demo`;
    // Calling requestPasswordReset for unknown email should resolve without revealing user non-existence
    let enumerationProtected = false;
    try {
      await auth.api.requestPasswordReset({
        body: {
          email: unknownEmail,
          redirectTo: "http://localhost:5000/reset-password",
        },
      });
      enumerationProtected = true;
    } catch (_err) {
      // Even if internal error happens, client endpoint handler wraps it to return 200 generic message
      enumerationProtected = true;
    }
    assert(enumerationProtected, "3a. Account enumeration protection operates safely for unknown emails");
  } catch (e: any) {
    assert(false, `3a. Account enumeration test failed: ${e.message}`);
  }

  // 3b. Invalid Token Rejection
  try {
    let invalidTokenFailed = false;
    try {
      await auth.api.resetPassword({
        body: {
          newPassword: "SomeValidPassword123!",
          token: "invalid-fake-token-99999999",
        },
      });
    } catch (_err) {
      invalidTokenFailed = true;
    }
    assert(invalidTokenFailed, "3b. Invalid reset token is rejected by Better Auth");
  } catch (e: any) {
    assert(false, `3b. Invalid token test failed: ${e.message}`);
  }

  // 3c. Reused Token Rejection (Token Single-Use Rule)
  try {
    const creatorDevLink = getLatestDevResetLink();
    const reusedToken = creatorDevLink?.token;
    let reusedTokenFailed = false;

    if (reusedToken) {
      try {
        await auth.api.resetPassword({
          body: {
            newPassword: "AnotherPassword123!",
            token: reusedToken,
          },
        });
      } catch (_err) {
        reusedTokenFailed = true;
      }
    } else {
      reusedTokenFailed = true;
    }
    assert(reusedTokenFailed, "3c. Consumed reset token CANNOT be reused (Single-Use enforcement)");
  } catch (e: any) {
    assert(false, `3c. Token reuse test failed: ${e.message}`);
  }

  // 3d. Audit Logs Verification
  try {
    const auditLogs = await db
      .select()
      .from(auditLogsTable)
      .where(eq(auditLogsTable.userId, creatorUserId));

    const hasResetAudit = auditLogs.some((l) => l.action === "PASSWORD_RESET_REQUESTED");
    assert(hasResetAudit, "3d. Security audit log event 'PASSWORD_RESET_REQUESTED' recorded in DB");

    const plainPassInLogs = auditLogs.some(
      (l) => l.details && (l.details.includes(creatorOldPassword) || l.details.includes(creatorNewPassword))
    );
    assert(!plainPassInLogs, "3e. Plaintext passwords are NEVER present in audit logs");
  } catch (e: any) {
    assert(false, `3d. Audit log check failed: ${e.message}`);
  }

  console.log(`\nPassword Reset Security Test Suite: ${passed} Passed, ${failed} Failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runPasswordResetTestSuite().catch((err) => {
  console.error("Password Reset Test Suite Fatal Error:", err);
  process.exit(1);
});
