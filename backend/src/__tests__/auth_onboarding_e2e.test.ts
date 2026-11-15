import app from "../app";
import { db, user as userTable, influencersTable, brandsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import http from "node:http";

async function runEndToEndAuthOnboardingTests() {
  console.log("\n==================================================");
  console.log("🚀 INFLUENCERHUB E2E AUTH & ONBOARDING SUITE");
  console.log("==================================================\n");

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

  // Helper function to test frontend isUserOnboardingComplete logic
  function isUserOnboardingComplete(user: any): boolean {
    if (!user) return false;
    const status = String(user.onboardingStatus || "").toLowerCase();
    const step = String(user.onboardingStep || "").toUpperCase();
    return status === "completed" || step === "COMPLETED" || step === "C5" || step === "B6";
  }

  // Start local HTTP server on dynamic port
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    // ----------------------------------------------------
    // TEST FLOW A: NEW CREATOR SIGNUP -> ONBOARDING -> DASHBOARD
    // ----------------------------------------------------
    const creatorEmail = `creator_e2e_${Date.now()}@example.com`;
    const creatorPassword = "Password@123456";
    const creatorName = "E2E Test Creator";

    console.log("--- 1. NEW CREATOR SIGNUP & ONBOARDING FLOW ---");

    // A1. Register New Creator
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: creatorName,
        email: creatorEmail,
        password: creatorPassword,
        role: "influencer",
        country: "India",
        language: "en",
      }),
    });

    const regData: any = await regRes.json();
    const cookies = regRes.headers.get("set-cookie") || "";
    assert(regRes.status === 201 && regData.user?.id, "A1. Creator signup creates user identity");
    assert(regData.user?.role === "influencer", "A2. Creator role assigned correctly");
    assert(
      !isUserOnboardingComplete(regData.user),
      "A3. New signup has incomplete onboarding status"
    );

    // A2. Fetch /api/auth/me before onboarding
    const meBeforeRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { cookie: cookies },
    });
    const meBeforeData: any = await meBeforeRes.json();
    assert(meBeforeRes.status === 200, "A4. /api/auth/me authenticates newly registered creator");
    assert(
      !isUserOnboardingComplete(meBeforeData.user),
      "A5. /api/auth/me confirms incomplete onboarding prior to step completion"
    );

    // A3. Submit Creator Onboarding (C1-C5)
    const onboardRes = await fetch(`${baseUrl}/api/auth/onboarding/creator`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        cookie: cookies,
      },
      body: JSON.stringify({
        userId: regData.user.id,
        creatorType: "Micro Creator",
        niches: ["Lifestyle", "Fashion"],
        location: "India",
        state: "Maharashtra",
        city: "Mumbai",
        audienceData: { age: "Gen Z", gender: "Balanced" },
        collaborationPreferences: ["Meta Ads"],
        goals: ["Brand Awareness"],
        socialAccounts: [],
      }),
    });
    const onboardData: any = await onboardRes.json();
    assert(
      onboardRes.status === 200 && onboardData.ok,
      "A6. Creator onboarding submission succeeds"
    );

    // A4. Fetch /api/auth/me AFTER onboarding completion
    const meAfterRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { cookie: cookies },
    });
    const meAfterData: any = await meAfterRes.json();
    assert(
      meAfterData.user?.onboardingStatus === "completed",
      "A7. /api/auth/me returns onboardingStatus='completed'"
    );
    assert(
      meAfterData.user?.onboardingStep === "COMPLETED",
      "A8. /api/auth/me returns onboardingStep='COMPLETED'"
    );
    assert(
      isUserOnboardingComplete(meAfterData.user),
      "A9. isUserOnboardingComplete evaluates to TRUE for completed creator"
    );

    // A5. Log out creator
    await fetch(`${baseUrl}/api/auth/logout`, {
      method: "POST",
      headers: { cookie: cookies },
    });

    // A6. Log back in as existing creator with completed onboarding
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: creatorEmail,
        password: creatorPassword,
      }),
    });
    const loginData: any = await loginRes.json();
    assert(
      loginRes.status === 200 && loginData.user?.id,
      "A10. Existing creator logs in successfully"
    );
    assert(
      loginData.user?.onboardingStatus === "completed",
      "A11. Login response recognizes completed creator onboarding"
    );
    assert(
      isUserOnboardingComplete(loginData.user),
      "A12. Router receives completed status and routes directly to dashboard"
    );

    // ----------------------------------------------------
    // TEST FLOW B: NEW BRAND SIGNUP -> ONBOARDING -> DASHBOARD
    // ----------------------------------------------------
    console.log("\n--- 2. NEW BRAND SIGNUP & ONBOARDING FLOW ---");

    const brandEmail = `brand_e2e_${Date.now()}@example.com`;
    const brandPassword = "Password@123456";
    const brandName = "E2E Test Brand Inc";

    // B1. Register Brand
    const brandRegRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: brandName,
        email: brandEmail,
        password: brandPassword,
        role: "brand",
        country: "India",
        language: "en",
      }),
    });
    const brandRegData: any = await brandRegRes.json();
    const brandCookies = brandRegRes.headers.get("set-cookie") || "";
    assert(
      brandRegRes.status === 201 && brandRegData.user?.role === "brand",
      "B1. Brand account created successfully"
    );
    assert(
      !isUserOnboardingComplete(brandRegData.user),
      "B2. New brand signup has incomplete onboarding status"
    );

    // B2. Submit Brand Onboarding (B1-B6)
    const brandOnboardRes = await fetch(`${baseUrl}/api/auth/onboarding/brand`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        cookie: brandCookies,
      },
      body: JSON.stringify({
        userId: brandRegData.user.id,
        name: brandName,
        website: "https://example-brand.com",
        country: "India",
        city: "Bengaluru",
        industry: "Technology",
        categories: ["Software"],
        targetAudience: "Gen Z",
        campaignGoals: ["App Installs"],
        campaignPreferences: ["Dedicated Video"],
        socialAccounts: [],
      }),
    });
    const brandOnboardData: any = await brandOnboardRes.json();
    assert(
      brandOnboardRes.status === 200 && brandOnboardData.ok,
      "B3. Brand onboarding submission succeeds"
    );

    // B3. Log back in as existing brand
    const brandLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: brandEmail,
        password: brandPassword,
      }),
    });
    const brandLoginData: any = await brandLoginRes.json();
    assert(
      brandLoginRes.status === 200 && brandLoginData.user?.role === "brand",
      "B4. Existing brand logs in successfully"
    );
    assert(
      brandLoginData.user?.onboardingStatus === "completed",
      "B5. Login response recognizes completed brand onboarding"
    );
    assert(
      isUserOnboardingComplete(brandLoginData.user),
      "B6. Router routes existing brand directly to /dashboard/brand"
    );

    // ----------------------------------------------------
    // TEST FLOW C: EXISTING USER WITH INCOMPLETE ONBOARDING
    // ----------------------------------------------------
    console.log("\n--- 3. EXISTING USER WITH INCOMPLETE ONBOARDING ---");

    const incEmail = `incomplete_e2e_${Date.now()}@example.com`;
    const incPassword = "Password@123456";

    // C1. Register user but DO NOT submit onboarding
    await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Incomplete User",
        email: incEmail,
        password: incPassword,
        role: "influencer",
      }),
    });

    // C2. Log in as incomplete user
    const incLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: incEmail,
        password: incPassword,
      }),
    });
    const incLoginData: any = await incLoginRes.json();
    assert(incLoginRes.status === 200, "C1. Incomplete user logs in successfully");
    assert(
      !isUserOnboardingComplete(incLoginData.user),
      "C2. Incomplete user login correctly returns incomplete onboarding status"
    );

    // ----------------------------------------------------
    // TEST FLOW D: HELPER CORNER-CASE VALIDATIONS
    // ----------------------------------------------------
    console.log("\n--- 4. HELPER & CORNER-CASE VALIDATIONS ---");

    assert(!isUserOnboardingComplete(null), "D1. null user resolves to false");
    assert(!isUserOnboardingComplete({}), "D2. empty user resolves to false");
    assert(
      isUserOnboardingComplete({ onboardingStatus: "COMPLETED" }),
      "D3. Uppercase COMPLETED status resolves to true"
    );
    assert(
      isUserOnboardingComplete({ onboardingStatus: "completed" }),
      "D4. Lowercase completed status resolves to true"
    );
    assert(isUserOnboardingComplete({ onboardingStep: "C5" }), "D5. Step C5 resolves to true");
    assert(isUserOnboardingComplete({ onboardingStep: "B6" }), "D6. Step B6 resolves to true");
    assert(
      !isUserOnboardingComplete({ onboardingStatus: "pending", onboardingStep: "C1" }),
      "D7. Step C1 pending resolves to false"
    );
  } finally {
    server.close();
  }

  console.log(`\n==================================================`);
  console.log(`🎉 E2E TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`==================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runEndToEndAuthOnboardingTests().catch((err) => {
  console.error("E2E Test Failure:", err);
  process.exit(1);
});
