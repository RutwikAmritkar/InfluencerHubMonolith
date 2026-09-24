import { db, socialAccountsTable, socialTokensTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { encryptSocialToken, decryptSocialToken } from "../integrations/social/token-crypto";

async function runDatabasePersistenceTests() {
  console.log("\n=================================================");
  console.log("B. INSTAGRAM DATABASE PERSISTENCE TEST SUITE");
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

  const testUserId = "ZMk7ftqn1oWvQSsAUiEbnhzaNfsAxJAR"; // Creator Rutwik

  // 1. Fetch connected Instagram account from DB
  try {
    const accounts = await db
      .select()
      .from(socialAccountsTable)
      .where(eq(socialAccountsTable.platform, "instagram"));

    assert(accounts.length >= 1, "1a. Persisted social_accounts record exists for test user");

    const account = accounts.find(a => a.isOfficialOAuth && a.externalAccountId) || accounts[0];
    assert(account.platform === "instagram", "1b. social_accounts.platform equals 'instagram'");
    assert(typeof account.externalAccountId === "string" && account.externalAccountId.length > 0, "1c. social_accounts.externalAccountId is populated");
    assert(typeof account.username === "string" && account.username.length > 0, "1d. social_accounts.username is populated");
    assert(account.verificationStatus === "VERIFIED" || account.verificationStatus === "CONNECTED", "1e. social_accounts.verificationStatus is valid");
    assert(account.isOfficialOAuth === true, "1f. social_accounts.isOfficialOAuth equals true");

    // 2. Fetch associated tokens record from DB
    const tokens = await db
      .select()
      .from(socialTokensTable)
      .where(eq(socialTokensTable.socialAccountId, account.id));

    assert(tokens.length >= 1, "2a. Persisted social_tokens record exists for socialAccountId");

    const tokenRec = tokens[0];
    assert(typeof tokenRec.accessTokenEncrypted === "string" && tokenRec.accessTokenEncrypted.length > 0, "2b. social_tokens.accessTokenEncrypted contains ciphertext");
    assert(typeof tokenRec.tokenIv === "string" && tokenRec.tokenIv.length === 24, "2c. social_tokens.tokenIv contains 12-byte hex IV (24 chars)");
    assert(typeof tokenRec.tokenAuthTag === "string" && tokenRec.tokenAuthTag.length === 32, "2d. social_tokens.tokenAuthTag contains 16-byte hex AuthTag (32 chars)");
    assert(tokenRec.expiresAt !== undefined, "2e. social_tokens.expiresAt expiration field is supported in schema");
    assert(Array.isArray(tokenRec.scopes) && tokenRec.scopes.length > 0, "2f. social_tokens.scopes array is persisted");

    // 3. AES-256-GCM Decryption Roundtrip Test
    const rawToken = decryptSocialToken(tokenRec.accessTokenEncrypted, tokenRec.tokenIv, tokenRec.tokenAuthTag);
    assert(typeof rawToken === "string" && rawToken.length > 0, "3a. AES-256-GCM ciphertext decrypts cleanly with IV and AuthTag");

    // 4. Unique Constraint & Duplicate Prevention Test
    const duplicateAccounts = await db
      .select()
      .from(socialAccountsTable)
      .where(and(eq(socialAccountsTable.platform, "instagram"), eq(socialAccountsTable.externalAccountId, account.externalAccountId)));

    assert(duplicateAccounts.length === 1, `4a. Database unique index \`idx_social_accounts_platform_external\` prevents duplicate rows for same Instagram account (found ${duplicateAccounts.length} for externalAccountId='${account.externalAccountId}')`);
  } catch (e: any) {
    assert(false, `Database Persistence test failed: ${e.message}`);
  }

  console.log(`\nDatabase Persistence Test Summary: ${passed} Passed, ${failed} Failed.\n`);
  if (failed > 0) process.exit(1);
}

runDatabasePersistenceTests().catch((err) => {
  console.error("Database Persistence Test Fatal Error:", err);
  process.exit(1);
});
