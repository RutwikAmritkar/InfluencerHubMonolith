import app from "../app";
import { db } from "@workspace/db";
import {
  user as userTable,
  brandsTable,
  influencersTable,
  collaborationRequestsTable,
  dealsTable,
  dealParticipantsTable,
  dealTermsVersionsTable,
  dealActivityTable,
  session as sessionTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { setDealRoomFeatureFlag } from "../services/deal-creation.service";
import http from "node:http";

async function runStage1TestSuite() {
  console.log("\n=======================================================");
  console.log("STAGE 1 TEST SUITE: BACKEND CORE & COLLABORATION REQUESTS");
  console.log("=======================================================\n");

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

  // Start HTTP server for testing
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${address.port}/api`;

  const timestamp = Date.now();

  // Helper for requests
  async function makeRequest(method: string, path: string, body?: any, sessionToken?: string) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (sessionToken) {
      headers["Cookie"] = `better-auth.session_token=${sessionToken}`;
      headers["Authorization"] = `Bearer ${sessionToken}`;
    }

    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    let data: any = null;
    try {
      data = await response.json();
    } catch (_e) {
      // ignore
    }

    return { status: response.status, data };
  }

  // Helper to create test user & session
  async function createTestUser(role: "brand" | "influencer", name: string) {
    const email = `test.${role}.${Date.now()}.${Math.random().toString(36).substring(7)}@demo.com`;
    const userId = `usr_${role}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    await db.insert(userTable).values({
      id: userId,
      email,
      name,
      role,
      emailVerified: true,
    });

    let brandId: number | undefined;
    let influencerId: number | undefined;

    if (role === "brand") {
      const [b] = await db
        .insert(brandsTable)
        .values({
          userId,
          name: `${name} Corp`,
          industry: "Tech",
        })
        .returning();
      brandId = b.id;
    } else {
      const [inf] = await db
        .insert(influencersTable)
        .values({
          userId,
          category: "Lifestyle",
          country: "India",
        })
        .returning();
      influencerId = inf.id;
    }

    const token = `sess_${userId}`;
    await db.insert(sessionTable).values({
      id: `sess_id_${userId}`,
      userId,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return { userId, brandId, influencerId, token, email, name };
  }

  // Setup Test Data
  const brand1 = await createTestUser("brand", "Alpha Brand");
  const creator1 = await createTestUser("influencer", "Beta Creator");
  const brand2 = await createTestUser("brand", "Gamma Brand");
  const creator2 = await createTestUser("influencer", "Delta Creator");

  // TEST 1: Feature Flag Off
  try {
    setDealRoomFeatureFlag(false);
    const res = await makeRequest("GET", "/collaboration-requests", undefined, brand1.token);
    assert(res.status === 503, "1a. Feature flag OFF returns HTTP 503 Service Unavailable");
    assert(res.data?.error?.includes("disabled"), "1b. Returns disabled error message");
  } catch (e: any) {
    assert(false, `1. Feature flag test failed: ${e.message}`);
  } finally {
    setDealRoomFeatureFlag(true); // Re-enable
  }

  // TEST 2: Input Validation
  try {
    const res = await makeRequest(
      "POST",
      "/collaboration-requests",
      {
        influencerId: creator1.influencerId,
        // Missing title
        description: "Sample campaign",
        deliverables: [{ title: "Post", count: 1 }],
      },
      brand1.token
    );

    assert(res.status === 400, "2a. Invalid request payload returns HTTP 400 Bad Request");
    assert(res.data?.error?.includes("Title"), "2b. Error message specifies missing title field");
  } catch (e: any) {
    assert(false, `2. Input validation test failed: ${e.message}`);
  }

  // TEST 3: Successful Direct Collaboration Request Creation
  let createdRequestId: number = 0;
  try {
    const res = await makeRequest(
      "POST",
      "/collaboration-requests",
      {
        influencerId: creator1.influencerId,
        title: "Summer Social Campaign",
        description: "Promote new apparel line",
        deliverables: [{ title: "Instagram Reel", count: 1, description: "60s Reel video" }],
        budgetMinPaise: 2000000,
        budgetMaxPaise: 3500000,
        proposedTimeline: "2 Weeks",
        message: "We love your content!",
      },
      brand1.token
    );

    assert(
      res.status === 201,
      "3a. Direct collaboration request creation returns HTTP 201 Created"
    );
    assert(Boolean(res.data?.id), "3b. Response includes request ID");
    assert(res.data?.status === "pending", "3c. Initial status is 'pending'");
    createdRequestId = res.data.id;
  } catch (e: any) {
    assert(false, `3. Collaboration request creation failed: ${e.message}`);
  }

  // TEST 4: One Open Request Per Pair Rule
  try {
    const res = await makeRequest(
      "POST",
      "/collaboration-requests",
      {
        influencerId: creator1.influencerId,
        title: "Duplicate Campaign Request",
        description: "Second request",
        deliverables: [{ title: "Post", count: 1 }],
      },
      brand1.token
    );

    assert(
      res.status === 400,
      "4. Second open request for same brand-creator pair is rejected (HTTP 400)"
    );
    assert(
      res.data?.error?.includes("already exists"),
      "4b. Returns duplicate open request error message"
    );
  } catch (e: any) {
    assert(false, `4. One open request test failed: ${e.message}`);
  }

  // TEST 5: IDOR Security Tests
  try {
    // Brand 2 tries to GET Request 1 between Brand 1 and Creator 1
    const resGet = await makeRequest(
      "GET",
      `/collaboration-requests/${createdRequestId}`,
      undefined,
      brand2.token
    );
    assert(
      resGet.status === 403,
      "5a. Unauthorized user (Brand 2) blocked from viewing Request 1 (HTTP 403 Forbidden)"
    );

    // Creator 2 tries to ACCEPT Request 1
    const resAccept = await makeRequest(
      "POST",
      `/collaboration-requests/${createdRequestId}/accept`,
      undefined,
      creator2.token
    );
    assert(
      resAccept.status === 403,
      "5b. Unauthorized user (Creator 2) blocked from accepting Request 1 (HTTP 403 Forbidden)"
    );

    // Brand 2 tries to WITHDRAW Request 1
    const resWithdraw = await makeRequest(
      "POST",
      `/collaboration-requests/${createdRequestId}/withdraw`,
      undefined,
      brand2.token
    );
    assert(
      resWithdraw.status === 403,
      "5c. Unauthorized user (Brand 2) blocked from withdrawing Request 1 (HTTP 403 Forbidden)"
    );
  } catch (e: any) {
    assert(false, `5. IDOR test failed: ${e.message}`);
  }

  // TEST 6: Decline & 14-Day Cooldown
  let req2Id: number = 0;
  try {
    // Brand 1 creates request for Creator 2
    const resCreate = await makeRequest(
      "POST",
      "/collaboration-requests",
      {
        influencerId: creator2.influencerId,
        title: "Test Cooldown Campaign",
        description: "Testing decline cooldown",
        deliverables: [{ title: "Story", count: 2 }],
      },
      brand1.token
    );
    req2Id = resCreate.data.id;

    // Creator 2 declines request
    const resDecline = await makeRequest(
      "POST",
      `/collaboration-requests/${req2Id}/decline`,
      { declineReason: "Budget too low" },
      creator2.token
    );
    assert(resDecline.status === 200, "6a. Creator 2 declines request (HTTP 200 OK)");
    assert(resDecline.data.status === "declined", "6b. Request status updated to 'declined'");

    // Brand 1 attempts to immediately re-invite Creator 2
    const resReinvite = await makeRequest(
      "POST",
      "/collaboration-requests",
      {
        influencerId: creator2.influencerId,
        title: "Re-invite Immediately",
        description: "Trying again",
        deliverables: [{ title: "Story", count: 2 }],
      },
      brand1.token
    );

    assert(
      resReinvite.status === 422,
      "6c. Re-inviting within 14-day decline cooldown is rejected (HTTP 422 Unprocessable Entity)"
    );
    assert(
      resReinvite.data?.error?.includes("14 days"),
      "6d. Error message mentions 14-day cooldown"
    );
  } catch (e: any) {
    assert(false, `6. Cooldown test failed: ${e.message}`);
  }

  // TEST 7: Acceptance & Deal Creation + Concurrency
  try {
    // Parallel accept calls on createdRequestId (Creator 1 accepts)
    const [acceptRes1, acceptRes2] = await Promise.all([
      makeRequest(
        "POST",
        `/collaboration-requests/${createdRequestId}/accept`,
        undefined,
        creator1.token
      ),
      makeRequest(
        "POST",
        `/collaboration-requests/${createdRequestId}/accept`,
        undefined,
        creator1.token
      ),
    ]);

    assert(
      acceptRes1.status === 200 && acceptRes2.status === 200,
      "7a. Concurrent acceptance calls respond cleanly (HTTP 200)"
    );
    assert(
      Boolean(acceptRes1.data?.deal?.id),
      "7b. Deal room created and returned upon acceptance"
    );

    const dealId = acceptRes1.data.deal.id;
    assert(
      acceptRes2.data?.deal?.id === dealId,
      "7c. Parallel acceptance yields exact SAME deal record (idempotency)"
    );

    // Verify Database state
    const [dbDeal] = await db.select().from(dealsTable).where(eq(dealsTable.id, dealId)).limit(1);
    assert(Boolean(dbDeal), "7d. Deal record persisted in PostgreSQL 'deals' table");
    assert(
      dbDeal.agreementStatus === "TERMS_PROPOSED",
      "7e. Deal agreement status initialized to 'TERMS_PROPOSED'"
    );

    const participants = await db
      .select()
      .from(dealParticipantsTable)
      .where(eq(dealParticipantsTable.dealId, dealId));
    assert(
      participants.length === 2,
      "7f. Exactly two participants (brand & creator) added to deal"
    );

    const proposals = await db
      .select()
      .from(dealTermsVersionsTable)
      .where(eq(dealTermsVersionsTable.dealId, dealId));
    assert(
      proposals.length === 1 && proposals[0].version === 1,
      "7g. Version 1 proposal prefilled and persisted"
    );

    const activity = await db
      .select()
      .from(dealActivityTable)
      .where(eq(dealActivityTable.dealId, dealId));
    assert(
      activity.some((a) => a.action === "DEAL_ROOM_INITIALIZED"),
      "7h. 'DEAL_ROOM_INITIALIZED' activity log entry recorded"
    );
  } catch (e: any) {
    assert(false, `7. Acceptance & Concurrency test failed: ${e.message}`);
  }

  server.close();

  console.log(`\nStage 1 Test Suite Results: ${passed} Passed, ${failed} Failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runStage1TestSuite().catch((err) => {
  console.error("Stage 1 Test Suite Error:", err);
  process.exit(1);
});
