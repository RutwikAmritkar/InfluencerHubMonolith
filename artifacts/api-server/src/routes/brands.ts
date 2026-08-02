import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { brandsTable, usersTable, campaignsTable, applicationsTable, influencersTable } from "@workspace/db";
import { UpdateBrandBody } from "@workspace/api-zod";
import { eq, count, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/brands", async (_req, res): Promise<void> => {
  const rows = await db
    .select({ brand: brandsTable })
    .from(brandsTable);

  const brandList = await Promise.all(rows.map(async r => {
    const [{ total }] = await db.select({ total: count() }).from(campaignsTable).where(eq(campaignsTable.brandId, r.brand.id));
    const [{ active }] = await db.select({ active: count() }).from(campaignsTable).where(and(eq(campaignsTable.brandId, r.brand.id), eq(campaignsTable.status, "active")));
    return {
      id: r.brand.id,
      userId: r.brand.userId,
      name: r.brand.name,
      industry: r.brand.industry,
      country: r.brand.country,
      description: r.brand.description,
      logoUrl: r.brand.logoUrl,
      website: r.brand.website,
      totalCampaigns: Number(total),
      activeInfluencers: Number(active),
    };
  }));

  res.json(brandList);
});

router.get("/brands/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [row] = await db.select().from(brandsTable).where(eq(brandsTable.id, id)).limit(1);
  if (!row) {
    res.status(404).json({ error: "Brand not found" });
    return;
  }

  const [{ total }] = await db.select({ total: count() }).from(campaignsTable).where(eq(campaignsTable.brandId, row.id));

  res.json({
    id: row.id,
    userId: row.userId,
    name: row.name,
    industry: row.industry,
    country: row.country,
    description: row.description,
    logoUrl: row.logoUrl,
    website: row.website,
    totalCampaigns: Number(total),
    activeInfluencers: 0,
  });
});

router.patch("/brands/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const parsed = UpdateBrandBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db.update(brandsTable).set(parsed.data).where(eq(brandsTable.id, id)).returning();

  res.json({
    id: updated.id,
    userId: updated.userId,
    name: updated.name,
    industry: updated.industry,
    country: updated.country,
    description: updated.description,
    logoUrl: updated.logoUrl,
    website: updated.website,
    totalCampaigns: 0,
    activeInfluencers: 0,
  });
});

export default router;
