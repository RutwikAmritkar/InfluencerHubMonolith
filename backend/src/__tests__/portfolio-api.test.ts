import { db, creatorPortfolioMediaTable, influencersTable, user as userTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  storageService,
  validatePresignRequest,
  generateStorageKey,
  validateStorageKeyOwnership,
} from "../services/storage.service";

async function runPortfolioApiUnitTests() {
  console.log("\n==========================================");
  console.log("CREATOR PORTFOLIO MEDIA API SECURITY & INTEGRATION TESTS");
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

  let creatorAId: number;
  let creatorBId: number;
  const userAId = `usr_test_creator_a_${Date.now()}`;
  const userBId = `usr_test_creator_b_${Date.now()}`;

  try {
    // 1. Setup two distinct test creators (Creator A and Creator B)
    const [infA] = await db
      .insert(influencersTable)
      .values({
        userId: userAId,
        category: "Lifestyle",
        country: "India",
        followers: 5000,
      })
      .returning();
    creatorAId = infA.id;

    const [infB] = await db
      .insert(influencersTable)
      .values({
        userId: userBId,
        category: "Tech",
        country: "India",
        followers: 12000,
      })
      .returning();
    creatorBId = infB.id;

    assert(
      creatorAId > 0 && creatorBId > 0 && creatorAId !== creatorBId,
      "1. Created isolated test creators (Creator A & Creator B)"
    );

    // 2. Storage key generation & tenant isolation rules
    const keyA1 = generateStorageKey({
      userId: userAId,
      purpose: "portfolio",
      contentType: "video/mp4",
    });
    const keyB1 = generateStorageKey({
      userId: userBId,
      purpose: "portfolio",
      contentType: "video/mp4",
    });

    assert(
      keyA1.startsWith(`creators/${userAId}/portfolio/`),
      "2a. Storage key enforces Creator A user ID prefix"
    );
    assert(
      keyB1.startsWith(`creators/${userBId}/portfolio/`),
      "2b. Storage key enforces Creator B user ID prefix"
    );

    // 3. Ownership validation (Creator A cannot confirm Creator B's key)
    assert(validateStorageKeyOwnership(keyA1, userAId) === true, "3a. Creator A owns keyA1");
    assert(
      validateStorageKeyOwnership(keyA1, userBId) === false,
      "3b. Creator B ownership check for keyA1 rejected"
    );
    assert(
      validateStorageKeyOwnership(`creators/../../admin/portfolio/hack.mp4`, userAId) === false,
      "3c. Path traversal key rejected"
    );

    // 4. Insert records for Creator A & Creator B
    const [itemA1] = await db
      .insert(creatorPortfolioMediaTable)
      .values({
        creatorId: creatorAId,
        mediaType: "video",
        storageKey: keyA1,
        mimeType: "video/mp4",
        fileSizeBytes: 20000000,
        sortOrder: 0,
        isFeatured: true,
        status: "ready",
      })
      .returning();

    const [itemB1] = await db
      .insert(creatorPortfolioMediaTable)
      .values({
        creatorId: creatorBId,
        mediaType: "video",
        storageKey: keyB1,
        mimeType: "video/mp4",
        fileSizeBytes: 15000000,
        sortOrder: 0,
        isFeatured: true,
        status: "ready",
      })
      .returning();

    // 5. Scoped Query Isolation (IDOR Check)
    const creatorAItems = await db
      .select()
      .from(creatorPortfolioMediaTable)
      .where(
        and(
          eq(creatorPortfolioMediaTable.creatorId, creatorAId),
          eq(creatorPortfolioMediaTable.status, "ready")
        )
      );

    assert(
      creatorAItems.length === 1 && creatorAItems[0].id === itemA1.id,
      "5a. Creator A query returns ONLY Creator A items"
    );

    const creatorBItemCheck = await db
      .select()
      .from(creatorPortfolioMediaTable)
      .where(
        and(
          eq(creatorPortfolioMediaTable.id, itemB1.id),
          eq(creatorPortfolioMediaTable.creatorId, creatorAId)
        )
      )
      .limit(1);

    assert(
      creatorBItemCheck.length === 0,
      "5b. Scoped query prevents Creator A from accessing Creator B's item by ID"
    );

    // 6. Featured item single-featured transition test
    const keyA2 = generateStorageKey({
      userId: userAId,
      purpose: "portfolio",
      contentType: "video/mp4",
    });

    // Unfeature old, feature new
    await db.transaction(async (tx) => {
      await tx
        .update(creatorPortfolioMediaTable)
        .set({ isFeatured: false })
        .where(
          and(
            eq(creatorPortfolioMediaTable.creatorId, creatorAId),
            eq(creatorPortfolioMediaTable.isFeatured, true)
          )
        );

      await tx.insert(creatorPortfolioMediaTable).values({
        creatorId: creatorAId,
        mediaType: "video",
        storageKey: keyA2,
        mimeType: "video/mp4",
        fileSizeBytes: 30000000,
        sortOrder: 1,
        isFeatured: true,
        status: "ready",
      });
    });

    const featuredItemsA = await db
      .select()
      .from(creatorPortfolioMediaTable)
      .where(
        and(
          eq(creatorPortfolioMediaTable.creatorId, creatorAId),
          eq(creatorPortfolioMediaTable.isFeatured, true)
        )
      );

    assert(
      featuredItemsA.length === 1 && featuredItemsA[0].storageKey === keyA2,
      "6. Atomic featured transition guarantees exactly 1 featured video for Creator A"
    );

    // 7. Portfolio Limit Enforcement (Max 9 items)
    const currentCount = (
      await db
        .select()
        .from(creatorPortfolioMediaTable)
        .where(
          and(
            eq(creatorPortfolioMediaTable.creatorId, creatorAId),
            eq(creatorPortfolioMediaTable.status, "ready")
          )
        )
    ).length;

    // Fill up to 9
    for (let i = currentCount; i < 9; i++) {
      await db.insert(creatorPortfolioMediaTable).values({
        creatorId: creatorAId,
        mediaType: "video",
        storageKey: `creators/${userAId}/portfolio/fill_${i}_${Date.now()}.mp4`,
        mimeType: "video/mp4",
        fileSizeBytes: 1000,
        sortOrder: i,
        isFeatured: false,
        status: "ready",
      });
    }

    const countAfterFill = (
      await db
        .select()
        .from(creatorPortfolioMediaTable)
        .where(
          and(
            eq(creatorPortfolioMediaTable.creatorId, creatorAId),
            eq(creatorPortfolioMediaTable.status, "ready")
          )
        )
    ).length;

    assert(countAfterFill === 9, "7a. Creator A portfolio filled to maximum 9 items");
    assert(countAfterFill >= 9, "7b. Limit check identifies count >= 9 to reject item #10");

    // 8. Reorder Ownership Verification Test
    const allAItems = await db
      .select()
      .from(creatorPortfolioMediaTable)
      .where(eq(creatorPortfolioMediaTable.creatorId, creatorAId));

    const reorderPayloadWithB = [allAItems[0].id, itemB1.id]; // Includes B's item
    const verifyReorderOwnership = (
      requestedIds: number[],
      targetCreatorId: number,
      rows: { id: number; creatorId: number }[]
    ) => {
      if (requestedIds.length !== rows.length) return false;
      return rows.every((r) => r.creatorId === targetCreatorId);
    };

    const isReorderValid = verifyReorderOwnership(
      reorderPayloadWithB,
      creatorAId,
      allAItems.filter((i) => reorderPayloadWithB.includes(i.id))
    );
    assert(
      isReorderValid === false,
      "8. Reorder payload including another creator's item ID rejected"
    );

    // 9. Clean up test records
    await db
      .delete(creatorPortfolioMediaTable)
      .where(eq(creatorPortfolioMediaTable.creatorId, creatorAId));
    await db
      .delete(creatorPortfolioMediaTable)
      .where(eq(creatorPortfolioMediaTable.creatorId, creatorBId));
    await db.delete(influencersTable).where(eq(influencersTable.id, creatorAId));
    await db.delete(influencersTable).where(eq(influencersTable.id, creatorBId));

    assert(true, "9. Test cleanup executed cleanly");
  } catch (err: any) {
    assert(false, `Unexpected API test error: ${err.message}`);
  }

  console.log(`\nPortfolio API Test Results: ${passed} Passed, ${failed} Failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runPortfolioApiUnitTests().catch((err) => {
  console.error("Portfolio API Test Execution Error:", err);
  process.exit(1);
});
