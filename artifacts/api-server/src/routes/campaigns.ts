import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { campaignsTable, brandsTable, applicationsTable } from "@workspace/db";
import { CreateCampaignBody, UpdateCampaignBody } from "@workspace/api-zod";
import { eq, and, count } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

async function formatCampaign(c: typeof campaignsTable.$inferSelect) {
  const brand = await db.select().from(brandsTable).where(eq(brandsTable.id, c.brandId)).limit(1);
  const [{ total }] = await db.select({ total: count() }).from(applicationsTable).where(eq(applicationsTable.campaignId, c.id));
  return {
    id: c.id,
    brandId: c.brandId,
    brandName: brand[0]?.name ?? "Unknown Brand",
    brandLogoUrl: brand[0]?.logoUrl ?? null,
    title: c.title,
    description: c.description,
    budget: c.budget,
    platform: c.platform,
    status: c.status,
    deliverables: c.deliverables,
    targetAudience: c.targetAudience,
    timeline: c.timeline,
    deadline: c.deadline,
    applicationsCount: Number(total),
    createdAt: c.createdAt.toISOString(),
  };
}

router.get("/campaigns", async (req, res): Promise<void> => {
  const { platform, status, brandId } = req.query as Record<string, string>;

  const conditions = [];
  if (platform) conditions.push(eq(campaignsTable.platform, platform));
  if (status) conditions.push(eq(campaignsTable.status, status as "draft" | "active" | "completed" | "paused"));
  if (brandId) conditions.push(eq(campaignsTable.brandId, parseInt(brandId)));

  const rows = await db
    .select()
    .from(campaignsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(campaignsTable.createdAt);

  const result = await Promise.all(rows.map(formatCampaign));
  res.json(result);
});

router.post("/campaigns", requireAuth, requireRole(["brand"]), async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: string | number }).userId;
  const parsed = CreateCampaignBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [brand] = await db.select().from(brandsTable).where(eq(brandsTable.userId, String(userId))).limit(1);
  if (!brand) {
    res.status(403).json({ error: "Only brands can create campaigns" });
    return;
  }

  const [campaign] = await db
    .insert(campaignsTable)
    .values({ ...parsed.data, brandId: brand.id })
    .returning();

  res.status(201).json(await formatCampaign(campaign));
});

router.get("/campaigns/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, id)).limit(1);
  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }
  res.json(await formatCampaign(campaign));
});

router.patch("/campaigns/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const parsed = UpdateCampaignBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(campaignsTable)
    .set(parsed.data)
    .where(eq(campaignsTable.id, id))
    .returning();

  res.json(await formatCampaign(updated));
});

router.delete("/campaigns/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(campaignsTable).where(eq(campaignsTable.id, id));
  res.status(204).send();
});

export default router;
