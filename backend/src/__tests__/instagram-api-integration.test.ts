import { InstagramProvider } from "../integrations/social/instagram.provider";
import { calculateVerifiedAnalytics } from "../integrations/social/analytics-calculator";

async function runInstagramApiIntegrationTests() {
  console.log("\n=================================================");
  console.log("C. INSTAGRAM API INTEGRATION TEST SUITE");
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

  // Set mock fallback enabled for unit shape assertions
  const prevMockFlag = process.env.ENABLE_SOCIAL_MOCK_FALLBACK;
  process.env.ENABLE_SOCIAL_MOCK_FALLBACK = "true";

  const provider = new InstagramProvider();

  // 1. Profile Telemetry Fetch & Normalization
  try {
    const profile = await provider.getProfile("ig_test_token");

    assert(typeof profile.externalAccountId === "string" && profile.externalAccountId.length > 0, "1a. getProfile returns valid externalAccountId");
    assert(typeof profile.username === "string" && profile.username.length > 0, "1b. getProfile returns valid username");
    assert(typeof profile.followers === "number" && profile.followers >= 0, "1c. getProfile returns numeric follower count");
    assert(typeof profile.following === "number" || profile.following === undefined, "1d. getProfile handles following count metric");
    assert(typeof profile.totalContent === "number" && profile.totalContent >= 0, "1e. getProfile returns total content count");
  } catch (e: any) {
    assert(false, `1. Profile telemetry test failed: ${e.message}`);
  }

  // 2. Account Insights Metric (`getInsights`) Reach Normalization
  try {
    const zeroReach = await provider.getInsights("ig_test_zero_reach", "1784140123");
    assert(zeroReach.reach === 0, "2a. Legitimate reach = 0 resolves to { reach: 0 }");

    const positiveReach = await provider.getInsights("ig_test_token", "1784140123");
    assert(positiveReach.reach === 12500, "2b. Successful reach query resolves to numeric value");

    const errorReach = await provider.getInsights("ig_test_api_error", "1784140123");
    assert(errorReach.reach === null, "2c. Meta API HTTP error resolves to { reach: null } without throwing unhandled exceptions");
  } catch (e: any) {
    assert(false, `2. Insights test failed: ${e.message}`);
  }

  // 3. Media Content Fetch (`getContent`) & Analytics Calculation
  try {
    const mockProfile = {
      externalAccountId: "ig_1001",
      username: "testcreator",
      followers: 10000,
      following: 500,
      totalContent: 50,
    };

    const contentList = await provider.getContent("ig_test_token", mockProfile.externalAccountId, 5);
    assert(Array.isArray(contentList), "3a. getContent returns array of media content");

    if (contentList.length > 0) {
      assert(typeof contentList[0].externalContentId === "string", "3b. Media item contains externalContentId");
      assert(contentList[0].contentType === "post" || contentList[0].contentType === "reel", "3c. Media item normalized to 'post' or 'reel'");
    }

    const analytics = calculateVerifiedAnalytics(mockProfile, contentList);
    assert(typeof analytics.engagementRate === "string", "3d. Analytics calculator computes engagement rate string");
    assert(typeof analytics.avgLikes === "number", "3e. Analytics calculator computes average likes");
    assert(typeof analytics.avgComments === "number", "3f. Analytics calculator computes average comments");
  } catch (e: any) {
    assert(false, `3. Content & Analytics test failed: ${e.message}`);
  }

  // 4. Invalid / Expired Access Token Error Handling
  try {
    let errorCaught = false;
    try {
      // Force non-mock production mode temporarily to test error throwing
      process.env.ENABLE_SOCIAL_MOCK_FALLBACK = "false";
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      await provider.getProfile("invalid_revoked_token_123");

      process.env.NODE_ENV = originalEnv;
    } catch (_err) {
      errorCaught = true;
    }

    assert(errorCaught, "4a. Invalid or revoked access token throws clean, catchable error");
  } catch (e: any) {
    assert(false, `4. Invalid token test failed: ${e.message}`);
  } finally {
    if (prevMockFlag !== undefined) {
      process.env.ENABLE_SOCIAL_MOCK_FALLBACK = prevMockFlag;
    } else {
      delete process.env.ENABLE_SOCIAL_MOCK_FALLBACK;
    }
  }

  console.log(`\nInstagram API Integration Test Summary: ${passed} Passed, ${failed} Failed.\n`);
  if (failed > 0) process.exit(1);
}

runInstagramApiIntegrationTests().catch((err) => {
  console.error("Instagram API Integration Test Fatal Error:", err);
  process.exit(1);
});
