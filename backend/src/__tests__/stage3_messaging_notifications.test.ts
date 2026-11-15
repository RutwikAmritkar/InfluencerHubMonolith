import app from "../app";
import { db } from "@workspace/db";
import {
  user as userTable,
  brandsTable,
  influencersTable,
  campaignsTable,
  applicationsTable,
  dealsTable,
  conversationsTable,
  messagesTable,
  dealActivityTable,
  notificationsTable,
  session as sessionTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import http from "node:http";

async function runStage3TestSuite() {
  console.log("\n=======================================================");
  console.log("STAGE 3 TEST SUITE: MESSAGING, NOTIFICATIONS & ENTRY B HOOK");
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

  // Start HTTP server
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${address.port}/api`;

  async function makeRequest(method: string, path: string, body?: any, sessionToken?: string) {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
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
    } catch (_e) {}

    return { status: response.status, data };
  }

  async function createTestUser(role: "brand" | "influencer", name: string) {
    const email = `stage3.${role}.${Date.now()}.${Math.random().toString(36).substring(7)}@demo.com`;
    const userId = `usr_s3_${role}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    await db.insert(userTable).values({ id: userId, email, name, role, emailVerified: true });

    let brandId: number | undefined;
    let influencerId: number | undefined;

    if (role === "brand") {
      const [b] = await db
        .insert(brandsTable)
        .values({ userId, name: `${name} Brand`, industry: "Fashion" })
        .returning();
      brandId = b.id;
    } else {
      const [inf] = await db
        .insert(influencersTable)
        .values({ userId, category: "Fashion", country: "India" })
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

  // Setup Test Users
  const brand1 = await createTestUser("brand", "Velvet Studio");
  const creator1 = await createTestUser("influencer", "FashionAura");
  const brand2 = await createTestUser("brand", "Unauthorized Studio");

  // Create Campaign for Brand 1
  const [campaign1] = await db
    .insert(campaignsTable)
    .values({
      brandId: brand1.brandId!,
      title: "Autumn Collection Showcase",
      description: "Fashion showcase campaign",
      budget: 50000,
      platform: "Instagram",
      deadline: "2026-11-30",
    })
    .returning();

  // Creator 1 applies to Campaign 1
  const [app1] = await db
    .insert(applicationsTable)
    .values({
      campaignId: campaign1.id,
      influencerId: creator1.influencerId!,
      status: "pending",
      message: "Exited to work on this campaign!",
    })
    .returning();

  // TEST 1: Existing Application Logic Intact (PATCH application status)
  try {
    const patchRes = await makeRequest(
      "PATCH",
      `/applications/${app1.id}`,
      { status: "accepted" },
      brand1.token
    );
    assert(
      patchRes.status === 200,
      "1a. Existing application PATCH route accepts application (HTTP 200)"
    );
    assert(patchRes.data?.status === "accepted", "1b. Application status updated to 'accepted'");

    const [dbApp] = await db
      .select()
      .from(applicationsTable)
      .where(eq(applicationsTable.id, app1.id))
      .limit(1);
    assert(dbApp.status === "accepted", "1c. Database application status verified as 'accepted'");
  } catch (e: any) {
    assert(false, `1. Application PATCH test failed: ${e.message}`);
  }

  // TEST 2: Entry B "Open Deal Room" Security Guard
  try {
    // Brand 2 (unauthorized) attempts to open deal room for Brand 1's campaign application
    const resForbidden = await makeRequest(
      "POST",
      `/applications/${app1.id}/open-deal`,
      undefined,
      brand2.token
    );
    assert(
      resForbidden.status === 403,
      "2. Non-owner (Brand 2) blocked from opening deal room for Brand 1 application (HTTP 403)"
    );
  } catch (e: any) {
    assert(false, `2. Open deal room security test failed: ${e.message}`);
  }

  // TEST 3: Entry B "Open Deal Room" Creation & Idempotency
  let createdDealId: number = 0;
  try {
    const resOpen = await makeRequest(
      "POST",
      `/applications/${app1.id}/open-deal`,
      undefined,
      brand1.token
    );
    assert(
      resOpen.status === 200,
      "3a. Campaign owner opens Deal Room via POST /applications/:id/open-deal (HTTP 200)"
    );
    assert(Boolean(resOpen.data?.deal?.id), "3b. Deal room payload returned");
    assert(resOpen.data?.deal?.applicationId === app1.id, "3c. Deal room linked to applicationId");
    assert(resOpen.data?.deal?.campaignId === campaign1.id, "3d. Deal room linked to campaignId");

    createdDealId = resOpen.data.deal.id;

    // Call open-deal again for idempotency
    const resOpenAgain = await makeRequest(
      "POST",
      `/applications/${app1.id}/open-deal`,
      undefined,
      brand1.token
    );
    assert(resOpenAgain.status === 200, "3e. Repeat open-deal call succeeds");
    assert(
      resOpenAgain.data?.deal?.id === createdDealId,
      "3f. Repeat open-deal call yields exact SAME deal record (idempotency)"
    );
  } catch (e: any) {
    assert(false, `3. Open deal creation test failed: ${e.message}`);
  }

  // TEST 4: Messaging Integration & first_message_sent Analytics Event
  try {
    // Fetch deal detail to get conversationId
    const resDealDetail = await makeRequest(
      "GET",
      `/deals/${createdDealId}`,
      undefined,
      brand1.token
    );
    const convId = resDealDetail.data.conversationId;
    assert(Boolean(convId), "4a. Deal room conversation initialized and linked");

    // Brand 1 posts first message in deal room conversation
    const resMsg1 = await makeRequest(
      "POST",
      `/conversations/${convId}/messages`,
      { content: "Hello Creator, welcome to our deal room!" },
      brand1.token
    );
    assert(resMsg1.status === 201, "4b. First message posted in deal conversation (HTTP 201)");

    // Check deal activity log for first_message_sent
    const activities1 = await db
      .select()
      .from(dealActivityTable)
      .where(eq(dealActivityTable.dealId, createdDealId));
    const hasFirstMsgEvent = activities1.some((a) => a.action === "first_message_sent");
    assert(
      hasFirstMsgEvent,
      "4c. 'first_message_sent' action logged in deal_activity upon first message"
    );

    // Brand 1 posts second message
    const resMsg2 = await makeRequest(
      "POST",
      `/conversations/${convId}/messages`,
      { content: "Let us know if the timeline works for you." },
      brand1.token
    );
    assert(resMsg2.status === 201, "4d. Second message posted in deal conversation");

    const activities2 = await db
      .select()
      .from(dealActivityTable)
      .where(eq(dealActivityTable.dealId, createdDealId));
    const firstMsgEventsCount = activities2.filter((a) => a.action === "first_message_sent").length;
    assert(
      firstMsgEventsCount === 1,
      "4e. Exactly ONE 'first_message_sent' event logged (no duplicates on subsequent messages)"
    );
  } catch (e: any) {
    assert(false, `4. Messaging & activity event test failed: ${e.message}`);
  }

  server.close();

  console.log(`\nStage 3 Test Suite Results: ${passed} Passed, ${failed} Failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runStage3TestSuite().catch((err) => {
  console.error("Stage 3 Test Suite Error:", err);
  process.exit(1);
});
