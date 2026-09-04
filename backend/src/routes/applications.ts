import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { applicationsTable, campaignsTable, influencersTable, user as userTable } from "@workspace/db";
import { CreateApplicationBody, UpdateApplicationBody } from "@workspace/api-zod";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

async function formatApplication(a: typeof applicationsTable.$inferSelect) {
  const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, a.campaignId)).limit(1);
  const [influencer] = await db.select().from(influencersTable).where(eq(influencersTable.id, a.influencerId)).limit(1);
  const [user] = influencer ? await db.select().from(userTable).where(eq(userTable.id, String(influencer.userId))).limit(1) : [null];

  return {
    id: a.id,
    campaignId: a.campaignId,
    campaignTitle: campaign?.title ?? null,
    influencerId: a.influencerId,
    influencerName: user?.name ?? null,
    influencerAvatarUrl: influencer?.avatarUrl ?? null,
    status: a.status,
    message: a.message,
    createdAt: a.createdAt.toISOString(),
  };
}

router.get("/applications", async (req, res): Promise<void> => {
  const { campaignId, influencerId, status } = req.query as Record<string, string>;

  const conditions = [];
  if (campaignId) conditions.push(eq(applicationsTable.campaignId, parseInt(campaignId)));
  if (influencerId) conditions.push(eq(applicationsTable.influencerId, parseInt(influencerId)));
  if (status) conditions.push(eq(applicationsTable.status, status as "pending" | "accepted" | "rejected"));

  const rows = await db
    .select()
    .from(applicationsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(applicationsTable.createdAt);

  res.json(await Promise.all(rows.map(formatApplication)));
});

router.post("/applications", requireAuth, requireRole(["influencer"]), async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: string | number }).userId;
  const parsed = CreateApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [influencer] = await db.select().from(influencersTable).where(eq(influencersTable.userId, String(userId))).limit(1);
  if (!influencer) {
    res.status(403).json({ error: "Only influencers can apply" });
    return;
  }

  const [application] = await db
    .insert(applicationsTable)
    .values({ campaignId: parsed.data.campaignId, influencerId: influencer.id, message: parsed.data.message })
    .returning();

  res.status(201).json(await formatApplication(application));
});

router.patch("/applications/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const parsed = UpdateApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(applicationsTable)
    .set(parsed.data)
    .where(eq(applicationsTable.id, id))
    .returning();

  res.json(await formatApplication(updated));
});

export default router;
