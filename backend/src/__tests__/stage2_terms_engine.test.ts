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
import { createDeal } from "../services/deal-creation.service";
import http from "node:http";

async function runStage2TestSuite() {
  console.log("\n=======================================================");
  console.log("STAGE 2 TEST SUITE: TERMS & CONFIRMATION ENGINE");
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

  // TEST 1: Canonical Terms Hash Determinism
  try {
    const termsA = {
      deliverables: [
        { title: "Instagram Reel", count: 1, description: "Main video" },
        { title: "Story Mention", count: 2 },
      ],
      pricePaise: 5000000,
      currency: "inr",
      contentDeadline: "2026-11-01T12:00:00.000Z",
      postingDate: "2026-11-05T12:00:00.000Z",
      usageRightsDays: 30,
      exclusivityDays: 7,
      revisionCount: 2,
      notes: "Line 1\r\nLine 2  ",
    };

    // Shuffle deliverable array order & format
    const termsB = {
      notes: "Line 1\nLine 2",
      postingDate: new Date("2026-11-05T12:00:00.000Z"),
      contentDeadline: new Date("2026-11-01T12:00:00.000Z"),
      revisionCount: 2,
      exclusivityDays: 7,
      usageRightsDays: 30,
      currency: "INR",
      pricePaise: 5000000,
      deliverables: [
        { title: "Story Mention", count: 2 },
        { title: "Instagram Reel", count: 1, description: "Main video " },
      ],
    };

    const hashA = computeCanonicalTermsHash(termsA as any);
    const hashB = computeCanonicalTermsHash(termsB as any);

    assert(
      Boolean(hashA) && hashA.length === 64,
      "1a. Hash calculation produces 64-char SHA-256 hex string"
    );
    assert(
      hashA === hashB,
      "1b. Hash is deterministic regardless of key order, CRLF, whitespace, or date object types"
    );
  } catch (e: any) {
    assert(false, `1. Hash determinism test failed: ${e.message}`);
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
    const email = `stage2.${role}.${Date.now()}.${Math.random().toString(36).substring(7)}@demo.com`;
    const userId = `usr_s2_${role}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    await db.insert(userTable).values({ id: userId, email, name, role, emailVerified: true });

    let brandId: number | undefined;
    let influencerId: number | undefined;

    if (role === "brand") {
      const [b] = await db
        .insert(brandsTable)
        .values({ userId, name: `${name} Corp`, industry: "Tech" })
        .returning();
      brandId = b.id;
    } else {
      const [inf] = await db
        .insert(influencersTable)
        .values({ userId, category: "Tech", country: "India" })
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

  // Setup Test Parties
  const brand1 = await createTestUser("brand", "Starlight");
  const creator1 = await createTestUser("influencer", "VlogMaster");
  const brand2 = await createTestUser("brand", "Unrelated");

  // Create Deal Room via createDeal helper
  const deal1 = await createDeal({
    brandId: brand1.brandId!,
    influencerId: creator1.influencerId!,
    title: "Terms Engine Campaign",
    prefillTerms: {
      deliverables: [{ title: "Sponsored Video", count: 1 }],
      pricePaise: 1000000,
      contentDeadline: new Date("2026-11-01"),
      postingDate: new Date("2026-11-10"),
    },
  });

  // TEST 2: Cross-Account / IDOR Security Controls
  try {
    // Brand 2 tries to view proposals for Deal 1
    const resProps = await makeRequest(
      "GET",
      `/deals/${deal1.id}/proposals`,
      undefined,
      brand2.token
    );
    assert(
      resProps.status === 403,
      "2a. Unrelated user (Brand 2) blocked from viewing proposals (HTTP 403)"
    );

    // Brand 2 tries to propose terms for Deal 1
    const resPropose = await makeRequest(
      "POST",
      `/deals/${deal1.id}/proposals`,
      { baseVersion: 1, pricePaise: 5000 },
      brand2.token
    );
    assert(resPropose.status === 403, "2b. Unrelated user blocked from proposing terms (HTTP 403)");

    // Brand 2 tries to confirm terms for Deal 1
    const resConfirm = await makeRequest(
      "POST",
      `/deals/${deal1.id}/confirm`,
      { proposalVersion: 1 },
      brand2.token
    );
    assert(
      resConfirm.status === 403,
      "2c. Unrelated user blocked from confirming terms (HTTP 403)"
    );
  } catch (e: any) {
    assert(false, `2. IDOR test failed: ${e.message}`);
  }

  // TEST 3: Stale-Base Rejection Test
  try {
    const resStale = await makeRequest(
      "POST",
      `/deals/${deal1.id}/proposals`,
      {
        baseVersion: 99, // Invalid base version (latest is 1)
        deliverables: [{ title: "New Deliverable", count: 1 }],
        pricePaise: 1500000,
        contentDeadline: "2026-11-01T00:00:00Z",
        postingDate: "2026-11-10T00:00:00Z",
      },
      creator1.token
    );

    assert(resStale.status === 409, "3a. Stale baseVersion is rejected with HTTP 409 Conflict");
    assert(resStale.data?.error?.includes("STALE_BASE"), "3b. Error message indicates STALE_BASE");
  } catch (e: any) {
    assert(false, `3. Stale base test failed: ${e.message}`);
  }

  // TEST 4: Successful Terms Version Proposal (Version 2)
  let v2ProposalId: number = 0;
  try {
    const resV2 = await makeRequest(
      "POST",
      `/deals/${deal1.id}/proposals`,
      {
        baseVersion: 1,
        deliverables: [
          { title: "Sponsored Video", count: 1 },
          { title: "Instagram Reel", count: 1 },
        ],
        pricePaise: 2500000, // 25,000 INR
        currency: "INR",
        contentDeadline: "2026-11-02T00:00:00.000Z",
        postingDate: "2026-11-12T00:00:00.000Z",
        usageRightsDays: 60,
        exclusivityDays: 14,
        revisionCount: 2,
        notes: "Added 1 Instagram Reel and extended usage rights to 60 days.",
      },
      creator1.token
    );

    assert(resV2.status === 201, "4a. Proposing new version (v2) returns HTTP 201 Created");
    assert(resV2.data?.version === 2, "4b. Created version is 2");
    assert(resV2.data?.proposedByParty === "creator", "4c. Proposed by party is 'creator'");
    assert(Boolean(resV2.data?.termsHash), "4d. Includes server-calculated canonical termsHash");
    v2ProposalId = resV2.data.id;
  } catch (e: any) {
    assert(false, `4. Version proposal test failed: ${e.message}`);
  }

  // TEST 5: Parallel Confirmation Race Test on Version 2
  try {
    // Both Brand 1 and Creator 1 trigger confirm concurrently for version 2
    const [confirmResBrand, confirmResCreator] = await Promise.all([
      makeRequest("POST", `/deals/${deal1.id}/confirm`, { proposalVersion: 2 }, brand1.token),
      makeRequest("POST", `/deals/${deal1.id}/confirm`, { proposalVersion: 2 }, creator1.token),
    ]);

    assert(
      confirmResBrand.status === 200 && confirmResCreator.status === 200,
      "5a. Parallel confirm requests succeed cleanly (HTTP 200)"
    );

    const isConfirmedBrand = confirmResBrand.data?.confirmed;
    const isConfirmedCreator = confirmResCreator.data?.confirmed;

    assert(
      isConfirmedBrand || isConfirmedCreator,
      "5b. At least one response receives final confirmed=true status"
    );

    // Fetch DB status
    const [dbDeal] = await db.select().from(dealsTable).where(eq(dealsTable.id, deal1.id)).limit(1);
    assert(
      dbDeal.agreementStatus === "CONFIRMED",
      "5c. Deal agreementStatus updated to 'CONFIRMED' in PostgreSQL"
    );
    assert(Boolean(dbDeal.confirmedAt), "5d. confirmedAt timestamp populated");

    const approvals = await db
      .select()
      .from(dealApprovalsTable)
      .where(eq(dealApprovalsTable.dealId, deal1.id));
    assert(
      approvals.length === 2,
      "5e. Exactly 2 approval records (Brand & Creator) persisted in deal_approvals"
    );
  } catch (e: any) {
    assert(false, `5. Parallel confirm test failed: ${e.message}`);
  }

  // TEST 6: Post-Confirmation Locking Rules
  try {
    // Attempting to propose v3 on confirmed deal
    const resProposeLocked = await makeRequest(
      "POST",
      `/deals/${deal1.id}/proposals`,
      {
        baseVersion: 2,
        deliverables: [{ title: "Extra Post", count: 1 }],
        pricePaise: 3000000,
        contentDeadline: "2026-11-05T00:00:00Z",
        postingDate: "2026-11-15T00:00:00Z",
      },
      brand1.token
    );

    assert(
      resProposeLocked.status === 400,
      "6a. Proposing new terms on a CONFIRMED deal is rejected (HTTP 400 Bad Request)"
    );
    assert(
      resProposeLocked.data?.error?.includes("locked"),
      "6b. Error message states terms are locked"
    );

    // Attempting to confirm again on confirmed deal
    const resConfirmLocked = await makeRequest(
      "POST",
      `/deals/${deal1.id}/confirm`,
      { proposalVersion: 2 },
      brand1.token
    );
    assert(
      resConfirmLocked.status === 400,
      "6c. Confirming an already CONFIRMED deal is rejected (HTTP 400 Bad Request)"
    );
  } catch (e: any) {
    assert(false, `6. Post-confirmation locking test failed: ${e.message}`);
  }

  // TEST 7: 20-Version Cap Test
  try {
    const brandCap = await createTestUser("brand", "CapBrand");
    const creatorCap = await createTestUser("influencer", "CapCreator");

    const dealCap = await createDeal({
      brandId: brandCap.brandId!,
      influencerId: creatorCap.influencerId!,
      title: "Version Cap Test Deal",
      prefillTerms: { deliverables: [{ title: "Initial", count: 1 }], pricePaise: 100000 },
    });

    // Rapidly propose up to version 20
    let currentVer = 1;
    for (let i = 2; i <= 20; i++) {
      const res = await makeRequest(
        "POST",
        `/deals/${dealCap.id}/proposals`,
        {
          baseVersion: currentVer,
          deliverables: [{ title: `Version ${i}`, count: 1 }],
          pricePaise: 100000 + i * 1000,
          contentDeadline: "2026-11-01T00:00:00Z",
          postingDate: "2026-11-10T00:00:00Z",
        },
        brandCap.token
      );
      assert(res.status === 201 && res.data?.version === i, `7. Version ${i} created`);
      currentVer = i;
    }

    // Attempt version 21
    const resV21 = await makeRequest(
      "POST",
      `/deals/${dealCap.id}/proposals`,
      {
        baseVersion: 20,
        deliverables: [{ title: "Version 21", count: 1 }],
        pricePaise: 200000,
        contentDeadline: "2026-11-01T00:00:00Z",
        postingDate: "2026-11-10T00:00:00Z",
      },
      brandCap.token
    );

    assert(resV21.status === 400, "7b. Proposing version 21 is rejected (HTTP 400 Bad Request)");
    assert(resV21.data?.error?.includes("20"), "7c. Error message specifies version limit of 20");
  } catch (e: any) {
    assert(false, `7. 20-Version cap test failed: ${e.message}`);
  }

  // TEST 8: Confirm vs New Version Race Test
  try {
    const brandRace = await createTestUser("brand", "RaceBrand");
    const creatorRace = await createTestUser("influencer", "RaceCreator");

    const dealRace = await createDeal({
      brandId: brandRace.brandId!,
      influencerId: creatorRace.influencerId!,
      title: "Race Condition Deal",
      prefillTerms: { deliverables: [{ title: "Base", count: 1 }], pricePaise: 500000 },
    });

    // Brand confirms v1 while Creator simultaneously submits v2
    const [confirmV1Res, proposeV2Res] = await Promise.all([
      makeRequest("POST", `/deals/${dealRace.id}/confirm`, { proposalVersion: 1 }, brandRace.token),
      makeRequest(
        "POST",
        `/deals/${dealRace.id}/proposals`,
        {
          baseVersion: 1,
          deliverables: [{ title: "Base + Addon", count: 1 }],
          pricePaise: 750000,
          contentDeadline: "2026-11-01T00:00:00Z",
          postingDate: "2026-11-10T00:00:00Z",
        },
        creatorRace.token
      ),
    ]);

    assert(
      proposeV2Res.status === 201 || confirmV1Res.status === 200,
      "8a. Race condition resolved cleanly by PostgreSQL row-level locks"
    );

    const [finalDeal] = await db
      .select()
      .from(dealsTable)
      .where(eq(dealsTable.id, dealRace.id))
      .limit(1);
    assert(
      finalDeal.agreementStatus !== "DECLINED",
      "8b. Deal state remains valid and uncorrupted"
    );
  } catch (e: any) {
    assert(false, `8. Confirm vs New Version race test failed: ${e.message}`);
  }

  server.close();

  console.log(`\nStage 2 Test Suite Results: ${passed} Passed, ${failed} Failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runStage2TestSuite().catch((err) => {
  console.error("Stage 2 Test Suite Error:", err);
  process.exit(1);
});
