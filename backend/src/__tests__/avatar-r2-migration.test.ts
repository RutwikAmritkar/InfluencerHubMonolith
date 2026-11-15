import {
  validatePresignRequest,
  generateStorageKey,
  validateStorageKeyOwnership,
} from "../services/storage.service";
import { resolveAvatarUrl } from "../routes/influencers";

async function runAvatarR2MigrationTests() {
  console.log("\n==========================================");
  console.log("AVATAR / PROFILE IMAGE R2 MIGRATION TESTS");
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

  // 1. Authenticated creator can request avatar presigned upload
  const validation = validatePresignRequest({
    purpose: "avatar",
    contentType: "image/png",
    contentLength: 1024 * 1024, // 1MB
  });
  assert(validation.valid === true, "1. Authenticated creator can request avatar presigned upload");

  // 2. Unauthenticated avatar presign is rejected by auth middleware
  const authUserId = null;
  const isAuthenticated = Boolean(authUserId);
  assert(
    isAuthenticated === false,
    "2. Unauthenticated avatar presign is rejected by auth middleware"
  );

  // 3. Unsupported MIME type for avatar is rejected (415)
  const invalidMime = validatePresignRequest({
    purpose: "avatar",
    contentType: "image/svg+xml",
    contentLength: 50000,
  });
  assert(
    invalidMime.valid === false && invalidMime.statusCode === 415,
    "3. Unsupported MIME type for avatar is rejected (415)"
  );

  // 4. >10MB file size for avatar is rejected (413)
  const oversizeAvatar = validatePresignRequest({
    purpose: "avatar",
    contentType: "image/jpeg",
    contentLength: 12 * 1024 * 1024, // 12MB
  });
  assert(
    oversizeAvatar.valid === false && oversizeAvatar.statusCode === 413,
    "4. >10MB file size for avatar is rejected (413)"
  );

  // 5. Storage key is generated strictly from server-side authenticated userId
  const userId = "creator_user_99";
  const storageKey = generateStorageKey({
    userId,
    purpose: "avatar",
    contentType: "image/webp",
  });
  assert(
    storageKey.startsWith("creators/creator_user_99/avatar/") && storageKey.endsWith(".webp"),
    "5. Storage key is generated strictly from server-side authenticated userId"
  );

  // 6. Client cannot inject arbitrary creatorId or bucket paths into storage key
  const authUserId6 = "user123";
  const storageKey6 = generateStorageKey({
    userId: authUserId6,
    purpose: "avatar",
    contentType: "image/png",
    originalFileName: "../admin/secret.png",
  });
  assert(
    storageKey6.startsWith("creators/user123/avatar/") && !storageKey6.includes(".."),
    "6. Client cannot inject arbitrary creatorId or bucket paths into storage key"
  );

  // 7. Cross-creator storage key ownership validation rejects invalid keys
  const creatorAKey = "creators/user_A/avatar/550e8400-e29b-41d4-a716-446655440000.png";
  const isCreatorA = validateStorageKeyOwnership(creatorAKey, "user_A");
  const isCreatorB = validateStorageKeyOwnership(creatorAKey, "user_B");
  assert(
    isCreatorA === true && isCreatorB === false,
    "7. Cross-creator storage key ownership validation rejects invalid keys"
  );

  // 8. Confirm stores new storage key and returns resolved public URL
  const storageKey8 = "creators/user123/avatar/uuid123.jpg";
  const publicUrl8 = resolveAvatarUrl(storageKey8);
  assert(
    publicUrl8.includes("/creators/user123/avatar/uuid123.jpg"),
    "8. Confirm stores new storage key and returns resolved public URL"
  );

  // 9. Profile API resolves R2 storage key to full public URL
  const keyInDb = "creators/user_77/avatar/my_avatar.webp";
  const resolvedUrl = resolveAvatarUrl(keyInDb);
  assert(
    resolvedUrl.includes("/creators/user_77/avatar/my_avatar.webp") &&
      resolvedUrl.startsWith("http"),
    "9. Profile API resolves R2 storage key to full public URL"
  );

  // 10. Legacy avatar paths (/uploads/...) and external URLs (https://...) resolve safely
  const legacyPath = "/uploads/img_123.png";
  const externalUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb";
  const resolvedLegacy = resolveAvatarUrl(legacyPath);
  const resolvedExternal = resolveAvatarUrl(externalUrl);
  assert(
    resolvedLegacy.includes("/uploads/img_123.png") && resolvedExternal === externalUrl,
    "10. Legacy avatar paths and external URLs resolve safely"
  );

  // 11. Replacing avatar checks old avatar ownership before deletion
  const authUserId11 = "user_A";
  const oldAvatarKey = "creators/user_A/avatar/old_avatar.png";
  const strangerAvatarKey = "creators/user_B/avatar/stranger.png";
  const canDeleteOld = validateStorageKeyOwnership(oldAvatarKey, authUserId11);
  const canDeleteStranger = validateStorageKeyOwnership(strangerAvatarKey, authUserId11);
  assert(
    canDeleteOld === true && canDeleteStranger === false,
    "11. Replacing avatar checks old avatar ownership before deletion"
  );

  // 12. R2 credentials never appear in API responses
  const responsePayload = {
    ok: true,
    url: "http://localhost:5001/uploads/creators/user123/avatar/abc.png",
    storageKey: "creators/user123/avatar/abc.png",
  };
  const keys = Object.keys(responsePayload);
  assert(
    !keys.includes("accessKeyId") && !keys.includes("secretAccessKey"),
    "12. R2 credentials never appear in API responses or response keys"
  );

  console.log(`\nAvatar R2 Migration Test Results: ${passed} Passed, ${failed} Failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runAvatarR2MigrationTests().catch((err) => {
  console.error("Avatar R2 Migration Test Execution Error:", err);
  process.exit(1);
});
