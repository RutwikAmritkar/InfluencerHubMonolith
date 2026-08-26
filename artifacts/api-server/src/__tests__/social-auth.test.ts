import { encryptSocialToken, decryptSocialToken } from "../integrations/social/token-crypto";
import { calculateVerifiedAnalytics } from "../integrations/social/analytics-calculator";
import { InstagramProvider } from "../integrations/social/instagram.provider";

async function runSocialUnitTests() {
  console.log("\n==========================================");
  console.log("CREATOR SOCIAL INTEGRATION & CRYPTO UNIT TESTS");
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

  // 1. AES-256-GCM Token Encryption & Decryption Roundtrip Test
  try {
    const rawToken = "oauth_access_token_secret_123456789_xyz";
    const encrypted = encryptSocialToken(rawToken);

    assert(
      typeof encrypted.encryptedToken === "string" &&
        typeof encrypted.iv === "string" &&
        typeof encrypted.authTag === "string" &&
        encrypted.encryptedToken !== rawToken,
      "1a. AES-256-GCM Token Encryption outputs ciphertext, IV, and AuthTag"
    );

    const decrypted = decryptSocialToken(encrypted.encryptedToken, encrypted.iv, encrypted.authTag);
    assert(decrypted === rawToken, "1b. Decrypted token matches original raw token exactly");
  } catch (e: any) {
    assert(false, `1. AES-256-GCM Token Encryption test failed: ${e.message}`);
  }

  // 2. Analytics Calculator Formula Verification
  const mockProfile = {
    externalAccountId: "ig_1001",
    username: "testcreator",
    followers: 10000,
    following: 500,
    totalContent: 50,
  };

  const mockContent = [
    {
      externalContentId: "c1",
      contentType: "reel" as const,
      views: 5000,
      likes: 400,
      comments: 100,
      shares: 50,
    },
    {
      externalContentId: "c2",
      contentType: "post" as const,
      views: 3000,
      likes: 200,
      comments: 100,
      shares: 30,
    },
  ];

  const analytics = calculateVerifiedAnalytics(mockProfile, mockContent);

  // Expected avgLikes = (400 + 200) / 2 = 300
  // Expected avgComments = (100 + 100) / 2 = 100
  // Expected ER = (300 + 100) / 10000 * 100 = 4.00%
  assert(analytics.avgLikes === 300, "2a. Average Likes calculated correctly");
  assert(analytics.avgComments === 100, "2b. Average Comments calculated correctly");
  assert(analytics.engagementRate === "4.00", "2c. Legitimate Engagement Rate (%) calculated accurately (4.00%)");

  // 3. Instagram Provider Capabilities Declaration
  const igProvider = new InstagramProvider();
  assert(igProvider.platform === "instagram", "3a. InstagramProvider declares platform as 'instagram'");
  assert(igProvider.capabilities.hasFollowingCount === true, "3b. InstagramProvider declares following count supported");
  assert(igProvider.capabilities.hasTotalViews === false, "3c. InstagramProvider explicitly declares channel total views unavailable on profile endpoint");

  console.log(`\nSocial Integration Unit Test Results: ${passed} Passed, ${failed} Failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runSocialUnitTests().catch((err) => {
  console.error("Social Test Error:", err);
  process.exit(1);
});
