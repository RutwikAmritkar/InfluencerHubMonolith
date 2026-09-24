import { socialSyncService } from "../services/social-sync.service";
import { db, influencersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Triggering social sync for account 4...");
  const res = await socialSyncService.syncSocialAccount(4);
  console.log("Sync Result:", res);

  const [inf] = await db.select().from(influencersTable).where(eq(influencersTable.userId, "UZ1OzZciqahygHYGRSv5G1jJoeVp49TZ")).limit(1);
  console.log("Updated Influencer Record:");
  console.log({
    id: inf.id,
    userId: inf.userId,
    followers: inf.followers,
    avgViews: inf.avgViews,
    engagementRate: inf.engagementRate,
  });

  process.exit(0);
}

main().catch(err => {
  console.error("Sync error:", err);
  process.exit(1);
});
