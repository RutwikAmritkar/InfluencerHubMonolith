import { socialVerificationService } from "../services/social-verification.service";
import { SocialAccount } from "@workspace/db";

async function runTests() {
  console.log("Starting Social Media Verification Test Suite...");
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

  // Test 1: Instagram Handle Verification
  const validInsta: SocialAccount = {
    id: "soc_test_1",
    creatorId: 1,
    platform: "instagram",
    username: "johncreator",
    profileUrl: "https://instagram.com/johncreator",
    inputType: "username",
    status: "UNVERIFIED",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const res1 = await socialVerificationService.verifyAccount(validInsta);
  assert(res1.status === "VERIFIED" && res1.verificationType === "PROFILE_EXISTS", "Valid Instagram handle returns status VERIFIED and PROFILE_EXISTS");

  // Test 2: Invalid Instagram URL
  const invalidInstaUrl: SocialAccount = {
    id: "soc_test_2",
    creatorId: 1,
    platform: "instagram",
    profileUrl: "https://fake-domain.com/johncreator",
    inputType: "url",
    status: "UNVERIFIED",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const res2 = await socialVerificationService.verifyAccount(invalidInstaUrl);
  assert(res2.status === "FAILED" && typeof res2.errorMessage === "string", "Invalid domain Instagram URL returns status FAILED with errorMessage");

  // Test 3: YouTube Channel Verification
  const validYt: SocialAccount = {
    id: "soc_test_3",
    creatorId: 1,
    platform: "youtube",
    username: "johncreator",
    profileUrl: "https://youtube.com/@johncreator",
    inputType: "url",
    status: "UNVERIFIED",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const res3 = await socialVerificationService.verifyAccount(validYt);
  assert(res3.status === "VERIFIED" && res3.verificationType === "PROFILE_EXISTS", "Valid YouTube channel URL returns status VERIFIED");

  // Test 4: Facebook Account Verification (Independent Platform)
  const validFb: SocialAccount = {
    id: "soc_test_4",
    creatorId: 1,
    platform: "facebook",
    username: "johncreatorpage",
    profileUrl: "https://facebook.com/johncreatorpage",
    inputType: "url",
    status: "UNVERIFIED",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const res4 = await socialVerificationService.verifyAccount(validFb);
  assert(res4.status === "VERIFIED" && res4.verificationType === "PROFILE_EXISTS", "Explicit Facebook account verifies independently");

  // Test 5: TikTok Handle Verification
  const validTikTok: SocialAccount = {
    id: "soc_test_5",
    creatorId: 1,
    platform: "tiktok",
    username: "johncreator",
    profileUrl: "https://tiktok.com/@johncreator",
    inputType: "username",
    status: "UNVERIFIED",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const res5 = await socialVerificationService.verifyAccount(validTikTok);
  assert(res5.status === "VERIFIED", "Valid TikTok handle returns status VERIFIED");

  // Test 6: Invalid Handle with spaces
  const invalidHandle: SocialAccount = {
    id: "soc_test_6",
    creatorId: 1,
    platform: "instagram",
    username: "",
    inputType: "username",
    status: "UNVERIFIED",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const res6 = await socialVerificationService.verifyAccount(invalidHandle);
  assert(res6.status === "FAILED", "Empty username handle returns status FAILED");

  console.log(`\nTest Results: ${passed} Passed, ${failed} Failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
