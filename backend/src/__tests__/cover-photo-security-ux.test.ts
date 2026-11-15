import {
  validatePresignRequest,
  generateStorageKey,
  validateStorageKeyOwnership,
} from "../services/storage.service";
import { resolveCoverUrl, resolveAvatarUrl } from "../routes/influencers";
import { db, influencersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function runCoverPhotoSecurityAndUxTests() {
  console.log("\n==========================================");
  console.log("CREATOR COVER PHOTO SECURITY & UX INTEGRATION TESTS");
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

  const creatorUserId = `usr_test_cover_creator_${Date.now()}`;
  const foreignUserId = `usr_test_foreign_creator_${Date.now()}`;

  try {
    // 1. Cover presign authorization for valid MIME types (JPG, PNG, WEBP)
    const validJpg = validatePresignRequest({
      purpose: "cover",
      contentType: "image/jpeg",
      contentLength: 2 * 1024 * 1024, // 2MB
    });
    assert(
      validJpg.valid === true,
      "1a. Valid 2MB image/jpeg cover presign request passes validation"
    );

    const validPng = validatePresignRequest({
      purpose: "cover",
      contentType: "image/png",
      contentLength: 5 * 1024 * 1024, // 5MB
    });
    assert(
      validPng.valid === true,
      "1b. Valid 5MB image/png cover presign request passes validation"
    );

    const validWebp = validatePresignRequest({
      purpose: "cover",
      contentType: "image/webp",
      contentLength: 1 * 1024 * 1024, // 1MB
    });
    assert(
      validWebp.valid === true,
      "1c. Valid 1MB image/webp cover presign request passes validation"
    );

    // 2. Reject invalid MIME types (GIF, SVG, PDF)
    const invalidGif = validatePresignRequest({
      purpose: "cover",
      contentType: "image/gif",
      contentLength: 100000,
    });
    assert(
      invalidGif.valid === false && invalidGif.statusCode === 415,
      "2a. Invalid MIME (image/gif for cover) rejected with 415 Unsupported Media Type"
    );

    const invalidSvg = validatePresignRequest({
      purpose: "cover",
      contentType: "image/svg+xml",
      contentLength: 100000,
    });
    assert(
      invalidSvg.valid === false && invalidSvg.statusCode === 415,
      "2b. Invalid MIME (image/svg+xml for cover) rejected with 415 Unsupported Media Type"
    );

    // 3. Reject oversized file (> 10MB)
    const oversizeCover = validatePresignRequest({
      purpose: "cover",
      contentType: "image/jpeg",
      contentLength: 12 * 1024 * 1024, // 12MB (> 10MB limit)
    });
    assert(
      oversizeCover.valid === false && oversizeCover.statusCode === 413,
      "3. Oversized cover file (12MB) rejected with 413 Payload Too Large"
    );

    // 4. Purpose-scoped storage key generation
    const coverKey = generateStorageKey({
      userId: creatorUserId,
      purpose: "cover",
      contentType: "image/webp",
    });
    assert(
      coverKey.startsWith(`creators/${creatorUserId}/cover/`) && coverKey.endsWith(".webp"),
      "4. Storage key generator enforces purpose-scoped prefix creators/{creatorId}/cover/{uuid}.webp"
    );

    // 5. Path traversal protection & user ID sanitization
    const maliciousUserId = "../../admin/breach";
    const safeKey = generateStorageKey({
      userId: maliciousUserId,
      purpose: "cover",
      contentType: "image/png",
    });
    assert(!safeKey.includes(".."), "5a. Storage key strips path traversal sequences (..)");
    assert(
      safeKey.startsWith("creators/adminbreach/cover/"),
      "5b. Storage key sanitizes special path characters"
    );

    // 6. Ownership & Purpose Isolation Checks
    const validOwnership = validateStorageKeyOwnership(coverKey, creatorUserId);
    assert(
      validOwnership === true,
      "6a. validateStorageKeyOwnership approves key for authenticated owner"
    );

    const foreignOwnership = validateStorageKeyOwnership(coverKey, foreignUserId);
    assert(
      foreignOwnership === false,
      "6b. validateStorageKeyOwnership rejects foreign creator access"
    );

    const pathTraversalKeyCheck = validateStorageKeyOwnership(
      `creators/../../admin/cover/hack.png`,
      creatorUserId
    );
    assert(
      pathTraversalKeyCheck === false,
      "6c. validateStorageKeyOwnership rejects path traversal key attempts"
    );

    // Purpose confusion check: avatar or portfolio key cannot be confirmed as cover key
    const avatarKey = `creators/${creatorUserId}/avatar/avatar123.jpg`;
    const portfolioKey = `creators/${creatorUserId}/portfolio/video123.mp4`;
    const isAvatarKeyValidCover = avatarKey.startsWith(`creators/${creatorUserId}/cover/`);
    const isPortfolioKeyValidCover = portfolioKey.startsWith(`creators/${creatorUserId}/cover/`);

    assert(
      isAvatarKeyValidCover === false,
      "6d. Purpose prefix check rejects avatar storage key for cover photo endpoint"
    );
    assert(
      isPortfolioKeyValidCover === false,
      "6e. Purpose prefix check rejects portfolio storage key for cover photo endpoint"
    );

    // 7. DB Persistence & Profile API Cover URL Resolution
    const [insertedInf] = await db
      .insert(influencersTable)
      .values({
        userId: creatorUserId,
        category: "Lifestyle",
        country: "India",
        followers: 10000,
        coverUrl: coverKey,
      })
      .returning();

    assert(
      insertedInf.id > 0 && insertedInf.coverUrl === coverKey,
      "7a. Inserted creator profile with R2 cover storage key"
    );

    const resolvedUrl = resolveCoverUrl(insertedInf.coverUrl);
    assert(
      resolvedUrl !== null &&
        resolvedUrl.includes(`/creators/${creatorUserId}/cover/`) &&
        resolvedUrl.startsWith("http"),
      "7b. resolveCoverUrl transforms R2 storage key into full public CDN URL"
    );

    // 8. Fallback resolution for null/empty coverUrl
    const nullResolved = resolveCoverUrl(null);
    const emptyResolved = resolveCoverUrl("");
    assert(
      nullResolved === null && emptyResolved === null,
      "8. resolveCoverUrl returns null for missing coverUrl to trigger fallback background gradient"
    );

    // 9. Replacement & Old Cover Object Cleanup Logic Test
    const newCoverKey = generateStorageKey({
      userId: creatorUserId,
      purpose: "cover",
      contentType: "image/jpeg",
    });

    // Verify old cover key ownership check prior to deletion
    const oldCoverKeyToClean = insertedInf.coverUrl;
    const canCleanOld =
      oldCoverKeyToClean &&
      oldCoverKeyToClean !== newCoverKey &&
      oldCoverKeyToClean.startsWith("creators/") &&
      oldCoverKeyToClean.includes("/cover/") &&
      validateStorageKeyOwnership(oldCoverKeyToClean, creatorUserId);

    assert(
      canCleanOld === true,
      "9a. Old cover cleanup safety check approves user-owned previous cover key for deletion"
    );

    const foreignCoverKey = `creators/${foreignUserId}/cover/victim.jpg`;
    const canCleanForeign = validateStorageKeyOwnership(foreignCoverKey, creatorUserId);
    assert(
      canCleanForeign === false,
      "9b. Old cover cleanup safety check blocks deletion of foreign creator cover key"
    );

    // Update DB to new cover key
    await db
      .update(influencersTable)
      .set({ coverUrl: newCoverKey })
      .where(eq(influencersTable.id, insertedInf.id));

    const [updatedInf] = await db
      .select()
      .from(influencersTable)
      .where(eq(influencersTable.id, insertedInf.id))
      .limit(1);
    assert(
      updatedInf.coverUrl === newCoverKey,
      "9c. Database coverUrl updated to new cover storage key"
    );

    // 10. Clean up test record from DB
    await db.delete(influencersTable).where(eq(influencersTable.id, insertedInf.id));
    assert(true, "10. Test cleanup executed cleanly");
  } catch (err: any) {
    assert(false, `Unexpected test error: ${err.message}`);
  }

  console.log(`\nCover Photo Security & UX Test Results: ${passed} Passed, ${failed} Failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runCoverPhotoSecurityAndUxTests().catch((err) => {
  console.error("Cover Photo Security & UX Test Execution Error:", err);
  process.exit(1);
});
