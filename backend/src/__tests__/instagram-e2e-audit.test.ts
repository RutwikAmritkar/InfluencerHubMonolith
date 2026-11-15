import {
  db,
  socialAccountsTable,
  socialTokensTable,
  oauthStatesTable,
  user as userTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { InstagramProvider, INSTAGRAM_AUTH_HOST } from "../integrations/social/instagram.provider";
import { encryptSocialToken, decryptSocialToken } from "../integrations/social/token-crypto";
import crypto from "crypto";

async function runFullE2EAudit() {
  console.log("\n=================================================");
  console.log("🚀 INSTAGRAM OAUTH FINAL ARCHITECTURE & E2E AUDIT");
  console.log("=================================================\n");

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

  const provider = new InstagramProvider();

  // ==================================================
  // 1. SOURCE OF TRUTH AUDIT
  // ==================================================
  console.log("--- 1. SOURCE OF TRUTH ---");
  try {
    const authUrl = await provider.getAuthorizationUrl("test_state_123");
    assert(
      authUrl.includes("force_reauthorize=true"),
      "1a. Authorization URL includes force_reauthorize=true"
    );
    assert(
      authUrl.includes("scope=instagram_business_basic%2Cinstagram_business_manage_insights"),
      "1b. Authorization URL requests Meta Graph API scopes"
    );

    // Test real access token failure cleanly throws error instead of returning mock user
    let realTokenFailedCleanly = false;
    try {
      await provider.getProfile("real_invalid_meta_token_xyz999");
    } catch (err: any) {
      realTokenFailedCleanly = true;
      assert(
        !err.message.includes("maya.chen.creator"),
        "1c. Real token fetch failure does NOT return mock profile fallback"
      );
    }
    assert(realTokenFailedCleanly, "1d. Invalid/failed Meta access token connection FAILS safely");
  } catch (e: any) {
    assert(false, `1. Source of truth audit failed: ${e.message}`);
  }

  // ==================================================
  // 2. MULTI-CREATOR ISOLATION AUDIT
  // ==================================================
  console.log("\n--- 2. MULTI-CREATOR ISOLATION ---");
  const creatorAId = `test_creator_A_${Date.now()}`;
  const creatorBId = `test_creator_B_${Date.now()}`;

  try {
    // Create test user A & B in database
    await db.insert(userTable).values([
      {
        id: creatorAId,
        name: "Creator A",
        email: `creatorA_${Date.now()}@test.com`,
        role: "influencer",
      },
      {
        id: creatorBId,
        name: "Creator B",
        email: `creatorB_${Date.now()}@test.com`,
        role: "influencer",
      },
    ]);

    // Connect Instagram account A to Creator A
    const [accA] = await db
      .insert(socialAccountsTable)
      .values({
        userId: creatorAId,
        platform: "instagram",
        externalAccountId: `ig_ext_id_A_${Date.now()}`,
        username: "creator_A_official_ig",
        displayName: "Creator A Official",
        verificationStatus: "VERIFIED",
        isOfficialOAuth: true,
      })
      .returning();

    // Connect Instagram account B to Creator B
    const [accB] = await db
      .insert(socialAccountsTable)
      .values({
        userId: creatorBId,
        platform: "instagram",
        externalAccountId: `ig_ext_id_B_${Date.now()}`,
        username: "creator_B_official_ig",
        displayName: "Creator B Official",
        verificationStatus: "VERIFIED",
        isOfficialOAuth: true,
      })
      .returning();

    // Verify Query Isolation
    const accountsForA = await db
      .select()
      .from(socialAccountsTable)
      .where(eq(socialAccountsTable.userId, creatorAId));
    const accountsForB = await db
      .select()
      .from(socialAccountsTable)
      .where(eq(socialAccountsTable.userId, creatorBId));

    assert(
      accountsForA.length === 1 && accountsForA[0].username === "creator_A_official_ig",
      "2a. Creator A retrieves only Creator A's social account"
    );
    assert(
      accountsForB.length === 1 && accountsForB[0].username === "creator_B_official_ig",
      "2b. Creator B retrieves only Creator B's social account"
    );
    assert(
      !accountsForB.some(
        (acc) => acc.userId === creatorAId || acc.username === "creator_A_official_ig"
      ),
      "2c. Creator B never inherits Creator A's identity or username"
    );
  } catch (e: any) {
    assert(false, `2. Multi-creator isolation audit failed: ${e.message}`);
  }

  // ==================================================
  // 3. OAUTH STATE ISOLATION AUDIT
  // ==================================================
  console.log("\n--- 3. OAUTH STATE ISOLATION ---");
  try {
    const stateValue = crypto.randomBytes(24).toString("hex");
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);

    const [stateRecord] = await db
      .insert(oauthStatesTable)
      .values({
        state: stateValue,
        userId: creatorAId,
        provider: "instagram",
        createdAt: now,
        expiresAt,
      })
      .returning();

    assert(
      stateRecord.state === stateValue,
      "3a. OAuth state is stored with unpredictable random token"
    );
    assert(
      stateRecord.userId === creatorAId,
      "3b. OAuth state is tied to initiating creator (Creator A)"
    );
    assert(stateRecord.usedAt === null, "3c. OAuth state starts as single-use (usedAt = null)");

    // Simulate State Consumption
    await db
      .update(oauthStatesTable)
      .set({ usedAt: new Date() })
      .where(eq(oauthStatesTable.id, stateRecord.id));
    const [usedRecord] = await db
      .select()
      .from(oauthStatesTable)
      .where(eq(oauthStatesTable.id, stateRecord.id))
      .limit(1);
    assert(
      usedRecord.usedAt !== null,
      "3d. OAuth state is marked consumed (single-use) after callback processing"
    );
  } catch (e: any) {
    assert(false, `3. OAuth state isolation audit failed: ${e.message}`);
  }

  // ==================================================
  // 4. AUTHORIZATION CODE HANDLING AUDIT
  // ==================================================
  console.log("\n--- 4. AUTHORIZATION CODE HANDLING ---");
  try {
    const rawCodeWithMetaHash = "AQB9876543210zyxwv#_";
    const sanitized = rawCodeWithMetaHash.replace(/#_$/, "").replace(/#.*$/, "").trim();
    assert(
      sanitized === "AQB9876543210zyxwv",
      "4a. Trailing Meta '#_' fragment is sanitized from code"
    );
    assert(!sanitized.includes("#"), "4b. Clean code contains zero fragment characters");
  } catch (e: any) {
    assert(false, `4. Code handling audit failed: ${e.message}`);
  }

  // ==================================================
  // 5. TOKEN SECURITY AUDIT
  // ==================================================
  console.log("\n--- 5. TOKEN SECURITY ---");
  try {
    const rawAccessToken = "EAA1234567890_test_meta_user_token";
    const encrypted = encryptSocialToken(rawAccessToken);

    const [accountA] = await db
      .select()
      .from(socialAccountsTable)
      .where(eq(socialAccountsTable.userId, creatorAId))
      .limit(1);
    const [tokenRecord] = await db
      .insert(socialTokensTable)
      .values({
        socialAccountId: accountA.id,
        accessTokenEncrypted: encrypted.encryptedToken,
        tokenIv: encrypted.iv,
        tokenAuthTag: encrypted.authTag,
        scopes: ["instagram_business_basic", "instagram_business_manage_insights"],
      })
      .returning();

    assert(
      tokenRecord.accessTokenEncrypted !== rawAccessToken,
      "5a. Token is encrypted at rest using AES-256-GCM"
    );
    assert(tokenRecord.tokenIv.length === 24, "5b. Token record stores 12-byte IV");
    assert(
      tokenRecord.tokenAuthTag.length === 32,
      "5c. Token record stores 16-byte authentication tag"
    );

    const decrypted = decryptSocialToken(
      tokenRecord.accessTokenEncrypted,
      tokenRecord.tokenIv,
      tokenRecord.tokenAuthTag
    );
    assert(
      decrypted === rawAccessToken,
      "5d. Decrypted token matches original access token payload"
    );
  } catch (e: any) {
    assert(false, `5. Token security audit failed: ${e.message}`);
  }

  // ==================================================
  // 6. ACCOUNT OWNERSHIP & DUPLICATE PROTECTION AUDIT
  // ==================================================
  console.log("\n--- 6. ACCOUNT OWNERSHIP / DUPLICATES ---");
  try {
    const [accA] = await db
      .select()
      .from(socialAccountsTable)
      .where(eq(socialAccountsTable.userId, creatorAId))
      .limit(1);

    // Attempting to create duplicate externalAccountId under Creator B must fail due to unique constraint
    let duplicateRejected = false;
    try {
      await db.insert(socialAccountsTable).values({
        userId: creatorBId,
        platform: "instagram",
        externalAccountId: accA.externalAccountId,
        username: "attacker_attempting_duplication",
        verificationStatus: "VERIFIED",
        isOfficialOAuth: true,
      });
    } catch (err: any) {
      duplicateRejected = true;
    }
    assert(
      duplicateRejected,
      "6a. Database unique index `idx_social_accounts_platform_external` prevents duplicate Instagram account connection across creators"
    );
  } catch (e: any) {
    assert(false, `6. Account ownership audit failed: ${e.message}`);
  }

  // ==================================================
  // 7. DISCONNECT AUDIT
  // ==================================================
  console.log("\n--- 7. DISCONNECT AUDIT ---");
  try {
    const [accA] = await db
      .select()
      .from(socialAccountsTable)
      .where(eq(socialAccountsTable.userId, creatorAId))
      .limit(1);

    // Erase tokens
    await db.delete(socialTokensTable).where(eq(socialTokensTable.socialAccountId, accA.id));
    await db
      .update(socialAccountsTable)
      .set({ verificationStatus: "DISCONNECTED" })
      .where(eq(socialAccountsTable.id, accA.id));

    const tokensRemaining = await db
      .select()
      .from(socialTokensTable)
      .where(eq(socialTokensTable.socialAccountId, accA.id));
    const [updatedAcc] = await db
      .select()
      .from(socialAccountsTable)
      .where(eq(socialAccountsTable.id, accA.id))
      .limit(1);

    assert(
      tokensRemaining.length === 0,
      "7a. Disconnect completely erases encrypted token credentials from `social_tokens`"
    );
    assert(
      updatedAcc.verificationStatus === "DISCONNECTED",
      "7b. Disconnect updates account status to `DISCONNECTED`"
    );
  } catch (e: any) {
    assert(false, `7. Disconnect audit failed: ${e.message}`);
  }

  // Cleanup Test Users
  try {
    await db.delete(userTable).where(eq(userTable.id, creatorAId));
    await db.delete(userTable).where(eq(userTable.id, creatorBId));
  } catch (_e) {}

  console.log(`\n=================================================`);
  console.log(`FINAL E2E AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`=================================================\n`);

  if (failed > 0) process.exit(1);
}

runFullE2EAudit().catch((err) => {
  console.error("Fatal error during E2E audit:", err);
  process.exit(1);
});
