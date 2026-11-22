import { db, platformActivityEventsTable, user as userTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

export interface LogPlatformActivityInput {
  actorUserId?: string | null;
  actorParty?: "creator" | "brand" | "admin" | "system";
  eventType: string;
  entityType: string;
  entityId: string | number;
  summary: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
}

export async function logPlatformActivity(input: LogPlatformActivityInput): Promise<void> {
  try {
    let party = input.actorParty;
    if (!party && input.actorUserId) {
      const [u] = await db
        .select({ role: userTable.role })
        .from(userTable)
        .where(eq(userTable.id, input.actorUserId))
        .limit(1);
      if (u) {
        party = u.role === "brand" ? "brand" : "creator";
      }
    }

    await db.insert(platformActivityEventsTable).values({
      actorUserId: input.actorUserId || null,
      actorParty: party || "system",
      eventType: input.eventType,
      entityType: input.entityType,
      entityId: String(input.entityId),
      summary: input.summary,
      metadata: input.metadata || null,
      createdAt: input.createdAt || new Date(),
    });
  } catch (error) {
    logger.error({ error, input }, "[PLATFORM ACTIVITY LOG ERROR]");
  }
}
