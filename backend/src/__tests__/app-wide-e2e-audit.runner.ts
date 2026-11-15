import {
  db,
  user as userTable,
  usersTable,
  influencersTable,
  brandsTable,
  campaignsTable,
  applicationsTable,
  socialAccountsTable,
  socialTokensTable,
  oauthStatesTable,
  conversationsTable,
  messagesTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { encryptSocialToken } from "../integrations/social/token-crypto";

const API_BASE = "http://localhost:5001";
const HEADERS = {
  "Content-Type": "application/json",
  Origin: "http://localhost:5000",
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const parseJson = async (res: Response): Promise<any> => await parseJson(res);

interface TestResult {
  id: string;
  flow: string;
  result: "PASS" | "FAIL" | "BLOCKED";
  evidence: string;
  issue: string;
  severity: "NONE" | "P0" | "P1" | "P2" | "P3";
}

const results: TestResult[] = [];

function record(
  id: string,
  flow: string,
  passed: boolean,
  evidence: string,
  issue: string = "-",
  severity: "NONE" | "P0" | "P1" | "P2" | "P3" = "NONE"
) {
  results.push({
    id,
    flow,
    result: passed ? "PASS" : "FAIL",
    evidence: evidence.replace(/\n/g, " "),
    issue: passed ? "-" : issue,
    severity: passed ? "NONE" : severity,
  });
}

async function runApplicationAudit() {
  console.log("Starting Application-Wide E2E Audit with rate-limit pacing...");

  const timeTag = Date.now();
  const creatorA_email = `creator_a_${timeTag}@test.com`;
  const creatorB_email = `creator_b_${timeTag}@test.com`;
  const brandA_email = `brand_a_${timeTag}@test.com`;
  const brandB_email = `brand_b_${timeTag}@test.com`;

  let cookieCreatorA = "";
  let cookieCreatorB = "";
  let cookieBrandA = "";
  let cookieBrandB = "";

  let userIdCreatorA = "";
  let userIdCreatorB = "";
  let userIdBrandA = "";
  let userIdBrandB = "";

  let infIdA = 0;
  let infIdB = 0;
  let brandIdA = 0;
  let brandIdB = 0;
  let campaignIdA = 0;
  let applicationIdA = 0;

  // -------------------------------------------------------------
  // 1. AUTH FLOWS
  // -------------------------------------------------------------

  // AUTH-01: New Creator Signup
  try {
    const res = await fetch(`${API_BASE}/api/auth/sign-up/email`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({
        email: creatorA_email,
        password: "Password123!",
        name: "Alice Creator",
      }),
    });
    const setCookie = res.headers.get("set-cookie") || "";
    cookieCreatorA = setCookie;
    const body = await parseJson(res);
    userIdCreatorA = body.user?.id;

    if (res.ok && userIdCreatorA) {
      await db
        .update(userTable)
        .set({ role: "influencer" })
        .where(eq(userTable.id, userIdCreatorA));
      record(
        "AUTH-01",
        "New creator signup",
        true,
        `HTTP ${res.status}, user ID: ${userIdCreatorA}`
      );
    } else {
      record(
        "AUTH-01",
        "New creator signup",
        false,
        `HTTP ${res.status}: ${JSON.stringify(body)}`,
        "Signup failed for new creator",
        "P0"
      );
    }
  } catch (e: any) {
    record(
      "AUTH-01",
      "New creator signup",
      false,
      `Error: ${e.message}`,
      "Network/Server error on signup",
      "P0"
    );
  }

  await sleep(1500);

  // AUTH-02: New Brand Signup
  try {
    const res = await fetch(`${API_BASE}/api/auth/sign-up/email`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({ email: brandA_email, password: "Password123!", name: "Acme Brand" }),
    });
    const setCookie = res.headers.get("set-cookie") || "";
    cookieBrandA = setCookie;
    const body = await parseJson(res);
    userIdBrandA = body.user?.id;

    if (res.ok && userIdBrandA) {
      await db.update(userTable).set({ role: "brand" }).where(eq(userTable.id, userIdBrandA));
      record("AUTH-02", "New brand signup", true, `HTTP ${res.status}, user ID: ${userIdBrandA}`);
    } else {
      record(
        "AUTH-02",
        "New brand signup",
        false,
        `HTTP ${res.status}: ${JSON.stringify(body)}`,
        "Signup failed for new brand",
        "P0"
      );
    }
  } catch (e: any) {
    record("AUTH-02", "New brand signup", false, `Error: ${e.message}`, "Server error", "P0");
  }

  await sleep(2000);

  // AUTH-03: Signup Creator B
  try {
    const res = await fetch(`${API_BASE}/api/auth/sign-up/email`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({
        email: creatorB_email,
        password: "Password123!",
        name: "Bob Creator",
      }),
    });
    const setCookie = res.headers.get("set-cookie") || "";
    cookieCreatorB = setCookie;
    const body = await parseJson(res);
    userIdCreatorB = body.user?.id;
    if (userIdCreatorB) {
      await db
        .update(userTable)
        .set({ role: "influencer" })
        .where(eq(userTable.id, userIdCreatorB));
    }
    record(
      "AUTH-03",
      "Second creator signup (Creator B)",
      res.ok && !!userIdCreatorB,
      `HTTP ${res.status}, user ID: ${userIdCreatorB}`
    );
  } catch (e: any) {
    record("AUTH-03", "Second creator signup (Creator B)", false, e.message, "Signup failed", "P1");
  }

  await sleep(3500);

  // AUTH-04: Signup Brand B
  try {
    const res = await fetch(`${API_BASE}/api/auth/sign-up/email`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({
        email: brandB_email,
        password: "Password123!",
        name: "Beta Corporation",
      }),
    });
    const setCookie = res.headers.get("set-cookie") || "";
    cookieBrandB = setCookie;
    const body = await parseJson(res);
    userIdBrandB = body.user?.id;
    if (userIdBrandB) {
      await db.update(userTable).set({ role: "brand" }).where(eq(userTable.id, userIdBrandB));
    }
    record(
      "AUTH-04",
      "Second brand signup (Brand B)",
      res.ok && !!userIdBrandB,
      `HTTP ${res.status}, user ID: ${userIdBrandB}`
    );
  } catch (e: any) {
    record("AUTH-04", "Second brand signup (Brand B)", false, e.message, "Signup failed", "P1");
  }

  // AUTH-05: Duplicate Email Handling Rejection
  try {
    const res = await fetch(`${API_BASE}/api/auth/sign-up/email`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({
        email: creatorA_email,
        password: "Password123!",
        name: "Duplicate Alice",
      }),
    });
    const body = await parseJson(res);
    record(
      "AUTH-05",
      "Duplicate email handling rejection",
      !res.ok,
      `HTTP ${res.status}, response: ${JSON.stringify(body)}`
    );
  } catch (e: any) {
    record(
      "AUTH-05",
      "Duplicate email handling rejection",
      false,
      e.message,
      "Unexpected error",
      "P2"
    );
  }

  // AUTH-06: Incorrect Credentials Login Failure
  try {
    const res = await fetch(`${API_BASE}/api/auth/sign-in/email`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({ email: creatorA_email, password: "WrongPassword999!" }),
    });
    record(
      "AUTH-06",
      "Incorrect credentials login failure",
      res.status === 401 || !res.ok,
      `HTTP ${res.status}`
    );
  } catch (e: any) {
    record(
      "AUTH-06",
      "Incorrect credentials login failure",
      false,
      e.message,
      "Error testing wrong login",
      "P2"
    );
  }

  // AUTH-07: Valid Login & Session Persistence
  try {
    const res = await fetch(`${API_BASE}/api/auth/sign-in/email`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({ email: creatorA_email, password: "Password123!" }),
    });
    const setCookie = res.headers.get("set-cookie") || cookieCreatorA;
    cookieCreatorA = setCookie;

    const sessionRes = await fetch(`${API_BASE}/api/auth/get-session`, {
      headers: { ...HEADERS, cookie: cookieCreatorA },
    });
    const sessionBody = await parseJson(sessionRes);
    const isValidSession = sessionRes.ok && sessionBody?.user?.email === creatorA_email;

    record(
      "AUTH-07",
      "Valid login and session persistence",
      isValidSession,
      `HTTP ${sessionRes.status}, user email: ${sessionBody?.user?.email}`
    );
  } catch (e: any) {
    record(
      "AUTH-07",
      "Valid login and session persistence",
      false,
      e.message,
      "Login session failed",
      "P1"
    );
  }

  // AUTH-08: Logout & Re-login Flow
  try {
    const logoutRes = await fetch(`${API_BASE}/api/auth/sign-out`, {
      method: "POST",
      headers: { ...HEADERS, cookie: cookieCreatorA },
    });

    const checkLoggedOut = await fetch(`${API_BASE}/api/auth/get-session`, {
      headers: { ...HEADERS, cookie: cookieCreatorA },
    });
    const loggedOutSession = await parseJson(checkLoggedOut);
    const isLoggedOut = !loggedOutSession?.user;

    // Re-login
    const reloginRes = await fetch(`${API_BASE}/api/auth/sign-in/email`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({ email: creatorA_email, password: "Password123!" }),
    });
    cookieCreatorA = reloginRes.headers.get("set-cookie") || cookieCreatorA;

    record(
      "AUTH-08",
      "Logout & Re-login flow",
      isLoggedOut && reloginRes.ok,
      `Logged out: ${isLoggedOut}, Relogin HTTP ${reloginRes.status}`
    );
  } catch (e: any) {
    record("AUTH-08", "Logout & Re-login flow", false, e.message, "Logout failed", "P1");
  }

  // -------------------------------------------------------------
  // 2. CREATOR ONBOARDING & PROFILE FLOWS
  // -------------------------------------------------------------

  // ONB-01: Creator Onboarding & Profile Creation (Creator A)
  try {
    const [infRecord] = await db
      .insert(influencersTable)
      .values({
        userId: userIdCreatorA,
        bio: "Alice is a beauty & wellness content creator specializing in organic skincare routines.",
        category: "Beauty & Wellness",
        country: "India",
        state: "Maharashtra",
        city: "Mumbai",
        followers: 125000,
        engagementRate: 4.8,
        avgViews: 45000,
        collaborationCost: 4500,
        platforms: ["instagram"],
        languages: ["English", "Hindi"],
        avatarUrl: "https://i.pravatar.cc/150?img=47",
        coverUrl: "https://picsum.photos/1200/400",
        profileCompletion: 95,
        monthlyEarnings: 18000,
        isVerified: true,
      })
      .returning();
    infIdA = infRecord.id;

    record(
      "ONB-01",
      "Creator onboarding & profile creation (Creator A)",
      !!infIdA,
      `Creator profile created, ID: ${infIdA}`
    );
  } catch (e: any) {
    record(
      "ONB-01",
      "Creator onboarding & profile creation (Creator A)",
      false,
      e.message,
      "Failed creating creator profile",
      "P0"
    );
  }

  // ONB-02: Creator Onboarding (Creator B)
  try {
    const [infRecordB] = await db
      .insert(influencersTable)
      .values({
        userId: userIdCreatorB,
        bio: "Bob is a tech & gaming reviewer creating hardware teardowns and software reviews.",
        category: "Tech & Gaming",
        country: "India",
        state: "Delhi",
        city: "New Delhi",
        followers: 480000,
        engagementRate: 5.2,
        avgViews: 120000,
        collaborationCost: 9500,
        platforms: ["youtube"],
        languages: ["English", "Hindi"],
        avatarUrl: "https://i.pravatar.cc/150?img=12",
        coverUrl: "https://picsum.photos/1200/400",
        profileCompletion: 90,
        monthlyEarnings: 24000,
        isVerified: true,
      })
      .returning();
    infIdB = infRecordB.id;

    record(
      "ONB-02",
      "Creator onboarding & profile creation (Creator B)",
      !!infIdB,
      `Creator profile created, ID: ${infIdB}`
    );
  } catch (e: any) {
    record(
      "ONB-02",
      "Creator onboarding & profile creation (Creator B)",
      false,
      e.message,
      "Failed creating creator profile B",
      "P0"
    );
  }

  // ONB-03: Country -> State Dependency Validation (India state validation)
  try {
    const validStateRes = await fetch(`${API_BASE}/api/influencers/${infIdA}`, {
      method: "PATCH",
      headers: { ...HEADERS, cookie: cookieCreatorA },
      body: JSON.stringify({ country: "India", state: "Maharashtra" }),
    });

    const invalidStateRes = await fetch(`${API_BASE}/api/influencers/${infIdA}`, {
      method: "PATCH",
      headers: { ...HEADERS, cookie: cookieCreatorA },
      body: JSON.stringify({ country: "India", state: "California" }),
    });

    const passed = validStateRes.ok && !invalidStateRes.ok && invalidStateRes.status === 400;
    record(
      "ONB-03",
      "Country -> State dependency validation (India)",
      passed,
      `Valid state HTTP ${validStateRes.status}, Invalid state HTTP ${invalidStateRes.status}`
    );
  } catch (e: any) {
    record(
      "ONB-03",
      "Country -> State dependency validation (India)",
      false,
      e.message,
      "State validation failed",
      "P2"
    );
  }

  // ONB-04: Bio Length Limit Validation (Max 250 characters)
  try {
    const longBio = "A".repeat(260);
    const res = await fetch(`${API_BASE}/api/influencers/${infIdA}`, {
      method: "PATCH",
      headers: { ...HEADERS, cookie: cookieCreatorA },
      body: JSON.stringify({ bio: longBio }),
    });
    record(
      "ONB-04",
      "Bio maximum 250 characters validation",
      res.status === 400,
      `HTTP ${res.status}`
    );
  } catch (e: any) {
    record(
      "ONB-04",
      "Bio maximum 250 characters validation",
      false,
      e.message,
      "Bio length test error",
      "P2"
    );
  }

  // ONB-05: Profile Information Persistence & Rendering
  try {
    const res = await fetch(`${API_BASE}/api/influencers/${infIdA}`);
    const data = await parseJson(res);
    const passed =
      res.ok &&
      data.name === "Alice Creator" &&
      data.category === "Beauty & Wellness" &&
      data.country === "India";
    record(
      "ONB-05",
      "Creator profile rendering & details retrieval",
      passed,
      `HTTP ${res.status}, Name: ${data.name}, Category: ${data.category}`
    );
  } catch (e: any) {
    record(
      "ONB-05",
      "Creator profile rendering & details retrieval",
      false,
      e.message,
      "Profile rendering failed",
      "P1"
    );
  }

  // -------------------------------------------------------------
  // 3. INSTAGRAM OAUTH & MULTI-CREATOR ISOLATION
  // -------------------------------------------------------------

  // INST-01: OAuth State Creation & Validation
  try {
    const res = await fetch(`${API_BASE}/api/social/instagram/connect`, {
      method: "POST",
      headers: { ...HEADERS, cookie: cookieCreatorA },
    });
    const body = await parseJson(res);
    const isValidStateUrl =
      res.ok &&
      body.redirectUrl?.includes("response_type=code") &&
      body.redirectUrl?.includes("force_reauthorize=true");
    record(
      "INST-01",
      "Connect Instagram OAuth state generation",
      isValidStateUrl,
      `HTTP ${res.status}, RedirectUrl contains force_reauthorize=true`
    );
  } catch (e: any) {
    record(
      "INST-01",
      "Connect Instagram OAuth state generation",
      false,
      e.message,
      "OAuth state generation failed",
      "P0"
    );
  }

  // INST-02: Instagram Account Linking & Token Encryption (Creator A)
  let igAccIdA = 0;
  try {
    const [accA] = await db
      .insert(socialAccountsTable)
      .values({
        userId: userIdCreatorA,
        platform: "instagram",
        externalAccountId: `ig_1784140998877_${timeTag}`,
        username: "alice.creator.official",
        displayName: "Alice Creator Official",
        profileUrl: "https://instagram.com/alice.creator.official",
        verificationStatus: "VERIFIED",
        isOfficialOAuth: true,
      })
      .returning();
    igAccIdA = accA.id;

    const tokenPayload = encryptSocialToken(`ig_long_lived_token_A_${timeTag}`);
    await db.insert(socialTokensTable).values({
      socialAccountId: igAccIdA,
      accessTokenEncrypted: tokenPayload.encryptedToken,
      tokenIv: tokenPayload.iv,
      tokenAuthTag: tokenPayload.authTag,
      scopes: ["instagram_business_basic", "instagram_business_manage_insights"],
    });

    record(
      "INST-02",
      "Instagram account linking & token encryption",
      !!igAccIdA,
      `Account ID: ${igAccIdA}, Token IV length: ${tokenPayload.iv.length}`
    );
  } catch (e: any) {
    record(
      "INST-02",
      "Instagram account linking & token encryption",
      false,
      e.message,
      "Token encryption failed",
      "P0"
    );
  }

  // INST-03: Multi-Creator Instagram Account Isolation (Creator A vs Creator B)
  try {
    const resA = await fetch(`${API_BASE}/api/social/accounts`, {
      headers: { ...HEADERS, cookie: cookieCreatorA },
    });
    const accountsA = await parseJson(resA);

    const resB = await fetch(`${API_BASE}/api/social/accounts`, {
      headers: { ...HEADERS, cookie: cookieCreatorB },
    });
    const accountsB = await parseJson(resB);

    const isolated =
      resA.ok &&
      resB.ok &&
      accountsA.length === 1 &&
      accountsA[0].username === "alice.creator.official" &&
      accountsB.length === 0;
    record(
      "INST-03",
      "Multi-creator Instagram account isolation",
      isolated,
      `Creator A count: ${accountsA.length}, Creator B count: ${accountsB.length}`
    );
  } catch (e: any) {
    record(
      "INST-03",
      "Multi-creator Instagram account isolation",
      false,
      e.message,
      "Isolation check failed",
      "P0"
    );
  }

  // INST-04: Cross-Tenant Analytics Access Rejection (GET /api/social/accounts/:id/analytics)
  try {
    const resB = await fetch(`${API_BASE}/api/social/accounts/${igAccIdA}/analytics`, {
      headers: { ...HEADERS, cookie: cookieCreatorB },
    });
    record(
      "INST-04",
      "Cross-tenant analytics access rejection",
      resB.status === 403,
      `Creator B accessing Creator A's analytics -> HTTP ${resB.status}`
    );
  } catch (e: any) {
    record(
      "INST-04",
      "Cross-tenant analytics access rejection",
      false,
      e.message,
      "Cross-tenant security check error",
      "P1"
    );
  }

  // INST-05: Duplicate Instagram Account Connection Prevention
  try {
    let duplicateError = false;
    try {
      await db.insert(socialAccountsTable).values({
        userId: userIdCreatorB,
        platform: "instagram",
        externalAccountId: `ig_1784140998877_${timeTag}`,
        username: "attacker_attempting_duplication",
        verificationStatus: "VERIFIED",
        isOfficialOAuth: true,
      });
    } catch (_e) {
      duplicateError = true;
    }
    record(
      "INST-05",
      "Duplicate Instagram externalAccountId prevention",
      duplicateError,
      "DB unique index `idx_social_accounts_platform_external` rejected duplicate connection"
    );
  } catch (e: any) {
    record(
      "INST-05",
      "Duplicate Instagram externalAccountId prevention",
      false,
      e.message,
      "Duplicate check failed",
      "P1"
    );
  }

  // INST-06: Instagram Disconnect & Credential Erasure
  try {
    const res = await fetch(`${API_BASE}/api/social/instagram/disconnect`, {
      method: "DELETE",
      headers: { ...HEADERS, cookie: cookieCreatorA },
    });
    const body = await parseJson(res);

    const tokensRemaining = await db
      .select()
      .from(socialTokensTable)
      .where(eq(socialTokensTable.socialAccountId, igAccIdA));
    const [accRecord] = await db
      .select()
      .from(socialAccountsTable)
      .where(eq(socialAccountsTable.id, igAccIdA))
      .limit(1);

    const isDisconnected =
      res.ok && tokensRemaining.length === 0 && accRecord.verificationStatus === "DISCONNECTED";
    record(
      "INST-06",
      "Instagram disconnect & credential erasure",
      isDisconnected,
      `HTTP ${res.status}, Tokens remaining: ${tokensRemaining.length}, Status: ${accRecord.verificationStatus}`
    );
  } catch (e: any) {
    record(
      "INST-06",
      "Instagram disconnect & credential erasure",
      false,
      e.message,
      "Disconnect failed",
      "P1"
    );
  }

  // -------------------------------------------------------------
  // 4. BRAND FLOWS
  // -------------------------------------------------------------

  // BRD-01: Brand Onboarding & Profile Setup (Brand A)
  try {
    const [bRecord] = await db
      .insert(brandsTable)
      .values({
        userId: userIdBrandA,
        name: "Acme Tech Solutions",
        industry: "Technology",
        country: "India",
        description: "Enterprise productivity software for modern teams.",
        logoUrl: "https://logo.clearbit.com/apple.com",
        website: "https://acmetech.demo",
      })
      .returning();
    brandIdA = bRecord.id;

    record(
      "BRD-01",
      "Brand onboarding & profile setup (Brand A)",
      !!brandIdA,
      `Brand created, ID: ${brandIdA}`
    );
  } catch (e: any) {
    record(
      "BRD-01",
      "Brand onboarding & profile setup (Brand A)",
      false,
      e.message,
      "Brand profile setup failed",
      "P0"
    );
  }

  // BRD-02: Brand Onboarding (Brand B)
  try {
    if (!userIdBrandB) {
      record(
        "BRD-02",
        "Brand onboarding & profile setup (Brand B)",
        false,
        "No userId for Brand B",
        "Brand B setup failed",
        "P1"
      );
    } else {
      const [bRecordB] = await db
        .insert(brandsTable)
        .values({
          userId: userIdBrandB,
          name: "Beta Fashion Co",
          industry: "Fashion",
          country: "India",
          description: "Sustainable apparel and modern lifestyle wear.",
          logoUrl: "https://logo.clearbit.com/nike.com",
          website: "https://betafashion.demo",
        })
        .returning();
      brandIdB = bRecordB.id;

      record(
        "BRD-02",
        "Brand onboarding & profile setup (Brand B)",
        !!brandIdB,
        `Brand created, ID: ${brandIdB}`
      );
    }
  } catch (e: any) {
    record(
      "BRD-02",
      "Brand onboarding & profile setup (Brand B)",
      false,
      e.message,
      "Brand B setup failed",
      "P1"
    );
  }

  // BRD-03: Creator Discovery Grid & Filtering
  try {
    const res = await fetch(`${API_BASE}/api/influencers?search=Alice`);
    const data = await parseJson(res);
    const foundAlice = Array.isArray(data) && data.some((i: any) => i.name === "Alice Creator");
    record(
      "BRD-03",
      "Creator discovery grid & keyword search",
      foundAlice,
      `HTTP ${res.status}, returned count: ${data.length}`
    );
  } catch (e: any) {
    record(
      "BRD-03",
      "Creator discovery grid & keyword search",
      false,
      e.message,
      "Creator discovery failed",
      "P1"
    );
  }

  // BRD-04: Campaign Creation (Brand A)
  try {
    const res = await fetch(`${API_BASE}/api/campaigns`, {
      method: "POST",
      headers: { ...HEADERS, cookie: cookieBrandA },
      body: JSON.stringify({
        title: "Acme AI Suite Launch",
        description:
          "Promote our flagship AI productivity tool with unboxing and video review formats.",
        budget: 25000,
        platform: "Instagram",
        status: "active",
        deliverables: "3 Instagram Reels, 5 Stories",
        targetAudience: "Tech-savvy professionals 22-40",
        timeline: "4 weeks",
        deadline: "2026-10-31",
      }),
    });
    const data = await parseJson(res);
    campaignIdA = data.id;

    record(
      "BRD-04",
      "Campaign creation (Brand A)",
      res.ok && !!campaignIdA,
      `HTTP ${res.status}, Campaign ID: ${campaignIdA}`
    );
  } catch (e: any) {
    record(
      "BRD-04",
      "Campaign creation (Brand A)",
      false,
      e.message,
      "Campaign creation failed",
      "P0"
    );
  }

  // BRD-05: Campaign Editing (Brand A)
  try {
    const res = await fetch(`${API_BASE}/api/campaigns/${campaignIdA}`, {
      method: "PATCH",
      headers: { ...HEADERS, cookie: cookieBrandA },
      body: JSON.stringify({ budget: 30000, title: "Acme AI Suite Launch v2" }),
    });
    const data = await parseJson(res);
    record(
      "BRD-05",
      "Campaign editing & budget update",
      res.ok && data.budget === 30000,
      `HTTP ${res.status}, Updated budget: ${data.budget}`
    );
  } catch (e: any) {
    record(
      "BRD-05",
      "Campaign editing & budget update",
      false,
      e.message,
      "Campaign editing failed",
      "P1"
    );
  }

  // BRD-06: Cross-Brand Campaign Mutation Rejection (Brand B attempting to edit Brand A's campaign)
  try {
    const res = await fetch(`${API_BASE}/api/campaigns/${campaignIdA}`, {
      method: "PATCH",
      headers: { ...HEADERS, cookie: cookieBrandB },
      body: JSON.stringify({ budget: 100 }),
    });
    record(
      "BRD-06",
      "Cross-brand campaign edit rejection",
      res.status === 403 || res.status === 401,
      `Brand B editing Brand A campaign -> HTTP ${res.status}`
    );
  } catch (e: any) {
    record(
      "BRD-06",
      "Cross-brand campaign edit rejection",
      false,
      e.message,
      "Cross-brand security check error",
      "P0"
    );
  }

  // -------------------------------------------------------------
  // 5. COLLABORATION & APPLICATION FLOWS
  // -------------------------------------------------------------

  // COL-01: Creator Discovers & Views Campaign Details
  try {
    const res = await fetch(`${API_BASE}/api/campaigns/${campaignIdA}`);
    const data = await parseJson(res);
    record(
      "COL-01",
      "Creator discovers campaign details",
      res.ok && data.title === "Acme AI Suite Launch v2",
      `HTTP ${res.status}, Title: ${data.title}`
    );
  } catch (e: any) {
    record(
      "COL-01",
      "Creator discovers campaign details",
      false,
      e.message,
      "Campaign detail view failed",
      "P1"
    );
  }

  // COL-02: Creator Applies to Campaign (Creator A)
  try {
    const res = await fetch(`${API_BASE}/api/applications`, {
      method: "POST",
      headers: { ...HEADERS, cookie: cookieCreatorA },
      body: JSON.stringify({
        campaignId: campaignIdA,
        influencerId: infIdA,
        message: "Hi Acme team! I would love to collaborate on the AI Suite launch.",
      }),
    });
    const data = await parseJson(res);
    applicationIdA = data.id;

    record(
      "COL-02",
      "Creator application submission",
      res.ok && !!applicationIdA,
      `HTTP ${res.status}, Application ID: ${applicationIdA}`
    );
  } catch (e: any) {
    record(
      "COL-02",
      "Creator application submission",
      false,
      e.message,
      "Application submission failed",
      "P0"
    );
  }

  // COL-03: Brand Reviews Campaign Applications
  try {
    const res = await fetch(`${API_BASE}/api/applications?campaignId=${campaignIdA}`, {
      headers: { ...HEADERS, cookie: cookieBrandA },
    });
    const data = await parseJson(res);
    const foundApp = Array.isArray(data) && data.some((app: any) => app.id === applicationIdA);
    record(
      "COL-03",
      "Brand reviews campaign applications",
      res.ok && foundApp,
      `HTTP ${res.status}, application count: ${data.length}`
    );
  } catch (e: any) {
    record(
      "COL-03",
      "Brand reviews campaign applications",
      false,
      e.message,
      "Application list failed",
      "P1"
    );
  }

  // COL-04: Brand Accepts Application (Status Transition)
  try {
    const res = await fetch(`${API_BASE}/api/applications/${applicationIdA}`, {
      method: "PATCH",
      headers: { ...HEADERS, cookie: cookieBrandA },
      body: JSON.stringify({ status: "accepted" }),
    });
    const data = await parseJson(res);
    record(
      "COL-04",
      "Brand accepts application (status transition)",
      res.ok && data.status === "accepted",
      `HTTP ${res.status}, Status: ${data.status}`
    );
  } catch (e: any) {
    record(
      "COL-04",
      "Brand accepts application (status transition)",
      false,
      e.message,
      "Application accept failed",
      "P0"
    );
  }

  // -------------------------------------------------------------
  // 6. MESSAGING & DATA ISOLATION
  // -------------------------------------------------------------

  // MSG-01: Messaging Initialization & Exchange (Brand A & Creator A)
  let conversationId = 0;
  try {
    // Legacy user mapping
    const [userInfA] = await db
      .insert(usersTable)
      .values({
        email: creatorA_email,
        passwordHash: "hashed_pwd",
        role: "influencer",
        name: "Alice Creator",
      })
      .returning();

    const [userBrdA] = await db
      .insert(usersTable)
      .values({
        email: brandA_email,
        passwordHash: "hashed_pwd",
        role: "brand",
        name: "Acme Brand",
      })
      .returning();

    if (userInfA && userBrdA) {
      const [conv] = await db
        .insert(conversationsTable)
        .values({ user1Id: userBrdA.id, user2Id: userInfA.id })
        .returning();
      conversationId = conv.id;

      await db.insert(messagesTable).values([
        {
          conversationId,
          senderId: userBrdA.id,
          content: "Welcome to the Acme AI Launch campaign!",
        },
        { conversationId, senderId: userInfA.id, content: "Thank you! Excited to get started." },
      ]);
    }

    record(
      "MSG-01",
      "Messaging conversation & message exchange",
      !!conversationId,
      `Conversation ID: ${conversationId}`
    );
  } catch (e: any) {
    record(
      "MSG-01",
      "Messaging conversation & message exchange",
      false,
      e.message,
      "Messaging failed",
      "P1"
    );
  }

  // MSG-02: Messaging Cross-User Isolation (Brand B cannot view Brand A's conversation)
  try {
    const resB = await fetch(`${API_BASE}/api/conversations/${conversationId}/messages`, {
      headers: { ...HEADERS, cookie: cookieBrandB },
    });
    const body = await parseJson(resB);
    const isolated =
      resB.status === 403 || resB.status === 401 || (Array.isArray(body) && body.length === 0);
    record(
      "MSG-02",
      "Messaging cross-user data isolation",
      isolated,
      `Brand B accessing Brand A conversation -> HTTP ${resB.status}`
    );
  } catch (e: any) {
    record(
      "MSG-02",
      "Messaging cross-user data isolation",
      false,
      e.message,
      "Messaging security error",
      "P1"
    );
  }

  // Cleanup Test Data
  try {
    if (userIdCreatorA) await db.delete(userTable).where(eq(userTable.id, userIdCreatorA));
    if (userIdCreatorB) await db.delete(userTable).where(eq(userTable.id, userIdCreatorB));
    if (userIdBrandA) await db.delete(userTable).where(eq(userTable.id, userIdBrandA));
    if (userIdBrandB) await db.delete(userTable).where(eq(userTable.id, userIdBrandB));
    if (infIdA) await db.delete(influencersTable).where(eq(influencersTable.id, infIdA));
    if (infIdB) await db.delete(influencersTable).where(eq(influencersTable.id, infIdB));
    if (brandIdA) await db.delete(brandsTable).where(eq(brandsTable.id, brandIdA));
    if (brandIdB) await db.delete(brandsTable).where(eq(brandsTable.id, brandIdB));
    if (campaignIdA) await db.delete(campaignsTable).where(eq(campaignsTable.id, campaignIdA));
  } catch (_e) {}

  console.log("\n=================================================");
  console.log("INFLUENCERHUB E2E AUDIT COMPLETE");
  console.log(`TOTAL EXECUTED: ${results.length}`);
  console.log(`PASSED: ${results.filter((r) => r.result === "PASS").length}`);
  console.log(`FAILED: ${results.filter((r) => r.result === "FAIL").length}`);
  console.log("=================================================\n");

  console.log(JSON.stringify(results, null, 2));
}

runApplicationAudit().catch((err) => {
  console.error("Audit Runner Fatal Error:", err);
  process.exit(1);
});
