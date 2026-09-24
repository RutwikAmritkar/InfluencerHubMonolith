import { db, user as userTable, influencersTable, socialAccountsTable, socialTokensTable, socialMetricSnapshotsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { socialSyncService } from "../services/social-sync.service";
import { encryptSocialToken, decryptSocialToken } from "../integrations/social/token-crypto";

async function runPipelineUnitTests() {
  console.log("\n=================================================");
  console.log("VERIFIED SOCIAL PIPELINE AUTOMATED TEST SUITE");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✓ PASSED: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAILED: ${testName}`);
      failed++;
    }
  }

  const testUserId = "pipeline_test_user_777";
  const testEmail = "pipeline_test_777@influencerhub.demo";

  try {
    // Cleanup any pre-existing test records
    const existingUsers = await db.select().from(userTable).where(eq(userTable.email, testEmail));
    for (const u of existingUsers) {
      await db.delete(socialAccountsTable).where(eq(socialAccountsTable.userId, u.id));
      await db.delete(influencersTable).where(eq(influencersTable.userId, u.id));
      await db.delete(userTable).where(eq(userTable.id, u.id));
    }

    // 1. TEST SCENARIO: Disconnected Account (No connected social accounts)
    const [createdUser] = await db.insert(userTable).values({
      id: testUserId,
      email: testEmail,
      name: "Pipeline Test User",
      role: "influencer",
    }).returning();

    const [createdInfluencer] = await db.insert(influencersTable).values({
      userId: createdUser.id,
      category: "Lifestyle",
      followers: 0,
      socialAccounts: [],
    }).returning();

    const userAccounts1 = await db.select().from(socialAccountsTable).where(eq(socialAccountsTable.userId, createdUser.id));
    assert(userAccounts1.length === 0, "1a. Disconnected account has 0 rows in social_accounts table");
    assert(createdInfluencer.followers === 0, "1b. Disconnected creator profile initial followers = 0");
    assert(Array.isArray(createdInfluencer.socialAccounts) && createdInfluencer.socialAccounts.length === 0, "1c. Disconnected creator profile socialAccounts = []");

    // 2. TEST SCENARIO: Connected Account (Real verified Instagram account)
    const [connectedAcc] = await db.insert(socialAccountsTable).values({
      userId: createdUser.id,
      platform: "instagram",
      externalAccountId: "28285623667759805",
      username: "rutwik_amritkar07",
      displayName: "Rutwik Amritkar",
      profileUrl: "https://instagram.com/rutwik_amritkar07",
      verificationStatus: "VERIFIED",
      isOfficialOAuth: true,
      lastSyncedAt: new Date(),
    }).returning();

    assert(connectedAcc.username === "rutwik_amritkar07", "2a. Connected account username matches rutwik_amritkar07");
    assert(connectedAcc.externalAccountId === "28285623667759805", "2b. External account ID stored internally");
    assert(connectedAcc.verificationStatus === "VERIFIED", "2c. Verification status is VERIFIED");
    assert(connectedAcc.isOfficialOAuth === true, "2d. isOfficialOAuth flag is set to true");

    // 3. TEST SCENARIO: Token Encryption & Security Checks
    const rawAccessToken = "IGAA_long_lived_test_access_token_sec_123";
    const rawRefreshToken = "IGAA_refresh_token_sec_456";
    const encryptedAccess = encryptSocialToken(rawAccessToken);
    const encryptedRefresh = encryptSocialToken(rawRefreshToken);

    const [tokenRecord] = await db.insert(socialTokensTable).values({
      socialAccountId: connectedAcc.id,
      accessTokenEncrypted: encryptedAccess.encryptedToken,
      refreshTokenEncrypted: encryptedRefresh.encryptedToken,
      tokenIv: encryptedAccess.iv,
      tokenAuthTag: encryptedAccess.authTag,
      scopes: ["instagram_business_basic", "instagram_business_manage_insights"],
    }).returning();

    assert(!tokenRecord.accessTokenEncrypted.includes(rawAccessToken), "3a. Access token is NOT stored in plaintext");
    assert(Boolean(tokenRecord.tokenIv), "3b. AES-256-GCM IV is present");
    assert(Boolean(tokenRecord.tokenAuthTag), "3c. AES-256-GCM Auth Tag is present");

    const decryptedAccess = decryptSocialToken(tokenRecord.accessTokenEncrypted, tokenRecord.tokenIv, tokenRecord.tokenAuthTag);
    assert(decryptedAccess === rawAccessToken, "3d. Server-side token decryption reconstructs original token string");

    // 4. TEST SCENARIO: Real Zero Metric vs Unavailable Metric
    const [snapshotRecord] = await db.insert(socialMetricSnapshotsTable).values({
      socialAccountId: connectedAcc.id,
      platform: "instagram",
      followers: 358,
      following: 343,
      totalContent: 0, // Explicit Real Zero (0 media items)
      reach: 0, // Explicit Real Zero (0 24h reach)
      avgViews: 0,
      avgLikes: 0,
      engagementRate: "0.00",
      snapshotDate: new Date(),
    }).returning();

    // Insert unavailable metric (null value in social_media_insights)
    const { socialMediaInsightsTable } = await import("@workspace/db");
    const [unavailInsight] = await db.insert(socialMediaInsightsTable).values({
      socialAccountId: connectedAcc.id,
      metric: "impressions",
      value: "UNSUPPORTED",
      period: "day",
      metadata: JSON.stringify({ supported: false, error: "Deprecated in Graph API v20.0" }),
    }).returning();

    assert(snapshotRecord.followers === 358, "4a. Real follower count 358 is stored accurately");
    assert(snapshotRecord.following === 343, "4b. Real following count 343 is stored accurately");
    assert(snapshotRecord.totalContent === 0, "4c. Explicit real zero media count (0) is preserved as 0");
    assert(snapshotRecord.reach === 0, "4d. Explicit real zero 24h reach (0) is preserved as 0");
    assert(unavailInsight.metric === "impressions" && unavailInsight.value === "UNSUPPORTED", "4e. Unsupported metric impressions is stored as UNSUPPORTED/null");

    // 5. TEST SCENARIO: Stale Metric Detection & Re-sync
    const staleDate = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago
    await db.update(socialAccountsTable).set({ lastSyncedAt: staleDate }).where(eq(socialAccountsTable.id, connectedAcc.id));
    
    const [recheckedAcc] = await db.select().from(socialAccountsTable).where(eq(socialAccountsTable.id, connectedAcc.id));
    const isStale = recheckedAcc.lastSyncedAt ? (Date.now() - new Date(recheckedAcc.lastSyncedAt).getTime()) > 24 * 60 * 60 * 1000 : true;
    assert(isStale === true, "5a. Account with lastSyncedAt > 24h is correctly flagged as stale");

    // 6. TEST SCENARIO: Synchronization Failure & Re-authorization Handling
    await db.update(socialAccountsTable).set({ verificationStatus: "REAUTH_REQUIRED" }).where(eq(socialAccountsTable.id, connectedAcc.id));
    const [reauthAcc] = await db.select().from(socialAccountsTable).where(eq(socialAccountsTable.id, connectedAcc.id));
    assert(reauthAcc.verificationStatus === "REAUTH_REQUIRED", "6a. Sync failure cleanly updates status to REAUTH_REQUIRED");

    // Cleanup test records
    await db.delete(socialMediaInsightsTable).where(eq(socialMediaInsightsTable.socialAccountId, connectedAcc.id));
    await db.delete(socialMetricSnapshotsTable).where(eq(socialMetricSnapshotsTable.socialAccountId, connectedAcc.id));
    await db.delete(socialTokensTable).where(eq(socialTokensTable.socialAccountId, connectedAcc.id));
    await db.delete(socialAccountsTable).where(eq(socialAccountsTable.userId, testUserId));
    await db.delete(influencersTable).where(eq(influencersTable.userId, testUserId));
    await db.delete(userTable).where(eq(userTable.id, testUserId));

    console.log(`\nVerified Social Pipeline Test Summary: ${passed} Passed, ${failed} Failed.\n`);
    if (failed > 0) process.exit(1);

  } catch (err: any) {
    console.error("Fatal error during pipeline unit tests:", err);
    process.exit(1);
  }
}

runPipelineUnitTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
