import { db, creatorPortfolioMediaTable, influencersTable, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

async function runPortfolioSchemaUnitTests() {
  console.log("\n==========================================");
  console.log("CREATOR PORTFOLIO MEDIA SCHEMA INTEGRATION TESTS");
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

  let testCreatorId: number | null = null;
  let testUserId = `user_test_portfolio_${Date.now()}`;

  try {
    // 1. Fetch or create a test influencer creator
    const [existingInf] = await db.select().from(influencersTable).limit(1);
    if (existingInf) {
      testCreatorId = existingInf.id;
    } else {
      const [newInf] = await db
        .insert(influencersTable)
        .values({
          userId: testUserId,
          category: "Test Category",
          country: "India",
          followers: 1000,
        })
        .returning();
      testCreatorId = newInf.id;
    }

    assert(
      typeof testCreatorId === "number" && testCreatorId > 0,
      "1. Creator entity identified for foreign key binding"
    );

    // 2. Insert valid portfolio media record (Video 1)
    const testStorageKey1 = `creators/${testCreatorId}/portfolio/test_vid_1_${Date.now()}.mp4`;
    const [item1] = await db
      .insert(creatorPortfolioMediaTable)
      .values({
        creatorId: testCreatorId,
        mediaType: "video",
        storageKey: testStorageKey1,
        mimeType: "video/mp4",
        fileSizeBytes: 25000000,
        durationSeconds: 45,
        width: 1080,
        height: 1920,
        sortOrder: 0,
        isFeatured: true,
        status: "ready",
      })
      .returning();

    assert(
      Boolean(item1 && item1.id),
      "2a. Inserted creator_portfolio_media record returns auto-incremented primary key"
    );
    assert(item1.storageKey === testStorageKey1, "2b. Storage key stored accurately");
    assert(item1.isFeatured === true, "2c. Featured status set to true");

    // 3. Nullable thumbnail & dimensions behavior (Video 2)
    const testStorageKey2 = `creators/${testCreatorId}/portfolio/test_vid_2_${Date.now()}.mp4`;
    const [item2] = await db
      .insert(creatorPortfolioMediaTable)
      .values({
        creatorId: testCreatorId,
        mediaType: "video",
        storageKey: testStorageKey2,
        mimeType: "video/mp4",
        fileSizeBytes: 15000000,
        thumbnailStorageKey: null,
        durationSeconds: null,
        width: null,
        height: null,
        sortOrder: 1,
        isFeatured: false,
        status: "pending",
      })
      .returning();

    assert(item2.thumbnailStorageKey === null, "3a. thumbnailStorageKey allows null");
    assert(
      item2.durationSeconds === null && item2.width === null,
      "3b. durationSeconds/width/height allow null during pending upload"
    );
    assert(item2.isFeatured === false, "3c. Non-featured items store isFeatured = false");

    // 4. Multiple portfolio items for a single creator query test
    const items = await db
      .select()
      .from(creatorPortfolioMediaTable)
      .where(eq(creatorPortfolioMediaTable.creatorId, testCreatorId))
      .orderBy(creatorPortfolioMediaTable.sortOrder);

    assert(
      items.length >= 2,
      "4. Multiple portfolio media records returned for creator ordered by sortOrder"
    );

    // 5. Unique constraint on storageKey enforcement
    let duplicateRejected = false;
    try {
      await db.insert(creatorPortfolioMediaTable).values({
        creatorId: testCreatorId,
        mediaType: "video",
        storageKey: testStorageKey1, // Duplicate key
        mimeType: "video/mp4",
        fileSizeBytes: 1000,
      });
    } catch (_err) {
      duplicateRejected = true;
    }
    assert(duplicateRejected === true, "5. Duplicate storageKey rejected by UNIQUE constraint");

    // 6. Partial unique index enforcement for at-most-one-featured video per creator
    let duplicateFeaturedRejected = false;
    try {
      await db.insert(creatorPortfolioMediaTable).values({
        creatorId: testCreatorId,
        mediaType: "video",
        storageKey: `creators/${testCreatorId}/portfolio/test_vid_3_${Date.now()}.mp4`,
        mimeType: "video/mp4",
        fileSizeBytes: 1000,
        isFeatured: true, // Second featured item for same creator!
      });
    } catch (_err) {
      duplicateFeaturedRejected = true;
    }
    assert(
      duplicateFeaturedRejected === true,
      "6. Second featured video for same creator rejected by partial unique index idx_creator_portfolio_featured_unique"
    );

    // 7. Legacy influencers.portfolio array remains intact
    const [infCheck] = await db
      .select()
      .from(influencersTable)
      .where(eq(influencersTable.id, testCreatorId))
      .limit(1);
    assert(
      Array.isArray(infCheck?.portfolio),
      "7. Legacy influencers.portfolio text[] array remains intact and untouched"
    );

    // 8. Clean up test records
    await db.delete(creatorPortfolioMediaTable).where(eq(creatorPortfolioMediaTable.id, item1.id));
    await db.delete(creatorPortfolioMediaTable).where(eq(creatorPortfolioMediaTable.id, item2.id));
    assert(true, "8. Test cleanup executed cleanly");
  } catch (err: any) {
    assert(false, `Unexpected schema test error: ${err.message}`);
  }

  console.log(`\nPortfolio Schema Test Results: ${passed} Passed, ${failed} Failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runPortfolioSchemaUnitTests().catch((err) => {
  console.error("Portfolio Schema Test Execution Error:", err);
  process.exit(1);
});
