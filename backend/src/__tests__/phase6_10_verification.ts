import { db, user as userTable, socialAccountsTable, socialTokensTable, socialMetricSnapshotsTable, socialMediaInsightsTable, socialContentTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { decryptSocialToken } from "../integrations/social/token-crypto";
import { instagramDataPipelineService } from "../services/instagram-data-pipeline.service";

async function main() {
  const userId = "UZ1OzZciqahygHYGRSv5G1jJoeVp49TZ";

  console.log("=== PHASE 6: TOKEN SECURITY VERIFICATION ===");
  const [acc] = await db.select().from(socialAccountsTable).where(eq(socialAccountsTable.userId, userId)).limit(1);

  if (!acc) {
    console.error("No social_account found for Rutwik creator!");
    process.exit(1);
  }

  console.log("Connected Social Account Record:");
  console.log({
    id: acc.id,
    userId: acc.userId,
    platform: acc.platform,
    username: acc.username,
    externalAccountId: acc.externalAccountId,
    verificationStatus: acc.verificationStatus,
    isOfficialOAuth: acc.isOfficialOAuth,
  });

  const [tokenRecord] = await db.select().from(socialTokensTable).where(eq(socialTokensTable.socialAccountId, acc.id)).limit(1);

  if (!tokenRecord) {
    console.error("No social_token found for social account!");
    process.exit(1);
  }

  console.log("\nSocial Token Record (Sanitized):");
  console.log({
    id: tokenRecord.id,
    socialAccountId: tokenRecord.socialAccountId,
    accessTokenEncrypted: tokenRecord.accessTokenEncrypted ? "[ENCRYPTED_AES_256_GCM_STRING]" : null,
    hasIv: Boolean(tokenRecord.tokenIv),
    hasAuthTag: Boolean(tokenRecord.tokenAuthTag),
    expiresAt: tokenRecord.expiresAt,
    scopes: tokenRecord.scopes,
  });

  // Decrypt token in-memory to verify encryption integrity
  const decryptedToken = decryptSocialToken(tokenRecord.accessTokenEncrypted, tokenRecord.tokenIv, tokenRecord.tokenAuthTag);
  console.log("Decryption Successful:", decryptedToken ? "YES (Valid Token String)" : "NO");

  if (!decryptedToken || !tokenRecord.tokenIv || !tokenRecord.tokenAuthTag) {
    console.error("AES-256-GCM token security check failed!");
    process.exit(1);
  }

  console.log("\n=== PHASE 7, 8, 9, 10: INSTAGRAM DATA PIPELINE RETRIEVAL & PERSISTENCE ===");

  const pipelineResult = await instagramDataPipelineService.runPipelineForAccount(acc.id);
  console.log("\nPipeline Execution Result:");
  console.log(JSON.stringify(pipelineResult, null, 2));

  // Query persisted insights in social_media_insights table
  const insightsRows = await db.select().from(socialMediaInsightsTable).where(eq(socialMediaInsightsTable.socialAccountId, acc.id));
  console.log("\nPersisted social_media_insights rows count:", insightsRows.length);
  console.log(insightsRows);

  // Query snapshots in social_metric_snapshots
  const snapshotRows = await db.select().from(socialMetricSnapshotsTable).where(eq(socialMetricSnapshotsTable.socialAccountId, acc.id));
  console.log("\nPersisted social_metric_snapshots rows count:", snapshotRows.length);
  console.log(snapshotRows);

  console.log("\n=== PHASES 6-10 VERIFICATION COMPLETED CLEANLY! ===");
  process.exit(0);
}

main().catch(err => {
  console.error("Error in phase6_10 script:", err);
  process.exit(1);
});
