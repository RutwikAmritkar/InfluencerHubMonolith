import app from "../app";
import { db } from "@workspace/db";
import {
  user as userTable,
  brandsTable,
  influencersTable,
  dealsTable,
  dealParticipantsTable,
  dealTermsVersionsTable,
  dealApprovalsTable,
  dealActivityTable,
  session as sessionTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { computeCanonicalTermsHash } from "../services/deal-proposal.service";
import http from "node:http";

async function runSprint2TestSuite() {
  console.log("\n=======================================================");
  console.log("SPRINT 2 TEST SUITE: BIDIRECTIONAL DEALS & NEGOTIATION");
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

  // Start temporary test HTTP server
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
    const email = `sprint2.${role}.${Date.now()}.${Math.random().toString(36).substring(7)}@test.com`;
    const userId = `usr_sp2_${role}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    await db.insert(userTable).values({ id: userId, email, name, role, emailVerified: true });

    let brandId: number | undefined;
    let influencerId: number | undefined;

    if (role === "brand") {
      const [b] = await db
        .insert(brandsTable)
        .values({ userId, name: `${name} Brand`, industry: "Cosmetics" })
        .returning();
      brandId = b.id;
    } else {
      const [inf] = await db
        .insert(influencersTable)
        .values({ userId, category: "Beauty", country: "India" })
        .returning();
      influencerId = inf.id;
    }

    const token = `sess_${userId}`;
    await db.insert(sessionTable).values({
      id: `sess_id_${userId}`,
      userId,
      token,
      expiresAt: new Date(Date.now() + 86400000),
    });

    return { userId, email, name, role, brandId, influencerId, token };
  }

  const creatorUser = await createTestUser("influencer", "Maya Creator");
  const brandUser = await createTestUser("brand", "Glow Cosmetics");

  let createdDealId: number = 0;
  let v1ProposalId: number = 0;

  // ─── TEST 1: Creator-Initiated Hybrid Deal Creation (v1) ─────────────────
  try {
    const resCreate = await makeRequest(
      "POST",
      "/deals",
      {
        brandId: brandUser.brandId,
        title: "Festive Serum Launch & Review Reel",
        collabType: "hybrid",
        price: 35000, // ₹35,000 cash
        deliverables: [
          {
            title: "1x 9:16 IG Reel",
            platform: "Instagram",
            contentType: "Instagram Reels",
            quantity: 1,
            specs: "60s high retention review with product unboxing",
            publishingRequirement: "Collaborator tag + pinned comment",
          },
          {
            title: "2x IG Stories",
            platform: "Instagram",
            contentType: "Instagram Stories",
            quantity: 2,
            specs: "Swipe up link to festive sale",
          },
        ],
        barterDetails: {
          productDescription: "1x Full Glow Hydration Box Set (3 products)",
          quantity: 1,
          estimatedValuePaise: 450000, // ₹4,500 product value
          shippingBy: "brand",
        },
        timelines: {
          startDate: "2026-11-20",
          productDeliveryDate: "2026-11-23",
          contentSubmissionDate: "2026-11-27",
          publishingDate: "2026-11-30",
        },
        usageRightsDays: 60,
        exclusivityDays: 14,
        revisionCount: 2,
        paidAdsPermission: true,
        notes: "Festive themed video with creator styling.",
      },
      creatorUser.token
    );

    assert(resCreate.status === 201, "1a. Creator initiates deal via POST /api/deals (HTTP 201)");
    assert(Boolean(resCreate.data?.id), "1b. Deal ID generated in response");
    assert(resCreate.data?.activeProposal?.version === 1, "1c. Initial version is v1");
    assert(
      resCreate.data?.activeProposal?.proposedByParty === "creator",
      "1d. proposedByParty is 'creator'"
    );
    assert(resCreate.data?.activeProposal?.collabType === "hybrid", "1e. collabType is 'hybrid'");
    assert(
      resCreate.data?.activeProposal?.pricePaise === 3500000,
      "1f. pricePaise correctly stored as 35,00,000 paise (₹35,000)"
    );
    assert(
      Boolean(resCreate.data?.activeProposal?.termsHash),
      "1g. Canonical SHA-256 termsHash calculated"
    );

    createdDealId = resCreate.data.id;
    v1ProposalId = resCreate.data.activeProposal.id;
  } catch (e: any) {
    assert(false, `1. Creator-initiated deal test failed: ${e.message}`);
  }

  // ─── TEST 2: Optimistic Locking 409 Guard ────────────────────────────────
  try {
    // Attempt counter-proposal with invalid baseProposalId (e.g. 999999)
    const resStale = await makeRequest(
      "POST",
      `/deals/${createdDealId}/proposals`,
      {
        baseProposalId: 999999, // Stale/mismatched ID
        price: 40000,
        deliverables: [{ title: "1x Reel", count: 1 }],
      },
      brandUser.token
    );

    assert(resStale.status === 409, "2a. Stale baseProposalId is rejected with HTTP 409 Conflict");
    assert(
      resStale.data?.error?.includes("STALE_PROPOSAL"),
      "2b. Error message identifies STALE_PROPOSAL guard"
    );
  } catch (e: any) {
    assert(false, `2. Optimistic locking guard test failed: ${e.message}`);
  }

  // ─── TEST 3: Brand Counter-Proposal (v2) ─────────────────────────────────
  let v2ProposalVersion: number = 0;
  try {
    const resCounter = await makeRequest(
      "POST",
      `/deals/${createdDealId}/proposals`,
      {
        baseProposalId: v1ProposalId,
        baseVersion: 1,
        dealTitle: "Festive Serum Launch & Review Reel (Brand Counter)",
        collabType: "hybrid",
        price: 38000, // Brand counters with ₹38,000 cash
        deliverables: [
          {
            title: "1x 9:16 IG Reel",
            count: 1,
            specs: "60s review with product unboxing and first 3s hook",
          },
          {
            title: "3x IG Stories",
            count: 3,
            specs: "Includes link stickers and promo code",
          },
        ],
        barterDetails: {
          productDescription: "1x Full Glow Hydration Box Set + 1x Night Serum (4 items)",
          quantity: 1,
          estimatedValuePaise: 600000,
          shippingBy: "brand",
        },
        usageRightsDays: 60,
        exclusivityDays: 14,
        revisionCount: 2,
        paidAdsPermission: true,
        notes: "Added 1 additional story and increased compensation to ₹38,000.",
      },
      brandUser.token
    );

    assert(
      resCounter.status === 201,
      "3a. Brand counter-proposal submitted via POST /api/deals/:id/proposals (HTTP 201)"
    );
    assert(resCounter.data?.version === 2, "3b. Counter proposal version is v2");
    assert(resCounter.data?.proposedByParty === "brand", "3c. Counter proposedByParty is 'brand'");
    assert(
      resCounter.data?.pricePaise === 3800000,
      "3d. Counter price is 38,00,000 paise (₹38,000)"
    );

    v2ProposalVersion = resCounter.data.version;
  } catch (e: any) {
    assert(false, `3. Brand counter-proposal test failed: ${e.message}`);
  }

  // ─── TEST 4: Bilateral Acceptance & Deal Locking ─────────────────────────
  try {
    // Step 4a: Brand signs v2
    const resBrandSign = await makeRequest(
      "POST",
      `/deals/${createdDealId}/confirm`,
      { proposalVersion: v2ProposalVersion },
      brandUser.token
    );
    assert(resBrandSign.status === 200, "4a. Brand signs v2 (HTTP 200)");
    assert(
      resBrandSign.data?.confirmed === false,
      "4b. Deal not fully confirmed yet (waiting on Creator)"
    );
    assert(
      resBrandSign.data?.agreementStatus === "AWAITING_CREATOR_APPROVAL",
      "4c. Agreement status is AWAITING_CREATOR_APPROVAL"
    );

    // Step 4b: Creator signs v2
    const resCreatorSign = await makeRequest(
      "POST",
      `/deals/${createdDealId}/confirm`,
      { proposalVersion: v2ProposalVersion },
      creatorUser.token
    );
    assert(resCreatorSign.status === 200, "4d. Creator signs v2 (HTTP 200)");
    assert(
      resCreatorSign.data?.confirmed === true,
      "4e. Deal is fully confirmed (both parties signed)"
    );
    assert(
      resCreatorSign.data?.agreementStatus === "ACCEPTED",
      "4f. Agreement status transitioned to 'ACCEPTED'"
    );

    // Step 4c: Fetch deal detail to verify final status
    const resFinal = await makeRequest(
      "GET",
      `/deals/${createdDealId}`,
      undefined,
      creatorUser.token
    );
    assert(
      resFinal.data?.agreementStatus === "ACCEPTED",
      "4g. GET /deals/:id confirms agreementStatus is 'ACCEPTED'"
    );
    assert(Boolean(resFinal.data?.confirmedAt), "4h. confirmedAt timestamp is populated");
    assert(
      resFinal.data?.approvals?.length === 2,
      "4i. Exactly 2 bilateral approvals recorded with identical canonical hash"
    );
  } catch (e: any) {
    assert(false, `4. Bilateral acceptance test failed: ${e.message}`);
  }

  server.close();

  console.log(`\nSprint 2 Test Suite Results: ${passed} Passed, ${failed} Failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runSprint2TestSuite().catch((err) => {
  console.error("Sprint 2 Test Suite Error:", err);
  process.exit(1);
});
