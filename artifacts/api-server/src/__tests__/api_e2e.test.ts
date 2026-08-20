import { SocialAccount } from "@workspace/db";

const API_BASE = "http://localhost:5001/api";

async function runApiTests() {
  console.log("\n==========================================");
  console.log("PHASE 3, 4 & 5: BACKEND, VERIFICATION & DB persistence TESTS");
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

  // 1. GET social accounts
  try {
    const getRes = await fetch(`${API_BASE}/influencers/1/social-accounts`);
    const accounts = (await getRes.json()) as SocialAccount[];
    assert(getRes.status === 200 && Array.isArray(accounts), "1. GET social accounts returns HTTP 200 and array");
  } catch (e: any) {
    assert(false, `1. GET social accounts failed: ${e.message}`);
  }

  // 2. POST social account (Add Instagram)
  let newAccId = "";
  try {
    const postRes = await fetch(`${API_BASE}/influencers/1/social-accounts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: "x",
        username: "e2e_creator_x",
        profileUrl: "https://x.com/e2e_creator_x",
        inputType: "username",
      }),
    });
    const data = (await postRes.json()) as any;
    assert(postRes.status === 201 && data.status === "UNVERIFIED" && data.platform === "x", "2. POST social account returns 201 Created with status UNVERIFIED");
    newAccId = data.id;
  } catch (e: any) {
    assert(false, `2. POST social account failed: ${e.message}`);
  }

  // 3. PUT update social account
  try {
    const putRes = await fetch(`${API_BASE}/influencers/1/social-accounts/${newAccId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: "x",
        username: "e2e_creator_x_updated",
        profileUrl: "https://x.com/e2e_creator_x_updated",
        inputType: "username",
      }),
    });
    const updatedData = (await putRes.json()) as any;
    assert(putRes.status === 200 && updatedData.username === "e2e_creator_x_updated", "3. PUT social account updates handle in database");
  } catch (e: any) {
    assert(false, `3. PUT social account failed: ${e.message}`);
  }

  // 4. POST verify social account (Successful Verification)
  try {
    const verifyRes = await fetch(`${API_BASE}/influencers/1/social-accounts/${newAccId}/verify`, {
      method: "POST",
    });
    const verifiedData = (await verifyRes.json()) as SocialAccount;
    assert(
      verifyRes.status === 200 &&
      verifiedData.status === "VERIFIED" &&
      verifiedData.verificationType === "PROFILE_EXISTS" &&
      typeof verifiedData.verifiedAt === "string",
      "4. POST verify returns status VERIFIED, verificationType PROFILE_EXISTS, and ISO verifiedAt timestamp"
    );
  } catch (e: any) {
    assert(false, `4. POST verify failed: ${e.message}`);
  }

  // 5. POST duplicate platform account
  try {
    const dupRes = await fetch(`${API_BASE}/influencers/1/social-accounts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: "x",
        username: "another_x_handle",
        inputType: "username",
      }),
    });
    assert(dupRes.status === 400, "5. POST duplicate platform returns 400 Bad Request");
  } catch (e: any) {
    assert(false, `5. Duplicate account test failed: ${e.message}`);
  }

  // 6. POST invalid platform
  try {
    const invPlatRes = await fetch(`${API_BASE}/influencers/1/social-accounts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: "nonexistent_platform",
        username: "handle",
        inputType: "username",
      }),
    });
    assert(invPlatRes.status === 400, "6. POST invalid platform returns 400 Bad Request");
  } catch (e: any) {
    assert(false, `6. Invalid platform test failed: ${e.message}`);
  }

  // 7. Verification Failure Test (Invalid URL domain for Snapchat)
  let failAccId = "";
  try {
    const addFailRes = await fetch(`${API_BASE}/influencers/1/social-accounts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: "snapchat",
        profileUrl: "https://wrong-domain.com/user",
        inputType: "url",
      }),
    });
    const addFailData = (await addFailRes.json()) as any;
    failAccId = addFailData.id;

    // Wait 3.5s to bypass rate-limit cooldown if any
    await new Promise((r) => setTimeout(r, 3500));

    const verifyFailRes = await fetch(`${API_BASE}/influencers/1/social-accounts/${failAccId}/verify`, {
      method: "POST",
    });
    const verifyFailData = (await verifyFailRes.json()) as any;
    assert(
      verifyFailRes.status === 200 &&
      verifyFailData.status === "FAILED" &&
      typeof verifyFailData.errorMessage === "string" &&
      !verifyFailData.verifiedAt,
      "7. Invalid profile domain returns status FAILED with errorMessage and no verifiedAt"
    );
  } catch (e: any) {
    assert(false, `7. Failed verification test failed: ${e.message}`);
  }

  // 8. DELETE social account
  try {
    const delRes = await fetch(`${API_BASE}/influencers/1/social-accounts/${newAccId}`, {
      method: "DELETE",
    });
    const delData = (await delRes.json()) as any;
    assert(delRes.status === 200 && delData.success === true, "8. DELETE social account removes account from database");

    // Clean up second test account
    await fetch(`${API_BASE}/influencers/1/social-accounts/${failAccId}`, { method: "DELETE" });
  } catch (e: any) {
    assert(false, `8. DELETE social account failed: ${e.message}`);
  }

  console.log(`\nPhase 3, 4 & 5 Integration Results: ${passed} Passed, ${failed} Failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runApiTests().catch((err) => {
  console.error("API Integration Test Error:", err);
  process.exit(1);
});
