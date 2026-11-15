import {
  R2StorageProvider,
  validatePresignRequest,
  generateStorageKey,
  validateStorageKeyOwnership,
  storageService,
} from "../services/storage.service";
import crypto from "node:crypto";

async function runStorageFoundationUnitTests() {
  console.log("\n==========================================");
  console.log("STORAGE ABSTRACTION & PRESIGNED UPLOAD FOUNDATION TESTS");
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

  // 1. Missing storage configuration fails safely on operation invoke (does not crash process on import)
  try {
    const unconfiguredProvider = new R2StorageProvider({
      endpoint: undefined,
      bucket: undefined,
      accessKeyId: undefined,
      secretAccessKey: undefined,
    });

    // Importing/instantiating didn't throw. Invoking createPresignedUpload should throw clean error.
    let errorCaught = false;
    try {
      await unconfiguredProvider.createPresignedUpload({
        storageKey: "test/key.mp4",
        contentType: "video/mp4",
      });
    } catch (err: any) {
      errorCaught = true;
      assert(
        err.message.includes("Storage credentials or bucket endpoint are not configured"),
        "1. Missing storage config throws safe error when invoked"
      );
    }
    if (!errorCaught) {
      assert(false, "1. Missing storage config failed to throw error when invoked");
    }
  } catch (err: any) {
    assert(false, `1. Exception during unconfigured provider test: ${err.message}`);
  }

  // 2. Presigned request validation - Valid portfolio request
  const validPortfolio = validatePresignRequest({
    purpose: "portfolio",
    contentType: "video/mp4",
    contentLength: 50 * 1024 * 1024, // 50MB
  });
  assert(
    validPortfolio.valid === true,
    "2. Valid 50MB video/mp4 portfolio presign request passes validation"
  );

  // 3. Invalid purpose rejected (400)
  const invalidPurpose = validatePresignRequest({
    purpose: "invalid_purpose" as any,
    contentType: "video/mp4",
    contentLength: 10 * 1024 * 1024,
  });
  assert(
    invalidPurpose.valid === false && invalidPurpose.statusCode === 400,
    "3. Invalid purpose rejected with 400 Bad Request"
  );

  // 4. Unsupported MIME type rejected (415)
  const unsupportedMime = validatePresignRequest({
    purpose: "portfolio",
    contentType: "image/gif", // Not allowed for portfolio videos
    contentLength: 5 * 1024 * 1024,
  });
  assert(
    unsupportedMime.valid === false && unsupportedMime.statusCode === 415,
    "4. Unsupported MIME type (image/gif for portfolio) rejected with 415"
  );

  // 5. File larger than 100MB rejected (413)
  const oversizePortfolio = validatePresignRequest({
    purpose: "portfolio",
    contentType: "video/mp4",
    contentLength: 105 * 1024 * 1024, // 105MB (> 100MB)
  });
  assert(
    oversizePortfolio.valid === false && oversizePortfolio.statusCode === 413,
    "5. File larger than 100MB (105MB) rejected with 413 Payload Too Large"
  );

  // 6. Valid avatar request & avatar 10MB limit check
  const validAvatar = validatePresignRequest({
    purpose: "avatar",
    contentType: "image/png",
    contentLength: 5 * 1024 * 1024,
  });
  assert(validAvatar.valid === true, "6a. Valid avatar request passes validation");

  const oversizeAvatar = validatePresignRequest({
    purpose: "avatar",
    contentType: "image/png",
    contentLength: 12 * 1024 * 1024, // 12MB (> 10MB)
  });
  assert(
    oversizeAvatar.valid === false && oversizeAvatar.statusCode === 413,
    "6b. Avatar larger than 10MB rejected with 413"
  );

  // 7. Object key uses authenticated session user ID (tenant isolation)
  const sessionUserId = "usr_12345_prod";
  const key = generateStorageKey({
    userId: sessionUserId,
    purpose: "portfolio",
    contentType: "video/mp4",
  });
  assert(
    key.startsWith(`creators/${sessionUserId}/portfolio/`),
    "7. Generated key enforces tenant isolation with session userId"
  );

  // 8. Generated key uses UUID/random identifier and correct extension
  assert(key.endsWith(".mp4"), "8a. Storage key derives correct .mp4 extension from video/mp4");
  const uuidPart = key.replace(`creators/${sessionUserId}/portfolio/`, "").replace(".mp4", "");
  assert(uuidPart.length >= 10, "8b. Storage key incorporates random UUID/unique identifier");

  // 9. Path traversal protection & user ID sanitization
  const maliciousUserId = "../../admin/hacked";
  const safeKey = generateStorageKey({
    userId: maliciousUserId,
    purpose: "portfolio",
    contentType: "video/mp4",
  });
  assert(
    !safeKey.includes(".."),
    "9a. Storage key generator strips path traversal attempts (..) from userId"
  );
  assert(
    safeKey.startsWith("creators/adminhacked/portfolio/"),
    "9b. Storage key generator sanitizes special path characters"
  );

  // 10. Storage key ownership validation
  const validOwnership = validateStorageKeyOwnership(
    `creators/${sessionUserId}/portfolio/file.mp4`,
    sessionUserId
  );
  assert(
    validOwnership === true,
    "10a. validateStorageKeyOwnership confirms match for authenticated creator"
  );

  const invalidOwnership = validateStorageKeyOwnership(
    `creators/other_user/portfolio/file.mp4`,
    sessionUserId
  );
  assert(
    invalidOwnership === false,
    "10b. validateStorageKeyOwnership denies cross-tenant access for foreign key"
  );

  const pathTraversalKeyCheck = validateStorageKeyOwnership(
    `creators/../../admin/portfolio/file.mp4`,
    sessionUserId
  );
  assert(
    pathTraversalKeyCheck === false,
    "10c. validateStorageKeyOwnership denies path traversal attempts"
  );

  // 11. Public Media URL Resolver abstraction
  const mockStorageService = new R2StorageProvider({
    publicBaseUrl: "https://cdn.creatorsbrand.io",
  });
  const resolvedUrl = mockStorageService.getObjectUrl("creators/usr_99/portfolio/vid_1.mp4");
  assert(
    resolvedUrl === "https://cdn.creatorsbrand.io/creators/usr_99/portfolio/vid_1.mp4",
    "11. Public URL resolver constructs CDN URL from storage key"
  );

  // 12. Storage abstraction does not expose raw credentials in methods
  const exposedKeys = Object.keys(storageService);
  assert(
    !exposedKeys.includes("accessKeyId") && !exposedKeys.includes("secretAccessKey"),
    "12. Storage abstraction interface does not expose credentials"
  );

  console.log(`\nStorage Foundation Test Results: ${passed} Passed, ${failed} Failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runStorageFoundationUnitTests().catch((err) => {
  console.error("Storage Foundation Test Execution Error:", err);
  process.exit(1);
});
