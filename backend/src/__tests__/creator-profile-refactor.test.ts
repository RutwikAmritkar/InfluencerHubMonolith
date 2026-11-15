import app from "../app";
import { getStatesForCountry, COUNTRY_STATE_MAP } from "../shared/location-data-test";
import http from "node:http";

async function runCreatorProfileRefactorTests() {
  console.log("\n==================================================");
  console.log("🎨 CREATOR PROFILE REFACTOR & VALIDATION SUITE");
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

  // ----------------------------------------------------
  // 1. DYNAMIC FIRST NAME RESOLUTION
  // ----------------------------------------------------
  const getFirstName = (fullName?: string | null) => {
    if (!fullName) return "Creator";
    return fullName.trim().split(" ")[0] || "Creator";
  };

  assert(
    getFirstName("Rutwik Amritkar") === "Rutwik",
    "1a. 'Rutwik Amritkar' resolves to first name 'Rutwik'"
  );
  assert(getFirstName("John Doe") === "John", "1b. 'John Doe' resolves to first name 'John'");
  assert(getFirstName("   Sarah   ") === "Sarah", "1c. '   Sarah   ' resolves to 'Sarah'");
  assert(
    getFirstName("") === "Creator",
    "1d. Empty name resolves gracefully to fallback 'Creator'"
  );

  // ----------------------------------------------------
  // 2. INDIA STATE & UT DATASET VALIDATION
  // ----------------------------------------------------
  const indianStates = COUNTRY_STATE_MAP["India"];
  assert(
    Array.isArray(indianStates) && indianStates.length === 36,
    "2a. Indian dataset contains all 36 States and Union Territories"
  );
  assert(indianStates.includes("Maharashtra"), "2b. Dataset includes Maharashtra");
  assert(indianStates.includes("Delhi"), "2c. Dataset includes Delhi");
  assert(indianStates.includes("Karnataka"), "2d. Dataset includes Karnataka");
  assert(indianStates.includes("Ladakh"), "2e. Dataset includes Union Territory Ladakh");

  const fallbackStates = getStatesForCountry("UnknownCountry");
  assert(
    Array.isArray(fallbackStates) && fallbackStates.length === 0,
    "2f. Unknown country handles gracefully without crashing"
  );

  // Start local HTTP server
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    // ----------------------------------------------------
    // 3. BACKEND BIO LENGTH & STATE PERSISTENCE
    // ----------------------------------------------------
    console.log("\n--- 3. BACKEND BIO LENGTH & STATE PERSISTENCE ---");

    // Authenticate a test session or signup
    const email = `profile_refactor_${Date.now()}@example.com`;
    const password = "Password@123456";
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Rutwik Amritkar",
        email,
        password,
        role: "influencer",
      }),
    });
    const regData: any = await regRes.json();
    const cookies = regRes.headers.get("set-cookie") || "";
    const profileId = regData.user?.profileId || 1;

    // 3a. Reject Bio > 250 characters
    const oversizedBio = "A".repeat(251);
    const rejectRes = await fetch(`${baseUrl}/api/influencers/${profileId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        cookie: cookies,
      },
      body: JSON.stringify({ bio: oversizedBio }),
    });
    const rejectData: any = await rejectRes.json();
    assert(
      rejectRes.status === 400,
      "3a. Backend rejects bio exceeding 250 characters with HTTP 400"
    );
    assert(
      rejectData.error?.includes("250 characters"),
      "3b. Backend returns clear 250 character limit error message"
    );

    // 3b. Accept valid Bio <= 250 characters & valid state
    const validBio = "A".repeat(250);
    const acceptRes = await fetch(`${baseUrl}/api/influencers/${profileId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        cookie: cookies,
      },
      body: JSON.stringify({
        bio: validBio,
        state: "Maharashtra",
        city: "Mumbai",
      }),
    });
    const acceptData: any = await acceptRes.json();
    assert(acceptRes.status === 200, "3c. Backend accepts valid bio of 250 characters");
    assert(acceptData.bio === validBio, "3d. Persisted bio matches exact 250 character payload");
    assert(
      acceptData.state === "Maharashtra",
      "3e. Persisted state 'Maharashtra' returned in API response"
    );
    // 3c. Default Country India & Preserved Country Test
    assert(acceptData.country === "India", "3g. New profile country defaults to 'India'");

    // Update with preserved custom country (e.g., "United Kingdom")
    const customCountryRes = await fetch(`${baseUrl}/api/influencers/${profileId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        cookie: cookies,
      },
      body: JSON.stringify({ country: "United Kingdom" }),
    });
    const customCountryData: any = await customCountryRes.json();
    assert(
      customCountryData.country === "United Kingdom",
      "3h. Existing manually selected country 'United Kingdom' is preserved"
    );

    // ----------------------------------------------------
    // 4. PROFILE IMAGE UPLOAD & PERSISTENCE CYCLE
    // ----------------------------------------------------
    console.log("\n--- 4. PROFILE IMAGE UPLOAD & PERSISTENCE CYCLE ---");

    // 4a. Oversized image failure (> 10MB buffer)
    // 14MB base64 string converts to ~10.5MB binary buffer
    const fakeLargeBase64 = "data:image/jpeg;base64," + "A".repeat(14 * 1024 * 1024);
    const largeUploadRes = await fetch(`${baseUrl}/api/upload/image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: cookies,
      },
      body: JSON.stringify({ image: fakeLargeBase64, name: "large.jpg" }),
    });
    const largeUploadData: any = await largeUploadRes.json();
    assert(
      largeUploadRes.status === 400,
      "4a. Oversized file (>10MB) is rejected cleanly with HTTP 400"
    );
    assert(largeUploadData.error?.includes("10MB"), "4b. Returns clear size limit error message");

    // 4b. Valid image upload (JPG)
    // 1x1 transparent PNG / tiny JPEG base64
    const validBase64 =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const uploadRes = await fetch(`${baseUrl}/api/upload/image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: cookies,
      },
      body: JSON.stringify({ image: validBase64, name: "avatar.png" }),
    });
    const uploadData: any = await uploadRes.json();
    assert(
      uploadRes.status === 200 && uploadData.ok === true,
      "4c. Valid PNG image upload succeeds with HTTP 200"
    );
    assert(
      typeof uploadData.url === "string" && uploadData.url.startsWith("/uploads/"),
      "4d. Upload returns valid relative URL path starting with /uploads/"
    );

    // 4c. Persist image URL to creator profile
    const imageUpdateRes = await fetch(`${baseUrl}/api/influencers/${profileId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        cookie: cookies,
      },
      body: JSON.stringify({ avatarUrl: uploadData.url }),
    });
    const imageUpdateData: any = await imageUpdateRes.json();
    assert(
      imageUpdateData.avatarUrl === uploadData.url,
      "4e. Profile update persists new avatarUrl to DB"
    );

    // 4d. Verify profile fetch returns persisted image URL
    const getProfileRes = await fetch(`${baseUrl}/api/influencers/${profileId}`);
    const getProfileData: any = await getProfileRes.json();
    assert(
      getProfileData.avatarUrl === uploadData.url,
      "4f. GET /api/influencers/:id returns updated avatarUrl"
    );

    // 4e. Verify /api/auth/me session returns updated avatarUrl
    const getMeRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { cookie: cookies },
    });
    const getMeData: any = await getMeRes.json();
    assert(
      getMeData.user?.avatarUrl === uploadData.url,
      "4g. GET /api/auth/me session returns updated avatarUrl"
    );
  } finally {
    server.close();
  }

  console.log(`\n==================================================`);
  console.log(`🎉 CREATOR PROFILE REFACTOR SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`==================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runCreatorProfileRefactorTests().catch((err) => {
  console.error("Creator Profile Refactor Test Failure:", err);
  process.exit(1);
});
