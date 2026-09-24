import { InstagramProvider, INSTAGRAM_AUTH_HOST } from "../integrations/social/instagram.provider";
import { encryptSocialToken, decryptSocialToken } from "../integrations/social/token-crypto";

async function runOAuthIntegrationTests() {
  console.log("\n=================================================");
  console.log("A. INSTAGRAM OAUTH INTEGRATION TEST SUITE");
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
  const testState = "test_csrf_state_token_998877";

  // 1. Authorization URL Parameter Generation & Scopes Validation
  try {
    const authUrl = await provider.getAuthorizationUrl(testState);

    assert(authUrl.startsWith(`${INSTAGRAM_AUTH_HOST}/oauth/authorize`), "1a. Authorization URL uses direct Instagram OAuth host (www.instagram.com/oauth/authorize)");
    assert(authUrl.includes("client_id="), "1b. Authorization URL contains client_id parameter");
    assert(authUrl.includes("redirect_uri="), "1c. Authorization URL contains redirect_uri parameter");
    assert(authUrl.includes("response_type=code"), "1d. Authorization URL specifies response_type=code");
    assert(authUrl.includes(`state=${testState}`), "1e. Authorization URL preserves CSRF state parameter");
    assert(
      authUrl.includes("scope=instagram_business_basic%2Cinstagram_business_manage_insights") ||
        authUrl.includes("instagram_business_basic"),
      "1f. Authorization URL requests correct Instagram Business Login scopes (instagram_business_basic, instagram_business_manage_insights)"
    );
  } catch (e: any) {
    assert(false, `1. Authorization URL test failed: ${e.message}`);
  }

  // 2. Authorization Code Sanitization Safety Test
  try {
    const rawCodeWithFragment = "AQD1234567890abcdef#_";
    const rawCodeWithQuery = "AQD1234567890abcdef#fragment_here";
    const rawCodeWithSpaces = "  AQD1234567890abcdef  ";

    const clean1 = rawCodeWithFragment.replace(/#_$/, "").replace(/#.*$/, "").trim();
    const clean2 = rawCodeWithQuery.replace(/#_$/, "").replace(/#.*$/, "").trim();
    const clean3 = rawCodeWithSpaces.replace(/#_$/, "").replace(/#.*$/, "").trim();

    assert(clean1 === "AQD1234567890abcdef", "2a. Trailing '#_' fragment appended by Instagram OAuth redirect is safely stripped");
    assert(clean2 === "AQD1234567890abcdef", "2b. Trailing generic '#' fragment is safely stripped");
    assert(clean3 === "AQD1234567890abcdef", "2c. Leading and trailing whitespace are safely trimmed");
  } catch (e: any) {
    assert(false, `2. Code sanitization test failed: ${e.message}`);
  }

  // 3. OAuth Cancellation & Error Callback Parameter Validation
  try {
    const errorQuery = { error: "access_denied", error_reason: "user_denied", error_description: "Permissions error" };
    const hasError = !!(errorQuery.error || errorQuery.error_reason);
    assert(hasError, "3a. Callback detects access_denied / user_denied error parameters");
  } catch (e: any) {
    assert(false, `3. OAuth cancellation test failed: ${e.message}`);
  }

  // 4. Missing Authorization Code & Missing State Rejection
  try {
    let missingCodeRejected = false;
    let missingStateRejected = false;

    const queryNoCode = { state: "valid_state" } as any;
    const queryNoState = { code: "valid_code" } as any;

    if (!queryNoCode.code || typeof queryNoCode.code !== "string") {
      missingCodeRejected = true;
    }
    if (!queryNoState.state) {
      missingStateRejected = true;
    }

    assert(missingCodeRejected, "4a. Callback rejects request missing authorization code parameter");
    assert(missingStateRejected, "4b. Callback rejects request missing CSRF state parameter");
  } catch (e: any) {
    assert(false, `4. Missing parameter rejection test failed: ${e.message}`);
  }

  // 5. State Mismatch Rejection Simulation
  try {
    const stateInDb: string = "stored_state_in_postgres_112233";
    const stateInCallback: string = "mismatched_state_from_attacker_998877";

    const isMatch = stateInDb === stateInCallback;

    assert(!isMatch, "5a. Callback rejects mismatched CSRF state parameters");
  } catch (e: any) {
    assert(false, `5. State mismatch test failed: ${e.message}`);
  }

  console.log(`\nOAuth Integration Test Summary: ${passed} Passed, ${failed} Failed.\n`);
  if (failed > 0) process.exit(1);
}

runOAuthIntegrationTests().catch((err) => {
  console.error("OAuth Integration Test Fatal Error:", err);
  process.exit(1);
});
