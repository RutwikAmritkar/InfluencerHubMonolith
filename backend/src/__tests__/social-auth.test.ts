import { encryptSocialToken, decryptSocialToken } from "../integrations/social/token-crypto";
import { calculateVerifiedAnalytics } from "../integrations/social/analytics-calculator";
import { InstagramProvider, INSTAGRAM_AUTH_HOST, INSTAGRAM_GRAPH_HOST, INSTAGRAM_OAUTH_HOST, INSTAGRAM_GRAPH_API_VERSION } from "../integrations/social/instagram.provider";

async function runSocialUnitTests() {
  console.log("\n==========================================");
  console.log("CREATOR SOCIAL INTEGRATION & INSTAGRAM LOGIN TEST SUITE");
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

  assert(analytics.avgLikes === 300, "2a. Average Likes calculated correctly");
  assert(analytics.avgComments === 100, "2b. Average Comments calculated correctly");
  assert(analytics.engagementRate === "4.00", "2c. Legitimate Engagement Rate (%) calculated accurately (4.00%)");

  // 3. Instagram Provider Capabilities Declaration
  const igProvider = new InstagramProvider();
  assert(igProvider.platform === "instagram", "3a. InstagramProvider declares platform as 'instagram'");
  assert(igProvider.capabilities.hasFollowingCount === true, "3b. InstagramProvider declares following count supported");
  assert(igProvider.capabilities.hasTotalViews === false, "3c. InstagramProvider explicitly declares channel total views unavailable on profile endpoint");

  // 4. Instagram Login OAuth Authorization URL & Scopes Verification
  try {
    const state = "test_oauth_state_12345";
    const authUrl = await igProvider.getAuthorizationUrl(state);

    assert(authUrl.startsWith(`${INSTAGRAM_AUTH_HOST}/oauth/authorize`), "4a. Authorization URL uses direct Instagram Login host (www.instagram.com/oauth/authorize)");
    assert(!authUrl.includes("facebook.com"), "4b. Authorization URL contains zero Facebook Page dialog URLs");
    assert(authUrl.includes("scope=instagram_business_basic%2Cinstagram_business_manage_insights") || authUrl.includes("instagram_business_basic"), "4c. Authorization URL requests correct Instagram Business scopes (instagram_business_basic, instagram_business_manage_insights)");
    assert(!authUrl.includes("pages_show_list") && !authUrl.includes("pages_read_engagement"), "4d. Legacy Facebook Page scopes (pages_show_list, pages_read_engagement) are completely removed");
    assert(authUrl.includes(`state=${state}`), "4e. OAuth state parameter is preserved in authorization URL");
  } catch (e: any) {
    assert(false, `4. Authorization URL test failed: ${e.message}`);
  }

  // 5. Mock Guarding & Production Safety Assertion
  try {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    delete process.env.ENABLE_SOCIAL_MOCK_FALLBACK;

    const prodProvider = new InstagramProvider();
    let thrown = false;
    try {
      await prodProvider.getProfile("invalid_live_token");
    } catch (_err) {
      thrown = true;
    }
    assert(thrown, "5a. Production environment rejects invalid tokens and throws real error (mock fallback blocked in production)");

    process.env.NODE_ENV = originalEnv;
  } catch (e: any) {
    assert(false, `5. Production mock guard test failed: ${e.message}`);
  }

  // 6. Direct Profile & Content Resolution Shape Test (Mock Mode)
  try {
    const mockProfileData = await igProvider.getProfile("ig_test_token");
    assert(mockProfileData.externalAccountId === "ig_1784140123456789", "6a. Profile resolution returns valid externalAccountId");
    assert(typeof mockProfileData.username === "string" && mockProfileData.username.length > 0, "6b. Profile resolution returns valid username");
    assert(typeof mockProfileData.followers === "number" && mockProfileData.followers >= 0, "6c. Profile resolution returns numeric follower count");

    const mockContentList = await igProvider.getContent("ig_test_token", mockProfileData.externalAccountId, 5);
    assert(Array.isArray(mockContentList) && mockContentList.length > 0, "6d. Media content resolution returns normalized array of content");
    assert(typeof mockContentList[0].externalContentId === "string", "6e. Media content contains valid externalContentId");
  } catch (e: any) {
    assert(false, `6. Profile & Content resolution test failed: ${e.message}`);
  }

  // 7. Instagram Insights Error Handling & Reach Verification
  try {
    const zeroInsights = await igProvider.getInsights("ig_test_zero_reach", "ig_1001");
    assert(zeroInsights.reach === 0, "7a. Legitimate reach = 0 returns { reach: 0 }");

    const positiveInsights = await igProvider.getInsights("ig_test_token", "ig_1001");
    assert(positiveInsights.reach === 12500, "7b. Successful positive reach returns { reach: 12500 }");

    const errorInsights = await igProvider.getInsights("ig_test_api_error", "ig_1001");
    assert(errorInsights.reach === null, "7c. Meta HTTP/API failure returns { reach: null }");

    const malformedInsights = await igProvider.getInsights("ig_test_malformed", "ig_1001");
    assert(malformedInsights.reach === null, "7d. Malformed or missing Insights response returns { reach: null }");
  } catch (e: any) {
    assert(false, `7. Insights error-handling test failed: ${e.message}`);
  }

  // 8. HTTP Fetch Layer Mocking Tests for Instagram Insights API Error Cases
  try {
    const originalFetch = globalThis.fetch;

    // 8a. Successful Meta Insights response with reach = 0
    globalThis.fetch = (async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        data: [{ name: "reach", period: "day", values: [{ value: 0 }] }],
      }),
    })) as any;
    const httpZero = await igProvider.getInsights("live_test_token_123", "1784140123");
    assert(httpZero.reach === 0, "8a. Live HTTP response with reach = 0 resolves to { reach: 0 }");

    // 8b. Successful Meta Insights response with positive reach = 18500
    globalThis.fetch = (async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        data: [{ name: "reach", period: "day", values: [{ value: 18500 }] }],
      }),
    })) as any;
    const httpPositive = await igProvider.getInsights("live_test_token_123", "1784140123");
    assert(httpPositive.reach === 18500, "8b. Live HTTP response with positive reach resolves to { reach: 18500 }");

    // 8c. Meta API HTTP 400 Error
    globalThis.fetch = (async () => ({
      ok: false,
      status: 400,
      json: async () => ({
        error: { code: 100, type: "OAuthException", message: "Invalid parameter" },
      }),
    })) as any;
    const httpError = await igProvider.getInsights("live_test_token_123", "1784140123");
    assert(httpError.reach === null, "8c. Meta API HTTP 400 error resolves to { reach: null }");

    // 8d. Malformed payload response (missing data array)
    globalThis.fetch = (async () => ({
      ok: true,
      status: 200,
      json: async () => ({ error: null, result: "unexpected_shape" }),
    })) as any;
    const httpMalformed = await igProvider.getInsights("live_test_token_123", "1784140123");
    assert(httpMalformed.reach === null, "8d. Malformed payload response resolves to { reach: null }");

    // 8e. Network fetch exception
    globalThis.fetch = (async () => {
      throw new Error("Network connection refused");
    }) as any;
    const httpException = await igProvider.getInsights("live_test_token_123", "1784140123");
    assert(httpException.reach === null, "8e. Network connection failure resolves to { reach: null }");

    // Restore original fetch
    globalThis.fetch = originalFetch;
  } catch (e: any) {
    assert(false, `8. HTTP fetch layer mocking test failed: ${e.message}`);
  }

  console.log(`\nSocial Integration Unit Test Results: ${passed} Passed, ${failed} Failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runSocialUnitTests().catch((err) => {
  console.error("Social Test Error:", err);
  process.exit(1);
});
